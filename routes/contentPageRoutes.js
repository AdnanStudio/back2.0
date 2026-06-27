const express = require('express');
const router = express.Router();
const contentPageController = require('../controllers/contentPageController');
const { protect, authorize } = require('../middleware/auth');

// ============================================================
// ADMIN ROUTES — must be registered BEFORE the public wildcard
// ============================================================

// List all content pages
router.get('/admin/list', protect, authorize('admin'), contentPageController.getAllContentPages);

// Get single content page by id (for admin editor)
router.get('/admin/:id', protect, authorize('admin'), contentPageController.getContentPageById);

// Create a content page
router.post('/', protect, authorize('admin'), contentPageController.createContentPage);

// Update a content page
router.put('/:id', protect, authorize('admin'), contentPageController.updateContentPage);

// Delete a content page
router.delete('/:id', protect, authorize('admin'), contentPageController.deleteContentPage);

// ============================================================
// PUBLIC SLUG ROUTE
// Slugs can contain slashes (e.g. "about/history", "academic/programs")
// We mount this on /slug/* so it never conflicts with /admin/*
// Frontend calls: GET /api/content/slug/about/history
// ============================================================
router.get('/slug/*', contentPageController.getContentPageBySlugV2);


// Legacy: also support the old /:slug pattern for single-segment slugs
// This is kept for backward compatibility but won't conflict with /admin/*
router.get('/page/:slug', contentPageController.getContentPageBySingleSlug);

module.exports = router;
