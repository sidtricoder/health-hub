'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';

interface Participant {
  id: string;
  name: string;
  role: 'surgeon' | 'assistant' | 'observer';
  status: 'active' | 'idle' | 'disconnected';
  joinedAt: Date;
}

interface CollaborationManagerProps {
  sessionId: string;
  participants: Participant[];
  userId: string;
  socket: any;
}

interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  message: string;
  timestamp: Date;
  type: 'chat' | 'system' | 'action';
}

export function CollaborationManager({
  sessionId,
  participants,
  userId,
  socket
}: CollaborationManagerProps) {
  const [showCollabPanel, setShowCollabPanel] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [voiceEnabled, setVoiceEnabled] = useState(false);

  useEffect(() => {
    if (!socket) return;

    // Listen for chat messages
    socket.on('surgery:chat-message', (messageData: any) => {
      setChatMessages(prev => [...prev, {
        id: messageData.id || Date.now().toString(),
        userId: messageData.userId,
        userName: messageData.userName,
        message: messageData.message,
        timestamp: new Date(messageData.timestamp),
        type: messageData.type || 'chat'
      }]);
    });

    // Listen for system messages
    socket.on('surgery:system-message', (messageData: any) => {
      setChatMessages(prev => [...prev, {
        id: Date.now().toString(),
        userId: 'system',
        userName: 'System',
        message: messageData.message,
        timestamp: new Date(),
        type: 'system'
      }]);
    });

    return () => {
      socket.off('surgery:chat-message');
      socket.off('surgery:system-message');
    };
  }, [socket]);

  const sendChatMessage = () => {
    if (!newMessage.trim() || !socket) return;

    const messageData = {
      sessionId,
      userId,
      userName: getCurrentUserName(),
      message: newMessage.trim(),
      timestamp: new Date()
    };

    socket.emit('surgery:send-chat', messageData);
    setNewMessage('');
  };

  const getCurrentUserName = () => {
    const currentUser = participants.find(p => p.id === userId);
    return currentUser?.name || `User ${userId.slice(0, 8)}`;
  };

  const assignRole = (participantId: string, newRole: 'surgeon' | 'assistant' | 'observer') => {
    if (!socket) return;

    socket.emit('surgery:assign-role', {
      sessionId,
      participantId,
      newRole,
      assignedBy: userId
    });
  };

  const kickParticipant = (participantId: string) => {
    if (!socket || participantId === userId) return;

    socket.emit('surgery:kick-participant', {
      sessionId,
      participantId,
      kickedBy: userId
    });
  };

  const toggleVoiceChat = () => {
    setVoiceEnabled(!voiceEnabled);
    // In a real implementation, this would handle WebRTC voice chat
    if (socket) {
      socket.emit('surgery:toggle-voice', {
        sessionId,
        userId,
        enabled: !voiceEnabled
      });
    }
  };

  return (
    <>
      {/* Collaboration Toggle Button */}
      <Button
        onClick={() => setShowCollabPanel(!showCollabPanel)}
        className="absolute top-20 left-1/2 transform -translate-x-1/2 z-20"
        variant="outline"
        size="sm"
      >
        {showCollabPanel ? 'Hide' : 'Show'} Collaboration
      </Button>

      {/* Collaboration Panel */}
      {showCollabPanel && (
        <div className="absolute top-32 left-1/2 transform -translate-x-1/2 w-96 max-h-96 z-20">
          <Card className="bg-black bg-opacity-90 backdrop-blur-sm border-gray-700">
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-semibold">Collaboration</h3>
                <Button
                  onClick={toggleVoiceChat}
                  variant={voiceEnabled ? 'default' : 'outline'}
                  size="sm"
                >
                  🎤 {voiceEnabled ? 'On' : 'Off'}
                </Button>
              </div>

              {/* Participants Section */}
              <div className="mb-4">
                <h4 className="text-white text-sm font-medium mb-2">
                  Participants ({participants.length})
                </h4>
                <div className="max-h-32 overflow-y-auto space-y-2">
                  {participants.map((participant) => (
                    <div
                      key={participant.id}
                      className="flex items-center justify-between bg-gray-800 rounded p-2"
                    >
                      <div className="flex items-center space-x-2">
                        <div
                          className={`w-2 h-2 rounded-full ${
                            participant.status === 'active' ? 'bg-green-400' : 'bg-gray-400'
                          }`}
                        />
                        <span className="text-white text-sm">
                          {participant.name}
                        </span>
                        {participant.id === userId && (
                          <Badge variant="outline" className="text-xs">
                            You
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-1">
                        <Badge
                          variant="outline"
                          className={`text-xs ${getRoleBadgeColor(participant.role)}`}
                        >
                          {participant.role}
                        </Badge>
                        
                        {participant.id !== userId && (
                          <div className="flex space-x-1">
                            <select
                              value={participant.role}
                              onChange={(e) => 
                                assignRole(
                                  participant.id,
                                  e.target.value as 'surgeon' | 'assistant' | 'observer'
                                )
                              }
                              className="bg-gray-700 text-white text-xs rounded px-1"
                            >
                              <option value="surgeon">Surgeon</option>
                              <option value="assistant">Assistant</option>
                              <option value="observer">Observer</option>
                            </select>
                            <Button
                              onClick={() => kickParticipant(participant.id)}
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 text-red-400 hover:text-red-300"
                            >
                              ×
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Chat Section */}
              <div className="border-t border-gray-700 pt-4">
                <h4 className="text-white text-sm font-medium mb-2">Chat</h4>
                
                {/* Chat Messages */}
                <div className="bg-gray-800 rounded p-2 h-32 overflow-y-auto mb-2 text-xs">
                  {chatMessages.length === 0 ? (
                    <div className="text-gray-400">No messages yet...</div>
                  ) : (
                    chatMessages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`mb-1 ${
                          msg.type === 'system'
                            ? 'text-yellow-400 italic'
                            : msg.userId === userId
                            ? 'text-blue-300'
                            : 'text-white'
                        }`}
                      >
                        <span className="font-medium">{msg.userName}:</span>
                        <span className="ml-1">{msg.message}</span>
                      </div>
                    ))
                  )}
                </div>

                {/* Chat Input */}
                <div className="flex space-x-2">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendChatMessage()}
                    placeholder="Type a message..."
                    className="flex-1 bg-gray-700 border-gray-600 text-white text-sm"
                  />
                  <Button
                    onClick={sendChatMessage}
                    size="sm"
                    disabled={!newMessage.trim()}
                  >
                    Send
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}
    </>
  );
}

function getRoleBadgeColor(role: string): string {
  switch (role) {
    case 'surgeon':
      return 'border-red-400 text-red-400';
    case 'assistant':
      return 'border-blue-400 text-blue-400';
    case 'observer':
      return 'border-gray-400 text-gray-400';
    default:
      return 'border-gray-400 text-gray-400';
  }
}