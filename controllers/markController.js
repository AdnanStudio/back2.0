// FILE PATH: controllers/markController.js
// Full CQ / MCQ / Practical  •  Paper1 + Paper2 or Single
// ============================================================
const mongoose = require('mongoose');
const Mark    = require('../models/Mark');
const Student = require('../models/Student');
const Class   = require('../models/Class');

const ok   = (res, data, msg = 'Success', status = 200) =>
  res.status(status).json({ success: true, message: msg, ...data });

const fail = (res, status, msg, err = null) => {
  if (err) console.error(`[markController] ${msg} →`, err.message || err);
  return res.status(status).json({ success: false, message: msg });
};

const isValidId = id => id && mongoose.Types.ObjectId.isValid(id);
const num       = v  => (v === null || v === undefined || v === '') ? null : Number(v);

// ─────────────────────────────────────────────────────────────
//  sanitizeSubjects — maps frontend payload → clean schema obj
// ─────────────────────────────────────────────────────────────
const sanitizeSubjects = (subjects = []) =>
  subjects.map(s => {
    const isPair = Boolean(s.isPair);
    const type   = ['science','arts','custom'].includes(s.subjectType) ? s.subjectType : 'arts';

    // Defaults per type
    const defCQ   = type === 'science' ? 50 : 70;
    const defMCQ  = type === 'science' ? 25 : 30;
    const defPrac = 25;

    const cqFM  = Number(s.cqFM)  || defCQ;
    const mcqFM = Number(s.mcqFM) || defMCQ;
    const pracFM= Number(s.practicalFM) || defPrac;

    // Auto-calc pass marks if not provided
    const papers = isPair ? 2 : 1;
    const cqPM   = Number(s.cqPM)        || Math.ceil(cqFM   * papers * 0.33);
    const mcqPM  = Number(s.mcqPM)       || Math.ceil(mcqFM  * papers * 0.33);
    const pracPM = Number(s.practicalPM) || Math.ceil(pracFM * papers * 0.33);

    return {
      code        : String(s.code || '').trim(),
      name        : String(s.name || '').trim(),
      subjectType : type,
      isPair,

      cqFM,  cqPM,
      cqP1  : num(s.cqP1),
      cqP2  : isPair ? num(s.cqP2) : null,

      hasMCQ : Boolean(s.hasMCQ),
      mcqFM, mcqPM,
      mcqP1  : s.hasMCQ ? num(s.mcqP1) : null,
      mcqP2  : s.hasMCQ && isPair ? num(s.mcqP2) : null,

      hasPractical  : Boolean(s.hasPractical),
      practicalFM: pracFM, practicalPM: pracPM,
      practicalP1: s.hasPractical ? num(s.practicalP1) : null,
      practicalP2: s.hasPractical && isPair ? num(s.practicalP2) : null,
    };
  });

// ─────────────────────────────────────────────────────────────
//  convertSimpleSubjects
//  Marks.js sends { theoryObtained, mcqObtained, practicalObtained, ... }
//  This converts to the cqP1/mcqP1/practicalP1 format the model expects
// ─────────────────────────────────────────────────────────────
const convertSimpleSubjects = (subjects = []) =>
  subjects.map(s => {
    const theoryFM   = Number(s.theoryFullMarks)    || 100;
    const mcqFM      = Number(s.mcqFullMarks)       || 0;
    const pracFM     = Number(s.practicalFullMarks) || 0;
    const hasMCQ     = mcqFM > 0;
    const hasPrac    = pracFM > 0;

    return {
      code        : String(s.subjectCode || s.code || '').trim(),
      name        : String(s.subjectName || s.name || '').trim(),
      subjectType : 'arts',
      isPair      : false,

      cqFM  : theoryFM,
      cqPM  : Math.ceil(theoryFM * 0.33),
      // If absent, cqP1 = null → pre-save hook marks status as 'absent'
      cqP1  : s.isAbsent ? null : num(s.theoryObtained),
      cqP2  : null,

      hasMCQ,
      mcqFM,
      mcqPM  : hasMCQ ? Math.ceil(mcqFM * 0.33) : 10,
      mcqP1  : hasMCQ && !s.isAbsent ? num(s.mcqObtained) : null,
      mcqP2  : null,

      hasPractical  : hasPrac,
      practicalFM   : pracFM,
      practicalPM   : hasPrac ? Math.ceil(pracFM * 0.33) : 8,
      practicalP1   : hasPrac && !s.isAbsent ? num(s.practicalObtained) : null,
      practicalP2   : null,
    };
  });

