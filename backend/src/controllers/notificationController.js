const Notification = require('../models/Notification');
const User = require('../models/User');
const { AppError } = require('../middleware/errorHandler');

// @desc    Get notifications for user
// @route   GET /api/notifications
// @access  Private
const getNotifications = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const startIndex = (page - 1) * limit;

    const notifications = await Notification.find({
      recipientId: req.user._id
    })
      .sort({ createdAt: -1 })
      .skip(startIndex)
      .limit(limit)
      .populate('senderId', 'name role avatar')
      .populate('patientId', 'name mrn');

    const total = await Notification.countDocuments({
      recipientId: req.user._id
    });

    res.status(200).json({
      success: true,
      count: notifications.length,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      data: notifications
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create notification
// @route   POST /api/notifications
// @access  Private
const createNotification = async (req, res, next) => {
  try {
    const { recipientId, type, title, message, patientId, metadata } = req.body;

    // Check if recipient exists
    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return next(new AppError('Recipient not found', 404));
    }

    const notification = await Notification.create({
      recipientId,
      senderId: req.user._id,
      type,
      title,
      message,
      patientId,
      metadata: metadata || {}
    });

    // Populate sender and patient info
    await notification.populate('senderId', 'name role avatar');
    await notification.populate('patientId', 'name mrn');

    res.status(201).json({
      success: true,
      data: notification
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
const markAsRead = async (req, res, next) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return next(new AppError('Notification not found', 404));
    }

    // Check if user owns this notification
    if (notification.recipientId.toString() !== req.user._id.toString()) {
      return next(new AppError('Not authorized to access this notification', 403));
    }

    notification.isRead = true;
    notification.readAt = new Date();
    await notification.save();

    res.status(200).json({
      success: true,
      data: notification
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/read-all
// @access  Private
const markAllAsRead = async (req, res, next) => {
  try {
    await Notification.updateMany(
      {
        recipientId: req.user._id,
        isRead: false
      },
      {
        $set: {
          isRead: true,
          readAt: new Date()
        }
      }
    );

    res.status(200).json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete notification
// @route   DELETE /api/notifications/:id
// @access  Private
const deleteNotification = async (req, res, next) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return next(new AppError('Notification not found', 404));
    }

    // Check if user owns this notification
    if (notification.recipientId.toString() !== req.user._id.toString()) {
      return next(new AppError('Not authorized to delete this notification', 403));
    }

    await notification.remove();

    res.status(200).json({
      success: true,
      message: 'Notification deleted'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get unread notification count
// @route   GET /api/notifications/unread-count
// @access  Private
const getUnreadCount = async (req, res, next) => {
  try {
    const unreadCount = await Notification.countDocuments({
      recipientId: req.user._id,
      isRead: false
    });

    res.status(200).json({
      success: true,
      data: {
        unreadCount
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getNotifications,
  createNotification,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getUnreadCount
};