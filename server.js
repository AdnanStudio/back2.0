// FILE PATH: server.js
const express  = require('express');
const mongoose = require('mongoose');
const cors     = require('cors');
const dotenv   = require('dotenv');
const path     = require('path');

dotenv.config();

const app = express();

// ── Middleware ─────────────────────────────────────────────────
app.use(cors({ origin: process.env.CLIENT_URL || '*', credentials: true }));
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ── MongoDB ────────────────────────────────────────────────────
mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 10000 })
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => { console.error('❌ MongoDB Error:', err.message); process.exit(1); });

// ── Routes ─────────────────────────────────────────────────────
app.use('/api/auth',              require('./routes/authRoutes'));
app.use('/api/students',          require('./routes/studentRoutes'));
app.use('/api/teachers',          require('./routes/teacherRoutes'));
app.use('/api/classes',           require('./routes/classRoutes'));
app.use('/api/attendance',        require('./routes/attendanceRoutes'));
app.use('/api/public',            require('./routes/publicRoutes'));
app.use('/api/carousels',         require('./routes/carouselRoutes'));
app.use('/api/notices',           require('./routes/noticeRoutes'));
app.use('/api/blogs',             require('./routes/blogRoutes'));
app.use('/api/payments',          require('./routes/paymentRoutes'));
app.use('/api/marks',             require('./routes/markRoutes'));           // ✅ Mark Management
app.use('/api/notifications',     require('./routes/notificationRoutes'));
app.use('/api/principal',         require('./routes/principalRoutes'));
app.use('/api/website',           require('./routes/websiteRoutes'));
app.use('/api/settings',          require('./routes/settingsRoutes'));
app.use('/api/users',             require('./routes/userRoutes'));
app.use('/api/subjects',          require('./routes/subjectRoutes'));
app.use('/api/admissions',        require('./routes/admissionRoutes'));
app.use('/api/class-routines',    require('./routes/classRoutineRoutes'));
app.use('/api/assignments',       require('./routes/assignmentRoutes'));
app.use('/api/leaves',            require('./routes/leaveRoutes'));
app.use('/api/teacher-trainings', require('./routes/teacherTrainingRoutes'));
app.use('/api/club-members',      require('./routes/clubRoutes'));
app.use('/api/teacher-list',      require('./routes/teacherListRoutes'));
app.use('/api/library',           require('./routes/libraryRoutes'));
app.use('/api/governing-body',    require('./routes/governingBodyRoutes'));

// ── Health Check ───────────────────────────────────────────────
app.get('/api/health', (req, res) =>
  res.json({
    success  : true,
    status   : 'OK',
    db       : mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    uptime   : process.uptime(),
    timestamp: new Date().toISOString(),
  })
);

// ── 404 ────────────────────────────────────────────────────────
app.use((req, res) =>
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  })
);

// ── Global Error Handler ───────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('🔴 Error:', err.message);
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// ── Start Server ───────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;



// // FILE PATH: server.js
// const express  = require('express');
// const mongoose = require('mongoose');
// const cors     = require('cors');
// const dotenv   = require('dotenv');
// const path     = require('path');

// dotenv.config();

// const app = express();

// // ── Middleware ─────────────────────────────────────────────────
// app.use(cors({ origin: process.env.CLIENT_URL || '*', credentials: true }));
// app.use(express.json({ limit: '20mb' }));
// app.use(express.urlencoded({ extended: true, limit: '20mb' }));
// app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// // ── MongoDB ────────────────────────────────────────────────────
// mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 10000 })
//   .then(() => console.log('✅ MongoDB Connected'))
//   .catch(err => { console.error('❌ MongoDB Error:', err.message); process.exit(1); });

// // ── Routes ─────────────────────────────────────────────────────
// app.use('/api/auth',              require('./routes/authRoutes'));
// app.use('/api/students',          require('./routes/studentRoutes'));
// app.use('/api/teachers',          require('./routes/teacherRoutes'));
// app.use('/api/classes',           require('./routes/classRoutes'));
// app.use('/api/attendance',        require('./routes/attendanceRoutes'));
// app.use('/api/public',            require('./routes/publicRoutes'));
// app.use('/api/carousels',         require('./routes/carouselRoutes'));
// app.use('/api/notices',           require('./routes/noticeRoutes'));
// app.use('/api/blogs',             require('./routes/blogRoutes'));
// app.use('/api/payments',          require('./routes/paymentRoutes'));
// app.use('/api/marks',             require('./routes/markRoutes'));         // ✅ UPDATED
// app.use('/api/notifications',     require('./routes/notificationRoutes'));
// app.use('/api/principal',         require('./routes/principalRoutes'));
// app.use('/api/website',           require('./routes/websiteRoutes'));
// app.use('/api/settings',          require('./routes/settingsRoutes'));
// app.use('/api/users',             require('./routes/userRoutes'));
// app.use('/api/subjects',          require('./routes/subjectRoutes'));
// app.use('/api/admissions',        require('./routes/admissionRoutes'));
// app.use('/api/class-routines',    require('./routes/classRoutineRoutes'));
// app.use('/api/assignments',       require('./routes/assignmentRoutes'));
// app.use('/api/leaves',            require('./routes/leaveRoutes'));
// app.use('/api/teacher-trainings', require('./routes/teacherTrainingRoutes'));
// app.use('/api/club-members',      require('./routes/clubRoutes'));
// app.use('/api/teacher-list',      require('./routes/teacherListRoutes'));
// app.use('/api/library',           require('./routes/libraryRoutes'));
// app.use('/api/governing-body',    require('./routes/governingBodyRoutes'));

// // Health check
// app.get('/api/health', (req, res) =>
//   res.json({ success:true, status:'OK', db: mongoose.connection.readyState===1?'connected':'disconnected' })
// );

// // 404
// app.use((req, res) =>
//   res.status(404).json({ success:false, message:`Not found: ${req.method} ${req.originalUrl}` })
// );

// // Error handler
// app.use((err, req, res, next) => {
//   console.error('🔴', err.message);
//   res.status(err.statusCode||500).json({ success:false, message: err.message||'Server Error' });
// });

// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

// module.exports = app;
