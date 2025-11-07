const express = require('express');
const {
  getUsersByRole,
  getDoctors,
  getNurses,
  getStaff
} = require('../controllers/userController');

const { protect } = require('../middleware/auth');

const router = express.Router();

// All user routes require authentication
router.use(protect);

// Get users by role
router.get('/by-role/:role', getUsersByRole);

// Get specific role endpoints
router.get('/doctors', getDoctors);
router.get('/nurses', getNurses);
router.get('/staff', getStaff);

module.exports = router;