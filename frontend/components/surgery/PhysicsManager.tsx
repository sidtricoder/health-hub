import { useEffect, useRef, useState } from 'react';
import { World, Vec3, ContactMaterial, RaycastResult } from 'cannon-es';
import { useThree, useFrame } from '@react-three/fiber';
import { PHYSICS_MATERIALS, CONTACT_MATERIALS, SoftBody, BloodSystem } from './utils/physics';

interface PhysicsManagerProps {
  onPhysicsStep?: (deltaTime: number) => void;
  gravity?: [number, number, number];
  enableDebug?: boolean;
}

export function PhysicsManager({ 
  onPhysicsStep, 
  gravity = [0, -9.82, 0],
  enableDebug = false 
}: PhysicsManagerProps) {
  const { scene } = useThree();
  const worldRef = useRef<World | null>(null);
  const [softBodies, setSoftBodies] = useState<SoftBody[]>([]);
  const [bloodSystems, setBloodSystems] = useState<BloodSystem[]>([]);
  const fixedTimeStep = 1.0 / 60.0; // 60 FPS
  const maxSubSteps = 3;

  // Initialize physics world
  useEffect(() => {
    const world = new World();
    world.gravity.set(...gravity);
    world.broadphase = new (world.constructor as any).NaiveBroadphase();
    
    // Configure solver
    (world.solver as any).iterations = 10;
    (world.solver as any).tolerance = 0.0001;

    // Add contact materials for realistic interactions
    Object.values(CONTACT_MATERIALS).forEach(material => {
      world.addContactMaterial(material);
    });

    worldRef.current = world;

    return () => {
      // Cleanup physics world
      if (worldRef.current) {
        worldRef.current.bodies.forEach(body => {
          worldRef.current!.removeBody(body);
        });
        worldRef.current.contactmaterials.forEach(material => {
          worldRef.current!.removeContactMaterial(material);
        });
      }
    };
  }, [gravity]);

  // Physics update loop
  useFrame((state, delta) => {
    if (!worldRef.current) return;

    // Step the physics world
    worldRef.current.step(fixedTimeStep, delta, maxSubSteps);

    // Update soft bodies
    softBodies.forEach(softBody => {
      softBody.updateConstraints(delta);
    });

    // Update blood systems
    bloodSystems.forEach(bloodSystem => {
      bloodSystem.updateParticles(delta);
    });

    // Callback for additional physics processing
    onPhysicsStep?.(delta);
  });

  // Physics world API
  const physicsAPI = {
    world: worldRef.current,
    
    addSoftBody: (softBody: SoftBody) => {
      setSoftBodies(prev => [...prev, softBody]);
      
      // Add all soft body physics bodies to the world
      softBody.bodies.forEach(body => {
        worldRef.current?.addBody(body);
      });
    },
    
    removeSoftBody: (softBody: SoftBody) => {
      setSoftBodies(prev => prev.filter(sb => sb !== softBody));
      
      // Remove all soft body physics bodies from the world
      softBody.bodies.forEach(body => {
        worldRef.current?.removeBody(body);
      });
    },
    
    addBloodSystem: (bloodSystem: BloodSystem) => {
      setBloodSystems(prev => [...prev, bloodSystem]);
    },
    
    removeBloodSystem: (bloodSystem: BloodSystem) => {
      setBloodSystems(prev => prev.filter(bs => bs !== bloodSystem));
    },
    
    // Raycast for tool interactions
    raycast: (from: Vec3, to: Vec3) => {
      if (!worldRef.current) return null;
      
      const result = new RaycastResult();
      const hasHit = worldRef.current.raycastClosest(from, to, {}, result);
      
      return hasHit ? {
        hasHit: true,
        body: result.body,
        hitPoint: result.hitPointWorld,
        hitNormal: result.hitNormalWorld,
        distance: result.distance
      } : null;
    },
    
    // Get physics statistics
    getStats: () => ({
      bodies: worldRef.current?.bodies.length || 0,
      constraints: worldRef.current?.constraints.length || 0,
      contacts: worldRef.current?.contacts.length || 0,
      softBodies: softBodies.length,
      bloodSystems: bloodSystems.length
    })
  };

  // Debug visualization
  useEffect(() => {
    if (!enableDebug || !worldRef.current) return;

    // TODO: Add debug visualization for physics bodies
    console.log('Physics debug enabled');
    
    return () => {
      console.log('Physics debug disabled');
    };
  }, [enableDebug]);

  return null; // This is a logic component, no visual rendering
}

// Hook to access physics context
export function usePhysics() {
  // This would need to be implemented with React context
  // For now, we'll return a placeholder
  return {
    world: null,
    addSoftBody: () => {},
    removeSoftBody: () => {},
    addBloodSystem: () => {},
    removeBloodSystem: () => {},
    raycast: () => null,
    getStats: () => ({ bodies: 0, constraints: 0, contacts: 0, softBodies: 0, bloodSystems: 0 })
  };
}