const mongoose = require('mongoose');

const governingBodyMemberSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Member name is required'],
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
  role: {
    type: String,
    required: [true, 'Role is required'],
    enum: ['সভাপতি', 'সদস্য সচিব', 'সদস্য'],
    default: 'সদস্য'
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true
  },
  phone: {
    type: String,
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  order: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for sorting
governingBodyMemberSchema.index({ order: 1, createdAt: -1 });

module.exports = mongoose.model('GoverningBodyMember', governingBodyMemberSchema);
