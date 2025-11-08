'use client';

import React, { useRef, useMemo, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { useBox } from '@react-three/cannon';
import * as THREE from 'three';
import { Vec3 } from 'cannon-es';
import { 
  SoftBody, 
  BloodSystem, 
  TISSUE_TYPES, 
  TissueProperties
} from '../utils/physics';

interface BloodParticleData {
  position: [number, number, number];
  life: number;
  size: number;
}

interface SoftBodyTissueProps {
  position: [number, number, number];
  size: [number, number, number];
  tissueType?: keyof typeof TISSUE_TYPES;
  onInteraction?: (force: Vec3, point: Vec3) => void;
}

export default function SoftBodyTissue({ 
  position, 
  size, 
  tissueType = 'SKIN',
  onInteraction 
}: SoftBodyTissueProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [softBody, setSoftBody] = useState<SoftBody | null>(null);
  const [bloodSystem] = useState(() => new BloodSystem());
  const [bloodParticles, setBloodParticles] = useState<BloodParticleData[]>([]);
  const [isBeingCut, setIsBeingCut] = useState(false);
  const [deformation, setDeformation] = useState<any[]>([]);
  
  // Physics body for collision detection
  const [ref, api] = useBox(() => ({
    mass: 1,
    position,
    args: size,
    onCollide: (e) => {
      if (e.body.userData?.type === 'surgicalTool') {
        handleToolCollision(e);
      }
    },
  }));

  const tissueProps = TISSUE_TYPES[tissueType];

  // Initialize soft body physics
  useEffect(() => {
    const resolution = { x: 8, y: 6, z: 8 }; // Grid resolution for soft body
    const body = new SoftBody(
      new Vec3(...position),
      { x: size[0], y: size[1], z: size[2] },
      resolution,
      tissueProps
    );
    setSoftBody(body);
  }, [position, size, tissueProps]);

  // Create tissue geometry with vertices that can be deformed
  const geometry = useMemo(() => {
    const geo = new THREE.BoxGeometry(size[0], size[1], size[2], 16, 12, 16);
    geo.setAttribute('originalPosition', geo.attributes.position.clone());
    return geo;
  }, [size]);

  // Handle tool collision
  const handleToolCollision = (collision: any) => {
    const contactPoint = collision.contact.ri;
    const impactForce = collision.contact.ni.scale(collision.contact.impactVelocity);
    
    // Apply force to soft body
    if (softBody) {
      const point = new Vec3(contactPoint.x, contactPoint.y, contactPoint.z);
      const force = new Vec3(impactForce.x, impactForce.y, impactForce.z);
      
      softBody.applyForceAtPoint(force, point, 0.1);
      
      // Check if cutting force is strong enough
      const cuttingThreshold = tissueProps.tearThreshold;
      if (impactForce.length() > cuttingThreshold) {
        performCut(point, force);
      }
      
      // Create blood if tissue is damaged
      if (impactForce.length() > cuttingThreshold * 0.3) {
        createBloodEffect(point, force);
      }

      onInteraction?.(force, point);
    }
  };

  // Perform cutting operation
  const performCut = (point: Vec3, force: Vec3) => {
    if (!softBody) return;

    setIsBeingCut(true);
    
    // Calculate cut direction and length
    const cutDirection = force.clone().unit();
    const cutLength = Math.min(force.length() * 0.01, 0.2); // Limit cut length
    const cutEnd = point.clone().vadd(cutDirection.scale(cutLength));
    
    // Perform the cut
    const removedBodies = softBody.cut(point, cutEnd, 0.02);
    
    // Create more intense bleeding for cuts
    if (removedBodies.length > 0) {
      bloodSystem.createBloodSpray(point, force, tissueProps.bloodiness * 2);
    }
    
    setTimeout(() => setIsBeingCut(false), 100);
  };

  // Create blood effect
  const createBloodEffect = (point: Vec3, force: Vec3) => {
    bloodSystem.createBloodSpray(point, force, tissueProps.bloodiness);
  };

  // Update physics and deformation
  useFrame((state, delta) => {
    if (softBody) {
      // Update soft body constraints
      softBody.updateConstraints(delta);
      
      // Get deformation data for visualization
      const deformData = softBody.getDeformationData();
      setDeformation(deformData);
      
      // Update geometry based on deformation
      if (meshRef.current && deformData.length > 0) {
        updateGeometryDeformation(deformData);
      }
    }

    // Update blood particles
    bloodSystem.updateParticles(delta);
    const particleData = bloodSystem.getParticleData();
    setBloodParticles(particleData);
  });

  // Update mesh geometry based on physics deformation
  const updateGeometryDeformation = (deformData: any[]) => {
    if (!meshRef.current) return;

    const geometry = meshRef.current.geometry;
    const positions = geometry.attributes.position;
    const originalPositions = geometry.attributes.originalPosition;

    // Simple deformation mapping (in a real implementation, you'd use more sophisticated interpolation)
    for (let i = 0; i < positions.count; i++) {
      const originalX = originalPositions.getX(i);
      const originalY = originalPositions.getY(i);
      const originalZ = originalPositions.getZ(i);

      // Find closest deformation point
      let closestDeform = deformData[0];
      let minDistance = Infinity;

      deformData.forEach(deform => {
        const dx = originalX - deform.position[0];
        const dy = originalY - deform.position[1];
        const dz = originalZ - deform.position[2];
        const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
        
        if (distance < minDistance) {
          minDistance = distance;
          closestDeform = deform;
        }
      });

      // Apply deformation with falloff
      if (minDistance < 0.1) { // Within influence radius
        const influence = Math.max(0, 1 - minDistance / 0.1);
        const deformX = closestDeform.position[0] - originalX;
        const deformY = closestDeform.position[1] - originalY;
        const deformZ = closestDeform.position[2] - originalZ;

        positions.setX(i, originalX + deformX * influence * 0.1);
        positions.setY(i, originalY + deformY * influence * 0.1);
        positions.setZ(i, originalZ + deformZ * influence * 0.1);
      } else {
        // Reset to original position if no deformation
        positions.setX(i, originalX);
        positions.setY(i, originalY);
        positions.setZ(i, originalZ);
      }
    }

    positions.needsUpdate = true;
    geometry.computeVertexNormals();
  };

  // Tissue material with appropriate properties
  const tissueMaterial = useMemo(() => {
    const baseColor = {
      SKIN: '#fdbcb4',
      MUSCLE: '#d2001f',
      ORGAN: '#8b0000',
      BONE: '#f5f5dc',
      FAT: '#fff8dc',
    };

    return new THREE.MeshPhongMaterial({
      color: baseColor[tissueType],
      transparent: true,
      opacity: isBeingCut ? 0.8 : 0.9,
      side: THREE.DoubleSide,
    });
  }, [tissueType, isBeingCut]);

  return (
    <group>
      {/* Main tissue body */}
      <mesh ref={meshRef} geometry={geometry} material={tissueMaterial} />
      
      {/* Physics collision body */}
      <mesh ref={ref} visible={false}>
        <boxGeometry args={size} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>

      {/* Blood particles */}
      {bloodParticles.map((particle, index) => (
        <mesh
          key={`blood-${index}`}
          position={particle.position}
        >
          <sphereGeometry args={[particle.size]} />
          <meshBasicMaterial 
            color={`hsl(0, 100%, ${20 + particle.life * 30}%)`}
            transparent
            opacity={particle.life * 0.8}
          />
        </mesh>
      ))}

      {/* Deformation visualization points (for debugging) */}
      {deformation.map((deform, index) => (
        <mesh
          key={`deform-${index}`}
          position={deform.position}
          scale={[0.01, 0.01, 0.01]}
        >
          <sphereGeometry args={[1]} />
          <meshBasicMaterial 
            color={`hsl(${240 - deform.stress * 240}, 100%, 50%)`}
            transparent
            opacity={0.3}
          />
        </mesh>
      ))}

      {/* Subsurface layers for more realistic appearance */}
      {tissueType === 'SKIN' && (
        <>
          {/* Fat layer */}
          <mesh position={[0, -size[1] * 0.1, 0]}>
            <boxGeometry args={[size[0] * 0.9, size[1] * 0.8, size[2] * 0.9]} />
            <meshPhongMaterial 
              color="#fff8dc" 
              transparent 
              opacity={0.6}
            />
          </mesh>
          
          {/* Muscle layer */}
          <mesh position={[0, -size[1] * 0.2, 0]}>
            <boxGeometry args={[size[0] * 0.8, size[1] * 0.6, size[2] * 0.8]} />
            <meshPhongMaterial 
              color="#d2001f" 
              transparent 
              opacity={0.4}
            />
          </mesh>
        </>
      )}

      {/* Texture overlay for surface detail */}
      <mesh position={[0, size[1] / 2 + 0.001, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[size[0], size[2]]} />
        <meshBasicMaterial 
          transparent 
          opacity={0.2}
          color={tissueType === 'SKIN' ? '#fdbcb4' : '#d2001f'}
        />
      </mesh>
    </group>
  );
}

export { SoftBodyTissue };