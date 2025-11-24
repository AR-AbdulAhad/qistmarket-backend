const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const SITE_URL = 'https://www.qistmarket.pk';


const generateTagsSitemap = async (req, res) => {
  try {
    const urls = [];

    const tags = await prisma.tag.findMany({
      where: { isActive: true }
    });
    tags.forEach(c => {
      urls.push({
        loc: `${SITE_URL}/category/${c.slugName}`,
        lastmod: new Date().toISOString(),
        changefreq: 'daily',
        priority: '0.9'
      });
    });

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    ${urls.map(u => `  <url>
        <loc>${u.loc}</loc>
        <lastmod>${u.lastmod}</lastmod>
        <changefreq>${u.changefreq}</changefreq>
        <priority>${u.priority}</priority>
    </url>`).join('\n')}
    </urlset>`;

    res.set('Content-Type', 'application/xml');
    res.set('Cache-Control', 's-maxage=3600, stale-while-revalidate');
    res.send(xml);

  } catch (err) {
    console.error(err);
    res.status(500).send('Sitemap banane mein error');
  } finally {
    await prisma.$disconnect();
  }
};

module.exports = generateTagsSitemap;