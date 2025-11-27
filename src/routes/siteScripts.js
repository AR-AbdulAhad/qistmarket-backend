const express = require('express');
const {
  getAll,
  create,
  update,
  remove,
} = require('../controllers/siteScriptController.js');
const { authenticateToken } = require('../middlewares/authMiddleware');

const router = express.Router();

router.get('/site-scripts', getAll);
router.post('/site-scripts', authenticateToken, create);
router.put('/site-scripts/:id', authenticateToken, update);
router.delete('/site-scripts/:id', authenticateToken, remove);

module.exports = router;