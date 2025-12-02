const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getConfig = async (req, res) => {
  try {
    const config = await prisma.siteConfig.findUnique({ where: { id: 1 } });
    res.json({
      data: config || { whatsappButtonEnabled: true },
      success: true
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed' });
  }
};

const toggleWhatsappButton = async (req, res) => {
  try {
    const current = await prisma.siteConfig.findUnique({ where: { id: 1 } });
    const updated = await prisma.siteConfig.upsert({
      where: { id: 1 },
      update: { whatsappButtonEnabled: !current?.whatsappButtonEnabled },
      create: { whatsappButtonEnabled: true },
    });
    res.json({ data: updated, success: true });
  } catch (err) {
    res.status(500).json({ error: 'Toggle failed' });
  }
};

module.exports = { getConfig, toggleWhatsappButton };