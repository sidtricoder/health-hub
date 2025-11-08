'use client';

import React from 'react';
import { Mic, MicOff, Phone, PhoneOff, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface VoiceChatPanelProps {
  isMicEnabled: boolean;
  isMuted: boolean;
  isConnecting: boolean;
  peers: Array<{
    userId: string;
    userName: string;
    stream?: MediaStream;
  }>;
  audioLevels: Map<string, number>;
  onStartMicrophone: () => void;
  onStopMicrophone: () => void;
  onToggleMute: () => void;
}

export function VoiceChatPanel({
  isMicEnabled,
  isMuted,
  isConnecting,
  peers,
  audioLevels,
  onStartMicrophone,
  onStopMicrophone,
  onToggleMute
}: VoiceChatPanelProps) {
  return (
    <div className="absolute bottom-24 left-6 pointer-events-auto">
      <Card className="bg-gradient-to-br from-slate-900/95 to-slate-800/95 backdrop-blur-xl border-slate-700 shadow-2xl overflow-hidden">
        <div className="p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isMicEnabled && !isMuted ? 'bg-green-500 animate-pulse' : 'bg-slate-600'}`} />
              <h3 className="text-sm font-semibold text-white">Voice Chat</h3>
            </div>
            {isMicEnabled && (
              <div className="text-xs text-slate-400">
                {peers.length} connected
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2 mb-4">
            {!isMicEnabled ? (
              <Button
                onClick={onStartMicrophone}
                disabled={isConnecting}
                className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold py-3 rounded-xl shadow-lg shadow-green-500/30 transition-all duration-200 hover:scale-105"
              >
                {isConnecting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Phone className="w-4 h-4 mr-2" />
                    Join Voice
                  </>
                )}
              </Button>
            ) : (
              <>
                <Button
                  onClick={onToggleMute}
                  className={`flex-1 font-semibold py-3 rounded-xl shadow-lg transition-all duration-200 hover:scale-105 ${
                    isMuted
                      ? 'bg-red-600 hover:bg-red-700 text-white shadow-red-500/30'
                      : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-green-500/30'
                  }`}
                >
                  {isMuted ? (
                    <>
                      <MicOff className="w-4 h-4 mr-2" />
                      Unmute
                    </>
                  ) : (
                    <>
                      <Mic className="w-4 h-4 mr-2" />
                      Mute
                    </>
                  )}
                </Button>
                <Button
                  onClick={onStopMicrophone}
                  className="bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-3 rounded-xl shadow-lg shadow-red-500/30 transition-all duration-200 hover:scale-105"
                  title="Leave Voice Chat"
                >
                  <PhoneOff className="w-4 h-4" />
                </Button>
              </>
            )}
          </div>

          {/* Connected Users */}
          {isMicEnabled && peers.length > 0 && (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              <div className="text-xs text-slate-400 mb-2 font-medium">Connected:</div>
              {peers.map((peer) => {
                const audioLevel = audioLevels.get(peer.userId) || 0;
                const isSpeaking = audioLevel > 0.1;

                return (
                  <div
                    key={peer.userId}
                    className={`flex items-center justify-between p-2 rounded-lg transition-all duration-200 ${
                      isSpeaking 
                        ? 'bg-green-500/20 border border-green-500/50' 
                        : 'bg-slate-800/40 border border-slate-700/50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <div className={`w-2 h-2 rounded-full ${isSpeaking ? 'bg-green-500' : 'bg-slate-600'}`} />
                        {isSpeaking && (
                          <div className="absolute inset-0 w-2 h-2 bg-green-500 rounded-full animate-ping opacity-75" />
                        )}
                      </div>
                      <span className="text-xs text-white font-medium">{peer.userName}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {isSpeaking ? (
                        <Volume2 className="w-3 h-3 text-green-400" />
                      ) : (
                        <VolumeX className="w-3 h-3 text-slate-500" />
                      )}
                      {/* Audio level indicator */}
                      <div className="w-12 h-1 bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-green-500 transition-all duration-100"
                          style={{ width: `${audioLevel * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Help Text */}
          {!isMicEnabled && (
            <div className="text-xs text-slate-400 text-center mt-2">
              Click "Join Voice" to communicate with other doctors
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
