const express = require('express');
const router = express.Router();
const {
  getAllMembers,
  getMember,
  createMember,
  updateMember,
  deleteMember,
  toggleMemberStatus
} = require('../controllers/governingBodyController');
const { protect, isAdmin } = require('../middleware/auth');
const { uploadGoverningBody } = require('../config/cloudinary');

// Public routes
router.get('/', getAllMembers);

// ✅ Specific sub-routes BEFORE /:id
router.put('/:id/status', protect, isAdmin, toggleMemberStatus);

router.get('/:id', getMember);

// Protected routes (Admin only)
router.post('/', protect, isAdmin, uploadGoverningBody.single('image'), createMember);
router.put('/:id', protect, isAdmin, uploadGoverningBody.single('image'), updateMember);
router.delete('/:id', protect, isAdmin, deleteMember);

module.exports = router;


// const express = require('express');
// const router = express.Router();
// const {
//   getAllMembers,
//   getMember,
//   createMember,
//   updateMember,
//   deleteMember,
//   toggleMemberStatus
// } = require('../controllers/governingBodyController');
// const { protect, isAdmin } = require('../middleware/auth');
// const { uploadGoverningBody } = require('../config/cloudinary');

// // Public routes
// router.get('/', getAllMembers);
// router.get('/:id', getMember);

// // Protected routes (Admin only)
// router.use(protect);
// router.use(isAdmin);

// router.post('/', uploadGoverningBody.single('image'), createMember);
// router.put('/:id', uploadGoverningBody.single('image'), updateMember);
// router.delete('/:id', deleteMember);
// router.put('/:id/status', toggleMemberStatus);

// module.exports = router;
