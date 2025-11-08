'use client';

import React from 'react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';

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
      return 'bg-red-100 text-red-800 border-red-200';
    case 'assistant':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'observer':
      return 'bg-gray-100 text-gray-800 border-gray-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
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
  return (
    <div className="absolute inset-0 pointer-events-none z-50">
      {/* Tool Selection Panel - Fixed visibility and width */}
      <div className="absolute top-4 left-4 pointer-events-auto">
        <Card className="bg-white/95 backdrop-blur-md border border-gray-300 shadow-xl p-4 w-72">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Surgical Tools</h3>
          <div className="grid grid-cols-2 gap-2">
            {SURGICAL_TOOLS.map((tool) => (
              <Button
                key={tool.id}
                variant={selectedTool === tool.id ? "default" : "outline"}
                size="sm"
                onClick={() => onToolSelect(tool.id)}
                className={`
                  h-12 flex flex-col items-center justify-center text-xs transition-all duration-200
                  ${selectedTool === tool.id 
                    ? 'bg-blue-600 text-white border-blue-600 shadow-lg' 
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400'
                  }
                `}
              >
                <span className="text-base mb-1">{tool.icon}</span>
                <span className="text-[10px] font-medium">{tool.name}</span>
              </Button>
            ))}
          </div>
        </Card>
      </div>

      {/* Simulation Controls */}
      <div className="absolute top-4 right-4 pointer-events-auto">
        <Card className="bg-white/95 backdrop-blur-md border border-gray-300 shadow-xl p-4">
          <div className="flex items-center space-x-2">
            <Button
              onClick={onToggleSimulation}
              variant={simulationState.isRunning ? "destructive" : "default"}
              size="sm"
              className="font-medium"
            >
              {simulationState.isRunning 
                ? (simulationState.isPaused ? 'Resume' : 'Pause')
                : 'Start'
              }
            </Button>
            <Button
              onClick={onResetSimulation}
              variant="outline"
              size="sm"
              className="border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Reset
            </Button>
            <Button
              onClick={onToggleStats}
              variant="outline"
              size="sm"
              className="border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              {showStats ? 'Hide Stats' : 'Show Stats'}
            </Button>
          </div>
        </Card>
      </div>

      {/* Participants Panel */}
      <div className="absolute bottom-4 right-4 pointer-events-auto">
        <Card className="bg-white/95 backdrop-blur-md border border-gray-300 shadow-xl p-4 w-80">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">
            Participants ({simulationState.participants.length})
          </h3>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {simulationState.participants.length > 0 ? (
              simulationState.participants.map((participant) => (
                <div
                  key={participant.id}
                  className="flex items-center justify-between p-2 bg-gray-50 rounded-md"
                >
                  <div className="flex items-center space-x-2">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        participant.isActive ? 'bg-green-500' : 'bg-gray-400'
                      }`}
                    />
                    <span className="text-sm font-medium text-gray-900">{participant.name}</span>
                  </div>
                  <Badge
                    variant="outline"
                    className={`text-xs ${getRoleBadgeColor(participant.role)}`}
                  >
                    {participant.role}
                  </Badge>
                </div>
              ))
            ) : (
              <div className="text-sm text-gray-500 text-center py-4">
                No participants connected
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Instructions Panel */}
      <div className="absolute bottom-4 left-4 pointer-events-auto">
        <Card className="bg-white/95 backdrop-blur-md border border-gray-300 shadow-xl p-4 w-64">
          <h3 className="text-sm font-semibold text-gray-900 mb-2">Instructions</h3>
          <div className="text-xs text-gray-700 space-y-1">
            <div><span className="font-medium">ESC:</span> Enable/Disable mouse capture</div>
            <div><span className="font-medium">WASD:</span> Move around</div>
            <div><span className="font-medium">Mouse:</span> Look around</div>
            <div><span className="font-medium">Click:</span> Use selected tool</div>
          </div>
        </Card>
      </div>

      {/* Performance Warning */}
      {simulationState.participants.length > 4 && (
        <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-10 pointer-events-auto">
          <div className="bg-yellow-500 text-white px-4 py-2 rounded-md text-sm shadow-lg">
            ⚠️ Performance may be affected with {simulationState.participants.length} participants
          </div>
        </div>
      )}

      {/* Simulation Status */}
      <div className="absolute top-1/2 left-4 transform -translate-y-1/2 pointer-events-auto">
        <Card className="bg-white/95 backdrop-blur-md border border-gray-300 shadow-xl p-3">
          <div className="flex items-center space-x-2">
            <div
              className={`w-3 h-3 rounded-full ${
                simulationState.isRunning ? 'bg-green-500 animate-pulse' : 'bg-red-500'
              }`}
            />
            <span className="text-sm font-medium text-gray-900">
              {simulationState.isRunning 
                ? (simulationState.isPaused ? 'Paused' : 'Running')
                : 'Stopped'
              }
            </span>
          </div>
        </Card>
      </div>
    </div>
  );
}