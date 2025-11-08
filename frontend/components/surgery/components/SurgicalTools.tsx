'use client';

import React, { useRef, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useBox, useSphere } from '@react-three/cannon';
import { Vector3, Color, BufferGeometry, Float32BufferAttribute } from 'three';
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

  // Tool specifications
  const toolSpecs = {
    scalpel: { 
      mass: 0.1, 
      size: [0.005, 0.001, 0.1] as [number, number, number],
      color: '#c0c0c0',
      cuttingForce: 10,
      precision: 0.95
    },
    forceps: { 
      mass: 0.15, 
      size: [0.01, 0.01, 0.15] as [number, number, number],
      color: '#a0a0a0',
      cuttingForce: 5,
      precision: 0.8
    },
    suction: { 
      mass: 0.2, 
      size: [0.015, 0.015, 0.1] as [number, number, number],
      color: '#808080',
      cuttingForce: 0,
      precision: 0.7
    },
    cautery: { 
      mass: 0.08, 
      size: [0.003, 0.003, 0.12] as [number, number, number],
      color: '#ffaa00',
      cuttingForce: 15,
      precision: 0.9
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
    
    const impactVelocity = collision.contact.impactVelocity;
    const contactPoint = new Vector3(
      collision.contact.bi.position.x,
      collision.contact.bi.position.y,
      collision.contact.bi.position.z
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

  // Tool geometry
  const toolGeometry = useMemo(() => {
    const geometry = new BufferGeometry();
    
    switch (selectedTool) {
      case 'scalpel':
        // Blade-like geometry
        const scalpelVertices = new Float32Array([
          0, 0, -currentTool.size[2]/2,
          currentTool.size[0]/2, 0, currentTool.size[2]/2,
          -currentTool.size[0]/2, 0, currentTool.size[2]/2,
          0, currentTool.size[1], 0
        ]);
        geometry.setAttribute('position', new Float32BufferAttribute(scalpelVertices, 3));
        break;
        
      case 'forceps':
        // Two-pronged geometry (simplified)
        const forcepsVertices = new Float32Array([
          -currentTool.size[0]/4, 0, -currentTool.size[2]/2,
          -currentTool.size[0]/4, 0, currentTool.size[2]/2,
          currentTool.size[0]/4, 0, -currentTool.size[2]/2,
          currentTool.size[0]/4, 0, currentTool.size[2]/2,
          0, currentTool.size[1]/2, -currentTool.size[2]/2,
          0, currentTool.size[1]/2, currentTool.size[2]/2
        ]);
        geometry.setAttribute('position', new Float32BufferAttribute(forcepsVertices, 3));
        break;
        
      default:
        // Default cylindrical tool
        return null; // Use default geometry
    }
    
    return geometry;
  }, [selectedTool, currentTool]);

  // Tool glow effect when active
  const toolColor = useMemo(() => {
    if (isColliding) return new Color('#ff0000');
    if (cutting) return new Color('#ffaa00');
    if (isActive) return new Color(currentTool.color).multiplyScalar(1.2);
    return new Color(currentTool.color);
  }, [isColliding, cutting, isActive, currentTool.color]);

  return (
    <group>
      {/* Main tool body */}
      <mesh ref={ref} geometry={toolGeometry || undefined}>
        {!toolGeometry && <boxGeometry args={currentTool.size} />}
        <meshPhongMaterial 
          color={toolColor} 
          transparent={collaborativeMode && userRole === 'observer'}
          opacity={collaborativeMode && userRole === 'observer' ? 0.5 : 1}
          emissive={isActive ? toolColor.clone().multiplyScalar(0.2) : new Color(0x000000)}
        />
      </mesh>

      {/* Tool handle */}
      <mesh position={[0, 0, -currentTool.size[2] * 0.8]}>
        <cylinderGeometry args={[currentTool.size[0] * 2, currentTool.size[0] * 2, currentTool.size[2] * 0.6]} />
        <meshPhongMaterial color="#2a2a2a" />
      </mesh>

      {/* Active tool indicator */}
      {isActive && (
        <mesh position={[0, currentTool.size[1] + 0.01, 0]}>
          <sphereGeometry args={[0.005]} />
          <meshBasicMaterial color="#00ff00" transparent opacity={0.8} />
        </mesh>
      )}

      {/* Tool trails for cutting visualization */}
      {toolTrails.map(trail => (
        <line key={trail.id}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              args={[new Float32Array(trail.points.flatMap(p => [p.x, p.y, p.z])), 3]}
            />
          </bufferGeometry>
          <lineBasicMaterial 
            color={selectedTool === 'cautery' ? '#ffaa00' : '#ff0000'}
            transparent
            opacity={trail.intensity * 0.8}
            linewidth={trail.intensity * 5}
          />
        </line>
      ))}

      {/* Precision indicator ring */}
      {userRole === 'surgeon' && (
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, currentTool.size[2] / 2 + 0.005]}>
          <ringGeometry args={[currentTool.size[0] * 3, currentTool.size[0] * 4]} />
          <meshBasicMaterial 
            color={`hsl(${currentTool.precision * 120}, 70%, 50%)`}
            transparent 
            opacity={0.3} 
          />
        </mesh>
      )}

      {/* Collision effect */}
      {isColliding && (
        <mesh>
          <sphereGeometry args={[currentTool.size[0] * 5]} />
          <meshBasicMaterial 
            color="#ffaa00" 
            transparent 
            opacity={0.4}
            wireframe
          />
        </mesh>
      )}

      {/* User role indicator */}
      {collaborativeMode && (
        <mesh position={[0, currentTool.size[1] + 0.02, 0]}>
          <boxGeometry args={[0.01, 0.002, 0.005]} />
          <meshBasicMaterial 
            color={
              userRole === 'surgeon' ? '#00ff00' : 
              userRole === 'assistant' ? '#0088ff' : 
              '#888888'
            }
          />
        </mesh>
      )}
    </group>
  );
}