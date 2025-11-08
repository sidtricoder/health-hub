'use client';

import React, { useState, useEffect } from 'react';
import { useKindeAuth } from '@kinde-oss/kinde-auth-react';
import { useSearchParams } from 'next/navigation';
import { SurgerySimulation } from '../../components/surgery/SurgerySimulation';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Share2, Copy, Check, Users, Clock, Activity } from 'lucide-react';

interface SurgerySession {
  _id: string;
  sessionId: string;
  uniqueLink: string;
  shareableCode: string;
  title: string;
  description: string;
  creatorId: string; // Changed to string since we're using Kinde IDs
  creatorName?: string; // Optional creator name if available
  scenario: string;
  participantCount: number;
  maxParticipants: number;
  status: 'idle' | 'active' | 'paused' | 'completed';
  inviteOnly: boolean;
  createdAt: string;
  shareableLink?: string;
  shareableCodeLink?: string;
}

export default function SurgerySimulationPage() {
  const { user, isAuthenticated, isLoading } = useKindeAuth();
  const searchParams = useSearchParams();
  const linkParam = searchParams?.get('link');
  const codeParam = searchParams?.get('code');
  
  const [currentSession, setCurrentSession] = useState<SurgerySession | null>(null);
  const [availableSessions, setAvailableSessions] = useState<SurgerySession[]>([]);
  const [sessionName, setSessionName] = useState('');
  const [sessionDescription, setSessionDescription] = useState('');
  const [selectedScenario, setSelectedScenario] = useState('basic-procedure');
  const [maxParticipants, setMaxParticipants] = useState(6);
  const [inviteOnly, setInviteOnly] = useState(false);
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [isJoiningSession, setIsJoiningSession] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [joinCode, setJoinCode] = useState('');

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
      fetchAvailableSessions();
      
      // Check if joining via link or code
      if (linkParam || codeParam) {
        handleJoinViaLink(linkParam || codeParam);
      }
    }
  }, [isAuthenticated, linkParam, codeParam]);

  const fetchAvailableSessions = async () => {
    try {
      const response = await fetch('/api/simulations/sessions/active');
      
      if (response.ok) {
        const result = await response.json();
        console.log('Fetched sessions response:', result);
        console.log('Sessions array:', result.data.simulations);
        setAvailableSessions(result.data.simulations || []);
      }
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
    }
  };

  const handleJoinViaLink = async (identifier: string | null) => {
    if (!identifier || isJoiningSession) return;
    
    setIsJoiningSession(true);
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        alert('Please log in to join a simulation session.');
        return;
      }

      const response = await fetch(`/api/simulations/sessions/join/${identifier}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        setCurrentSession(result.data);
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to join session');
      }
    } catch (error) {
      console.error('Failed to join session:', error);
      alert('Failed to join session. Please try again.');
    } finally {
      setIsJoiningSession(false);
    }
  };

  const createSession = async () => {
    if (!sessionName.trim() || !user) return;

    setIsCreatingSession(true);
    try {
      // Get token from localStorage
      const token = localStorage.getItem('token');
      
      if (!token) {
        alert('Please log in to create a simulation session.');
        return;
      }

      const response = await fetch('/api/simulations/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: sessionName,
          description: sessionDescription,
          scenario: selectedScenario,
          maxParticipants: maxParticipants,
          inviteOnly: inviteOnly
        })
      });

      if (response.ok) {
        const result = await response.json();
        setCurrentSession(result.data);
        setShowShareDialog(true);
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to create session');
      }
    } catch (error) {
      console.error('Failed to create session:', error);
      alert('Failed to create session. Please try again.');
    } finally {
      setIsCreatingSession(false);
    }
  };

  const joinSessionByCode = async () => {
    if (!joinCode.trim()) return;
    await handleJoinViaLink(joinCode.trim());
  };

  const joinSession = async (session: SurgerySession) => {
    setIsJoiningSession(true);
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        alert('Please log in to join a simulation session.');
        return;
      }

      console.log('Joining session with uniqueLink:', session.uniqueLink);
      console.log('Full session object:', session);

      const response = await fetch(`/api/simulations/sessions/join/${session.uniqueLink}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        setCurrentSession(result.data);
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to join session');
      }
    } catch (error) {
      console.error('Failed to join session:', error);
      alert('Failed to join session. Please try again.');
    } finally {
      setIsJoiningSession(false);
    }
  };

  const copyToClipboard = async (text: string, type: 'link' | 'code') => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === 'link') {
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2000);
      } else {
        setCopiedCode(true);
        setTimeout(() => setCopiedCode(false), 2000);
      }
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const leaveSession = () => {
    setCurrentSession(null);
    setShowShareDialog(false);
    fetchAvailableSessions();
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
      <div>
        <SurgerySimulation
          sessionId={currentSession.sessionId}
          userId={user?.id || 'anonymous'}
          isHost={currentSession.creatorId === user?.id}
        />
        
        {/* Share Dialog Overlay */}
        {showShareDialog && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="p-6 max-w-md w-full mx-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <Share2 className="w-5 h-5" />
                  Share Session
                </h2>
                <button
                  onClick={() => setShowShareDialog(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Session Code</label>
                  <div className="flex items-center gap-2">
                    <Input
                      value={currentSession.shareableCode}
                      readOnly
                      className="font-mono text-lg"
                    />
                    <Button
                      onClick={() => copyToClipboard(currentSession.shareableCode, 'code')}
                      variant="outline"
                      size="sm"
                    >
                      {copiedCode ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Share this code with others to join
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Direct Link</label>
                  <div className="flex items-center gap-2">
                    <Input
                      value={currentSession.shareableLink || ''}
                      readOnly
                      className="text-sm"
                    />
                    <Button
                      onClick={() => copyToClipboard(currentSession.shareableLink || '', 'link')}
                      variant="outline"
                      size="sm"
                    >
                      {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Anyone with this link can join the session
                  </p>
                </div>
                
                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Session Info:</strong><br />
                    • Title: {currentSession.title}<br />
                    • Max Participants: {currentSession.maxParticipants}<br />
                    • Scenario: {scenarios.find(s => s.id === currentSession.scenario)?.name}
                  </p>
                </div>
              </div>
              
              <div className="flex gap-2 mt-6">
                <Button
                  onClick={() => setShowShareDialog(false)}
                  variant="outline"
                  className="flex-1"
                >
                  Close
                </Button>
                <Button
                  onClick={() => {
                    setShowShareDialog(false);
                    leaveSession();
                  }}
                  variant="destructive"
                  className="flex-1"
                >
                  Leave Session
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
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
                <label className="block text-sm font-medium mb-2">Description (Optional)</label>
                <Input
                  value={sessionDescription}
                  onChange={(e) => setSessionDescription(e.target.value)}
                  placeholder="Enter session description..."
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
              
              <div>
                <label className="block text-sm font-medium mb-2">Max Participants</label>
                <Input
                  type="number"
                  min={1}
                  max={20}
                  value={maxParticipants}
                  onChange={(e) => setMaxParticipants(parseInt(e.target.value) || 6)}
                />
              </div>
              
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="inviteOnly"
                  checked={inviteOnly}
                  onChange={(e) => setInviteOnly(e.target.checked)}
                  className="w-4 h-4"
                />
                <label htmlFor="inviteOnly" className="text-sm font-medium">
                  Invite Only (Hidden from public list)
                </label>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-medium text-blue-900 mb-2">Features:</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Real-time collaborative surgery simulation</li>
                  <li>• Physics-based soft tissue interaction</li>
                  <li>• Multiple surgical tools and instruments</li>
                  <li>• Voice and text chat capabilities</li>
                  <li>• Role-based permissions (Surgeon, Assistant, Observer)</li>
                  <li>• Unique shareable link for inviting participants</li>
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

          {/* Join Session */}
          <div className="space-y-6">
            {/* Join by Code */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Join by Code</h2>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-2">Session Code</label>
                  <Input
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    placeholder="Enter 8-character code..."
                    maxLength={8}
                    className="font-mono text-lg"
                  />
                </div>
                <Button
                  onClick={joinSessionByCode}
                  disabled={joinCode.length !== 8 || isJoiningSession}
                  className="w-full"
                >
                  {isJoiningSession ? 'Joining...' : 'Join Session'}
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
                      key={session._id}
                      className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-medium">{session.title}</h3>
                        <Badge
                          variant={session.status === 'active' ? 'default' : 'secondary'}
                        >
                          {session.status}
                        </Badge>
                      </div>
                      
                      <div className="text-sm text-gray-600 space-y-1">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          <span>Host: {session.creatorName || 'Host'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Activity className="w-4 h-4" />
                          <span>
                            Participants: {session.participantCount}/{session.maxParticipants}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          <span>
                            Scenario: {scenarios.find(s => s.id === session.scenario)?.name}
                          </span>
                        </div>
                      </div>
                      
                      <Button
                        onClick={() => joinSession(session)}
                        size="sm"
                        className="mt-3 w-full"
                        disabled={session.participantCount >= session.maxParticipants || isJoiningSession}
                      >
                        {session.participantCount >= session.maxParticipants ? 'Full' : 'Join Session'}
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