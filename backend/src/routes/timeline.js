const express = require('express');
const {
  getTimeline,
  createTimelineEvent,
  getTimelineByType,
  getTimelineSummary
} = require('../controllers/timelineController');

const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validation');
const { createTimelineEventSchema } = require('../validators');

const router = express.Router();

router.use(protect); // All timeline routes require authentication

router
  .route('/:patientId')
  .get(getTimeline)
  .post(authorize('admin', 'doctor', 'nurse'), validate(createTimelineEventSchema), createTimelineEvent);

router
  .route('/:patientId/type/:type')
  .get(getTimelineByType);

router
  .route('/:patientId/summary')
  .get(getTimelineSummary);

module.exports = router;