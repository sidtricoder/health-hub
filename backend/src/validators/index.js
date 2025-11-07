const Joi = require('joi');

// User validation schemas
const registerSchema = Joi.object({
  name: Joi.string().min(2).max(50).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  role: Joi.string().valid('admin', 'doctor', 'nurse', 'receptionist', 'lab_technician').required()
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

const updateDetailsSchema = Joi.object({
  name: Joi.string().min(2).max(50),
  email: Joi.string().email()
});

const updatePasswordSchema = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: Joi.string().min(6).required()
});

// Patient validation schemas
const createPatientSchema = Joi.object({
  firstName: Joi.string().min(1).max(50).required(),
  lastName: Joi.string().min(1).max(50).required(),
  dateOfBirth: Joi.date().required(),
  gender: Joi.string().valid('male', 'female', 'other').required(),
  phone: Joi.string().pattern(/^\+?[\d\s\-\(\)]+$/).required(),
  email: Joi.string().email().optional().allow(''),
  address: Joi.string().required(),
  emergencyContact: Joi.object({
    name: Joi.string().required(),
    relationship: Joi.string().valid('spouse', 'parent', 'child', 'sibling', 'friend', 'other').required(),
    phone: Joi.string().pattern(/^\+?[\d\s\-\(\)]+$/).required()
  }).required(),
  allergies: Joi.array().items(Joi.object({
    allergen: Joi.string().required(),
    severity: Joi.string().valid('mild', 'moderate', 'severe').required(),
    reaction: Joi.string().required(),
    notes: Joi.string().allow('').optional()
  })).default([]),
  currentMedications: Joi.array().items(Joi.object({
    name: Joi.string().required(),
    dosage: Joi.string().required(),
    frequency: Joi.string().required(),
    prescribedBy: Joi.string().hex().length(24).required(),
    status: Joi.string().valid('active', 'discontinued', 'completed').default('active'),
    notes: Joi.string().allow('').optional()
  })).default([]),
  assignedDoctor: Joi.string().hex().length(24).required(),
  assignedNurse: Joi.string().hex().length(24).optional().allow(null, ''),
  roomNumber: Joi.string().optional().allow(null, ''),
  bedNumber: Joi.string().optional().allow(null, ''),
  // Remove medicalRecordNumber from validation since it's auto-generated
  medicalRecordNumber: Joi.string().optional()
}).options({ stripUnknown: true });

const updatePatientSchema = Joi.object({
  firstName: Joi.string().min(2).max(50).required(),
  lastName: Joi.string().min(2).max(50).required(),
  phone: Joi.string().pattern(/^\+?[\d\s\-\(\)]+$/).required(),
  email: Joi.string().email().optional().allow(''),
  dateOfBirth: Joi.date().required(),
  gender: Joi.string().valid('male', 'female', 'other').required(),
  // Address should be a string, not an object - required
  address: Joi.string().min(1).required(),
  emergencyContact: Joi.object({
    name: Joi.string().min(1).required(),
    relationship: Joi.string().min(1).required(),
    phone: Joi.string().pattern(/^\+?[\d\s\-\(\)]+$/).required()
  }).required(),
  // Allergies should be array of objects matching the model
  allergies: Joi.array().items(Joi.object({
    allergen: Joi.string().required(),
    severity: Joi.string().valid('mild', 'moderate', 'severe').default('mild'),
    reaction: Joi.string().optional().allow(''),
    notes: Joi.string().optional().allow('')
  })).optional(),
  // Current medications should be array of objects matching the model
  currentMedications: Joi.array().items(Joi.object({
    name: Joi.string().required(),
    dosage: Joi.string().optional().allow(''),
    frequency: Joi.string().optional().allow(''),
    prescribedBy: Joi.string().hex().length(24).optional(),
    status: Joi.string().valid('active', 'discontinued', 'completed').default('active'),
    notes: Joi.string().optional().allow('')
  })).optional(),
  // Use assignedDoctor to match the model - required
  assignedDoctor: Joi.string().hex().length(24).required(),
  // assignedNurse can be omitted entirely if not provided (don't send empty string)
  assignedNurse: Joi.string().hex().length(24).optional()
}).options({ stripUnknown: true });

