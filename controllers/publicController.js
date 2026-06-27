const Carousel = require('../models/Carousel');
const Notice = require('../models/Notice');
const Blog = require('../models/Blog');
const PrincipalInfo = require('../models/PrincipalInfo');

// @desc    Get home page data
// @route   GET /api/public/home
// @access  Public
exports.getHomePageData = async (req, res) => {
  try {
    const carousels = await Carousel.find({ isActive: true })
      .sort({ order: 1 })
      .limit(5);

    const notices = await Notice.find({ 
      isActive: true,
      publishDate: { $lte: new Date() }
    })
      .sort({ publishDate: -1 })
      .limit(10)
      .populate('createdBy', 'name');

    const blogs = await Blog.find({ isPublished: true })
      .sort({ createdAt: -1 })
      .limit(6)
      .populate('author', 'name profileImage');

    const principalInfo = await PrincipalInfo.findOne({ isActive: true });

    res.status(200).json({
      success: true,
      data: {
        carousels,
        notices,
        blogs,
        principalInfo
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Get single blog
// @route   GET /api/public/blogs/:id
// @access  Public
exports.getBlog = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id)
      .populate('author', 'name profileImage');

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Blog not found'
      });
    }

    // Increment views
    blog.views += 1;
    await blog.save();

    res.status(200).json({
      success: true,
      data: blog
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Get all notices
// @route   GET /api/public/notices
// @access  Public
exports.getAllNotices = async (req, res) => {
  try {
    const notices = await Notice.find({ 
      isActive: true,
      publishDate: { $lte: new Date() }
    })
      .sort({ publishDate: -1 })
      .populate('createdBy', 'name');

    res.status(200).json({
      success: true,
      count: notices.length,
      data: notices
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};
