const express = require('express');
const router = express.Router();
const { getConfig, toggleWhatsappButton } = require('../controllers/siteConfigController');

router.get('/site-config', getConfig);
router.patch('/site-config/whatsapp-button/toggle', toggleWhatsappButton);

module.exports = router;