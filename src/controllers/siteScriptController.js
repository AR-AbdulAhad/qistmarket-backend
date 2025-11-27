const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const getAll = async (req, res) => {
  try {
    const scripts = await prisma.siteScript.findMany({
      orderBy: { id: 'asc' },
    });
    res.json(scripts);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to fetch scripts' });
  }
}


const create = async (req, res) => {
  const { location, script, enabled = true } = req.body;
  if (!['header', 'footer'].includes(location) || !script?.trim()) {
    return res.status(400).json({ error: 'Invalid data' });
  }
  try {
    const newScript = await prisma.siteScript.create({
      data: { location, script: script.trim(), enabled },
    });
    res.status(201).json(newScript);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to create script' });
  }
}

const update = async (req, res) => {
  const { id } = req.params;
  const { location, script, enabled } = req.body;
  if (!['header', 'footer'].includes(location) || !script?.trim()) {
    return res.status(400).json({ error: 'Invalid data' });
  }
  try {
    const updated = await prisma.siteScript.update({
      where: { id: Number(id) },
      data: { location, script: script.trim(), enabled },
    });
    res.json(updated);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to update script' });
  }
}

const remove = async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.siteScript.delete({ where: { id: Number(id) } });
    res.status(204).end();
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to delete script' });
  }
}

module.exports = { getAll, create, update, remove };