// ─────────────────────────────────────────────────────────────
//  convertStoredSubjects
//  Converts stored cqP1/mcqP1 format → frontend theoryObtained format
//  Used when returning existing marks to Marks.js
// ─────────────────────────────────────────────────────────────
const convertStoredSubjects = (subjects = []) =>
  subjects.map(s => ({
    subjectName        : s.name,
    subjectCode        : s.code,
    theoryFullMarks    : s.cqFM || 100,
    theoryObtained     : s.status === 'absent' ? '' : (s.cqP1 ?? ''),
    mcqFullMarks       : s.hasMCQ ? (s.mcqFM || 30) : 0,
    mcqObtained        : s.hasMCQ && s.status !== 'absent' ? (s.mcqP1 ?? '') : '',
    practicalFullMarks : s.hasPractical ? (s.practicalFM || 25) : 0,
    practicalObtained  : s.hasPractical && s.status !== 'absent' ? (s.practicalP1 ?? '') : '',
    isAbsent           : s.status === 'absent',
  }));

// ── Validate no obtained > full marks ─────────────────────────
const validateSubjects = (subs) => {
  for (const s of subs) {
    if (s.cqP1 != null && s.cqP1 > s.cqFM)
      return `"${s.name}" CQ Paper 1 (${s.cqP1}) > full marks (${s.cqFM})`;
    if (s.isPair && s.cqP2 != null && s.cqP2 > s.cqFM)
      return `"${s.name}" CQ Paper 2 (${s.cqP2}) > full marks (${s.cqFM})`;
    if (s.hasMCQ) {
      if (s.mcqP1 != null && s.mcqP1 > s.mcqFM)
        return `"${s.name}" MCQ Paper 1 (${s.mcqP1}) > full marks (${s.mcqFM})`;
      if (s.isPair && s.mcqP2 != null && s.mcqP2 > s.mcqFM)
        return `"${s.name}" MCQ Paper 2 (${s.mcqP2}) > full marks (${s.mcqFM})`;
    }
    if (s.hasPractical) {
      if (s.practicalP1 != null && s.practicalP1 > s.practicalFM)
        return `"${s.name}" Practical Paper 1 (${s.practicalP1}) > full marks (${s.practicalFM})`;
      if (s.isPair && s.practicalP2 != null && s.practicalP2 > s.practicalFM)
        return `"${s.name}" Practical Paper 2 (${s.practicalP2}) > full marks (${s.practicalFM})`;
    }
  }
  return null;
};

// ── Populate helper (Student.class is a String — NOT populated) ──
const populateStudent = q =>
  q.populate({
    path   : 'student',
    select : 'studentId rollNumber section class userId session',
    populate: { path: 'userId', select: 'name email profileImage' },
  });

