const express = require('express');
const router = express.Router();
const { upload } = require('../config/cloudinary');
const {
  createCarousel,
  getAllCarousels,
  updateCarousel,
  deleteCarousel
} = require('../controllers/carouselController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);
router.use(authorize('admin'));

router.route('/')
  .get(getAllCarousels)
  .post(upload.single('image'), createCarousel);

router.route('/:id')
  .put(upload.single('image'), updateCarousel)
  .delete(deleteCarousel);

module.exports = router;
