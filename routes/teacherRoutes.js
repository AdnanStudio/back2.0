const express = require('express');
const router = express.Router();

// ✅ Use uploadUserProfile (dedicated Cloudinary storage for user profiles)
// Folder: school-management/users/
const { uploadUserProfile } = require('../config/cloudinary');

const {
  createTeacher,
  getAllTeachers,
  getTeacher,
  updateTeacher,
  deleteTeacher,
  getTeachersBySubject,
  toggleTeacherStatus,
  getTeacherProfile
} = require('../controllers/teacherController');
const { protect, authorize } = require('../middleware/auth');

// All routes protected
router.use(protect);

// Teacher own profile (must be before /:id)
router.get('/profile', authorize('teacher'), getTeacherProfile);

// Teachers list & create
router.route('/')
  .get(getAllTeachers)
  .post(authorize('admin'), uploadUserProfile.single('profileImage'), createTeacher);

// Get teachers by subject
router.get('/subject/:subjectName', getTeachersBySubject);

// Single teacher CRUD
router.route('/:id')
  .get(getTeacher)
  .put(authorize('admin'), uploadUserProfile.single('profileImage'), updateTeacher)
  .delete(authorize('admin'), deleteTeacher);

// Toggle teacher active status
router.put('/:id/status', authorize('admin'), toggleTeacherStatus);

module.exports = router;