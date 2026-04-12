// ============================================================
// FIXED: models/Mark.js (pre-save middleware corrected)
// ============================================================
const mongoose = require('mongoose');

function computeGrade(obtained, fullMarks, passMarks) {
  const fm = Number(fullMarks) || 100;
  const pm = Number(passMarks) || 33;

  if (obtained === null || obtained === undefined || obtained === '') {
    return { grade: '—', gradePoint: 0, status: 'absent' };
  }

  const obt = Number(obtained);
  if (isNaN(obt)) {
    return { grade: '—', gradePoint: 0, status: 'absent' };
  }
  if (obt < pm) {
    return { grade: 'F', gradePoint: 0, status: 'fail' };
  }

  const pct = (obt / fm) * 100;
  if (pct >= 80) return { grade: 'A+', gradePoint: 5.0, status: 'pass' };
  if (pct >= 70) return { grade: 'A',  gradePoint: 4.0, status: 'pass' };
  if (pct >= 60) return { grade: 'A-', gradePoint: 3.5, status: 'pass' };
  if (pct >= 50) return { grade: 'B',  gradePoint: 3.0, status: 'pass' };
  if (pct >= 40) return { grade: 'C',  gradePoint: 2.0, status: 'pass' };
  return             { grade: 'D',  gradePoint: 1.0, status: 'pass' };
}

const SubjectMarkSchema = new mongoose.Schema({
  code         : { type: String,  default: '' },
  name         : { type: String,  default: '' },
  fullMarks    : { type: Number,  default: 100 },
  passMarks    : { type: Number,  default: 33  },
  marksObtained: { type: Number,  default: null },
  grade        : { type: String,  default: '—' },
  gradePoint   : { type: Number,  default: 0   },
  status       : {
    type   : String,
    enum   : ['pass', 'fail', 'absent', 'pending'],
    default: 'pending',
  },
}, { _id: false });

const MarkSchema = new mongoose.Schema({
  student   : {
    type    : mongoose.Schema.Types.ObjectId,
    ref     : 'Student',
    required: true,
  },
  examName  : { type: String, required: true, trim: true },
  examYear  : { type: String, default: '' },
  session   : { type: String, default: '' },
  program   : {
    type   : String,
    enum   : ['HSC', 'Degree', 'Honours', 'Other'],
    default: 'Degree',
  },
  className : { type: String, default: '' },
  section   : { type: String, default: '' },
  subjects  : { type: [SubjectMarkSchema], default: [] },

  totalObtained: { type: Number, default: 0 },
  totalFull    : { type: Number, default: 0 },
  percentage   : { type: Number, default: 0 },
  gpa          : { type: Number, default: 0 },
  result       : {
    type   : String,
    enum   : ['PASS', 'FAIL', 'INCOMPLETE', 'NOT ENTERED'],
    default: 'NOT ENTERED',
  },
  division: { type: String, default: '—' },

  isPublished : { type: Boolean, default: false },
  publishedAt : { type: Date,    default: null  },
  remarks     : { type: String,  default: ''    },

  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

}, { timestamps: true });

MarkSchema.pre('save', async function () {
  try {
    if (!Array.isArray(this.subjects) || this.subjects.length === 0) {
      this.totalObtained = 0;
      this.totalFull     = 0;
      this.percentage    = 0;
      this.gpa           = 0;
      this.result        = 'NOT ENTERED';
      this.division      = '—';
      return;
    }

    let totalObt = 0, totalFull = 0, totalGP = 0;
    let count = 0, hasFail = false;

    for (const sub of this.subjects) {
      const { grade, gradePoint, status } = computeGrade(
        sub.marksObtained, sub.fullMarks, sub.passMarks
      );

      sub.grade      = grade;
      sub.gradePoint = gradePoint;
      sub.status     = status;

      if (sub.marksObtained !== null && sub.marksObtained !== undefined) {
        totalObt  += Number(sub.marksObtained) || 0;
        totalFull += Number(sub.fullMarks)      || 100;
        totalGP   += gradePoint;
        count++;
        if (status === 'fail') hasFail = true;
      }
    }

    this.totalObtained = totalObt;
    this.totalFull     = totalFull;
    this.percentage    = totalFull > 0
      ? parseFloat(((totalObt / totalFull) * 100).toFixed(2))
      : 0;

    this.gpa = count > 0
      ? parseFloat((totalGP / count).toFixed(2))
      : 0;

    if (count === 0) {
      this.result = 'NOT ENTERED';
    } else if (hasFail) {
      this.result = 'FAIL';
    } else if (count < this.subjects.length) {
      this.result = 'INCOMPLETE';
    } else {
      this.result = 'PASS';
    }

    if (!hasFail && count > 0) {
      const g = this.gpa;
      this.division = g >= 4.5 ? 'First Division (Distinction)'
                    : g >= 3.5 ? 'First Division'
                    : g >= 2.5 ? 'Second Division'
                    : 'Third Division';
    } else {
      this.division = '—';
    }

  } catch (err) {
    console.error('[Mark pre-save error]', err.message);
    throw err;
  }
});

const Mark = mongoose.model('Mark', MarkSchema);
Mark.computeGrade = computeGrade;

module.exports = Mark;
