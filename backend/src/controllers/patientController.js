const Patient = require('../models/Patient');
const TimelineEvent = require('../models/TimelineEvent');
const { AppError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

// @desc    Get all patients
// @route   GET /api/patients
// @access  Private
const getPatients = async (req, res, next) => {
  try {
    // Copy req.query
    const reqQuery = { ...req.query };

    // Fields to exclude
    const removeFields = ['select', 'sort', 'page', 'limit'];

    // Loop over removeFields and delete them from reqQuery
    removeFields.forEach(param => delete reqQuery[param]);

    // Create query string
    let queryStr = JSON.stringify(reqQuery);

    // Create operators ($gt, $gte, etc)
    queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, match => `$${match}`);

    // Finding resource
    let query = Patient.find(JSON.parse(queryStr))
      .populate('assignedDoctor', 'name email')
      .populate('assignedNurse', 'name email')
      .populate('createdBy', 'name');

    // Select Fields
    if (req.query.select) {
      const fields = req.query.select.split(',').join(' ');
      query = query.select(fields);
    }

    // Sort
    if (req.query.sort) {
      const sortBy = req.query.sort.split(',').join(' ');
      query = query.sort(sortBy);
    } else {
      query = query.sort('-admissionDate');
    }

    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 25;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const total = await Patient.countDocuments(JSON.parse(queryStr));

    query = query.skip(startIndex).limit(limit);

    // Executing query
    const patients = await query;

    // Pagination result
    const pagination = {};

    if (endIndex < total) {
      pagination.next = {
        page: page + 1,
        limit
      };
    }

    if (startIndex > 0) {
      pagination.prev = {
        page: page - 1,
        limit
      };
    }

    res.status(200).json({
      success: true,
      count: patients.length,
      pagination,
      data: patients
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single patient
// @route   GET /api/patients/:id
// @access  Private
const getPatient = async (req, res, next) => {
  try {
    const patient = await Patient.findById(req.params.id)
      .populate('assignedDoctor', 'name email role')
      .populate('assignedNurse', 'name email role')
      .populate('createdBy', 'name')
      .populate('currentMedications.prescribedBy', 'name role')
      .populate('vitals.recordedBy', 'name role')
      .populate('reports.uploadedBy', 'name role');

    if (!patient) {
      return next(new AppError(`Patient not found with id ${req.params.id}`, 404));
    }

    res.status(200).json({
      success: true,
      data: patient
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new patient
// @route   POST /api/patients
// @access  Private
const createPatient = async (req, res, next) => {
  try {
    // Add user to req.body
    req.body.createdBy = req.user._id;

    const patient = await Patient.create(req.body);

    // Create timeline event
    await TimelineEvent.create({
      patientId: patient._id,
      type: 'patient_admitted',
      description: `Patient ${patient.name} admitted to hospital`,
      userId: req.user._id,
      userName: req.user.name,
      userRole: req.user.role,
      metadata: {
        medicalRecordNumber: patient.medicalRecordNumber,
        assignedDoctor: patient.assignedDoctor
      }
    });

    logger.info(`Patient created: ${patient.name}`, {
      patientId: patient._id,
      userId: req.user._id
    });

    res.status(201).json({
      success: true,
      data: patient
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update patient
// @route   PUT /api/patients/:id
// @access  Private
const updatePatient = async (req, res, next) => {
  try {
    let patient = await Patient.findById(req.params.id);

    if (!patient) {
      return next(new AppError(`Patient not found with id ${req.params.id}`, 404));
    }

    patient = await Patient.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    // Create timeline event for updates
    if (req.body.status && req.body.status !== patient.status) {
      await TimelineEvent.create({
        patientId: patient._id,
        type: req.body.status === 'discharged' ? 'patient_discharged' : 'patient_transferred',
        description: `Patient status changed to ${req.body.status}`,
        userId: req.user._id,
        userName: req.user.name,
        userRole: req.user.role
      });
    }

    res.status(200).json({
      success: true,
      data: patient
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete patient
// @route   DELETE /api/patients/:id
// @access  Private (Admin only)
const deletePatient = async (req, res, next) => {
  try {
    const patient = await Patient.findById(req.params.id);

    if (!patient) {
      return next(new AppError(`Patient not found with id ${req.params.id}`, 404));
    }

    await Patient.findByIdAndDelete(req.params.id);

    logger.info(`Patient deleted: ${patient.name}`, {
      patientId: patient._id,
      userId: req.user._id
    });

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add vital signs
// @route   POST /api/patients/:id/vitals
// @access  Private
const addVital = async (req, res, next) => {
  try {
    const patient = await Patient.findById(req.params.id);

    if (!patient) {
      return next(new AppError(`Patient not found with id ${req.params.id}`, 404));
    }

    const vitalData = {
      ...req.body,
      recordedBy: req.user._id,
      recordedAt: new Date()
    };

    patient.vitals.unshift(vitalData);
    await patient.save();

    // Create timeline event
    await TimelineEvent.create({
      patientId: patient._id,
      type: 'vital_added',
      description: `${req.body.type.replace('_', ' ')} recorded: ${req.body.value} ${req.body.unit}`,
      userId: req.user._id,
      userName: req.user.name,
      userRole: req.user.role,
      metadata: vitalData
    });

    res.status(200).json({
      success: true,
      data: patient.vitals[0]
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add medication
// @route   POST /api/patients/:id/medications
// @access  Private
const addMedication = async (req, res, next) => {
  try {
    const patient = await Patient.findById(req.params.id);

    if (!patient) {
      return next(new AppError(`Patient not found with id ${req.params.id}`, 404));
    }

    const medicationData = {
      ...req.body,
      prescribedBy: req.user._id,
      startDate: req.body.startDate || new Date()
    };

    patient.currentMedications.unshift(medicationData);
    await patient.save();

    // Create timeline event
    await TimelineEvent.create({
      patientId: patient._id,
      type: 'medication_changed',
      description: `Medication ${req.body.name} prescribed`,
      userId: req.user._id,
      userName: req.user.name,
      userRole: req.user.role,
      metadata: medicationData
    });

    res.status(200).json({
      success: true,
      data: patient.currentMedications[0]
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add report
// @route   POST /api/patients/:id/reports
// @access  Private
const addReport = async (req, res, next) => {
  try {
    const patient = await Patient.findById(req.params.id);

    if (!patient) {
      return next(new AppError(`Patient not found with id ${req.params.id}`, 404));
    }

    const reportData = {
      ...req.body,
      uploadedBy: req.user._id,
      uploadedAt: new Date()
    };

    patient.reports.unshift(reportData);
    await patient.save();

    // Create timeline event
    await TimelineEvent.create({
      patientId: patient._id,
      type: 'report_uploaded',
      description: `${req.body.type} report uploaded: ${req.body.title}`,
      userId: req.user._id,
      userName: req.user.name,
      userRole: req.user.role,
      metadata: reportData
    });

    res.status(200).json({
      success: true,
      data: patient.reports[0]
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get patient statistics
// @route   GET /api/patients/:id/stats
// @access  Private
const getPatientStats = async (req, res, next) => {
  try {
    const patient = await Patient.findById(req.params.id);

    if (!patient) {
      return next(new AppError(`Patient not found with id ${req.params.id}`, 404));
    }

    // Calculate statistics
    const stats = {
      totalVitals: patient.vitals.length,
      totalMedications: patient.currentMedications.length,
      totalReports: patient.reports.length,
      admissionDate: patient.admissionDate,
      daysAdmitted: Math.floor((Date.now() - patient.admissionDate) / (1000 * 60 * 60 * 24)),
      lastVitalUpdate: patient.vitals.length > 0 ? patient.vitals[0].recordedAt : null,
      lastMedicationUpdate: patient.currentMedications.length > 0 ? patient.currentMedications[0].startDate : null,
      lastReportUpdate: patient.reports.length > 0 ? patient.reports[0].uploadedAt : null
    };

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPatients,
  getPatient,
  createPatient,
  updatePatient,
  deletePatient,
  addVital,
  addMedication,
  addReport,
  getPatientStats
};