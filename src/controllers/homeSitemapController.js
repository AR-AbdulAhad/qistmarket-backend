const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const SITE_URL = 'https://www.qistmarket.pk';

const staticPages = [
  '', '/shop', '/track-your-order', '/faqs', '/contact',
  '/visit-us', '/agreement'
];

const generateHomeSitemap = async (req, res) => {
  try {
    const urls = [];

    staticPages.forEach(path => {
      urls.push({
        loc: `${SITE_URL}${path}`,
        lastmod: new Date().toISOString(),
        changefreq: path === '' ? 'daily' : 'weekly',
        priority: path === '' ? '1.0' : '0.8'
      });
    });

    const pages = await prisma.page.findMany({ where: { isActive: true } });
    pages.forEach(p => {
      urls.push({
        loc: `${SITE_URL}/${p.slug}`,
        lastmod: new Date(p.updatedAt).toISOString(),
        changefreq: 'weekly',
        priority: '0.7'
      });
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
    res.status(500).send('Sitemap error');
  } finally {
    await prisma.$disconnect();
  }
};

module.exports = generateHomeSitemap;