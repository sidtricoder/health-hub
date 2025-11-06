const express = require('express');
const {
  getMessages,
  sendMessage,
  markAsRead,
  getUnreadCount
} = require('../controllers/messageController');

const { protect } = require('../middleware/auth');
const validate = require('../middleware/validation');
const { sendMessageSchema } = require('../validators');

const router = express.Router();

router.use(protect); // All message routes require authentication

router
  .route('/:patientId')
  .get(getMessages);

router
  .route('/')
  .post(validate(sendMessageSchema), sendMessage);

router
  .route('/:patientId/read')
  .put(markAsRead);

router
  .route('/unread')
  .get(getUnreadCount);

module.exports = router;