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
  name: Joi.string().min(2).max(100).required(),
  dateOfBirth: Joi.date().required(),
  gender: Joi.string().valid('male', 'female', 'other').required(),
  phone: Joi.string().pattern(/^\+?[\d\s\-\(\)]+$/),
  email: Joi.string().email(),
  address: Joi.object({
    street: Joi.string(),
    city: Joi.string(),
    state: Joi.string(),
    zipCode: Joi.string(),
    country: Joi.string()
  }),
  emergencyContact: Joi.object({
    name: Joi.string(),
    relationship: Joi.string(),
    phone: Joi.string().pattern(/^\+?[\d\s\-\(\)]+$/)
  }),
  medicalHistory: Joi.array().items(Joi.string()),
  allergies: Joi.array().items(Joi.string()),
  currentMedications: Joi.array().items(Joi.string()),
  assignedDoctor: Joi.string().hex().length(24).required(),
  assignedNurse: Joi.string().hex().length(24)
});

const updatePatientSchema = Joi.object({
  name: Joi.string().min(2).max(100),
  phone: Joi.string().pattern(/^\+?[\d\s\-\(\)]+$/),
  email: Joi.string().email(),
  address: Joi.object({
    street: Joi.string(),
    city: Joi.string(),
    state: Joi.string(),
    zipCode: Joi.string(),
    country: Joi.string()
  }),
  emergencyContact: Joi.object({
    name: Joi.string(),
    relationship: Joi.string(),
    phone: Joi.string().pattern(/^\+?[\d\s\-\(\)]+$/)
  }),
  medicalHistory: Joi.array().items(Joi.string()),
  allergies: Joi.array().items(Joi.string()),
  currentMedications: Joi.array().items(Joi.string()),
  assignedDoctor: Joi.string().hex().length(24),
  assignedNurse: Joi.string().hex().length(24)
});

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
  createPatientSchema,
  updatePatientSchema,
  addVitalSchema,
  addMedicationSchema,
  addReportSchema,
  sendMessageSchema,
  createNotificationSchema,
  createTimelineEventSchema
};