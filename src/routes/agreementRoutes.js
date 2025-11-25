const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middlewares/authMiddleware');
const fixUploadPath = require('../middlewares/fixUploadPath');
const {
  getAgreement,
  updateAgreement,
  deleteImage,
} = require('../controllers/agreementController');

router.get('/agreement', getAgreement);

router.post(
  '/agreement',
  authenticateToken,
  fixUploadPath,
  updateAgreement
);

router.delete('/agreement-image/:id', authenticateToken, deleteImage);

module.exports = router;