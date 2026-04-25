// FILE PATH: controllers/markController.js
//
// IMPORTANT NOTES about the Student schema:
//   - Student.class    → String  (NOT ObjectId, do NOT populate)
//   - Student.userId   → ObjectId → ref: 'User'
//   - Student.rollNumber → Number
//   - Student.section  → String
// ============================================================
const mongoose = require('mongoose');
const Mark    = require('../models/Mark');
const Student = require('../models/Student');

// ── Helpers ───────────────────────────────────────────────────
const ok = (res, data, msg = 'Success', status = 200) =>
  res.status(status).json({ success: true, message: msg, ...data });

const fail = (res, status, msg, err = null) => {
  if (err) console.error(`[markController] ${msg} →`, err.message || err);
  return res.status(status).json({ success: false, message: msg });
};

const isValidId = id => id && mongoose.Types.ObjectId.isValid(id);

// ── Sanitize subjects array from request body ─────────────────
const sanitizeSubjects = (subjects = []) =>
  subjects.map(sub => ({
    code         : String(sub.code  || '').trim(),
    name         : String(sub.name  || '').trim(),
    fullMarks    : Number(sub.fullMarks) || 100,
    passMarks    : Number(sub.passMarks) || 33,
    // Must be a Number or null — never undefined or empty string
    marksObtained: (sub.marksObtained !== null &&
                    sub.marksObtained !== undefined &&
                    sub.marksObtained !== '')
      ? Number(sub.marksObtained)
      : null,
  }));

// ── Populate helper: Student → User (NO populate on 'class') ──
// Student.class is a plain String, NOT an ObjectId reference.
const populateStudent = (query) =>
  query.populate({
    path   : 'student',
    select : 'studentId rollNumber section class userId session',
    populate: {
      path  : 'userId',
      select: 'name email profileImage',
    },
  });

// ═══════════════════════════════════════════════════════════════
//  POST /api/marks  — save / upsert one student's marks
// ═══════════════════════════════════════════════════════════════
exports.saveMarks = async (req, res) => {
  try {
    const {
      studentId,
      examName,
      examYear    = '',
      session     = '',
      program     = 'Degree',
      className   = '',
      section     = '',
      subjects    = [],
      isPublished = false,
      remarks     = '',
    } = req.body;

    // ── Validate ────────────────────────────────────────────────
    if (!studentId)         return fail(res, 400, 'studentId is required');
    if (!examName?.trim())  return fail(res, 400, 'examName is required');
    if (!isValidId(studentId)) return fail(res, 400, 'studentId is not a valid ObjectId');

    // ── Check student exists ─────────────────────────────────────
    const student = await Student.findById(studentId).select('_id');
    if (!student) return fail(res, 404, `No student found with id: ${studentId}`);

    const cleanSubjects = sanitizeSubjects(subjects);

    // ── Try to find existing record ──────────────────────────────
    const filter = {
      student : studentId,
      examName: examName.trim(),
      session : (session || '').trim(),
    };

    let mark = await Mark.findOne(filter);

    if (mark) {
      // ── Update existing ────────────────────────────────────────
      mark.examYear   = examYear;
      mark.program    = program;
      mark.className  = (className || '').trim();
      mark.section    = (section   || '').trim();
      mark.subjects   = cleanSubjects;
      mark.remarks    = (remarks   || '').trim();
      mark.updatedBy  = req.user?._id || null;

      if (isPublished !== undefined) {
        mark.isPublished = Boolean(isPublished);
        if (mark.isPublished && !mark.publishedAt) {
          mark.publishedAt = new Date();
        }
      }
    } else {
      // ── Create new ─────────────────────────────────────────────
      mark = new Mark({
        student    : studentId,
        examName   : examName.trim(),
        examYear   : examYear,
        session    : (session || '').trim(),
        program    : program,
        className  : (className || '').trim(),
        section    : (section   || '').trim(),
        subjects   : cleanSubjects,
        remarks    : (remarks   || '').trim(),
        isPublished: false,
        createdBy  : req.user?._id || null,
        updatedBy  : req.user?._id || null,
      });
    }

    // pre-save hook will compute grades, GPA, result, division
    await mark.save();

    // Fetch populated result for response
    const saved = await populateStudent(
      Mark.findById(mark._id)
    );

    return ok(res, { data: saved }, 'Marks saved successfully');

  } catch (err) {
    // Duplicate key: try find + update
    if (err.code === 11000) {
      try {
        const { studentId, examName, session = '', subjects = [] } = req.body;
        const existing = await Mark.findOne({
          student : studentId,
          examName: String(examName).trim(),
          session : String(session).trim(),
        });
        if (existing) {
          existing.subjects  = sanitizeSubjects(subjects);
          existing.updatedBy = req.user?._id || null;
          await existing.save();
          return ok(res, { data: existing }, 'Marks updated (duplicate handled)');
        }
      } catch (e2) {
        return fail(res, 500, 'Upsert failed after duplicate error', e2);
      }
    }
    return fail(res, 500, 'Failed to save marks', err);
  }
};

