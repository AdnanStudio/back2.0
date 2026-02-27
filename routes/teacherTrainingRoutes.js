const express = require('express');
const router = express.Router();
const {
  getAllTrainings,
  getTraining,
  createTraining,
  updateTraining,
  deleteTraining,
  toggleTrainingStatus
} = require('../controllers/teacherTrainingController');
const { protect, isAdmin } = require('../middleware/auth');
const { uploadTeacherTraining } = require('../config/cloudinary');

// Public routes
router.get('/', getAllTrainings);

// ✅ Specific sub-routes BEFORE /:id
router.put('/:id/status', protect, isAdmin, toggleTrainingStatus);

router.get('/:id', getTraining);

// Protected routes (Admin only)
router.post('/', protect, isAdmin, uploadTeacherTraining.single('image'), createTraining);
router.put('/:id', protect, isAdmin, uploadTeacherTraining.single('image'), updateTraining);
router.delete('/:id', protect, isAdmin, deleteTraining);

module.exports = router;
