'use client';

import React, { useRef, useState, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Vector3, Vector2, Color, Raycaster } from 'three';

interface ToolCursorProps {
  selectedTool: string;
  visible: boolean;
  position: [number, number, number];
  onInteraction?: (position: Vector3, force: number) => void;
}

const TOOL_CURSORS = {
  scalpel: {
    geometry: 'box',
    size: [0.02, 0.005, 0.15],
    color: '#ff4444',
    icon: '🔪'
  },
  forceps: {
    geometry: 'box',
    size: [0.03, 0.02, 0.18],
    color: '#4488ff',
    icon: '🗜️'
  },
  suture: {
    geometry: 'cylinder',
    size: [0.01, 0.01, 0.12],
    color: '#44ff44',
    icon: '🪡'
  },
  cautery: {
    geometry: 'cylinder',
    size: [0.015, 0.015, 0.16],
    color: '#ffaa00',
    icon: '⚡'
  },
  syringe: {
    geometry: 'cylinder',
    size: [0.02, 0.02, 0.14],
    color: '#aa44ff',
    icon: '💉'
  },
  clamp: {
    geometry: 'box',
    size: [0.025, 0.02, 0.16],
    color: '#ff8844',
    icon: '📎'
  }
};

export function ToolCursor({ selectedTool, visible, position, onInteraction }: ToolCursorProps) {
  const meshRef = useRef<any>(null);
  const { camera, gl, scene } = useThree();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [worldPosition, setWorldPosition] = useState(new Vector3(...position));
  const [isClicking, setIsClicking] = useState(false);

  const toolConfig = TOOL_CURSORS[selectedTool as keyof typeof TOOL_CURSORS] || TOOL_CURSORS.scalpel;

  // Track mouse position for 3D cursor
  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      const rect = gl.domElement.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      setMousePosition({ x, y });
    };

    const handleMouseDown = () => setIsClicking(true);
    const handleMouseUp = () => setIsClicking(false);

    if (visible) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mousedown', handleMouseDown);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [visible, gl.domElement]);

  // Update 3D position based on mouse
  useFrame(() => {
    if (!visible || !meshRef.current) return;

    // Cast ray from camera through mouse position
    const raycaster = new Raycaster();
    const mouseVector = new Vector2(mousePosition.x, mousePosition.y);
    raycaster.setFromCamera(mouseVector, camera);

    // Project mouse position to a fixed distance from camera
    const distance = 5;
    const direction = new Vector3(mousePosition.x, mousePosition.y, -0.5).unproject(camera).sub(camera.position).normalize();
    const newPosition = camera.position.clone().add(direction.multiplyScalar(distance));
    
    setWorldPosition(newPosition);
    meshRef.current.position.copy(newPosition);

    // Handle interaction on click
    if (isClicking && onInteraction) {
      const force = Math.random() * 10 + 5; // Simulate interaction force
      onInteraction(newPosition, force);
      setIsClicking(false);
    }
  });

  if (!visible) return null;

  const createToolGeometry = () => {
    switch (toolConfig.geometry) {
      case 'cylinder':
        return <cylinderGeometry args={[toolConfig.size[0], toolConfig.size[0], toolConfig.size[2], 8]} />;
      default:
        return <boxGeometry args={toolConfig.size as [number, number, number]} />;
    }
  };

  return (
    <group>
      {/* Main cursor tool */}
      <mesh ref={meshRef} scale={[4, 4, 4]}>
        {createToolGeometry()}
        <meshStandardMaterial 
          color={toolConfig.color}
          metalness={0.8}
          roughness={0.2}
          emissive={toolConfig.color}
          emissiveIntensity={0.3}
          transparent
          opacity={0.9}
        />
      </mesh>

      {/* Cursor glow effect */}
      <mesh position={worldPosition.toArray()} scale={[6, 6, 6]}>
        <sphereGeometry args={[Math.max(...toolConfig.size)]} />
        <meshBasicMaterial 
          color={toolConfig.color}
          transparent
          opacity={0.2}
        />
      </mesh>

      {/* Crosshair for precision */}
      <group position={worldPosition.toArray()}>
        {/* Horizontal line */}
        <mesh>
          <boxGeometry args={[0.4, 0.01, 0.01]} />
          <meshBasicMaterial color="white" transparent opacity={0.8} />
        </mesh>
        {/* Vertical line */}
        <mesh>
          <boxGeometry args={[0.01, 0.4, 0.01]} />
          <meshBasicMaterial color="white" transparent opacity={0.8} />
        </mesh>
      </group>

      {/* Tool name label */}
      <mesh position={[worldPosition.x, worldPosition.y + 0.3, worldPosition.z]}>
        <planeGeometry args={[0.6, 0.15]} />
        <meshBasicMaterial 
          color="black" 
          transparent 
          opacity={0.7}
        />
      </mesh>

      {/* Interaction indicator */}
      {isClicking && (
        <mesh position={worldPosition.toArray()} scale={[8, 8, 8]}>
          <sphereGeometry args={[0.05]} />
          <meshBasicMaterial 
            color="#ffff00"
            transparent
            opacity={0.8}
          />
        </mesh>
      )}
    </group>
  );
}