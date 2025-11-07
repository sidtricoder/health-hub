'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  Send, 
  User, 
  MessageCircle, 
  Clock, 
  CheckCheck,
  Loader2,
  AlertCircle,
  Paperclip,
  RefreshCw
} from 'lucide-react';
import { useSocket } from '@/contexts/SocketContext';
import { Message, UserRole } from '@/types';
import { apiService } from '@/lib/api';

interface ChatProps {
  patientId: string;
  currentUser: {
    id: string;
    name: string;
    role: UserRole;
  };
  patientName?: string;
}

const roleColors = {
  doctor: 'bg-blue-100 text-blue-800 border-blue-200',
  nurse: 'bg-green-100 text-green-800 border-green-200',
  lab_technician: 'bg-purple-100 text-purple-800 border-purple-200',
  receptionist: 'bg-orange-100 text-orange-800 border-orange-200',
  admin: 'bg-gray-100 text-gray-800 border-gray-200'
};

const roleIcons = {
  doctor: '👨‍⚕️',
  nurse: '👩‍⚕️',
  lab_technician: '🔬',
  receptionist: '📋',
  admin: '⚙️'
};

export function Chat({ patientId, currentUser, patientName }: ChatProps) {
  const { 
    messages: socketMessages, 
    sendMessage, 
    isConnected, 
    isAuthenticated,
    joinPatient,
    startTyping,
    stopTyping,
    typingUsers
  } = useSocket();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasLoadedInitial, setHasLoadedInitial] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeout = useRef<NodeJS.Timeout | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Join patient room when component mounts and user is authenticated
  useEffect(() => {
    if (patientId && isAuthenticated && isConnected) {
      console.log('🔷 Joining patient room:', patientId);
      joinPatient(patientId);
    }
  }, [patientId, isAuthenticated, isConnected, joinPatient]);

  // Load initial messages when authenticated and connected
  useEffect(() => {
    if (patientId && isAuthenticated && isConnected && !hasLoadedInitial) {
      loadInitialMessages();
    }
  }, [patientId, isAuthenticated, isConnected, hasLoadedInitial]);

  // Listen for socket messages - this is the primary source of real-time messages
  useEffect(() => {
    if (!patientId) return;

    // Filter messages for this patient from socket
    const patientMessages = socketMessages.filter(m => m.patientId === patientId);
    
    console.log('📨 Socket messages for patient:', patientId, patientMessages.length);
    
    // Update messages state with socket messages
    setMessages(patientMessages);
  }, [socketMessages, patientId]);

  const loadInitialMessages = async () => {
    if (!patientId || hasLoadedInitial) return;
    
    try {
      console.log('📤 Loading initial messages for patient:', patientId);
      setLoading(true);
      setError(null);
      
      const response = await apiService.getMessages(patientId);
      
      if (response.success && Array.isArray(response.data)) {
        console.log('✅ Loaded initial messages:', response.data.length);
        // Only set initial messages if socket hasn't provided them yet
        if (socketMessages.filter(m => m.patientId === patientId).length === 0) {
          setMessages(response.data);
        }
        setHasLoadedInitial(true);
        
        // Mark messages as read
        try {
          await apiService.markMessagesAsRead(patientId);
        } catch (readError) {
          console.error('Failed to mark messages as read:', readError);
        }
      } else {
        console.log('✅ No initial messages found');
        setMessages([]);
        setHasLoadedInitial(true);
      }
    } catch (error) {
      console.error('❌ Error loading messages:', error);
      setError('Failed to load messages. Please try again.');
      setHasLoadedInitial(false);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || sending || !isConnected || !isAuthenticated) {
      console.log('❌ Cannot send message - conditions not met:', {
        hasContent: !!newMessage.trim(),
        sending,
        isConnected,
        isAuthenticated
      });
      return;
    }

    const messageContent = newMessage.trim();
    setNewMessage('');
    setSending(true);
    setError(null);

    console.log('📨 Sending message:', messageContent);

    try {
      // Send via socket - it handles both API call and real-time broadcast
      await sendMessage({
        patientId,
        content: messageContent,
        type: 'text'
      });
      
      console.log('✅ Message sent successfully');
    } catch (error) {
      console.error('❌ Error sending message:', error);
      setError('Failed to send message. Please try again.');
      setNewMessage(messageContent); // Restore message
    } finally {
      setSending(false);
    }
  };

  const handleInputChange = (value: string) => {
    setNewMessage(value);
    
    if (value.trim() && isConnected && isAuthenticated) {
      startTyping(patientId);
      
      // Clear existing timeout
      if (typingTimeout.current) {
        clearTimeout(typingTimeout.current);
      }
      
      // Stop typing after 1 second of no input
      typingTimeout.current = setTimeout(() => {
        stopTyping(patientId);
      }, 1000);
    } else if (isConnected && isAuthenticated) {
      stopTyping(patientId);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
      if (typingTimeout.current) {
        clearTimeout(typingTimeout.current);
      }
      if (isConnected && isAuthenticated) {
        stopTyping(patientId);
      }
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } else if (diffInHours < 168) { // 7 days
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        hour: '2-digit',
        minute: '2-digit'
      });
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  const getConnectionStatus = () => {
    if (!isAuthenticated) return { status: 'Authenticating...', color: 'text-orange-600', icon: 'bg-orange-500' };
    if (!isConnected) return { status: 'Connecting...', color: 'text-red-600', icon: 'bg-red-500' };
    return { status: 'Connected', color: 'text-green-600', icon: 'bg-green-500 animate-pulse' };
  };

  const connectionStatus = getConnectionStatus();
  const patientTypingUsers = typingUsers[patientId] || [];
  const otherTypingUsers = patientTypingUsers.filter(u => u.userId !== currentUser.id);

  return (
    <Card className="h-[600px] flex flex-col shadow-lg hover:shadow-xl transition-all duration-300">
      <CardHeader className="bg-linear-to-r from-blue-50 to-purple-50 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Avatar className="h-12 w-12 ring-2 ring-blue-100">
                <AvatarFallback className="bg-blue-100 text-blue-700 font-semibold">
                  <MessageCircle className="h-6 w-6" />
                </AvatarFallback>
              </Avatar>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Patient Communication
              </h3>
              <p className="text-sm text-gray-600">
                {patientName ? `Discussing ${patientName}` : 'Team collaboration'}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2 text-sm">
              <div className={`w-2 h-2 rounded-full ${connectionStatus.icon}`} />
              <span className={connectionStatus.color}>
                {connectionStatus.status}
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setHasLoadedInitial(false);
                loadInitialMessages();
              }}
              disabled={loading}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0">
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
          {loading && messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-2" />
                <p className="text-gray-600">Loading messages...</p>
              </div>
            </div>
          ) : error && messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
                <p className="text-red-600 mb-2">{error}</p>
                <Button 
                  onClick={() => {
                    setHasLoadedInitial(false);
                    loadInitialMessages();
                  }} 
                  variant="outline" 
                  size="sm"
                >
                  Retry
                </Button>
              </div>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No messages yet</h3>
                <p className="text-gray-600">Start the conversation about this patient's care.</p>
              </div>
            </div>
          ) : (
            <>
              {messages.map((message, index) => {
                const isOwn = message.senderId === currentUser.id;
                const showDate = index === 0 || 
                  new Date(messages[index - 1].timestamp).getDate() !== 
                  new Date(message.timestamp).getDate();

                return (
                  <div key={message.id || `${message.timestamp}-${index}`}>
                    {showDate && (
                      <div className="flex justify-center mb-4">
                        <span className="text-xs text-gray-500 bg-white px-3 py-1 rounded-full shadow-sm">
                          {new Date(message.timestamp).toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </span>
                      </div>
                    )}
                    
                    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-3`}>
                      <div className={`max-w-[70%] ${isOwn ? 'order-2' : 'order-1'}`}>
                        {!isOwn && (
                          <div className="flex items-center mb-1">
                            <Avatar className="h-6 w-6 mr-2">
                              <AvatarFallback className="text-xs">
                                {message.senderName?.split(' ').map(n => n[0]).join('') || 'U'}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-xs font-medium text-gray-700">
                              {message.senderName}
                            </span>
                            <Badge
                              variant="secondary"
                              className={`ml-2 text-xs ${roleColors[message.senderRole as keyof typeof roleColors] || 'bg-gray-100 text-gray-800'}`}
                            >
                              {roleIcons[message.senderRole as keyof typeof roleIcons]} 
                              {message.senderRole?.replace('_', ' ') || 'User'}
                            </Badge>
                          </div>
                        )}
                        
                        <div className={`rounded-lg px-4 py-2 shadow-sm ${
                          isOwn 
                            ? 'bg-blue-600 text-white ml-4' 
                            : 'bg-white text-gray-900 mr-4 border border-gray-200'
                        }`}>
                          <p className="text-sm whitespace-pre-wrap break-words">
                            {message.content}
                          </p>
                          <div className={`flex items-center justify-between mt-1 ${
                            isOwn ? 'text-blue-100' : 'text-gray-500'
                          }`}>
                            <span className="text-xs">
                              {formatTimestamp(message.timestamp)}
                            </span>
                            {isOwn && (
                              <CheckCheck className="h-3 w-3 ml-2" />
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              
              {/* Typing Indicator */}
              {otherTypingUsers.length > 0 && (
                <div className="flex justify-start mb-3">
                  <div className="bg-gray-200 rounded-lg px-4 py-2 max-w-[70%]">
                    <div className="flex items-center space-x-2">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                      <span className="text-xs text-gray-600">
                        {otherTypingUsers.length === 1 
                          ? `${otherTypingUsers[0].userName} is typing...`
                          : `${otherTypingUsers.length} people are typing...`
                        }
                      </span>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Message Input */}
        <div className="border-t border-gray-200 p-4 bg-white">
          {error && (
            <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
          
          <div className="flex space-x-2">
            <div className="flex-1">
              <Textarea
                placeholder={
                  !isConnected ? "Connecting to chat..." :
                  !isAuthenticated ? "Authenticating..." :
                  "Type your message about this patient's care..."
                }
                value={newMessage}
                onChange={(e) => handleInputChange(e.target.value)}
                onKeyDown={handleKeyPress}
                disabled={!isConnected || !isAuthenticated || sending}
                rows={2}
                className="resize-none border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div className="flex flex-col space-y-2">
              <Button
                onClick={handleSendMessage}
                disabled={!newMessage.trim() || sending || !isConnected || !isAuthenticated}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6"
                size="sm"
              >
                {sending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Sending
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Send
                  </>
                )}
              </Button>
            </div>
          </div>
          
          <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
            <span>Press Enter to send, Shift+Enter for new line</span>
            <span>
              {messages.length} {messages.length === 1 ? 'message' : 'messages'}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}