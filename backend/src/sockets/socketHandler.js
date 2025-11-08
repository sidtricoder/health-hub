const Message = require('../models/Message');
const Notification = require('../models/Notification');
const Patient = require('../models/Patient');
const TimelineEvent = require('../models/TimelineEvent');
const User = require('../models/User');
const logger = require('../utils/logger');

const activeUsers = new Map(); // userId -> { socketId, joinedAt, lastActivity, patientRooms }
const patientRooms = new Map(); // patientId -> Set of userIds

const initializeSocket = (io) => {
  io.on('connection', (socket) => {
    logger.info(`Socket connected: ${socket.id}`);

    // Enhanced user authentication and join
    socket.on('authenticate', async (data) => {
      try {
        const { userId, token } = data;
        
        // Verify token and get user (simplified for now)
        const user = await User.findById(userId);
        if (!user) {
          socket.emit('auth_error', { message: 'Invalid user' });
          return;
        }

        // Store user info
        socket.userId = userId;
        socket.user = user;
        socket.join(userId);
        
        activeUsers.set(userId, {
          socketId: socket.id,
          joinedAt: new Date(),
          lastActivity: new Date(),
          patientRooms: new Set()
        });

        logger.info(`User authenticated: ${user.name} (${user.role}) - ${socket.id}`);

        // Send auth success and current active users
        socket.emit('authenticated', { 
          user: {
            id: user._id,
            name: user.name,
            role: user.role,
            avatar: user.avatar
          },
          activeUsersCount: activeUsers.size
        });

        // Notify others that user is online
        socket.broadcast.emit('user_online', { 
          userId, 
          userName: user.name, 
          userRole: user.role 
        });

      } catch (error) {
        logger.error('Authentication error:', error);
        socket.emit('auth_error', { message: 'Authentication failed' });
      }
    });

    // Join patient room for real-time updates
    socket.on('join_patient', async (data) => {
      try {
        const { patientId } = data;
        const userId = socket.userId;

        if (!userId) {
          socket.emit('error', { message: 'Not authenticated' });
          return;
        }

        // Verify user has access to this patient
        const patient = await Patient.findById(patientId);
        if (!patient) {
          socket.emit('error', { message: 'Patient not found' });
          return;
        }

        // Check if user has access
        const hasAccess = patient.assignedDoctor.toString() === userId ||
                         patient.assignedNurse?.toString() === userId ||
                         socket.user.role === 'admin';

        if (!hasAccess) {
          socket.emit('error', { message: 'Unauthorized access to patient' });
          return;
        }

        // Join patient room
        socket.join(`patient_${patientId}`);
        
        // Update user's patient rooms
        const userInfo = activeUsers.get(userId);
        if (userInfo) {
          userInfo.patientRooms.add(patientId);
          userInfo.lastActivity = new Date();
        }

        // Update patient rooms tracking
        if (!patientRooms.has(patientId)) {
          patientRooms.set(patientId, new Set());
        }
        patientRooms.get(patientId).add(userId);

        logger.info(`User ${userId} joined patient room ${patientId}`);
        
        // Notify others in the room
        socket.to(`patient_${patientId}`).emit('user_joined_patient', {
          userId,
          userName: socket.user.name,
          userRole: socket.user.role,
          patientId
        });

        socket.emit('patient_joined', { patientId });

      } catch (error) {
        logger.error('Error joining patient room:', error);
        socket.emit('error', { message: 'Failed to join patient room' });
      }
    });

    // Leave patient room
    socket.on('leave_patient', (data) => {
      const { patientId } = data;
      const userId = socket.userId;

      if (userId) {
        socket.leave(`patient_${patientId}`);
        
        const userInfo = activeUsers.get(userId);
        if (userInfo) {
          userInfo.patientRooms.delete(patientId);
        }

        const roomUsers = patientRooms.get(patientId);
        if (roomUsers) {
          roomUsers.delete(userId);
          if (roomUsers.size === 0) {
            patientRooms.delete(patientId);
          }
        }

        socket.to(`patient_${patientId}`).emit('user_left_patient', {
          userId,
          userName: socket.user?.name,
          patientId
        });
      }
    });

    // Enhanced messaging with delivery tracking
    socket.on('send_message', async (data) => {
      try {
        const { patientId, content, type = 'text' } = data;
        const userId = socket.userId;

        if (!userId) {
          socket.emit('error', { message: 'Not authenticated' });
          return;
        }

        // Create message in database
        const message = await Message.create({
          patientId,
          senderId: userId,
          senderName: socket.user.name,
          senderRole: socket.user.role,
          content,
          type
        });

        // Create timeline event
        await TimelineEvent.create({
          patientId,
          type: 'note_added',
          description: `Message sent by ${socket.user.name} (${socket.user.role})`,
          userId,
          userName: socket.user.name,
          userRole: socket.user.role,
          metadata: {
            messageId: message._id,
            content: content.substring(0, 100) + (content.length > 100 ? '...' : '')
          }
        });

        // Populate sender info
        await message.populate('senderId', 'name role avatar');

        // Send to all users in patient room
        io.to(`patient_${patientId}`).emit('new_message', {
          patientId,
          message: {
            id: message._id,
            patientId: message.patientId,
            senderId: message.senderId._id,
            senderName: message.senderName,
            senderRole: message.senderRole,
            content: message.content,
            timestamp: message.timestamp,
            type: message.type
          }
        });

        // Send delivery confirmation to sender
        socket.emit('message_delivered', { 
          messageId: message._id,
          timestamp: message.timestamp 
        });

        // Send notifications to offline users
        const patient = await Patient.findById(patientId);
        if (patient) {
          const recipients = [
            patient.assignedDoctor.toString(),
            patient.assignedNurse?.toString()
          ].filter(Boolean);

          recipients.forEach(async (recipientId) => {
            if (recipientId !== userId && !activeUsers.has(recipientId)) {
              // Create notification for offline users
              await Notification.create({
                recipientId,
                senderId: userId,
                type: 'patient_message',
                title: 'New Patient Message',
                message: `${socket.user.name}: ${content.substring(0, 50)}${content.length > 50 ? '...' : ''}`,
                patientId,
                metadata: { messageId: message._id }
              });
            }
          });
        }

      } catch (error) {
        logger.error('Error sending message:', error);
        socket.emit('message_error', { error: 'Failed to send message' });
      }
    });

    // Real-time patient updates
    socket.on('patient_update', async (data) => {
      try {
        const { patientId, updateType, updateData, description } = data;
        const userId = socket.userId;

        if (!userId) {
          socket.emit('error', { message: 'Not authenticated' });
          return;
        }

        // Create timeline event
        const timelineEvent = await TimelineEvent.create({
          patientId,
          type: updateType,
          description: description || `${updateType.replace('_', ' ')} updated by ${socket.user.name}`,
          userId,
          userName: socket.user.name,
          userRole: socket.user.role,
          metadata: updateData
        });

        // Send real-time update to all users in patient room
        io.to(`patient_${patientId}`).emit('patient_updated', {
          patientId,
          updateType,
          updateData,
          timelineEvent: {
            id: timelineEvent._id,
            type: timelineEvent.type,
            description: timelineEvent.description,
            timestamp: timelineEvent.timestamp,
            userName: timelineEvent.userName,
            userRole: timelineEvent.userRole,
            metadata: timelineEvent.metadata
          },
          updatedBy: { 
            userId, 
            userName: socket.user.name, 
            userRole: socket.user.role 
          }
        });

      } catch (error) {
        logger.error('Error handling patient update:', error);
        socket.emit('error', { message: 'Failed to update patient' });
      }
    });

    // Enhanced notifications
    socket.on('send_notification', async (data) => {
      try {
        const { recipientId, type, title, message, patientId, metadata = {}, urgent = false } = data;
        const userId = socket.userId;

        if (!userId) {
          socket.emit('error', { message: 'Not authenticated' });
          return;
        }

        // Create notification in database
        const notification = await Notification.create({
          recipientId,
          senderId: userId,
          type,
          title,
          message,
          patientId,
          metadata: { ...metadata, urgent }
        });

        // Populate related data
        await notification.populate('senderId', 'name role avatar');
        if (patientId) {
          await notification.populate('patientId', 'name medicalRecordNumber');
        }

        // Send to recipient
        io.to(recipientId).emit('new_notification', { 
          notification: {
            id: notification._id,
            type: notification.type,
            title: notification.title,
            message: notification.message,
            patientId: notification.patientId,
            isRead: notification.isRead,
            createdAt: notification.createdAt,
            urgent: metadata.urgent || false
          }
        });

        // If urgent, also send system alert
        if (urgent) {
          io.to(recipientId).emit('urgent_alert', {
            title,
            message,
            notificationId: notification._id
          });
        }

      } catch (error) {
        logger.error('Error sending notification:', error);
        socket.emit('error', { message: 'Failed to send notification' });
      }
    });

    // Typing indicators
    socket.on('typing_start', (data) => {
      const { patientId } = data;
      const userId = socket.userId;
      
      if (userId) {
        socket.to(`patient_${patientId}`).emit('user_typing', { 
          userId, 
          userName: socket.user.name,
          patientId 
        });
      }
    });

    socket.on('typing_stop', (data) => {
      const { patientId } = data;
      const userId = socket.userId;
      
      if (userId) {
        socket.to(`patient_${patientId}`).emit('user_stopped_typing', { 
          userId,
          patientId 
        });
      }
    });

    // Activity tracking
    socket.on('activity', () => {
      const userId = socket.userId;
      if (userId) {
        const userInfo = activeUsers.get(userId);
        if (userInfo) {
          userInfo.lastActivity = new Date();
        }
      }
    });

    // Surgery Simulation Events
    socket.on('surgery:join-session', async (data) => {
      try {
        const { sessionId, userId, userName, role } = data;
        
        socket.join(`surgery:${sessionId}`);
        
        // Add user to session participants
        socket.to(`surgery:${sessionId}`).emit('surgery:participant-joined', {
          id: userId,
          name: userName,
          role: role,
          status: 'active',
          joinedAt: new Date()
        });

        // Send current participants list to new user
        const participants = await getUsersInSurgerySession(sessionId);
        socket.emit('surgery:participants-update', participants);

        logger.info(`User ${userId} joined surgery session ${sessionId}`);
      } catch (error) {
        logger.error('Error joining surgery session:', error);
        socket.emit('surgery:error', { message: 'Failed to join surgery session' });
      }
    });

    socket.on('surgery:leave-session', async (data) => {
      try {
        const { sessionId, userId } = data;
        
        socket.leave(`surgery:${sessionId}`);
        socket.to(`surgery:${sessionId}`).emit('surgery:participant-left', { id: userId });

        logger.info(`User ${userId} left surgery session ${sessionId}`);
      } catch (error) {
        logger.error('Error leaving surgery session:', error);
      }
    });

    socket.on('surgery:simulation-control', async (data) => {
      try {
        const { sessionId, action, status } = data;
        
        // Broadcast simulation state change to all participants
        io.to(`surgery:${sessionId}`).emit('surgery:simulation-state-changed', {
          action,
          status,
          timestamp: new Date()
        });

        logger.info(`Simulation ${action} in session ${sessionId}`);
      } catch (error) {
        logger.error('Error handling simulation control:', error);
      }
    });

    socket.on('surgery:tool-interaction', async (data) => {
      try {
        const { sessionId, userId, toolType, position, force, timestamp } = data;
        
        // Broadcast tool interaction to other participants
        socket.to(`surgery:${sessionId}`).emit('surgery:tool-update', {
          userId,
          toolType,
          position,
          force,
          timestamp
        });

        logger.info(`Tool interaction by ${userId} in session ${sessionId}: ${toolType}`);
      } catch (error) {
        logger.error('Error handling tool interaction:', error);
      }
    });

    socket.on('surgery:tissue-interaction', async (data) => {
      try {
        const { sessionId, userId, position, toolType, force, deformation } = data;
        
        // Broadcast tissue interaction to other participants
        socket.to(`surgery:${sessionId}`).emit('surgery:tissue-update', {
          userId,
          position,
          toolType,
          force,
          deformation,
          timestamp: new Date()
        });

        logger.info(`Tissue interaction by ${userId} in session ${sessionId}`);
      } catch (error) {
        logger.error('Error handling tissue interaction:', error);
      }
    });

    socket.on('surgery:chat-message', async (data) => {
      try {
        const { sessionId, userId, userName, message, messageType = 'chat' } = data;
        
        const chatMessage = {
          id: `msg_${Date.now()}`,
          userId,
          userName,
          message,
          type: messageType,
          timestamp: new Date()
        };

        // Broadcast chat message to all participants
        io.to(`surgery:${sessionId}`).emit('surgery:chat-update', chatMessage);

        logger.info(`Chat message in session ${sessionId} by ${userName}: ${message}`);
      } catch (error) {
        logger.error('Error handling surgery chat:', error);
      }
    });

    // Ping/Pong for connection health
    socket.on('ping', () => {
      socket.emit('pong', { timestamp: Date.now() });
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      const userId = socket.userId;
      
      if (userId) {
        // Clean up patient rooms
        const userInfo = activeUsers.get(userId);
        if (userInfo) {
          userInfo.patientRooms.forEach(patientId => {
            socket.to(`patient_${patientId}`).emit('user_left_patient', {
              userId,
              userName: socket.user?.name,
              patientId
            });
            
            const roomUsers = patientRooms.get(patientId);
            if (roomUsers) {
              roomUsers.delete(userId);
              if (roomUsers.size === 0) {
                patientRooms.delete(patientId);
              }
            }
          });
        }

        // Remove from active users
        activeUsers.delete(userId);
        
        // Notify others that user is offline
        socket.broadcast.emit('user_offline', { 
          userId,
          userName: socket.user?.name 
        });
        
        logger.info(`User disconnected: ${socket.user?.name || userId} - ${socket.id}`);
      } else {
        logger.info(`Unknown user disconnected: ${socket.id}`);
      }
    });
  });

  // Periodic cleanup of inactive connections
  setInterval(() => {
    const now = new Date();
    const inactiveThreshold = 30 * 60 * 1000; // 30 minutes

    for (const [userId, userInfo] of activeUsers.entries()) {
      if (now - userInfo.lastActivity > inactiveThreshold) {
        const socket = io.sockets.sockets.get(userInfo.socketId);
        if (socket) {
          socket.disconnect(true);
        }
        activeUsers.delete(userId);
        logger.info(`Disconnected inactive user: ${userId}`);
      }
    }
  }, 5 * 60 * 1000); // Check every 5 minutes
};

// Helper functions
const getActiveUsers = () => {
  return Array.from(activeUsers.entries()).map(([userId, info]) => ({
    userId,
    socketId: info.socketId,
    joinedAt: info.joinedAt,
    lastActivity: info.lastActivity,
    patientRoomsCount: info.patientRooms.size
  }));
};

const getUsersInPatientRoom = (patientId) => {
  return patientRooms.get(patientId) || new Set();
};

const getUsersInSurgerySession = async (sessionId) => {
  // This would typically query a database for active session participants
  // For now, return empty array - implement based on your session storage
  return [];
};

module.exports = { 
  initializeSocket, 
  getActiveUsers, 
  getUsersInPatientRoom,
  getUsersInSurgerySession
};