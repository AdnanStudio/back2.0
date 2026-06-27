const ClassRoutine = require('../models/ClassRoutine');
const Class = require('../models/Class');
const Teacher = require('../models/Teacher');
const Subject = require('../models/Subject');

// ✅ Create Class Routine (Admin Only)
exports.createRoutine = async (req, res) => {
  try {
    const { classId, schedule, academicYear } = req.body;

    // Check if class exists
    const classExists = await Class.findById(classId);
    if (!classExists) {
      return res.status(404).json({
        success: false,
        message: 'Class not found'
      });
    }

    // Deactivate previous routines for this class
    await ClassRoutine.updateMany(
      { class: classId, academicYear, isActive: true },
      { isActive: false }
    );

    // Create new routine
    const routine = await ClassRoutine.create({
      class: classId,
      academicYear: academicYear || new Date().getFullYear().toString(),
      schedule,
      createdBy: req.user._id
    });

    const populatedRoutine = await ClassRoutine.findById(routine._id)
      .populate('class')
      .populate('schedule.periods.subject')
      .populate('schedule.periods.teacher');

    res.status(201).json({
      success: true,
      message: 'Class routine created successfully',
      data: populatedRoutine
    });
  } catch (error) {
    console.error('Create Routine Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create routine'
    });
  }
};

// ✅ Get All Routines (Admin - all, Teacher - their classes, Student - their class)
exports.getAllRoutines = async (req, res) => {
  try {
    const { academicYear } = req.query;
    let query = { isActive: true };

    if (academicYear) {
      query.academicYear = academicYear;
    }

    // Role-based filtering
    if (req.user.role === 'student') {
      const Student = require('../models/Student');
      const student = await Student.findOne({ userId: req.user._id }).populate('class');
      if (!student) {
        return res.status(404).json({
          success: false,
          message: 'Student profile not found'
        });
      }
      if (student.class) query.class = student.class._id || student.class;
    } else if (req.user.role === 'teacher') {
      const teacher = await Teacher.findOne({ userId: req.user._id });
      if (!teacher) {
        return res.status(404).json({
          success: false,
          message: 'Teacher profile not found'
        });
      }
      // Teacher can see routines where they teach
      const routines = await ClassRoutine.find(query)
        .populate('class')
        .populate('schedule.periods.subject')
        .populate('schedule.periods.teacher');

      const teacherRoutines = routines.map(routine => {
        const scheduleWithHighlight = routine.schedule.map(day => ({
          ...day.toObject(),
          periods: day.periods.map(period => ({
            ...period.toObject(),
            isMyClass: period.teacher?._id?.toString() === teacher._id.toString()
          }))
        }));

        return {
          ...routine.toObject(),
          schedule: scheduleWithHighlight
        };
      });

      return res.status(200).json({
        success: true,
        data: teacherRoutines
      });
    }

    const routines = await ClassRoutine.find(query)
      .populate('class')
      .populate('schedule.periods.subject')
      .populate('schedule.periods.teacher')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: routines
    });
  } catch (error) {
    console.error('Get Routines Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch routines'
    });
  }
};

// ✅ Get Single Routine by ID
exports.getRoutineById = async (req, res) => {
  try {
    const routine = await ClassRoutine.findById(req.params.id)
      .populate('class')
      .populate('schedule.periods.subject')
      .populate('schedule.periods.teacher');

    if (!routine) {
      return res.status(404).json({
        success: false,
        message: 'Routine not found'
      });
    }

    // Check access permission
    if (req.user.role === 'student') {
      const Student = require('../models/Student');
      const student = await Student.findOne({ userId: req.user._id });
      if (!routine.class || routine.class._id.toString() !== student.class.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }
    }

    res.status(200).json({
      success: true,
      data: routine
    });
  } catch (error) {
    console.error('Get Routine Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch routine'
    });
  }
};

// ✅ Update Routine (Admin Only)
exports.updateRoutine = async (req, res) => {
  try {
    const { schedule } = req.body;

    const routine = await ClassRoutine.findByIdAndUpdate(
      req.params.id,
      { schedule },
      { new: true, runValidators: true }
    )
      .populate('class')
      .populate('schedule.periods.subject')
      .populate('schedule.periods.teacher');

    if (!routine) {
      return res.status(404).json({
        success: false,
        message: 'Routine not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Routine updated successfully',
      data: routine
    });
  } catch (error) {
    console.error('Update Routine Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update routine'
    });
  }
};

// ✅ Delete Routine (Admin Only)
exports.deleteRoutine = async (req, res) => {
  try {
    const routine = await ClassRoutine.findByIdAndDelete(req.params.id);

    if (!routine) {
      return res.status(404).json({
        success: false,
        message: 'Routine not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Routine deleted successfully'
    });
  } catch (error) {
    console.error('Delete Routine Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete routine'
    });
  }
};

// ✅ Get Routine by Class ID
exports.getRoutineByClass = async (req, res) => {
  try {
    const { classId } = req.params;
    const { academicYear } = req.query;

    const query = {
      class: classId,
      isActive: true
    };

    if (academicYear) {
      query.academicYear = academicYear;
    }

    const routine = await ClassRoutine.findOne(query)
      .populate('class')
      .populate('schedule.periods.subject')
      .populate('schedule.periods.teacher');

    if (!routine) {
      return res.status(404).json({
        success: false,
        message: 'No routine found for this class'
      });
    }

    res.status(200).json({
      success: true,
      data: routine
    });
  } catch (error) {
    console.error('Get Class Routine Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch class routine'
    });
  }
};
