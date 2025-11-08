'use client';

import React, { useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useBox, useSphere, useConvexPolyhedron } from '@react-three/cannon';
import { Vector3, Mesh, Color } from 'three';
import { SurgicalTable, SurgicalTools, SoftBodyTissue, OperatingRoom } from './components';
import { TissueModel } from './components/TissueModel';

interface SurgicalSceneProps {
  simulationState: {
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
  };
  selectedTool: string;
  onToolInteraction: (toolId: string, position: Vector3, rotation: Vector3) => void;
  onTissueInteraction: (point: Vector3, force: number, toolType: string) => void;
  userId: string;
  sessionId: string;
}

export function SurgicalScene({
  simulationState,
  selectedTool,
  onToolInteraction,
  onTissueInteraction,
  userId,
  sessionId
}: SurgicalSceneProps) {
  const { camera, raycaster, scene } = useThree();
  const [hoveredObject, setHoveredObject] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Mouse interaction handling
  const handlePointerDown = (event: any) => {
    if (simulationState.status !== 'active') return;
    
    setIsDragging(true);
    const intersects = raycaster.intersectObjects(scene.children, true);
    
    if (intersects.length > 0) {
      const intersection = intersects[0];
      const point = intersection.point;
      
      // Calculate force based on distance and tool type
      const force = selectedTool === 'scalpel' ? 0.8 : 0.3;
      onTissueInteraction(point, force, selectedTool);
    }
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  const handlePointerMove = (event: any) => {
    if (!isDragging || simulationState.status !== 'active') return;
    
    const intersects = raycaster.intersectObjects(scene.children, true);
    if (intersects.length > 0) {
      const intersection = intersects[0];
      const point = intersection.point;
      const force = 0.2; // Lighter force for movement
      onTissueInteraction(point, force, selectedTool);
    }
  };

  return (
    <group
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerMove={handlePointerMove}
    >
      {/* Enhanced Lighting Setup */}
      <ambientLight intensity={0.6} color="#ffffff" />
      <directionalLight 
        position={[10, 10, 5]} 
        intensity={1.2}
        color="#ffffff"
        castShadow 
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      <directionalLight 
        position={[-10, 10, -5]} 
        intensity={0.8}
        color="#f0f8ff"
      />
      <pointLight 
        position={[0, 15, 0]} 
        intensity={0.5}
        color="#ffffff"
        distance={20}
      />
      
      {/* Operating Room Environment */}
      <OperatingRoom />
      
      {/* Enhanced Surgical Table */}
      <SurgicalTable position={[0, 0, 0]} />
      
      {/* Tissue Model with better visibility */}
      <TissueModel 
        position={[0, 1.1, 0]}
        size={[2, 0.3, 1.5]}
        tissueType="skin"
        onDamage={(pos: any, severity: any) => console.log('Tissue damage:', pos, severity)}
      />
      
      {/* Floor for reference */}
      <mesh position={[0, -0.1, 0]} receiveShadow>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial 
          color="#f5f5f5" 
          roughness={0.8}
          metalness={0.1}
        />
      </mesh>      {/* Surgical tools */}
      <SurgicalTools
        selectedTool={selectedTool}
        isActive={simulationState.status === 'active'}
        position={[0.5, 0.5, 0]}
        rotation={[0, 0, 0]}
        onToolInteraction={(toolType, force, position) => {
          console.log('Tool interaction:', { toolType, force, position });
        }}
        collaborativeMode={true}
        userRole="surgeon"
      />      {/* Virtual Hands for other participants */}
      {simulationState.participants
        .filter(p => p.id !== userId && p.status === 'active')
        .map(participant => (
          <group key={participant.id}>
            {/* Participant cursor/hand indicator */}
            <mesh position={[Math.random() * 4 - 2, 2, Math.random() * 4 - 2]}>
              <sphereGeometry args={[0.05]} />
              <meshStandardMaterial color={getParticipantColor(participant.role)} />
            </mesh>
            {/* Participant name label */}
            <mesh position={[Math.random() * 4 - 2, 2.2, Math.random() * 4 - 2]}>
              <planeGeometry args={[1, 0.2]} />
              <meshBasicMaterial color="white" transparent opacity={0.8} />
            </mesh>
          </group>
        ))}

      {/* Lighting setup for surgical environment */}
      <group>
        {/* Main surgical lights */}
        <pointLight
          position={[0, 5, 0]}
          intensity={2}
          color="white"
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
        />
        
        {/* Secondary surgical lights */}
        <pointLight
          position={[-2, 4, 2]}
          intensity={1}
          color="white"
          castShadow
        />
        
        <pointLight
          position={[2, 4, 2]}
          intensity={1}
          color="white"
          castShadow
        />

        {/* Ambient room lighting */}
        <ambientLight intensity={0.3} color="#f0f8ff" />
      </group>

      {/* Grid floor for reference */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1, 0]} receiveShadow>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial
          color="#2a3441"
          transparent
          opacity={0.1}
        />
      </mesh>
    </group>
  );
}

// Helper function to get color based on participant role
function getParticipantColor(role: string): string {
  switch (role) {
    case 'surgeon':
      return '#ff4444';
    case 'assistant':
      return '#44ff44';
    case 'observer':
      return '#4444ff';
    default:
      return '#ffffff';
  }
}