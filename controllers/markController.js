const Mark    = require('../models/Mark');
const Student = require('../models/Student');
const Class   = require('../models/Class');
const Subject = require('../models/Subject');

// ── Helper: get subjects for a class ─────────────────────────────────────
// Student.class is a STRING (class name), not ObjectId
const getSubjectsForClass = async (classDoc) => {
  // First try Subject collection (Subject.class = classDoc._id)
  let subjects = await Subject.find({ class: classDoc._id, isActive: true }).lean();

  // Fallback: use embedded subjects from Class.subjects array
  if (!subjects.length && classDoc.subjects?.length) {
    subjects = classDoc.subjects.map((s, i) => ({
      _id:          `emb_${i}_${s.name || i}`,
      name:         s.name || `Subject ${i + 1}`,
      code:         s.code || (s.name ? s.name.substring(0, 3).toUpperCase() : `S${i + 1}`),
      type:         'Theory',
      totalMarks:   100,
      passingMarks: 33,
    }));
  }

  return subjects;
};

// ════════════════════════════════════════════════════════════════════════════
// GET CLASS STUDENTS FOR MARK ENTRY
// GET /api/marks/class/:classId/students
// ════════════════════════════════════════════════════════════════════════════
exports.getClassStudentsForMark = async (req, res) => {
  try {
    const { classId }               = req.params;
    const { examType, examYear }    = req.query;

    // Get class document
    const classDoc = await Class.findById(classId).lean();
    if (!classDoc) {
      return res.status(404).json({ success: false, message: 'Class not found' });
    }

    // ⚠️ Student.class = String (class name like "Class 10")
    // Match by class name, NOT ObjectId
    const students = await Student.find({ class: classDoc.name })
      .populate('userId', 'name email profileImage dateOfBirth phone')
      .sort({ rollNumber: 1 })
      .lean();

    // Get subjects
    const subjects = await getSubjectsForClass(classDoc);

    // Get existing marks for this exam (to pre-fill the grid)
    let existingMarksMap = {};
    if (examType && examYear) {
      const existingMarks = await Mark.find({
        class:    classId,
        examType,
        examYear: parseInt(examYear),
      }).lean();
      existingMarks.forEach(m => {
        existingMarksMap[m.student.toString()] = m;
      });
    }

    // Build student list
    const studentsData = students
      .filter(s => s.userId)
      .map(student => ({
        student: {
          _id:          student._id,
          name:         student.userId.name   || 'Unknown',
          email:        student.userId.email  || '',
          profileImage: student.userId.profileImage || '',
          dateOfBirth:  student.userId.dateOfBirth,
          studentId:    student.studentId  || '',
          rollNumber:   student.rollNumber || '',
          section:      student.section   || '',
        },
        existingMark: existingMarksMap[student._id.toString()] || null,
      }));

    return res.status(200).json({
      success: true,
      data: {
        class: {
          _id:     classDoc._id,
          name:    classDoc.name,
          section: classDoc.section,
        },
        subjects,
        students:      studentsData,
        totalStudents: studentsData.length,
      },
    });
  } catch (error) {
    console.error('❌ getClassStudentsForMark:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to load class data',
      error: error.message,
    });
  }
};

// ════════════════════════════════════════════════════════════════════════════
// SAVE BULK MARKS (entire class at once)
// POST /api/marks/bulk
// ════════════════════════════════════════════════════════════════════════════
exports.saveBulkMarks = async (req, res) => {
  try {
    const { classId, examType, examYear, marksData } = req.body;

    if (!classId || !examType || !examYear || !Array.isArray(marksData)) {
      return res.status(400).json({
        success: false,
        message: 'classId, examType, examYear, marksData[] are required',
      });
    }

    let savedCount = 0;
    const errors   = [];

    for (const entry of marksData) {
      try {
        if (!entry.studentId) continue;

        const filter = {
          student:  entry.studentId,
          class:    classId,
          examType,
          examYear: parseInt(examYear),
        };

        const existing = await Mark.findOne(filter);
        if (existing) {
          existing.subjects   = entry.subjects || [];
          existing.updatedBy  = req.user._id;
          await existing.save();
        } else {
          await Mark.create({
            ...filter,
            subjects:  entry.subjects || [],
            createdBy: req.user._id,
          });
        }
        savedCount++;
      } catch (err) {
        errors.push({ studentId: entry.studentId, error: err.message });
      }
    }

    return res.status(200).json({
      success: true,
      message: `Marks saved for ${savedCount} student${savedCount !== 1 ? 's' : ''}${errors.length ? ` (${errors.length} errors)` : ''}`,
      savedCount,
      errors: errors.length ? errors : undefined,
    });
  } catch (error) {
    console.error('❌ saveBulkMarks:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to save marks',
      error: error.message,
    });
  }
};

