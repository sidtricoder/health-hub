'use client';

import React, { useEffect, useState } from 'react';
import { Text } from '@react-three/drei';
import { Vector3 } from 'three';
import { EnhancedToolCursor } from './EnhancedToolCursor';

interface CollaborativeCursor {
  userId: string;
  userName: string;
  selectedTool: string;
  position: Vector3;
  color: string;
  isActive: boolean;
  lastUpdate: number;
}

interface CollaborativeCursorsProps {
  participants: Array<{
    id: string;
    name: string;
    role: 'surgeon' | 'assistant' | 'observer';
    status: 'active' | 'idle' | 'disconnected';
  }>;
  currentUserId: string;
  socket: any;
  sessionId: string;
  onRemoteInteraction?: (userId: string, position: Vector3, force: number, toolType: string) => void;
}

const ROLE_COLORS = {
  surgeon: '#e74c3c',
  assistant: '#3498db',
  observer: '#95a5a6'
};

export function CollaborativeCursors({
  participants,
  currentUserId,
  socket,
  sessionId,
  onRemoteInteraction
}: CollaborativeCursorsProps) {
  const [remoteCursors, setRemoteCursors] = useState<Map<string, CollaborativeCursor>>(new Map());

  useEffect(() => {
    if (!socket) return;

    // Listen for cursor updates from other users
    socket.on('surgery:cursor-update', (data: {
      userId: string;
      userName: string;
      selectedTool: string;
      position: [number, number, number];
      isActive: boolean;
    }) => {
      if (data.userId === currentUserId) return; // Ignore own cursor

      setRemoteCursors(prev => {
        const newMap = new Map(prev);
        const participant = participants.find(p => p.id === data.userId);
        
        newMap.set(data.userId, {
          userId: data.userId,
          userName: data.userName,
          selectedTool: data.selectedTool,
          position: new Vector3(...data.position),
          color: participant ? ROLE_COLORS[participant.role] : '#95a5a6',
          isActive: data.isActive,
          lastUpdate: Date.now()
        });
        
        return newMap;
      });
    });

    // Listen for tool interaction from other users
    socket.on('surgery:remote-interaction', (data: {
      userId: string;
      position: [number, number, number];
      force: number;
      toolType: string;
    }) => {
      if (onRemoteInteraction) {
        onRemoteInteraction(
          data.userId,
          new Vector3(...data.position),
          data.force,
          data.toolType
        );
      }
    });

    // Clean up inactive cursors
    const cleanupInterval = setInterval(() => {
      const now = Date.now();
      setRemoteCursors(prev => {
        const newMap = new Map(prev);
        for (const [userId, cursor] of newMap.entries()) {
          // Remove cursors that haven't updated in 5 seconds
          if (now - cursor.lastUpdate > 5000) {
            newMap.delete(userId);
          }
        }
        return newMap;
      });
    }, 1000);

    return () => {
      socket.off('surgery:cursor-update');
      socket.off('surgery:remote-interaction');
      clearInterval(cleanupInterval);
    };
  }, [socket, currentUserId, participants, onRemoteInteraction]);

  return (
    <group>
      {Array.from(remoteCursors.values()).map(cursor => (
        <RemoteCursorDisplay
          key={cursor.userId}
          cursor={cursor}
        />
      ))}
    </group>
  );
}

interface RemoteCursorDisplayProps {
  cursor: CollaborativeCursor;
}

function RemoteCursorDisplay({ cursor }: RemoteCursorDisplayProps) {
  if (!cursor.selectedTool) return null;

  return (
    <group position={cursor.position.toArray()}>
      {/* Simple tool indicator */}
      <mesh scale={[0.8, 0.8, 0.8]}>
        <sphereGeometry args={[0.08]} />
        <meshStandardMaterial
          color={cursor.color}
          emissive={cursor.color}
          emissiveIntensity={cursor.isActive ? 0.6 : 0.3}
          transparent
          opacity={0.8}
        />
      </mesh>

      {/* Active indicator ring */}
      {cursor.isActive && (
        <mesh scale={[1.2, 1.2, 1.2]}>
          <ringGeometry args={[0.08, 0.12, 16]} />
          <meshBasicMaterial
            color={cursor.color}
            transparent
            opacity={0.5}
            side={2}
          />
        </mesh>
      )}

      {/* Doctor name label */}
      <group position={[0, 0.25, 0]}>
        {/* Background plate */}
        <mesh position={[0, 0, -0.01]}>
          <planeGeometry args={[0.8, 0.15]} />
          <meshBasicMaterial
            color={cursor.color}
            transparent
            opacity={0.85}
          />
        </mesh>

        {/* Name text */}
        <Text
          position={[0, 0, 0]}
          fontSize={0.08}
          color="white"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.005}
          outlineColor="#000000"
          font="/fonts/inter-bold.woff"
        >
          {cursor.userName}
        </Text>
      </group>

      {/* Tool name */}
      <group position={[0, 0.12, 0]}>
        <Text
          fontSize={0.06}
          color="white"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.003}
          outlineColor="#000000"
        >
          {cursor.selectedTool.toUpperCase()}
        </Text>
      </group>

      {/* Tool direction indicator */}
      <mesh position={[0, 0, 0.12]} rotation={[-Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.04, 0.08, 8]} />
        <meshStandardMaterial
          color={cursor.color}
          emissive={cursor.color}
          emissiveIntensity={0.4}
        />
      </mesh>

      {/* Glow effect */}
      {cursor.isActive && (
        <pointLight
          color={cursor.color}
          intensity={0.8}
          distance={1.5}
        />
      )}
    </group>
  );
}

// Hook to broadcast cursor position
export function useCursorBroadcast(
  socket: any,
  sessionId: string,
  userId: string,
  userName: string,
  selectedTool: string | null,
  cursorPosition: Vector3,
  isActive: boolean
) {
  useEffect(() => {
    if (!socket || !selectedTool) return;

    const broadcastInterval = setInterval(() => {
      socket.emit('surgery:cursor-update', {
        sessionId,
        userId,
        userName,
        selectedTool,
        position: cursorPosition.toArray(),
        isActive
      });
    }, 50); // Broadcast 20 times per second

    return () => {
      clearInterval(broadcastInterval);
    };
  }, [socket, sessionId, userId, userName, selectedTool, cursorPosition, isActive]);
}
