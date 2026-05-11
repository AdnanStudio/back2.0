// FILE PATH: routes/markRoutes.js
// ============================================================

const express = require('express');
const router  = express.Router();

const { protect } = require('../middleware/auth');
const ctrl        = require('../controllers/markController');

// ── Class-level routes (NEW — must come before /:id) ──────────
router.get('/class/:classId/students', protect, ctrl.getClassStudentsForMarks); // Marks.js loadEntry
router.get('/class/:classId',          protect, ctrl.getClassMarks);            // Marks.js loadView
router.get('/stats/:classId',          protect, ctrl.getClassStatsByClassId);   // Marks.js loadStats

router.put('/publish',   protect, ctrl.publishClassMarks);   // Marks.js handlePublish
router.put('/unpublish', protect, ctrl.unpublishClassMarks); // Marks.js handleUnpublish

// ── Named GET routes — must come BEFORE /:id ─────────────────
router.get('/my',              protect, ctrl.getMyMarks);              // student's own results
router.get('/stats',           protect, ctrl.getClassStats);           // class stats (query params)
router.get('/exams',           protect, ctrl.getExamList);             // distinct exam list
router.get('/student/:studentId', protect, ctrl.getStudentMarks);     // specific student

// ── General CRUD ──────────────────────────────────────────────
router.get('/',    protect, ctrl.getAllMarks);
router.get('/:id', protect, ctrl.getMarkById);

router.post('/',              protect, ctrl.saveMarks);
router.post('/bulk',          protect, ctrl.saveBulkMarks);     // supports both Format A and B
router.post('/publish-class', protect, ctrl.publishClassResults);

router.put('/:id',            protect, ctrl.updateMark);
router.patch('/:id/publish',  protect, ctrl.togglePublish);
router.delete('/:id',         protect, ctrl.deleteMark);

module.exports = router;