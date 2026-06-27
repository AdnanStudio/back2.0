const express = require('express');
const router = express.Router();

// Controllers
const {
  getBlog,
  getAllNotices
} = require('../controllers/publicController');

// Models
const Settings = require('../models/Settings');

// ============================================
// GET HOME PAGE DATA WITH SETTINGS
// ============================================
router.get('/home', async (req, res) => {
  try {
    // Settings fetch
    const settings = await Settings.getSettings();

    // এখানে চাইলে তুমি অন্য data fetch করতে পারো
    // যেমন: carousels, notices, blogs ইত্যাদি
    // const carousels = await Carousel.find();
    // const notices = await Notice.find().limit(5);

    res.status(200).json({
      success: true,
      data: {
        websiteSettings: {
          scrollingTexts: settings.scrollingTexts
            .filter(t => t.isActive)
            .sort((a, b) => a.order - b.order),

          heroImages: settings.heroImages
            .sort((a, b) => a.order - b.order)
            .map(img => img.url),

          aboutImage: settings.aboutImage?.url,
          chairmanImage: settings.chairmanImage?.url,
          noticeImage: settings.noticeImage?.url,

          schoolName: settings.schoolName,
          schoolAddress: settings.schoolAddress,
          schoolPhone: settings.schoolPhone,
          schoolEmail: settings.schoolEmail,

          logo: settings.logo?.url,
          aboutText: settings.aboutText,
          visionMission: settings.visionMission,

          totalStudents: settings.totalStudents,
          totalTeachers: settings.totalTeachers,
          totalStaff: settings.totalStaff,

          facebookLink: settings.facebookLink,
          youtubeLink: settings.youtubeLink,
          playStoreLink: settings.playStoreLink,
          appStoreLink: settings.appStoreLink
        }

        // future data:
        // carousels,
        // notices,
        // blogs
      }
    });
  } catch (error) {
    console.error('Error fetching home data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch home data',
      error: error.message
    });
  }
});

// ============================================
// OTHER PUBLIC ROUTES
// ============================================

// Single blog
router.get('/blogs/:id', getBlog);

// All notices
router.get('/notices', getAllNotices);

module.exports = router;





// const express = require('express');
// const router = express.Router();
// const {
//   getHomePageData,
//   getBlog,
//   getAllNotices
// } = require('../controllers/publicController');

// router.get('/home', getHomePageData);
// router.get('/blogs/:id', getBlog);
// router.get('/notices', getAllNotices);

// module.exports = router;
