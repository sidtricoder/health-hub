'use client';

import React, { useRef, useState, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Vector3, Raycaster, Mesh } from 'three';
import { Text } from '@react-three/drei';

interface EnhancedToolCursorProps {
  selectedTool: string | null;
  visible: boolean;
  userName: string;
  userId: string;
  onInteraction?: (position: Vector3, force: number, toolType: string) => void;
  isActive: boolean;
}

const TOOL_MODELS = {
  scalpel: {
    color: '#e74c3c',
    emissive: '#c0392b',
    scale: [0.05, 0.01, 0.25],
    shape: 'blade',
    icon: '🔪'
  },
  forceps: {
    color: '#3498db',
    emissive: '#2980b9',
    scale: [0.06, 0.03, 0.3],
    shape: 'clamp',
    icon: '🗜️'
  },
  suture: {
    color: '#2ecc71',
    emissive: '#27ae60',
    scale: [0.02, 0.02, 0.2],
    shape: 'needle',
    icon: '🪡'
  },
  cautery: {
    color: '#f39c12',
    emissive: '#e67e22',
    scale: [0.03, 0.03, 0.25],
    shape: 'pen',
    icon: '⚡'
  },
  syringe: {
    color: '#9b59b6',
    emissive: '#8e44ad',
    scale: [0.04, 0.04, 0.22],
    shape: 'syringe',
    icon: '💉'
  },
  clamp: {
    color: '#e67e22',
    emissive: '#d35400',
    scale: [0.05, 0.04, 0.28],
    shape: 'clamp',
    icon: '🔧'
  }
};