// ═══════════════════════════════════════════════════════════════
//  GET /api/marks/class/:classId/students
//  Returns class info + subjects + students with existing marks
//  Called by Marks.js loadEntry()
// ═══════════════════════════════════════════════════════════════
exports.getClassStudentsForMarks = async (req, res) => {
  try {
    const { classId } = req.params;
    const { examType, examYear } = req.query;

    if (!isValidId(classId)) return fail(res, 400, 'Invalid classId');

    const classData = await Class.findById(classId)
      .populate({
        path: 'students',
        populate: { path: 'userId', select: 'name email profileImage' },
      })
      .populate({ path: 'subjects.teacher', populate: { path: 'userId', select: 'name' } });

    if (!classData) return fail(res, 404, 'Class not found');

    const examName = String(examType || '').trim();
    const session  = String(examYear || '').trim();

    // Fetch existing marks for all students in this class
    const studentIds = classData.students.map(s => s._id);
    const existingMarks = await Mark.find({
      student : { $in: studentIds },
      examName,
      session,
    }).lean();

    const markMap = {};
    existingMarks.forEach(m => { markMap[String(m.student)] = m; });

    const students = classData.students.map(student => {
      const stored = markMap[String(student._id)];
      // Convert stored mark subjects back to frontend format
      const existingMark = stored ? {
        ...stored,
        subjects: convertStoredSubjects(stored.subjects || []),
      } : null;

      return {
        student: {
          _id          : student._id,
          name         : student.userId?.name || '',
          rollNumber   : student.rollNumber,
          profileImage : student.userId?.profileImage || '',
          studentId    : student.studentId,
          section      : student.section,
        },
        existingMark,
      };
    });

    // Sort by rollNumber
    students.sort((a, b) => (a.student.rollNumber || 0) - (b.student.rollNumber || 0));

    return ok(res, {
      data: {
        class   : { _id: classData._id, name: classData.name, section: classData.section },
        subjects: classData.subjects || [],
        students,
      },
    });
  } catch (err) { return fail(res, 500, 'Failed to load class students', err); }
};

// ═══════════════════════════════════════════════════════════════
//  GET /api/marks/class/:classId
//  Returns all published/unpublished marks for a class
//  Called by Marks.js loadView()
// ═══════════════════════════════════════════════════════════════
exports.getClassMarks = async (req, res) => {
  try {
    const { classId } = req.params;
    const { examType, examYear } = req.query;

    if (!isValidId(classId)) return fail(res, 400, 'Invalid classId');

    const classData = await Class.findById(classId).select('students name section');
    if (!classData) return fail(res, 404, 'Class not found');

    const filter = {
      student  : { $in: classData.students },
      examName : String(examType || '').trim(),
      session  : String(examYear || '').trim(),
    };

    const marks = await populateStudent(Mark.find(filter).sort({ createdAt: -1 })).lean();
    return ok(res, { count: marks.length, data: marks });
  } catch (err) { return fail(res, 500, 'Failed to fetch class marks', err); }
};

// ═══════════════════════════════════════════════════════════════
//  GET /api/marks/stats/:classId
//  Called by Marks.js loadStats()
// ═══════════════════════════════════════════════════════════════
exports.getClassStatsByClassId = async (req, res) => {
  try {
    const { classId } = req.params;
    const { examType, examYear } = req.query;

    if (!isValidId(classId)) return fail(res, 400, 'Invalid classId');

    const classData = await Class.findById(classId).select('students');
    if (!classData) return fail(res, 404, 'Class not found');

    const filter = {
      student  : { $in: classData.students },
      examName : String(examType || '').trim(),
      session  : String(examYear || '').trim(),
    };

    const marks = await Mark.find(filter).select('result gpa percentage isPublished').lean();
    if (!marks.length) {
      return ok(res, { data: { total:0, passed:0, failed:0, incomplete:0, published:0, passRate:0, avgGPA:'0.00', avgPct:'0.00' } });
    }

    const total      = marks.length;
    const passed     = marks.filter(m => m.result === 'PASS').length;
    const failed     = marks.filter(m => m.result === 'FAIL').length;
    const incomplete = marks.filter(m => m.result === 'INCOMPLETE' || m.result === 'NOT ENTERED').length;
    const published  = marks.filter(m => m.isPublished).length;

    return ok(res, { data: {
      total, passed, failed, incomplete, published,
      passRate : parseFloat(((passed / total) * 100).toFixed(1)),
      avgGPA   : (marks.reduce((a, m) => a + (m.gpa || 0), 0) / total).toFixed(2),
      avgPct   : (marks.reduce((a, m) => a + (m.percentage || 0), 0) / total).toFixed(2),
    }});
  } catch (err) { return fail(res, 500, 'Failed to get stats', err); }
};

