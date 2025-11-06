const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { AppError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '30d',
  });
};

// @desc    Kinde login - redirect to Kinde authorization
// @route   GET /api/auth/kinde/auth
// @access  Public
const kindeLogin = async (req, res, next) => {
  try {
    // Use Kinde client to get login URL
    const loginUrl = await req.kinde.login();
    res.redirect(loginUrl);
  } catch (error) {
    logger.error('Kinde login error:', error);
    next(new AppError('Failed to initiate Kinde login', 500));
  }
};

// @desc    Kinde callback - handle user authentication and registration
// @route   GET /api/auth/kinde/callback
// @access  Public
const kindeCallback = async (req, res, next) => {
  try {
    // Get user from Kinde
    const kindeUser = await req.kinde.getUser();

    if (!kindeUser) {
      return next(new AppError('Kinde authentication failed - no user data', 401));
    }

    const { id: kindeId, email, given_name, family_name } = kindeUser;

    if (!email) {
      return next(new AppError('Email is required from Kinde', 400));
    }

    // Check if user exists by kindeId or email
    let user = await User.findOne({
      $or: [
        { kindeId: kindeId },
        { email: email }
      ]
    });

    if (user) {
      // Update existing user with kindeId if not present
      if (!user.kindeId) {
        user.kindeId = kindeId;
        user.name = user.name || `${given_name || ''} ${family_name || ''}`.trim();
        await user.save();
      }
    } else {
      // Create new user
      user = await User.create({
        name: `${given_name || ''} ${family_name || ''}`.trim() || email.split('@')[0],
        email: email,
        kindeId: kindeId,
        role: 'doctor', // Default role, can be updated later
        lastLogin: new Date()
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate JWT token for API access
    const token = generateToken(user._id);

    logger.info(`User authenticated via Kinde: ${user.email}`, { userId: user._id, kindeId });

    // Redirect to frontend with token
    const redirectUrl = `${process.env.FRONTEND_URL || "http://localhost:3000"}/dashboard?token=${token}`;
    res.redirect(redirectUrl);
  } catch (error) {
    logger.error('Kinde callback error:', error);
    next(error);
  }
};

// @desc    Register user (traditional method)
// @route   POST /api/auth/register
// @access  Public (in development) / Private (admin only in production)
const register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return next(new AppError('User already exists', 400));
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      role: role || 'doctor',
      createdBy: req.user ? req.user._id : null
    });

    // Generate token
    const token = generateToken(user._id);

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    logger.info(`User registered: ${user.email}`, { userId: user._id });

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: user.avatar
        },
        token
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validate email & password
    if (!email || !password) {
      return next(new AppError('Please provide an email and password', 400));
    }

    // Check for user
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return next(new AppError('Invalid credentials', 401));
    }

    // Check if user is active
    if (!user.isActive) {
      return next(new AppError('Account is deactivated', 401));
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return next(new AppError('Invalid credentials', 401));
    }

    // Generate token
    const token = generateToken(user._id);

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    logger.info(`User logged in: ${user.email}`, { userId: user._id });

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: user.avatar
        },
        token
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: user.avatar,
          lastLogin: user.lastLogin,
          createdAt: user.createdAt
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user details
// @route   PUT /api/auth/updatedetails
// @access  Private
const updateDetails = async (req, res, next) => {
  try {
    const fieldsToUpdate = {
      name: req.body.name,
      email: req.body.email,
      avatar: req.body.avatar
    };

    // Remove undefined fields
    Object.keys(fieldsToUpdate).forEach(key => {
      if (fieldsToUpdate[key] === undefined) {
        delete fieldsToUpdate[key];
      }
    });

    const user = await User.findByIdAndUpdate(req.user._id, fieldsToUpdate, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: user.avatar
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update password
// @route   PUT /api/auth/updatepassword
// @access  Private
const updatePassword = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('+password');

    // Check current password
    if (!(await user.matchPassword(req.body.currentPassword))) {
      return next(new AppError('Password is incorrect', 401));
    }

    user.password = req.body.newPassword;
    await user.save();

    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: user.avatar
        },
        token
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Logout user / clear cookie
// @route   GET /api/auth/logout
// @access  Private
const logout = (req, res, next) => {
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  });

  res.status(200).json({
    success: true,
    data: {}
  });
};

module.exports = {
  kindeLogin,
  kindeCallback,
  register,
  login,
  getMe,
  updateDetails,
  updatePassword,
  logout
};