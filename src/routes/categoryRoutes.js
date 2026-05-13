const express = require('express');
const router = express.Router();
const { body, query } = require('express-validator');
const { authenticateToken } = require('../middlewares/authMiddleware');
const {
  getCategories,
  getOnlyTrueCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  toggleCategoryActive,
  getAllPlainCategory,
  getLimitOnlyTrueCategories,
  getTrueCategories,
  getCategoryBySlug,
} = require('../controllers/categoryController');

router.get(
  '/all-categories',
  
  [
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('search').optional().isString().trim(),
    query('status').optional().isIn(['all', 'active', 'inactive']),
    query('sort').optional().isIn(['id', 'name', 'isActive']),
    query('order').optional().isIn(['asc', 'desc']),
  ],
  getCategories   
);

router.get('/categories', getOnlyTrueCategories);
router.get('/limit/categories', getLimitOnlyTrueCategories);
router.get('/top/categories', getTrueCategories);
router.get('/plain-categories', getAllPlainCategory);

router.post(
  '/categories',
  authenticateToken,
  [
    body('name').isString().notEmpty().withMessage('Name is required'),
    body('description').optional({ values: 'falsy' }).isString(),
    body('isActive').optional().isBoolean().withMessage('isActive must be a boolean'),
    body('icon').optional({ values: 'falsy' }).isString(),
  ],
  createCategory
);

router.put(
  '/categories/:id',
  authenticateToken,
  [
    body('name').isString().notEmpty().withMessage('Name is required'),
    body('description').optional({ values: 'falsy' }).isString(),
    body('icon').optional({ values: 'falsy' }).isString(),
    body('meta_title').optional({ values: 'falsy' }).isString().isLength({ max: 60 }).withMessage('Meta title must not exceed 60 characters'),
    body('meta_description').optional({ values: 'falsy' }).isString().isLength({ max: 160 }).withMessage('Meta description must not exceed 160 characters'),
    body('meta_keywords').optional({ values: 'falsy' }).isString(),
  ],
  updateCategory
);

router.delete('/categories/:id', authenticateToken, deleteCategory);

router.patch('/categories/:id/toggle', authenticateToken, toggleCategoryActive);

router.get('/categories/name/:slugName', getCategoryBySlug);

module.exports = router;