const Navigation = require('../models/Navigation');

// Normalize shorthand hex colors (#fff → #ffffff) in nav items recursively
function normalizeNavColors(items) {
  if (!Array.isArray(items)) return items;
  return items.map(item => {
    const fixed = { ...item };
    ['color', 'bg'].forEach(key => {
      if (fixed[key] && /^#[0-9a-fA-F]{3}$/.test(fixed[key].trim())) {
        const s = fixed[key].trim();
        fixed[key] = '#' + s[1] + s[1] + s[2] + s[2] + s[3] + s[3];
      }
    });
    if (Array.isArray(fixed.sub)) {
      fixed.sub = fixed.sub.map(sub => {
        const fs = { ...sub };
        if (fs.dot && /^#[0-9a-fA-F]{3}$/.test(fs.dot.trim())) {
          const s = fs.dot.trim();
          fs.dot = '#' + s[1] + s[1] + s[2] + s[2] + s[3] + s[3];
        }
        return fs;
      });
    }
    return fixed;
  });
}

// @desc    Get the public navigation tree
// @route   GET /api/navigation
// @access  Public
exports.getNavigation = async (req, res) => {
  try {
    const nav = await Navigation.getNavigation();
    // Normalize colors before sending to frontend
    const safeNav = {
      ...nav.toObject(),
      items: normalizeNavColors(nav.items)
    };
    res.status(200).json({ success: true, data: safeNav });
  } catch (error) {
    console.error('Error fetching navigation:', error);
    // Return empty navigation instead of error so frontend doesn't crash
    res.status(200).json({
      success: true,
      data: { items: [] },
      warning: 'Navigation could not be loaded from DB, using empty fallback'
    });
  }
};

// @desc    Replace the entire navigation tree
// @route   PUT /api/navigation
// @access  Private (Admin only)
exports.updateNavigation = async (req, res) => {
  try {
    const { items } = req.body;
    if (!Array.isArray(items)) {
      return res.status(400).json({ success: false, message: 'items must be an array' });
    }

    // Normalize colors on save too
    const normalizedItems = normalizeNavColors(items);

    const nav = await Navigation.getNavigation();
    nav.items = normalizedItems;
    nav.updatedBy = req.user._id;
    await nav.save();

    res.status(200).json({
      success: true,
      message: 'Navigation updated successfully',
      data: nav
    });
  } catch (error) {
    console.error('Error updating navigation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update navigation',
      error: error.message
    });
  }
};
