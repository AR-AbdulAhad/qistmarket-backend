const express = require('express');
const generateSitemapIndex = require('../controllers/sitemapIndexController');
const generateHomeSitemap = require('../controllers/homeSitemapController');
const generateCategoriesSitemap = require('../controllers/categoriesSitemapController');
const generateSubCategoriesSitemap = require('../controllers/subCategoriesSitemapController');
const generateProductsSitemap = require('../controllers/productsSitemapController');
const generateTagsSitemap = require('../controllers/tagsSitemapController');

const router = express.Router();
router.get('/sitemap.xml', generateSitemapIndex);
router.get('/home_sitemap.xml', generateHomeSitemap);
router.get('/categories_sitemap.xml', generateCategoriesSitemap);
router.get('/subcategories_sitemap.xml', generateSubCategoriesSitemap);
router.get('/products_sitemap.xml', generateProductsSitemap);
router.get('/products_tags_sitemap.xml', generateTagsSitemap);

module.exports = router;