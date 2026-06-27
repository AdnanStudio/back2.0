const Assignment = require('../models/Assignment');
const Student = require('../models/Student');
const { cloudinary } = require('../config/cloudinary');

// Create Assignment
exports.createAssignment = async (req, res) => {
  try {
    const { title, description, class: className, section, subject, startDate, endDate, status, totalMarks } = req.body;

    let fileData = {};
    if (req.file) {
      fileData = {
        url: req.file.path,
        publicId: req.file.filename,
        fileType: req.file.mimetype === 'application/pdf' ? 'pdf' : 'image'
      };
    }

    const assignment = await Assignment.create({
      title,
      description,
      class: className,
      section,
      subject,
      file: fileData,
      startDate,
      endDate,
      status,
      totalMarks,
      createdBy: req.user._id
    });

    const populatedAssignment = await Assignment.findById(assignment._id)
      .populate('createdBy', 'name email role');

    res.status(201).json({
      success: true,
      message: 'Assignment created successfully',
      data: populatedAssignment
    });
  } catch (error) {
    console.error('Create Assignment Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create assignment',
      error: error.message
    });
  }
};

// Get All Assignments (Admin/Teacher)
exports.getAllAssignments = async (req, res) => {
  try {
    const { class: className, section, subject, status } = req.query;
    
    let filter = {};
    if (className) filter.class = className;
    if (section) filter.section = section;
    if (subject) filter.subject = subject;
    if (status) filter.status = status;

    const assignments = await Assignment.find(filter)
      .populate('createdBy', 'name email role')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: assignments.length,
      data: assignments
    });
  } catch (error) {
    console.error('Get Assignments Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch assignments',
      error: error.message
    });
  }
};

// Get Student Assignments
exports.getStudentAssignments = async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.user._id });
    
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student profile not found'
      });
    }

    const assignments = await Assignment.find({
      class: student.class,
      section: student.section
    })
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: assignments.length,
      data: assignments
    });
  } catch (error) {
    console.error('Get Student Assignments Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch assignments',
      error: error.message
    });
  }
};

// Get Single Assignment
exports.getAssignmentById = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id)
      .populate('createdBy', 'name email role')
      .populate('submissions.student', 'studentId userId');

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found'
      });
    }

    res.status(200).json({
      success: true,
      data: assignment
    });
  } catch (error) {
    console.error('Get Assignment Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch assignment',
      error: error.message
    });
  }
};

// Update Assignment
exports.updateAssignment = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found'
      });
    }

    const { title, description, class: className, section, subject, startDate, endDate, status, totalMarks } = req.body;

    // Update file if new file uploaded
    let fileData = assignment.file;
    if (req.file) {
      // Delete old file from cloudinary
      if (assignment.file?.publicId) {
        await cloudinary.uploader.destroy(assignment.file.publicId);
      }
      
      fileData = {
        url: req.file.path,
        publicId: req.file.filename,
        fileType: req.file.mimetype === 'application/pdf' ? 'pdf' : 'image'
      };
    }

    const updatedAssignment = await Assignment.findByIdAndUpdate(
      req.params.id,
      {
        title,
        description,
        class: className,
        section,
        subject,
        file: fileData,
        startDate,
        endDate,
        status,
        totalMarks
      },
      { new: true, runValidators: true }
    ).populate('createdBy', 'name email role');

    res.status(200).json({
      success: true,
      message: 'Assignment updated successfully',
      data: updatedAssignment
    });
  } catch (error) {
    console.error('Update Assignment Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update assignment',
      error: error.message
    });
  }
};

// Delete Assignment
exports.deleteAssignment = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found'
      });
    }

    // Delete file from cloudinary
    if (assignment.file?.publicId) {
      await cloudinary.uploader.destroy(assignment.file.publicId);
    }

    await Assignment.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Assignment deleted successfully'
    });
  } catch (error) {
    console.error('Delete Assignment Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete assignment',
      error: error.message
    });
  }
};

// Submit Assignment Marks
exports.submitMarks = async (req, res) => {
  try {
    const { studentId, marks, feedback } = req.body;
    const assignmentId = req.params.id;

    const assignment = await Assignment.findById(assignmentId);

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found'
      });
    }

    // Check if student already has marks
    const existingSubmission = assignment.submissions.find(
      sub => sub.student.toString() === studentId
    );

    if (existingSubmission) {
      existingSubmission.marks = marks;
      existingSubmission.feedback = feedback;
      existingSubmission.submittedAt = new Date();
    } else {
      assignment.submissions.push({
        student: studentId,
        marks,
        feedback,
        submittedAt: new Date()
      });
    }

    await assignment.save();

    res.status(200).json({
      success: true,
      message: 'Marks submitted successfully',
      data: assignment
    });
  } catch (error) {
    console.error('Submit Marks Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit marks',
      error: error.message
    });
  }
};
