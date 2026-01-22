const User = require('../models/User');
const Teacher = require('../models/Teacher');
const Subject = require('../models/Subject');
const Class = require('../models/Class');
const { cloudinary } = require('../config/cloudinary');

// @desc    Create new teacher
// @route   POST /api/teachers
// @access  Private (Admin only)
exports.createTeacher = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      phone,
      address,
      dateOfBirth,
      employeeId,
      subjects,
      classes,
      sections,
      qualification,
      experience,
      salary,
      classTeacher
    } = req.body;

    // Check if email already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Check if employeeId already exists
    const employeeIdExists = await Teacher.findOne({ employeeId });
    if (employeeIdExists) {
      return res.status(400).json({
        success: false,
        message: 'Employee ID already exists'
      });
    }

    // Upload profile image to Cloudinary
    let profileImage = 'https://via.placeholder.com/150';
    if (req.file) {
      profileImage = req.file.path; // Cloudinary URL
    }

    // Create user account
    const user = await User.create({
      name,
      email,
      password,
      role: 'teacher',
      phone,
      address,
      dateOfBirth,
      profileImage
    });

    // Parse subjects, classes, sections
    const subjectArray = Array.isArray(subjects) ? subjects : 
                        subjects ? JSON.parse(subjects) : [];
    const classArray = Array.isArray(classes) ? classes : 
                      classes ? JSON.parse(classes) : [];
    const sectionArray = Array.isArray(sections) ? sections : 
                        sections ? JSON.parse(sections) : [];

    // Create teacher record
    const teacher = await Teacher.create({
      userId: user._id,
      employeeId,
      subjects: subjectArray,
      classes: classArray,
      sections: sectionArray,
      qualification,
      experience: experience || 0,
      salary,
      classTeacher: classTeacher ? JSON.parse(classTeacher) : undefined
    });

    // Populate teacher data
    const populatedTeacher = await Teacher.findById(teacher._id)
      .populate('userId', 'name email phone address profileImage')
      .populate('subjects', 'name code')
      .populate('classes', 'name section');

    res.status(201).json({
      success: true,
      message: 'Teacher created successfully',
      data: populatedTeacher
    });
  } catch (error) {
    console.error('Create Teacher Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Get all teachers with pagination
// @route   GET /api/teachers
// @access  Private
exports.getAllTeachers = async (req, res) => {
  try {
    const { subject, search, page = 1, limit = 1000 } = req.query;

    let query = {};

    // Subject filter
    if (subject) {
      query.subjects = subject;
    }

    const teachers = await Teacher.find(query)
      .populate('userId', 'name email phone address profileImage dateOfBirth isActive')
      .populate('subjects', 'name code')
      .populate('classes', 'name section')
      .sort({ createdAt: -1 });

    // Search filter
    let filteredTeachers = teachers;
    if (search) {
      filteredTeachers = teachers.filter(teacher =>
        teacher.userId?.name?.toLowerCase().includes(search.toLowerCase()) ||
        teacher.employeeId.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const paginatedTeachers = filteredTeachers.slice(startIndex, endIndex);

    res.status(200).json({
      success: true,
      count: filteredTeachers.length,
      totalPages: Math.ceil(filteredTeachers.length / limit),
      currentPage: parseInt(page),
      data: paginatedTeachers
    });
  } catch (error) {
    console.error('Get Teachers Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Get single teacher
// @route   GET /api/teachers/:id
// @access  Private
exports.getTeacher = async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.params.id)
      .populate('userId', 'name email phone address profileImage dateOfBirth isActive')
      .populate('subjects', 'name code department')
      .populate('classes', 'name section');

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: 'Teacher not found'
      });
    }

    res.status(200).json({
      success: true,
      data: teacher
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Update teacher
// @route   PUT /api/teachers/:id
// @access  Private (Admin only)
exports.updateTeacher = async (req, res) => {
  try {
    const {
      name,
      phone,
      address,
      dateOfBirth,
      subjects,
      classes,
      sections,
      qualification,
      experience,
      salary,
      classTeacher
    } = req.body;

    const teacher = await Teacher.findById(req.params.id);

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: 'Teacher not found'
      });
    }

    // Update user data
    const userUpdateData = {
      name,
      phone,
      address,
      dateOfBirth
    };

    // Upload new image if provided
    if (req.file) {
      // Delete old image from Cloudinary
      const user = await User.findById(teacher.userId);
      if (user.profileImage && !user.profileImage.includes('placeholder')) {
        const publicId = user.profileImage.split('/').pop().split('.')[0];
        await cloudinary.uploader.destroy(`school-management/users/${publicId}`);
      }
      userUpdateData.profileImage = req.file.path;
    }

    await User.findByIdAndUpdate(teacher.userId, userUpdateData);

    // Parse arrays
    const subjectArray = Array.isArray(subjects) ? subjects : 
                        subjects ? JSON.parse(subjects) : teacher.subjects;
    const classArray = Array.isArray(classes) ? classes : 
                      classes ? JSON.parse(classes) : teacher.classes;
    const sectionArray = Array.isArray(sections) ? sections : 
                        sections ? JSON.parse(sections) : teacher.sections;

    // Update teacher data
    const teacherUpdateData = {
      subjects: subjectArray,
      classes: classArray,
      sections: sectionArray,
      qualification,
      experience,
      salary,
      classTeacher: classTeacher ? JSON.parse(classTeacher) : teacher.classTeacher
    };

    const updatedTeacher = await Teacher.findByIdAndUpdate(
      req.params.id,
      teacherUpdateData,
      { new: true, runValidators: true }
    )
      .populate('userId')
      .populate('subjects', 'name code')
      .populate('classes', 'name section');

    res.status(200).json({
      success: true,
      message: 'Teacher updated successfully',
      data: updatedTeacher
    });
  } catch (error) {
    console.error('Update Teacher Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Delete teacher
// @route   DELETE /api/teachers/:id
// @access  Private (Admin only)
exports.deleteTeacher = async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.params.id);

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: 'Teacher not found'
      });
    }

    // Delete image from Cloudinary
    const user = await User.findById(teacher.userId);
    if (user.profileImage && !user.profileImage.includes('placeholder')) {
      const publicId = user.profileImage.split('/').pop().split('.')[0];
      await cloudinary.uploader.destroy(`school-management/users/${publicId}`);
    }

    await User.findByIdAndDelete(teacher.userId);
    await Teacher.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Teacher deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Get teachers by subject
// @route   GET /api/teachers/subject/:subjectId
// @access  Private
exports.getTeachersBySubject = async (req, res) => {
  try {
    const { subjectId } = req.params;

    const teachers = await Teacher.find({
      subjects: subjectId
    })
      .populate('userId', 'name email phone profileImage')
      .populate('subjects', 'name code');

    res.status(200).json({
      success: true,
      count: teachers.length,
      data: teachers
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Toggle teacher status
// @route   PUT /api/teachers/:id/status
// @access  Private (Admin only)
exports.toggleTeacherStatus = async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.params.id);

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: 'Teacher not found'
      });
    }

    const user = await User.findById(teacher.userId);
    user.isActive = !user.isActive;
    await user.save();

    res.status(200).json({
      success: true,
      message: `Teacher ${user.isActive ? 'activated' : 'deactivated'} successfully`,
      data: {
        isActive: user.isActive
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Get current teacher profile
// @route   GET /api/teachers/profile/me
// @access  Private (Teacher)
exports.getTeacherProfile = async (req, res) => {
  try {
    const teacher = await Teacher.findOne({ userId: req.user._id })
      .populate('userId', 'name email phone profileImage')
      .populate('subjects', 'name code')
      .populate('classes', 'name section')
      .populate('classTeacher.class', 'name section');

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: 'Teacher profile not found'
      });
    }

    res.status(200).json({
      success: true,
      data: teacher
    });
  } catch (error) {
    console.error('Get Teacher Profile Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch teacher profile'
    });
  }
};