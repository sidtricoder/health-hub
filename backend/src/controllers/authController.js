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

// @desc    Sync user from frontend Kinde authentication
// @route   POST /api/auth/sync
// @access  Public (validates Kinde token)
const syncUser = async (req, res, next) => {
  try {
    const { kindeUser, accessToken } = req.body;

    logger.info('Sync user request received', { 
      hasKindeUser: !!kindeUser, 
      hasAccessToken: !!accessToken,
      kindeUserKeys: kindeUser ? Object.keys(kindeUser) : null
    });

    if (!kindeUser || !accessToken) {
      return next(new AppError('User data and access token are required', 400));
    }

    // Verify the Kinde access token by making a request to Kinde's user endpoint
    const kindeResponse = await fetch(`${process.env.KINDE_DOMAIN}/oauth2/v2/user_profile`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json'
      }
    });

    if (!kindeResponse.ok) {
      return next(new AppError('Invalid Kinde access token', 401));
    }

    const verifiedUser = await kindeResponse.json();
    
    logger.info('Kinde user verification successful', { 
      verifiedUser,
      kindeUser
    });
    
    // Ensure the user data matches what was sent
    if (verifiedUser.id !== kindeUser.id || verifiedUser.email !== kindeUser.email) {
      return next(new AppError('User data mismatch', 401));
    }

    // Handle different possible field names from Kinde
    const kindeId = kindeUser.id;
    const email = kindeUser.email;
    const givenName = kindeUser.given_name || kindeUser.givenName || kindeUser.first_name || '';
    const familyName = kindeUser.family_name || kindeUser.familyName || kindeUser.last_name || '';
    
    logger.info('Extracted user data', { kindeId, email, givenName, familyName });

    let user = await User.findOne({
      $or: [
        { kindeId: kindeId },
        { email: email }
      ]
    });

    if (user) {
      user.kindeId = kindeId;
      user.name = `${givenName} ${familyName}`.trim();
      user.lastLogin = new Date();
      await user.save();
    } else {
      user = await User.create({
        name: `${givenName} ${familyName}`.trim(),
        email: email,
        kindeId: kindeId,
        role: 'doctor',
        lastLogin: new Date()
      });
    }

    const token = generateToken(user._id);

    logger.info(`User synced from Kinde: ${user.email}`, { userId: user._id });

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
  syncUser,
  register,
  login,
  getMe,
  updateDetails,
  updatePassword,
  logout
};