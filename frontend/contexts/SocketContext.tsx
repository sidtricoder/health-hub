'use client';

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { socketService } from '@/lib/socket';
import { Message, TimelineEvent, Notification, Patient } from '@/types';
import { useAuth } from './AuthContext';

interface ActiveUser {
  userId: string;
  userName: string;
  userRole: string;
}

interface SocketContextType {
  socket: any; // Add socket instance
  isConnected: boolean;
  isAuthenticated: boolean;
  messages: Message[];
  timelineEvents: TimelineEvent[];
  notifications: Notification[];
  activeUsers: ActiveUser[];
  typingUsers: { [patientId: string]: ActiveUser[] };
  sendMessage: (message: { patientId: string; content: string; type?: string }) => Promise<void>;
  joinPatient: (patientId: string) => Promise<void>;
  leavePatient: (patientId: string) => void;
  sendNotification: (notification: {
    recipientId: string;
    type: string;
    title: string;
    message: string;
    patientId?: string;
    urgent?: boolean;
  }) => void;
  updatePatient: (update: {
    patientId: string;
    updateType: string;
    updateData: any;
    description?: string;
  }) => void;
  startTyping: (patientId: string) => void;
  stopTyping: (patientId: string) => void;
  sendPing: () => number;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export function SocketProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [activeUsers, setActiveUsers] = useState<ActiveUser[]>([]);
  const [typingUsers, setTypingUsers] = useState<{ [patientId: string]: ActiveUser[] }>({});
  const [joinedPatients, setJoinedPatients] = useState<Set<string>>(new Set());

