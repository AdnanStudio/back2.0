const mongoose = require('mongoose');

const clubMemberSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Club name is required'],
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
  category: {
    type: String,
    default: 'Other'
  },
  advisor: {
    type: String,
    default: ''
  },
  president: {
    type: String,
    default: ''
  },
  vicePresident: {
    type: String,
    default: ''
  },
  meetingDay: {
    type: String,
    default: ''
  },
  meetingTime: {
    type: String,
    default: ''
  },
  meetingVenue: {
    type: String,
    default: ''
  },
  establishedDate: {
    type: Date
  },
  budget: {
    type: String,
    default: ''
  },
  activities: {
    type: String,
    default: ''
  },
  achievements: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
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
}, { timestamps: true });

module.exports = mongoose.model('ClubMember', clubMemberSchema);
