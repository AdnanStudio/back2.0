const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

mongoose.connect(process.env.MONGODB_URI, {
  serverSelectionTimeoutMS: 5000
})
  .then(() => {
    console.log('✅ MongoDB Connected Successfully');
  })
  .catch((err) => {
    console.error('❌ MongoDB Connection Error:', err.message);
    process.exit(1);
  });

// Import Routes
const authRoutes = require('./routes/authRoutes');
const studentRoutes = require('./routes/studentRoutes');
const teacherRoutes = require('./routes/teacherRoutes');
const classRoutes = require('./routes/classRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const publicRoutes = require('./routes/publicRoutes');
const carouselRoutes = require('./routes/carouselRoutes');
const noticeRoutes = require('./routes/noticeRoutes');
const blogRoutes = require('./routes/blogRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const markRoutes = require('./routes/markRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const principalRoutes = require('./routes/principalRoutes');
const websiteRoutes = require('./routes/websiteRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const userRoutes = require('./routes/userRoutes');
const subjectRoutes = require('./routes/subjectRoutes');
const admissionRoutes = require('./routes/admissionRoutes');
const classRoutineRoutes = require('./routes/classRoutineRoutes');
const assignmentRoutes = require('./routes/assignmentRoutes');
const leaveRoutes = require('./routes/leaveRoutes');
const teacherTrainingRoutes = require('./routes/teacherTrainingRoutes');
const clubRoutes = require('./routes/clubRoutes');
const teacherListRoutes = require('./routes/teacherListRoutes');
const libraryRoutes = require('./routes/libraryRoutes'); // ✅ NEW

const governingBodyRoutes = require('./routes/governingBodyRoutes');



// Use Routes
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/teachers', teacherRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/carousels', carouselRoutes);
app.use('/api/notices', noticeRoutes);
app.use('/api/blogs', blogRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/marks', markRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/principal', principalRoutes);
app.use('/api/website', websiteRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/users', userRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/admissions', admissionRoutes);
app.use('/api/class-routines', classRoutineRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/leaves', leaveRoutes);
app.use('/api/teacher-trainings', teacherTrainingRoutes);
app.use('/api/club-members', clubRoutes);
app.use('/api/teacher-list', teacherListRoutes);
app.use('/api/library', libraryRoutes); // ✅ NEW
// Then mount the route
app.use('/api/governing-body', governingBodyRoutes);

app.get('/', (req, res) => {
  res.json({
    message: 'School Management API is running',
    status: 'OK',
    timestamp: new Date().toISOString()
  });
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;


// const express = require('express');
// const mongoose = require('mongoose');
// const cors = require('cors');
// const dotenv = require('dotenv');

// dotenv.config();

// const app = express();

// // ================= Middleware =================
// app.use(cors());
// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));

// // ================= Database Connection =================
// mongoose.connect(process.env.MONGODB_URI, {
//   serverSelectionTimeoutMS: 5000
// })
//   .then(() => {
//     console.log('✅ MongoDB Connected Successfully');
//   })
//   .catch((err) => {
//     console.error('❌ MongoDB Connection Error:', err.message);
//     process.exit(1);
//   });

// // ================= Import Routes =================
// const authRoutes = require('./routes/authRoutes');
// const studentRoutes = require('./routes/studentRoutes');
// const teacherRoutes = require('./routes/teacherRoutes');
// const classRoutes = require('./routes/classRoutes');
// const attendanceRoutes = require('./routes/attendanceRoutes');
// const publicRoutes = require('./routes/publicRoutes');
// const carouselRoutes = require('./routes/carouselRoutes');
// const noticeRoutes = require('./routes/noticeRoutes');
// const blogRoutes = require('./routes/blogRoutes');
// const paymentRoutes = require('./routes/paymentRoutes');
// const markRoutes = require('./routes/markRoutes');
// const notificationRoutes = require('./routes/notificationRoutes');
// const principalRoutes = require('./routes/principalRoutes');
// const websiteRoutes = require('./routes/websiteRoutes');
// const settingsRoutes = require('./routes/settingsRoutes');
// const userRoutes = require('./routes/userRoutes');  // ✅ New User Routes
// // Add this import with other route imports
// const subjectRoutes = require('./routes/subjectRoutes');
// const admissionRoutes = require('./routes/admissionRoutes');
// const classRoutineRoutes = require('./routes/classRoutineRoutes');
// const assignmentRoutes = require('./routes/assignmentRoutes');


// // ================= Use Routes =================
// app.use('/api/auth', authRoutes);
// app.use('/api/students', studentRoutes);
// app.use('/api/teachers', teacherRoutes);
// app.use('/api/classes', classRoutes);
// app.use('/api/attendance', attendanceRoutes);
// app.use('/api/public', publicRoutes);
// app.use('/api/carousels', carouselRoutes);
// app.use('/api/notices', noticeRoutes);
// app.use('/api/blogs', blogRoutes);
// app.use('/api/payments', paymentRoutes);
// app.use('/api/marks', markRoutes);
// app.use('/api/notifications', notificationRoutes);
// app.use('/api/principal', principalRoutes);
// app.use('/api/website', websiteRoutes);
// app.use('/api/settings', settingsRoutes);
// app.use('/api/users', userRoutes);  // ✅ New User Routes
// // Add this line with other route uses
// app.use('/api/subjects', subjectRoutes);
// app.use('/api/admissions', admissionRoutes);
// app.use('/api/class-routines', classRoutineRoutes);
// app.use('/api/assignments', assignmentRoutes);

// // ================= Test Route =================
// app.get('/', (req, res) => {
//   res.json({
//     message: 'School Management API is running',
//     status: 'OK',
//     timestamp: new Date().toISOString()
//   });
// });

// // ================= 404 Handler =================
// app.use((req, res) => {
//   res.status(404).json({
//     success: false,
//     message: 'Route not found'
//   });
// });

// // ================= Global Error Handler =================
// app.use((err, req, res, next) => {
//   console.error(err.stack);
//   res.status(err.status || 500).json({
//     success: false,
//     message: err.message || 'Something went wrong!',
//     error: process.env.NODE_ENV === 'development' ? err.message : undefined
//   });
// });

// // ================= Server Start =================
// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => {
//   console.log(`🚀 Server running on port ${PORT}`);
//   console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
// });

// module.exports = app;