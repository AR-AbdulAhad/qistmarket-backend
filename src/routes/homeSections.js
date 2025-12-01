const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middlewares/authMiddleware');
const { getAll, toggleActive, reorder } = require('../controllers/homeSectionController');

router.get('/home-sections', getAll);
router.patch('/home-sections/:id/toggle', authenticateToken, toggleActive);
router.patch('/home-sections/reorder', authenticateToken, reorder);

module.exports = router;