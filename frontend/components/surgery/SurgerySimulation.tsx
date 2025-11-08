'use client';

import React, { useRef, useEffect, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Stats, Environment } from '@react-three/drei';
import { Physics } from '@react-three/cannon';
import { Vector3, Euler, Quaternion } from 'three';
import { SurgicalScene } from './SurgicalScene';
import { SurgeryUI } from './components/SurgeryUI';
import { CollaborationManager } from './CollaborationManager';
import { EnhancedToolCursor, useToolCursor } from './components/EnhancedToolCursor';
import { EnhancedCameraControls } from './components/EnhancedCameraControls';
import { EnhancedOperatingRoom } from './components/EnhancedOperatingRoom';
import { CollaborativeCursors, useCursorBroadcast } from './components/CollaborativeCursors';
import { RealtimeToolSync, useToolPositionBroadcast } from './components/RealtimeToolSync';
import { VoiceChatPanel } from './components/VoiceChatPanel';
import { useSocket } from '../../contexts/SocketContext';
import { useAuth } from '../../contexts/AuthContext';
import { useVoiceChat } from '../../hooks/useVoiceChat';

interface SurgerySimulationProps {
  sessionId: string;
  userId: string;
  userRole?: 'doctor' | 'assistant' | 'observer';
  isHost?: boolean;
}

interface SimulationState {
  status: 'idle' | 'active' | 'paused' | 'completed';
  duration: number;
  score?: number;
  errors: number;
  participants: Array<{
    id: string;
    name: string;
    role: 'surgeon' | 'assistant' | 'observer';
    status: 'active' | 'idle' | 'disconnected';
    joinedAt: Date;
  }>;
  tools: Array<{
    id: string;
    type: string;
    userId: string | null;
    position: Vector3;
    rotation: Vector3;
  }>;
  tissueState: {
    deformation: number[];
    cuts: Array<{
      id: string;
      points: Vector3[];
      depth: number;
    }>;
  };
}