// ════════════════════════════════════════════════════════════════════════════
// SAVE SINGLE STUDENT MARK
// POST /api/marks
// ════════════════════════════════════════════════════════════════════════════
exports.saveMark = async (req, res) => {
  try {
    const { studentId, classId, examType, examYear, subjects } = req.body;

    if (!studentId || !classId || !examType || !examYear) {
      return res.status(400).json({
        success: false,
        message: 'studentId, classId, examType, examYear are required',
      });
    }

    const filter = {
      student:  studentId,
      class:    classId,
      examType,
      examYear: parseInt(examYear),
    };

    let mark = await Mark.findOne(filter);
    if (mark) {
      mark.subjects  = subjects;
      mark.updatedBy = req.user._id;
      await mark.save();
    } else {
      mark = await Mark.create({ ...filter, subjects, createdBy: req.user._id });
    }

    const populated = await Mark.findById(mark._id)
      .populate({ path: 'student', populate: { path: 'userId', select: 'name email profileImage' } });

    return res.status(200).json({ success: true, message: 'Mark saved successfully', data: populated });
  } catch (error) {
    console.error('❌ saveMark:', error.message);
    return res.status(500).json({ success: false, message: 'Failed to save mark', error: error.message });
  }
};

// ════════════════════════════════════════════════════════════════════════════
// GET ALL MARKS FOR A CLASS
// GET /api/marks/class/:classId
// ════════════════════════════════════════════════════════════════════════════
exports.getClassMarks = async (req, res) => {
  try {
    const { classId }            = req.params;
    const { examType, examYear } = req.query;

    const query = { class: classId };
    if (examType) query.examType = examType;
    if (examYear) query.examYear = parseInt(examYear);

    const marks = await Mark.find(query)
      .populate({ path: 'student', populate: { path: 'userId', select: 'name email profileImage' } })
      .sort({ percentage: -1 });

    return res.status(200).json({ success: true, count: marks.length, data: marks });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to get marks', error: error.message });
  }
};

// ════════════════════════════════════════════════════════════════════════════
// PUBLISH MARKS
// PUT /api/marks/publish
// ════════════════════════════════════════════════════════════════════════════
exports.publishMarks = async (req, res) => {
  try {
    const { classId, examType, examYear } = req.body;

    const marks = await Mark.find({
      class:    classId,
      examType,
      examYear: parseInt(examYear),
    }).populate({ path: 'student', populate: { path: 'userId', select: '_id name' } });

    if (!marks.length) {
      return res.status(404).json({
        success: false,
        message: 'No marks found. Enter and save marks first.',
      });
    }

    // Sort by percentage to assign position
    const sorted = [...marks].sort((a, b) => (b.percentage || 0) - (a.percentage || 0));

    for (let i = 0; i < sorted.length; i++) {
      const m   = sorted[i];
      m.isPublished = true;
      m.publishedAt = new Date();
      m.position    = i + 1;
      m.result      = m.grade === 'F' ? 'Fail' : 'Pass';
      await m.save();

      // Notify student (non-critical)
      try {
        const Notification = require('../models/Notification');
        if (m.student?.userId?._id) {
          await Notification.create({
            recipient: m.student.userId._id,
            type:      'result',
            title:     '📊 Result Published!',
            message:   `Your ${examType.replace(/_/g, ' ')} ${examYear} result is now available. GPA: ${m.gpa}, Grade: ${m.grade}`,
            link:      '/dashboard/my-marks',
          });
        }
      } catch (_) { /* notification failure is non-critical */ }
    }

    return res.status(200).json({
      success: true,
      message: `✅ Results published for ${marks.length} students`,
      count: marks.length,
    });
  } catch (error) {
    console.error('❌ publishMarks:', error.message);
    return res.status(500).json({ success: false, message: 'Failed to publish', error: error.message });
  }
};

