const User = require('../models/User');
const { AppError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

// @desc    Get users by role
// @route   GET /api/users/by-role/:role
// @access  Private (authenticated users)
const getUsersByRole = async (req, res, next) => {
  try {
    const { role } = req.params;
    const { isActive = 'true' } = req.query;

    // Validate role
    const validRoles = ['doctor', 'nurse', 'lab_technician', 'receptionist', 'admin'];
    if (!validRoles.includes(role)) {
      return next(new AppError('Invalid role specified', 400));
    }

    const query = { 
      role,
      isActive: isActive === 'true'
    };

    const users = await User.find(query)
      .select('name email role specialization department licenseNumber avatar isActive')
      .sort({ name: 1 });

    logger.info(`Retrieved ${users.length} users with role: ${role}`);

    res.status(200).json({
      success: true,
      data: users
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all doctors
// @route   GET /api/users/doctors
// @access  Private (authenticated users)
const getDoctors = async (req, res, next) => {
  try {
    const doctors = await User.find({ 
      role: 'doctor', 
      isActive: true 
    })
    .select('name email specialization department licenseNumber avatar')
    .sort({ name: 1 });

    res.status(200).json({
      success: true,
      data: doctors
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all nurses  
// @route   GET /api/users/nurses
// @access  Private (authenticated users)
const getNurses = async (req, res, next) => {
  try {
    const nurses = await User.find({ 
      role: 'nurse', 
      isActive: true 
    })
    .select('name email department licenseNumber avatar')
    .sort({ name: 1 });

    res.status(200).json({
      success: true,
      data: nurses
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all staff (doctors, nurses, lab technicians)
// @route   GET /api/users/staff
// @access  Private (authenticated users)
const getStaff = async (req, res, next) => {
  try {
    const staff = await User.find({ 
      role: { $in: ['doctor', 'nurse', 'lab_technician'] }, 
      isActive: true 
    })
    .select('name email role specialization department licenseNumber avatar')
    .sort({ role: 1, name: 1 });

    res.status(200).json({
      success: true,
      data: staff
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUsersByRole,
  getDoctors,
  getNurses,
  getStaff
};