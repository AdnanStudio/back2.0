const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const {
  createAdmission,
  getAllAdmissions,
  deleteAdmission,
  deleteAllAdmissions,
  exportAdmissions
} = require('../controllers/admissionController');
const { protect, authorize } = require('../middleware/auth');

// Create uploads directory if it doesn't exist
const uploadDir = 'uploads/';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Public route - Submit admission
router.post('/', upload.fields([
  { name: 'profilePicture', maxCount: 1 },
  { name: 'sscCertificate', maxCount: 1 },
  { name: 'hscCertificate', maxCount: 1 },
  { name: 'testimonial', maxCount: 1 },
  { name: 'nidCopy', maxCount: 1 },
  { name: 'birthCertificate', maxCount: 1 }
]), createAdmission);

// Protected routes - Admin & Teacher only
router.get('/', protect, authorize('admin', 'teacher'), getAllAdmissions);
router.delete('/:id', protect, authorize('admin', 'teacher'), deleteAdmission);
router.delete('/', protect, authorize('admin', 'teacher'), deleteAllAdmissions);
router.get('/export', protect, authorize('admin', 'teacher'), exportAdmissions);

module.exports = router;



// const express = require('express');
// const router = express.Router();
// const upload = require('../middleware/upload'); // Import from middleware
// const {
//   createAdmission,
//   getAllAdmissions,
//   deleteAdmission,
//   deleteAllAdmissions,
//   exportAdmissions
// } = require('../controllers/admissionController');
// const { protect, authorize } = require('../middleware/auth');

// // Public route - Submit admission
// router.post('/', upload.fields([
//   { name: 'profilePicture', maxCount: 1 },
//   { name: 'sscCertificate', maxCount: 1 },
//   { name: 'hscCertificate', maxCount: 1 },
//   { name: 'testimonial', maxCount: 1 },
//   { name: 'nidCopy', maxCount: 1 },
//   { name: 'birthCertificate', maxCount: 1 }
// ]), createAdmission);

// // Protected routes - Admin & Teacher only
// router.get('/', protect, authorize('admin', 'teacher'), getAllAdmissions);
// router.delete('/:id', protect, authorize('admin', 'teacher'), deleteAdmission);
// router.delete('/', protect, authorize('admin', 'teacher'), deleteAllAdmissions);
// router.get('/export', protect, authorize('admin', 'teacher'), exportAdmissions);

// module.exports = router;
