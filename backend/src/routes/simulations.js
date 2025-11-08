const express = require('express');
const router = express.Router();
const { body, param, query, validationResult } = require('express-validator');
const {
  createSimulation,
  getUserSimulations,
  getSimulation,
  updateSimulation,
  deleteSimulation,
  getUserStats,
  getLeaderboard,
  addTissueInteraction,
  addCut
} = require('../controllers/simulationController');
const { protect } = require('../middleware/auth');

// Validation error handler middleware
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation errors',
      errors: errors.array()
    });
  }
  next();
};

// Validation middleware
const createSimulationValidation = [
  body('sessionId').isString().notEmpty().withMessage('Session ID is required'),
  body('userId').isMongoId().withMessage('Valid user ID is required'),
  body('duration').isInt({ min: 0 }).withMessage('Duration must be a positive integer'),
  body('score').optional().isInt({ min: 0, max: 100 }).withMessage('Score must be between 0 and 100'),
  body('errors').optional().isInt({ min: 0 }).withMessage('Errors must be a positive integer'),
  body('participants').optional().isInt({ min: 1 }).withMessage('Participants must be at least 1'),
  body('tools_used').optional().isArray().withMessage('Tools used must be an array'),
  body('simulationType').optional().isIn(['basic', 'intermediate', 'advanced', 'custom']).withMessage('Invalid simulation type'),
  body('isPublic').optional().isBoolean().withMessage('isPublic must be a boolean')
];

const updateSimulationValidation = [
  param('id').isMongoId().withMessage('Valid simulation ID is required'),
  body('title').optional().isString().withMessage('Title must be a string'),
  body('description').optional().isString().withMessage('Description must be a string'),
  body('score').optional().isInt({ min: 0, max: 100 }).withMessage('Score must be between 0 and 100'),
  body('isPublic').optional().isBoolean().withMessage('isPublic must be a boolean'),
  body('tags').optional().isArray().withMessage('Tags must be an array')
];

const tissueInteractionValidation = [
  param('id').isMongoId().withMessage('Valid simulation ID is required'),
  body('toolType').isString().notEmpty().withMessage('Tool type is required'),
  body('position').isObject().withMessage('Position must be an object'),
  body('position.x').isNumeric().withMessage('Position X must be numeric'),
  body('position.y').isNumeric().withMessage('Position Y must be numeric'),
  body('position.z').isNumeric().withMessage('Position Z must be numeric'),
  body('force').isNumeric().withMessage('Force must be numeric')
];

const cutValidation = [
  param('id').isMongoId().withMessage('Valid simulation ID is required'),
  body('id').isString().notEmpty().withMessage('Cut ID is required'),
  body('points').isArray().withMessage('Points must be an array'),
  body('depth').isNumeric().withMessage('Depth must be numeric'),
  body('toolUsed').optional().isString().withMessage('Tool used must be a string')
];

// Routes

// Create a new simulation
router.post('/', protect, ...createSimulationValidation, handleValidationErrors, createSimulation);

// Get simulations for a user
router.get('/user/:userId', protect, [
  param('userId').isMongoId().withMessage('Valid user ID is required'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('status').optional().isIn(['idle', 'active', 'paused', 'completed', 'archived']).withMessage('Invalid status'),
  query('sortBy').optional().isIn(['createdAt', 'score', 'duration', 'errors']).withMessage('Invalid sort field'),
  query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('Sort order must be asc or desc')
], handleValidationErrors, getUserSimulations);

// Get user simulation statistics
router.get('/user/:userId/stats', protect, [
  param('userId').isMongoId().withMessage('Valid user ID is required')
], handleValidationErrors, getUserStats);

// Get simulation leaderboard
router.get('/leaderboard', [
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50')
], handleValidationErrors, getLeaderboard);

// Get a specific simulation
router.get('/:id', protect, [
  param('id').isMongoId().withMessage('Valid simulation ID is required')
], handleValidationErrors, getSimulation);

// Update simulation
router.put('/:id', protect, ...updateSimulationValidation, handleValidationErrors, updateSimulation);

// Delete simulation
router.delete('/:id', protect, [
  param('id').isMongoId().withMessage('Valid simulation ID is required')
], handleValidationErrors, deleteSimulation);

// Add tissue interaction to simulation
router.post('/:id/interactions', protect, ...tissueInteractionValidation, handleValidationErrors, addTissueInteraction);

// Add cut to simulation
router.post('/:id/cuts', protect, ...cutValidation, handleValidationErrors, addCut);

module.exports = router;