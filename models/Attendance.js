const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: [true, 'Student is required']
  },
  class: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: [true, 'Class is required']
  },
  date: {
    type: Date,
    required: [true, 'Date is required'],
    default: Date.now
  },
  status: {
    type: String,
    enum: ['present', 'absent', 'late', 'leave'],
    required: [true, 'Status is required'],
    default: 'present'
  },
  remarks: {
    type: String,
    trim: true,
    maxlength: [200, 'Remarks cannot exceed 200 characters']
  },
  markedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Index for faster queries
attendanceSchema.index({ student: 1, date: 1, class: 1 });
attendanceSchema.index({ class: 1, date: 1 });
attendanceSchema.index({ date: 1 });

// Prevent duplicate attendance for same student on same date
attendanceSchema.index(
  { student: 1, date: 1 }, 
  { 
    unique: true,
    partialFilterExpression: { 
      date: { $exists: true },
      student: { $exists: true }
    }
  }
);

module.exports = mongoose.model('Attendance', attendanceSchema);
