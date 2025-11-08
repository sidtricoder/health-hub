'use client';

import React, { useState, useEffect } from 'react';
import { useKindeAuth } from '@kinde-oss/kinde-auth-react';
import { SurgerySimulation } from '../../components/surgery/SurgerySimulation';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';

interface SurgerySession {
  id: string;
  name: string;
  hostId: string;
  hostName: string;
  participants: number;
  maxParticipants: number;
  status: 'waiting' | 'active' | 'completed';
  createdAt: Date;
  scenario: string;
}

export default function SurgerySimulationPage() {
  const { user, isAuthenticated, isLoading } = useKindeAuth();
  const [currentSession, setCurrentSession] = useState<string | null>(null);
  const [availableSessions, setAvailableSessions] = useState<SurgerySession[]>([]);
  const [sessionName, setSessionName] = useState('');
  const [selectedScenario, setSelectedScenario] = useState('basic-procedure');
  const [isCreatingSession, setIsCreatingSession] = useState(false);

  const scenarios = [
    { id: 'basic-procedure', name: 'Basic Surgical Procedure', difficulty: 'Beginner' },
    { id: 'appendectomy', name: 'Appendectomy', difficulty: 'Intermediate' },
    { id: 'cardiac-surgery', name: 'Cardiac Surgery', difficulty: 'Advanced' },
    { id: 'neurosurgery', name: 'Brain Surgery', difficulty: 'Expert' },
    { id: 'trauma-surgery', name: 'Emergency Trauma', difficulty: 'Advanced' },
    { id: 'laparoscopic', name: 'Laparoscopic Surgery', difficulty: 'Intermediate' }
  ];

  useEffect(() => {
    if (isAuthenticated) {
      // Fetch available surgery sessions
      fetchAvailableSessions();
    }
  }, [isAuthenticated]);

  const fetchAvailableSessions = async () => {
    try {
      // Mock data for now - replace with actual API call
      const mockSessions: SurgerySession[] = [
        {
          id: '1',
          name: 'Morning Practice Session',
          hostId: 'host1',
          hostName: 'Dr. Smith',
          participants: 2,
          maxParticipants: 4,
          status: 'waiting',
          createdAt: new Date(),
          scenario: 'basic-procedure'
        },
        {
          id: '2',
          name: 'Cardiac Surgery Training',
          hostId: 'host2',
          hostName: 'Dr. Johnson',
          participants: 3,
          maxParticipants: 6,
          status: 'active',
          createdAt: new Date(),
          scenario: 'cardiac-surgery'
        }
      ];
      
      setAvailableSessions(mockSessions);
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
    }
  };

  const createSession = async () => {
    if (!sessionName.trim() || !user) return;

    setIsCreatingSession(true);
    try {
      // Create new surgery session - replace with actual API call
      const newSessionId = `session_${Date.now()}`;
      setCurrentSession(newSessionId);
    } catch (error) {
      console.error('Failed to create session:', error);
    } finally {
      setIsCreatingSession(false);
    }
  };

  const joinSession = (sessionId: string) => {
    setCurrentSession(sessionId);
  };

  const leaveSession = () => {
    setCurrentSession(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="p-8 text-center">
          <h1 className="text-2xl font-bold mb-4">Surgery Simulation</h1>
          <p className="mb-4">Please log in to access the surgery simulation platform.</p>
          <Button onClick={() => window.location.href = '/login'}>
            Log In
          </Button>
        </Card>
      </div>
    );
  }

  if (currentSession) {
    return (
      <SurgerySimulation
        sessionId={currentSession}
        userId={user?.id || 'anonymous'}
        isHost={true} // Determine this based on session data
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Surgery Simulation Platform
          </h1>
          <p className="text-gray-600">
            Collaborative virtual surgery training with real-time physics simulation
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Create Session */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Create New Session</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Session Name</label>
                <Input
                  value={sessionName}
                  onChange={(e) => setSessionName(e.target.value)}
                  placeholder="Enter session name..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Surgery Scenario</label>
                <select
                  value={selectedScenario}
                  onChange={(e) => setSelectedScenario(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  {scenarios.map(scenario => (
                    <option key={scenario.id} value={scenario.id}>
                      {scenario.name} ({scenario.difficulty})
                    </option>
                  ))}
                </select>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-medium text-blue-900 mb-2">Features:</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Real-time collaborative surgery simulation</li>
                  <li>• Physics-based soft tissue interaction</li>
                  <li>• Multiple surgical tools and instruments</li>
                  <li>• Voice and text chat capabilities</li>
                  <li>• Role-based permissions (Surgeon, Assistant, Observer)</li>
                </ul>
              </div>

              <Button
                onClick={createSession}
                disabled={!sessionName.trim() || isCreatingSession}
                className="w-full"
              >
                {isCreatingSession ? 'Creating...' : 'Create Session'}
              </Button>
            </div>
          </Card>

          {/* Available Sessions */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Available Sessions</h2>
            
            <div className="space-y-3">
              {availableSessions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No active sessions available
                </div>
              ) : (
                availableSessions.map(session => (
                  <div
                    key={session.id}
                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium">{session.name}</h3>
                      <Badge
                        variant={session.status === 'active' ? 'default' : 'secondary'}
                      >
                        {session.status}
                      </Badge>
                    </div>
                    
                    <div className="text-sm text-gray-600 space-y-1">
                      <div>Host: {session.hostName}</div>
                      <div>
                        Participants: {session.participants}/{session.maxParticipants}
                      </div>
                      <div>
                        Scenario: {scenarios.find(s => s.id === session.scenario)?.name}
                      </div>
                    </div>
                    
                    <Button
                      onClick={() => joinSession(session.id)}
                      size="sm"
                      className="mt-3 w-full"
                      disabled={session.participants >= session.maxParticipants}
                    >
                      {session.participants >= session.maxParticipants ? 'Full' : 'Join Session'}
                    </Button>
                  </div>
                ))
              )}
            </div>

            <Button
              onClick={fetchAvailableSessions}
              variant="outline"
              className="w-full mt-4"
            >
              Refresh Sessions
            </Button>
          </Card>
        </div>

        {/* Requirements and System Info */}
        <Card className="mt-8 p-6">
          <h2 className="text-xl font-semibold mb-4">System Requirements & Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium mb-2">Recommended Specifications:</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Modern web browser with WebGL support</li>
                <li>• Stable internet connection (min 5 Mbps)</li>
                <li>• 4GB RAM minimum, 8GB recommended</li>
                <li>• Dedicated graphics card recommended</li>
                <li>• Microphone for voice communication</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-medium mb-2">Supported Browsers:</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Chrome 80+ (Recommended)</li>
                <li>• Firefox 75+</li>
                <li>• Safari 14+</li>
                <li>• Edge 80+</li>
              </ul>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
            <h3 className="font-medium text-yellow-800 mb-2">⚠️ Important Notice</h3>
            <p className="text-sm text-yellow-700">
              This is a training simulation platform for educational purposes only. 
              It should not be used as a substitute for actual medical training or procedures.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}