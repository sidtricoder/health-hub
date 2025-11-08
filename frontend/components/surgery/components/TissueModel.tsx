'use client';

import React, { useRef, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useSphere, useBox } from '@react-three/cannon';
import { Vector3, Color } from 'three';
import { Vec3 } from 'cannon-es';

interface TissueModelProps {
  position?: [number, number, number];
  size?: [number, number, number];
  resolution?: number;
  tissueType?: 'skin' | 'muscle' | 'organ' | 'bone';
  onDamage?: (position: Vector3, severity: number) => void;
  onHealing?: (position: Vector3) => void;
  interactionEnabled?: boolean;
}

interface TissuePoint {
  position: Vector3;
  originalPosition: Vector3;
  velocity: Vector3;
  mass: number;
  constraints: number[];
  damaged: boolean;
  damageLevel: number;
  healingRate: number;
}

interface DamageMarker {
  position: Vector3;
  severity: number;
  timestamp: number;
  healing: boolean;
}

export function TissueModel({
  position = [0, 0, 0],
  size = [1, 0.2, 1],
  resolution = 10,
  tissueType = 'skin',
  onDamage,
  onHealing,
  interactionEnabled = true
}: TissueModelProps): React.ReactElement {
  const meshRef = useRef<any>(null);
  const [tissuePoints, setTissuePoints] = useState<TissuePoint[]>([]);
  const [damageMarkers, setDamageMarkers] = useState<DamageMarker[]>([]);
  const [deformation, setDeformation] = useState<Float32Array | null>(null);

  // Tissue properties based on type
  const tissueProperties = useMemo(() => {
    switch (tissueType) {
      case 'skin':
        return {
          elasticity: 0.8,
          viscosity: 0.1,
          damping: 0.95,
          color: '#f4c2a1',
          emissive: '#000000',
          roughness: 0.7,
          healingRate: 0.02,
          maxDamage: 0.8
        };
      case 'muscle':
        return {
          elasticity: 0.6,
          viscosity: 0.3,
          damping: 0.9,
          color: '#b85450',
          emissive: '#110000',
          roughness: 0.8,
          healingRate: 0.01,
          maxDamage: 0.9
        };
      case 'organ':
        return {
          elasticity: 0.4,
          viscosity: 0.5,
          damping: 0.85,
          color: '#8b4a47',
          emissive: '#220000',
          roughness: 0.9,
          healingRate: 0.005,
          maxDamage: 0.6
        };
      case 'bone':
        return {
          elasticity: 0.1,
          viscosity: 0.8,
          damping: 0.99,
          color: '#f5f5dc',
          emissive: '#000000',
          roughness: 0.3,
          healingRate: 0.001,
          maxDamage: 0.3
        };
      default:
        return {
          elasticity: 0.8,
          viscosity: 0.1,
          damping: 0.95,
          color: '#f4c2a1',
          emissive: '#000000',
          roughness: 0.7,
          healingRate: 0.02,
          maxDamage: 0.8
        };
    }
  }, [tissueType]);

  // Physics body for collision detection
  const [ref, api] = useBox(() => ({
    mass: 10,
    position,
    args: size,
    userData: { type: 'tissue', tissueType },
    onCollide: (e) => {
      if (interactionEnabled && e.body?.userData?.type === 'surgicalTool') {
        handleToolInteraction(e);
      }
    },
  }));

  // Initialize tissue grid
  React.useEffect(() => {
    const points: TissuePoint[] = [];
    const step = [size[0] / resolution, size[1] / 4, size[2] / resolution];
    
    for (let x = 0; x <= resolution; x++) {
      for (let z = 0; z <= resolution; z++) {
        const worldPos = new Vector3(
          position[0] + (x - resolution / 2) * step[0],
          position[1],
          position[2] + (z - resolution / 2) * step[2]
        );
        
        points.push({
          position: worldPos.clone(),
          originalPosition: worldPos.clone(),
          velocity: new Vector3(0, 0, 0),
          mass: 0.1,
          constraints: [],
          damaged: false,
          damageLevel: 0,
          healingRate: tissueProperties.healingRate
        });
      }
    }
    
    setTissuePoints(points);
  }, [position, size, resolution, tissueProperties.healingRate]);

  // Handle tool interactions
  const handleToolInteraction = React.useCallback((collision: any) => {
    const impact = collision.contact?.impactVelocity || 0;
    const contactPoint = new Vector3(
      collision.contact?.bi?.position?.x || 0,
      collision.contact?.bi?.position?.y || 0,
      collision.contact?.bi?.position?.z || 0
    );

    const toolType = collision.body?.userData?.toolType;
    let damage = 0;

    // Calculate damage based on tool and impact
    switch (toolType) {
      case 'scalpel':
        damage = Math.min(impact * 0.05, 0.8);
        break;
      case 'cautery':
        damage = Math.min(impact * 0.03, 0.6);
        break;
      case 'forceps':
        damage = Math.min(impact * 0.02, 0.3);
        break;
      default:
        damage = Math.min(impact * 0.01, 0.2);
    }

    if (damage > 0.05) {
      // Create damage marker
      const newMarker: DamageMarker = {
        position: contactPoint,
        severity: damage,
        timestamp: Date.now(),
        healing: false
      };
      
      setDamageMarkers(prev => [...prev, newMarker].slice(-20)); // Keep last 20 markers
      
      // Apply deformation to nearby tissue points
      setTissuePoints(prev => prev.map(point => {
        const distance = point.position.distanceTo(contactPoint);
        if (distance < 0.1) {
          const damageAmount = damage * (1 - distance / 0.1);
          return {
            ...point,
            damaged: true,
            damageLevel: Math.min(point.damageLevel + damageAmount, tissueProperties.maxDamage),
            position: point.position.clone().add(
              new Vector3(
                (Math.random() - 0.5) * damageAmount * 0.1,
                -damageAmount * 0.05,
                (Math.random() - 0.5) * damageAmount * 0.1
              )
            )
          };
        }
        return point;
      }));

      if (onDamage) {
        onDamage(contactPoint, damage);
      }
    }
  }, [tissueProperties.maxDamage, onDamage]);

  // Tissue simulation and healing
  useFrame((state, delta) => {
    // Update tissue physics and healing
    setTissuePoints(prev => prev.map(point => {
      if (point.damaged && point.damageLevel > 0) {
        // Healing process
        const healingAmount = point.healingRate * delta;
        const newDamageLevel = Math.max(0, point.damageLevel - healingAmount);
        
        // Gradually return to original position
        const returnForce = point.originalPosition.clone()
          .sub(point.position)
          .multiplyScalar(tissueProperties.elasticity * delta);
        
        return {
          ...point,
          damageLevel: newDamageLevel,
          damaged: newDamageLevel > 0.01,
          position: point.position.clone().add(returnForce),
          velocity: point.velocity.clone().multiplyScalar(tissueProperties.damping)
        };
      }
      return point;
    }));

    // Update damage markers
    setDamageMarkers(prev => prev.map(marker => {
      const age = Date.now() - marker.timestamp;
      if (age > 10000 && !marker.healing) { // Start healing after 10 seconds
        if (onHealing) {
          onHealing(marker.position);
        }
        return { ...marker, healing: true };
      }
      return marker;
    }).filter(marker => Date.now() - marker.timestamp < 30000)); // Remove after 30 seconds
  });

  // Calculate tissue color based on damage
  const tissueColor = useMemo(() => {
    const avgDamage = tissuePoints.length > 0 
      ? tissuePoints.reduce((sum, point) => sum + point.damageLevel, 0) / tissuePoints.length
      : 0;
    
    const baseColor = new Color(tissueProperties.color);
    const damageColor = new Color('#8b0000'); // Dark red for damage
    
    return baseColor.lerp(damageColor, avgDamage);
  }, [tissuePoints, tissueProperties.color]);

  return (
    <group>
      {/* Main tissue body */}
      <mesh ref={ref} castShadow receiveShadow>
        <boxGeometry args={size} />
        <meshPhongMaterial 
          color={tissueColor}
          emissive={tissueProperties.emissive}
          transparent
          opacity={0.9}
        />
      </mesh>

      {/* Tissue surface detail */}
      <mesh position={[0, size[1] / 2 + 0.001, 0]} castShadow receiveShadow>
        <planeGeometry args={[size[0], size[2]]} />
        <meshPhongMaterial 
          color={tissueColor.clone().multiplyScalar(1.1)}
          transparent
          opacity={0.8}
        />
      </mesh>

      {/* Damage markers */}
      {damageMarkers.map((marker, index) => (
        <mesh key={index} position={marker.position.toArray()}>
          <sphereGeometry args={[marker.severity * 0.02]} />
          <meshBasicMaterial 
            color={marker.healing ? '#ff6b6b' : '#ff0000'}
            transparent
            opacity={marker.healing ? 0.3 : 0.8}
          />
        </mesh>
      ))}

      {/* Tissue points visualization (for debugging) */}
      {tissuePoints.slice(0, 50).map((point, index) => ( // Show only first 50 for performance
        point.damaged && (
          <mesh key={index} position={point.position.toArray()}>
            <sphereGeometry args={[0.005]} />
            <meshBasicMaterial 
              color={`hsl(${(1 - point.damageLevel) * 60}, 70%, 50%)`}
              transparent
              opacity={0.6}
            />
          </mesh>
        )
      ))}

      {/* Tissue type indicator */}
      <mesh position={[size[0] / 2 - 0.05, size[1] / 2 + 0.02, size[2] / 2 - 0.05]}>
        <planeGeometry args={[0.1, 0.02]} />
        <meshBasicMaterial color="white" transparent opacity={0.8} />
      </mesh>
    </group>
  );
}