export function EnhancedToolCursor({
  selectedTool,
  visible,
  userName,
  userId,
  onInteraction,
  isActive
}: EnhancedToolCursorProps) {
  const meshRef = useRef<Mesh>(null);
  const { camera, gl, scene, raycaster: threeRaycaster, mouse } = useThree();
  const [worldPosition, setWorldPosition] = useState(new Vector3(0, 0, 0));
  const [isHovering, setIsHovering] = useState(false);
  const localRaycaster = useRef(new Raycaster());

  if (!selectedTool || !visible) return null;

  const toolConfig = TOOL_MODELS[selectedTool as keyof typeof TOOL_MODELS] || TOOL_MODELS.scalpel;

  // Update cursor position based on raycasting
  useFrame(() => {
    if (!meshRef.current || !isActive) return;

    // Use raycaster to project cursor onto surgical area
    localRaycaster.current.setFromCamera(mouse, camera);
    
    // Find intersection with objects in scene
    const intersects = localRaycaster.current.intersectObjects(scene.children, true);
    
    if (intersects.length > 0) {
      const intersection = intersects[0];
      // Position cursor slightly above the surface
      const pos = intersection.point.clone();
      pos.y += 0.1;
      setWorldPosition(pos);
      setIsHovering(true);
      
      // Apply interaction if dragging
      if (isActive && onInteraction) {
        const force = selectedTool === 'scalpel' ? 0.9 : 0.5;
        onInteraction(pos, force, selectedTool);
      }
    } else {
      // Default position in front of camera if no intersection
      const distance = 3;
      const direction = new Vector3();
      camera.getWorldDirection(direction);
      const pos = camera.position.clone().add(direction.multiplyScalar(distance));
      setWorldPosition(pos);
      setIsHovering(false);
    }

    // Update mesh position
    if (meshRef.current) {
      meshRef.current.position.lerp(worldPosition, 0.2);
      meshRef.current.lookAt(camera.position);
    }
  });

  const renderToolShape = () => {
    switch (toolConfig.shape) {
      case 'blade':
        return (
          <>
            {/* Blade */}
            <mesh position={[0, 0, 0.1]}>
              <boxGeometry args={[0.02, 0.01, 0.15]} />
              <meshStandardMaterial
                color={toolConfig.color}
                emissive={toolConfig.emissive}
                emissiveIntensity={0.4}
                metalness={0.9}
                roughness={0.1}
              />
            </mesh>
            {/* Handle */}
            <mesh position={[0, 0, -0.05]}>
              <cylinderGeometry args={[0.012, 0.012, 0.1, 8]} />
              <meshStandardMaterial color="#444444" metalness={0.6} roughness={0.4} />
            </mesh>
          </>
        );
      
      case 'clamp':
        return (
          <>
            {/* Upper jaw */}
            <mesh position={[0.01, 0, 0.12]}>
              <boxGeometry args={[0.02, 0.015, 0.12]} />
              <meshStandardMaterial
                color={toolConfig.color}
                emissive={toolConfig.emissive}
                emissiveIntensity={0.3}
                metalness={0.8}
                roughness={0.2}
              />
            </mesh>
            {/* Lower jaw */}
            <mesh position={[-0.01, 0, 0.12]}>
              <boxGeometry args={[0.02, 0.015, 0.12]} />
              <meshStandardMaterial
                color={toolConfig.color}
                emissive={toolConfig.emissive}
                emissiveIntensity={0.3}
                metalness={0.8}
                roughness={0.2}
              />
            </mesh>
            {/* Handle */}
            <mesh position={[0, 0, -0.05]}>
              <cylinderGeometry args={[0.015, 0.015, 0.1, 8]} />
              <meshStandardMaterial color="#555555" metalness={0.6} roughness={0.4} />
            </mesh>
          </>
        );
      
      case 'needle':
        return (
          <>
            {/* Needle */}
            <mesh position={[0, 0, 0.08]}>
              <cylinderGeometry args={[0.005, 0.005, 0.16, 6]} />
              <meshStandardMaterial
                color={toolConfig.color}
                emissive={toolConfig.emissive}
                emissiveIntensity={0.4}
                metalness={0.7}
                roughness={0.2}
              />
            </mesh>
            {/* Thread */}
            <mesh position={[0, 0, -0.04]}>
              <cylinderGeometry args={[0.003, 0.003, 0.08, 4]} />
              <meshStandardMaterial color="#27ae60" />
            </mesh>
          </>
        );
      
      case 'pen':
        return (
          <>
            {/* Tip */}
            <mesh position={[0, 0, 0.1]}>
              <coneGeometry args={[0.015, 0.03, 8]} />
              <meshStandardMaterial
                color={toolConfig.color}
                emissive={toolConfig.emissive}
                emissiveIntensity={isActive ? 0.8 : 0.4}
                metalness={0.8}
                roughness={0.2}
              />
            </mesh>
            {/* Body */}
            <mesh position={[0, 0, 0]}>
              <cylinderGeometry args={[0.015, 0.015, 0.2, 8]} />
              <meshStandardMaterial color="#666666" metalness={0.6} roughness={0.3} />
            </mesh>
          </>
        );
      
      case 'syringe':
        return (
          <>
            {/* Needle */}
            <mesh position={[0, 0, 0.13]}>
              <cylinderGeometry args={[0.003, 0.003, 0.06, 6]} />
              <meshStandardMaterial color="#cccccc" metalness={0.9} roughness={0.1} />
            </mesh>
            {/* Barrel */}
            <mesh position={[0, 0, 0.05]}>
              <cylinderGeometry args={[0.02, 0.02, 0.1, 8]} />
              <meshStandardMaterial
                color={toolConfig.color}
                emissive={toolConfig.emissive}
                emissiveIntensity={0.3}
                transparent
                opacity={0.7}
              />
            </mesh>
            {/* Plunger */}
            <mesh position={[0, 0, -0.03]}>
              <cylinderGeometry args={[0.015, 0.015, 0.06, 8]} />
              <meshStandardMaterial color="#333333" />
            </mesh>
          </>
        );
      
      default:
        return (
          <mesh>
            <boxGeometry args={toolConfig.scale as [number, number, number]} />
            <meshStandardMaterial
              color={toolConfig.color}
              emissive={toolConfig.emissive}
              emissiveIntensity={0.4}
              metalness={0.7}
              roughness={0.2}
            />
          </mesh>
        );
    }
  };

  return (
    <group position={worldPosition.toArray()}>
      {/* Tool Model */}
      <group ref={meshRef} rotation={[0, 0, 0]}>
        {renderToolShape()}
        
        {/* Glow effect when hovering */}
        {isHovering && (
          <mesh scale={[1.5, 1.5, 1.5]}>
            <sphereGeometry args={[0.08]} />
            <meshBasicMaterial
              color={toolConfig.color}
              transparent
              opacity={0.2}
            />
          </mesh>
        )}
        
        {/* Active indicator when dragging */}
        {isActive && (
          <>
            <pointLight
              color={toolConfig.color}
              intensity={1.5}
              distance={1}
            />
            <mesh>
              <sphereGeometry args={[0.05]} />
              <meshBasicMaterial
                color={toolConfig.color}
                transparent
                opacity={0.5}
              />
            </mesh>
          </>
        )}
      </group>

      {/* Doctor Name Label */}
      <group position={[0, 0.3, 0]}>
        {/* Background plate */}
        <mesh position={[0, 0, -0.01]}>
          <planeGeometry args={[0.8, 0.15]} />
          <meshBasicMaterial
            color="#000000"
            transparent
            opacity={0.75}
          />
        </mesh>
        
        {/* Doctor name text */}
        <Text
          position={[0, 0, 0]}
          fontSize={0.08}
          color="white"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.005}
          outlineColor="#000000"
        >
          {userName}
        </Text>
      </group>

      {/* Tool name below doctor name */}
      <group position={[0, 0.15, 0]}>
        <Text
          fontSize={0.06}
          color={toolConfig.color}
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.003}
          outlineColor="#000000"
        >
          {selectedTool.toUpperCase()}
        </Text>
      </group>

      {/* Crosshair for precision */}
      {isHovering && (
        <group position={[0, -0.15, 0]}>
          {/* Horizontal */}
          <mesh>
            <boxGeometry args={[0.3, 0.01, 0.01]} />
            <meshBasicMaterial color="white" transparent opacity={0.6} />
          </mesh>
          {/* Vertical */}
          <mesh>
            <boxGeometry args={[0.01, 0.3, 0.01]} />
            <meshBasicMaterial color="white" transparent opacity={0.6} />
          </mesh>
        </group>
      )}
    </group>
  );
}

// Hook to manage tool cursor interaction
export function useToolCursor(selectedTool: string | null, isActive: boolean, onInteraction: (pos: Vector3, force: number, tool: string) => void) {
  const [isDragging, setIsDragging] = useState(false);
  const [cursorEnabled, setCursorEnabled] = useState(true);

  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      if (isActive && selectedTool && cursorEnabled) {
        setIsDragging(true);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setCursorEnabled(prev => !prev);
        setIsDragging(false);
      }
    };

    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isActive, selectedTool, cursorEnabled]);

  return { isDragging, cursorEnabled, setCursorEnabled };
}
