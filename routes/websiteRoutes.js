const express = require('express');
const router = express.Router();
const { upload } = require('../config/cloudinary');
const {
  getSettings,
  updateSettings,
  updateLogo,
  updateHeaderImage,
  updateAboutImage
} = require('../controllers/websiteController');
const { protect, authorize } = require('../middleware/auth');

// Public route
router.get('/settings', getSettings);

// Admin only routes
router.put('/settings', protect, authorize('admin'), updateSettings);
router.put('/settings/logo', protect, authorize('admin'), upload.single('logo'), updateLogo);
router.put('/settings/header-image', protect, authorize('admin'), upload.single('headerImage'), updateHeaderImage);
router.put('/settings/about-image', protect, authorize('admin'), upload.single('aboutImage'), updateAboutImage);

module.exports = router;
