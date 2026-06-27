const jwt = require('jsonwebtoken');
const User = require('../models/User');

// JWT verify করার middleware
exports.protect = async (req, res, next) => {
  try {
    let token;

    // Token check করা header থেকে
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    // Token verify করা
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // User খুঁজে বের করা
    req.user = await User.findById(decoded.id).select('-password');
    
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    next();
  } catch (error) {
    console.error('Auth Middleware Error:', error);
    return res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
};

// Role check করার middleware
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role '${req.user.role}' is not authorized to access this route`
      });
    }
    next();
  };
};

// ✅ Admin only middleware
exports.isAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin only.'
    });
  }
  next();
};

// ✅ Staff only middleware
exports.isStaff = (req, res, next) => {
  if (req.user.role !== 'staff') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Staff only.'
    });
  }
  next();
};

// ✅ Librarian only middleware
exports.isLibrarian = (req, res, next) => {
  if (req.user.role !== 'librarian') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Librarian only.'
    });
  }
  next();
};

// ✅ Accountant only middleware
exports.isAccountant = (req, res, next) => {
  if (req.user.role !== 'accountant') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Accountant only.'
    });
  }
  next();
};
