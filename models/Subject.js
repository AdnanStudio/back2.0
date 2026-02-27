const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Subject name is required'],
    trim: true
  },
  code: {
    type: String,
    trim: true,
    uppercase: true
  },
  class: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class'
  },
  department: {
    type: String,
    trim: true
  },
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Teacher'
  },
  // ===== MARK CONFIGURATION =====
  theoryFullMarks: {
    type: Number,
    default: 100
  },
  hasPractical: {
    type: Boolean,
    default: false
  },
  practicalFullMarks: {
    type: Number,
    default: 0
  },
  hasMCQ: {
    type: Boolean,
    default: false
  },
  mcqFullMarks: {
    type: Number,
    default: 0
  },
  passMarks: {
    type: Number,
    default: 33
  },
  // ==============================
  description: {
    type: String
  },
  isActive: {
    type: Boolean,
    default: true
  },
  order: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

subjectSchema.index({ class: 1, isActive: 1 });

module.exports = mongoose.model('Subject', subjectSchema);