// ═══════════════════════════════════════════════════════════════
//  PUT /api/marks/publish
//  Publish all marks for classId + examType + examYear
//  Called by Marks.js handlePublish()
// ═══════════════════════════════════════════════════════════════
exports.publishClassMarks = async (req, res) => {
  try {
    const { classId, examType, examYear } = req.body;
    if (!isValidId(classId)) return fail(res, 400, 'Invalid classId');

    const classData = await Class.findById(classId).select('students');
    if (!classData) return fail(res, 404, 'Class not found');

    const filter = {
      student  : { $in: classData.students },
      examName : String(examType || '').trim(),
      session  : String(examYear || '').trim(),
    };

    const r = await Mark.updateMany(filter, {
      isPublished: true,
      publishedAt: new Date(),
    });
    return ok(res, { modifiedCount: r.modifiedCount }, `${r.modifiedCount} results published`);
  } catch (err) { return fail(res, 500, 'Failed to publish', err); }
};

// ═══════════════════════════════════════════════════════════════
//  PUT /api/marks/unpublish
//  Unpublish all marks for classId + examType + examYear
//  Called by Marks.js handleUnpublish()
// ═══════════════════════════════════════════════════════════════
exports.unpublishClassMarks = async (req, res) => {
  try {
    const { classId, examType, examYear } = req.body;
    if (!isValidId(classId)) return fail(res, 400, 'Invalid classId');

    const classData = await Class.findById(classId).select('students');
    if (!classData) return fail(res, 404, 'Class not found');

    const filter = {
      student  : { $in: classData.students },
      examName : String(examType || '').trim(),
      session  : String(examYear || '').trim(),
    };

    const r = await Mark.updateMany(filter, { isPublished: false });
    return ok(res, { modifiedCount: r.modifiedCount }, `${r.modifiedCount} results unpublished`);
  } catch (err) { return fail(res, 500, 'Failed to unpublish', err); }
};

// ═══════════════════════════════════════════════════════════════
//  POST /api/marks  — save / upsert one student's marks
// ═══════════════════════════════════════════════════════════════
exports.saveMarks = async (req, res) => {
  try {
    const {
      studentId, examName, examYear = '', session = '',
      program = 'Degree', className = '', section = '',
      subjects = [], isPublished = false, remarks = '',
    } = req.body;

    if (!studentId)            return fail(res, 400, 'studentId is required');
    if (!examName?.trim())     return fail(res, 400, 'examName is required');
    if (!isValidId(studentId)) return fail(res, 400, 'studentId is not a valid ObjectId');

    const student = await Student.findById(studentId).select('_id');
    if (!student) return fail(res, 404, `No student found: ${studentId}`);

    const clean = sanitizeSubjects(subjects);
    const valErr = validateSubjects(clean);
    if (valErr) return fail(res, 400, valErr);

    const filter = {
      student : studentId,
      examName: examName.trim(),
      session : (session || '').trim(),
    };

    let mark = await Mark.findOne(filter);

    if (mark) {
      mark.examYear  = examYear;
      mark.program   = program;
      mark.className = (className || '').trim();
      mark.section   = (section   || '').trim();
      mark.subjects  = clean;
      mark.remarks   = (remarks   || '').trim();
      mark.updatedBy = req.user?._id || null;
      if (isPublished !== undefined) {
        mark.isPublished = Boolean(isPublished);
        if (mark.isPublished && !mark.publishedAt) mark.publishedAt = new Date();
      }
    } else {
      mark = new Mark({
        student: studentId, examName: examName.trim(),
        examYear, session: (session || '').trim(), program,
        className: (className || '').trim(), section: (section || '').trim(),
        subjects: clean, remarks: (remarks || '').trim(),
        isPublished: false,
        createdBy: req.user?._id, updatedBy: req.user?._id,
      });
    }

    await mark.save();  // pre-save computes everything
    const saved = await populateStudent(Mark.findById(mark._id));
    return ok(res, { data: saved }, 'Marks saved successfully');

  } catch (err) {
    if (err.code === 11000) {
      try {
        const { studentId, examName, session = '', subjects = [] } = req.body;
        const ex = await Mark.findOne({
          student: studentId, examName: String(examName).trim(), session: String(session).trim(),
        });
        if (ex) {
          ex.subjects  = sanitizeSubjects(subjects);
          ex.updatedBy = req.user?._id || null;
          await ex.save();
          return ok(res, { data: ex }, 'Marks updated (dup handled)');
        }
      } catch (e2) { return fail(res, 500, 'Upsert failed', e2); }
    }
    return fail(res, 500, 'Failed to save marks', err);
  }
};

