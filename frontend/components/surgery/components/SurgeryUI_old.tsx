'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar } from '@/components/ui/avatar';
import { 
  Play, 
  Pause, 
  Square, 
  Mic, 
  MicOff, 
  Users, 
  Settings,
  Save,
  RotateCcw,
  Eye,
  EyeOff,
  Volume2,
  VolumeX,
  Camera,
  Maximize,
  Minimize
} from 'lucide-react';

// Tool definitions with better spacing
const SURGICAL_TOOLS = [
  { 
    id: 'scalpel', 
    name: 'Scalpel', 
    icon: '🔪', 
    description: 'Precision cutting instrument',
    color: 'bg-red-100 text-red-800 border-red-200'
  },
  { 
    id: 'forceps', 
    name: 'Forceps', 
    icon: '🗜️', 
    description: 'Grasping and holding tool',
    color: 'bg-blue-100 text-blue-800 border-blue-200'
  },
  { 
    id: 'suture', 
    name: 'Suture', 
    icon: '🪡', 
    description: 'Stitching needle',
    color: 'bg-green-100 text-green-800 border-green-200'
  },
  { 
    id: 'cautery', 
    name: 'Cautery', 
    icon: '⚡', 
    description: 'Electrocautery device',
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200'
  },
  { 
    id: 'syringe', 
    name: 'Syringe', 
    icon: '💉', 
    description: 'Injection tool',
    color: 'bg-purple-100 text-purple-800 border-purple-200'
  },
  { 
    id: 'clamp', 
    name: 'Clamp', 
    icon: '📎', 
    description: 'Hemostatic clamp',
    color: 'bg-orange-100 text-orange-800 border-orange-200'
  }
];

export interface SurgeryUIProps {
  selectedTool: string;
  onToolSelect: (toolId: string) => void;
  isRecording: boolean;
  onToggleRecording: () => void;
  participants: Array<{
    id: string;
    name: string;
    role: 'surgeon' | 'assistant' | 'observer';
    status: 'active' | 'idle' | 'disconnected';
    joinedAt: Date;
  }>;
  simulationState: {
    status: 'idle' | 'active' | 'paused' | 'completed';
    duration: number;
    score?: number;
    errors: number;
  };
  onSimulationControl: (action: 'start' | 'pause' | 'stop' | 'reset') => void;
  onSaveSimulation: () => void;
  userRole: 'surgeon' | 'assistant' | 'observer';
  audioEnabled: boolean;
  onToggleAudio: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
}

