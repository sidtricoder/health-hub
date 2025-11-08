'use client';

import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { 
  Minimize2, 
  Maximize2, 
  X, 
  Users, 
  Info,
  ChevronDown,
  ChevronUp,
  Monitor
} from 'lucide-react';

interface SurgeryUIProps {
  simulationState: {
    isRunning: boolean;
    isPaused: boolean;
    participants: Array<{
      id: string;
      name: string;
      role: string;
      isActive: boolean;
    }>;
    tools: Array<{
      id: string;
      type: string;
      userId: string | null;
      position: any;
      rotation: any;
    }>;
  };
  selectedTool: string;
  onToolSelect: (toolType: string) => void;
  onToggleSimulation: () => void;
  onResetSimulation: () => void;
  showStats: boolean;
  onToggleStats: () => void;
  isHost: boolean;
}

const SURGICAL_TOOLS = [
  { id: 'scalpel', name: 'Scalpel', icon: '🔪', color: 'bg-red-500' },
  { id: 'forceps', name: 'Forceps', icon: '🤏', color: 'bg-blue-500' },
  { id: 'suture', name: 'Suture', icon: '🧵', color: 'bg-green-500' },
  { id: 'cautery', name: 'Cautery', icon: '⚡', color: 'bg-yellow-500' },
  { id: 'syringe', name: 'Syringe', icon: '💉', color: 'bg-pink-500' },
  { id: 'clamp', name: 'Clamp', icon: '🔧', color: 'bg-purple-500' }
];

function getRoleBadgeColor(role: string): string {
  switch (role) {
    case 'surgeon':
      return 'bg-red-500 text-white';
    case 'assistant':
      return 'bg-blue-500 text-white';
    case 'observer':
      return 'bg-gray-500 text-white';
    default:
      return 'bg-gray-400 text-white';
  }
}

