// routes/cityArea.js
const express = require('express');
const multer = require('multer');
const {
  getAllCitesAreas,
  creaCitesAreas,
  sseBulkImport,
  bulkUpdateAreas,
  bulkUpdateCities,
  deleteCitesAreas,
  bulkDublicateCitesAreas,
  getCities,
  getPublicCitiesAreas
} = require('../controllers/cityArea');
const { authenticateToken } = require('../middlewares/authMiddleware');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// LIST & CREATE
router.get('/cities-areas', authenticateToken, getAllCitesAreas);
router.post('/create-city-area', authenticateToken, creaCitesAreas);

// BULK IMPORT (SSE)
router.get('/bulk-import-cities-areas', authenticateToken, sseBulkImport);
router.post('/bulk-import-cities-areas', authenticateToken, upload.single('csv'), sseBulkImport);

// BULK ACTIONS
router.patch('/bulk-update-areas', authenticateToken, bulkUpdateAreas);
router.patch('/bulk-update-cities', authenticateToken, bulkUpdateCities);
router.post('/bulk-delete-areas', authenticateToken, deleteCitesAreas);
router.post('/bulk-duplicate-areas', authenticateToken, bulkDublicateCitesAreas);

// CITIES
router.get('/cities', authenticateToken, getCities);

router.get('/public/cities-areas', getPublicCitiesAreas);

module.exports = router;