const mongoose = require('mongoose');

const teacherSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  employeeId: {
    type: String,
    required: true,
    unique: true
  },
  subjects: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject'
  }],
  classes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class'
  }],
  sections: [{
    type: String,
    enum: ['A', 'B', 'C', 'D', 'E']
  }],
  qualification: {
    type: String,
    required: true
  },
  experience: {
    type: Number,
    default: 0
  },
  joiningDate: {
    type: Date,
    default: Date.now
  },
  // ✅ Salary Grade — Grade 1 to 20 + others
  salaryGrade: {
    type: String,
    enum: [
      'grade-1','grade-2','grade-3','grade-4','grade-5',
      'grade-6','grade-7','grade-8','grade-9','grade-10',
      'grade-11','grade-12','grade-13','grade-14','grade-15',
      'grade-16','grade-17','grade-18','grade-19','grade-20',
      'others'
    ],
    default: null
  },
  // kept for backward compatibility
  salary: {
    type: Number,
    default: 0
  },
  classTeacher: {
    class: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class'
    },
    section: String
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Teacher', teacherSchema);