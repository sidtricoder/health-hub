const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const logger = require('./utils/logger');

// Import routes
const authRoutes = require('./routes/auth');
const patientRoutes = require('./routes/patients');
const messageRoutes = require('./routes/messages');
const notificationRoutes = require('./routes/notifications');
const timelineRoutes = require('./routes/timeline');
const userRoutes = require('./routes/users');

// Import middleware
const { errorHandler } = require('./middleware/errorHandler');
const { notFound } = require('./middleware/notFound');

const app = express();

// Security middleware
app.use(helmet());

// Rate limiting (more permissive for development)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // increased for development
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/timeline', timelineRoutes);
app.use('/api/users', userRoutes);

// Welcome route
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to Health Hub EMR API',
    version: '1.0.0',
    documentation: '/api/docs'
  });
});

// Error handling middleware (must be last)
app.use(notFound);
app.use(errorHandler);

module.exports = app;