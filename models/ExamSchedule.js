// FILE PATH: models/ExamSchedule.js
const mongoose = require('mongoose');

const subjectScheduleSchema = new mongoose.Schema({
  subjectName   : { type: String, required: true },
  subjectCode   : { type: String, default: '' },
  examDate      : { type: String, default: '' },
  examDay       : { type: String, default: '' },
  examTime      : { type: String, default: '' },
  mcqMarks      : { type: Number, default: 0  },
  writtenMarks  : { type: Number, default: 70 },
  practicalMarks: { type: Number, default: 0  },
  totalMarks    : { type: Number, default: 100 },
  room          : { type: String, default: '' },
}, { _id: false });

const examScheduleSchema = new mongoose.Schema({
  class        : { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
  examType     : { type: String, enum: ['1st_term','2nd_term','3rd_term','half_yearly','annual','test','mock'], required: true },
  examYear     : { type: Number, required: true },
  session      : { type: String, default: '' },
  subjects     : { type: [subjectScheduleSchema], default: [] },
  instructions : [{ type: String }],
  createdBy    : { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedBy    : { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

examScheduleSchema.index({ class: 1, examType: 1, examYear: 1 }, { unique: true });

module.exports = mongoose.model('ExamSchedule', examScheduleSchema);