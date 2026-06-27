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
      salaryGrade,
      classTeacher
    } = req.body;

    // ─── Validate required fields ────────────────────────────────────
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Name is required' });
    }
    if (!email || !email.trim()) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }
    if (!password || !password.trim()) {
      return res.status(400).json({ success: false, message: 'Password is required' });
    }
    if (!employeeId || !employeeId.trim()) {
      return res.status(400).json({ success: false, message: 'Employee ID is required' });
    }
    if (!qualification || !qualification.trim()) {
      return res.status(400).json({ success: false, message: 'Qualification is required' });
    }

    // ─── Check duplicates ────────────────────────────────────────────
    const userExists = await User.findOne({ email: email.toLowerCase().trim() });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'এই email দিয়ে ইতিমধ্যে একটি account আছে'
      });
    }

    const employeeIdExists = await Teacher.findOne({ employeeId: employeeId.trim() });
    if (employeeIdExists) {
      return res.status(400).json({
        success: false,
        message: 'এই Employee ID ইতিমধ্যে ব্যবহৃত হয়েছে'
      });
    }

    // ─── Cloudinary image ────────────────────────────────────────────
    let profileImage = 'https://via.placeholder.com/150';
    let profileImagePublicId = null;
    if (req.file) {
      profileImage = req.file.path;
      profileImagePublicId = req.file.filename;
    }

    // ─── Create User ─────────────────────────────────────────────────
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      role: 'teacher',
      phone,
      address,
      dateOfBirth,
      profileImage,
      profileImagePublicId
    });

    // ─── Parse arrays safely ─────────────────────────────────────────
    let subjectArray = [];
    try {
      subjectArray = Array.isArray(subjects)
        ? subjects
        : (subjects ? JSON.parse(subjects) : []);
      // Filter out empty/invalid values
      subjectArray = subjectArray.filter(s => s && String(s).length > 0);
    } catch (e) {
      subjectArray = [];
    }

    let classArray = [];
    try {
      classArray = Array.isArray(classes)
        ? classes
        : (classes ? JSON.parse(classes) : []);
      classArray = classArray.filter(c => c && String(c).length > 0);
    } catch (e) {
      classArray = [];
    }

    let sectionArray = [];
    try {
      sectionArray = Array.isArray(sections)
        ? sections
        : (sections ? JSON.parse(sections) : []);
      sectionArray = sectionArray.filter(s => s && String(s).length > 0);
    } catch (e) {
      sectionArray = [];
    }

    // ─── Parse classTeacher ───────────────────────────────────────────
    let classTeacherData = undefined;
    try {
      if (classTeacher) {
        const ct = typeof classTeacher === 'string' ? JSON.parse(classTeacher) : classTeacher;
        if (ct && ct.class && String(ct.class).length > 0) {
          classTeacherData = { class: ct.class, section: ct.section || '' };
        }
      }
    } catch (e) {
      classTeacherData = undefined;
    }

    // ─── Validate salaryGrade ─────────────────────────────────────────
    const validGrades = [
      'grade-1','grade-2','grade-3','grade-4','grade-5',
      'grade-6','grade-7','grade-8','grade-9','grade-10',
      'grade-11','grade-12','grade-13','grade-14','grade-15',
      'grade-16','grade-17','grade-18','grade-19','grade-20',
      'others'
    ];
    const finalSalaryGrade = validGrades.includes(salaryGrade) ? salaryGrade : null;

    // ─── Create Teacher ───────────────────────────────────────────────
    const teacher = await Teacher.create({
      userId: user._id,
      employeeId: employeeId.trim(),
      subjects: subjectArray,
      classes: classArray,
      sections: sectionArray,
      qualification: qualification.trim(),
      experience: Number(experience) || 0,
      salaryGrade: finalSalaryGrade,
      classTeacher: classTeacherData
    });

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
    // Handle Mongoose duplicate key error
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue || {})[0];
      return res.status(400).json({
        success: false,
        message: field === 'email'
          ? 'এই email ইতিমধ্যে ব্যবহৃত হয়েছে'
          : field === 'employeeId'
            ? 'এই Employee ID ইতিমধ্যে ব্যবহৃত হয়েছে'
            : 'Duplicate value error'
      });
    }
    res.status(500).json({
      success: false,
      message: error.message || 'Server Error'
    });
  }
};

