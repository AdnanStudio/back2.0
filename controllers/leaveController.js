const Leave = require('../models/Leave');
const User = require('../models/User');

// Create leave request
exports.createLeaveRequest = async (req, res) => {
  try {
    const { subject, description, startDate, endDate } = req.body;

    // Calculate days
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

    const leave = await Leave.create({
      userId: req.user._id,
      subject,
      description,
      startDate,
      endDate,
      days
    });

    const populatedLeave = await Leave.findById(leave._id).populate('userId', 'name email role profileImage');

    res.status(201).json({
      success: true,
      message: 'Leave request submitted successfully',
      data: populatedLeave
    });
  } catch (error) {
    console.error('Create leave error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit leave request',
      error: error.message
    });
  }
};

// Get all leave requests (Admin)
exports.getAllLeaveRequests = async (req, res) => {
  try {
    const { status, role } = req.query;
    let query = {};

    if (status) query.status = status;
    
    const leaves = await Leave.find(query)
      .populate('userId', 'name email role profileImage')
      .populate('approvedBy', 'name')
      .sort({ createdAt: -1 });

    // Filter by role if provided
    let filteredLeaves = leaves;
    if (role) {
      filteredLeaves = leaves.filter(leave => leave.userId?.role === role);
    }

    res.status(200).json({
      success: true,
      count: filteredLeaves.length,
      data: filteredLeaves
    });
  } catch (error) {
    console.error('Get all leaves error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch leave requests',
      error: error.message
    });
  }
};

// Get my leave requests
exports.getMyLeaveRequests = async (req, res) => {
  try {
    const leaves = await Leave.find({ userId: req.user._id })
      .populate('approvedBy', 'name')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: leaves.length,
      data: leaves
    });
  } catch (error) {
    console.error('Get my leaves error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch your leave requests',
      error: error.message
    });
  }
};

// Approve leave request
exports.approveLeaveRequest = async (req, res) => {
  try {
    const leave = await Leave.findById(req.params.id);

    if (!leave) {
      return res.status(404).json({
        success: false,
        message: 'Leave request not found'
      });
    }

    leave.status = 'approved';
    leave.approvedBy = req.user._id;
    leave.approvedAt = new Date();
    await leave.save();

    // Add notification to user
    const user = await User.findById(leave.userId);
    if (!user.notifications) {
      user.notifications = [];
    }
    user.notifications.push({
      message: `Your leave request "${leave.subject}" has been approved`,
      type: 'success',
      date: new Date()
    });
    await user.save();

    const populatedLeave = await Leave.findById(leave._id)
      .populate('userId', 'name email role profileImage')
      .populate('approvedBy', 'name');

    res.status(200).json({
      success: true,
      message: 'Leave request approved successfully',
      data: populatedLeave
    });
  } catch (error) {
    console.error('Approve leave error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to approve leave request',
      error: error.message
    });
  }
};

// Reject leave request
exports.rejectLeaveRequest = async (req, res) => {
  try {
    const { rejectionReason } = req.body;
    const leave = await Leave.findById(req.params.id);

    if (!leave) {
      return res.status(404).json({
        success: false,
        message: 'Leave request not found'
      });
    }

    // Delete the leave request
    await Leave.findByIdAndDelete(req.params.id);

    // Send notification to user if rejection reason provided
    if (rejectionReason) {
      const user = await User.findById(leave.userId);
      if (!user.notifications) {
        user.notifications = [];
      }
      user.notifications.push({
        message: `Your leave request "${leave.subject}" was rejected. Reason: ${rejectionReason}`,
        type: 'error',
        date: new Date()
      });
      await user.save();
    }

    res.status(200).json({
      success: true,
      message: 'Leave request rejected and deleted successfully'
    });
  } catch (error) {
    console.error('Reject leave error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reject leave request',
      error: error.message
    });
  }
};

// Delete leave request
exports.deleteLeaveRequest = async (req, res) => {
  try {
    const leave = await Leave.findById(req.params.id);

    if (!leave) {
      return res.status(404).json({
        success: false,
        message: 'Leave request not found'
      });
    }

    await Leave.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Leave request deleted successfully'
    });
  } catch (error) {
    console.error('Delete leave error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete leave request',
      error: error.message
    });
  }
};