// ═══════════════════════════════════════════════════════════════
//  POST /api/marks/bulk
//
//  Supports TWO formats:
//
//  Format A — from Marks.js (simple, class-level):
//  { classId, examType, examYear, marksData: [{studentId, subjects:[{subjectName, theoryObtained, ...}]}] }
//
//  Format B — from markService.js / MarkManagement.jsx (detailed):
//  { entries: [{studentId, examName, session, subjects:[{cqP1, ...}]}] }
// ═══════════════════════════════════════════════════════════════
exports.saveBulkMarks = async (req, res) => {
  try {
    let entries = req.body.entries;

    // ── Format A: from Marks.js ──────────────────────────────
    if (!entries && req.body.marksData) {
      const { examType, examYear, marksData, classId } = req.body;

      if (!examType) return fail(res, 400, 'examType is required');

      // Get class name for storing in mark record (optional but nice)
      let className = '';
      if (isValidId(classId)) {
        const cls = await Class.findById(classId).select('name section').lean();
        if (cls) className = cls.section ? `${cls.name} (${cls.section})` : cls.name;
      }

      entries = (marksData || []).map(e => ({
        studentId : e.studentId,
        examName  : String(examType).trim(),
        session   : String(examYear || '').trim(),
        className,
        subjects  : convertSimpleSubjects(e.subjects || []),
      }));
    }

    if (!entries?.length) return fail(res, 400, 'entries[] or marksData[] required');

    const results = [];
    for (const e of entries) {
      const { studentId, examName, session = '', subjects = [], className = '', ...rest } = e;
      if (!isValidId(studentId)) { results.push({ studentId, error: 'Invalid id' }); continue; }

      const filter = {
        student  : studentId,
        examName : String(examName).trim(),
        session  : String(session).trim(),
      };

      // Determine if subjects are already in backend format (have cqP1) or still simple
      const clean = subjects.length && (subjects[0].cqP1 !== undefined || subjects[0].code !== undefined)
        ? sanitizeSubjects(subjects)
        : subjects; // already converted by convertSimpleSubjects above

      let mark = await Mark.findOne(filter);
      if (mark) {
        mark.subjects  = clean;
        mark.updatedBy = req.user?._id;
        if (className) mark.className = className;
        Object.assign(mark, rest);
      } else {
        mark = new Mark({
          student  : studentId,
          examName : String(examName).trim(),
          session  : String(session).trim(),
          subjects : clean,
          className,
          createdBy: req.user?._id,
          updatedBy: req.user?._id,
          ...rest,
        });
      }
      await mark.save();
      results.push({ studentId, markId: mark._id, result: mark.result });
    }
    return ok(res, { count: results.length, data: results }, 'Bulk marks saved');
  } catch (err) { return fail(res, 500, 'Bulk save failed', err); }
};

// ═══════════════════════════════════════════════════════════════
//  GET /api/marks
// ═══════════════════════════════════════════════════════════════
exports.getAllMarks = async (req, res) => {
  try {
    const { className, section, program, examName, examYear, session, result, isPublished, search, page = 1, limit = 30 } = req.query;
    const filter = {};
    if (className)   filter.className  = { $regex: className,  $options: 'i' };
    if (section)     filter.section    = section;
    if (program)     filter.program    = program;
    if (examName)    filter.examName   = { $regex: examName,   $options: 'i' };
    if (examYear)    filter.examYear   = examYear;
    if (session)     filter.session    = { $regex: session,    $options: 'i' };
    if (result)      filter.result     = result;
    if (isPublished !== undefined && isPublished !== '')
      filter.isPublished = isPublished === 'true';

    const skip  = (Math.max(parseInt(page), 1) - 1) * parseInt(limit);
    const total = await Mark.countDocuments(filter);

    let marks = await populateStudent(
      Mark.find(filter).sort({ className: 1, createdAt: -1 }).skip(skip).limit(Math.min(parseInt(limit), 100))
    ).lean();

    if (search?.trim()) {
      const q = search.toLowerCase();
      marks = marks.filter(m =>
        (m.student?.userId?.name || '').toLowerCase().includes(q) ||
        String(m.student?.rollNumber || '').includes(q)
      );
    }
    return ok(res, { total, count: marks.length, page: parseInt(page), data: marks });
  } catch (err) { return fail(res, 500, 'Failed to fetch marks', err); }
};

