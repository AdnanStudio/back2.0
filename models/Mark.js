
const mongoose = require('mongoose');

// ── GP from percentage ──────────────────────────────────────
function gpFromPct(pct) {
  if (pct > 79) return { grade: 'A+', gp: 5.0 };
  if (pct > 69) return { grade: 'A',  gp: 4.0 };
  if (pct > 59) return { grade: 'A-', gp: 3.5 };
  if (pct > 49) return { grade: 'B',  gp: 3.0 };
  if (pct > 39) return { grade: 'C',  gp: 2.0 };
  if (pct > 32) return { grade: 'D',  gp: 1.0 };
  return             { grade: 'F',  gp: 0   };
}

const isBlank = v => v === null || v === undefined || v === '';

// ── Compute one subject's grade (mutates sub) ───────────────
function computeSubjectGrade(sub) {
  const isPair  = Boolean(sub.isPair);
  const papers  = isPair ? 2 : 1;

  // ── CQ (required) ──────────────────────────────────────────
  if (isBlank(sub.cqP1)) {
    sub.cqTotal         = null;
    sub.mcqTotal        = null;
    sub.practicalTotal  = null;
    sub.totalObtained   = null;
    sub.totalFull       = (Number(sub.cqFM) || 70) * papers;
    sub.percentage      = 0;
    sub.grade           = '—';
    sub.gradePoint      = 0;
    sub.status          = 'absent';
    sub.cqPassed        = null;
    sub.mcqPassed       = null;
    sub.practicalPassed = null;
    return;
  }

  const cqFM    = (Number(sub.cqFM)   || 70) * papers;
  const cqPM    = Number(sub.cqPM)    || Math.ceil(cqFM * 0.33);
  const cqP1N   = Number(sub.cqP1)   || 0;
  const cqP2N   = (isPair && !isBlank(sub.cqP2)) ? Number(sub.cqP2) || 0 : 0;
  const cqTotal = cqP1N + cqP2N;
  sub.cqTotal   = cqTotal;
  const cqPassed = cqTotal >= cqPM;
  sub.cqPassed  = cqPassed;

  // ── MCQ (optional) ─────────────────────────────────────────
  const mcqActive = sub.hasMCQ && !isBlank(sub.mcqP1);
  let mcqFM=0, mcqTotal=0, mcqPM=0, mcqPassed=null;
  if (mcqActive) {
    mcqFM  = (Number(sub.mcqFM) || 30) * papers;
    mcqPM  = Number(sub.mcqPM) || Math.ceil(mcqFM * 0.33);
    const mcqP1N = Number(sub.mcqP1) || 0;
    const mcqP2N = (isPair && !isBlank(sub.mcqP2)) ? Number(sub.mcqP2) || 0 : 0;
    mcqTotal  = mcqP1N + mcqP2N;
    mcqPassed = mcqTotal >= mcqPM;
  }
  sub.mcqTotal  = mcqActive ? mcqTotal : null;
  sub.mcqPassed = mcqPassed;

  // ── Practical (optional) ───────────────────────────────────
  const pracActive = sub.hasPractical && !isBlank(sub.practicalP1);
  let pracFM=0, pracTotal=0, pracPM=0, pracPassed=null;
  if (pracActive) {
    pracFM  = (Number(sub.practicalFM) || 25) * papers;
    pracPM  = Number(sub.practicalPM)  || Math.ceil(pracFM * 0.33);
    const pP1N = Number(sub.practicalP1) || 0;
    const pP2N = (isPair && !isBlank(sub.practicalP2)) ? Number(sub.practicalP2) || 0 : 0;
    pracTotal  = pP1N + pP2N;
    pracPassed = pracTotal >= pracPM;
  }
  sub.practicalTotal  = pracActive ? pracTotal : null;
  sub.practicalPassed = pracPassed;

  // ── Combined totals ────────────────────────────────────────
  const totalObt  = cqTotal + mcqTotal + pracTotal;
  const totalFull = cqFM   + mcqFM   + pracFM;
  const pct       = totalFull > 0 ? (totalObt / totalFull) * 100 : 0;

  sub.totalObtained = totalObt;
  sub.totalFull     = totalFull;
  sub.percentage    = parseFloat(pct.toFixed(2));

  // ── Pass/Fail ──────────────────────────────────────────────
  const anyFail = !cqPassed
    || (mcqPassed !== null && !mcqPassed)
    || (pracPassed !== null && !pracPassed);

  if (anyFail) {
    sub.grade      = 'F';
    sub.gradePoint = 0;
    sub.status     = 'fail';
    return;
  }

  const { grade, gp } = gpFromPct(pct);
  sub.grade      = grade;
  sub.gradePoint = gp;
  sub.status     = 'pass';
}

