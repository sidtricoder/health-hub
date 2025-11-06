const mongoose = require('mongoose');

const timelineEventSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.ObjectId,
    ref: 'Patient',
    required: [true, 'Please specify patient ID']
  },
  type: {
    type: String,
    enum: [
      'patient_admitted',
      'patient_discharged',
      'patient_transferred',
      'vital_added',
      'medication_changed',
      'medication_administered',
      'report_uploaded',
      'note_added',
      'allergy_added',
      'emergency_contact_updated',
      'bed_assigned',
      'doctor_assigned',
      'nurse_assigned'
    ],
    required: true
  },
  description: {
    type: String,
    required: [true, 'Please add event description'],
    maxlength: [500, 'Description cannot be more than 500 characters']
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  userId: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'Please specify user ID']
  },
  userName: {
    type: String,
    required: true
  },
  userRole: {
    type: String,
    enum: ['doctor', 'nurse', 'lab_technician', 'receptionist', 'admin'],
    required: true
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  ipAddress: {
    type: String,
    default: null
  },
  userAgent: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

// Index for better query performance
timelineEventSchema.index({ patientId: 1, timestamp: -1 });
timelineEventSchema.index({ userId: 1 });
timelineEventSchema.index({ type: 1 });
timelineEventSchema.index({ timestamp: -1 });

module.exports = mongoose.model('TimelineEvent', timelineEventSchema);