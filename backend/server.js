require('dotenv').config({ path: __dirname + '/.env' });

const app = require('./src/app');
const http = require('http');
const socketIo = require('socket.io');
const connectDB = require('./src/config/database');
const { initializeSocket } = require('./src/sockets/socketHandler');
const logger = require('./src/utils/logger');

const PORT = process.env.PORT || 3001;

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Connect to database
connectDB();

// Initialize socket handlers
initializeSocket(io);

// Start server
server.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
  console.log(`🚀 Server running on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  logger.error('Unhandled Rejection:', err.message);
  server.close(() => {
    process.exit(1);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err.message);
  process.exit(1);
});

module.exports = { server, io };