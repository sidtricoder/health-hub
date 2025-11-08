'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import { Vector3, Quaternion, Euler } from 'three';
import * as THREE from 'three';

interface RemoteTool {
  userId: string;
  userName: string;
  toolType: string;
  position: Vector3;
  rotation: Euler;
  quaternion: Quaternion;
  color: string;
  lastUpdate: number;
  isActive: boolean;
}

interface RealtimeToolSyncProps {
  socket: any;
  sessionId: string;
  currentUserId: string;
  participants: Array<{
    id: string;
    name: string;
    role: 'surgeon' | 'assistant' | 'observer';
    status: 'active' | 'idle' | 'disconnected';
  }>;
}

const TOOL_COLORS = {
  scalpel: '#e74c3c',
  forceps: '#3498db',
  suture: '#9b59b6',
  cautery: '#e67e22',
  syringe: '#1abc9c',
  clamp: '#f39c12',
  default: '#95a5a6'
};

const ROLE_COLORS = {
  surgeon: '#e74c3c',
  assistant: '#3498db',
  observer: '#95a5a6'
};

export function RealtimeToolSync({ 
  socket, 
  sessionId, 
  currentUserId, 
  participants 
}: RealtimeToolSyncProps) {
  const [remoteTools, setRemoteTools] = useState<Map<string, RemoteTool>>(new Map());

  useEffect(() => {
    if (!socket) return;

    // Listen for tool position updates from other doctors
    const handleToolPosition = (data: {
      userId: string;
      userName: string;
      toolType: string;
      position: [number, number, number];
      rotation?: [number, number, number];
      quaternion?: [number, number, number, number];
      timestamp: number;
    }) => {
      // Ignore own tool
      if (data.userId === currentUserId) return;

      setRemoteTools(prev => {
        const newMap = new Map(prev);
        const participant = participants.find(p => p.id === data.userId);
        
        const tool: RemoteTool = {
          userId: data.userId,
          userName: data.userName,
          toolType: data.toolType,
          position: new Vector3(...data.position),
          rotation: data.rotation ? new Euler(...data.rotation) : new Euler(),
          quaternion: data.quaternion ? new Quaternion(...data.quaternion) : new Quaternion(),
          color: participant ? ROLE_COLORS[participant.role] : ROLE_COLORS.observer,
          lastUpdate: Date.now(),
          isActive: true
        };

        newMap.set(data.userId, tool);
        return newMap;
      });
    };

    socket.on('surgery:tool-position', handleToolPosition);

    // Clean up stale tools (no update for 2 seconds)
    const cleanupInterval = setInterval(() => {
      const now = Date.now();
      setRemoteTools(prev => {
        const newMap = new Map(prev);
        for (const [userId, tool] of newMap.entries()) {
          if (now - tool.lastUpdate > 2000) {
            newMap.delete(userId);
          }
        }
        return newMap;
      });
    }, 500);

    return () => {
      socket.off('surgery:tool-position', handleToolPosition);
      clearInterval(cleanupInterval);
    };
  }, [socket, sessionId, currentUserId, participants]);

  return (
    <group>
      {Array.from(remoteTools.values()).map(tool => (
        <RemoteToolVisualization
          key={tool.userId}
          tool={tool}
        />
      ))}
    </group>
  );
}

interface RemoteToolVisualizationProps {
  tool: RemoteTool;
}

function RemoteToolVisualization({ tool }: RemoteToolVisualizationProps) {
  const meshRef = useRef<THREE.Group>(null);
  const [targetPosition] = useState(new Vector3());
  const [currentPosition] = useState(new Vector3());

  // Smooth interpolation for position
  useEffect(() => {
    targetPosition.copy(tool.position);
  }, [tool.position, targetPosition]);

  useFrame(() => {
    if (meshRef.current) {
      // Smooth lerp for position
      currentPosition.lerp(targetPosition, 0.3);
      meshRef.current.position.copy(currentPosition);

      // Apply rotation
      if (tool.quaternion) {
        meshRef.current.quaternion.copy(tool.quaternion);
      } else if (tool.rotation) {
        meshRef.current.rotation.copy(tool.rotation);
      }
    }
  });

  return (
    <group ref={meshRef}>
      {/* Tool visualization based on type */}
      <RemoteToolModel toolType={tool.toolType} color={tool.color} />

      {/* Doctor name label - TEXT COMPONENT */}
      <Text
        position={[0, 0.35, 0]}
        fontSize={0.08}
        color={tool.color}
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.01}
        outlineColor="#000000"
        renderOrder={999}
      >
        {tool.userName}
      </Text>

      {/* Background for name label */}
      <mesh position={[0, 0.35, -0.01]} renderOrder={998}>
        <planeGeometry args={[tool.userName.length * 0.06, 0.12]} />
        <meshBasicMaterial
          color="#000000"
          transparent
          opacity={0.6}
          depthTest={false}
        />
      </mesh>

      {/* Glow effect */}
      <pointLight
        color={tool.color}
        intensity={0.5}
        distance={1.0}
      />

      {/* Trail effect for active tools */}
      {tool.isActive && (
        <mesh>
          <sphereGeometry args={[0.15, 8, 8]} />
          <meshBasicMaterial
            color={tool.color}
            transparent
            opacity={0.2}
            wireframe
          />
        </mesh>
      )}
    </group>
  );
}

interface RemoteToolModelProps {
  toolType: string;
  color: string;
}

