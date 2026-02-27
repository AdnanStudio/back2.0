const mongoose = require('mongoose');

const teacherListSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Teacher name is required'],
    trim: true
  },
  image: {
    url: String,
    publicId: String
  },
  designation: {
    type: String,
    required: [true, 'Designation is required'],
    trim: true
  },
  department: {
    type: String,
    trim: true,
    default: ''
  },
  teacherId: {
    type: String,
    trim: true,
    default: ''
  },
  phone: {
    type: String,
    trim: true,
    default: ''
  },
  email: {
    type: String,
    trim: true,
    default: ''
  },
  qualification: {
    type: String,
    trim: true,
    default: ''
  },
  subjects: [{
    type: String
  }],
  experience: {
    type: String,
    trim: true,
    default: ''
  },
  joiningDate: {
    type: Date
  },
  bloodGroup: {
    type: String,
    trim: true,
    default: ''
  },
  status: {
    type: String,
    enum: ['active', 'on-leave', 'resigned', 'retired'],
    default: 'active'
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

teacherListSchema.index({ order: 1, createdAt: -1 });
teacherListSchema.index({ name: 'text', designation: 'text', department: 'text' });

module.exports = mongoose.model('TeacherList', teacherListSchema);
