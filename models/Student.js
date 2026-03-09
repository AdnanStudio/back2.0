// ============================================
// FILE PATH: backend/models/Student.js
// ============================================
const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  studentId: {
    type: String,
    required: true,
    unique: true
  },
  class: {
    type: String,
    required: true
  },
  section: {
    type: String,
    required: true
  },
  rollNumber: {
    type: Number,
    required: true
  },
  // ✅ Session যোগ করা হয়েছে (যেমন: 2024-2025)
  session: {
    type: String,
    default: ''
  },
  guardianName: {
    type: String,
    required: true
  },
  guardianPhone: {
    type: String,
    required: true
  },
  guardianEmail: {
    type: String
  },
  admissionDate: {
    type: Date,
    default: Date.now
  },
  bloodGroup: {
    type: String,
    enum: ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-', '']
  },
  previousSchool: {
    type: String
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Student', studentSchema);