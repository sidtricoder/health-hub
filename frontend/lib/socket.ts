import { io, Socket } from 'socket.io-client';
import { Message, TimelineEvent, Notification, Patient } from '@/types';

class SocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  connect(userId: string) {
    if (this.socket?.connected) return;

    this.socket = io(process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:3001', {
      auth: { userId },
      transports: ['websocket', 'polling']
    });

    this.socket.on('connect', () => {
      console.log('Connected to server');
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Disconnected:', reason);
      if (reason === 'io server disconnect') {
        // Server disconnected, try to reconnect
        this.reconnect();
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
      this.reconnect();
    });
  }

  private reconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      setTimeout(() => {
        console.log(`Reconnection attempt ${this.reconnectAttempts}`);
        this.socket?.connect();
      }, 1000 * this.reconnectAttempts);
    }
  }

  disconnect() {
    this.socket?.disconnect();
    this.socket = null;
  }

  // Join user room
  join(userId: string) {
    this.socket?.emit('join', userId);
  }

  // Patient updates
  onPatientUpdate(callback: (data: { patientId: string; updateType: string; updateData: any; updatedBy: any }) => void) {
    this.socket?.on('patient_updated', callback);
  }

  offPatientUpdate() {
    this.socket?.off('patient_updated');
  }

  emitPatientUpdate(data: { patientId: string; updateType: string; updateData: any; userId: string; userName: string; userRole: string }) {
    this.socket?.emit('patient_update', data);
  }

  // Messages
  onNewMessage(callback: (data: { patientId: string; message: Message }) => void) {
    this.socket?.on('new_message', callback);
  }

  offNewMessage() {
    this.socket?.off('new_message');
  }

  onMessageSent(callback: (data: { message: Message }) => void) {
    this.socket?.on('message_sent', callback);
  }

  offMessageSent() {
    this.socket?.off('message_sent');
  }

  sendMessage(data: { patientId: string; content: string; senderId: string; senderName: string; senderRole: string }) {
    this.socket?.emit('send_message', data);
  }

  // Typing indicators
  onUserTyping(callback: (data: { userId: string; userName: string }) => void) {
    this.socket?.on('user_typing', callback);
  }

  offUserTyping() {
    this.socket?.off('user_typing');
  }

  onUserStoppedTyping(callback: (data: { userId: string }) => void) {
    this.socket?.on('user_stopped_typing', callback);
  }

  offUserStoppedTyping() {
    this.socket?.off('user_stopped_typing');
  }

  startTyping(data: { patientId: string; userId: string; userName: string }) {
    this.socket?.emit('typing_start', data);
  }

  stopTyping(data: { patientId: string; userId: string }) {
    this.socket?.emit('typing_stop', data);
  }

  // Notifications
  onNewNotification(callback: (data: { notification: Notification }) => void) {
    this.socket?.on('new_notification', callback);
  }

  offNewNotification() {
    this.socket?.off('new_notification');
  }

  emitNotification(data: { recipientId: string; type: string; title: string; message: string; patientId?: string; metadata?: any }) {
    this.socket?.emit('send_notification', data);
  }

  // User presence
  onUserOnline(callback: (data: { userId: string }) => void) {
    this.socket?.on('user_online', callback);
  }

  offUserOnline() {
    this.socket?.off('user_online');
  }

  onUserOffline(callback: (data: { userId: string }) => void) {
    this.socket?.on('user_offline', callback);
  }

  offUserOffline() {
    this.socket?.off('user_offline');
  }

  // Connection status
  onConnect(callback: () => void) {
    this.socket?.on('connect', callback);
  }

  onDisconnect(callback: () => void) {
    this.socket?.on('disconnect', callback);
  }

  // Check connection status
  get isConnected() {
    return this.socket?.connected || false;
  }
}

export const socketService = new SocketService();