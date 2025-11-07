const express = require('express');
const {
  syncUser,
  register,
  login,
  getMe,
  updateDetails,
  updatePassword,
  logout
} = require('../controllers/authController');

const { protect } = require('../middleware/auth');
const validate = require('../middleware/validation');
const {
  registerSchema,
  loginSchema,
  updateDetailsSchema,
  updatePasswordSchema
} = require('../validators');

const router = express.Router();

// Kinde user sync route (called from frontend after Kinde auth)
router.post('/sync', syncUser);

// Traditional authentication routes
router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.get('/me', protect, getMe);
router.put('/updatedetails', protect, validate(updateDetailsSchema), updateDetails);
router.put('/updatepassword', protect, validate(updatePasswordSchema), updatePassword);
router.get('/logout', logout);

module.exports = router;