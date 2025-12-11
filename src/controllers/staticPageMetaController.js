const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Clean and validate slug
const cleanSlug = (slug) => {
  return slug
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
};

// Ensure unique slug
const generateUniqueSlug = async (baseSlug) => {
  let slug = baseSlug;
  let counter = 1;

  while (await prisma.staticPageMeta.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  return slug;
};

// CREATE / UPDATE
const upsertMeta = async (req, res) => {
  try {
    const { id, metaTitle, metaDescription, metaKeywords, isActive, slug: inputSlug } = req.body;

    if (!metaTitle?.trim()) {
      return res.status(400).json({ error: 'metaTitle is required' });
    }

    let slug;

    if (id) {
      // === UPDATE: slug cannot be changed ===
      const existing = await prisma.staticPageMeta.findUnique({ where: { id: Number(id) } });
      if (!existing) return res.status(404).json({ error: 'Not found' });

      slug = existing.slug; // slug remains unchanged
    } else {
      // === CREATE: slug is REQUIRED ===
      if (!inputSlug?.trim()) {
        return res.status(400).json({ error: 'Slug is required when creating' });
      }

      const cleaned = cleanSlug(inputSlug);
      if (!cleaned) {
        return res.status(400).json({ error: 'Invalid slug: must contain letters, numbers, or hyphens' });
      }

      slug = await generateUniqueSlug(cleaned);
    }

    let result;

    if (id) {
      result = await prisma.staticPageMeta.update({
        where: { id: Number(id) },
        data: {
          slug,
          metaTitle,
          metaDescription: metaDescription ?? existing.metaDescription,
          metaKeywords: metaKeywords ?? existing.metaKeywords,
          isActive: isActive ?? existing.isActive,
        },
      });
      res.status(200).json({ message: 'Updated', data: result });
    } else {
      result = await prisma.staticPageMeta.create({
        data: {
          slug,
          metaTitle,
          metaDescription,
          metaKeywords,
          isActive: isActive ?? true,
        },
      });
      res.status(201).json({ message: 'Created', data: result });
    }
  } catch (e) {
    res.status(500).json({ error: 'Operation failed', details: e.message });
  }
};

// LIST (Admin)
const listMeta = async (req, res) => {
  try {
    const data = await prisma.staticPageMeta.findMany({
      select: {
        id: true,
        metaTitle: true,
        metaDescription: true,
        metaKeywords: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { updatedAt: 'desc' },
    });
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

// PUBLIC: Get by slug
const getMetaBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const meta = await prisma.staticPageMeta.findUnique({
      where: { slug, isActive: true },
      select: {
        metaTitle: true,
        metaDescription: true,
        metaKeywords: true,
      },
    });
    if (!meta) return res.status(404).json({ error: 'Not found' });
    res.json(meta);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

// DELETE
const deleteMeta = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.staticPageMeta.delete({ where: { id: Number(id) } });
    res.json({ message: 'Deleted' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

module.exports = { upsertMeta, listMeta, getMetaBySlug, deleteMeta };