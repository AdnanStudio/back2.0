const express = require('express');
const router = express.Router();
const { protect, isAdmin } = require('../middleware/auth');
const { uploadUserProfile } = require('../config/cloudinary');
const {
  createUser,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  uploadProfilePic
} = require('../controllers/userController');

// ✅ All routes require authentication and admin role
router.use(protect);
router.use(isAdmin);

// ✅ Create new user (Staff/Librarian/Accountant)
router.post('/create', createUser);

// ✅ Get all users
router.get('/', getAllUsers);

// ✅ Get single user by ID
router.get('/:id', getUserById);

// ✅ Update user
router.put('/:id', updateUser);

// ✅ Delete user
router.delete('/:id', deleteUser);

// ✅ Upload profile picture
router.post('/upload-pic/:id', uploadUserProfile.single('profileImage'), uploadProfilePic);

module.exports = router;
