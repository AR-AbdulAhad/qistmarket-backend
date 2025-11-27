const express = require('express');
const {
  getAllCitesAreas, creaCitesAreas, bulkImportCitesAreas, deleteCitesAreas, bulkDublicateCitesAreas,
} = require('../controllers/cityArea');
const { authenticateToken } = require('../middlewares/authMiddleware');

const router = express.Router();

router.get('/cities-areas', authenticateToken,  getAllCitesAreas);
router.post('/create-city-area', authenticateToken, creaCitesAreas);
router.post('/bulk-import-cities-areas', authenticateToken, bulkImportCitesAreas);
router.post('/bulk-delete-areas', authenticateToken, deleteCitesAreas);
router.post('/bulk-duplicate-areas', authenticateToken, bulkDublicateCitesAreas);

module.exports = router;