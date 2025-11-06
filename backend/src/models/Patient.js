const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a name'],
    trim: true,
    maxlength: [100, 'Name cannot be more than 100 characters']
  },
  dateOfBirth: {
    type: Date,
    required: [true, 'Please add date of birth']
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other'],
    required: [true, 'Please specify gender']
  },
  phone: {
    type: String,
    required: [true, 'Please add a phone number'],
    match: [/^\+?[\d\s\-\(\)]+$/, 'Please add a valid phone number']
  },
  email: {
    type: String,
    lowercase: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Please add a valid email'
    ]
  },
  address: {
    type: String,
    required: [true, 'Please add an address'],
    maxlength: [500, 'Address cannot be more than 500 characters']
  },
  medicalRecordNumber: {
    type: String,
    required: [true, 'Please add medical record number'],
    unique: true,
    uppercase: true
  },
  admissionDate: {
    type: Date,
    default: Date.now
  },
  dischargeDate: {
    type: Date,
    default: null
  },
  bedNumber: {
    type: String,
    default: null
  },
  status: {
    type: String,
    enum: ['active', 'discharged', 'transferred', 'deceased'],
    default: 'active'
  },
  assignedDoctor: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'Please assign a doctor']
  },
  assignedNurse: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    default: null
  },
  emergencyContact: {
    name: {
      type: String,
      required: [true, 'Please add emergency contact name']
    },
    phone: {
      type: String,
      required: [true, 'Please add emergency contact phone'],
      match: [/^\+?[\d\s\-\(\)]+$/, 'Please add a valid phone number']
    },
    relationship: {
      type: String,
      required: [true, 'Please specify relationship'],
      enum: ['spouse', 'parent', 'child', 'sibling', 'friend', 'other']
    }
  },
  allergies: [{
    allergen: String,
    severity: {
      type: String,
      enum: ['mild', 'moderate', 'severe'],
      default: 'mild'
    },
    reaction: String,
    notes: String
  }],
  currentMedications: [{
    name: {
      type: String,
      required: true
    },
    dosage: {
      type: String,
      required: true
    },
    frequency: {
      type: String,
      required: true
    },
    startDate: {
      type: Date,
      default: Date.now
    },
    endDate: Date,
    prescribedBy: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: true
    },
    status: {
      type: String,
      enum: ['active', 'discontinued', 'completed'],
      default: 'active'
    },
    notes: String
  }],
  vitals: [{
    type: {
      type: String,
      enum: ['blood_pressure', 'heart_rate', 'temperature', 'oxygen_saturation', 'weight', 'height', 'respiratory_rate'],
      required: true
    },
    value: {
      type: String,
      required: true
    },
    unit: {
      type: String,
      required: true
    },
    recordedAt: {
      type: Date,
      default: Date.now
    },
    recordedBy: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: true
    },
    notes: String
  }],
  reports: [{
    type: {
      type: String,
      enum: ['lab', 'radiology', 'consultation', 'discharge', 'progress'],
      required: true
    },
    title: {
      type: String,
      required: true
    },
    content: {
      type: String,
      required: true
    },
    uploadedBy: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: true
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    },
    fileUrl: String,
    isCritical: {
      type: Boolean,
      default: false
    }
  }],
  createdBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for age
patientSchema.virtual('age').get(function() {
  return Math.floor((Date.now() - this.dateOfBirth) / (365.25 * 24 * 60 * 60 * 1000));
});

// Index for better query performance
patientSchema.index({ medicalRecordNumber: 1 });
patientSchema.index({ assignedDoctor: 1 });
patientSchema.index({ status: 1 });
patientSchema.index({ admissionDate: -1 });
patientSchema.index({ name: 'text' }); // For text search

module.exports = mongoose.model('Patient', patientSchema);