// ═══════════════════════════════════════════════════════════════
//  GET /api/marks  — list all marks (admin/teacher)
// ═══════════════════════════════════════════════════════════════
exports.getAllMarks = async (req, res) => {
  try {
    const {
      className, section, program,
      examName, examYear, session,
      result, isPublished,
      search,
      page  = 1,
      limit = 30,
    } = req.query;

    // Build filter
    const filter = {};
    if (className)   filter.className = { $regex: className, $options: 'i' };
    if (section)     filter.section   = section;
    if (program)     filter.program   = program;
    if (examName)    filter.examName  = { $regex: examName, $options: 'i' };
    if (examYear)    filter.examYear  = examYear;
    if (session)     filter.session   = { $regex: session, $options: 'i' };
    if (result)      filter.result    = result.toUpperCase();
    if (isPublished !== undefined && isPublished !== '')
      filter.isPublished = isPublished === 'true';

    const skip  = (Math.max(parseInt(page), 1) - 1) * parseInt(limit);
    const total = await Mark.countDocuments(filter);

    let query = Mark.find(filter)
      .sort({ className: 1, createdAt: -1 })
      .skip(skip)
      .limit(Math.min(parseInt(limit), 100));

    // Populate student + user (NOT class — it's a String)
    query = populateStudent(query);

    let marks = await query.lean();

    // Client-side search filter on student name/roll (if search param provided)
    if (search && search.trim()) {
      const q = search.toLowerCase();
      marks = marks.filter(m =>
        (m.student?.userId?.name     || '').toLowerCase().includes(q) ||
        String(m.student?.rollNumber || '').includes(q)
      );
    }

    return ok(res, { total, count: marks.length, page: parseInt(page), data: marks });
  } catch (err) {
    return fail(res, 500, 'Failed to fetch marks', err);
  }
};

// ═══════════════════════════════════════════════════════════════
//  GET /api/marks/my  — current student's own published results
// ═══════════════════════════════════════════════════════════════
exports.getMyMarks = async (req, res) => {
  try {
    // Find Student record linked to the logged-in User
    const student = await Student
      .findOne({ userId: req.user._id })
      .select('_id');

    if (!student) {
      // User might not be a student — return empty gracefully
      return ok(res, { count: 0, data: [] }, 'No student profile found');
    }

    const marks = await Mark.find({
      student    : student._id,
      isPublished: true,
    })
      .sort({ createdAt: -1 })
      .lean();

    return ok(res, { count: marks.length, data: marks });
  } catch (err) {
    return fail(res, 500, 'Failed to fetch your marks', err);
  }
};

// ═══════════════════════════════════════════════════════════════
//  GET /api/marks/student/:studentId  — one student (admin)
// ═══════════════════════════════════════════════════════════════
exports.getStudentMarks = async (req, res) => {
  try {
    const { studentId } = req.params;
    if (!isValidId(studentId)) return fail(res, 400, 'Invalid studentId');

    const filter = { student: studentId };
    if (req.query.examName) filter.examName = { $regex: req.query.examName, $options: 'i' };
    if (req.query.session)  filter.session  = req.query.session;

    const marks = await populateStudent(
      Mark.find(filter).sort({ createdAt: -1 })
    ).lean();

    return ok(res, { count: marks.length, data: marks });
  } catch (err) {
    return fail(res, 500, 'Failed to fetch student marks', err);
  }
};

