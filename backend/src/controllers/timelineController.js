const TimelineEvent = require('../models/TimelineEvent');
const Patient = require('../models/Patient');
const { AppError } = require('../middleware/errorHandler');

// @desc    Get timeline events for a patient
// @route   GET /api/timeline/:patientId
// @access  Private
const getTimeline = async (req, res, next) => {
  try {
    const { patientId } = req.params;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 50;
    const startIndex = (page - 1) * limit;

    // Check if patient exists and user has access
    const patient = await Patient.findById(patientId);
    if (!patient) {
      return next(new AppError('Patient not found', 404));
    }

    // Check if user has access to this patient
    if (req.user.role !== 'admin' &&
        req.user._id.toString() !== patient.assignedDoctor.toString() &&
        req.user._id.toString() !== patient.assignedNurse?.toString()) {
      return next(new AppError('Not authorized to access this patient\'s timeline', 403));
    }

    const events = await TimelineEvent.find({ patientId })
      .sort({ timestamp: -1 })
      .skip(startIndex)
      .limit(limit)
      .populate('userId', 'name role avatar');

    const total = await TimelineEvent.countDocuments({ patientId });

    res.status(200).json({
      success: true,
      count: events.length,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      data: events
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create timeline event
// @route   POST /api/timeline
// @access  Private
const createTimelineEvent = async (req, res, next) => {
  try {
    const { patientId, type, description, metadata } = req.body;

    // Check if patient exists
    const patient = await Patient.findById(patientId);
    if (!patient) {
      return next(new AppError('Patient not found', 404));
    }

    // Check if user has access to this patient
    if (req.user.role !== 'admin' &&
        req.user._id.toString() !== patient.assignedDoctor.toString() &&
        req.user._id.toString() !== patient.assignedNurse?.toString()) {
      return next(new AppError('Not authorized to create timeline events for this patient', 403));
    }

    const event = await TimelineEvent.create({
      patientId,
      type,
      description,
      userId: req.user._id,
      userName: req.user.name,
      userRole: req.user.role,
      metadata: metadata || {}
    });

    // Populate user info
    await event.populate('userId', 'name role avatar');

    res.status(201).json({
      success: true,
      data: event
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get timeline events by type
// @route   GET /api/timeline/:patientId/type/:type
// @access  Private
const getTimelineByType = async (req, res, next) => {
  try {
    const { patientId, type } = req.params;

    // Check if patient exists and user has access
    const patient = await Patient.findById(patientId);
    if (!patient) {
      return next(new AppError('Patient not found', 404));
    }

    if (req.user.role !== 'admin' &&
        req.user._id.toString() !== patient.assignedDoctor.toString() &&
        req.user._id.toString() !== patient.assignedNurse?.toString()) {
      return next(new AppError('Not authorized to access this patient\'s timeline', 403));
    }

    const events = await TimelineEvent.find({
      patientId,
      type
    })
      .sort({ timestamp: -1 })
      .populate('userId', 'name role avatar');

    res.status(200).json({
      success: true,
      count: events.length,
      data: events
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get timeline summary for patient
// @route   GET /api/timeline/:patientId/summary
// @access  Private
const getTimelineSummary = async (req, res, next) => {
  try {
    const { patientId } = req.params;

    // Check if patient exists and user has access
    const patient = await Patient.findById(patientId);
    if (!patient) {
      return next(new AppError('Patient not found', 404));
    }

    if (req.user.role !== 'admin' &&
        req.user._id.toString() !== patient.assignedDoctor.toString() &&
        req.user._id.toString() !== patient.assignedNurse?.toString()) {
      return next(new AppError('Not authorized to access this patient\'s timeline', 403));
    }

    // Get event counts by type
    const summary = await TimelineEvent.aggregate([
      { $match: { patientId: patient._id } },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          lastEvent: { $max: '$timestamp' }
        }
      },
      {
        $sort: { lastEvent: -1 }
      }
    ]);

    res.status(200).json({
      success: true,
      data: summary
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTimeline,
  createTimelineEvent,
  getTimelineByType,
  getTimelineSummary
};