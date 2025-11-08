'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  Minimize,
  Zap,
  Activity
} from 'lucide-react';

// Enhanced tool definitions with better visual design
const SURGICAL_TOOLS = [
  { 
    id: 'scalpel', 
    name: 'Scalpel', 
    icon: '🔪', 
    description: 'Precision cutting instrument',
    color: 'from-red-500 to-red-600',
    bgColor: 'bg-red-50',
    textColor: 'text-red-700',
    borderColor: 'border-red-200',
    shadowColor: 'shadow-red-500/25'
  },
  { 
    id: 'forceps', 
    name: 'Forceps', 
    icon: '🗜️', 
    description: 'Grasping and holding tool',
    color: 'from-blue-500 to-blue-600',
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-700',
    borderColor: 'border-blue-200',
    shadowColor: 'shadow-blue-500/25'
  },
  { 
    id: 'suture', 
    name: 'Suture', 
    icon: '🪡', 
    description: 'Stitching needle',
    color: 'from-green-500 to-green-600',
    bgColor: 'bg-green-50',
    textColor: 'text-green-700',
    borderColor: 'border-green-200',
    shadowColor: 'shadow-green-500/25'
  },
  { 
    id: 'cautery', 
    name: 'Cautery', 
    icon: '⚡', 
    description: 'Electrocautery device',
    color: 'from-yellow-500 to-orange-500',
    bgColor: 'bg-yellow-50',
    textColor: 'text-yellow-700',
    borderColor: 'border-yellow-200',
    shadowColor: 'shadow-yellow-500/25'
  },
  { 
    id: 'syringe', 
    name: 'Syringe', 
    icon: '💉', 
    description: 'Injection tool',
    color: 'from-purple-500 to-purple-600',
    bgColor: 'bg-purple-50',
    textColor: 'text-purple-700',
    borderColor: 'border-purple-200',
    shadowColor: 'shadow-purple-500/25'
  },
  { 
    id: 'clamp', 
    name: 'Clamp', 
    icon: '📎', 
    description: 'Hemostatic clamp',
    color: 'from-orange-500 to-red-500',
    bgColor: 'bg-orange-50',
    textColor: 'text-orange-700',
    borderColor: 'border-orange-200',
    shadowColor: 'shadow-orange-500/25'
  }
];

export interface SurgeryUIProps {
  selectedTool: string;
  onToolSelect: (toolId: string) => void;
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
  userRole: 'surgeon' | 'assistant' | 'observer';
}

