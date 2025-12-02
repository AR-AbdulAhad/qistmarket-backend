const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middlewares/authMiddleware');
const { getOverview, getDevices, getTopPages, getTrafficSources, getCountries, getRealtime, getTopEvents, getConversions, getEngagementMetrics, getChannels, getPagePerformance, getDemographics, getEngagement } = require('../controllers/analyticsController.js');

router.get('/analytics/overview', authenticateToken, getOverview);
router.get('/analytics/devices', authenticateToken, getDevices);
router.get('/analytics/pages', authenticateToken, getTopPages);
router.get('/analytics/sources', getTrafficSources);
router.get('/analytics/countries', authenticateToken, getCountries);
router.get('/analytics/realtime', authenticateToken, getRealtime);
router.get('/analytics/events', authenticateToken, getTopEvents);
router.get('/analytics/conversions', authenticateToken, getConversions);
router.get('/analytics/engagement', authenticateToken, getEngagementMetrics);
router.get('/analytics/channels', authenticateToken, getChannels);
router.get('/analytics/performance', authenticateToken, getPagePerformance);
router.get('/analytics/demographics', authenticateToken, getDemographics);
router.get('/analytics/engagement', authenticateToken, getEngagement);

module.exports = router;