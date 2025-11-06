const express = require('express');
const {
  getNotifications,
  createNotification,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getUnreadCount
} = require('../controllers/notificationController');

const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validation');
const { createNotificationSchema } = require('../validators');

const router = express.Router();

router.use(protect); // All notification routes require authentication

router
  .route('/')
  .get(getNotifications)
  .post(authorize('admin', 'doctor', 'nurse'), validate(createNotificationSchema), createNotification);

router
  .route('/:id/read')
  .put(markAsRead);

router
  .route('/read-all')
  .put(markAllAsRead);

router
  .route('/:id')
  .delete(deleteNotification);

router
  .route('/unread-count')
  .get(getUnreadCount);

module.exports = router;