export function SurgeryUI({
  simulationState,
  selectedTool,
  onToolSelect,
  onToggleSimulation,
  onResetSimulation,
  showStats,
  onToggleStats,
  isHost
}: SurgeryUIProps) {
  const [showToolPanel, setShowToolPanel] = useState(true);
  const [showParticipants, setShowParticipants] = useState(true);
  const [showInstructions, setShowInstructions] = useState(true);
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
  React.useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none z-50">
      {/* Professional Tool Selection Panel */}
      {showToolPanel && (
        <div className="absolute top-6 left-6 pointer-events-auto">
          <Card className="bg-gradient-to-br from-slate-900/95 to-slate-800/95 backdrop-blur-xl border-slate-700 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between bg-slate-800/50 px-4 py-3 border-b border-slate-700">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                <h3 className="text-sm font-semibold text-white">Surgical Instruments</h3>
              </div>
              <button
                onClick={() => setShowToolPanel(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-3 gap-3 w-72">
                {SURGICAL_TOOLS.map((tool) => (
                  <button
                    key={tool.id}
                    onClick={() => onToolSelect(tool.id)}
                    className={`
                      relative h-20 flex flex-col items-center justify-center rounded-lg
                      transition-all duration-200 border-2
                      ${selectedTool === tool.id 
                        ? 'bg-blue-600 border-blue-400 shadow-lg shadow-blue-500/50 scale-105' 
                        : 'bg-slate-800/50 border-slate-700 hover:bg-slate-700/50 hover:border-slate-600'
                      }
                    `}
                  >
                    <span className="text-2xl mb-1">{tool.icon}</span>
                    <span className="text-[10px] font-medium text-white">{tool.name}</span>
                    {selectedTool === tool.id && (
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-slate-900" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Minimized Tool Panel Button */}
      {!showToolPanel && (
        <button
          onClick={() => setShowToolPanel(true)}
          className="absolute top-6 left-6 pointer-events-auto bg-slate-900/95 backdrop-blur-xl border border-slate-700 text-white px-4 py-2 rounded-lg shadow-xl hover:bg-slate-800 transition-all"
        >
          <ChevronDown className="w-4 h-4" />
        </button>
      )}

      {/* Professional Control Panel - Top Right */}
      <div className="absolute top-6 right-6 pointer-events-auto flex gap-3">
        {/* Stats Toggle */}
        <button
          onClick={onToggleStats}
          className={`px-4 py-2 rounded-lg font-medium text-sm transition-all shadow-xl border-2 ${
            showStats
              ? 'bg-green-600 border-green-400 text-white'
              : 'bg-slate-900/95 backdrop-blur-xl border-slate-700 text-white hover:bg-slate-800'
          }`}
        >
          <Monitor className="w-4 h-4 inline mr-2" />
          {showStats ? 'Hide Stats' : 'Show Stats'}
        </button>

        {/* Fullscreen Toggle */}
        <button
          onClick={toggleFullscreen}
          className="bg-slate-900/95 backdrop-blur-xl border-2 border-slate-700 text-white px-4 py-2 rounded-lg shadow-xl hover:bg-slate-800 transition-all"
          title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>
      </div>

      {/* Professional Participants Panel - Bottom Right */}
      {showParticipants && (
        <div className="absolute bottom-6 right-6 pointer-events-auto">
          <Card className="bg-gradient-to-br from-slate-900/95 to-slate-800/95 backdrop-blur-xl border-slate-700 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between bg-slate-800/50 px-4 py-3 border-b border-slate-700">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-400" />
                <h3 className="text-sm font-semibold text-white">
                  Participants ({simulationState.participants.length})
                </h3>
              </div>
              <button
                onClick={() => setShowParticipants(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4">
              <div className="space-y-2 max-h-48 overflow-y-auto w-80">
                {simulationState.participants.length > 0 ? (
                  simulationState.participants.map((participant) => (
                    <div
                      key={participant.id}
                      className="flex items-center justify-between p-3 bg-slate-800/40 rounded-lg border border-slate-700/50 hover:bg-slate-700/40 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div
                            className={`w-3 h-3 rounded-full ${
                              participant.isActive ? 'bg-green-500' : 'bg-slate-600'
                            }`}
                          />
                          {participant.isActive && (
                            <div className="absolute inset-0 w-3 h-3 bg-green-500 rounded-full animate-ping opacity-75" />
                          )}
                        </div>
                        <span className="text-sm font-medium text-white">{participant.name}</span>
                      </div>
                      <Badge className={`text-xs px-3 py-1 ${getRoleBadgeColor(participant.role)}`}>
                        {participant.role}
                      </Badge>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-slate-400 text-center py-8">
                    <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    No participants connected
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Minimized Participants Button */}
      {!showParticipants && (
        <button
          onClick={() => setShowParticipants(true)}
          className="absolute bottom-6 right-6 pointer-events-auto bg-slate-900/95 backdrop-blur-xl border border-slate-700 text-white px-4 py-2 rounded-lg shadow-xl hover:bg-slate-800 transition-all flex items-center gap-2"
        >
          <Users className="w-4 h-4" />
          <span className="text-sm">{simulationState.participants.length}</span>
        </button>
      )}

      {/* Professional Instructions Panel - Bottom Left */}
      {showInstructions && (
        <div className="absolute bottom-6 left-6 pointer-events-auto">
          <Card className="bg-gradient-to-br from-slate-900/95 to-slate-800/95 backdrop-blur-xl border-slate-700 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between bg-slate-800/50 px-4 py-3 border-b border-slate-700">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-blue-400" />
                <h3 className="text-sm font-semibold text-white">Controls</h3>
              </div>
              <button
                onClick={() => setShowInstructions(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 w-72">
              <div className="space-y-2">
                {[
                  { key: 'ESC', desc: 'Enable/Disable mouse' },
                  { key: 'WASD', desc: 'Move around' },
                  { key: 'Mouse', desc: 'Look around' },
                  { key: 'Click', desc: 'Use selected tool' },
                  { key: 'Shift', desc: 'Sprint' },
                ].map((control) => (
                  <div key={control.key} className="flex items-center justify-between text-sm">
                    <kbd className="px-2 py-1 bg-slate-800 border border-slate-600 rounded text-blue-400 font-mono text-xs">
                      {control.key}
                    </kbd>
                    <span className="text-slate-300">{control.desc}</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Minimized Instructions Button */}
      {!showInstructions && (
        <button
          onClick={() => setShowInstructions(true)}
          className="absolute bottom-6 left-6 pointer-events-auto bg-slate-900/95 backdrop-blur-xl border border-slate-700 text-white px-4 py-2 rounded-lg shadow-xl hover:bg-slate-800 transition-all"
        >
          <Info className="w-4 h-4" />
        </button>
      )}

      {/* Professional Simulation Status - Left Center */}
      <div className="absolute top-1/2 left-6 transform -translate-y-1/2 pointer-events-auto">
        <div className="bg-gradient-to-r from-slate-900/95 to-slate-800/95 backdrop-blur-xl border-2 border-slate-700 shadow-2xl rounded-lg px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div
                className={`w-4 h-4 rounded-full ${
                  simulationState.isRunning 
                    ? 'bg-green-500 shadow-lg shadow-green-500/50' 
                    : 'bg-red-500 shadow-lg shadow-red-500/50'
                }`}
              />
              {simulationState.isRunning && (
                <div className="absolute inset-0 w-4 h-4 bg-green-500 rounded-full animate-ping opacity-75" />
              )}
            </div>
            <div>
              <div className="text-xs text-slate-400 uppercase tracking-wider">Status</div>
              <div className="text-sm font-bold text-white">
                {simulationState.isRunning 
                  ? (simulationState.isPaused ? 'Paused' : 'Active')
                  : 'Idle'
                }
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}