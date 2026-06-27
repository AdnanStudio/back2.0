const express = require('express');
const router = express.Router();
const {
  createRoutine,
  getAllRoutines,
  getRoutineById,
  updateRoutine,
  deleteRoutine,
  getRoutineByClass
} = require('../controllers/classRoutineController');

const { protect, authorize } = require('../middleware/auth');

// Admin only routes
router.post('/', protect, authorize('admin'), createRoutine);
router.put('/:id', protect, authorize('admin'), updateRoutine);
router.delete('/:id', protect, authorize('admin'), deleteRoutine);

// All authenticated users
router.get('/', protect, getAllRoutines);
router.get('/:id', protect, getRoutineById);
router.get('/class/:classId', protect, getRoutineByClass);

module.exports = router;
