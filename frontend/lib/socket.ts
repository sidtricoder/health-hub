import { io, Socket } from 'socket.io-client';
import { Message, TimelineEvent, Notification, Patient } from '@/types';

class SocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  connect() {
    if (this.socket?.connected) return;

    const url = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';
    
    this.socket = io(url, {
      transports: ['websocket', 'polling'],
      timeout: 20000,
      forceNew: true
    });

    this.socket.on('connect', () => {
      console.log('✅ Connected to server');
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ Disconnected:', reason);
      if (reason === 'io server disconnect') {
        // Server disconnected, try to reconnect
        this.reconnect();
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('🔴 Connection error:', error);
      this.reconnect();
    });
  }

  private reconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      setTimeout(() => {
        console.log(`🔄 Reconnection attempt ${this.reconnectAttempts}`);
        this.socket?.connect();
      }, 1000 * this.reconnectAttempts);
    }
  }

  disconnect() {
    this.socket?.disconnect();
    this.socket = null;
  }

  // Enhanced authentication
  authenticate(userId: string, token: string) {
    this.socket?.emit('authenticate', { userId, token });
  }

  // Patient room management
  joinPatient(patientId: string) {
    this.socket?.emit('join_patient', { patientId });
  }

  leavePatient(patientId: string) {
    this.socket?.emit('leave_patient', { patientId });
  }

  // Messages
  sendMessage(data: { patientId: string; content: string; type?: string }) {
    this.socket?.emit('send_message', data);
  }

  // Patient updates
  updatePatient(data: { patientId: string; updateType: string; updateData: any; description?: string }) {
    this.socket?.emit('patient_update', data);
  }

  // Notifications
  sendNotification(data: { 
    recipientId: string; 
    type: string; 
    title: string; 
    message: string; 
    patientId?: string; 
    urgent?: boolean; 
  }) {
    this.socket?.emit('send_notification', data);
  }

  // Typing indicators
  startTyping(patientId: string) {
    this.socket?.emit('typing_start', { patientId });
  }

  stopTyping(patientId: string) {
    this.socket?.emit('typing_stop', { patientId });
  }

  // Ping for connection health
  ping() {
    this.socket?.emit('ping');
  }

  // Activity tracking
  sendActivity() {
    this.socket?.emit('activity');
  }

  // Generic event listeners
  on(event: string, callback: (...args: any[]) => void) {
    this.socket?.on(event, callback);
  }

  off(event: string, callback?: (...args: any[]) => void) {
    if (callback) {
      this.socket?.off(event, callback);
    } else {
      this.socket?.off(event);
    }
  }

  emit(event: string, data?: any) {
    this.socket?.emit(event, data);
  }

  // Specific event handlers for backward compatibility
  onConnect(callback: () => void) {
    this.socket?.on('connect', callback);
  }

  onDisconnect(callback: () => void) {
    this.socket?.on('disconnect', callback);
  }

  onNewMessage(callback: (data: { patientId: string; message: Message }) => void) {
    this.socket?.on('new_message', callback);
  }

  onNewNotification(callback: (data: { notification: Notification }) => void) {
    this.socket?.on('new_notification', callback);
  }

  onPatientUpdate(callback: (data: { patientId: string; updateType: string; updateData: any; updatedBy: any }) => void) {
    this.socket?.on('patient_updated', callback);
  }

  onUserTyping(callback: (data: { userId: string; userName: string }) => void) {
    this.socket?.on('user_typing', callback);
  }

  onUserStoppedTyping(callback: (data: { userId: string }) => void) {
    this.socket?.on('user_stopped_typing', callback);
  }

  onUserOnline(callback: (data: { userId: string }) => void) {
    this.socket?.on('user_online', callback);
  }

  onUserOffline(callback: (data: { userId: string }) => void) {
    this.socket?.on('user_offline', callback);
  }

  // Check connection status
  get isConnected() {
    return this.socket?.connected || false;
  }

  get socket_() {
    return this.socket;
  }
}

export const socketService = new SocketService();