// ═══════════════════════════════════════════════════════════════
//  GET /api/marks/my  — student's own published results
// ═══════════════════════════════════════════════════════════════
exports.getMyMarks = async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.user._id }).select('_id');
    if (!student) return ok(res, { count: 0, data: [] }, 'No student profile');
    const marks = await Mark.find({ student: student._id, isPublished: true })
      .sort({ createdAt: -1 }).lean();
    return ok(res, { count: marks.length, data: marks });
  } catch (err) { return fail(res, 500, 'Failed to fetch marks', err); }
};

// ═══════════════════════════════════════════════════════════════
//  GET /api/marks/student/:studentId
// ═══════════════════════════════════════════════════════════════
exports.getStudentMarks = async (req, res) => {
  try {
    const { studentId } = req.params;
    if (!isValidId(studentId)) return fail(res, 400, 'Invalid studentId');
    const filter = { student: studentId };
    if (req.query.examName) filter.examName = { $regex: req.query.examName, $options: 'i' };
    if (req.query.session)  filter.session  = req.query.session;
    const marks = await populateStudent(Mark.find(filter).sort({ createdAt: -1 })).lean();
    return ok(res, { count: marks.length, data: marks });
  } catch (err) { return fail(res, 500, 'Failed to fetch student marks', err); }
};

// ═══════════════════════════════════════════════════════════════
//  GET /api/marks/stats
// ═══════════════════════════════════════════════════════════════
exports.getClassStats = async (req, res) => {
  try {
    const { className, section, examName, session, program } = req.query;
    const filter = {};
    if (className) filter.className = { $regex: className, $options: 'i' };
    if (section)   filter.section   = section;
    if (examName)  filter.examName  = { $regex: examName,  $options: 'i' };
    if (session)   filter.session   = { $regex: session,   $options: 'i' };
    if (program)   filter.program   = program;

    const marks = await Mark.find(filter).select('result gpa percentage isPublished').lean();
    if (!marks.length) return ok(res, { data: { total:0,passed:0,failed:0,incomplete:0,published:0,passRate:0,avgGPA:'0.00',avgPct:'0.00' } });

    const total      = marks.length;
    const passed     = marks.filter(m => m.result === 'PASS').length;
    const failed     = marks.filter(m => m.result === 'FAIL').length;
    const incomplete = marks.filter(m => m.result === 'INCOMPLETE' || m.result === 'NOT ENTERED').length;
    const published  = marks.filter(m => m.isPublished).length;
    return ok(res, { data: {
      total, passed, failed, incomplete, published,
      passRate : parseFloat(((passed/total)*100).toFixed(1)),
      avgGPA   : (marks.reduce((a,m)=>a+(m.gpa||0),0)/total).toFixed(2),
      avgPct   : (marks.reduce((a,m)=>a+(m.percentage||0),0)/total).toFixed(2),
    }});
  } catch (err) { return fail(res, 500, 'Failed to get stats', err); }
};

// ═══════════════════════════════════════════════════════════════
//  GET /api/marks/exams
// ═══════════════════════════════════════════════════════════════
exports.getExamList = async (req, res) => {
  try {
    const exams = await Mark.aggregate([
      { $group: { _id: { examName:'$examName', examYear:'$examYear', program:'$program' }, count:{ $sum:1 }, passed:{ $sum:{ $cond:[{ $eq:['$result','PASS'] },1,0] } }, classes:{ $addToSet:'$className' } } },
      { $sort: { '_id.examYear': -1, '_id.examName': 1 } },
      { $limit: 50 },
    ]);
    return ok(res, { count: exams.length, data: exams });
  } catch (err) { return fail(res, 500, 'Failed to get exam list', err); }
};

