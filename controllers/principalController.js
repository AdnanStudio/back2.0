const PrincipalInfo = require('../models/PrincipalInfo');

// @desc    Create/Update principal info
// @route   POST /api/principal
// @access  Private (Admin)
exports.createOrUpdatePrincipal = async (req, res) => {
  try {
    const { name, message, qualification, email } = req.body;

    let image = '';
    if (req.file) {
      image = req.file.path;
    }

    // Deactivate all existing principal info
    await PrincipalInfo.updateMany({}, { isActive: false });

    const updateData = { name, message, qualification, email, isActive: true };
    if (image) updateData.image = image;

    // Check if any principal info exists
    const existing = await PrincipalInfo.findOne();

    let principalInfo;
    if (existing) {
      principalInfo = await PrincipalInfo.findByIdAndUpdate(
        existing._id,
        updateData,
        { new: true, runValidators: true }
      );
    } else {
      principalInfo = await PrincipalInfo.create(updateData);
    }

    res.status(200).json({
      success: true,
      message: 'Principal information saved successfully',
      data: principalInfo
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Get principal info
// @route   GET /api/principal
// @access  Public
exports.getPrincipalInfo = async (req, res) => {
  try {
    const principalInfo = await PrincipalInfo.findOne({ isActive: true });

    res.status(200).json({
      success: true,
      data: principalInfo
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};
