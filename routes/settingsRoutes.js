const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
const { protect, authorize } = require('../middleware/auth');
const { upload } = require('../config/cloudinary');

// ============================================
// PUBLIC ROUTES
// ============================================

// Get Settings (Public)
router.get('/', settingsController.getSettings);

// ============================================
// PROTECTED ROUTES (Admin & Teacher)
// ============================================

// Basic Settings Update
router.put(
  '/basic',
  protect,
  authorize('admin', 'teacher'),
  settingsController.updateBasicSettings
);

// ============================================
// SCROLLING TEXT ROUTES
// ============================================

// Add Scrolling Text
router.post(
  '/scrolling-text',
  protect,
  authorize('admin', 'teacher'),
  settingsController.addScrollingText
);

// Update Scrolling Text
router.put(
  '/scrolling-text/:textId',
  protect,
  authorize('admin', 'teacher'),
  settingsController.updateScrollingText
);

// Delete Scrolling Text
router.delete(
  '/scrolling-text/:textId',
  protect,
  authorize('admin', 'teacher'),
  settingsController.deleteScrollingText
);

// ============================================
// HERO IMAGES ROUTES (Maximum 10)
// ============================================

// Add Hero Image
router.post(
  '/hero-images',
  protect,
  authorize('admin'),
  upload.single('image'),
  settingsController.addHeroImage
);

// Update Hero Image Order
router.put(
  '/hero-images/:imageId/order',
  protect,
  authorize('admin'),
  settingsController.updateHeroImageOrder
);

// Delete Hero Image
router.delete(
  '/hero-images/:imageId',
  protect,
  authorize('admin'),
  settingsController.deleteHeroImage
);

// ============================================
// SINGLE IMAGE ROUTES
// ============================================

// About Image
router.put(
  '/about-image',
  protect,
  authorize('admin'),
  upload.single('image'),
  settingsController.updateAboutImage
);

router.delete(
  '/about-image',
  protect,
  authorize('admin'),
  settingsController.deleteAboutImage
);

// Chairman Image
router.put(
  '/chairman-image',
  protect,
  authorize('admin'),
  upload.single('image'),
  settingsController.updateChairmanImage
);

router.delete(
  '/chairman-image',
  protect,
  authorize('admin'),
  settingsController.deleteChairmanImage
);

// Notice Image
router.put(
  '/notice-image',
  protect,
  authorize('admin'),
  upload.single('image'),
  settingsController.updateNoticeImage
);

router.delete(
  '/notice-image',
  protect,
  authorize('admin'),
  settingsController.deleteNoticeImage
);

// ============================================
// IMPORTANT LINKS ROUTES (Public Home page)
// ============================================

// Add Important Link
router.post(
  '/important-links',
  protect,
  authorize('admin', 'teacher'),
  settingsController.addImportantLink
);

// Update Important Link
router.put(
  '/important-links/:linkId',
  protect,
  authorize('admin', 'teacher'),
  settingsController.updateImportantLink
);

// Delete Important Link
router.delete(
  '/important-links/:linkId',
  protect,
  authorize('admin', 'teacher'),
  settingsController.deleteImportantLink
);

// Reorder Important Links
router.put(
  '/important-links-reorder',
  protect,
  authorize('admin', 'teacher'),
  settingsController.reorderImportantLinks
);

module.exports = router;