// ════════════════════════════════════════════════════════════════════════════
// UNPUBLISH MARKS
// PUT /api/marks/unpublish
// ════════════════════════════════════════════════════════════════════════════
exports.unpublishMarks = async (req, res) => {
  try {
    const { classId, examType, examYear } = req.body;
    const result = await Mark.updateMany(
      { class: classId, examType, examYear: parseInt(examYear) },
      { isPublished: false, publishedAt: null, result: 'Not Published', position: 0 }
    );
    return res.status(200).json({
      success: true,
      message: `Unpublished ${result.modifiedCount} records`,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to unpublish', error: error.message });
  }
};

// ════════════════════════════════════════════════════════════════════════════
// GET MARK STATISTICS
// GET /api/marks/stats/:classId
// ════════════════════════════════════════════════════════════════════════════
exports.getMarkStats = async (req, res) => {
  try {
    const { classId }            = req.params;
    const { examType, examYear } = req.query;

    if (!examType || !examYear) {
      return res.status(400).json({ success: false, message: 'examType and examYear are required' });
    }

    const marks = await Mark.find({
      class:    classId,
      examType,
      examYear: parseInt(examYear),
    }).populate({ path: 'student', populate: { path: 'userId', select: 'name' } }).lean();

    if (!marks.length) {
      return res.status(200).json({ success: true, data: null, message: 'No marks yet' });
    }

    const total      = marks.length;
    const published  = marks.filter(m => m.isPublished).length;
    const passed     = marks.filter(m => m.result === 'Pass').length;
    const failed     = marks.filter(m => m.result === 'Fail').length;
    const avgPct     = marks.reduce((a, m) => a + (m.percentage || 0), 0) / total;
    const avgGpa     = marks.reduce((a, m) => a + (m.gpa || 0), 0) / total;

    const sorted  = [...marks].sort((a, b) => (b.percentage || 0) - (a.percentage || 0));
    const highest = sorted[0];
    const lowest  = sorted[sorted.length - 1];

    const gradeDistribution = {};
    marks.forEach(m => {
      if (m.grade) gradeDistribution[m.grade] = (gradeDistribution[m.grade] || 0) + 1;
    });

    return res.status(200).json({
      success: true,
      data: {
        total, published, passed, failed,
        notPublished: total - published,
        passRate:     total > 0 ? parseFloat(((passed / total) * 100).toFixed(1)) : 0,
        avgPercentage: parseFloat(avgPct.toFixed(2)),
        avgGpa:        parseFloat(avgGpa.toFixed(2)),
        highest: {
          student:    highest?.student?.userId?.name || 'N/A',
          percentage: highest?.percentage || 0,
          gpa:        highest?.gpa || 0,
          grade:      highest?.grade || '',
        },
        lowest: {
          student:    lowest?.student?.userId?.name || 'N/A',
          percentage: lowest?.percentage || 0,
          gpa:        lowest?.gpa || 0,
          grade:      lowest?.grade || '',
        },
        gradeDistribution,
      },
    });
  } catch (error) {
    console.error('❌ getMarkStats:', error.message);
    return res.status(500).json({ success: false, message: 'Failed to get stats', error: error.message });
  }
};

// ════════════════════════════════════════════════════════════════════════════
// GET STUDENT MARKS (own for student, any for admin/teacher)
// GET /api/marks/student/:studentId
// ════════════════════════════════════════════════════════════════════════════
exports.getStudentMarks = async (req, res) => {
  try {
    const query              = { student: req.params.studentId };
    const { examType, examYear } = req.query;

    if (req.user.role === 'student') {
      const studentRecord = await Student.findOne({ userId: req.user._id });
      if (!studentRecord) {
        return res.status(404).json({ success: false, message: 'Student profile not found' });
      }
      query.student     = studentRecord._id;
      query.isPublished = true;
    }

    if (examType) query.examType = examType;
    if (examYear) query.examYear = parseInt(examYear);

    const marks = await Mark.find(query)
      .populate({ path: 'student', populate: { path: 'userId', select: 'name email profileImage dateOfBirth' } })
      .populate('class', 'name section')
      .sort({ examYear: -1, createdAt: -1 });

    return res.status(200).json({ success: true, count: marks.length, data: marks });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to get student marks', error: error.message });
  }
};

// ════════════════════════════════════════════════════════════════════════════
// GET SINGLE MARK
// GET /api/marks/:id
// ════════════════════════════════════════════════════════════════════════════
exports.getMark = async (req, res) => {
  try {
    const mark = await Mark.findById(req.params.id)
      .populate({ path: 'student', populate: { path: 'userId', select: 'name email phone profileImage dateOfBirth' } })
      .populate('class', 'name section');

    if (!mark) return res.status(404).json({ success: false, message: 'Mark not found' });
    return res.status(200).json({ success: true, data: mark });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// ════════════════════════════════════════════════════════════════════════════
// DELETE MARK
// DELETE /api/marks/:id
// ════════════════════════════════════════════════════════════════════════════
exports.deleteMark = async (req, res) => {
  try {
    const mark = await Mark.findByIdAndDelete(req.params.id);
    if (!mark) return res.status(404).json({ success: false, message: 'Mark not found' });
    return res.status(200).json({ success: true, message: 'Mark deleted successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to delete', error: error.message });
  }
};

// ════════════════════════════════════════════════════════════════════════════
// ADMIT CARD DATA
// GET /api/marks/admit-card/:classId
// ════════════════════════════════════════════════════════════════════════════
exports.getAdmitCardData = async (req, res) => {
  try {
    const { classId }              = req.params;
    const { examType, examYear, studentId } = req.query;

    const classDoc = await Class.findById(classId).lean();
    if (!classDoc) return res.status(404).json({ success: false, message: 'Class not found' });

    // ⚠️ Student.class = String
    const studentQuery = { class: classDoc.name };
    if (studentId) studentQuery._id = studentId;

    const students = await Student.find(studentQuery)
      .populate('userId', 'name email profileImage dateOfBirth')
      .sort({ rollNumber: 1 });

    const subjects = await getSubjectsForClass(classDoc);

    const admitCards = students.filter(s => s.userId).map(student => ({
      student: {
        _id:          student._id,
        name:         student.userId.name,
        profileImage: student.userId.profileImage,
        dateOfBirth:  student.userId.dateOfBirth,
        studentId:    student.studentId || '',
        rollNumber:   student.rollNumber || '',
        section:      student.section || classDoc.section || '',
      },
      class:    { _id: classDoc._id, name: classDoc.name, section: classDoc.section },
      examType,
      examYear,
      subjects: subjects.map(s => ({
        _id:          s._id,
        name:         s.name,
        code:         s.code || '',
        hasPractical: s.type === 'Practical' || s.type === 'Both' || false,
        hasMCQ:       s.hasMCQ || false,
      })),
    }));

    return res.status(200).json({ success: true, count: admitCards.length, data: admitCards });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to get admit card data', error: error.message });
  }
};

// ════════════════════════════════════════════════════════════════════════════
// RESULT SHEET DATA
// GET /api/marks/result-sheet/:classId
// ════════════════════════════════════════════════════════════════════════════
exports.getResultSheetData = async (req, res) => {
  try {
    const { classId }              = req.params;
    const { examType, examYear, studentId } = req.query;

    const query = { class: classId, examType, examYear: parseInt(examYear) };

    if (req.user.role === 'student') {
      const studentRecord = await Student.findOne({ userId: req.user._id });
      if (!studentRecord) return res.status(404).json({ success: false, message: 'Student not found' });
      query.student     = studentRecord._id;
      query.isPublished = true;
    } else if (studentId) {
      query.student = studentId;
    }

    const marks = await Mark.find(query)
      .populate({ path: 'student', populate: { path: 'userId', select: 'name email profileImage dateOfBirth phone' } })
      .populate('class', 'name section')
      .sort({ position: 1, percentage: -1 });

    return res.status(200).json({ success: true, count: marks.length, data: marks });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to get result sheets', error: error.message });
  }
};
