const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { upload } = require('../config/cloudinary');
const assignmentController = require('../controllers/assignmentController');

// Admin & Teacher routes
router.post(
  '/',
  protect,
  authorize('admin', 'teacher'),
  upload.single('file'),
  assignmentController.createAssignment
);

router.get(
  '/',
  protect,
  authorize('admin', 'teacher'),
  assignmentController.getAllAssignments
);

router.get(
  '/:id',
  protect,
  assignmentController.getAssignmentById
);

router.put(
  '/:id',
  protect,
  authorize('admin', 'teacher'),
  upload.single('file'),
  assignmentController.updateAssignment
);

router.delete(
  '/:id',
  protect,
  authorize('admin', 'teacher'),
  assignmentController.deleteAssignment
);

router.post(
  '/:id/marks',
  protect,
  authorize('admin', 'teacher'),
  assignmentController.submitMarks
);

// Student routes
router.get(
  '/student/my-assignments',
  protect,
  authorize('student'),
  assignmentController.getStudentAssignments
);

module.exports = router;
