const PaymentRequest = require('../models/PaymentRequest');
const Student = require('../models/Student');
const Notification = require('../models/Notification');

// @desc    Create payment request
// @route   POST /api/payments
// @access  Private (Admin/Teacher)
exports.createPaymentRequest = async (req, res) => {
  try {
    const { student, amount, purpose, description, dueDate } = req.body;

    const paymentRequest = await PaymentRequest.create({
      student,
      amount,
      purpose,
      description,
      dueDate,
      requestedBy: req.user._id
    });

    // Get student's userId for notification
    const studentData = await Student.findById(student).populate('userId');

    // Create notification for student
    await Notification.create({
      recipient: studentData.userId?._id || studentData.userId,
      type: 'payment',
      title: 'New Payment Request',
      message: `You have a new payment request of ৳${amount} for ${purpose}`,
      link: `/dashboard/payments/${paymentRequest._id}`,
      relatedId: paymentRequest._id
    });

    res.status(201).json({
      success: true,
      message: 'Payment request created successfully',
      data: paymentRequest
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Get all payment requests
// @route   GET /api/payments
// @access  Private
exports.getAllPaymentRequests = async (req, res) => {
  try {
    let query = {};

    // If student, show only their payments
    if (req.user.role === 'student') {
      const student = await Student.findOne({ userId: req.user._id });
      query.student = student._id;
    }

    const payments = await PaymentRequest.find(query)
      .populate({
        path: 'student',
        populate: { path: 'userId', select: 'name email profileImage' }
      })
      .populate('requestedBy', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: payments.length,
      data: payments
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Get single payment request
// @route   GET /api/payments/:id
// @access  Private
exports.getPaymentRequest = async (req, res) => {
  try {
    const payment = await PaymentRequest.findById(req.params.id)
      .populate({
        path: 'student',
        populate: { path: 'userId', select: 'name email phone profileImage' }
      })
      .populate('requestedBy', 'name email');

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment request not found'
      });
    }

    res.status(200).json({
      success: true,
      data: payment
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Submit payment proof
// @route   PUT /api/payments/:id/submit
// @access  Private (Student)
exports.submitPaymentProof = async (req, res) => {
  try {
    const { transactionId, remarks } = req.body;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload payment proof image'
      });
    }

    const payment = await PaymentRequest.findById(req.params.id);

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment request not found'
      });
    }

    payment.paymentProof = req.file.path;
    payment.transactionId = transactionId;
    payment.remarks = remarks;
    payment.status = 'paid';
    payment.paymentDate = Date.now();

    await payment.save();

    // Notify admin/teacher
    await Notification.create({
      recipient: payment.requestedBy,
      type: 'payment',
      title: 'Payment Submitted',
      message: `Payment proof submitted for ৳${payment.amount}`,
      link: `/dashboard/payments/${payment._id}`,
      relatedId: payment._id
    });

    res.status(200).json({
      success: true,
      message: 'Payment proof submitted successfully',
      data: payment
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Update payment status
// @route   PUT /api/payments/:id/status
// @access  Private (Admin/Teacher)
exports.updatePaymentStatus = async (req, res) => {
  try {
    const { status, remarks } = req.body;

    const payment = await PaymentRequest.findByIdAndUpdate(
      req.params.id,
      { status, remarks },
      { new: true, runValidators: true }
    ).populate('student');

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment request not found'
      });
    }

    // Notify student
    const student = await Student.findById(payment.student).populate('userId');
    await Notification.create({
      recipient: student.userId?._id || student.userId,
      type: 'payment',
      title: 'Payment Status Updated',
      message: `Your payment status has been updated to: ${status}`,
      link: `/dashboard/payments/${payment._id}`,
      relatedId: payment._id
    });

    res.status(200).json({
      success: true,
      message: 'Payment status updated successfully',
      data: payment
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Delete single payment request
// @route   DELETE /api/payments/:id
// @access  Private (Admin only)
exports.deletePaymentRequest = async (req, res) => {
  try {
    const payment = await PaymentRequest.findById(req.params.id);

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment request not found'
      });
    }

    await PaymentRequest.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Payment request deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Delete all payment requests
// @route   DELETE /api/payments/all/delete-all
// @access  Private (Admin only)
exports.deleteAllPayments = async (req, res) => {
  try {
    const result = await PaymentRequest.deleteMany({});

    res.status(200).json({
      success: true,
      message: `Successfully deleted ${result.deletedCount} payment requests`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};
