const express = require('express');
const router = express.Router();
const { upload } = require('../config/cloudinary');
const {
  createPaymentRequest,
  getAllPaymentRequests,
  getPaymentRequest,
  submitPaymentProof,
  updatePaymentStatus,
  deletePaymentRequest,
  deleteAllPayments
} = require('../controllers/paymentController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

const viewPayments = authorize('admin', 'teacher', 'accountant', 'student');

router.route('/')
  .get(viewPayments, getAllPaymentRequests)
  .post(authorize('admin', 'teacher'), createPaymentRequest);

// ✅ Delete all payments route (MUST be before /:id route)
router.delete('/all/delete-all', authorize('admin'), deleteAllPayments);

router.route('/:id')
  .get(viewPayments, getPaymentRequest)
  .delete(authorize('admin'), deletePaymentRequest);

router.put('/:id/submit', authorize('student'), upload.single('paymentProof'), submitPaymentProof);
router.put('/:id/status', authorize('admin', 'teacher'), updatePaymentStatus);

module.exports = router;
