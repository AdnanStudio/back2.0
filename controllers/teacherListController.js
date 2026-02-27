const TeacherList = require('../models/TeacherList');
const { cloudinary } = require('../config/cloudinary');

// @desc    Get all teachers in the public list
// @route   GET /api/teacher-list
// @access  Public / Admin sees all
exports.getAllTeachers = async (req, res) => {
  try {
    const { search } = req.query;

    // Admin sees all; public/other roles see active only
    const baseQuery = req.user?.role === 'admin' ? {} : { isActive: true };

    let teachers = await TeacherList.find(baseQuery)
      .sort({ order: 1, createdAt: -1 });

    // Search filter (in-memory for flexibility)
    if (search) {
      const q = search.toLowerCase();
      teachers = teachers.filter(t =>
        t.name?.toLowerCase().includes(q) ||
        t.designation?.toLowerCase().includes(q) ||
        t.email?.toLowerCase().includes(q) ||
        t.department?.toLowerCase().includes(q)
      );
    }

    res.status(200).json({
      success: true,
      count: teachers.length,
      data: teachers
    });
  } catch (error) {
    console.error('Get teachers error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch teachers', error: error.message });
  }
};

exports.getTeacher = async (req, res) => {
  try {
    const teacher = await TeacherList.findById(req.params.id);
    if (!teacher) {
      return res.status(404).json({ success: false, message: 'Teacher not found' });
    }
    res.status(200).json({ success: true, data: teacher });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch teacher', error: error.message });
  }
};

exports.createTeacher = async (req, res) => {
  try {
    const teacherData = { ...req.body };

    // Handle subjects as comma-separated string → array
    if (typeof teacherData.subjects === 'string') {
      teacherData.subjects = teacherData.subjects
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);
    }

    if (req.file) {
      teacherData.image = {
        url: req.file.path,
        publicId: req.file.filename
      };
    }

    const teacher = await TeacherList.create(teacherData);

    res.status(201).json({
      success: true,
      message: 'Teacher created successfully',
      data: teacher
    });
  } catch (error) {
    console.error('Create teacher error:', error);
    res.status(500).json({ success: false, message: 'Failed to create teacher', error: error.message });
  }
};

exports.updateTeacher = async (req, res) => {
  try {
    let teacher = await TeacherList.findById(req.params.id);
    if (!teacher) {
      return res.status(404).json({ success: false, message: 'Teacher not found' });
    }

    const updateData = { ...req.body };

    if (typeof updateData.subjects === 'string') {
      updateData.subjects = updateData.subjects
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);
    }

    if (req.file) {
      if (teacher.image?.publicId) {
        try { await cloudinary.uploader.destroy(teacher.image.publicId); } catch {}
      }
      updateData.image = {
        url: req.file.path,
        publicId: req.file.filename
      };
    }

    teacher = await TeacherList.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    res.status(200).json({ success: true, message: 'Teacher updated successfully', data: teacher });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update teacher', error: error.message });
  }
};

exports.deleteTeacher = async (req, res) => {
  try {
    const teacher = await TeacherList.findById(req.params.id);
    if (!teacher) {
      return res.status(404).json({ success: false, message: 'Teacher not found' });
    }

    if (teacher.image?.publicId) {
      try { await cloudinary.uploader.destroy(teacher.image.publicId); } catch {}
    }

    await teacher.deleteOne();

    res.status(200).json({ success: true, message: 'Teacher deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete teacher', error: error.message });
  }
};

exports.toggleTeacherStatus = async (req, res) => {
  try {
    const teacher = await TeacherList.findById(req.params.id);
    if (!teacher) {
      return res.status(404).json({ success: false, message: 'Teacher not found' });
    }

    teacher.isActive = !teacher.isActive;
    // Also sync status field if present
    if (!teacher.isActive && teacher.status === 'active') {
      teacher.status = 'on-leave';
    } else if (teacher.isActive && (teacher.status === 'on-leave' || teacher.status === 'resigned')) {
      teacher.status = 'active';
    }
    await teacher.save();

    res.status(200).json({
      success: true,
      message: `Teacher ${teacher.isActive ? 'activated' : 'deactivated'} successfully`,
      data: { isActive: teacher.isActive, status: teacher.status }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to toggle status', error: error.message });
  }
};
