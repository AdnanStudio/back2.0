const express = require('express');
const router  = express.Router();
const { protect, authorize } = require('../middleware/auth');

const {
  getClassStudentsForMark,
  saveMark,
  saveBulkMarks,
  getClassMarks,
  getMarkStats,
  getAdmitCardData,
  getResultSheetData,
  getStudentMarks,
  getMark,
  publishMarks,
  unpublishMarks,
  deleteMark,
} = require('../controllers/markController');

// All routes require auth
router.use(protect);

// ────────────────────────────────────────────────────────────
// IMPORTANT: Specific routes MUST come before generic /:id
// ────────────────────────────────────────────────────────────

// PUT actions (no :id conflict possible)
router.put('/publish',   authorize('admin'), publishMarks);
router.put('/unpublish', authorize('admin'), unpublishMarks);

// POST actions
router.post('/bulk', authorize('admin', 'teacher'), saveBulkMarks);
router.post('/',     authorize('admin', 'teacher'), saveMark);

// GET: nested routes with sub-paths (these come before /:id)
router.get('/class/:classId/students', authorize('admin', 'teacher'), getClassStudentsForMark);
router.get('/class/:classId',          authorize('admin', 'teacher'), getClassMarks);
router.get('/stats/:classId',          authorize('admin', 'teacher'), getMarkStats);
router.get('/admit-card/:classId',     authorize('admin'),            getAdmitCardData);
router.get('/result-sheet/:classId',                                  getResultSheetData);
router.get('/student/:studentId',                                     getStudentMarks);

// GET/DELETE: generic /:id (MUST come last)
router.get('/:id',    getMark);
router.delete('/:id', authorize('admin'), deleteMark);

module.exports = router;
