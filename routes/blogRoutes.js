const express = require('express');
const router = express.Router();
const { upload } = require('../config/cloudinary');
const {
  createBlog,
  getAllBlogs,
  updateBlog,
  deleteBlog
} = require('../controllers/blogController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.route('/')
  .get(getAllBlogs)
  .post(authorize('admin', 'teacher'), upload.single('featuredImage'), createBlog);

router.route('/:id')
  .put(authorize('admin', 'teacher'), upload.single('featuredImage'), updateBlog)
  .delete(authorize('admin', 'teacher'), deleteBlog);

module.exports = router;
