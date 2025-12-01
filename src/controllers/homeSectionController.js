const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getAll = async (req, res) => {
  try {
    const sections = await prisma.homeSection.findMany({
      orderBy: { position: 'asc' },
    });
    res.json({ data: sections, success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch sections' });
  }
};

const toggleActive = async (req, res) => {
  const { id } = req.params;
  try {
    const section = await prisma.homeSection.findUnique({ where: { id: Number(id) } });
    if (!section) return res.status(404).json({ error: 'Not found' });

    const updated = await prisma.homeSection.update({
      where: { id: Number(id) },
      data: { isActive: !section.isActive },
    });
    res.json({ data: updated, success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to toggle' });
  }
};

const reorder = async (req, res) => {
  const { items } = req.body;
  if (!Array.isArray(items)) return res.status(400).json({ error: 'Invalid items' });

  try {
    const ops = items.map(item =>
      prisma.homeSection.update({
        where: { id: Number(item.id) },
        data: { position: Number(item.position) },
      })
    );
    await prisma.$transaction(ops);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Reorder failed' });
  }
};

module.exports = { getAll, toggleActive, reorder };