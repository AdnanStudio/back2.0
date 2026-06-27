const express = require('express');
const router = express.Router();
const navigationController = require('../controllers/navigationController');
const { protect, authorize } = require('../middleware/auth');

// Get Navigation (Public)
router.get('/', navigationController.getNavigation);

// Replace Navigation (Admin only)
router.put(
  '/',
  protect,
  authorize('admin'),
  navigationController.updateNavigation
);

module.exports = router;
