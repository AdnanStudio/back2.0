const mongoose = require('mongoose');

// ── Grade helper ──────────────────────────────────────────────────────────
const gradeFromPct = (pct) => {
  if (pct >= 80) return { grade: 'A+', gradePoint: 5.0 };
  if (pct >= 70) return { grade: 'A',  gradePoint: 4.0 };
  if (pct >= 60) return { grade: 'A-', gradePoint: 3.5 };
  if (pct >= 50) return { grade: 'B',  gradePoint: 3.0 };
  if (pct >= 40) return { grade: 'C',  gradePoint: 2.0 };
  if (pct >= 33) return { grade: 'D',  gradePoint: 1.0 };
  return            { grade: 'F',  gradePoint: 0.0 };
};

// ── Sub-schema for each subject's marks ──────────────────────────────────
const subjectMarkSchema = new mongoose.Schema({
  subjectName:        { type: String, default: '' },
  subjectCode:        { type: String, default: '' },
  theoryFullMarks:    { type: Number, default: 100 },
  theoryObtained:     { type: Number, default: 0 },
  practicalFullMarks: { type: Number, default: 0 },
  practicalObtained:  { type: Number, default: 0 },
  mcqFullMarks:       { type: Number, default: 0 },
  mcqObtained:        { type: Number, default: 0 },
  totalFullMarks:     { type: Number, default: 100 },
  totalObtained:      { type: Number, default: 0 },
  grade:              { type: String, default: '' },
  gradePoint:         { type: Number, default: 0 },
  isAbsent:           { type: Boolean, default: false },
  remarks:            { type: String, default: '' },
}, { _id: false });

// ── Main Mark schema ──────────────────────────────────────────────────────
const markSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true,
  },
  class: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: true,
  },
  examType: {
    type: String,
    enum: ['1st_term', '2nd_term', '3rd_term', 'half_yearly', 'annual', 'test', 'mock'],
    required: true,
  },
  examYear: {
    type: Number,
    required: true,
    default: () => new Date().getFullYear(),
  },

  subjects:       { type: [subjectMarkSchema], default: [] },

  // Auto-calculated summary
  totalObtained:  { type: Number, default: 0 },
  totalFullMarks: { type: Number, default: 0 },
  percentage:     { type: Number, default: 0 },
  gpa:            { type: Number, default: 0 },
  grade:          { type: String, default: '' },
  position:       { type: Number, default: 0 },

  result: {
    type: String,
    enum: ['Pass', 'Fail', 'Not Published'],
    default: 'Not Published',
  },
  isPublished: { type: Boolean, default: false },
  publishedAt: { type: Date },

  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

// Unique: one record per student per class per exam per year
markSchema.index({ student: 1, class: 1, examType: 1, examYear: 1 }, { unique: true });
markSchema.index({ class: 1, examType: 1, examYear: 1 });
markSchema.index({ isPublished: 1 });

// ── Pre-save: auto-calculate grades & totals ──────────────────────────────
markSchema.pre('save', function (next) {
  try {
    let totalObtained = 0;
    let totalFullMarks = 0;
    let gpSum = 0;
    let hasFailed = false;

    this.subjects.forEach(sub => {
      const full = ((sub.theoryFullMarks || 0) +
                   (sub.practicalFullMarks || 0) +
                   (sub.mcqFullMarks || 0)) || 100;

      if (sub.isAbsent) {
        sub.totalFullMarks = full;
        sub.totalObtained  = 0;
        sub.grade          = 'F';
        sub.gradePoint     = 0;
        hasFailed          = true;
        totalFullMarks    += full;
        // gpSum += 0 (absent = 0 grade points)
      } else {
        const obtained = (parseFloat(sub.theoryObtained)    || 0)
                       + (parseFloat(sub.practicalObtained)  || 0)
                       + (parseFloat(sub.mcqObtained)        || 0);

        sub.totalObtained  = obtained;
        sub.totalFullMarks = full;

        const pct                = full > 0 ? (obtained / full) * 100 : 0;
        const { grade, gradePoint } = gradeFromPct(pct);
        sub.grade      = grade;
        sub.gradePoint = gradePoint;

        if (grade === 'F') hasFailed = true;
        totalObtained  += obtained;
        totalFullMarks += full;
        gpSum          += gradePoint;
      }
    });

    this.totalObtained  = totalObtained;
    this.totalFullMarks = totalFullMarks;
    this.percentage     = totalFullMarks > 0
      ? parseFloat(((totalObtained / totalFullMarks) * 100).toFixed(2))
      : 0;

    const { grade } = gradeFromPct(this.percentage);
    this.grade = grade;

    this.gpa = this.subjects.length > 0
      ? parseFloat((gpSum / this.subjects.length).toFixed(2))
      : 0;

    if (this.isPublished) {
      this.result = hasFailed ? 'Fail' : 'Pass';
    }

    next();
  } catch (err) {
    next(err);
  }
});

module.exports = mongoose.model('Mark', markSchema);