// @desc    Get all teachers
// @route   GET /api/teachers
// @access  Private
exports.getAllTeachers = async (req, res) => {
  try {
    const { subject, search, page = 1, limit = 1000 } = req.query;
    let query = {};
    if (subject) query.subjects = subject;

    const teachers = await Teacher.find(query)
      .populate('userId', 'name email phone address profileImage dateOfBirth isActive')
      .populate('subjects', 'name code')
      .populate('classes', 'name section')
      .sort({ createdAt: -1 });

    let filteredTeachers = teachers;
    if (search) {
      filteredTeachers = teachers.filter(teacher =>
        teacher.userId?.name?.toLowerCase().includes(search.toLowerCase()) ||
        teacher.employeeId.toLowerCase().includes(search.toLowerCase())
      );
    }

    const startIndex = (page - 1) * limit;
    const paginatedTeachers = filteredTeachers.slice(startIndex, startIndex + Number(limit));

    res.status(200).json({
      success: true,
      count: filteredTeachers.length,
      totalPages: Math.ceil(filteredTeachers.length / limit),
      currentPage: parseInt(page),
      data: paginatedTeachers
    });
  } catch (error) {
    console.error('Get Teachers Error:', error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
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
      return res.status(404).json({ success: false, message: 'Teacher not found' });
    }

    res.status(200).json({ success: true, data: teacher });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

// @desc    Update teacher
// @route   PUT /api/teachers/:id
// @access  Private (Admin only)
exports.updateTeacher = async (req, res) => {
  try {
    const {
      name, phone, address, dateOfBirth,
      subjects, classes, sections, qualification,
      experience, salaryGrade, classTeacher
    } = req.body;

    const teacher = await Teacher.findById(req.params.id);
    if (!teacher) {
      return res.status(404).json({ success: false, message: 'Teacher not found' });
    }

    const userUpdateData = { name, phone, address, dateOfBirth };

    if (req.file) {
      const currentUser = await User.findById(teacher.userId);
      if (currentUser?.profileImagePublicId) {
        try { await cloudinary.uploader.destroy(currentUser.profileImagePublicId); } catch (e) {}
      }
      userUpdateData.profileImage = req.file.path;
      userUpdateData.profileImagePublicId = req.file.filename;
    }

    await User.findByIdAndUpdate(teacher.userId, userUpdateData);

    let subjectArray = teacher.subjects;
    try {
      if (subjects !== undefined) {
        subjectArray = Array.isArray(subjects) ? subjects : JSON.parse(subjects);
        subjectArray = subjectArray.filter(s => s && String(s).length > 0);
      }
    } catch (e) {}

    let classArray = teacher.classes;
    try {
      if (classes !== undefined) {
        classArray = Array.isArray(classes) ? classes : JSON.parse(classes);
        classArray = classArray.filter(c => c && String(c).length > 0);
      }
    } catch (e) {}

    let sectionArray = teacher.sections;
    try {
      if (sections !== undefined) {
        sectionArray = Array.isArray(sections) ? sections : JSON.parse(sections);
        sectionArray = sectionArray.filter(s => s && String(s).length > 0);
      }
    } catch (e) {}

    let classTeacherData = teacher.classTeacher;
    try {
      if (classTeacher) {
        const ct = typeof classTeacher === 'string' ? JSON.parse(classTeacher) : classTeacher;
        if (ct && ct.class && String(ct.class).length > 0) {
          classTeacherData = { class: ct.class, section: ct.section || '' };
        }
      }
    } catch (e) {}

    const validGrades = [
      'grade-1','grade-2','grade-3','grade-4','grade-5',
      'grade-6','grade-7','grade-8','grade-9','grade-10',
      'grade-11','grade-12','grade-13','grade-14','grade-15',
      'grade-16','grade-17','grade-18','grade-19','grade-20',
      'others'
    ];

    const updatedTeacher = await Teacher.findByIdAndUpdate(
      req.params.id,
      {
        subjects: subjectArray,
        classes: classArray,
        sections: sectionArray,
        qualification: qualification || teacher.qualification,
        experience: experience !== undefined ? Number(experience) : teacher.experience,
        salaryGrade: validGrades.includes(salaryGrade) ? salaryGrade : teacher.salaryGrade,
        classTeacher: classTeacherData
      },
      { new: true, runValidators: true }
    )
      .populate('userId', 'name email phone address profileImage dateOfBirth isActive')
      .populate('subjects', 'name code')
      .populate('classes', 'name section');

    res.status(200).json({ success: true, message: 'Teacher updated successfully', data: updatedTeacher });
  } catch (error) {
    console.error('Update Teacher Error:', error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

// @desc    Delete teacher
// @route   DELETE /api/teachers/:id
// @access  Private (Admin only)
exports.deleteTeacher = async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.params.id);
    if (!teacher) {
      return res.status(404).json({ success: false, message: 'Teacher not found' });
    }

    const user = await User.findById(teacher.userId);
    if (user?.profileImagePublicId) {
      try { await cloudinary.uploader.destroy(user.profileImagePublicId); } catch (e) {}
    }

    await User.findByIdAndDelete(teacher.userId);
    await Teacher.findByIdAndDelete(req.params.id);

    res.status(200).json({ success: true, message: 'Teacher deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

// @desc    Get teachers by subject
// @route   GET /api/teachers/subject/:subjectId
// @access  Private
exports.getTeachersBySubject = async (req, res) => {
  try {
    const teachers = await Teacher.find({ subjects: req.params.subjectId })
      .populate('userId', 'name email phone profileImage')
      .populate('subjects', 'name code');

    res.status(200).json({ success: true, count: teachers.length, data: teachers });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

// @desc    Toggle teacher status
// @route   PUT /api/teachers/:id/status
// @access  Private (Admin only)
exports.toggleTeacherStatus = async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.params.id);
    if (!teacher) {
      return res.status(404).json({ success: false, message: 'Teacher not found' });
    }

    const user = await User.findById(teacher.userId);
    user.isActive = !user.isActive;
    await user.save();

    res.status(200).json({
      success: true,
      message: `Teacher ${user.isActive ? 'activated' : 'deactivated'} successfully`,
      data: { isActive: user.isActive }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
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
      return res.status(404).json({ success: false, message: 'Teacher profile not found' });
    }

    res.status(200).json({ success: true, data: teacher });
  } catch (error) {
    console.error('Get Teacher Profile Error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to fetch teacher profile' });
  }
};