// ─────────────────────────────────────────────────────────────
//  SubjectMarkSchema
// ─────────────────────────────────────────────────────────────
const SubjectMarkSchema = new mongoose.Schema({
  code : { type: String, default: '' },
  name : { type: String, default: '' },

  // Classification
  subjectType : { type: String, enum: ['science','arts','custom'], default: 'arts' },
  isPair      : { type: Boolean, default: true },   // true = Paper1+Paper2

  // ── CQ config & marks ─────────────────────────────────────
  cqFM  : { type: Number, default: 70 },   // full marks PER paper
  cqPM  : { type: Number, default: 23 },   // pass marks for TOTAL (both papers)
  cqP1  : { type: Number, default: null },
  cqP2  : { type: Number, default: null },
  cqTotal : { type: Number, default: null },   // computed

  // ── MCQ config & marks ────────────────────────────────────
  hasMCQ  : { type: Boolean, default: true },
  mcqFM   : { type: Number,  default: 30 },
  mcqPM   : { type: Number,  default: 10 },
  mcqP1   : { type: Number,  default: null },
  mcqP2   : { type: Number,  default: null },
  mcqTotal: { type: Number,  default: null },

  // ── Practical config & marks ───────────────────────────────
  hasPractical  : { type: Boolean, default: false },
  practicalFM   : { type: Number,  default: 25 },
  practicalPM   : { type: Number,  default: 8  },
  practicalP1   : { type: Number,  default: null },
  practicalP2   : { type: Number,  default: null },
  practicalTotal: { type: Number,  default: null },

  // ── Computed ───────────────────────────────────────────────
  totalObtained : { type: Number,  default: null },
  totalFull     : { type: Number,  default: null },
  percentage    : { type: Number,  default: null },
  grade         : { type: String,  default: '—' },
  gradePoint    : { type: Number,  default: 0   },
  status        : { type: String,  enum: ['pass','fail','absent','pending'], default: 'pending' },

  // Pass breakdown (for display)
  cqPassed        : { type: Boolean, default: null },
  mcqPassed       : { type: Boolean, default: null },
  practicalPassed : { type: Boolean, default: null },

}, { _id: false });

// ─────────────────────────────────────────────────────────────
//  MarkSchema
// ─────────────────────────────────────────────────────────────
const MarkSchema = new mongoose.Schema({
  student  : { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  examName : { type: String, required: true, trim: true },
  examYear : { type: String, default: '' },
  session  : { type: String, default: '' },
  program  : { type: String, enum: ['HSC','Degree','Honours','Other'], default: 'Degree' },
  className: { type: String, default: '' },
  section  : { type: String, default: '' },
  subjects : { type: [SubjectMarkSchema], default: [] },

  // Computed overall
  totalObtained : { type: Number, default: 0 },
  totalFull     : { type: Number, default: 0 },
  percentage    : { type: Number, default: 0 },
  gpa           : { type: Number, default: 0 },
  result        : { type: String, enum: ['PASS','FAIL','INCOMPLETE','NOT ENTERED'], default: 'NOT ENTERED' },
  division      : { type: String, default: '—' },

  isPublished : { type: Boolean, default: false },
  publishedAt : { type: Date,    default: null  },
  remarks     : { type: String,  default: ''    },

  createdBy : { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedBy : { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

// ─────────────────────────────────────────────────────────────
//  Pre-save: compute all grades + overall GPA/result
// ─────────────────────────────────────────────────────────────
MarkSchema.pre('save', function () {
  try {
    if (!Array.isArray(this.subjects) || this.subjects.length === 0) {
      this.totalObtained = 0; this.totalFull = 0;
      this.percentage = 0; this.gpa = 0;
      this.result = 'NOT ENTERED'; this.division = '—';
      return;
    }

    // Ensure program is valid
    const validPrograms = ['HSC', 'Degree', 'Honours', 'Other'];
    if (!validPrograms.includes(this.program)) {
      this.program = 'Degree';
    }

    let sumObt = 0, sumFull = 0, sumGP = 0;
    let counted = 0, hasFail = false;

    for (const sub of this.subjects) {
      try {
        computeSubjectGrade(sub);               // mutates sub in place
      } catch (subErr) {
        console.error('[Mark pre-save] computeSubjectGrade error:', subErr.message, JSON.stringify(sub));
        sub.status = 'pending';
        sub.grade = '—';
        sub.gradePoint = 0;
        continue;
      }

      if (sub.status === 'absent') continue;    // skip absent subjects

      sumObt  += sub.totalObtained || 0;
      sumFull += sub.totalFull     || 0;
      sumGP   += sub.gradePoint    || 0;
      counted++;
      if (sub.status === 'fail') hasFail = true;
    }

    this.totalObtained = sumObt;
    this.totalFull     = sumFull;
    this.percentage    = sumFull > 0 ? parseFloat(((sumObt / sumFull) * 100).toFixed(2)) : 0;

    if (counted === 0) {
      this.gpa = 0; this.result = 'NOT ENTERED'; this.division = '—'; return;
    }

    if (hasFail) {
      // Any fail → no GPA
      this.gpa = 0; this.result = 'FAIL'; this.division = '—'; return;
    }

    if (counted < this.subjects.length) {
      this.gpa = 0; this.result = 'INCOMPLETE'; this.division = '—'; return;
    }

    const avgGP = parseFloat((sumGP / counted).toFixed(2));
    this.gpa    = avgGP;
    this.result = 'PASS';
    this.division = avgGP >= 4.5 ? 'First Division (Distinction)'
                  : avgGP >= 3.5 ? 'First Division'
                  : avgGP >= 2.5 ? 'Second Division'
                  :                'Third Division';

  } catch (err) {
    console.error('[Mark pre-save error]', err.message);
    throw err;
  }
});

const Mark = mongoose.model('Mark', MarkSchema);
Mark.gpFromPct           = gpFromPct;
Mark.computeSubjectGrade = computeSubjectGrade;
module.exports = Mark;
