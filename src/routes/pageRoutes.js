const express = require('express');
const { upsertPage, getPages, getPageBySlug, deletePage, updatePage } = require('../controllers/pageController');
const { authenticateToken } = require('../middlewares/authMiddleware');
const router = express.Router();

router.post('/pages', authenticateToken, upsertPage);
router.get('/pages', authenticateToken, getPages);
router.get('/pages/:slug', getPageBySlug);
router.put('/pages/:id', authenticateToken, updatePage);
router.delete('/pages/:id', authenticateToken, deletePage);

module.exports = router;