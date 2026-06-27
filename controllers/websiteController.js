const WebsiteSetting = require('../models/WebsiteSetting');
const { cloudinary } = require('../config/cloudinary');

// @desc    Get website settings
// @route   GET /api/website/settings
// @access  Public
exports.getSettings = async (req, res) => {
  try {
    let settings = await WebsiteSetting.findOne({ isActive: true });
    
    if (!settings) {
      // Create default settings
      settings = await WebsiteSetting.create({
        schoolName: 'IDEAL COLLEGE',
        schoolAddress: 'Dhanmondi, Dhaka',
        schoolPhone: '+880 1234-567890',
        schoolEmail: 'info@idealcollege.edu.bd'
      });
    }

    res.status(200).json({
      success: true,
      data: settings
    });
  } catch (error) {
    console.error('Get Settings Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Update website settings
// @route   PUT /api/website/settings
// @access  Private (Admin)
exports.updateSettings = async (req, res) => {
  try {
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

    let settings = await WebsiteSetting.findOne({ isActive: true });

    if (!settings) {
      settings = new WebsiteSetting();
    }

    // Update fields
    if (schoolName !== undefined) settings.schoolName = schoolName;
    if (schoolAddress !== undefined) settings.schoolAddress = schoolAddress;
    if (schoolPhone !== undefined) settings.schoolPhone = schoolPhone;
    if (schoolEmail !== undefined) settings.schoolEmail = schoolEmail;
    if (aboutText !== undefined) settings.aboutText = aboutText;
    if (visionMission !== undefined) settings.visionMission = visionMission;
    if (totalStudents !== undefined) settings.totalStudents = totalStudents;
    if (totalTeachers !== undefined) settings.totalTeachers = totalTeachers;
    if (totalStaff !== undefined) settings.totalStaff = totalStaff;
    if (facebookLink !== undefined) settings.facebookLink = facebookLink;
    if (youtubeLink !== undefined) settings.youtubeLink = youtubeLink;
    if (playStoreLink !== undefined) settings.playStoreLink = playStoreLink;
    if (appStoreLink !== undefined) settings.appStoreLink = appStoreLink;

    await settings.save();

    console.log('Settings updated successfully');

    res.status(200).json({
      success: true,
      message: 'Settings updated successfully',
      data: settings
    });
  } catch (error) {
    console.error('Update Settings Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Update logo
// @route   PUT /api/website/settings/logo
// @access  Private (Admin)
exports.updateLogo = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload an image'
      });
    }

    console.log('Logo upload started');
    console.log('File:', req.file);

    let settings = await WebsiteSetting.findOne({ isActive: true });
    
    if (!settings) {
      settings = new WebsiteSetting();
    }

    // Delete old logo from Cloudinary if exists
    if (settings.logo) {
      try {
        const publicId = settings.logo.split('/').pop().split('.')[0];
        await cloudinary.uploader.destroy(`school-management/${publicId}`);
        console.log('Old logo deleted from Cloudinary');
      } catch (error) {
        console.log('Error deleting old logo:', error.message);
      }
    }

    // Cloudinary automatically uploads via multer-storage-cloudinary
    settings.logo = req.file.path;
    await settings.save();

    console.log('Logo updated successfully:', settings.logo);

    res.status(200).json({
      success: true,
      message: 'Logo updated successfully',
      data: settings
    });
  } catch (error) {
    console.error('Update Logo Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Update header image
// @route   PUT /api/website/settings/header-image
// @access  Private (Admin)
exports.updateHeaderImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload an image'
      });
    }

    console.log('Header image upload started');
    console.log('File:', req.file);

    let settings = await WebsiteSetting.findOne({ isActive: true });
    
    if (!settings) {
      settings = new WebsiteSetting();
    }

    // Delete old header image from Cloudinary if exists
    if (settings.headerImage) {
      try {
        const publicId = settings.headerImage.split('/').pop().split('.')[0];
        await cloudinary.uploader.destroy(`school-management/${publicId}`);
        console.log('Old header image deleted from Cloudinary');
      } catch (error) {
        console.log('Error deleting old header image:', error.message);
      }
    }

    settings.headerImage = req.file.path;
    await settings.save();

    console.log('Header image updated successfully:', settings.headerImage);

    res.status(200).json({
      success: true,
      message: 'Header image updated successfully',
      data: settings
    });
  } catch (error) {
    console.error('Update Header Image Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Update about image
// @route   PUT /api/website/settings/about-image
// @access  Private (Admin)
exports.updateAboutImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload an image'
      });
    }

    console.log('About image upload started');
    console.log('File:', req.file);

    let settings = await WebsiteSetting.findOne({ isActive: true });
    
    if (!settings) {
      settings = new WebsiteSetting();
    }

    // Delete old about image from Cloudinary if exists
    if (settings.aboutImage) {
      try {
        const publicId = settings.aboutImage.split('/').pop().split('.')[0];
        await cloudinary.uploader.destroy(`school-management/${publicId}`);
        console.log('Old about image deleted from Cloudinary');
      } catch (error) {
        console.log('Error deleting old about image:', error.message);
      }
    }

    settings.aboutImage = req.file.path;
    await settings.save();

    console.log('About image updated successfully:', settings.aboutImage);

    res.status(200).json({
      success: true,
      message: 'About image updated successfully',
      data: settings
    });
  } catch (error) {
    console.error('Update About Image Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};
