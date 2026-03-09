const express = require('express');
const router = express.Router();

// ✅ Use uploadStudentProfile (dedicated Cloudinary storage for students)
// Folder: school-management/students/{year}/{class}/
const { uploadStudentProfile } = require('../config/cloudinary');

const {
  createStudent,
  getAllStudents,
  getStudent,
  updateStudent,
  deleteStudent,
  getStudentsByClass,
  toggleStudentStatus,
  getStudentProfile
} = require('../controllers/studentController');
const { protect, authorize } = require('../middleware/auth');

// All routes are protected
router.use(protect);

// Student own profile (must be before /:id)
router.get('/profile', authorize('student'), getStudentProfile);

// Admin and Teacher can create, view students
router.route('/')
  .get(getAllStudents)
  .post(authorize('admin', 'teacher'), uploadStudentProfile.single('profileImage'), createStudent);

// Get students by class
router.get('/class/:className/:section', getStudentsByClass);

// Single student operations
router.route('/:id')
  .get(getStudent)
  .put(authorize('admin', 'teacher'), uploadStudentProfile.single('profileImage'), updateStudent)
  .delete(authorize('admin'), deleteStudent);

// Toggle student status (activate/deactivate)
router.put('/:id/status', authorize('admin'), toggleStudentStatus);

module.exports = router;