  // Initialize socket connection
  useEffect(() => {
    if (user?.id) {
      socketService.connect();

      // Set up event listeners
      const handleConnect = () => {
        setIsConnected(true);
        // Authenticate after connection
        socketService.authenticate(user.id, localStorage.getItem('token') || '');
      };

      const handleDisconnect = () => {
        setIsConnected(false);
        setIsAuthenticated(false);
      };

      const handleAuthenticated = (data: { user: any; activeUsersCount: number }) => {
        setIsAuthenticated(true);
        console.log('Socket authenticated:', data.user.name);
      };

      const handleAuthError = (data: { message: string }) => {
        console.error('Socket auth error:', data.message);
        setIsAuthenticated(false);
      };

      const handleNewMessage = (data: { patientId: string; message: Message }) => {
        setMessages(prev => {
          // Check if message already exists
          if (prev.some(m => m.id === data.message.id)) {
            return prev;
          }
          return [...prev, data.message].sort(
            (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
          );
        });
      };

      const handleMessageDelivered = (data: { messageId: string; timestamp: string }) => {
        console.log('Message delivered:', data.messageId);
      };

      const handleMessageError = (data: { error: string }) => {
        console.error('Message error:', data.error);
      };

      const handlePatientUpdated = (data: {
        patientId: string;
        updateType: string;
        updateData: any;
        timelineEvent: TimelineEvent;
        updatedBy: any;
      }) => {
        // Add timeline event for real-time updates
        setTimelineEvents(prev => {
          // Check if timeline event already exists
          if (prev.some(event => event.id === data.timelineEvent.id)) {
            return prev;
          }
          return [data.timelineEvent, ...prev];
        });
        
        // Trigger custom event for components to listen to patient updates
        window.dispatchEvent(new CustomEvent('patientUpdated', { 
          detail: data 
        }));
        
        console.log('Patient updated:', data);
      };

      const handleNewNotification = (data: { notification: Notification }) => {
        setNotifications(prev => {
          // Check if notification already exists
          if (prev.some(n => n.id === data.notification.id)) {
            return prev;
          }
          return [data.notification, ...prev];
        });
      };

      const handleUrgentAlert = (data: { title: string; message: string; notificationId: string }) => {
        // Handle urgent notifications (could show toast, sound alert, etc.)
        console.log('URGENT ALERT:', data);
        // TODO: Implement toast notification or sound alert
      };

      const handleUserOnline = (data: { userId: string; userName: string; userRole: string }) => {
        setActiveUsers(prev => {
          if (prev.some(u => u.userId === data.userId)) {
            return prev;
          }
          return [...prev, data];
        });
      };

      const handleUserOffline = (data: { userId: string; userName: string }) => {
        setActiveUsers(prev => prev.filter(u => u.userId !== data.userId));
      };

      const handleUserTyping = (data: { userId: string; userName: string; patientId: string }) => {
        setTypingUsers(prev => ({
          ...prev,
          [data.patientId]: [
            ...(prev[data.patientId] || []).filter(u => u.userId !== data.userId),
            { userId: data.userId, userName: data.userName, userRole: '' }
          ]
        }));
      };

      const handleUserStoppedTyping = (data: { userId: string; patientId: string }) => {
        setTypingUsers(prev => ({
          ...prev,
          [data.patientId]: (prev[data.patientId] || []).filter(u => u.userId !== data.userId)
        }));
      };

      const handlePong = (data: { timestamp: number }) => {
        console.log('Pong received, latency:', Date.now() - data.timestamp, 'ms');
      };

      const handleError = (data: { message: string }) => {
        console.error('Socket error:', data.message);
      };

      // Register all listeners
      socketService.onConnect(handleConnect);
      socketService.onDisconnect(handleDisconnect);
      socketService.on('authenticated', handleAuthenticated);
      socketService.on('auth_error', handleAuthError);
      socketService.onNewMessage(handleNewMessage);
      socketService.on('message_delivered', handleMessageDelivered);
      socketService.on('message_error', handleMessageError);
      socketService.on('patient_updated', handlePatientUpdated);
      socketService.onNewNotification(handleNewNotification);
      socketService.on('urgent_alert', handleUrgentAlert);
      socketService.on('user_online', handleUserOnline);
      socketService.on('user_offline', handleUserOffline);
      socketService.on('user_typing', handleUserTyping);
      socketService.on('user_stopped_typing', handleUserStoppedTyping);
      socketService.on('pong', handlePong);
      socketService.on('error', handleError);

      return () => {
        socketService.disconnect();
      };
    }
  }, [user?.id]);

  const sendMessage = useCallback(async (message: { patientId: string; content: string; type?: string }) => {
    if (!isAuthenticated) {
      throw new Error('Not authenticated');
    }
    
    return new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Message timeout'));
      }, 10000);

      const handleDelivered = () => {
        clearTimeout(timeout);
        socketService.off('message_delivered', handleDelivered);
        socketService.off('message_error', handleError);
        resolve();
      };

      const handleError = (data: { error: string }) => {
        clearTimeout(timeout);
        socketService.off('message_delivered', handleDelivered);
        socketService.off('message_error', handleError);
        reject(new Error(data.error));
      };

      socketService.on('message_delivered', handleDelivered);
      socketService.on('message_error', handleError);

      socketService.sendMessage(message);
    });
  }, [isAuthenticated]);

  const joinPatient = useCallback(async (patientId: string) => {
    if (!isAuthenticated || !user) {
      console.warn('Cannot join patient - not authenticated or no user');
      return Promise.resolve(); // Silently resolve instead of throwing error
    }

    return new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Join timeout'));
      }, 5000);

      const handleJoined = (data: { patientId: string }) => {
        if (data.patientId === patientId) {
          clearTimeout(timeout);
          socketService.off('patient_joined', handleJoined);
          socketService.off('error', handleError);
          setJoinedPatients(prev => new Set([...prev, patientId]));
          resolve();
        }
      };

      const handleError = (data: { message: string }) => {
        clearTimeout(timeout);
        socketService.off('patient_joined', handleJoined);
        socketService.off('error', handleError);
        reject(new Error(data.message));
      };

      socketService.on('patient_joined', handleJoined);
      socketService.on('error', handleError);

      socketService.joinPatient(patientId);
    });
  }, [isAuthenticated, user]);

  const leavePatient = useCallback((patientId: string) => {
    socketService.leavePatient(patientId);
    setJoinedPatients(prev => {
      const newSet = new Set(prev);
      newSet.delete(patientId);
      return newSet;
    });
  }, []);

  const sendNotification = useCallback((notification: {
    recipientId: string;
    type: string;
    title: string;
    message: string;
    patientId?: string;
    urgent?: boolean;
  }) => {
    if (isAuthenticated) {
      socketService.sendNotification(notification);
    }
  }, [isAuthenticated]);

  const updatePatient = useCallback((update: {
    patientId: string;
    updateType: string;
    updateData: any;
    description?: string;
  }) => {
    if (isAuthenticated) {
      socketService.updatePatient(update);
    }
  }, [isAuthenticated]);

  const startTyping = useCallback((patientId: string) => {
    if (isAuthenticated) {
      socketService.startTyping(patientId);
    }
  }, [isAuthenticated]);

  const stopTyping = useCallback((patientId: string) => {
    if (isAuthenticated) {
      socketService.stopTyping(patientId);
    }
  }, [isAuthenticated]);

  const sendPing = useCallback(() => {
    const timestamp = Date.now();
    socketService.ping();
    return timestamp;
  }, []);

  return (
    <SocketContext.Provider 
      value={{
        socket: socketService.socket_,
        isConnected,
        isAuthenticated,
        messages,
        timelineEvents,
        notifications,
        activeUsers,
        typingUsers,
        sendMessage,
        joinPatient,
        leavePatient,
        sendNotification,
        updatePatient,
        startTyping,
        stopTyping,
        sendPing
      }}
    >
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
}