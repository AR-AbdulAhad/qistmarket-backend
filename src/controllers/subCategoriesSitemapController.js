const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const SITE_URL = 'https://www.qistmarket.pk';

const generateSubCategoriesSitemap = async (req, res) => {
  try {
    const urls = [];

    const subcats = await prisma.subcategories.findMany({
      include: { categories: true },
      where: { isActive: true, slugName: { not: null } }
    });
    subcats.forEach(s => {
      if (s.categories?.slugName && s.slugName) {
        urls.push({
          loc: `${SITE_URL}/category/${s.categories.slugName}/${s.slugName}`,
          lastmod: new Date(s.updated_at).toISOString(),
          changefreq: 'daily',
          priority: '0.8'
        });
      }
    });

    // XML banao
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

module.exports = generateSubCategoriesSitemap;