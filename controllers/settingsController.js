const Settings = require('../models/Settings');
const { cloudinary } = require('../config/cloudinary');

// ============================================
// GET SETTINGS
// ============================================
exports.getSettings = async (req, res) => {
  try {
    const settings = await Settings.getSettings();
    
    res.status(200).json({
      success: true,
      data: settings
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch settings',
      error: error.message
    });
  }
};

// ============================================
// UPDATE BASIC SETTINGS
// ============================================
exports.updateBasicSettings = async (req, res) => {
  try {
    const settings = await Settings.getSettings();
    
    const {
      schoolName,
      schoolAddress,
      schoolPhone,
      schoolEmail,
      aboutText,
      visionMission,
      totalStudents,
      totalTeachers,
      totalStaff,
      facebookLink,
      youtubeLink,
      playStoreLink,
      appStoreLink
    } = req.body;

    // Update fields
    if (schoolName) settings.schoolName = schoolName;
    if (schoolAddress) settings.schoolAddress = schoolAddress;
    if (schoolPhone) settings.schoolPhone = schoolPhone;
    if (schoolEmail) settings.schoolEmail = schoolEmail;
    if (aboutText) settings.aboutText = aboutText;
    if (visionMission) settings.visionMission = visionMission;
    if (totalStudents) settings.totalStudents = totalStudents;
    if (totalTeachers) settings.totalTeachers = totalTeachers;
    if (totalStaff) settings.totalStaff = totalStaff;
    if (facebookLink) settings.facebookLink = facebookLink;
    if (youtubeLink) settings.youtubeLink = youtubeLink;
    if (playStoreLink) settings.playStoreLink = playStoreLink;
    if (appStoreLink) settings.appStoreLink = appStoreLink;

    settings.updatedBy = req.user._id;
    await settings.save();

    res.status(200).json({
      success: true,
      message: 'Settings updated successfully',
      data: settings
    });
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update settings',
      error: error.message
    });
  }
};

// ============================================
// SCROLLING TEXT MANAGEMENT
// ============================================

// Add Scrolling Text
exports.addScrollingText = async (req, res) => {
  try {
    const { text, order } = req.body;

    if (!text) {
      return res.status(400).json({
        success: false,
        message: 'Text is required'
      });
    }

    const settings = await Settings.getSettings();
    
    settings.scrollingTexts.push({
      text,
      order: order || settings.scrollingTexts.length + 1,
      isActive: true
    });

    settings.updatedBy = req.user._id;
    await settings.save();

    res.status(200).json({
      success: true,
      message: 'Scrolling text added successfully',
      data: settings.scrollingTexts
    });
  } catch (error) {
    console.error('Error adding scrolling text:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add scrolling text',
      error: error.message
    });
  }
};

// Update Scrolling Text
exports.updateScrollingText = async (req, res) => {
  try {
    const { textId } = req.params;
    const { text, order, isActive } = req.body;

    const settings = await Settings.getSettings();
    
    const textItem = settings.scrollingTexts.id(textId);
    if (!textItem) {
      return res.status(404).json({
        success: false,
        message: 'Scrolling text not found'
      });
    }

    if (text) textItem.text = text;
    if (order !== undefined) textItem.order = order;
    if (isActive !== undefined) textItem.isActive = isActive;

    settings.updatedBy = req.user._id;
    await settings.save();

    res.status(200).json({
      success: true,
      message: 'Scrolling text updated successfully',
      data: settings.scrollingTexts
    });
  } catch (error) {
    console.error('Error updating scrolling text:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update scrolling text',
      error: error.message
    });
  }
};

// Delete Scrolling Text
exports.deleteScrollingText = async (req, res) => {
  try {
    const { textId } = req.params;

    const settings = await Settings.getSettings();
    
    settings.scrollingTexts = settings.scrollingTexts.filter(
      item => item._id.toString() !== textId
    );

    settings.updatedBy = req.user._id;
    await settings.save();

    res.status(200).json({
      success: true,
      message: 'Scrolling text deleted successfully',
      data: settings.scrollingTexts
    });
  } catch (error) {
    console.error('Error deleting scrolling text:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete scrolling text',
      error: error.message
    });
  }
};

// ============================================
// HERO IMAGES MANAGEMENT (Maximum 10)
// ============================================

