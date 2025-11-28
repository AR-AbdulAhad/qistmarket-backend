// controllers/cityArea.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// === LIST AREAS WITH PAGINATION ===
const getAllCitesAreas = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', city = '' } = req.query;
    const skip = (page - 1) * limit;

    const where = {
      ...(search && { name: { contains: search } }),
      ...(city && { city: { name: { contains: city } } })
    };

    const [areas, total] = await Promise.all([
      prisma.area.findMany({
        where,
        skip: Number(skip),
        take: Number(limit),
        include: { city: { select: { id: true, name: true } } },
        orderBy: { id: 'desc' }
      }),
      prisma.area.count({ where })
    ]);

    res.json({
      data: areas.map(a => ({
        id: a.id,
        cityId: a.city.id,
        cityName: a.city.name,
        areaName: a.name,
        isActive: a.isActive
      })),
      pagination: {
        totalItems: total,
        totalPages: Math.ceil(total / limit),
        currentPage: Number(page),
        limit: Number(limit)
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// === CREATE SINGLE AREA ===
const creaCitesAreas = async (req, res) => {
  const { cityName, areaName } = req.body;
  try {
    let city = await prisma.city.findUnique({ where: { name: cityName } });
    if (!city) {
      city = await prisma.city.create({
        data: { name: cityName, slugName: cityName.toLowerCase().replace(/\s+/g, '-').replace(/-+/g, '-') }
      });
    }
    const area = await prisma.area.create({
      data: { cityId: city.id, name: areaName, slugName: areaName.toLowerCase().replace(/\s+/g, '-').replace(/-+/g, '-') }
    });
    res.status(201).json({ cityName, areaName: area.name });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// === BULK IMPORT WITH REAL-TIME PROGRESS ===
const sseBulkImport = async (req, res) => {
  const file = req.file;
  if (!file) return res.status(400).json({ message: 'CSV required' });

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': 'https://dashboard.qistmarket.pk',
    'Access-Control-Allow-Credentials': 'true'
  });

  const results = { created: 0, skipped: 0 };
  const cityMap = new Map();
  let processed = 0;

  const content = file.buffer.toString('utf8');
  const lines = content.split('\n').map(l => l.trim()).filter(Boolean);
  const totalLines = lines.length - 1;

  const sendProgress = () => {
    const percent = totalLines ? Math.round((processed / totalLines) * 100) : 0;
    res.write(`data: ${JSON.stringify({ progress: percent, created: results.created, skipped: results.skipped })}\n\n`);
  };

  for (let i = 1; i < lines.length; i++) {
    const [cityName, areaName] = lines[i].split(',').map(v => v.trim());
    processed++;

    if (!cityName || !areaName) {
      results.skipped++;
      sendProgress();
      continue;
    }

    let city = cityMap.get(cityName);
    if (!city) {
      city = await prisma.city.findUnique({ where: { name: cityName } });
      if (!city) {
        city = await prisma.city.create({
          data: { name: cityName, slugName: cityName.toLowerCase().replace(/\s+/g, '-').replace(/-+/g, '-') }
        });
      }
      cityMap.set(cityName, city);
    }

    const exists = await prisma.area.findUnique({
      where: { cityId_name: { cityId: city.id, name: areaName } }
    });

    if (!exists) {
      await prisma.area.create({
        data: { cityId: city.id, name: areaName, slugName: areaName.toLowerCase().replace(/\s+/g, '-').replace(/-+/g, '-'), isActive: true }
      });
      results.created++;
    } else {
      results.skipped++;
    }

    sendProgress();
  }

  res.write(`data: ${JSON.stringify({ done: true, ...results })}\n\n`);
  res.end();
};

// === BULK UPDATE AREAS (INSTANT with updateMany) ===
const bulkUpdateAreas = async (req, res) => {
  const { updates } = req.body;
  if (!updates || typeof updates !== 'object') {
    return res.status(400).json({ message: 'Invalid updates' });
  }

  try {
    const areaUpdates = {};
    const cityChanges = new Map(); // oldCityName → newCityName
    const areaToCityMap = new Map(); // areaId → newCityName

    // === STEP 1: Collect all changes ===
    for (const [id, data] of Object.entries(updates)) {
      const areaId = Number(id);

      if (data.name) {
        areaUpdates[areaId] = {
          name: data.name,
          slugName: data.name.toLowerCase().replace(/\s+/g, '-').replace(/-+/g, '-')
        };
      }

      if (data.isActive !== undefined) {
        areaUpdates[areaId] = areaUpdates[areaId] || {};
        areaUpdates[areaId].isActive = data.isActive;
      }

      if (data.cityName) {
        areaToCityMap.set(areaId, data.cityName);
      }
    }

    // === STEP 2: Update Areas (Name + Status) ===
    if (Object.keys(areaUpdates).length > 0) {
      await prisma.$transaction(
        Object.entries(areaUpdates).map(([id, data]) =>
          prisma.area.update({ where: { id: Number(id) }, data })
        )
      );
    }

    // === STEP 3: Handle City Changes (Create new city + update area.cityId) ===
    if (areaToCityMap.size > 0) {
      const areaIds = Array.from(areaToCityMap.keys());
      const areas = await prisma.area.findMany({
        where: { id: { in: areaIds } },
        include: { city: true }
      });

      const cityNameToId = new Map();

      for (const area of areas) {
        const newCityName = areaToCityMap.get(area.id);
        if (!newCityName || newCityName === area.city.name) continue;

        let cityId = cityNameToId.get(newCityName);
        if (!cityId) {
          let city = await prisma.city.findUnique({ where: { name: newCityName } });
          if (!city) {
            city = await prisma.city.create({
              data: {
                name: newCityName,
                slugName: newCityName.toLowerCase().replace(/\s+/g, '-').replace(/-+/g, '-')
              }
            });
          }
          cityId = city.id;
          cityNameToId.set(newCityName, cityId);
        }

        await prisma.area.update({
          where: { id: area.id },
          data: { cityId }
        });
      }
    }

    res.json({ message: 'Updated successfully' });
  } catch (error) {
    console.error("Update error:", error);
    res.status(500).json({ message: error.message });
  }
};

// === BULK UPDATE CITIES ===
const bulkUpdateCities = async (req, res) => {
  const { ids, isActive } = req.body;
  await prisma.city.updateMany({ where: { id: { in: ids } }, data: { isActive } });
  res.json({ message: 'Cities updated' });
};

// === BULK DELETE ===
const deleteCitesAreas = async (req, res) => {
  const { ids } = req.body;
  await prisma.area.deleteMany({ where: { id: { in: ids } } });
  res.json({ message: 'Deleted' });
};

// === BULK DUPLICATE ===
const bulkDublicateCitesAreas = async (req, res) => {
  const { ids } = req.body;
  const areas = await prisma.area.findMany({ where: { id: { in: ids } }, include: { city: true } });
  const newAreas = areas.map(a => ({
    cityId: a.cityId,
    name: `${a.name} (Copy)`,
    slugName: `${a.slugName}-copy`,
    isActive: a.isActive
  }));
  await prisma.area.createMany({ data: newAreas });
  res.json({ message: 'Duplicated' });
};

// === GET CITIES FOR DROPDOWN ===
const getCities = async (req, res) => {
  const cities = await prisma.city.findMany({ select: { id: true, name: true }, orderBy: { name: 'asc' } });
  res.json(cities);
};

const getPublicCitiesAreas = async (req, res) => {
  try {
    const areas = await prisma.area.findMany({
      where: {
        isActive: true,
        city: {
          isActive: true
        }
      },
      include: {
        city: {
          select: { name: true }
        }
      },
      orderBy: [
        { city: { name: 'asc' } },
        { name: 'asc' }
      ]
    });

    const result = areas.reduce((acc, area) => {
      const cityName = area.city.name;
      if (!acc[cityName]) acc[cityName] = [];
      acc[cityName].push(area.name);
      return acc;
    }, {});

    res.json(result);
  } catch (error) {
    console.error("getPublicCitiesAreas error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
  getAllCitesAreas,
  creaCitesAreas,
  sseBulkImport,
  bulkUpdateAreas,
  bulkUpdateCities,
  deleteCitesAreas,
  bulkDublicateCitesAreas,
  getCities,
  getPublicCitiesAreas
};