export function SurgeryUI({
  selectedTool,
  onToolSelect,
  participants,
  simulationState,
  onSimulationControl,
  userRole
}: SurgeryUIProps) {
  const [showSettings, setShowSettings] = useState(false);
  const [showToolPanel, setShowToolPanel] = useState(true);
  const [showParticipants, setShowParticipants] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch((err) => {
        console.error('Error attempting to enable fullscreen:', err);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().then(() => {
          setIsFullscreen(false);
        });
      }
    }
  };

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const formatDuration = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'surgeon': return 'bg-red-500 text-white';
      case 'assistant': return 'bg-blue-500 text-white';
      case 'observer': return 'bg-gray-500 text-white';
      default: return 'bg-gray-500 text-white';
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

  const currentTool = SURGICAL_TOOLS.find(t => t.id === selectedTool);

  return (
    <div className="fixed inset-0 pointer-events-none z-50 font-inter">
      {/* Modern gradient backdrop */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900/10 via-blue-900/5 to-purple-900/10" />
      
      {/* Top Control Bar - Futuristic Glass Design */}
      <div className="absolute top-4 left-4 right-4 pointer-events-auto">
        <div className="bg-white/95 backdrop-blur-2xl rounded-3xl border border-white/30 shadow-2xl shadow-black/5">
          <div className="px-8 py-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <Activity className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-600 bg-clip-text text-transparent">
                    Surgery Simulation
                  </h1>
                  <p className="text-sm text-gray-500 mt-1">Advanced Medical Training</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Badge className={`px-4 py-2 rounded-full font-bold text-sm ${
                  simulationState.status === 'active' ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg shadow-green-500/30' :
                  simulationState.status === 'paused' ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-lg shadow-yellow-500/30' :
                  simulationState.status === 'completed' ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30' :
                  'bg-gradient-to-r from-gray-500 to-gray-600 text-white shadow-lg shadow-gray-500/30'
                }`}>
                  {simulationState.status.toUpperCase()}
                </Badge>
                <div className="bg-gray-900 text-white px-4 py-2 rounded-xl font-mono text-lg font-bold shadow-lg">
                  {formatDuration(simulationState.duration)}
                </div>
              </div>
            </div>
            
            {/* Control Buttons - ONLY START/PAUSE/STOP */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {simulationState.status === 'idle' || simulationState.status === 'paused' ? (
                  <Button
                    onClick={() => onSimulationControl('start')}
                    className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold px-8 py-3 rounded-xl shadow-lg shadow-green-500/30 transition-all duration-200 hover:shadow-green-500/40 hover:scale-105"
                  >
                    <Play className="w-5 h-5 mr-2" />
                    {simulationState.status === 'paused' ? 'Resume' : 'Start'}
                  </Button>
                ) : (
                  <Button
                    onClick={() => onSimulationControl('pause')}
                    className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-semibold px-8 py-3 rounded-xl shadow-lg shadow-yellow-500/30 transition-all duration-200 hover:shadow-yellow-500/40 hover:scale-105"
                  >
                    <Pause className="w-5 h-5 mr-2" />
                    Pause
                  </Button>
                )}
                
                <Button
                  onClick={() => onSimulationControl('stop')}
                  className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold px-8 py-3 rounded-xl shadow-lg shadow-red-500/30 transition-all duration-200 hover:shadow-red-500/40 hover:scale-105"
                >
                  <Square className="w-5 h-5 mr-2" />
                  Stop
                </Button>
              </div>

              <div className="flex items-center gap-3">
                {/* Fullscreen Toggle */}
                <Button
                  onClick={toggleFullscreen}
                  className="bg-white border-2 border-gray-200 text-gray-700 hover:bg-gray-50 font-semibold px-5 py-3 rounded-xl shadow-lg transition-all duration-200 hover:scale-105"
                  title={isFullscreen ? 'Exit Fullscreen (F11)' : 'Enter Fullscreen (F11)'}
                >
                  {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
                </Button>

                {/* Hide Tool Panel */}
                <Button
                  onClick={() => setShowToolPanel(!showToolPanel)}
                  className="bg-white border-2 border-purple-200 text-purple-700 hover:bg-purple-50 font-semibold px-5 py-3 rounded-xl shadow-lg transition-all duration-200 hover:scale-105"
                  title={showToolPanel ? 'Hide Tools' : 'Show Tools'}
                >
                  {showToolPanel ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </Button>

                {/* Hide Participants Panel */}
                <Button
                  onClick={() => setShowParticipants(!showParticipants)}
                  className="bg-white border-2 border-green-200 text-green-700 hover:bg-green-50 font-semibold px-5 py-3 rounded-xl shadow-lg transition-all duration-200 hover:scale-105"
                  title={showParticipants ? 'Hide Team' : 'Show Team'}
                >
                  {showParticipants ? <Users className="w-5 h-5" /> : <Users className="w-5 h-5" />}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Left Panel - Surgical Tools - Premium Design */}
      {showToolPanel && (
      <div className="absolute top-40 left-4 w-80 pointer-events-auto">
        <div className="bg-white/95 backdrop-blur-2xl rounded-3xl border border-white/30 shadow-2xl shadow-black/5">
          <div className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Surgical Tools</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              {SURGICAL_TOOLS.map((tool) => (
                <button
                  key={tool.id}
                  onClick={() => onToolSelect(tool.id)}
                  className={`relative group p-4 rounded-2xl border-2 transition-all duration-300 hover:scale-105 ${
                    selectedTool === tool.id 
                      ? `bg-gradient-to-br ${tool.color} text-white border-white shadow-xl ${tool.shadowColor}` 
                      : `${tool.bgColor} ${tool.textColor} ${tool.borderColor} hover:shadow-lg hover:${tool.shadowColor.replace('25', '15')}`
                  }`}
                >
                  <div className="flex flex-col items-center gap-2">
                    <span className="text-2xl filter drop-shadow-lg">{tool.icon}</span>
                    <span className="text-sm font-bold">{tool.name}</span>
                  </div>
                  {selectedTool === tool.id && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-white rounded-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    </div>
                  )}
                </button>
              ))}
            </div>
            
            {/* Selected Tool Info */}
            {currentTool && (
              <div className={`mt-6 p-4 rounded-2xl border-2 ${currentTool.bgColor} ${currentTool.borderColor}`}>
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-xl">{currentTool.icon}</span>
                  <span className={`font-bold ${currentTool.textColor}`}>{currentTool.name}</span>
                </div>
                <p className={`text-sm ${currentTool.textColor.replace('700', '600')}`}>
                  {currentTool.description}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
      )}

      {/* Right Panel - Participants & Stats - Premium Design */}
      {showParticipants && (
      <div className="absolute top-40 right-4 w-80 pointer-events-auto">
        <div className="bg-white/95 backdrop-blur-2xl rounded-3xl border border-white/30 shadow-2xl shadow-black/5">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-blue-500 rounded-lg flex items-center justify-center">
                  <Users className="w-4 h-4 text-white" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">
                  Team ({participants.length})
                </h3>
              </div>
              <Badge className={`${getRoleColor(userRole)} px-3 py-1 rounded-full font-semibold text-sm`}>
                {userRole.charAt(0).toUpperCase() + userRole.slice(1)}
              </Badge>
            </div>
            
            <div className="space-y-3 max-h-48 overflow-y-auto">
              {participants.map((participant) => (
                <div key={participant.id} className="flex items-center gap-3 p-3 rounded-2xl bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 hover:shadow-lg transition-all duration-200">
                  <div className="relative">
                    <Avatar className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500" />
                    <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${getStatusColor(participant.status)} shadow-lg`} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-gray-900 truncate">{participant.name}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className={`${getRoleColor(participant.role)} text-xs px-2 py-0.5 rounded-full`}>
                        {participant.role}
                      </Badge>
                      <span className="text-xs text-gray-500 capitalize">{participant.status}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Simulation Stats - Enhanced */}
            <div className="mt-6 p-4 rounded-2xl bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-200">
              <h4 className="text-sm font-bold text-gray-800 mb-3">Performance</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-white rounded-xl shadow-sm">
                  <div className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
                    {simulationState.score || 0}
                  </div>
                  <div className="text-xs text-gray-600 font-medium">Score</div>
                </div>
                <div className="text-center p-3 bg-white rounded-xl shadow-sm">
                  <div className="text-2xl font-bold bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent">
                    {simulationState.errors}
                  </div>
                  <div className="text-xs text-gray-600 font-medium">Errors</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      )}

      {/* Bottom Status Bar - Sleek Design */}
      <div className="absolute bottom-4 left-4 right-4 pointer-events-auto">
        <div className="bg-gray-900/95 backdrop-blur-2xl rounded-2xl border border-gray-700/50 shadow-2xl">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-6 text-gray-300">
                <div className="flex items-center gap-2">
                  <kbd className="px-3 py-1 bg-gray-800 border border-gray-600 rounded-lg text-xs font-mono text-white">ESC</kbd>
                  <span>Pointer Lock</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>Selected:</span>
                  <span className="font-bold text-white">{currentTool?.name || 'None'}</span>
                  {currentTool && <span className="text-lg">{currentTool.icon}</span>}
                </div>
              </div>
              <div className="flex items-center gap-6 text-gray-300">
                <div className="flex items-center gap-2">
                  <span>Status:</span>
                  <span className={`font-bold ${
                    simulationState.status === 'active' ? 'text-green-400' :
                    simulationState.status === 'paused' ? 'text-yellow-400' :
                    simulationState.status === 'completed' ? 'text-blue-400' :
                    'text-gray-400'
                  }`}>{simulationState.status}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>Role:</span>
                  <span className="font-bold text-purple-400">{userRole}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}