// Add Hero Image
exports.addHeroImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Image file is required'
      });
    }

    const settings = await Settings.getSettings();

    // Check maximum limit
    if (settings.heroImages.length >= 10) {
      // Delete uploaded image from cloudinary
      await cloudinary.uploader.destroy(req.file.filename);
      
      return res.status(400).json({
        success: false,
        message: 'Maximum 10 hero images allowed'
      });
    }

    settings.heroImages.push({
      url: req.file.path,
      publicId: req.file.filename,
      order: settings.heroImages.length + 1
    });

    settings.updatedBy = req.user._id;
    await settings.save();

    res.status(200).json({
      success: true,
      message: 'Hero image added successfully',
      data: settings.heroImages
    });
  } catch (error) {
    console.error('Error adding hero image:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add hero image',
      error: error.message
    });
  }
};

// Update Hero Image Order
exports.updateHeroImageOrder = async (req, res) => {
  try {
    const { imageId } = req.params;
    const { order } = req.body;

    const settings = await Settings.getSettings();
    
    const image = settings.heroImages.id(imageId);
    if (!image) {
      return res.status(404).json({
        success: false,
        message: 'Hero image not found'
      });
    }

    image.order = order;
    settings.updatedBy = req.user._id;
    await settings.save();

    res.status(200).json({
      success: true,
      message: 'Hero image order updated',
      data: settings.heroImages
    });
  } catch (error) {
    console.error('Error updating hero image order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update hero image order',
      error: error.message
    });
  }
};

// Delete Hero Image
exports.deleteHeroImage = async (req, res) => {
  try {
    const { imageId } = req.params;

    const settings = await Settings.getSettings();
    
    const image = settings.heroImages.id(imageId);
    if (!image) {
      return res.status(404).json({
        success: false,
        message: 'Hero image not found'
      });
    }

    // Delete from Cloudinary
    if (image.publicId) {
      await cloudinary.uploader.destroy(image.publicId);
    }

    settings.heroImages = settings.heroImages.filter(
      img => img._id.toString() !== imageId
    );

    settings.updatedBy = req.user._id;
    await settings.save();

    res.status(200).json({
      success: true,
      message: 'Hero image deleted successfully',
      data: settings.heroImages
    });
  } catch (error) {
    console.error('Error deleting hero image:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete hero image',
      error: error.message
    });
  }
};

// ============================================
// SINGLE IMAGE UPDATES (About, Chairman, Notice)
// ============================================

// Update About Image
exports.updateAboutImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Image file is required'
      });
    }

    const settings = await Settings.getSettings();

    // Delete old image from Cloudinary
    if (settings.aboutImage && settings.aboutImage.publicId) {
      await cloudinary.uploader.destroy(settings.aboutImage.publicId);
    }

    settings.aboutImage = {
      url: req.file.path,
      publicId: req.file.filename
    };

    settings.updatedBy = req.user._id;
    await settings.save();

    res.status(200).json({
      success: true,
      message: 'About image updated successfully',
      data: settings.aboutImage
    });
  } catch (error) {
    console.error('Error updating about image:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update about image',
      error: error.message
    });
  }
};

// Delete About Image
exports.deleteAboutImage = async (req, res) => {
  try {
    const settings = await Settings.getSettings();

    if (settings.aboutImage && settings.aboutImage.publicId) {
      await cloudinary.uploader.destroy(settings.aboutImage.publicId);
    }

    settings.aboutImage = undefined;
    settings.updatedBy = req.user._id;
    await settings.save();

    res.status(200).json({
      success: true,
      message: 'About image deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting about image:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete about image',
      error: error.message
    });
  }
};

// Update Chairman Image
exports.updateChairmanImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Image file is required'
      });
    }

    const settings = await Settings.getSettings();

    // Delete old image from Cloudinary
    if (settings.chairmanImage && settings.chairmanImage.publicId) {
      await cloudinary.uploader.destroy(settings.chairmanImage.publicId);
    }

    settings.chairmanImage = {
      url: req.file.path,
      publicId: req.file.filename
    };

    settings.updatedBy = req.user._id;
    await settings.save();

    res.status(200).json({
      success: true,
      message: 'Chairman image updated successfully',
      data: settings.chairmanImage
    });
  } catch (error) {
    console.error('Error updating chairman image:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update chairman image',
      error: error.message
    });
  }
};

