// src/controllers/pixelController.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// CREATE / UPDATE
const upsertPixel = async (req, res) => {
  try {
    const { platform, pixelId, isActive } = req.body;

    if (!platform || !pixelId) {
      return res.status(400).json({ error: 'platform and pixelId are required' });
    }

    const data = {
      platform,
      pixelId: pixelId.trim(),
      isActive: isActive !== undefined ? isActive : true,
    };

    const existing = await prisma.pixelConfig.findUnique({ where: { platform } });

    let result;
    if (existing) {
      result = await prisma.pixelConfig.update({
        where: { id: existing.id },
        data,
      });
      res.status(200).json({ message: 'Pixel updated successfully', pixel: result });
    } else {
      result = await prisma.pixelConfig.create({ data });
      res.status(201).json({ message: 'Pixel created successfully', pixel: result });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to save pixel', details: error.message });
  }
};

// GET ALL
const getPixels = async (req, res) => {
  try {
    const pixels = await prisma.pixelConfig.findMany({
      orderBy: { platform: 'asc' },
    });
    res.status(200).json(pixels);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch pixels', details: error.message });
  }
};

// DELETE
const deletePixel = async (req, res) => {
  try {
    const { id } = req.params;
    const pixel = await prisma.pixelConfig.findUnique({ where: { id: parseInt(id) } });
    if (!pixel) return res.status(404).json({ error: 'Pixel not found' });

    await prisma.pixelConfig.delete({ where: { id: parseInt(id) } });
    res.status(200).json({ message: 'Pixel deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete pixel', details: error.message });
  }
};

module.exports = { upsertPixel, getPixels, deletePixel };