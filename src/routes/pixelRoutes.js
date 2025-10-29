// src/routes/pixelRoutes.js
const express = require('express');
const { upsertPixel, getPixels, deletePixel } = require('../controllers/pixelController');
const { authenticateToken } = require('../middlewares/authMiddleware');

const router = express.Router();

router.post('/pixels', authenticateToken, upsertPixel);
router.get('/pixels', authenticateToken, getPixels);
router.delete('/pixels/:id', authenticateToken, deletePixel);

module.exports = router;