export function SurgeryUI({
  selectedTool,
  onToolSelect,
  isRecording,
  onToggleRecording,
  participants,
  simulationState,
  onSimulationControl,
  onSaveSimulation,
  userRole,
  audioEnabled,
  onToggleAudio,
  isFullscreen,
  onToggleFullscreen
}: SurgeryUIProps) {
  const [showSettings, setShowSettings] = useState(false);
  const [cameraMode, setCameraMode] = useState('free');

  const formatDuration = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'surgeon': return 'bg-red-100 text-red-700 border-red-300';
      case 'assistant': return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'observer': return 'bg-gray-100 text-gray-700 border-gray-300';
      default: return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'idle': return 'bg-yellow-500';
      case 'disconnected': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {/* Modern dark backdrop */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900/20 to-blue-900/20 backdrop-blur-sm" />
      
      {/* Top Control Bar - Modern glass design */}
      <div className="absolute top-6 left-6 right-6 pointer-events-auto">
        <div className="bg-white/90 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl shadow-black/10">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white text-sm font-bold">S</span>
                </div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                  Surgery Simulation
                </h1>
              </div>
              <div className="flex items-center gap-3">
                <Badge className={`px-3 py-1 rounded-full font-semibold ${
                  simulationState.status === 'active' ? 'bg-green-500 text-white shadow-lg shadow-green-500/30' :
                  simulationState.status === 'paused' ? 'bg-yellow-500 text-white shadow-lg shadow-yellow-500/30' :
                  simulationState.status === 'completed' ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30' :
                  'bg-gray-500 text-white shadow-lg shadow-gray-500/30'
                }`}>
                  {simulationState.status.toUpperCase()}
                </Badge>
                <div className="bg-gray-900 text-white px-3 py-1 rounded-lg font-mono text-sm">
                  {formatDuration(simulationState.duration)}
                </div>
              </div>
            </div>
          
          <CardContent>
            <div className="flex items-center justify-between gap-4">
              {/* Simulation Controls */}
              <div className="flex items-center gap-2">
                {simulationState.status === 'idle' || simulationState.status === 'paused' ? (
                  <Button
                    onClick={() => onSimulationControl('start')}
                    className="bg-green-600 hover:bg-green-700 text-white border-green-700"
                    size="sm"
                  >
                    <Play className="w-4 h-4 mr-1" />
                    Start
                  </Button>
                ) : (
                  <Button
                    onClick={() => onSimulationControl('pause')}
                    variant="outline"
                    className="border-yellow-300 text-yellow-700 hover:bg-yellow-50"
                    size="sm"
                  >
                    <Pause className="w-4 h-4 mr-1" />
                    Pause
                  </Button>
                )}
                
                <Button
                  onClick={() => onSimulationControl('stop')}
                  variant="outline"
                  className="border-red-300 text-red-700 hover:bg-red-50"
                  size="sm"
                >
                  <Square className="w-4 h-4 mr-1" />
                  Stop
                </Button>
                
                <Button
                  onClick={() => onSimulationControl('reset')}
                  variant="outline"
                  className="border-gray-300 text-gray-700 hover:bg-gray-50"
                  size="sm"
                >
                  <RotateCcw className="w-4 h-4 mr-1" />
                  Reset
                </Button>
              </div>

              {/* Media Controls */}
              <div className="flex items-center gap-2">
                <Button
                  onClick={onToggleRecording}
                  variant={isRecording ? "default" : "outline"}
                  className={isRecording ? 
                    "bg-red-600 hover:bg-red-700 text-white border-red-700" : 
                    "border-red-300 text-red-700 hover:bg-red-50"
                  }
                  size="sm"
                >
                  {isRecording ? <Square className="w-4 h-4 mr-1" /> : <Camera className="w-4 h-4 mr-1" />}
                  {isRecording ? 'Stop Recording' : 'Record'}
                </Button>
                
                <Button
                  onClick={onToggleAudio}
                  variant="outline"
                  className="border-gray-300 text-gray-700 hover:bg-gray-50"
                  size="sm"
                >
                  {audioEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                </Button>
                
                <Button
                  onClick={onToggleFullscreen}
                  variant="outline"
                  className="border-gray-300 text-gray-700 hover:bg-gray-50"
                  size="sm"
                >
                  {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
                </Button>

                <Button
                  onClick={onSaveSimulation}
                  className="bg-blue-600 hover:bg-blue-700 text-white border-blue-700"
                  size="sm"
                >
                  <Save className="w-4 h-4 mr-1" />
                  Save
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Left Panel - Surgical Tools - Narrowed */}
      <div className="absolute top-32 left-4 w-64 pointer-events-auto">
        <Card className="bg-white/95 backdrop-blur-md border-gray-200 shadow-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-gray-900">Surgical Tools</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2">
              {SURGICAL_TOOLS.map((tool) => (
                <Button
                  key={tool.id}
                  onClick={() => onToolSelect(tool.id)}
                  variant={selectedTool === tool.id ? "default" : "outline"}
                  className={
                    selectedTool === tool.id 
                      ? "bg-blue-600 hover:bg-blue-700 text-white border-blue-700 p-3" 
                      : `border-gray-300 text-gray-700 hover:bg-gray-50 p-3 ${tool.color.replace('bg-', 'hover:bg-')}`
                  }
                  size="sm"
                >
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-lg">{tool.icon}</span>
                    <span className="text-xs font-medium">{tool.name}</span>
                  </div>
                </Button>
              ))}
            </div>
            
            {/* Selected Tool Info */}
            {selectedTool && (
              <div className="mt-4 p-3 rounded-lg bg-blue-50 border border-blue-200">
                <div className="text-sm font-medium text-blue-900">
                  {SURGICAL_TOOLS.find(t => t.id === selectedTool)?.name}
                </div>
                <div className="text-xs text-blue-700 mt-1">
                  {SURGICAL_TOOLS.find(t => t.id === selectedTool)?.description}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Right Panel - Participants & Stats */}
      <div className="absolute top-32 right-4 w-72 pointer-events-auto">
        <Card className="bg-white/95 backdrop-blur-md border-gray-200 shadow-xl">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold text-gray-900">
                <Users className="w-4 h-4 inline mr-2" />
                Participants ({participants.length})
              </CardTitle>
              <Badge className={getRoleColor(userRole)} variant="outline">
                {userRole.charAt(0).toUpperCase() + userRole.slice(1)}
              </Badge>
            </div>
          </CardHeader>
          
          <CardContent>
            <div className="space-y-3 max-h-48 overflow-y-auto">
              {participants.map((participant) => (
                <div key={participant.id} className="flex items-center gap-3 p-2 rounded-lg bg-gray-50">
                  <div className="relative">
                    <Avatar className="w-8 h-8 bg-gray-200" />
                    <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${getStatusColor(participant.status)}`} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">{participant.name}</div>
                    <div className="flex items-center gap-2">
                      <Badge className={getRoleColor(participant.role)} variant="outline" size="sm">
                        {participant.role}
                      </Badge>
                      <span className="text-xs text-gray-600">{participant.status}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Simulation Stats */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="text-center">
                  <div className="font-medium text-gray-900">
                    {simulationState.score || 0}
                  </div>
                  <div className="text-xs text-gray-600">Score</div>
                </div>
                <div className="text-center">
                  <div className="font-medium text-red-600">
                    {simulationState.errors}
                  </div>
                  <div className="text-xs text-gray-600">Errors</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Status Bar */}
      <div className="absolute bottom-4 left-4 right-4 pointer-events-auto">
        <Card className="bg-white/95 backdrop-blur-md border-gray-200 shadow-xl">
          <CardContent className="py-3">
            <div className="flex items-center justify-between text-sm text-gray-700">
              <div className="flex items-center gap-4">
                <span>Press <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded text-xs font-mono">ESC</kbd> for pointer lock</span>
                <span>Selected: <strong className="text-blue-600">{SURGICAL_TOOLS.find(t => t.id === selectedTool)?.name || 'None'}</strong></span>
              </div>
              <div className="flex items-center gap-4">
                <span>Status: <strong className={
                  simulationState.status === 'active' ? 'text-green-600' :
                  simulationState.status === 'paused' ? 'text-yellow-600' :
                  simulationState.status === 'completed' ? 'text-blue-600' :
                  'text-gray-600'
                }>{simulationState.status}</strong></span>
                <span>Role: <strong className="text-purple-600">{userRole}</strong></span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}