const express = require('express');
const router = express.Router();
const {
  getAllMembers,
  getMember,
  createMember,
  updateMember,
  deleteMember,
  toggleMemberStatus
} = require('../controllers/clubController');
const { protect, isAdmin } = require('../middleware/auth');
const { uploadClubMember } = require('../config/cloudinary');

// Public routes
router.get('/', getAllMembers);

// ✅ Specific sub-routes BEFORE /:id
router.put('/:id/status', protect, isAdmin, toggleMemberStatus);

router.get('/:id', getMember);

// Protected routes (Admin only)
router.post('/', protect, isAdmin, uploadClubMember.single('image'), createMember);
router.put('/:id', protect, isAdmin, uploadClubMember.single('image'), updateMember);
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
// } = require('../controllers/clubController');
// const { protect, isAdmin } = require('../middleware/auth');
// const { upload } = require('../config/cloudinary');

// // Public routes
// router.get('/', getAllMembers);
// router.get('/:id', getMember);

// // Protected routes (Admin only)
// router.use(protect);
// router.use(isAdmin);

// router.post('/', upload.single('image'), createMember);
// router.put('/:id', upload.single('image'), updateMember);
// router.delete('/:id', deleteMember);
// router.put('/:id/status', toggleMemberStatus);

// module.exports = router;