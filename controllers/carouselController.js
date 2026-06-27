const Carousel = require('../models/Carousel');

// @desc    Create carousel
// @route   POST /api/carousels
// @access  Private (Admin)
exports.createCarousel = async (req, res) => {
  try {
    const { title, description, order } = req.body;

    let image = '';
    if (req.file) {
      image = req.file.path;
    }

    const carousel = await Carousel.create({
      title,
      description,
      image,
      order: order || 0,
      createdBy: req.user._id
    });

    res.status(201).json({
      success: true,
      message: 'Carousel created successfully',
      data: carousel
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Get all carousels
// @route   GET /api/carousels
// @access  Private (Admin)
exports.getAllCarousels = async (req, res) => {
  try {
    const carousels = await Carousel.find()
      .sort({ order: 1 })
      .populate('createdBy', 'name');

    res.status(200).json({
      success: true,
      count: carousels.length,
      data: carousels
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Update carousel
// @route   PUT /api/carousels/:id
// @access  Private (Admin)
exports.updateCarousel = async (req, res) => {
  try {
    const { title, description, order, isActive } = req.body;

    const updateData = { title, description, order, isActive };

    if (req.file) {
      updateData.image = req.file.path;
    }

    const carousel = await Carousel.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!carousel) {
      return res.status(404).json({
        success: false,
        message: 'Carousel not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Carousel updated successfully',
      data: carousel
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Delete carousel
// @route   DELETE /api/carousels/:id
// @access  Private (Admin)
exports.deleteCarousel = async (req, res) => {
  try {
    const carousel = await Carousel.findByIdAndDelete(req.params.id);

    if (!carousel) {
      return res.status(404).json({
        success: false,
        message: 'Carousel not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Carousel deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};
