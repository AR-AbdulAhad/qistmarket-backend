const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getAllCitesAreas = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', city = '' } = req.query;
    const skip = (page - 1) * limit;

    const where = {
      isActive: true,
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
        cityName: a.city.name,
        areaName: a.name,
        cityId: a.city.id,
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

const creaCitesAreas = async (req, res) => {
  const { cityName, areaName } = req.body;
  try {
    let city = await prisma.city.findUnique({ where: { name: cityName } });
    if (!city) {
      city = await prisma.city.create({
        data: {
          name: cityName,
          slugName: cityName.toLowerCase().replace(/\s+/g, '-')
        }
      });
    }

    const area = await prisma.area.create({
      data: {
        cityId: city.id,
        name: areaName,
        slugName: areaName.toLowerCase().replace(/\s+/g, '-')
      }
    });

    res.status(201).json({ cityName, areaName: area.name });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};


const bulkImportCitesAreas = async (req, res) => {
  const { data } = req.body;

  const results = { created: 0, skipped: 0, errors: [] };
  const cityMap = new Map();

  try {
    for (const item of data) {
      if (!item.cityName || !item.areaName) {
        results.skipped++;
        results.errors.push(`Missing city or area: ${JSON.stringify(item)}`);
        continue;
      }

      let city = cityMap.get(item.cityName);
      if (!city) {
        city = await prisma.city.findUnique({ where: { name: item.cityName } });
        if (!city) {
          city = await prisma.city.create({
            data: {
              name: item.cityName,
              slugName: item.cityName.toLowerCase().replace(/\s+/g, '-').replace(/-+/g, '-')
            }
          });
        }
        cityMap.set(item.cityName, city);
      }

      const exists = await prisma.area.findUnique({
        where: { cityId_name: { cityId: city.id, name: item.areaName } }
      });

      if (!exists) {
        await prisma.area.create({
          data: {
            cityId: city.id,
            name: item.areaName,
            slugName: item.areaName.toLowerCase().replace(/\s+/g, '-').replace(/-+/g, '-')
          }
        });
        results.created++;
      } else {
        results.skipped++;
      }
    }

    res.json(results);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteCitesAreas = async (req, res) => {
  const { ids } = req.body;
  await prisma.area.deleteMany({ where: { id: { in: ids } } });
  res.json({ message: 'Deleted successfully' });
};

const bulkDublicateCitesAreas = async (req, res) => {
  const { ids } = req.body;
  const areas = await prisma.area.findMany({
    where: { id: { in: ids } },
    include: { city: true }
  });

  const newAreas = areas.map(a => ({
    cityId: a.cityId,
    name: `${a.name} (Copy)`,
    slugName: `${a.slugName}-copy`,
    isActive: a.isActive
  }));

  await prisma.area.createMany({ data: newAreas });
  res.json({ message: 'Duplicated successfully' });
};

module.exports = {
  getAllCitesAreas,
  creaCitesAreas,
  bulkImportCitesAreas,
  deleteCitesAreas,
  bulkDublicateCitesAreas,
};