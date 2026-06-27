const Class = require('../models/Class');
const Teacher = require('../models/Teacher');
const Student = require('../models/Student');

// @desc    Create new class
// @route   POST /api/classes
// @access  Private (Admin only)
exports.createClass = async (req, res) => {
  try {
    const { name, section, classTeacher, subjects } = req.body;

    // Check if class already exists
    const classExists = await Class.findOne({ name, section });
    if (classExists) {
      return res.status(400).json({
        success: false,
        message: 'Class with this name and section already exists'
      });
    }

    const newClass = await Class.create({
      name,
      section,
      classTeacher,
      subjects: subjects || []
    });

    const populatedClass = await Class.findById(newClass._id)
      .populate('classTeacher', 'userId employeeId')
      .populate('classTeacher.userId', 'name email');

    res.status(201).json({
      success: true,
      message: 'Class created successfully',
      data: populatedClass
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Get all classes
// @route   GET /api/classes
// @access  Private
exports.getAllClasses = async (req, res) => {
  try {
    const classes = await Class.find()
      .populate('classTeacher')
      .populate({
        path: 'classTeacher',
        populate: {
          path: 'userId',
          select: 'name email profileImage'
        }
      })
      .populate({
        path: 'subjects.teacher',
        populate: {
          path: 'userId',
          select: 'name email'
        }
      })
      .sort({ name: 1, section: 1 });

    res.status(200).json({
      success: true,
      count: classes.length,
      data: classes
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Get single class
// @route   GET /api/classes/:id
// @access  Private
exports.getClass = async (req, res) => {
  try {
    const classData = await Class.findById(req.params.id)
      .populate({
        path: 'classTeacher',
        populate: {
          path: 'userId',
          select: 'name email phone profileImage'
        }
      })
      .populate({
        path: 'students',
        populate: {
          path: 'userId',
          select: 'name email profileImage'
        }
      })
      .populate({
        path: 'subjects.teacher',
        populate: {
          path: 'userId',
          select: 'name email'
        }
      });

    if (!classData) {
      return res.status(404).json({
        success: false,
        message: 'Class not found'
      });
    }

    res.status(200).json({
      success: true,
      data: classData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Update class
// @route   PUT /api/classes/:id
// @access  Private (Admin only)
exports.updateClass = async (req, res) => {
  try {
    const { name, section, classTeacher, subjects } = req.body;

    const classData = await Class.findByIdAndUpdate(
      req.params.id,
      { name, section, classTeacher, subjects },
      { new: true, runValidators: true }
    )
      .populate('classTeacher')
      .populate({
        path: 'classTeacher',
        populate: {
          path: 'userId',
          select: 'name email'
        }
      });

    if (!classData) {
      return res.status(404).json({
        success: false,
        message: 'Class not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Class updated successfully',
      data: classData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Delete class
// @route   DELETE /api/classes/:id
// @access  Private (Admin only)
exports.deleteClass = async (req, res) => {
  try {
    const classData = await Class.findByIdAndDelete(req.params.id);

    if (!classData) {
      return res.status(404).json({
        success: false,
        message: 'Class not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Class deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Add student to class
// @route   POST /api/classes/:id/students
// @access  Private (Admin/Teacher)
exports.addStudentToClass = async (req, res) => {
  try {
    const { studentId } = req.body;

    const classData = await Class.findById(req.params.id);
    const student = await Student.findById(studentId);

    if (!classData) {
      return res.status(404).json({
        success: false,
        message: 'Class not found'
      });
    }

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Check if student already in class
    if (classData.students.includes(studentId)) {
      return res.status(400).json({
        success: false,
        message: 'Student already in this class'
      });
    }

    classData.students.push(studentId);
    await classData.save();

    res.status(200).json({
      success: true,
      message: 'Student added to class successfully',
      data: classData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Remove student from class
// @route   DELETE /api/classes/:id/students/:studentId
// @access  Private (Admin/Teacher)
exports.removeStudentFromClass = async (req, res) => {
  try {
    const classData = await Class.findById(req.params.id);

    if (!classData) {
      return res.status(404).json({
        success: false,
        message: 'Class not found'
      });
    }

    classData.students = classData.students.filter(
      student => student.toString() !== req.params.studentId
    );

    await classData.save();

    res.status(200).json({
      success: true,
      message: 'Student removed from class successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};
