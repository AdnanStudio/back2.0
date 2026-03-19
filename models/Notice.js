// // FILE PATH: models/Notice.js  ← BACKEND
// const mongoose = require('mongoose');

// const noticeSchema = new mongoose.Schema({
//   title: { type: String, required: true, trim: true },
//   description: { type: String, required: true },
//   type: {
//     type: String,
//     enum: ['general', 'urgent', 'holiday', 'exam', 'event', 'admission'],
//     default: 'general'
//   },
//   // Cloudinary uploaded files
//   attachments: [{
//     fileUrl:  { type: String, required: true },
//     fileType: { type: String, enum: ['pdf', 'image'], required: true },
//     fileName: { type: String },
//     publicId: { type: String }
//   }],
//   // ✅ NEW: Google Drive PDF links
//   driveLinks: [{
//     url:   { type: String, required: true },
//     label: { type: String, default: 'PDF Document' }
//   }],
//   isActive:    { type: Boolean, default: true },
//   publishDate: { type: Date, default: Date.now },
//   expiryDate:  { type: Date },
//   createdBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
// }, { timestamps: true });

// noticeSchema.index({ publishDate: -1 });
// noticeSchema.index({ isActive: 1 });

// module.exports = mongoose.model('Notice', noticeSchema);


// FILE PATH: models/Notice.js  ← BACKEND
const mongoose = require('mongoose');

const noticeSchema = new mongoose.Schema({
  title:       { type: String, required: true, trim: true },
  description: { type: String, required: true },
  type: {
    type: String,
    enum: ['general', 'urgent', 'holiday', 'exam', 'event', 'admission'],
    default: 'general',
  },

  // Cloudinary uploaded files
  attachments: [{
    fileUrl:  { type: String, required: true },
    fileType: { type: String, enum: ['pdf', 'image'], required: true },
    fileName: { type: String },
    publicId: { type: String },
  }],

  // Google Drive PDF links
  //  url         → original share URL  (for iframe embed preview)
  //  downloadUrl → direct download URL (auto-generated, for Download button)
  //  label       → display name shown to user
  driveLinks: [{
    url:         { type: String, required: true },
    downloadUrl: { type: String },   // auto-set in controller
    label:       { type: String, default: 'PDF Document' },
  }],

  isActive:    { type: Boolean, default: true },
  publishDate: { type: Date,    default: Date.now },
  expiryDate:  { type: Date },
  createdBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

noticeSchema.index({ publishDate: -1 });
noticeSchema.index({ isActive: 1 });

module.exports = mongoose.model('Notice', noticeSchema);