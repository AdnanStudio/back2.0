const express = require('express');
const router = express.Router();
const { upload } = require('../config/cloudinary');
const {
  createOrUpdatePrincipal,
  getPrincipalInfo
} = require('../controllers/principalController');
const { protect, authorize } = require('../middleware/auth');

router.get('/', getPrincipalInfo);
router.post('/', protect, authorize('admin'), upload.single('image'), createOrUpdatePrincipal);

module.exports = router;
