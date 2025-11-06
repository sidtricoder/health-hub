const express = require('express');
const {
  getPatients,
  getPatient,
  createPatient,
  updatePatient,
  deletePatient,
  addVital,
  addMedication,
  addReport,
  getPatientStats
} = require('../controllers/patientController');

const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validation');
const {
  createPatientSchema,
  updatePatientSchema,
  addVitalSchema,
  addMedicationSchema,
  addReportSchema
} = require('../validators');

const router = express.Router();

router.use(protect); // All patient routes require authentication

router
  .route('/')
  .get(getPatients)
  .post(authorize('admin', 'receptionist'), validate(createPatientSchema), createPatient);

router
  .route('/:id')
  .get(getPatient)
  .put(authorize('admin', 'doctor', 'nurse'), validate(updatePatientSchema), updatePatient)
  .delete(authorize('admin'), deletePatient);

router
  .route('/:id/vitals')
  .post(authorize('admin', 'doctor', 'nurse'), validate(addVitalSchema), addVital);

router
  .route('/:id/medications')
  .post(authorize('admin', 'doctor', 'nurse'), validate(addMedicationSchema), addMedication);

router
  .route('/:id/reports')
  .post(authorize('admin', 'doctor', 'nurse', 'lab_technician'), validate(addReportSchema), addReport);

router
  .route('/:id/stats')
  .get(getPatientStats);

module.exports = router;