// ═══════════════════════════════════════════════════════════════
//  GET /api/marks/stats  — class summary statistics
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

    const marks = await Mark.find(filter)
      .select('result gpa percentage isPublished')
      .lean();

    if (!marks.length) {
      return ok(res, {
        data: { total:0, passed:0, failed:0, incomplete:0, published:0, passRate:0, avgGPA:'0.00', avgPct:'0.00' },
      });
    }

    const total      = marks.length;
    const passed     = marks.filter(m => m.result === 'PASS').length;
    const failed     = marks.filter(m => m.result === 'FAIL').length;
    const incomplete = marks.filter(m => m.result === 'INCOMPLETE' || m.result === 'NOT ENTERED').length;
    const published  = marks.filter(m => m.isPublished).length;
    const passRate   = parseFloat(((passed / total) * 100).toFixed(1));
    const avgGPA     = (marks.reduce((a, m) => a + (m.gpa || 0), 0) / total).toFixed(2);
    const avgPct     = (marks.reduce((a, m) => a + (m.percentage || 0), 0) / total).toFixed(2);

    return ok(res, { data: { total, passed, failed, incomplete, published, passRate, avgGPA, avgPct } });
  } catch (err) {
    return fail(res, 500, 'Failed to get class stats', err);
  }
};

// ═══════════════════════════════════════════════════════════════
//  GET /api/marks/exams  — distinct exam list
// ═══════════════════════════════════════════════════════════════
exports.getExamList = async (req, res) => {
  try {
    const exams = await Mark.aggregate([
      {
        $group: {
          _id    : { examName: '$examName', examYear: '$examYear', program: '$program' },
          count  : { $sum: 1 },
          passed : { $sum: { $cond: [{ $eq: ['$result', 'PASS'] }, 1, 0] } },
          classes: { $addToSet: '$className' },
        },
      },
      { $sort: { '_id.examYear': -1, '_id.examName': 1 } },
      { $limit: 50 },
    ]);
    return ok(res, { count: exams.length, data: exams });
  } catch (err) {
    return fail(res, 500, 'Failed to get exam list', err);
  }
};

// ═══════════════════════════════════════════════════════════════
//  GET /api/marks/:id  — single mark by id
// ═══════════════════════════════════════════════════════════════
exports.getMarkById = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) return fail(res, 400, 'Invalid id');
    const mark = await populateStudent(Mark.findById(req.params.id));
    if (!mark) return fail(res, 404, 'Mark not found');
    return ok(res, { data: mark });
  } catch (err) {
    return fail(res, 500, 'Failed to fetch mark', err);
  }
};

// ═══════════════════════════════════════════════════════════════
//  PUT /api/marks/:id  — update a mark
// ═══════════════════════════════════════════════════════════════
exports.updateMark = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) return fail(res, 400, 'Invalid id');
    const mark = await Mark.findById(req.params.id);
    if (!mark) return fail(res, 404, 'Mark not found');

    if (req.body.subjects)   mark.subjects   = sanitizeSubjects(req.body.subjects);
    if (req.body.examName)   mark.examName   = req.body.examName.trim();
    if (req.body.examYear)   mark.examYear   = req.body.examYear;
    if (req.body.session !== undefined) mark.session   = req.body.session;
    if (req.body.program)    mark.program    = req.body.program;
    if (req.body.className !== undefined) mark.className = req.body.className;
    if (req.body.section  !== undefined)  mark.section  = req.body.section;
    if (req.body.remarks  !== undefined)  mark.remarks  = req.body.remarks;
    if (req.body.isPublished !== undefined) {
      mark.isPublished = Boolean(req.body.isPublished);
      if (mark.isPublished && !mark.publishedAt) mark.publishedAt = new Date();
    }
    mark.updatedBy = req.user?._id || null;

    await mark.save();
    return ok(res, { data: mark }, 'Mark updated');
  } catch (err) {
    return fail(res, 500, 'Failed to update mark', err);
  }
};

