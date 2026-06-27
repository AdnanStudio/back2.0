const Attendance = require('../models/Attendance');
const Student = require('../models/Student');
const Class = require('../models/Class');

// @desc    Mark single attendance
// @route   POST /api/attendance
// @access  Private (Teacher/Admin)
exports.markAttendance = async (req, res) => {
  try {
    const { student, class: classId, date, status, remarks } = req.body;

    // Normalize date to start of day
    const attendanceDate = new Date(date);
    attendanceDate.setHours(0, 0, 0, 0);

    // Check if attendance already exists
    const existingAttendance = await Attendance.findOne({
      student,
      class: classId,
      date: {
        $gte: attendanceDate,
        $lt: new Date(attendanceDate.getTime() + 24 * 60 * 60 * 1000)
      }
    });

    if (existingAttendance) {
      return res.status(400).json({
        success: false,
        message: 'Attendance already marked for this student today'
      });
    }

    const attendance = await Attendance.create({
      student,
      class: classId,
      date: attendanceDate,
      status,
      remarks: remarks || '',
      markedBy: req.user._id
    });

    const populatedAttendance = await Attendance.findById(attendance._id)
      .populate({
        path: 'student',
        populate: {
          path: 'userId',
          select: 'name email profileImage'
        }
      })
      .populate('class', 'name section');

    res.status(201).json({
      success: true,
      message: 'Attendance marked successfully',
      data: populatedAttendance
    });
  } catch (error) {
    console.error('Mark Attendance Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Mark bulk attendance for a class
// @route   POST /api/attendance/bulk
// @access  Private (Teacher/Admin)
exports.markBulkAttendance = async (req, res) => {
  try {
    const { classId, date, attendanceList } = req.body;

    if (!classId || !date || !attendanceList || attendanceList.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Class ID, date and attendance list are required'
      });
    }

    // Normalize date
    const attendanceDate = new Date(date);
    attendanceDate.setHours(0, 0, 0, 0);

    // Check if class exists
    const classExists = await Class.findById(classId);
    if (!classExists) {
      return res.status(404).json({
        success: false,
        message: 'Class not found'
      });
    }

    // Delete existing attendance for this class and date
    await Attendance.deleteMany({
      class: classId,
      date: {
        $gte: attendanceDate,
        $lt: new Date(attendanceDate.getTime() + 24 * 60 * 60 * 1000)
      }
    });

    // Create new attendance records
    const attendanceRecords = attendanceList.map(record => ({
      student: record.studentId,
      class: classId,
      date: attendanceDate,
      status: record.status || 'present',
      remarks: record.remarks || '',
      markedBy: req.user._id
    }));

    const createdRecords = await Attendance.insertMany(attendanceRecords);

    res.status(201).json({
      success: true,
      message: `Attendance marked for ${createdRecords.length} students`,
      data: {
        count: createdRecords.length,
        date: attendanceDate
      }
    });
  } catch (error) {
    console.error('Bulk Attendance Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Get attendance by class and date
// @route   GET /api/attendance/class/:classId?date=YYYY-MM-DD
// @access  Private
exports.getAttendanceByClass = async (req, res) => {
  try {
    const { classId } = req.params;
    const { date, startDate, endDate } = req.query;

    let query = { class: classId };

    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

      query.date = { $gte: startOfDay, $lt: endOfDay };
    } else if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const attendance = await Attendance.find(query)
      .populate({
        path: 'student',
        populate: {
          path: 'userId',
          select: 'name email profileImage'
        }
      })
      .populate('class', 'name section')
      .populate('markedBy', 'name')
      .sort({ date: -1, 'student.rollNumber': 1 });

    res.status(200).json({
      success: true,
      count: attendance.length,
      data: attendance
    });
  } catch (error) {
    console.error('Get Attendance Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Get attendance by student
// @route   GET /api/attendance/student/:studentId?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
// @access  Private
exports.getAttendanceByStudent = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { startDate, endDate } = req.query;

    let query = { student: studentId };

    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const attendance = await Attendance.find(query)
      .populate('class', 'name section')
      .populate('markedBy', 'name')
      .sort({ date: -1 });

    // Calculate statistics
    const total = attendance.length;
    const present = attendance.filter(a => a.status === 'present').length;
    const absent = attendance.filter(a => a.status === 'absent').length;
    const late = attendance.filter(a => a.status === 'late').length;
    const leave = attendance.filter(a => a.status === 'leave').length;

    const percentage = total > 0 ? ((present / total) * 100).toFixed(2) : 0;

    res.status(200).json({
      success: true,
      data: {
        attendance,
        statistics: {
          total,
          present,
          absent,
          late,
          leave,
          percentage: `${percentage}%`
        }
      }
    });
  } catch (error) {
    console.error('Get Student Attendance Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Update attendance
// @route   PUT /api/attendance/:id
// @access  Private (Teacher/Admin)
exports.updateAttendance = async (req, res) => {
  try {
    const { status, remarks } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required'
      });
    }

    const attendance = await Attendance.findByIdAndUpdate(
      req.params.id,
      { status, remarks: remarks || '' },
      { new: true, runValidators: true }
    )
      .populate({
        path: 'student',
        populate: {
          path: 'userId',
          select: 'name email profileImage'
        }
      })
      .populate('class', 'name section');

    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: 'Attendance record not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Attendance updated successfully',
      data: attendance
    });
  } catch (error) {
    console.error('Update Attendance Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Delete attendance
// @route   DELETE /api/attendance/:id
// @access  Private (Admin only)
exports.deleteAttendance = async (req, res) => {
  try {
    const attendance = await Attendance.findByIdAndDelete(req.params.id);

    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: 'Attendance record not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Attendance deleted successfully'
    });
  } catch (error) {
    console.error('Delete Attendance Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Get attendance report for a class
// @route   GET /api/attendance/report/:classId?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
// @access  Private
exports.getAttendanceReport = async (req, res) => {
  try {
    const { classId } = req.params;
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Start date and end date are required'
      });
    }

    // Get class with students
    const classData = await Class.findById(classId).populate({
      path: 'students',
      populate: {
        path: 'userId',
        select: 'name email profileImage'
      }
    });

    if (!classData) {
      return res.status(404).json({
        success: false,
        message: 'Class not found'
      });
    }

    // Get attendance records
    const attendanceRecords = await Attendance.find({
      class: classId,
      date: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    });

    // Calculate report for each student
    const report = classData.students.map(student => {
      const studentAttendance = attendanceRecords.filter(
        record => record.student.toString() === student._id.toString()
      );

      const total = studentAttendance.length;
      const present = studentAttendance.filter(a => a.status === 'present').length;
      const absent = studentAttendance.filter(a => a.status === 'absent').length;
      const late = studentAttendance.filter(a => a.status === 'late').length;
      const leave = studentAttendance.filter(a => a.status === 'leave').length;

      const percentage = total > 0 ? ((present / total) * 100).toFixed(2) : 0;

      return {
        student: {
          _id: student._id,
          name: student.userId?.name,
          email: student.userId?.email,
          profileImage: student.userId?.profileImage,
          studentId: student.studentId,
          rollNumber: student.rollNumber
        },
        statistics: {
          total,
          present,
          absent,
          late,
          leave,
          percentage: `${percentage}%`
        }
      };
    });

    // Sort by roll number
    report.sort((a, b) => a.student.rollNumber - b.student.rollNumber);

    res.status(200).json({
      success: true,
      data: {
        class: {
          _id: classData._id,
          name: classData.name,
          section: classData.section
        },
        dateRange: {
          startDate,
          endDate
        },
        report
      }
    });
  } catch (error) {
    console.error('Get Report Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Mark all students as present
// @route   POST /api/attendance/mark-all-present
// @access  Private (Teacher/Admin)
exports.markAllPresent = async (req, res) => {
  try {
    const { classId, date } = req.body;

    if (!classId || !date) {
      return res.status(400).json({
        success: false,
        message: 'Class ID and date are required'
      });
    }

    // Get all students in the class
    const classData = await Class.findById(classId).populate('students');

    if (!classData) {
      return res.status(404).json({
        success: false,
        message: 'Class not found'
      });
    }

    const attendanceDate = new Date(date);
    attendanceDate.setHours(0, 0, 0, 0);

    // Delete existing attendance
    await Attendance.deleteMany({
      class: classId,
      date: {
        $gte: attendanceDate,
        $lt: new Date(attendanceDate.getTime() + 24 * 60 * 60 * 1000)
      }
    });

    // Mark all as present
    const attendanceRecords = classData.students.map(student => ({
      student: student._id,
      class: classId,
      date: attendanceDate,
      status: 'present',
      remarks: 'Marked all present',
      markedBy: req.user._id
    }));

    const createdRecords = await Attendance.insertMany(attendanceRecords);

    res.status(201).json({
      success: true,
      message: `All ${createdRecords.length} students marked as present`,
      data: {
        count: createdRecords.length,
        date: attendanceDate
      }
    });
  } catch (error) {
    console.error('Mark All Present Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};
