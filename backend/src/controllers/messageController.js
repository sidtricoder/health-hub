const Message = require('../models/Message');
const Patient = require('../models/Patient');
const TimelineEvent = require('../models/TimelineEvent');
const { AppError } = require('../middleware/errorHandler');

// @desc    Get messages for a patient
// @route   GET /api/messages/:patientId
// @access  Private
const getMessages = async (req, res, next) => {
  try {
    const { patientId } = req.params;

    // Check if patient exists and user has access
    const patient = await Patient.findById(patientId);
    if (!patient) {
      return next(new AppError('Patient not found', 404));
    }

    // Check if user has access to this patient
    if (req.user.role !== 'admin' &&
        req.user._id.toString() !== patient.assignedDoctor.toString() &&
        req.user._id.toString() !== patient.assignedNurse?.toString()) {
      return next(new AppError('Not authorized to access this patient\'s messages', 403));
    }

    const messages = await Message.find({ patientId })
      .sort({ timestamp: 1 })
      .populate('senderId', 'name role avatar')
      .limit(100); // Limit to last 100 messages

    res.status(200).json({
      success: true,
      count: messages.length,
      data: messages
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Send message
// @route   POST /api/messages
// @access  Private
const sendMessage = async (req, res, next) => {
  try {
    const { patientId, content } = req.body;

    // Check if patient exists
    const patient = await Patient.findById(patientId);
    if (!patient) {
      return next(new AppError('Patient not found', 404));
    }

    // Check if user has access to this patient
    if (req.user.role !== 'admin' &&
        req.user._id.toString() !== patient.assignedDoctor.toString() &&
        req.user._id.toString() !== patient.assignedNurse?.toString()) {
      return next(new AppError('Not authorized to send messages for this patient', 403));
    }

    const message = await Message.create({
      patientId,
      senderId: req.user._id,
      senderName: req.user.name,
      senderRole: req.user.role,
      content,
      type: 'text'
    });

    // Create timeline event
    await TimelineEvent.create({
      patientId,
      type: 'note_added',
      description: `Message sent by ${req.user.name} (${req.user.role})`,
      userId: req.user._id,
      userName: req.user.name,
      userRole: req.user.role,
      metadata: {
        messageId: message._id,
        content: content.substring(0, 100) + (content.length > 100 ? '...' : '')
      }
    });

    // Populate sender info
    await message.populate('senderId', 'name role avatar');

    res.status(201).json({
      success: true,
      data: message
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark messages as read
// @route   PUT /api/messages/:patientId/read
// @access  Private
const markAsRead = async (req, res, next) => {
  try {
    const { patientId } = req.params;

    // Update messages where sender is not current user
    await Message.updateMany(
      {
        patientId,
        senderId: { $ne: req.user._id },
        isRead: false
      },
      {
        $set: { isRead: true },
        $push: {
          readBy: {
            userId: req.user._id,
            readAt: new Date()
          }
        }
      }
    );

    res.status(200).json({
      success: true,
      message: 'Messages marked as read'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get unread message count for user
// @route   GET /api/messages/unread
// @access  Private
const getUnreadCount = async (req, res, next) => {
  try {
    // Get patients assigned to user
    const patients = await Patient.find({
      $or: [
        { assignedDoctor: req.user._id },
        { assignedNurse: req.user._id }
      ]
    }).select('_id');

    const patientIds = patients.map(p => p._id);

    // Count unread messages for these patients
    const unreadCount = await Message.countDocuments({
      patientId: { $in: patientIds },
      senderId: { $ne: req.user._id },
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
  getMessages,
  sendMessage,
  markAsRead,
  getUnreadCount
};