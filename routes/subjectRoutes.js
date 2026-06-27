const express = require('express');
const router = express.Router();
const {
  getAllSubjects,
  getSubjectById,
  createSubject,
  updateSubject,
  deleteSubject,
  getSubjectsByClass,
  getSubjectsByTeacher,
  toggleSubjectStatus
} = require('../controllers/subjectController');

const { protect, authorize } = require('../middleware/auth');

// Protect all routes
router.use(protect);

// ============ Main Subject Routes ============
router.route('/')
  .get(getAllSubjects)  // All authenticated users can view
  .post(authorize('admin'), createSubject);  // Only admin can create

router.route('/:id')
  .get(getSubjectById)  // All authenticated users can view
  .put(authorize('admin'), updateSubject)  // Only admin can update
  .delete(authorize('admin'), deleteSubject);  // Only admin can delete

// ============ Special Routes ============
router.get('/class/:classId', getSubjectsByClass);  // Get subjects by class
router.get('/teacher/:teacherId', getSubjectsByTeacher);  // Get subjects by teacher
router.patch('/:id/toggle-status', authorize('admin'), toggleSubjectStatus);  // Toggle active status

module.exports = router;
