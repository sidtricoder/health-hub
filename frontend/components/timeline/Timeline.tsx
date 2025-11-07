'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Activity, FileText, Pill, User, Clock, RefreshCw, Loader2, AlertCircle } from 'lucide-react';
import { TimelineEvent, UserRole } from '@/types';
import { useSocket } from '@/contexts/SocketContext';

interface TimelineProps {
  patientId: string;
}

const eventIcons = {
  patient_admitted: User,
  patient_discharged: User,
  vital_added: Activity,
  medication_changed: Pill,
  medication_added: Pill,
  report_uploaded: FileText,
  report_added: FileText,
  note_added: Clock,
  patient_updated: User
};

const roleColors = {
  doctor: 'bg-blue-100 text-blue-800',
  nurse: 'bg-green-100 text-green-800',
  lab_technician: 'bg-purple-100 text-purple-800',
  receptionist: 'bg-orange-100 text-orange-800',
  admin: 'bg-gray-100 text-gray-800'
};

export function Timeline({ patientId }: TimelineProps) {
  const { timelineEvents: socketEvents, isConnected } = useSocket();
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load initial timeline events
  useEffect(() => {
    loadTimelineEvents();
  }, [patientId]);

  // Listen for real-time timeline updates from socket
  useEffect(() => {
    const patientEvents = socketEvents.filter(event => event.patientId === patientId);
    if (patientEvents.length > 0) {
      setTimelineEvents(prev => {
        // Merge socket events with existing events, avoiding duplicates
        const newEvents = patientEvents.filter(
          socketEvent => !prev.some(existing => existing.id === socketEvent.id)
        );
        return [...newEvents, ...prev].sort(
          (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
      });
    }
  }, [socketEvents, patientId]);

  // Listen for custom patient update events
  useEffect(() => {
    const handlePatientUpdate = (event: CustomEvent) => {
      const data = event.detail;
      if (data.patientId === patientId && data.timelineEvent) {
        setTimelineEvents(prev => {
          // Check if event already exists
          if (prev.some(existing => existing.id === data.timelineEvent.id)) {
            return prev;
          }
          return [data.timelineEvent, ...prev];
        });
      }
    };

    window.addEventListener('patientUpdated', handlePatientUpdate as EventListener);
    return () => {
      window.removeEventListener('patientUpdated', handlePatientUpdate as EventListener);
    };
  }, [patientId]);

  const loadTimelineEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      // Since we don't have a timeline API endpoint yet, use empty array initially
      // In real implementation, this would be: await apiService.getTimelineEvents(patientId);
      
      // For now, just set empty array and rely on socket events
      setTimelineEvents([]);
    } catch (error) {
      console.error('Error loading timeline events:', error);
      setError('Failed to load timeline events');
    } finally {
      setLoading(false);
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

  return (
    <Card className="h-[700px] flex flex-col">
      <CardHeader className="border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="h-5 w-5" />
              <span>Patient Timeline</span>
            </CardTitle>
            <CardDescription>Real-time activity and updates</CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
            <span className={`text-xs font-medium ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
              {isConnected ? 'Live' : 'Offline'}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={loadTimelineEvents}
              disabled={loading}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-y-auto p-4">
        {loading && timelineEvents.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-2" />
              <p className="text-gray-600">Loading timeline events...</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
              <p className="text-red-600 mb-2">{error}</p>
              <Button onClick={loadTimelineEvents} variant="outline" size="sm">
                Retry
              </Button>
            </div>
          </div>
        ) : timelineEvents.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No timeline events yet</h3>
              <p className="text-gray-600">Activity and updates will appear here in real-time.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {timelineEvents.map((event, index) => {
              const IconComponent = eventIcons[event.type as keyof typeof eventIcons] || Clock;
              const showDate = index === 0 || 
                new Date(timelineEvents[index - 1].timestamp).getDate() !== 
                new Date(event.timestamp).getDate();

              return (
                <div key={event.id}>
                  {showDate && (
                    <div className="flex justify-center mb-4">
                      <span className="text-sm font-medium text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                        {new Date(event.timestamp).toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </span>
                    </div>
                  )}
                  
                  <div className="flex items-start space-x-3 relative">
                    {/* Timeline line */}
                    {index < timelineEvents.length - 1 && (
                      <div className="absolute left-5 top-12 w-0.5 h-16 bg-gray-200" />
                    )}
                    
                    {/* Event icon */}
                    <div className="shrink-0 w-10 h-10 bg-white rounded-full border-2 border-gray-200 flex items-center justify-center">
                      <IconComponent className="h-5 w-5 text-gray-600" />
                    </div>
                    
                    {/* Event content */}
                    <div className="flex-1 min-w-0">
                      <div className="bg-white border border-gray-100 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="text-xs">
                                {event.userName?.split(' ').map((n: string) => n[0]).join('') || 'U'}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <span className="text-sm font-medium text-gray-900">
                                {event.userName || 'Unknown User'}
                              </span>
                              <Badge
                                variant="secondary"
                                className={`ml-2 text-xs ${roleColors[event.userRole as keyof typeof roleColors] || 'bg-gray-100 text-gray-800'}`}
                              >
                                {event.userRole?.replace('_', ' ') || 'User'}
                              </Badge>
                            </div>
                          </div>
                          <span className="text-xs text-gray-500">
                            {formatTimestamp(event.timestamp)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700">{event.description}</p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}