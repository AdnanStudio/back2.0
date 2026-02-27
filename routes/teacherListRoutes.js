const express = require('express');
const router = express.Router();
const {
  getAllTeachers,
  getTeacher,
  createTeacher,
  updateTeacher,
  deleteTeacher,
  toggleTeacherStatus
} = require('../controllers/teacherListController');
const { protect, isAdmin } = require('../middleware/auth');
const { uploadTeacherList } = require('../config/cloudinary');

// Public routes
router.get('/', getAllTeachers);

// ✅ Specific sub-routes BEFORE /:id
router.put('/:id/status', protect, isAdmin, toggleTeacherStatus);

router.get('/:id', getTeacher);

// Protected routes (Admin only)
router.post('/', protect, isAdmin, uploadTeacherList.single('image'), createTeacher);
router.put('/:id', protect, isAdmin, uploadTeacherList.single('image'), updateTeacher);
router.delete('/:id', protect, isAdmin, deleteTeacher);

module.exports = router;


// const express = require('express');
// const router = express.Router();
// const {
//   getAllTeachers,
//   getTeacher,
//   createTeacher,
//   updateTeacher,
//   deleteTeacher,
//   toggleTeacherStatus
// } = require('../controllers/teacherListController');
// const { protect, isAdmin } = require('../middleware/auth');
// const { upload } = require('../config/cloudinary');

// // Public routes
// router.get('/', getAllTeachers);
// router.get('/:id', getTeacher);

// // Protected routes (Admin only)
// router.use(protect);
// router.use(isAdmin);

// router.post('/', upload.single('image'), createTeacher);
// router.put('/:id', upload.single('image'), updateTeacher);
// router.delete('/:id', deleteTeacher);
// router.put('/:id/status', toggleTeacherStatus);

// module.exports = router;