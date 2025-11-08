'use client';

import React from 'react';
import { useTexture } from '@react-three/drei';

export function EnhancedOperatingRoom() {
  return (
    <group>
      {/* Floor - Proper surgical room floor */}
      <mesh 
        rotation={[-Math.PI / 2, 0, 0]} 
        position={[0, 0, 0]} 
        receiveShadow
      >
        <planeGeometry args={[30, 30]} />
        <meshStandardMaterial
          color="#d4d4d4"
          roughness={0.7}
          metalness={0.1}
        />
      </mesh>

      {/* Floor tiles pattern */}
      {[...Array(15)].map((_, i) =>
        [...Array(15)].map((_, j) => (
          <mesh
            key={`tile-${i}-${j}`}
            rotation={[-Math.PI / 2, 0, 0]}
            position={[-14 + i * 2, 0.001, -14 + j * 2]}
            receiveShadow
          >
            <planeGeometry args={[1.9, 1.9]} />
            <meshStandardMaterial
              color={(i + j) % 2 === 0 ? "#e0e0e0" : "#d8d8d8"}
              roughness={0.8}
              metalness={0.05}
            />
          </mesh>
        ))
      )}

      {/* Walls */}
      <group>
        {/* Back wall */}
        <mesh position={[0, 3, -15]} receiveShadow>
          <planeGeometry args={[30, 6]} />
          <meshStandardMaterial color="#f5f5f5" roughness={0.9} />
        </mesh>

        {/* Left wall */}
        <mesh position={[-15, 3, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
          <planeGeometry args={[30, 6]} />
          <meshStandardMaterial color="#f0f0f0" roughness={0.9} />
        </mesh>

        {/* Right wall */}
        <mesh position={[15, 3, 0]} rotation={[0, -Math.PI / 2, 0]} receiveShadow>
          <planeGeometry args={[30, 6]} />
          <meshStandardMaterial color="#f0f0f0" roughness={0.9} />
        </mesh>

        {/* Front wall (partial for visibility) */}
        <mesh position={[0, 3, 15]} rotation={[0, Math.PI, 0]} receiveShadow>
          <planeGeometry args={[30, 6]} />
          <meshStandardMaterial 
            color="#f0f0f0" 
            roughness={0.9}
            transparent
            opacity={0.3}
          />
        </mesh>
      </group>

      {/* Ceiling */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 6, 0]}>
        <planeGeometry args={[30, 30]} />
        <meshStandardMaterial color="#ffffff" roughness={0.7} />
      </mesh>

      {/* Surgical Table Base */}
      <group position={[0, 0, 0]}>
        {/* Table base */}
        <mesh position={[0, 0.4, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.3, 0.4, 0.8, 16]} />
          <meshStandardMaterial
            color="#8c8c8c"
            metalness={0.7}
            roughness={0.3}
          />
        </mesh>

        {/* Table hydraulic column */}
        <mesh position={[0, 0.9, 0]} castShadow>
          <cylinderGeometry args={[0.15, 0.15, 1, 12]} />
          <meshStandardMaterial
            color="#707070"
            metalness={0.8}
            roughness={0.2}
          />
        </mesh>

        {/* Table top frame */}
        <mesh position={[0, 1.0, 0]} castShadow receiveShadow>
          <boxGeometry args={[2.2, 0.1, 1.2]} />
          <meshStandardMaterial
            color="#505050"
            metalness={0.6}
            roughness={0.4}
          />
        </mesh>

        {/* Table mattress/padding */}
        <mesh position={[0, 1.1, 0]} castShadow receiveShadow>
          <boxGeometry args={[2, 0.15, 1]} />
          <meshStandardMaterial
            color="#2d5a8c"
            roughness={0.6}
            metalness={0.1}
          />
        </mesh>

        {/* Head rest */}
        <mesh position={[0, 1.2, -0.6]} rotation={[0.2, 0, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.8, 0.1, 0.3]} />
          <meshStandardMaterial
            color="#2d5a8c"
            roughness={0.6}
            metalness={0.1}
          />
        </mesh>

        {/* Arm rests */}
        <mesh position={[-1.1, 1.05, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.3, 0.08, 0.6]} />
          <meshStandardMaterial
            color="#2d5a8c"
            roughness={0.6}
            metalness={0.1}
          />
        </mesh>
        <mesh position={[1.1, 1.05, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.3, 0.08, 0.6]} />
          <meshStandardMaterial
            color="#2d5a8c"
            roughness={0.6}
            metalness={0.1}
          />
        </mesh>
      </group>

      {/* Overhead Surgical Lights */}
      <group>
        {/* Main surgical light 1 */}
        <group position={[-0.8, 4.5, 0]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.7, 0.5, 0.3, 32]} />
            <meshStandardMaterial
              color="#ffffff"
              emissive="#ffffff"
              emissiveIntensity={0.5}
              metalness={0.9}
              roughness={0.1}
            />
          </mesh>
          {/* Light mount arm */}
          <mesh position={[0, 0.5, 0]}>
            <cylinderGeometry args={[0.06, 0.06, 1, 12]} />
            <meshStandardMaterial
              color="#b0b0b0"
              metalness={0.8}
              roughness={0.2}
            />
          </mesh>
          {/* Spotlight */}
          <spotLight
            position={[0, -0.2, 0]}
            angle={Math.PI / 6}
            penumbra={0.3}
            intensity={2}
            castShadow
            shadow-mapSize-width={2048}
            shadow-mapSize-height={2048}
            target-position={[0, 1, 0]}
          />
        </group>

        {/* Main surgical light 2 */}
        <group position={[0.8, 4.5, 0]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.7, 0.5, 0.3, 32]} />
            <meshStandardMaterial
              color="#ffffff"
              emissive="#ffffff"
              emissiveIntensity={0.5}
              metalness={0.9}
              roughness={0.1}
            />
          </mesh>
          <mesh position={[0, 0.5, 0]}>
            <cylinderGeometry args={[0.06, 0.06, 1, 12]} />
            <meshStandardMaterial
              color="#b0b0b0"
              metalness={0.8}
              roughness={0.2}
            />
          </mesh>
          <spotLight
            position={[0, -0.2, 0]}
            angle={Math.PI / 6}
            penumbra={0.3}
            intensity={2}
            castShadow
            shadow-mapSize-width={2048}
            shadow-mapSize-height={2048}
            target-position={[0, 1, 0]}
          />
        </group>
      </group>

      {/* Medical Equipment Carts */}
      <group>
        {/* Instrument cart */}
        <group position={[3, 0, 1]}>
          <mesh position={[0, 0.5, 0]} castShadow receiveShadow>
            <boxGeometry args={[1, 1, 0.6]} />
            <meshStandardMaterial
              color="#e0e0e0"
              metalness={0.5}
              roughness={0.3}
            />
          </mesh>
          {/* Top tray */}
          <mesh position={[0, 1.1, 0]} castShadow receiveShadow>
            <boxGeometry args={[1.1, 0.05, 0.65]} />
            <meshStandardMaterial
              color="#c0c0c0"
              metalness={0.7}
              roughness={0.2}
            />
          </mesh>
          {/* Wheels */}
          {[-0.4, 0.4].map((x, i) =>
            [-0.25, 0.25].map((z, j) => (
              <mesh key={`wheel-${i}-${j}`} position={[x, 0.08, z]} castShadow>
                <cylinderGeometry args={[0.08, 0.08, 0.05, 16]} />
                <meshStandardMaterial color="#404040" metalness={0.6} />
              </mesh>
            ))
          )}
        </group>

        {/* Anesthesia machine */}
        <group position={[-3, 0, 2]}>
          <mesh position={[0, 0.75, 0]} castShadow receiveShadow>
            <boxGeometry args={[1.2, 1.5, 0.9]} />
            <meshStandardMaterial
              color="#5a7a9a"
              metalness={0.4}
              roughness={0.5}
            />
          </mesh>
          {/* Monitor */}
          <mesh position={[0, 1.2, 0.46]}>
            <boxGeometry args={[0.7, 0.5, 0.05]} />
            <meshStandardMaterial
              color="#000000"
              emissive="#003300"
              emissiveIntensity={0.4}
            />
          </mesh>
        </group>
      </group>

      {/* IV Stand */}
      <group position={[2.5, 0, -1.5]}>
        {/* Pole */}
        <mesh position={[0, 1, 0]} castShadow>
          <cylinderGeometry args={[0.025, 0.025, 2, 12]} />
          <meshStandardMaterial
            color="#c0c0c0"
            metalness={0.8}
            roughness={0.2}
          />
        </mesh>
        {/* Base */}
        <mesh position={[0, 0.05, 0]}>
          <cylinderGeometry args={[0.35, 0.35, 0.1, 16]} />
          <meshStandardMaterial
            color="#808080"
            metalness={0.6}
            roughness={0.4}
          />
        </mesh>
        {/* IV Bag */}
        <mesh position={[0.15, 1.8, 0]} castShadow>
          <boxGeometry args={[0.2, 0.3, 0.08]} />
          <meshStandardMaterial
            color="#ffffff"
            transparent
            opacity={0.7}
            roughness={0.3}
          />
        </mesh>
      </group>

      {/* Monitor Stand */}
      <group position={[-2.5, 0, -1]}>
        <mesh position={[0, 0.75, 0]} castShadow>
          <boxGeometry args={[0.8, 1.5, 0.4]} />
          <meshStandardMaterial
            color="#3a3a3a"
            metalness={0.5}
            roughness={0.4}
          />
        </mesh>
        {/* Screen */}
        <mesh position={[0, 1.2, 0.21]}>
          <boxGeometry args={[0.7, 0.5, 0.03]} />
          <meshStandardMaterial
            color="#000000"
            emissive="#001100"
            emissiveIntensity={0.5}
          />
        </mesh>
      </group>

      {/* Ambient Lighting */}
      <ambientLight intensity={0.4} color="#ffffff" />
      
      {/* Directional lights simulating room lights */}
      <directionalLight
        position={[10, 8, 10]}
        intensity={0.8}
        color="#f8f8ff"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-left={-15}
        shadow-camera-right={15}
        shadow-camera-top={15}
        shadow-camera-bottom={-15}
      />
      
      <directionalLight
        position={[-10, 8, -10]}
        intensity={0.6}
        color="#f8f8ff"
      />

      {/* Point lights for ambient fill */}
      <pointLight position={[-5, 4, -5]} intensity={0.3} color="#ffffff" distance={15} />
      <pointLight position={[5, 4, 5]} intensity={0.3} color="#ffffff" distance={15} />
      <pointLight position={[-5, 4, 5]} intensity={0.3} color="#ffffff" distance={15} />
      <pointLight position={[5, 4, -5]} intensity={0.3} color="#ffffff" distance={15} />

      {/* Wall Cabinets */}
      <group>
        {[-10, -6, -2].map((z, i) => (
          <mesh
            key={`cabinet-${i}`}
            position={[-14.5, 1.5, z]}
            rotation={[0, Math.PI / 2, 0]}
            castShadow
            receiveShadow
          >
            <boxGeometry args={[2, 2, 1]} />
            <meshStandardMaterial
              color="#a8c0e0"
              metalness={0.3}
              roughness={0.6}
            />
          </mesh>
        ))}
      </group>

      {/* Emergency Equipment */}
      <group position={[14, 0.5, 5]}>
        {/* Defibrillator */}
        <mesh castShadow receiveShadow>
          <boxGeometry args={[0.8, 1, 0.5]} />
          <meshStandardMaterial
            color="#dc3545"
            metalness={0.4}
            roughness={0.5}
          />
        </mesh>
      </group>

      {/* Clock on wall */}
      <group position={[0, 4.5, -14.8]}>
        <mesh>
          <cylinderGeometry args={[0.3, 0.3, 0.1, 32]} />
          <meshStandardMaterial color="#ffffff" metalness={0.5} roughness={0.4} />
        </mesh>
        <mesh position={[0, 0, 0.06]}>
          <cylinderGeometry args={[0.28, 0.28, 0.02, 32]} />
          <meshStandardMaterial color="#000000" />
        </mesh>
      </group>
    </group>
  );
}
