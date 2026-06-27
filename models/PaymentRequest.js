const mongoose = require('mongoose');

const paymentRequestSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  purpose: {
    type: String,
    required: true,
    enum: ['tuition_fee', 'exam_fee', 'admission_fee', 'library_fee', 'transport_fee', 'other']
  },
  description: {
    type: String
  },
  dueDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'paid', 'rejected', 'overdue'],
    default: 'pending'
  },
  paymentProof: {
    type: String
  },
  paymentDate: {
    type: Date
  },
  transactionId: {
    type: String
  },
  remarks: {
    type: String
  },
  requestedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('PaymentRequest', paymentRequestSchema);
