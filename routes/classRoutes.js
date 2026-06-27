const express = require('express');
const router = express.Router();
const {
  createClass,
  getAllClasses,
  getClass,
  updateClass,
  deleteClass,
  addStudentToClass,
  removeStudentFromClass
} = require('../controllers/classController');
const { protect, authorize } = require('../middleware/auth');

// Protect all routes
router.use(protect);

// Main class routes
router.route('/')
  .get(getAllClasses)
  .post(authorize('admin'), createClass);

router.route('/:id')
  .get(getClass)
  .put(authorize('admin'), updateClass)
  .delete(authorize('admin'), deleteClass);

// Student management routes
router.post('/:id/students', authorize('admin', 'teacher'), addStudentToClass);
router.delete('/:id/students/:studentId', authorize('admin', 'teacher'), removeStudentFromClass);

module.exports = router;
