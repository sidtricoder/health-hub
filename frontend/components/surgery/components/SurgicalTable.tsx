'use client';

import React, { useRef } from 'react';
import { useBox } from '@react-three/cannon';
import { Mesh } from 'three';

interface SurgicalTableProps {
  position: [number, number, number];
}

export function SurgicalTable({ position }: SurgicalTableProps) {
  const meshRef = useRef<Mesh>(null);

  // Create physics body for the surgical table
  const [tableRef] = useBox(() => ({
    position,
    args: [4, 0.2, 2], // width, height, depth
    type: 'Static', // Static body (doesn't move)
    material: {
      friction: 0.3,
      restitution: 0.1
    }
  }));

  return (
    <group>
      {/* Main table surface */}
      <mesh ref={tableRef} castShadow receiveShadow>
        <boxGeometry args={[4, 0.2, 2]} />
        <meshStandardMaterial
          color="#e8e8e8"
          metalness={0.8}
          roughness={0.2}
        />
      </mesh>

      {/* Table legs */}
      {[
        [-1.8, -0.5, 0.9],
        [1.8, -0.5, 0.9],
        [-1.8, -0.5, -0.9],
        [1.8, -0.5, -0.9]
      ].map((legPosition, index) => (
        <TableLeg key={index} position={legPosition as [number, number, number]} />
      ))}

      {/* Table accessories */}
      <group position={[2.5, 0.2, 0]}>
        {/* Instrument tray */}
        <mesh castShadow>
          <boxGeometry args={[0.8, 0.05, 0.6]} />
          <meshStandardMaterial color="#d0d0d0" />
        </mesh>
        
        {/* Tray rim */}
        <mesh position={[0, 0.03, 0]}>
          <ringGeometry args={[0.35, 0.4, 16]} />
          <meshStandardMaterial color="#c0c0c0" />
        </mesh>
      </group>

      {/* Overhead lamp mount */}
      <group position={[0, 3, 0]}>
        <mesh>
          <cylinderGeometry args={[0.05, 0.05, 2]} />
          <meshStandardMaterial color="#444444" />
        </mesh>
        
        {/* Lamp head */}
        <group position={[0, 1.2, 0]}>
          <mesh>
            <cylinderGeometry args={[0.3, 0.2, 0.3]} />
            <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.2} />
          </mesh>
        </group>
      </group>
    </group>
  );
}

interface TableLegProps {
  position: [number, number, number];
}

function TableLeg({ position }: TableLegProps) {
  const [legRef] = useBox(() => ({
    position,
    args: [0.1, 1, 0.1],
    type: 'Static',
    material: {
      friction: 0.3,
      restitution: 0.1
    }
  }));

  return (
    <mesh ref={legRef} castShadow>
      <boxGeometry args={[0.1, 1, 0.1]} />
      <meshStandardMaterial
        color="#c0c0c0"
        metalness={0.8}
        roughness={0.3}
      />
    </mesh>
  );
}