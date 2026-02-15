const GoverningBodyMember = require('../models/GoverningBodyMember');
const { cloudinary } = require('../config/cloudinary');

// @desc    Get all governing body members
// @route   GET /api/governing-body
// @access  Public
exports.getAllMembers = async (req, res) => {
  try {
    const members = await GoverningBodyMember.find({ isActive: true })
      .sort({ order: 1, createdAt: -1 });

    res.status(200).json({
      success: true,
      count: members.length,
      data: members
    });
  } catch (error) {
    console.error('Get members error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch members',
      error: error.message
    });
  }
};

// @desc    Get single member
// @route   GET /api/governing-body/:id
// @access  Public
exports.getMember = async (req, res) => {
  try {
    const member = await GoverningBodyMember.findById(req.params.id);

    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Member not found'
      });
    }

    res.status(200).json({
      success: true,
      data: member
    });
  } catch (error) {
    console.error('Get member error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch member',
      error: error.message
    });
  }
};

// @desc    Create new member
// @route   POST /api/governing-body
// @access  Private/Admin
exports.createMember = async (req, res) => {
  try {
    const memberData = { ...req.body };

    // Handle image upload
    if (req.file) {
      memberData.image = {
        url: req.file.path,
        publicId: req.file.filename
      };
    }

    const member = await GoverningBodyMember.create(memberData);

    res.status(201).json({
      success: true,
      message: 'Member created successfully',
      data: member
    });
  } catch (error) {
    console.error('Create member error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create member',
      error: error.message
    });
  }
};

// @desc    Update member
// @route   PUT /api/governing-body/:id
// @access  Private/Admin
exports.updateMember = async (req, res) => {
  try {
    let member = await GoverningBodyMember.findById(req.params.id);

    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Member not found'
      });
    }

    const updateData = { ...req.body };

    // Handle new image upload
    if (req.file) {
      // Delete old image from Cloudinary
      if (member.image?.publicId) {
        try {
          await cloudinary.uploader.destroy(member.image.publicId);
        } catch (err) {
          console.error('Cloudinary delete error:', err);
        }
      }

      updateData.image = {
        url: req.file.path,
        publicId: req.file.filename
      };
    }

    member = await GoverningBodyMember.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Member updated successfully',
      data: member
    });
  } catch (error) {
    console.error('Update member error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update member',
      error: error.message
    });
  }
};

// @desc    Delete member
// @route   DELETE /api/governing-body/:id
// @access  Private/Admin
exports.deleteMember = async (req, res) => {
  try {
    const member = await GoverningBodyMember.findById(req.params.id);

    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Member not found'
      });
    }

    // Delete image from Cloudinary
    if (member.image?.publicId) {
      try {
        await cloudinary.uploader.destroy(member.image.publicId);
      } catch (err) {
        console.error('Cloudinary delete error:', err);
      }
    }

    await member.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Member deleted successfully'
    });
  } catch (error) {
    console.error('Delete member error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete member',
      error: error.message
    });
  }
};

// @desc    Toggle member status
// @route   PUT /api/governing-body/:id/status
// @access  Private/Admin
exports.toggleMemberStatus = async (req, res) => {
  try {
    const member = await GoverningBodyMember.findById(req.params.id);

    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Member not found'
      });
    }

    member.isActive = !member.isActive;
    await member.save();

    res.status(200).json({
      success: true,
      message: `Member ${member.isActive ? 'activated' : 'deactivated'} successfully`,
      data: { isActive: member.isActive }
    });
  } catch (error) {
    console.error('Toggle status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle status',
      error: error.message
    });
  }
};
