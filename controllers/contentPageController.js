const ContentPage = require('../models/ContentPage');

// ─── Helper to extract slug from request ──────────────────────────────────
function extractSlug(req) {
  // For /slug/* routes in Express 5
  if (req.params[0]) return req.params[0].toLowerCase();
  // For /*splat pattern
  const splat = req.params.splat;
  if (splat) {
    const raw = Array.isArray(splat) ? splat.join('/') : splat;
    return raw.toLowerCase();
  }
  // For /:slug single segment
  if (req.params.slug) return req.params.slug.toLowerCase();
  return '';
}

// @desc    Get a single content page by slug (NEW: mounted at /slug/*)
// @route   GET /api/content/slug/*
// @access  Public
exports.getContentPageBySlugV2 = async (req, res) => {
  try {
    // In Express 5, req.params[0] captures the wildcard portion
    const rawSlug = (req.params[0] || '').toLowerCase().replace(/^\/+/, '');
    
    if (!rawSlug) {
      return res.status(400).json({ success: false, message: 'Slug is required' });
    }

    const page = await ContentPage.findOne({ slug: rawSlug, isPublished: true });

    if (!page) {
      return res.status(404).json({
        success: false,
        message: 'Content page not found'
      });
    }

    res.status(200).json({ success: true, data: page });
  } catch (error) {
    console.error('Error fetching content page by slug:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch content page',
      error: error.message
    });
  }
};

// @desc    Get a single content page by single-segment slug (legacy)
// @route   GET /api/content/page/:slug
// @access  Public
exports.getContentPageBySingleSlug = async (req, res) => {
  try {
    const slug = (req.params.slug || '').toLowerCase();
    const page = await ContentPage.findOne({ slug, isPublished: true });

    if (!page) {
      return res.status(404).json({ success: false, message: 'Content page not found' });
    }

    res.status(200).json({ success: true, data: page });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch content page', error: error.message });
  }
};

// @desc    Get a single content page by slug (OLD — kept for any direct calls)
// @route   (internal helper)
// @access  Public
exports.getContentPageBySlug = async (req, res) => {
  try {
    const splat = req.params.splat;
    const rawSlug = Array.isArray(splat) ? splat.join('/') : (splat || req.params.slug || req.params[0] || '');
    const slug = rawSlug.toLowerCase().replace(/^\/+/, '');

    const page = await ContentPage.findOne({ slug, isPublished: true });

    if (!page) {
      return res.status(404).json({ success: false, message: 'Content page not found' });
    }

    res.status(200).json({ success: true, data: page });
  } catch (error) {
    console.error('Error fetching content page:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch content page', error: error.message });
  }
};

// @desc    List all content pages (includes unpublished)
// @route   GET /api/content/admin/list
// @access  Private (Admin only)
exports.getAllContentPages = async (req, res) => {
  try {
    const pages = await ContentPage.find()
      .select('slug title banglaTitle icon isPublished updatedAt')
      .sort({ slug: 1 });

    res.status(200).json({
      success: true,
      count: pages.length,
      data: pages
    });
  } catch (error) {
    console.error('Error listing content pages:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to list content pages',
      error: error.message
    });
  }
};

// @desc    Get a single content page by id (for the admin editor)
// @route   GET /api/content/admin/:id
// @access  Private (Admin only)
exports.getContentPageById = async (req, res) => {
  try {
    const page = await ContentPage.findById(req.params.id);

    if (!page) {
      return res.status(404).json({ success: false, message: 'Content page not found' });
    }

    res.status(200).json({ success: true, data: page });
  } catch (error) {
    console.error('Error fetching content page:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch content page', error: error.message });
  }
};

// @desc    Create a content page
// @route   POST /api/content
// @access  Private (Admin only)
exports.createContentPage = async (req, res) => {
  try {
    const { slug, title, banglaTitle, icon, breadcrumb, blocks, isPublished } = req.body;

    if (!slug || !title) {
      return res.status(400).json({ success: false, message: 'slug and title are required' });
    }

    const existing = await ContentPage.findOne({ slug: slug.toLowerCase() });
    if (existing) {
      return res.status(400).json({ success: false, message: 'A content page with this slug already exists' });
    }

    const page = await ContentPage.create({
      slug: slug.toLowerCase(),
      title,
      banglaTitle,
      icon,
      breadcrumb,
      blocks,
      isPublished,
      updatedBy: req.user._id
    });

    res.status(201).json({ success: true, message: 'Content page created successfully', data: page });
  } catch (error) {
    console.error('Error creating content page:', error);
    res.status(500).json({ success: false, message: 'Failed to create content page', error: error.message });
  }
};

// @desc    Update a content page (by id)
// @route   PUT /api/content/:id
// @access  Private (Admin only)
exports.updateContentPage = async (req, res) => {
  try {
    const { title, banglaTitle, icon, breadcrumb, blocks, isPublished, slug } = req.body;

    const page = await ContentPage.findById(req.params.id);
    if (!page) {
      return res.status(404).json({ success: false, message: 'Content page not found' });
    }

    if (slug !== undefined) page.slug = slug.toLowerCase();
    if (title !== undefined) page.title = title;
    if (banglaTitle !== undefined) page.banglaTitle = banglaTitle;
    if (icon !== undefined) page.icon = icon;
    if (breadcrumb !== undefined) page.breadcrumb = breadcrumb;
    if (blocks !== undefined) page.blocks = blocks;
    if (isPublished !== undefined) page.isPublished = isPublished;
    page.updatedBy = req.user._id;

    await page.save();

    res.status(200).json({ success: true, message: 'Content page updated successfully', data: page });
  } catch (error) {
    console.error('Error updating content page:', error);
    res.status(500).json({ success: false, message: 'Failed to update content page', error: error.message });
  }
};

// @desc    Delete a content page
// @route   DELETE /api/content/:id
// @access  Private (Admin only)
exports.deleteContentPage = async (req, res) => {
  try {
    const page = await ContentPage.findByIdAndDelete(req.params.id);

    if (!page) {
      return res.status(404).json({ success: false, message: 'Content page not found' });
    }

    res.status(200).json({ success: true, message: 'Content page deleted successfully' });
  } catch (error) {
    console.error('Error deleting content page:', error);
    res.status(500).json({ success: false, message: 'Failed to delete content page', error: error.message });
  }
};
