const express = require('express');
const router = express.Router();
const {
  markAttendance,
  markBulkAttendance,
  getAttendanceByClass,
  getAttendanceByStudent,
  updateAttendance,
  deleteAttendance,
  getAttendanceReport,
  markAllPresent
} = require('../controllers/attendanceController');
const { protect, authorize } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

// Mark attendance routes
router.post('/', authorize('admin', 'teacher'), markAttendance);
router.post('/bulk', authorize('admin', 'teacher'), markBulkAttendance);
router.post('/mark-all-present', authorize('admin', 'teacher'), markAllPresent);

// Get attendance routes — admin/teacher only (matches Attendance.js /
// AttendanceReport.js dashboard access). Without this, any logged-in
// user (student, staff, librarian, accountant) could look up any other
// student's attendance, or a whole class's attendance, by ID.
router.get('/class/:classId', authorize('admin', 'teacher'), getAttendanceByClass);
router.get('/student/:studentId', authorize('admin', 'teacher'), getAttendanceByStudent);
router.get('/report/:classId', authorize('admin', 'teacher'), getAttendanceReport);

// Update and delete routes
router.route('/:id')
  .put(authorize('admin', 'teacher'), updateAttendance)
  .delete(authorize('admin'), deleteAttendance);

module.exports = router;
