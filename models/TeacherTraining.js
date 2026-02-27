const mongoose = require('mongoose');

const teacherTrainingSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Training name is required'],
    trim: true
  },
  image: {
    url: String,
    publicId: String
  },
  description: {
    type: String,
    default: ''
  },
  trainer: {
    type: String,
    default: ''
  },
  trainingType: {
    type: String,
    default: ''
  },
  phone: {
    type: String,
    default: ''
  },
  startDate: {
    type: Date
  },
  endDate: {
    type: Date
  },
  duration: {
    type: String,
    default: ''
  },
  venue: {
    type: String,
    default: ''
  },
  totalSeats: {
    type: Number,
    default: 0
  },
  budget: {
    type: String,
    default: ''
  },
  materials: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['upcoming', 'ongoing', 'completed', 'cancelled'],
    default: 'upcoming'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  order: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

module.exports = mongoose.model('TeacherTraining', teacherTrainingSchema);
