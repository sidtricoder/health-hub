const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'Please specify user ID']
  },
  type: {
    type: String,
    enum: [
      'task_assigned',
      'report_ready',
      'medication_reminder',
      'patient_update',
      'message_received',
      'vital_alert',
      'system_alert'
    ],
    required: true
  },
  title: {
    type: String,
    required: [true, 'Please add notification title'],
    maxlength: [200, 'Title cannot be more than 200 characters']
  },
  message: {
    type: String,
    required: [true, 'Please add notification message'],
    maxlength: [500, 'Message cannot be more than 500 characters']
  },
  patientId: {
    type: mongoose.Schema.ObjectId,
    ref: 'Patient',
    default: null
  },
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date,
    default: null
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  actionUrl: {
    type: String,
    default: null
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  expiresAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Index for better query performance
notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ type: 1 });
notificationSchema.index({ patientId: 1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Auto-delete expired notifications
notificationSchema.pre('save', function(next) {
  if (this.expiresAt && this.expiresAt < new Date()) {
    return next(new Error('Notification has expired'));
  }
  next();
});

module.exports = mongoose.model('Notification', notificationSchema);