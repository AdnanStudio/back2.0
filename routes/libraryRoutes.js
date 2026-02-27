const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { uploadBookImage } = require('../config/cloudinary');
const {
  getAllBooks,
  getBook,
  createBook,
  updateBook,
  deleteBook,
  issueBook,
  returnBook,
  getAllIssues,
  getIssueById,
  getAllFines,
  updateFineStatus,
  getLibraryStats
} = require('../controllers/libraryController');

// Protect all routes
router.use(protect);

// ── Stats (before /books to avoid conflicts) ──────────────────
router.get('/stats', authorize('admin', 'librarian'), getLibraryStats);

// ── Book Routes ───────────────────────────────────────────────
router.route('/books')
  .get(authorize('admin', 'librarian'), getAllBooks)
  .post(authorize('admin', 'librarian'), uploadBookImage.single('bookImage'), createBook);

router.route('/books/:id')
  .get(authorize('admin', 'librarian'), getBook)
  .put(authorize('admin', 'librarian'), uploadBookImage.single('bookImage'), updateBook)
  .delete(authorize('admin', 'librarian'), deleteBook);

// ── Issue Routes ──────────────────────────────────────────────
// GET all issues
router.get('/issues', authorize('admin', 'librarian'), getAllIssues);

// POST issue a book  (frontend calls POST /library/issues)
router.post('/issues', authorize('admin', 'librarian'), issueBook);
// Also keep old /issue path for backward compat
router.post('/issue', authorize('admin', 'librarian'), issueBook);

// ✅ Specific sub-routes BEFORE /:id
// PUT return a book  (frontend calls PUT /library/issues/:id/return)
router.put('/issues/:issueId/return', authorize('admin', 'librarian'), returnBook);
// Old path backward compat
router.put('/return/:issueId', authorize('admin', 'librarian'), returnBook);

// GET single issue
router.get('/issues/:id', authorize('admin', 'librarian'), getIssueById);

// ── Fine Routes ───────────────────────────────────────────────
router.get('/fines', authorize('admin', 'librarian'), getAllFines);

// Frontend calls PUT /library/fines/:id/pay  and  PUT /library/fines/:id/waive
// Backend updateFineStatus reads { status } from body — send status:'Paid' or status:'Waived'
router.put('/fines/:fineId/pay',   authorize('admin', 'librarian'), (req, res, next) => {
  req.body.status = 'Paid';
  next();
}, updateFineStatus);

router.put('/fines/:fineId/waive', authorize('admin', 'librarian'), (req, res, next) => {
  req.body.status = 'Waived';
  next();
}, updateFineStatus);

// Generic fine update (old path)
router.put('/fines/:fineId', authorize('admin', 'librarian'), updateFineStatus);

module.exports = router;


// const express = require('express');
// const router = express.Router();
// const { protect, authorize } = require('../middleware/auth');
// const { uploadBookImage } = require('../config/cloudinary');
// const {
//   getAllBooks,
//   getBook,
//   createBook,
//   updateBook,
//   deleteBook,
//   issueBook,
//   returnBook,
//   getAllIssues,
//   getAllFines,
//   updateFineStatus,
//   getLibraryStats
// } = require('../controllers/libraryController');

// // Protect all routes
// router.use(protect);

// // Book Routes (Admin & Librarian only)
// router.route('/books')
//   .get(authorize('admin', 'librarian'), getAllBooks)
//   .post(authorize('admin', 'librarian'), uploadBookImage.single('bookImage'), createBook);

// router.route('/books/:id')
//   .get(authorize('admin', 'librarian'), getBook)
//   .put(authorize('admin', 'librarian'), uploadBookImage.single('bookImage'), updateBook)
//   .delete(authorize('admin', 'librarian'), deleteBook);

// // Issue/Return Routes (Admin & Librarian only)
// router.post('/issue', authorize('admin', 'librarian'), issueBook);
// router.put('/return/:issueId', authorize('admin', 'librarian'), returnBook);
// router.get('/issues', authorize('admin', 'librarian'), getAllIssues);

// // Fine Routes (Admin & Librarian only)
// router.get('/fines', authorize('admin', 'librarian'), getAllFines);
// router.put('/fines/:fineId', authorize('admin', 'librarian'), updateFineStatus);

// // Statistics Route (Admin & Librarian only)
// router.get('/stats', authorize('admin', 'librarian'), getLibraryStats);

// module.exports = router;