export function SurgerySimulation({ sessionId, userId, userRole = 'doctor', isHost = false }: SurgerySimulationProps) {
  const { socket } = useSocket();
  const { user } = useAuth();
  const [simulationState, setSimulationState] = useState<SimulationState>({
    status: 'idle',
    duration: 0,
    score: 0,
    errors: 0,
    participants: [],
    tools: [],
    tissueState: {
      deformation: [],
      cuts: []
    }
  });

  const [selectedTool, setSelectedTool] = useState<string | null>('scalpel');
  const [cursorPosition, setCursorPosition] = useState(new Vector3(0, 1, 0));
  const [toolRotation, setToolRotation] = useState(new Euler(0, 0, 0));
  const [toolQuaternion, setToolQuaternion] = useState(new Quaternion());
  const [showStats, setShowStats] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [cursorEnabled, setCursorEnabled] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  
  const userName = user?.name || `User ${userId.slice(0, 8)}`;

  // Socket event handlers for real-time collaboration
  useEffect(() => {
    if (!socket) return;

    // Join the surgery simulation session
    socket.emit('surgery:join-session', { sessionId, userId });

    // Listen for state updates
    socket.on('surgery:state-update', (state: Partial<SimulationState>) => {
      setSimulationState(prev => ({ ...prev, ...state }));
    });

    // Listen for participant updates
    socket.on('surgery:participants-update', (participants: Array<{
      id: string;
      name: string;
      role: 'surgeon' | 'assistant' | 'observer';
      isActive: boolean;
      joinedAt: Date;
    }>) => {
      const mappedParticipants = participants.map(p => ({
        ...p,
        status: p.isActive ? 'active' as const : 'idle' as const
      }));
      setSimulationState(prev => ({ ...prev, participants: mappedParticipants }));
    });

    // Listen for tool interactions
    socket.on('surgery:tool-update', (toolData: {
      id: string;
      type: string;
      userId: string | null;
      position: Vector3;
      rotation: Vector3;
    }) => {
      setSimulationState(prev => ({
        ...prev,
        tools: prev.tools.map(tool => 
          tool.id === toolData.id ? { ...tool, ...toolData } : tool
        )
      }));
    });

    // Listen for tissue deformation
    socket.on('surgery:tissue-update', (tissueData: {
      deformation?: number[];
      cuts?: Array<{
        id: string;
        points: Vector3[];
        depth: number;
      }>;
    }) => {
      setSimulationState(prev => ({
        ...prev,
        tissueState: { ...prev.tissueState, ...tissueData }
      }));
    });

    setIsLoading(false);

    return () => {
      socket.off('surgery:state-update');
      socket.off('surgery:participant-update');
      socket.off('surgery:tool-update');
      socket.off('surgery:tissue-update');
      socket.emit('surgery:leave-session', { sessionId, userId });
    };
  }, [socket, sessionId, userId]);

  // Keyboard controls for tool selection and cursor toggle
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      switch (event.key) {
        case 'Escape':
          // Toggle tool cursor visibility
          setCursorEnabled(prev => !prev);
          setIsDragging(false);
          break;
        case '1':
        case '2':
        case '3':
        case '4':
        case '5':
        case '6':
          const tools = ['scalpel', 'forceps', 'suture', 'cautery', 'syringe', 'clamp'];
          const toolIndex = parseInt(event.key) - 1;
          if (toolIndex < tools.length) {
            setSelectedTool(tools[toolIndex]);
            setCursorEnabled(true);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  // Mouse interaction handlers for hold and drag
  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      if (simulationState.status === 'active' && selectedTool && cursorEnabled) {
        setIsDragging(true);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [simulationState.status, selectedTool, cursorEnabled]);

  // Broadcast cursor position for collaboration
  useCursorBroadcast(
    socket,
    sessionId,
    userId,
    userName,
    selectedTool,
    cursorPosition,
    isDragging
  );

  // Broadcast tool position to other doctors in real-time
  useToolPositionBroadcast(
    socket,
    sessionId,
    userId,
    userName,
    selectedTool,
    cursorPosition,
    toolRotation,
    toolQuaternion,
    isDragging || simulationState.status === 'active'
  );

  // Voice Chat for doctor communication
  const voiceChat = useVoiceChat({
    socket,
    sessionId,
    userId,
    userName,
    enabled: true
  });

  const handleToolSelect = (toolType: string) => {
    setSelectedTool(toolType);
    setCursorEnabled(true);
    if (socket) {
      socket.emit('surgery:tool-select', {
        sessionId,
        userId,
        userName,
        toolType
      });
    }
  };

  const handleToolInteraction = (toolId: string, position: Vector3, rotation: Vector3) => {
    if (socket) {
      socket.emit('surgery:tool-interact', {
        sessionId,
        userId,
        toolId,
        position: position.toArray(),
        rotation: rotation.toArray()
      });
    }
  };

  const handleTissueInteraction = (point: Vector3, force: number, toolType: string) => {
    setCursorPosition(point);
    
    if (socket) {
      socket.emit('surgery:tissue-interact', {
        sessionId,
        userId,
        userName,
        point: point.toArray(),
        force,
        toolType
      });
      
      // Also broadcast as cursor update for real-time visual feedback
      socket.emit('surgery:cursor-update', {
        sessionId,
        userId,
        userName,
        selectedTool: toolType,
        position: point.toArray(),
        isActive: true
      });
    }
  };

  const handleRemoteInteraction = (remoteUserId: string, position: Vector3, force: number, toolType: string) => {
    // Handle remote user interactions (e.g., show effects on tissue)
    console.log('Remote interaction:', { remoteUserId, position, force, toolType });
  };

  const handleSimulationControl = (action: 'start' | 'pause' | 'stop' | 'reset') => {
    let newStatus: 'idle' | 'active' | 'paused' | 'completed';
    
    switch (action) {
      case 'start':
        newStatus = 'active';
        if (!startTime) {
          setStartTime(new Date());
        }
        break;
      case 'pause':
        newStatus = 'paused';
        break;
      case 'stop':
        newStatus = 'completed';
        break;
      case 'reset':
        newStatus = 'idle';
        setStartTime(null);
        break;
      default:
        return;
    }
    
    setSimulationState(prev => ({ 
      ...prev, 
      status: newStatus,
      duration: action === 'reset' ? 0 : prev.duration,
      errors: action === 'reset' ? 0 : prev.errors,
      score: action === 'reset' ? 0 : prev.score
    }));
    
    if (socket && isHost) {
      socket.emit('surgery:simulation-control', {
        sessionId,
        action,
        status: newStatus
      });
    }
  };

  // Timer for simulation duration
  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    
    if (simulationState.status === 'active' && startTime) {
      intervalId = setInterval(() => {
        const now = new Date();
        const durationSeconds = Math.floor((now.getTime() - startTime.getTime()) / 1000);
        setSimulationState(prev => ({ 
          ...prev, 
          duration: durationSeconds 
        }));
      }, 1000);
    }
    
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [simulationState.status, startTime]);

  const handleSaveSimulation = async () => {
    try {
      // Save simulation data to backend
      const simulationData = {
        sessionId,
        userId,
        duration: simulationState.duration,
        score: simulationState.score || 0,
        errors: simulationState.errors,
        participants: simulationState.participants.length,
        tools_used: simulationState.tools.map(t => t.type),
        timestamp: new Date().toISOString()
      };

      const response = await fetch('/api/simulations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(simulationData),
      });

      if (!response.ok) {
        throw new Error('Failed to save simulation');
      }

      console.log('Simulation saved successfully');
    } catch (error) {
      console.error('Error saving simulation:', error);
    }
  };

  const resetSimulation = () => {
    if (socket && isHost) {
      socket.emit('surgery:reset-simulation', { sessionId });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="text-white text-xl">Loading Surgery Simulation...</div>
      </div>
    );
  }

  return (
    <div className="relative h-screen w-full bg-gray-900 overflow-hidden">
      {/* Custom Cursor Styling */}
      <style jsx global>{`
        canvas {
          cursor: ${cursorEnabled && selectedTool ? 'none' : 'default'} !important;
        }
      `}</style>

      {/* 3D Canvas */}
      <Canvas
        shadows
        camera={{
          position: [0, 3, 8],
          fov: 60,
          near: 0.1,
          far: 1000
        }}
        gl={{
          antialias: true,
          powerPreference: "high-performance",
          alpha: false
        }}
      >
        <Physics
          gravity={[0, -9.81, 0]}
          tolerance={0.001}
          iterations={20}
          broadphase="SAP"
        >
          {/* Enhanced Operating Room Environment */}
          <EnhancedOperatingRoom />

          {/* Surgical Scene with tissue models */}
          <SurgicalScene
            simulationState={simulationState}
            selectedTool={selectedTool || 'scalpel'}
            onToolInteraction={handleToolInteraction}
            onTissueInteraction={handleTissueInteraction}
            userId={userId}
            sessionId={sessionId}
          />

          {/* Current User's Tool Cursor */}
          {cursorEnabled && selectedTool && simulationState.status === 'active' && (
            <EnhancedToolCursor
              selectedTool={selectedTool}
              visible={true}
              userName={userName}
              userId={userId}
              onInteraction={handleTissueInteraction}
              isActive={isDragging}
            />
          )}

          {/* Other Participants' Cursors */}
          <CollaborativeCursors
            participants={simulationState.participants}
            currentUserId={userId}
            socket={socket}
            sessionId={sessionId}
            onRemoteInteraction={handleRemoteInteraction}
          />

          {/* Real-time Tool Sync - Show other doctors' tools in 3D */}
          <RealtimeToolSync
            socket={socket}
            sessionId={sessionId}
            currentUserId={userId}
            participants={simulationState.participants}
          />
        </Physics>

        {/* Enhanced Camera Controls with touch support */}
        <EnhancedCameraControls
          enabled={!isDragging}
          minDistance={2}
          maxDistance={20}
          target={new Vector3(0, 1, 0)}
        />

        {/* Performance Statistics */}
        {showStats && <Stats />}
      </Canvas>

      {/* UI Overlay */}
      <SurgeryUI
        selectedTool={selectedTool || 'scalpel'}
        onToolSelect={handleToolSelect}
        participants={simulationState.participants}
        simulationState={{
          status: simulationState.status,
          duration: simulationState.duration,
          score: simulationState.score,
          errors: simulationState.errors
        }}
        onSimulationControl={handleSimulationControl}
        userRole={'surgeon'}
      />

      {/* Collaboration Panel */}
      <CollaborationManager
        sessionId={sessionId}
        participants={simulationState.participants}
        userId={userId}
        socket={socket}
      />

      {/* Voice Chat Panel */}
      <VoiceChatPanel
        isMicEnabled={voiceChat.isMicEnabled}
        isMuted={voiceChat.isMuted}
        isConnecting={voiceChat.isConnecting}
        peers={voiceChat.peers}
        audioLevels={voiceChat.audioLevels}
        onStartMicrophone={voiceChat.startMicrophone}
        onStopMicrophone={voiceChat.stopMicrophone}
        onToggleMute={voiceChat.toggleMute}
      />

      {/* Cursor Status Indicator */}
      <div className="absolute top-20 right-4 pointer-events-none z-50">
        <div className={`px-4 py-2 rounded-lg shadow-lg transition-all ${
          cursorEnabled 
            ? 'bg-green-500/90 text-white' 
            : 'bg-gray-500/90 text-white'
        }`}>
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${
              cursorEnabled ? 'bg-white animate-pulse' : 'bg-gray-300'
            }`} />
            <span className="text-sm font-medium">
              {cursorEnabled ? `Tool: ${selectedTool?.toUpperCase()}` : 'Press ESC to enable cursor'}
            </span>
          </div>
        </div>
      </div>

      {/* Instructions Panel */}
      <div className="absolute bottom-20 left-4 pointer-events-none z-40">
        <div className="bg-black/75 backdrop-blur-sm text-white px-4 py-3 rounded-lg shadow-xl max-w-xs">
          <h3 className="text-sm font-semibold mb-2">Controls</h3>
          <div className="text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-gray-300">ESC:</span>
              <span>Toggle tool cursor</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">1-6:</span>
              <span>Select tool</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">Hold + Drag:</span>
              <span>Apply tool effect</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">Two Fingers:</span>
              <span>Pan/Zoom view</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">Right Click:</span>
              <span>Pan camera</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">Scroll:</span>
              <span>Zoom in/out</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}