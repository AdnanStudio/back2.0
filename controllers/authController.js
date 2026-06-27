const User = require('../models/User');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const jwt = require('jsonwebtoken');

// JWT Token generate করার function
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d'
  });
};

// @desc    Register new user
// @route   POST /api/auth/register
exports.register = async (req, res) => {
  try {
    const { name, email, password, phone, address, dateOfBirth } = req.body;

    // SECURITY: this endpoint is public (no auth required), so we never trust
    // a `role` field from the request body — anyone could otherwise register
    // as 'admin' by calling the API directly (bypassing the frontend form,
    // which only ever sends role:'student' anyway). Admin/teacher/staff/
    // librarian/accountant accounts can only be created by an existing admin
    // via POST /api/users/create (protect + isAdmin).
    const role = 'student';

    console.log('Registration attempt:', { email, role });

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      console.log('User already exists:', email);
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Profile image URL (যদি upload করা হয়)
    let profileImage = 'https://via.placeholder.com/150';
    if (req.file) {
      profileImage = req.file.path;
    }

    console.log('Creating new user...');

    // User তৈরি করা
    const user = await User.create({
      name,
      email,
      password, // pre-save middleware hash করবে
      role,
      phone,
      address,
      dateOfBirth,
      profileImage
    });

    console.log('User created successfully:', user._id);

    // Token generate করা
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profileImage: user.profileImage,
        token
      }
    });
  } catch (error) {
    console.error('Register Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log('Login attempt:', email);

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    // User খুঁজে বের করা
    const user = await User.findOne({ email });

    if (!user) {
      console.log('User not found:', email);
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Your account has been deactivated'
      });
    }

    console.log('Verifying password...');

    // Password verify করা
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      console.log('Password mismatch for:', email);
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    console.log('Login successful:', email);

    // Token generate করা
    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profileImage: user.profileImage,
        token
      }
    });
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Get logged in user profile
// @route   GET /api/auth/me
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    let additionalData = null;

    // Role অনুযায়ী additional data fetch করা
    if (user.role === 'student') {
      additionalData = await Student.findOne({ userId: user._id });
    } else if (user.role === 'teacher') {
      additionalData = await Teacher.findOne({ userId: user._id });
    }

    res.status(200).json({
      success: true,
      data: {
        user,
        additionalData
      }
    });
  } catch (error) {
    console.error('GetMe Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
exports.updateProfile = async (req, res) => {
  try {
    const { name, phone, address, dateOfBirth } = req.body;

    const updateData = {
      name,
      phone,
      address,
      dateOfBirth
    };

    // যদি নতুন image upload করা হয়
    if (req.file) {
      updateData.profileImage = req.file.path;
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updateData,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: user
    });
  } catch (error) {
    console.error('UpdateProfile Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Change password
// @route   PUT /api/auth/change-password
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide current and new password'
      });
    }

    const user = await User.findById(req.user._id);

    // Current password verify করা
    const isMatch = await user.comparePassword(currentPassword);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // New password set করা
    user.password = newPassword;
    await user.save(); // pre-save middleware automatically hash করবে

    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('ChangePassword Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};
