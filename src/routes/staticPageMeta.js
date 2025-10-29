const express = require('express');
const {
  upsertMeta,
  listMeta,
  getMetaBySlug,
  deleteMeta,
} = require('../controllers/staticPageMetaController');
const { authenticateToken } = require('../middlewares/authMiddleware');

const router = express.Router();

router.post('/meta', authenticateToken, upsertMeta);
router.get('/meta', authenticateToken, listMeta);
router.get('/meta/:slug', getMetaBySlug);
router.delete('/meta/:id', authenticateToken, deleteMeta);

module.exports = router;