'use client';

import React, { useRef, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useBox } from '@react-three/cannon';
import { Vector3, Color, CylinderGeometry, BoxGeometry } from 'three';
import { SurgicalToolPhysics, calculateCuttingForce, TISSUE_TYPES } from '../utils/physics';
import { Vec3 } from 'cannon-es';

interface SurgicalToolsProps {
  selectedTool: string;
  isActive: boolean;
  position: [number, number, number];
  rotation: [number, number, number];
  onToolInteraction: (toolType: string, force: number, position: Vector3) => void;
  collaborativeMode?: boolean;
  userRole?: 'surgeon' | 'assistant' | 'observer';
}

interface ToolTrail {
  id: string;
  points: Vector3[];
  timestamp: number;
  intensity: number;
}

export function SurgicalTools({ 
  selectedTool, 
  isActive, 
  position, 
  rotation,
  onToolInteraction,
  collaborativeMode = false,
  userRole = 'surgeon'
}: SurgicalToolsProps): React.ReactElement {
  const toolRef = useRef<any>(null);
  const [isColliding, setIsColliding] = useState(false);
  const [toolTrails, setToolTrails] = useState<ToolTrail[]>([]);
  const [lastPosition, setLastPosition] = useState(new Vector3(...position));
  const [cutting, setCutting] = useState(false);

  // Tool specifications with larger, more visible sizes
  const toolSpecs = {
    scalpel: { 
      mass: 0.1, 
      size: [0.02, 0.005, 0.15] as [number, number, number],
      color: '#c0c0c0',
      cuttingForce: 10,
      precision: 0.95
    },
    forceps: { 
      mass: 0.15, 
      size: [0.03, 0.02, 0.18] as [number, number, number],
      color: '#a0a0a0',
      cuttingForce: 5,
      precision: 0.8
    },
    suture: { 
      mass: 0.05, 
      size: [0.01, 0.01, 0.12] as [number, number, number],
      color: '#4a90e2',
      cuttingForce: 0,
      precision: 0.9
    },
    cautery: { 
      mass: 0.08, 
      size: [0.015, 0.015, 0.16] as [number, number, number],
      color: '#ffaa00',
      cuttingForce: 15,
      precision: 0.9
    },
    syringe: { 
      mass: 0.12, 
      size: [0.02, 0.02, 0.14] as [number, number, number],
      color: '#50c878',
      cuttingForce: 0,
      precision: 0.7
    },
    clamp: { 
      mass: 0.18, 
      size: [0.025, 0.02, 0.16] as [number, number, number],
      color: '#8b4513',
      cuttingForce: 3,
      precision: 0.8
    }
  };

  const currentTool = toolSpecs[selectedTool as keyof typeof toolSpecs] || toolSpecs.scalpel;

  // Physics body for the tool
  const [ref, api] = useBox(() => ({
    mass: currentTool.mass,
    position,
    rotation,
    args: currentTool.size,
    userData: { type: 'surgicalTool', toolType: selectedTool },
    onCollide: (e) => {
      handleCollision(e);
    },
  }));

  // Handle physics collisions
  const handleCollision = (collision: any) => {
    setIsColliding(true);
    
    const impactVelocity = collision.contact?.impactVelocity || 0;
    const contactPoint = new Vector3(
      collision.contact?.bi?.position?.x || 0,
      collision.contact?.bi?.position?.y || 0,
      collision.contact?.bi?.position?.z || 0
    );

    // Calculate cutting force based on tool type and impact
    const cuttingForce = calculateCuttingForce(
      selectedTool, 
      TISSUE_TYPES.SKIN, // Default tissue type
      impactVelocity
    );

    // Check if tool is in cutting mode
    if (isActive && userRole !== 'observer') {
      if (selectedTool === 'scalpel' || selectedTool === 'cautery') {
        setCutting(true);
        createToolTrail(contactPoint, cuttingForce);
      }
      
      onToolInteraction(selectedTool, cuttingForce, contactPoint);
    }

    // Reset collision state
    setTimeout(() => setIsColliding(false), 100);
  };

  // Create visual trail for cutting tools
  const createToolTrail = (point: Vector3, intensity: number) => {
    const newTrail: ToolTrail = {
      id: `trail_${Date.now()}`,
      points: [point.clone()],
      timestamp: Date.now(),
      intensity: Math.min(intensity / 20, 1)
    };

    setToolTrails(prev => {
      // Add new trail point to active trail or create new trail
      const activeTrail = prev.find(trail => Date.now() - trail.timestamp < 200);
      if (activeTrail) {
        activeTrail.points.push(point.clone());
        return [...prev];
      } else {
        return [...prev, newTrail].slice(-10); // Keep only last 10 trails
      }
    });
  };

  // Update tool position and trails
  useFrame((state, delta) => {
    if (ref.current) {
      const currentPos = new Vector3(
        ref.current.position.x,
        ref.current.position.y,
        ref.current.position.z
      );

      // Check for movement to detect cutting motion
      const movement = currentPos.distanceTo(lastPosition);
      if (movement > 0.001 && isActive) {
        setLastPosition(currentPos);
      }

      // Update tool trails
      setToolTrails(prev => 
        prev.map(trail => ({
          ...trail,
          intensity: Math.max(0, trail.intensity - delta * 2) // Fade trails
        })).filter(trail => trail.intensity > 0.1) // Remove faded trails
      );

      // Reset cutting state
      if (cutting) {
        setTimeout(() => setCutting(false), 50);
      }
    }
  });

  // Tool color with better visibility
  const toolColor = useMemo(() => {
    if (isColliding) return new Color('#ff0000');
    if (cutting) return new Color('#ffaa00');
    if (isActive) return new Color(currentTool.color).multiplyScalar(1.5);
    return new Color(currentTool.color);
  }, [isColliding, cutting, isActive, currentTool.color]);

  // Create tool-specific geometry
  const createToolGeometry = () => {
    switch (selectedTool) {
      case 'scalpel':
        return <boxGeometry args={currentTool.size} />;
      case 'forceps':
        return <boxGeometry args={currentTool.size} />;
      case 'syringe':
        return <cylinderGeometry args={[currentTool.size[0], currentTool.size[0] * 0.7, currentTool.size[2], 8]} />;
      case 'cautery':
        return <cylinderGeometry args={[currentTool.size[0] * 0.5, currentTool.size[0] * 0.8, currentTool.size[2], 6]} />;
      case 'suture':
        return <cylinderGeometry args={[currentTool.size[0] * 0.3, currentTool.size[0], currentTool.size[2], 8]} />;
      case 'clamp':
        return <boxGeometry args={currentTool.size} />;
      default:
        return <boxGeometry args={currentTool.size} />;
    }
  };

  return (
    <group>
      {/* Main tool body with much larger, more visible design */}
      <mesh 
        ref={ref} 
        castShadow
        receiveShadow
        scale={[3, 3, 3]} // Make tools 3x larger for better visibility
      >
        {createToolGeometry()}
        <meshStandardMaterial 
          color={toolColor}
          metalness={0.8}
          roughness={0.2}
          transparent={collaborativeMode && userRole === 'observer'}
          opacity={collaborativeMode && userRole === 'observer' ? 0.5 : 1}
          emissive={isActive ? toolColor.clone().multiplyScalar(0.3) : new Color(0x000000)}
        />
      </mesh>

      {/* Enhanced tool handle for better grip visualization */}
      <mesh 
        position={[0, 0, -currentTool.size[2] * 0.7]} 
        castShadow
        scale={[3, 3, 3]} // Scale handle too
      >
        <cylinderGeometry args={[currentTool.size[0] * 2, currentTool.size[0] * 2, currentTool.size[2] * 0.6]} />
        <meshStandardMaterial 
          color="#1a1a1a" 
          metalness={0.9}
          roughness={0.1}
        />
      </mesh>

      {/* Bright glow effect for active tool */}
      {isActive && (
        <>
          <mesh position={[0, currentTool.size[1] * 3 + 0.1, 0]} scale={[2, 2, 2]}>
            <sphereGeometry args={[0.03]} />
            <meshBasicMaterial 
              color="#00ff00" 
              transparent 
              opacity={0.8}
            />
          </mesh>
          
          {/* Pulsing ring indicator */}
          <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, currentTool.size[2] * 3 / 2 + 0.05]} scale={[3, 3, 1]}>
            <ringGeometry args={[currentTool.size[0] * 3, currentTool.size[0] * 4]} />
            <meshBasicMaterial 
              color="#00ff88"
              transparent 
              opacity={0.6} 
            />
          </mesh>
        </>
      )}

      {/* Tool name label - much larger and more visible */}
      <group position={[0, currentTool.size[1] * 3 + 0.15, 0]}>
        <mesh>
          <planeGeometry args={[0.4, 0.08]} />
          <meshBasicMaterial 
            color="white" 
            transparent 
            opacity={0.95}
          />
        </mesh>
        {/* Text would need a text geometry library - showing placeholder */}
      </group>

      {/* Role indicator for collaborative mode */}
      {collaborativeMode && (
        <mesh position={[0, currentTool.size[1] * 3 + 0.2, 0]} scale={[2, 2, 2]}>
          <boxGeometry args={[0.08, 0.02, 0.04]} />
          <meshBasicMaterial 
            color={
              userRole === 'surgeon' ? '#ff0066' : 
              userRole === 'assistant' ? '#0088ff' : 
              '#888888'
            }
          />
        </mesh>
      )}

      {/* Enhanced collision effect */}
      {isColliding && (
        <>
          <mesh scale={[4, 4, 4]}>
            <sphereGeometry args={[Math.max(...currentTool.size) * 2]} />
            <meshBasicMaterial 
              color="#ffaa00" 
              transparent 
              opacity={0.4}
              wireframe
            />
          </mesh>
          
          {/* Spark effects */}
          {[...Array(6)].map((_, i) => (
            <mesh 
              key={i}
              position={[
                (Math.random() - 0.5) * 0.2,
                (Math.random() - 0.5) * 0.2,
                (Math.random() - 0.5) * 0.2
              ]}
            >
              <sphereGeometry args={[0.01]} />
              <meshBasicMaterial color="#ffff00" />
            </mesh>
          ))}
        </>
      )}

      {/* Tool trail visualization */}
      {cutting && (
        <mesh>
          <sphereGeometry args={[currentTool.size[0] * 6]} />
          <meshBasicMaterial 
            color="#ff4444"
            transparent
            opacity={0.3}
          />
        </mesh>
      )}

      {/* Bright outline for better visibility */}
      <mesh scale={[3.2, 3.2, 3.2]}>
        {createToolGeometry()}
        <meshBasicMaterial 
          color={isActive ? "#00ff88" : "#ffffff"}
          transparent
          opacity={0.3}
          wireframe
        />
      </mesh>
    </group>
  );
}