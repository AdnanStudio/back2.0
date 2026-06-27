const mongoose = require('mongoose');

const fineSchema = new mongoose.Schema({
  bookIssue: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BookIssue',
    required: true
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  reason: {
    type: String,
    required: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['Pending', 'Paid', 'Waived'],
    default: 'Pending'
  },
  paidDate: {
    type: Date
  },
  remarks: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Fine', fineSchema);