// ═══════════════════════════════════════════════════════════════
//  PATCH /api/marks/:id/publish  — toggle publish
// ═══════════════════════════════════════════════════════════════
exports.togglePublish = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) return fail(res, 400, 'Invalid id');

    const mark = await Mark.findById(req.params.id).select('isPublished publishedAt');
    if (!mark) return fail(res, 404, 'Mark not found');

    const nowPublished = !mark.isPublished;

    // Use updateOne so pre-save doesn't re-run (grades unchanged)
    await Mark.updateOne(
      { _id: mark._id },
      {
        $set: {
          isPublished: nowPublished,
          publishedAt: nowPublished ? new Date() : null,
          updatedBy  : req.user?._id || null,
        },
      }
    );

    return ok(res, { data: { _id: mark._id, isPublished: nowPublished } },
      `Result ${nowPublished ? 'published' : 'unpublished'}`);
  } catch (err) {
    return fail(res, 500, 'Failed to toggle publish', err);
  }
};

// ═══════════════════════════════════════════════════════════════
//  POST /api/marks/publish-class  — publish all for a class
// ═══════════════════════════════════════════════════════════════
exports.publishClassResults = async (req, res) => {
  try {
    const { className, section, examName, session, publish = true } = req.body;
    if (!className || !examName)
      return fail(res, 400, 'className and examName are required');

    const filter = {
      className: { $regex: className, $options: 'i' },
      examName : { $regex: examName,  $options: 'i' },
    };
    if (section) filter.section = section;
    if (session) filter.session = { $regex: session, $options: 'i' };

    const result = await Mark.updateMany(filter, {
      $set: {
        isPublished: Boolean(publish),
        publishedAt: publish ? new Date() : null,
        updatedBy  : req.user?._id || null,
      },
    });

    return ok(res,
      { count: result.modifiedCount },
      `${result.modifiedCount} results ${publish ? 'published' : 'unpublished'}`
    );
  } catch (err) {
    return fail(res, 500, 'Failed to publish class results', err);
  }
};

// ═══════════════════════════════════════════════════════════════
//  POST /api/marks/bulk  — bulk save entire class
// ═══════════════════════════════════════════════════════════════
exports.saveBulkMarks = async (req, res) => {
  try {
    const { marksArray } = req.body;
    if (!Array.isArray(marksArray) || !marksArray.length)
      return fail(res, 400, 'marksArray is required');

    let saved = 0, failed = 0;
    const errors = [];

    for (const item of marksArray) {
      try {
        const { studentId, examName, session = '' } = item;
        if (!studentId || !examName) { failed++; continue; }

        const cleanSubs = sanitizeSubjects(item.subjects || []);
        let mark = await Mark.findOne({
          student : studentId,
          examName: String(examName).trim(),
          session : String(session).trim(),
        });

        if (mark) {
          mark.subjects  = cleanSubs;
          mark.updatedBy = req.user?._id || null;
          ['examYear','program','className','section'].forEach(f => {
            if (item[f] !== undefined) mark[f] = item[f];
          });
        } else {
          mark = new Mark({
            student  : studentId,
            examName : String(examName).trim(),
            examYear : item.examYear  || '',
            session  : String(session).trim(),
            program  : item.program   || 'Degree',
            className: item.className || '',
            section  : item.section   || '',
            subjects : cleanSubs,
            createdBy: req.user?._id  || null,
            updatedBy: req.user?._id  || null,
          });
        }

        await mark.save();
        saved++;
      } catch (e) {
        failed++;
        errors.push(e.message);
      }
    }

    return ok(res,
      { data: { saved, failed, errors: errors.slice(0, 10) } },
      `${saved} marks saved, ${failed} failed`
    );
  } catch (err) {
    return fail(res, 500, 'Failed to save bulk marks', err);
  }
};

// ═══════════════════════════════════════════════════════════════
//  DELETE /api/marks/:id
// ═══════════════════════════════════════════════════════════════
exports.deleteMark = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) return fail(res, 400, 'Invalid id');
    const mark = await Mark.findByIdAndDelete(req.params.id);
    if (!mark) return fail(res, 404, 'Mark not found');
    return ok(res, {}, 'Mark deleted');
  } catch (err) {
    return fail(res, 500, 'Failed to delete mark', err);
  }
};