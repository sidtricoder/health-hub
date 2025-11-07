const express = require('express');
const {
  syncUser,
  completeSignup,
  register,
  login,
  getMe,
  updateDetails,
  updatePassword,
  logout
} = require('../controllers/authController');

const { protect, authenticateToken } = require('../middleware/auth');
const validate = require('../middleware/validation');
const {
  registerSchema,
  loginSchema,
  updateDetailsSchema,
  updatePasswordSchema,
  completeSignupSchema
} = require('../validators');

const router = express.Router();

// Kinde user sync route (called from frontend after Kinde auth)
router.post('/sync', syncUser);

// Complete signup with role selection (for new Kinde users)
router.post('/complete-signup', authenticateToken, validate(completeSignupSchema), completeSignup);

// Traditional authentication routes
router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.get('/me', protect, getMe);
router.put('/updatedetails', protect, validate(updateDetailsSchema), updateDetails);
router.put('/updatepassword', protect, validate(updatePasswordSchema), updatePassword);
router.get('/logout', logout);

module.exports = router;