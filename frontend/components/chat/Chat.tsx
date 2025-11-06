'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Send, User } from 'lucide-react';
import { useSocket } from '@/contexts/SocketContext';
import { Message, UserRole } from '@/types';

interface ChatProps {
  patientId: string;
  currentUser: {
    id: string;
    name: string;
    role: UserRole;
  };
}

// Mock messages
const mockMessages: Message[] = [
  {
    id: '1',
    patientId: '1',
    senderId: 'doc1',
    senderName: 'Dr. Smith',
    senderRole: 'doctor',
    content: 'Patient admitted with chest pain. Ordered ECG and blood work.',
    timestamp: '2024-01-15T09:00:00Z',
    type: 'text'
  },
  {
    id: '2',
    patientId: '1',
    senderId: 'nurse1',
    senderName: 'Nurse Johnson',
    senderRole: 'nurse',
    content: 'Vital signs stable. BP 120/80, HR 72. Administered aspirin as ordered.',
    timestamp: '2024-01-15T09:30:00Z',
    type: 'text'
  },
  {
    id: '3',
    patientId: '1',
    senderId: 'lab1',
    senderName: 'Lab Tech Wilson',
    senderRole: 'lab_technician',
    content: 'Cardiac enzymes elevated. Troponin I: 0.15 ng/mL. ECG shows ST elevation.',
    timestamp: '2024-01-15T10:15:00Z',
    type: 'text'
  },
  {
    id: '4',
    patientId: '1',
    senderId: 'doc1',
    senderName: 'Dr. Smith',
    senderRole: 'doctor',
    content: 'Diagnosis: Acute MI. Started heparin drip and scheduled cath lab.',
    timestamp: '2024-01-15T10:30:00Z',
    type: 'text'
  }
];

const roleColors = {
  doctor: 'bg-blue-100 text-blue-800',
  nurse: 'bg-green-100 text-green-800',
  lab_technician: 'bg-purple-100 text-purple-800',
  receptionist: 'bg-orange-100 text-orange-800',
  admin: 'bg-gray-100 text-gray-800'
};

export function Chat({ patientId, currentUser }: ChatProps) {
  const { messages: socketMessages, sendMessage } = useSocket();
  const [localMessages, setLocalMessages] = useState<Message[]>(mockMessages);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Combine local and socket messages
  const allMessages = [...localMessages, ...socketMessages.filter(m => m.patientId === patientId)];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [allMessages]);

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;

    const message: Message = {
      id: Date.now().toString(),
      patientId,
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderRole: currentUser.role,
      content: newMessage,
      timestamp: new Date().toISOString(),
      type: 'text'
    };

    sendMessage({
      patientId,
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderRole: currentUser.role,
      content: newMessage,
      type: 'text'
    });
    setNewMessage('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <Card className="h-[600px] flex flex-col">
      <CardContent className="flex-1 flex flex-col p-0">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {allMessages.map((message) => (
            <div key={message.id} className="flex items-start space-x-3">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="text-xs">
                  {message.senderName.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <span className="text-sm font-medium">{message.senderName}</span>
                  <Badge
                    variant="secondary"
                    className={`text-xs ${roleColors[message.senderRole]}`}
                  >
                    {message.senderRole.replace('_', ' ')}
                  </Badge>
                  <span className="text-xs text-gray-500">
                    {new Date(message.timestamp).toLocaleString()}
                  </span>
                </div>
                <p className="text-sm text-gray-900">{message.content}</p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <div className="border-t p-4">
          <div className="flex space-x-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              className="flex-1"
            />
            <Button onClick={handleSendMessage} size="sm">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}