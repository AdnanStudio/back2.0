const mongoose = require('mongoose');

const periodSchema = new mongoose.Schema({
  periodNumber: {
    type: Number,
    required: true
  },
  startTime: {
    type: String,
    required: true
  },
  endTime: {
    type: String,
    required: true
  },
  subject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: true
  },
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Teacher',
    required: true
  },
  room: {
    type: String,
    default: ''
  }
});

const dayScheduleSchema = new mongoose.Schema({
  day: {
    type: String,
    enum: ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    required: true
  },
  periods: [periodSchema]
});

const classRoutineSchema = new mongoose.Schema({
  class: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: true
  },
  academicYear: {
    type: String,
    required: true,
    default: new Date().getFullYear().toString()
  },
  schedule: [dayScheduleSchema],
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Ensure one active routine per class per academic year
classRoutineSchema.index({ class: 1, academicYear: 1, isActive: 1 });

module.exports = mongoose.model('ClassRoutine', classRoutineSchema);