const addVitalSchema = Joi.object({
  type: Joi.string().valid('blood_pressure', 'heart_rate', 'temperature', 'weight', 'height', 'oxygen_saturation', 'respiratory_rate').required(),
  value: Joi.alternatives().try(
    Joi.number(),
    Joi.string().pattern(/^\d+\/\d+$/) // for blood pressure like 120/80
  ).required(),
  unit: Joi.string().required(),
  notes: Joi.string()
});

const addMedicationSchema = Joi.object({
  name: Joi.string().required(),
  dosage: Joi.string().required(),
  frequency: Joi.string().required(),
  startDate: Joi.date().required(),
  endDate: Joi.date(),
  prescribedBy: Joi.string().hex().length(24).required(),
  instructions: Joi.string(),
  sideEffects: Joi.array().items(Joi.string())
});

const addReportSchema = Joi.object({
  type: Joi.string().valid('lab_result', 'imaging', 'consultation', 'procedure', 'discharge_summary').required(),
  title: Joi.string().required(),
  content: Joi.string().required(),
  performedBy: Joi.string().hex().length(24).required(),
  datePerformed: Joi.date().required(),
  attachments: Joi.array().items(Joi.object({
    name: Joi.string(),
    url: Joi.string().uri(),
    type: Joi.string()
  }))
});

// Message validation schemas
const sendMessageSchema = Joi.object({
  patientId: Joi.string().hex().length(24).required(),
  content: Joi.string().min(1).max(1000).required()
});

// Notification validation schemas
const createNotificationSchema = Joi.object({
  recipientId: Joi.string().hex().length(24).required(),
  type: Joi.string().valid('task', 'alert', 'reminder', 'update').required(),
  title: Joi.string().min(1).max(100).required(),
  message: Joi.string().min(1).max(500).required(),
  patientId: Joi.string().hex().length(24),
  metadata: Joi.object()
});

// Auth validation schemas
const completeSignupSchema = Joi.object({
  role: Joi.string().valid('admin', 'doctor', 'nurse', 'receptionist', 'lab_technician').required(),
  specialization: Joi.string().when('role', {
    is: 'doctor',
    then: Joi.string().min(2).max(50),
    otherwise: Joi.string().optional()
  }),
  department: Joi.string().min(2).max(50),
  licenseNumber: Joi.string().when('role', {
    is: Joi.valid('doctor', 'nurse'),
    then: Joi.string().min(3).max(20),
    otherwise: Joi.string().optional()
  }),
  phone: Joi.string().pattern(/^\+?[\d\s\-\(\)]+$/),
  emergencyContact: Joi.object({
    name: Joi.string().min(2).max(50),
    relationship: Joi.string().min(2).max(30),
    phone: Joi.string().pattern(/^\+?[\d\s\-\(\)]+$/)
  })
});

// Timeline validation schemas
const createTimelineEventSchema = Joi.object({
  patientId: Joi.string().hex().length(24).required(),
  type: Joi.string().valid('admission', 'discharge', 'medication_change', 'vital_signs', 'note_added', 'message_sent', 'procedure', 'lab_result', 'consultation').required(),
  description: Joi.string().min(1).max(500).required(),
  metadata: Joi.object()
});

module.exports = {
  registerSchema,
  loginSchema,
  updateDetailsSchema,
  updatePasswordSchema,
  completeSignupSchema,
  createPatientSchema,
  updatePatientSchema,
  addVitalSchema,
  addMedicationSchema,
  addReportSchema,
  sendMessageSchema,
  createNotificationSchema,
  createTimelineEventSchema
};