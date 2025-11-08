'use client';

import React from 'react';

export function OperatingRoom() {
  return (
    <group>
      {/* Room walls */}
      <group>
        {/* Back wall */}
        <mesh position={[0, 2.5, -8]} receiveShadow>
          <planeGeometry args={[16, 5]} />
          <meshStandardMaterial color="#f5f5f5" />
        </mesh>
        
        {/* Left wall */}
        <mesh position={[-8, 2.5, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
          <planeGeometry args={[16, 5]} />
          <meshStandardMaterial color="#f0f0f0" />
        </mesh>
        
        {/* Right wall */}
        <mesh position={[8, 2.5, 0]} rotation={[0, -Math.PI / 2, 0]} receiveShadow>
          <planeGeometry args={[16, 5]} />
          <meshStandardMaterial color="#f0f0f0" />
        </mesh>
      </group>

      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1, 0]} receiveShadow>
        <planeGeometry args={[16, 16]} />
        <meshStandardMaterial color="#e8e8e8" />
      </mesh>

      {/* Floor tiles */}
      {[...Array(8)].map((_, i) =>
        [...Array(8)].map((_, j) => (
          <mesh
            key={`${i}-${j}`}
            rotation={[-Math.PI / 2, 0, 0]}
            position={[-7 + i * 2, -0.99, -7 + j * 2]}
          >
            <planeGeometry args={[1.8, 1.8]} />
            <meshStandardMaterial
              color={(i + j) % 2 === 0 ? "#ffffff" : "#f8f8f8"}
              transparent
              opacity={0.1}
            />
          </mesh>
        ))
      )}

      {/* Ceiling */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 5, 0]}>
        <planeGeometry args={[16, 16]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>

      {/* Surgical lights */}
      <group>
        {/* Main surgical light */}
        <group position={[0, 4.5, 0]}>
          <mesh>
            <cylinderGeometry args={[0.6, 0.4, 0.2]} />
            <meshStandardMaterial
              color="#ffffff"
              emissive="#ffffff"
              emissiveIntensity={0.3}
            />
          </mesh>
          
          {/* Light mount arm */}
          <mesh position={[0, 0.3, 0]}>
            <cylinderGeometry args={[0.05, 0.05, 0.6]} />
            <meshStandardMaterial color="#cccccc" />
          </mesh>
        </group>

        {/* Secondary lights */}
        <group position={[-2, 4.2, 1]}>
          <mesh>
            <cylinderGeometry args={[0.3, 0.2, 0.15]} />
            <meshStandardMaterial
              color="#ffffff"
              emissive="#ffffff"
              emissiveIntensity={0.2}
            />
          </mesh>
        </group>

        <group position={[2, 4.2, 1]}>
          <mesh>
            <cylinderGeometry args={[0.3, 0.2, 0.15]} />
            <meshStandardMaterial
              color="#ffffff"
              emissive="#ffffff"
              emissiveIntensity={0.2}
            />
          </mesh>
        </group>
      </group>

      {/* Medical equipment */}
      <group>
        {/* Anesthesia machine */}
        <group position={[-4, 0, 3]}>
          <mesh>
            <boxGeometry args={[1, 1.5, 0.8]} />
            <meshStandardMaterial color="#4a5568" />
          </mesh>
          
          {/* Monitor screen */}
          <mesh position={[0, 0.5, 0.41]}>
            <boxGeometry args={[0.6, 0.4, 0.02]} />
            <meshStandardMaterial
              color="#000000"
              emissive="#002200"
              emissiveIntensity={0.3}
            />
          </mesh>
          
          {/* Control panel */}
          <mesh position={[0, -0.2, 0.41]}>
            <boxGeometry args={[0.8, 0.3, 0.02]} />
            <meshStandardMaterial color="#666666" />
          </mesh>
        </group>

        {/* IV stand */}
        <group position={[4, 1, 2]}>
          <mesh>
            <cylinderGeometry args={[0.02, 0.02, 2]} />
            <meshStandardMaterial color="#cccccc" />
          </mesh>
          
          {/* IV bag */}
          <mesh position={[0, 0.8, 0]}>
            <boxGeometry args={[0.15, 0.25, 0.05]} />
            <meshStandardMaterial
              color="#ffffff"
              transparent
              opacity={0.8}
            />
          </mesh>
          
          {/* Base */}
          <mesh position={[0, -1, 0]}>
            <cylinderGeometry args={[0.3, 0.3, 0.1]} />
            <meshStandardMaterial color="#888888" />
          </mesh>
        </group>

        {/* Vital signs monitor */}
        <group position={[3, 1.5, -2]}>
          <mesh>
            <boxGeometry args={[0.8, 0.6, 0.3]} />
            <meshStandardMaterial color="#2d3748" />
          </mesh>
          
          {/* Screen */}
          <mesh position={[0, 0, 0.16]}>
            <boxGeometry args={[0.7, 0.4, 0.02]} />
            <meshStandardMaterial
              color="#000000"
              emissive="#004400"
              emissiveIntensity={0.4}
            />
          </mesh>
        </group>

        {/* Defibrillator */}
        <group position={[-3, 0.5, -3]}>
          <mesh>
            <boxGeometry args={[1, 1, 0.5]} />
            <meshStandardMaterial color="#ff4444" />
          </mesh>
          
          {/* Paddles */}
          <mesh position={[-0.3, 0.5, 0.3]}>
            <cylinderGeometry args={[0.08, 0.08, 0.2]} />
            <meshStandardMaterial color="#ffffff" />
          </mesh>
          <mesh position={[0.3, 0.5, 0.3]}>
            <cylinderGeometry args={[0.08, 0.08, 0.2]} />
            <meshStandardMaterial color="#ffffff" />
          </mesh>
        </group>
      </group>

      {/* Cabinets and storage */}
      <group>
        {/* Wall cabinets */}
        <mesh position={[-7.5, 1.5, -3]} rotation={[0, Math.PI / 2, 0]}>
          <boxGeometry args={[2, 2, 1]} />
          <meshStandardMaterial color="#8b9dc3" />
        </mesh>
        
        <mesh position={[-7.5, 1.5, 0]} rotation={[0, Math.PI / 2, 0]}>
          <boxGeometry args={[2, 2, 1]} />
          <meshStandardMaterial color="#8b9dc3" />
        </mesh>
        
        <mesh position={[-7.5, 1.5, 3]} rotation={[0, Math.PI / 2, 0]}>
          <boxGeometry args={[2, 2, 1]} />
          <meshStandardMaterial color="#8b9dc3" />
        </mesh>
      </group>

      {/* Doors */}
      <group>
        {/* Main entrance */}
        <mesh position={[0, 1, 7.9]}>
          <boxGeometry args={[2, 3, 0.2]} />
          <meshStandardMaterial color="#8b4513" />
        </mesh>
        
        {/* Door handle */}
        <mesh position={[0.8, 1, 8.05]}>
          <sphereGeometry args={[0.05]} />
          <meshStandardMaterial color="#ffd700" metalness={1} />
        </mesh>
      </group>

      {/* Emergency equipment */}
      <group>
        {/* Fire extinguisher */}
        <mesh position={[7.5, 0.5, 2]}>
          <cylinderGeometry args={[0.1, 0.1, 1]} />
          <meshStandardMaterial color="#ff0000" />
        </mesh>
        
        {/* Emergency button */}
        <mesh position={[7.5, 1.5, 0]}>
          <cylinderGeometry args={[0.1, 0.1, 0.05]} />
          <meshStandardMaterial
            color="#ff0000"
            emissive="#220000"
            emissiveIntensity={0.3}
          />
        </mesh>
      </group>

      {/* Air vents */}
      {[...Array(4)].map((_, i) => (
        <mesh
          key={i}
          position={[-6 + i * 4, 4.8, 0]}
          rotation={[Math.PI / 2, 0, 0]}
        >
          <cylinderGeometry args={[0.2, 0.2, 0.1]} />
          <meshStandardMaterial color="#666666" />
        </mesh>
      ))}
    </group>
  );
}