const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  createLeaveRequest,
  getAllLeaveRequests,
  getMyLeaveRequests,
  approveLeaveRequest,
  rejectLeaveRequest,
  deleteLeaveRequest
} = require('../controllers/leaveController');

// All authenticated users can create and view their leaves
router.post('/', protect, createLeaveRequest);
router.get('/my-leaves', protect, getMyLeaveRequests);

// Admin only routes
router.get('/', protect, authorize('admin'), getAllLeaveRequests);
router.put('/:id/approve', protect, authorize('admin'), approveLeaveRequest);
router.put('/:id/reject', protect, authorize('admin'), rejectLeaveRequest);
router.delete('/:id', protect, authorize('admin'), deleteLeaveRequest);

module.exports = router;
