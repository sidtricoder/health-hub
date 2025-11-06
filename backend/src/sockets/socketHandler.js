const Message = require('../models/Message');
const Notification = require('../models/Notification');
const Patient = require('../models/Patient');
const TimelineEvent = require('../models/TimelineEvent');
const logger = require('../utils/logger');

const activeUsers = new Map(); // userId -> socketId

const initializeSocket = (io) => {
  io.on('connection', (socket) => {
    logger.info(`User connected: ${socket.id}`);

    // User joins their personal room
    socket.on('join', (userId) => {
      socket.join(userId);
      activeUsers.set(userId, socket.id);
      logger.info(`User ${userId} joined room`);

      // Notify others that user is online
      socket.broadcast.emit('user_online', { userId });
    });

    // Handle real-time messaging
    socket.on('send_message', async (data) => {
      try {
        const { patientId, content, senderId, senderName, senderRole } = data;

        // Create message in database
        const message = await Message.create({
          patientId,
          senderId,
          senderName,
          senderRole,
          content,
          type: 'text'
        });

        // Create timeline event
        await TimelineEvent.create({
          patientId,
          type: 'message_sent',
          description: `Message sent by ${senderName} (${senderRole})`,
          userId: senderId,
          userName: senderName,
          userRole: senderRole,
          metadata: {
            messageId: message._id,
            content: content.substring(0, 100) + (content.length > 100 ? '...' : '')
          }
        });

        // Populate sender info
        await message.populate('senderId', 'name role avatar');

        // Get patient to find recipients
        const patient = await Patient.findById(patientId);
        if (patient) {
          const recipients = [
            patient.assignedDoctor.toString(),
            patient.assignedNurse?.toString()
          ].filter(Boolean);

          // Send to all recipients except sender
          recipients.forEach(recipientId => {
            if (recipientId !== senderId) {
              io.to(recipientId).emit('new_message', {
                patientId,
                message
              });
            }
          });

          // Send back to sender
          io.to(senderId).emit('message_sent', { message });
        }
      } catch (error) {
        logger.error('Error sending message:', error);
        socket.emit('message_error', { error: 'Failed to send message' });
      }
    });

    // Handle patient updates
    socket.on('patient_update', async (data) => {
      try {
        const { patientId, updateType, updateData, userId, userName, userRole } = data;

        // Create timeline event
        await TimelineEvent.create({
          patientId,
          type: updateType,
          description: `${updateType.replace('_', ' ')} updated by ${userName} (${userRole})`,
          userId,
          userName,
          userRole,
          metadata: updateData
        });

        // Get patient to find recipients
        const patient = await Patient.findById(patientId);
        if (patient) {
          const recipients = [
            patient.assignedDoctor.toString(),
            patient.assignedNurse?.toString()
          ].filter(Boolean);

          // Notify all recipients
          recipients.forEach(recipientId => {
            io.to(recipientId).emit('patient_updated', {
              patientId,
              updateType,
              updateData,
              updatedBy: { userId, userName, userRole }
            });
          });
        }
      } catch (error) {
        logger.error('Error handling patient update:', error);
      }
    });

    // Handle notifications
    socket.on('send_notification', async (data) => {
      try {
        const { recipientId, type, title, message, patientId, metadata } = data;

        // Create notification in database
        const notification = await Notification.create({
          recipientId,
          senderId: data.senderId,
          type,
          title,
          message,
          patientId,
          metadata: metadata || {}
        });

        // Populate sender and patient info
        await notification.populate('senderId', 'name role avatar');
        await notification.populate('patientId', 'name mrn');

        // Send to recipient
        io.to(recipientId).emit('new_notification', { notification });
      } catch (error) {
        logger.error('Error sending notification:', error);
      }
    });

    // Handle typing indicators
    socket.on('typing_start', (data) => {
      const { patientId, userId, userName } = data;
      socket.to(patientId).emit('user_typing', { userId, userName });
    });

    socket.on('typing_stop', (data) => {
      const { patientId, userId } = data;
      socket.to(patientId).emit('user_stopped_typing', { userId });
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      // Find userId by socketId and remove from active users
      for (const [userId, socketId] of activeUsers.entries()) {
        if (socketId === socket.id) {
          activeUsers.delete(userId);
          // Notify others that user is offline
          socket.broadcast.emit('user_offline', { userId });
          logger.info(`User ${userId} disconnected`);
          break;
        }
      }
    });
  });
};

module.exports = { initializeSocket };