// FILE PATH: routes/markRoutes.js
// ============================================================
//
// SECURITY FIX: previously every route here only used `protect` (i.e. any
// logged-in user — student, staff, librarian, accountant — could call
// class-wide and per-student mark endpoints, including unpublished marks,
// and could create/edit/delete/publish marks). Only two routes are
// inherently safe to leave open to all roles:
//   - GET /my     → scoped server-side to req.user's own student record
//   - GET /exams  → aggregate exam names only, no student-identifying data
// Everything else now requires admin or teacher.

const express = require('express');
const router  = express.Router();

const { protect, authorize } = require('../middleware/auth');
const ctrl        = require('../controllers/markController');

const staffOnly = authorize('admin', 'teacher');

// ── Class-level routes (NEW — must come before /:id) ──────────
router.get('/class/:classId/students', protect, staffOnly, ctrl.getClassStudentsForMarks); // Marks.js loadEntry
router.get('/class/:classId',          protect, staffOnly, ctrl.getClassMarks);            // Marks.js loadView
router.get('/stats/:classId',          protect, staffOnly, ctrl.getClassStatsByClassId);   // Marks.js loadStats

router.put('/publish',   protect, staffOnly, ctrl.publishClassMarks);   // Marks.js handlePublish
router.put('/unpublish', protect, staffOnly, ctrl.unpublishClassMarks); // Marks.js handleUnpublish

// ── Named GET routes — must come BEFORE /:id ─────────────────
router.get('/my',              protect,             ctrl.getMyMarks);              // student's own results — self-scoped, open to any role
router.get('/stats',           protect, staffOnly,  ctrl.getClassStats);           // class stats (query params)
router.get('/exams',           protect,             ctrl.getExamList);             // distinct exam list — no student data, open to any role
router.get('/student/:studentId', protect, staffOnly, ctrl.getStudentMarks);      // specific student — admin/teacher only (includes unpublished marks)

// ── General CRUD ──────────────────────────────────────────────
router.get('/',    protect, staffOnly, ctrl.getAllMarks);
router.get('/:id', protect, staffOnly, ctrl.getMarkById);

router.post('/',              protect, staffOnly, ctrl.saveMarks);
router.post('/bulk',          protect, staffOnly, ctrl.saveBulkMarks);     // supports both Format A and B
router.post('/publish-class', protect, staffOnly, ctrl.publishClassResults);

router.put('/:id',            protect, staffOnly, ctrl.updateMark);
router.patch('/:id/publish',  protect, staffOnly, ctrl.togglePublish);
router.delete('/:id',         protect, staffOnly, ctrl.deleteMark);

module.exports = router;
