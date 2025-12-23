const express = require('express');
const router = express.Router();
const upload = require('../middlewares/uploadMiddleware');
const fixUploadPath = require('../middlewares/fixUploadPath');
const { authenticateToken } = require('../middlewares/authMiddleware');
const {
  getBlogs,
  getTypeBlogs,
  getBlogBySlug,
  createBlog,
  updateBlog,
  deleteBlog,
} = require('../controllers/blogController');


router.get('/blogs', authenticateToken, getBlogs);
router.get('/type-blogs', getTypeBlogs);
router.get('/blogs/slug/:slugname', getBlogBySlug);
router.post('/blogs', authenticateToken, upload.single('thumbnail'), fixUploadPath, createBlog);
router.put('/blogs/:id', authenticateToken, upload.single('thumbnail'), fixUploadPath, updateBlog);
router.delete('/blogs/:id', authenticateToken, deleteBlog);

module.exports = router;