// Delete Chairman Image
exports.deleteChairmanImage = async (req, res) => {
  try {
    const settings = await Settings.getSettings();

    if (settings.chairmanImage && settings.chairmanImage.publicId) {
      await cloudinary.uploader.destroy(settings.chairmanImage.publicId);
    }

    settings.chairmanImage = undefined;
    settings.updatedBy = req.user._id;
    await settings.save();

    res.status(200).json({
      success: true,
      message: 'Chairman image deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting chairman image:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete chairman image',
      error: error.message
    });
  }
};

// Update Notice Image
exports.updateNoticeImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Image file is required'
      });
    }

    const settings = await Settings.getSettings();

    // Delete old image from Cloudinary
    if (settings.noticeImage && settings.noticeImage.publicId) {
      await cloudinary.uploader.destroy(settings.noticeImage.publicId);
    }

    settings.noticeImage = {
      url: req.file.path,
      publicId: req.file.filename
    };

    settings.updatedBy = req.user._id;
    await settings.save();

    res.status(200).json({
      success: true,
      message: 'Notice image updated successfully',
      data: settings.noticeImage
    });
  } catch (error) {
    console.error('Error updating notice image:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update notice image',
      error: error.message
    });
  }
};

// Delete Notice Image
exports.deleteNoticeImage = async (req, res) => {
  try {
    const settings = await Settings.getSettings();

    if (settings.noticeImage && settings.noticeImage.publicId) {
      await cloudinary.uploader.destroy(settings.noticeImage.publicId);
    }

    settings.noticeImage = undefined;
    settings.updatedBy = req.user._id;
    await settings.save();

    res.status(200).json({
      success: true,
      message: 'Notice image deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting notice image:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete notice image',
      error: error.message
    });
  }
};

// ============================================
// IMPORTANT LINKS MANAGEMENT (Public Home page)
// ============================================

// Add Important Link
exports.addImportantLink = async (req, res) => {
  try {
    const { label, url, order } = req.body;

    if (!label || !url) {
      return res.status(400).json({
        success: false,
        message: 'Label and URL are required'
      });
    }

    const settings = await Settings.getSettings();

    settings.importantLinks.push({
      label,
      url,
      order: order !== undefined ? order : settings.importantLinks.length
    });

    settings.updatedBy = req.user._id;
    await settings.save();

    res.status(200).json({
      success: true,
      message: 'Important link added successfully',
      data: settings.importantLinks
    });
  } catch (error) {
    console.error('Error adding important link:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add important link',
      error: error.message
    });
  }
};

// Update Important Link
exports.updateImportantLink = async (req, res) => {
  try {
    const { linkId } = req.params;
    const { label, url, order } = req.body;

    const settings = await Settings.getSettings();

    const link = settings.importantLinks.id(linkId);
    if (!link) {
      return res.status(404).json({
        success: false,
        message: 'Important link not found'
      });
    }

    if (label !== undefined) link.label = label;
    if (url !== undefined) link.url = url;
    if (order !== undefined) link.order = order;

    settings.updatedBy = req.user._id;
    await settings.save();

    res.status(200).json({
      success: true,
      message: 'Important link updated successfully',
      data: settings.importantLinks
    });
  } catch (error) {
    console.error('Error updating important link:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update important link',
      error: error.message
    });
  }
};

// Delete Important Link
exports.deleteImportantLink = async (req, res) => {
  try {
    const { linkId } = req.params;

    const settings = await Settings.getSettings();

    settings.importantLinks = settings.importantLinks.filter(
      item => item._id.toString() !== linkId
    );

    settings.updatedBy = req.user._id;
    await settings.save();

    res.status(200).json({
      success: true,
      message: 'Important link deleted successfully',
      data: settings.importantLinks
    });
  } catch (error) {
    console.error('Error deleting important link:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete important link',
      error: error.message
    });
  }
};

// Reorder Important Links (replace the whole ordered list at once)
exports.reorderImportantLinks = async (req, res) => {
  try {
    const { links } = req.body; // [{ _id, order }]

    if (!Array.isArray(links)) {
      return res.status(400).json({
        success: false,
        message: 'links must be an array'
      });
    }

    const settings = await Settings.getSettings();

    links.forEach(({ _id, order }) => {
      const link = settings.importantLinks.id(_id);
      if (link) link.order = order;
    });

    settings.updatedBy = req.user._id;
    await settings.save();

    res.status(200).json({
      success: true,
      message: 'Important links reordered successfully',
      data: settings.importantLinks
    });
  } catch (error) {
    console.error('Error reordering important links:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reorder important links',
      error: error.message
    });
  }
};

