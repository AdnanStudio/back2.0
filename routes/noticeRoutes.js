// // FILE PATH: routes/noticeRoutes.js  ← BACKEND
// const express = require('express');
// const router  = express.Router();
// const { upload } = require('../config/cloudinary');
// const {
//   createNotice, getAllNotices, getNotice,
//   updateNotice, deleteNotice,
//   deleteAttachment, deleteDriveLink,
//   getPublicNotices
// } = require('../controllers/noticeController');
// const { protect, authorize } = require('../middleware/auth');

// // Public
// router.get('/public',     getPublicNotices);
// router.get('/public/:id', getNotice);

// // Protected
// router.use(protect);

// router.route('/')
//   .get(getAllNotices)
//   .post(authorize('admin','teacher'), upload.array('attachments', 5), createNotice);

// router.route('/:id')
//   .get(getNotice)
//   .put(authorize('admin','teacher'), upload.array('attachments', 5), updateNotice)
//   .delete(authorize('admin','teacher'), deleteNotice);

// router.delete('/:id/attachments/:attachmentId', authorize('admin','teacher'), deleteAttachment);
// router.delete('/:id/drivelinks/:linkId',        authorize('admin','teacher'), deleteDriveLink);

// module.exports = router;

// FILE PATH: routes/noticeRoutes.js  ← BACKEND
const express = require('express');
const router  = express.Router();
const { upload }  = require('../config/cloudinary');
const {
  createNotice, getAllNotices, getNotice,
  updateNotice, deleteNotice,
  deleteAttachment, deleteDriveLink,
  getPublicNotices,
} = require('../controllers/noticeController');
const { protect, authorize } = require('../middleware/auth');

// Public
router.get('/public',     getPublicNotices);
router.get('/public/:id', getNotice);

// Protected
router.use(protect);

router.route('/')
  .get(getAllNotices)
  .post(authorize('admin', 'teacher'), upload.array('attachments', 5), createNotice);

router.route('/:id')
  .get(getNotice)
  .put(authorize('admin', 'teacher'),    upload.array('attachments', 5), updateNotice)
  .delete(authorize('admin', 'teacher'), deleteNotice);

router.delete('/:id/attachments/:attachmentId', authorize('admin', 'teacher'), deleteAttachment);
router.delete('/:id/drivelinks/:linkId',         authorize('admin', 'teacher'), deleteDriveLink);

module.exports = router;