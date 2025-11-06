'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { socketService } from '@/lib/socket';
import { Message, TimelineEvent, Notification, Patient } from '@/types';
import { useAuth } from './AuthContext';

interface SocketContextType {
  isConnected: boolean;
  messages: Message[];
  timelineEvents: TimelineEvent[];
  notifications: Notification[];
  patients: Patient[];
  sendMessage: (message: Omit<Message, 'id' | 'timestamp'>) => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export function SocketProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);

  useEffect(() => {
    if (user?.id) {
      socketService.connect(user.id);
      socketService.join(user.id);

      const handleConnect = () => setIsConnected(true);
      const handleDisconnect = () => setIsConnected(false);

      const handleNewMessage = (data: { patientId: string; message: Message }) => {
        setMessages(prev => [...prev, data.message]);
      };

      const handleTimelineEvent = (event: TimelineEvent) => {
        setTimelineEvents(prev => [event, ...prev]);
      };

      const handleNotification = (data: { notification: Notification }) => {
        setNotifications(prev => [data.notification, ...prev]);
      };

      const handlePatientUpdate = (data: { patientId: string; updateType: string; updateData: any; updatedBy: any }) => {
        // Handle patient updates - could refresh patient data
        console.log('Patient updated:', data);
      };

      // Set up listeners
      socketService.onConnect(handleConnect);
      socketService.onDisconnect(handleDisconnect);
      socketService.onNewMessage(handleNewMessage);
      // Note: Timeline events are handled through patient updates and messages
      socketService.onNewNotification(handleNotification);
      socketService.onPatientUpdate(handlePatientUpdate);

      return () => {
        socketService.disconnect();
      };
    }
  }, [user?.id]);

  const sendMessage = (message: Omit<Message, 'id' | 'timestamp'>) => {
    if (user) {
      socketService.sendMessage({
        patientId: message.patientId || '',
        content: message.content,
        senderId: user.id,
        senderName: user.name,
        senderRole: user.role
      });
    }
  };

  return (
    <SocketContext.Provider
      value={{
        isConnected,
        messages,
        timelineEvents,
        notifications,
        patients,
        sendMessage,
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