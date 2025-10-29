const { createProduct, getAllProducts, getProductByName, toggleProductField, updateProduct, getProductPagination, getProductByCategorySlug, getProductByCategoryAndSubSlug, getLatestProducts, getAllProductsPagination, getProductById, getProductSearch, getProductBySubcategorySlugSimple, bulkCreateProducts, bulkUpdateProducts, bulkDeleteProducts, getProductsByIds, bulkSetTags, bulkDuplicateProducts } = require('../controllers/productController');
const upload = require('../middlewares/uploadMiddleware');
const express = require('express');
const router = express.Router();
const { query } = require('express-validator');
const { authenticateToken } = require('../middlewares/authMiddleware');

router.post('/create-product', authenticateToken, upload.array('files'), createProduct);
router.post('/bulk-create-products', authenticateToken, bulkCreateProducts);
router.patch('/bulk-update-products', authenticateToken, bulkUpdateProducts);
router.post('/bulk-delete-products', authenticateToken, bulkDeleteProducts);
router.get('/product', getAllProducts);
router.get('/product/pagination', getProductPagination);
router.get('/product/search', getProductSearch);
router.get('/product/latest', getLatestProducts);
router.get(
  '/product-all-pagination',
  [
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('search').optional().isString().trim(),
    query('status').optional().isIn(['all', 'active', 'inactive']),
    query('sort').optional().isIn(['id', 'name', 'price', 'isActive']),
    query('order').optional().isIn(['asc', 'desc']),
  ],
  authenticateToken,
  getAllProductsPagination
);

router.get('/product/subcategory/related/:subcategorySlug', getProductBySubcategorySlugSimple);
router.get('/product/category/:categorySlug', getProductByCategorySlug);
router.get('/product/category/:categorySlug/:subcategorySlug', getProductByCategoryAndSubSlug);
router.put('/product/:id', authenticateToken, updateProduct);
router.get('/product/name/:name', getProductByName);
router.get('/product/:id', getProductById);
router.patch('/products/:id/toggle', authenticateToken, toggleProductField);

router.get(
  '/products-by-ids',
  [
    query('ids').notEmpty().withMessage('IDs parameter is required'),
  ],
  authenticateToken,
  getProductsByIds
);

router.post('/bulk-set-tags', authenticateToken, bulkSetTags);

router.post("/bulk-duplicate-products", authenticateToken, bulkDuplicateProducts);

module.exports = router;