// ═══════════════════════════════════════════════════════════════
//  GET /api/marks/:id
// ═══════════════════════════════════════════════════════════════
exports.getMarkById = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) return fail(res, 400, 'Invalid id');
    const mark = await populateStudent(Mark.findById(req.params.id));
    if (!mark) return fail(res, 404, 'Mark not found');
    return ok(res, { data: mark });
  } catch (err) { return fail(res, 500, 'Failed to fetch mark', err); }
};

// ═══════════════════════════════════════════════════════════════
//  PUT /api/marks/:id
// ═══════════════════════════════════════════════════════════════
exports.updateMark = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) return fail(res, 400, 'Invalid id');
    const mark = await Mark.findById(req.params.id);
    if (!mark) return fail(res, 404, 'Mark not found');

    if (req.body.subjects)            mark.subjects  = sanitizeSubjects(req.body.subjects);
    if (req.body.examName)            mark.examName  = req.body.examName.trim();
    if (req.body.examYear)            mark.examYear  = req.body.examYear;
    if (req.body.session  !== undefined) mark.session   = req.body.session;
    if (req.body.program)             mark.program   = req.body.program;
    if (req.body.className !== undefined) mark.className = req.body.className;
    if (req.body.section  !== undefined) mark.section   = req.body.section;
    if (req.body.remarks  !== undefined) mark.remarks   = req.body.remarks;
    if (req.body.isPublished !== undefined) {
      mark.isPublished = Boolean(req.body.isPublished);
      if (mark.isPublished && !mark.publishedAt) mark.publishedAt = new Date();
    }
    mark.updatedBy = req.user?._id || null;
    await mark.save();
    return ok(res, { data: mark }, 'Mark updated');
  } catch (err) { return fail(res, 500, 'Failed to update', err); }
};

// ═══════════════════════════════════════════════════════════════
//  PATCH /api/marks/:id/publish
// ═══════════════════════════════════════════════════════════════
exports.togglePublish = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) return fail(res, 400, 'Invalid id');
    const mark = await Mark.findById(req.params.id).select('isPublished publishedAt');
    if (!mark) return fail(res, 404, 'Not found');
    const nowPub = !mark.isPublished;
    await Mark.updateOne({ _id: mark._id }, { isPublished: nowPub, publishedAt: nowPub ? new Date() : mark.publishedAt });
    return ok(res, { isPublished: nowPub }, `Result ${nowPub ? 'published' : 'unpublished'}`);
  } catch (err) { return fail(res, 500, 'Failed', err); }
};

// ═══════════════════════════════════════════════════════════════
//  POST /api/marks/publish-class
// ═══════════════════════════════════════════════════════════════
exports.publishClassResults = async (req, res) => {
  try {
    const { className, section, examName, session, program } = req.body;
    const filter = {};
    if (className) filter.className = { $regex: className, $options: 'i' };
    if (section)   filter.section   = section;
    if (examName)  filter.examName  = { $regex: examName,  $options: 'i' };
    if (session)   filter.session   = session;
    if (program)   filter.program   = program;
    const r = await Mark.updateMany(filter, { isPublished: true, $set: { publishedAt: new Date() } });
    return ok(res, { modifiedCount: r.modifiedCount }, 'Results published');
  } catch (err) { return fail(res, 500, 'Failed', err); }
};

// ═══════════════════════════════════════════════════════════════
//  DELETE /api/marks/:id
// ═══════════════════════════════════════════════════════════════
exports.deleteMark = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) return fail(res, 400, 'Invalid id');
    const mark = await Mark.findByIdAndDelete(req.params.id);
    if (!mark) return fail(res, 404, 'Not found');
    return ok(res, {}, 'Deleted');
  } catch (err) { return fail(res, 500, 'Failed', err); }
};