function RemoteToolModel({ toolType, color }: RemoteToolModelProps) {
  switch (toolType) {
    case 'scalpel':
      return (
        <group>
          {/* Handle */}
          <mesh position={[0, 0, 0.1]} rotation={[Math.PI / 4, 0, 0]}>
            <cylinderGeometry args={[0.015, 0.02, 0.15, 8]} />
            <meshStandardMaterial color="#888888" metalness={0.8} roughness={0.2} />
          </mesh>
          {/* Blade */}
          <mesh position={[0, 0, -0.08]} rotation={[Math.PI / 4, 0, 0]}>
            <boxGeometry args={[0.01, 0.12, 0.002]} />
            <meshStandardMaterial
              color={color}
              emissive={color}
              emissiveIntensity={0.5}
              metalness={0.9}
              roughness={0.1}
            />
          </mesh>
        </group>
      );

    case 'forceps':
      return (
        <group>
          {/* Handle */}
          <mesh position={[0, 0, 0.08]}>
            <cylinderGeometry args={[0.015, 0.015, 0.2, 8]} />
            <meshStandardMaterial color="#888888" metalness={0.7} roughness={0.3} />
          </mesh>
          {/* Jaw 1 */}
          <mesh position={[-0.01, 0, -0.06]} rotation={[0, 0, -0.2]}>
            <boxGeometry args={[0.008, 0.08, 0.008]} />
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.4} />
          </mesh>
          {/* Jaw 2 */}
          <mesh position={[0.01, 0, -0.06]} rotation={[0, 0, 0.2]}>
            <boxGeometry args={[0.008, 0.08, 0.008]} />
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.4} />
          </mesh>
        </group>
      );

    case 'suture':
      return (
        <group>
          {/* Needle holder */}
          <mesh position={[0, 0, 0]}>
            <cylinderGeometry args={[0.012, 0.012, 0.18, 8]} />
            <meshStandardMaterial color="#666666" metalness={0.8} roughness={0.2} />
          </mesh>
          {/* Needle */}
          <mesh position={[0, 0, -0.12]}>
            <torusGeometry args={[0.02, 0.003, 8, 16, Math.PI]} />
            <meshStandardMaterial
              color={color}
              emissive={color}
              emissiveIntensity={0.5}
              metalness={0.9}
            />
          </mesh>
        </group>
      );

    case 'cautery':
      return (
        <group>
          {/* Handle */}
          <mesh position={[0, 0, 0.08]}>
            <cylinderGeometry args={[0.018, 0.018, 0.2, 8]} />
            <meshStandardMaterial color="#444444" />
          </mesh>
          {/* Tip */}
          <mesh position={[0, 0, -0.08]}>
            <coneGeometry args={[0.015, 0.06, 8]} />
            <meshStandardMaterial
              color={color}
              emissive={color}
              emissiveIntensity={0.8}
            />
          </mesh>
          {/* Spark effect */}
          <pointLight color="#ff6600" intensity={0.8} distance={0.5} />
        </group>
      );

    case 'syringe':
      return (
        <group>
          {/* Plunger */}
          <mesh position={[0, 0, 0.1]}>
            <cylinderGeometry args={[0.008, 0.008, 0.12, 8]} />
            <meshStandardMaterial color="#cccccc" />
          </mesh>
          {/* Barrel */}
          <mesh position={[0, 0, 0]}>
            <cylinderGeometry args={[0.02, 0.018, 0.15, 8]} />
            <meshStandardMaterial color={color} transparent opacity={0.6} />
          </mesh>
          {/* Needle */}
          <mesh position={[0, 0, -0.12]}>
            <cylinderGeometry args={[0.003, 0.003, 0.1, 8]} />
            <meshStandardMaterial color="#aaaaaa" metalness={0.9} roughness={0.1} />
          </mesh>
        </group>
      );

    case 'clamp':
      return (
        <group>
          {/* Handle */}
          <mesh position={[0, 0, 0.08]}>
            <cylinderGeometry args={[0.015, 0.015, 0.18, 8]} />
            <meshStandardMaterial color="#777777" metalness={0.7} roughness={0.3} />
          </mesh>
          {/* Clamp jaw */}
          <mesh position={[0, 0, -0.06]}>
            <boxGeometry args={[0.04, 0.08, 0.01]} />
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.4} />
          </mesh>
        </group>
      );

    default:
      return (
        <mesh>
          <sphereGeometry args={[0.05, 16, 16]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={0.3}
            transparent
            opacity={0.8}
          />
        </mesh>
      );
  }
}

// Hook to broadcast tool position to other doctors
export function useToolPositionBroadcast(
  socket: any,
  sessionId: string,
  userId: string,
  userName: string,
  toolType: string | null,
  toolPosition: Vector3,
  toolRotation: Euler,
  toolQuaternion: Quaternion,
  isActive: boolean
) {
  const lastBroadcastRef = useRef<number>(0);
  const broadcastIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!socket || !toolType || !isActive) {
      if (broadcastIntervalRef.current) {
        clearInterval(broadcastIntervalRef.current);
        broadcastIntervalRef.current = null;
      }
      return;
    }

    // High-frequency broadcast (60fps = ~16ms, we'll do 30fps = ~33ms for network efficiency)
    broadcastIntervalRef.current = setInterval(() => {
      const now = Date.now();
      
      // Throttle to 30 broadcasts per second
      if (now - lastBroadcastRef.current < 33) return;
      
      lastBroadcastRef.current = now;

      socket.emit('surgery:tool-position', {
        sessionId,
        userId,
        userName,
        toolType,
        position: toolPosition.toArray(),
        rotation: [toolRotation.x, toolRotation.y, toolRotation.z],
        quaternion: [toolQuaternion.x, toolQuaternion.y, toolQuaternion.z, toolQuaternion.w],
      });
    }, 33); // 30fps

    return () => {
      if (broadcastIntervalRef.current) {
        clearInterval(broadcastIntervalRef.current);
      }
    };
  }, [socket, sessionId, userId, userName, toolType, toolPosition, toolRotation, toolQuaternion, isActive]);
}
