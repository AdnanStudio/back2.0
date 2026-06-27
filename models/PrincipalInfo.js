const mongoose = require('mongoose');

const principalInfoSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  image: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  qualification: {
    type: String
  },
  email: {
    type: String
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('PrincipalInfo', principalInfoSchema);
