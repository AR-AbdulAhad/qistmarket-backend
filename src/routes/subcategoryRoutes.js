const express = require('express');
const router = express.Router();
const { body, query } = require('express-validator');
const { authenticateToken } = require('../middlewares/authMiddleware');
const {
  getSubcategories,
  createSubcategory,
  updateSubcategory,
  deleteSubcategory,
  toggleSubcategoryActive,
  getSubcategoriesByCategory,
  getOnlyTrueSubCategories,
  getSubcategoryBySlug
} = require('../controllers/subcategoryController');

router.get('/plain-subcategories/:id', getSubcategoriesByCategory);

router.get('/subcategories/active', getOnlyTrueSubCategories);

router.get(
  '/subcategories',
  [
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('search').optional().isString().trim(),
    query('status').optional().isIn(['all', 'active', 'inactive']),
    query('sort').optional().isIn(['s.id', 's.name', 'c.name', 's.isActive']),
    query('order').optional().isIn(['asc', 'desc']),
  ],
  getSubcategories
);

router.post(
  '/subcategories',
  authenticateToken,
  [
    body('name').isString().notEmpty().withMessage('Name is required'),
    body('category_id').isInt().withMessage('Valid category ID is required'),
    body('description').optional({ values: 'falsy' }).isString().isLength({ max: 255 }).withMessage('Description must not exceed 255 characters'),
    body('isActive').optional().isBoolean().withMessage('isActive must be a boolean'),
  ],
  createSubcategory
);

router.put(
  '/subcategories/:id',
  authenticateToken,
  [
    body('name').isString().notEmpty().withMessage('Name is required'),
    body('category_id').isInt().withMessage('Valid category ID is required'),
    body('description').optional({ values: 'falsy' }).isString().isLength({ max: 255 }).withMessage('Description must not exceed 255 characters'),
    body('meta_title').optional({ values: 'falsy' }).isString().isLength({ max: 60 }).withMessage('Meta title must not exceed 60 characters'),
    body('meta_description').optional({ values: 'falsy' }).isString().isLength({ max: 160 }).withMessage('Meta description must not exceed 160 characters'),
    body('meta_keywords').optional({ values: 'falsy' }).isString(),
    body('slugName').optional({ values: 'falsy' }).isString(),
  ],
  updateSubcategory
);

router.patch('/subcategories/:id/toggle', authenticateToken, toggleSubcategoryActive);

router.delete('/subcategories/:id', authenticateToken, deleteSubcategory);

router.get('/subcategories/name/:slugName', getSubcategoryBySlug);

module.exports = router;