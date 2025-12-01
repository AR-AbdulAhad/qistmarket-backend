const express = require('express');
const {
  getFeaturedProducts,
  addFeaturedProduct,
  removeFeaturedProduct,
  reorderFeaturedProducts,
  getPublicFeaturedProducts,
} = require('../controllers/featuredProductController.js');
const { authenticateToken } = require('../middlewares/authMiddleware');
const router = express.Router();

router.get('/public-featured-products', getPublicFeaturedProducts);
router.get('/featured-products', authenticateToken, getFeaturedProducts);
router.post('/featured-products', authenticateToken, addFeaturedProduct);
router.delete('/featured-products/:id', authenticateToken, removeFeaturedProduct);
router.patch('/featured-products/reorder', authenticateToken, reorderFeaturedProducts);

module.exports = router;


