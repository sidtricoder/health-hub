import { Vec3, Body, Sphere, Box, ContactMaterial, Material } from 'cannon-es';

// Physics material properties for different objects
export const PHYSICS_MATERIALS = {
  TISSUE: new Material('tissue'),
  METAL: new Material('metal'),
  PLASTIC: new Material('plastic'),
  BONE: new Material('bone'),
  FLUID: new Material('fluid'),
};

// Contact materials define how objects interact when they collide
export const CONTACT_MATERIALS = {
  TISSUE_METAL: new ContactMaterial(PHYSICS_MATERIALS.TISSUE, PHYSICS_MATERIALS.METAL, {
    friction: 0.1,
    restitution: 0.0,
    contactEquationStiffness: 1e6,
    contactEquationRelaxation: 10,
  }),
  TISSUE_TISSUE: new ContactMaterial(PHYSICS_MATERIALS.TISSUE, PHYSICS_MATERIALS.TISSUE, {
    friction: 0.8,
    restitution: 0.1,
    contactEquationStiffness: 1e5,
    contactEquationRelaxation: 10,
  }),
  METAL_METAL: new ContactMaterial(PHYSICS_MATERIALS.METAL, PHYSICS_MATERIALS.METAL, {
    friction: 0.3,
    restitution: 0.2,
    contactEquationStiffness: 1e7,
    contactEquationRelaxation: 5,
  }),
};

// Tissue properties for simulation
export interface TissueProperties {
  density: number;
  elasticity: number;
  damping: number;
  tearThreshold: number;
  bloodiness: number; // 0-1, how much it bleeds when cut
  hardness: number; // 0-1, resistance to deformation
}

export const TISSUE_TYPES = {
  SKIN: {
    density: 1000,
    elasticity: 0.8,
    damping: 0.3,
    tearThreshold: 15,
    bloodiness: 0.3,
    hardness: 0.4,
  } as TissueProperties,
  MUSCLE: {
    density: 1200,
    elasticity: 0.6,
    damping: 0.4,
    tearThreshold: 20,
    bloodiness: 0.7,
    hardness: 0.6,
  } as TissueProperties,
  ORGAN: {
    density: 1100,
    elasticity: 0.9,
    damping: 0.2,
    tearThreshold: 10,
    bloodiness: 0.9,
    hardness: 0.3,
  } as TissueProperties,
  BONE: {
    density: 2000,
    elasticity: 0.1,
    damping: 0.1,
    tearThreshold: 50,
    bloodiness: 0.1,
    hardness: 0.9,
  } as TissueProperties,
  FAT: {
    density: 900,
    elasticity: 0.9,
    damping: 0.5,
    tearThreshold: 8,
    bloodiness: 0.2,
    hardness: 0.2,
  } as TissueProperties,
};

// Create a soft body approximation using connected rigid bodies
export class SoftBody {
  public bodies: Body[] = [];
  public constraints: any[] = [];
  private gridSize: { x: number; y: number; z: number };
  private spacing: number;
  private tissueType: TissueProperties;

  constructor(
    position: Vec3,
    size: { x: number; y: number; z: number },
    resolution: { x: number; y: number; z: number },
    tissueType: TissueProperties = TISSUE_TYPES.SKIN
  ) {
    this.gridSize = resolution;
    this.spacing = 0.1;
    this.tissueType = tissueType;

    this.createBodies(position, size);
    this.createConstraints();
  }

  private createBodies(position: Vec3, size: { x: number; y: number; z: number }) {
    const bodyMass = this.tissueType.density * 0.001; // Scale down for simulation
    const bodySize = Math.min(size.x, size.y, size.z) / Math.max(this.gridSize.x, this.gridSize.y, this.gridSize.z) * 0.5;

    for (let i = 0; i < this.gridSize.x; i++) {
      for (let j = 0; j < this.gridSize.y; j++) {
        for (let k = 0; k < this.gridSize.z; k++) {
          const x = position.x + (i - this.gridSize.x / 2) * this.spacing;
          const y = position.y + (j - this.gridSize.y / 2) * this.spacing;
          const z = position.z + (k - this.gridSize.z / 2) * this.spacing;

          const body = new Body({
            mass: bodyMass,
            position: new Vec3(x, y, z),
            shape: new Sphere(bodySize),
            material: PHYSICS_MATERIALS.TISSUE,
          });

          // Add damping for stability
          body.linearDamping = this.tissueType.damping;
          body.angularDamping = this.tissueType.damping;

          this.bodies.push(body);
        }
      }
    }
  }

  private createConstraints() {
    // Create spring constraints between neighboring bodies
    const springStiffness = this.tissueType.elasticity * 1000;
    const dampingCoefficient = this.tissueType.damping * 100;

    for (let i = 0; i < this.gridSize.x; i++) {
      for (let j = 0; j < this.gridSize.y; j++) {
        for (let k = 0; k < this.gridSize.z; k++) {
          const currentIndex = this.getBodyIndex(i, j, k);
          const currentBody = this.bodies[currentIndex];

          // Connect to neighbors (6-connected grid)
          const neighbors = [
            { di: 1, dj: 0, dk: 0 }, // right
            { di: -1, dj: 0, dk: 0 }, // left
            { di: 0, dj: 1, dk: 0 }, // up
            { di: 0, dj: -1, dk: 0 }, // down
            { di: 0, dj: 0, dk: 1 }, // forward
            { di: 0, dj: 0, dk: -1 }, // backward
          ];

          neighbors.forEach(({ di, dj, dk }) => {
            const ni = i + di;
            const nj = j + dj;
            const nk = k + dk;

            if (this.isValidIndex(ni, nj, nk)) {
              const neighborIndex = this.getBodyIndex(ni, nj, nk);
              const neighborBody = this.bodies[neighborIndex];

              // Create distance constraint (spring)
              const restLength = this.spacing;
              const constraint = {
                bodyA: currentBody,
                bodyB: neighborBody,
                restLength,
                stiffness: springStiffness,
                damping: dampingCoefficient,
                type: 'spring',
              };

              this.constraints.push(constraint);
            }
          });
        }
      }
    }
  }

  private getBodyIndex(i: number, j: number, k: number): number {
    return i * this.gridSize.y * this.gridSize.z + j * this.gridSize.z + k;
  }

  private isValidIndex(i: number, j: number, k: number): boolean {
    return i >= 0 && i < this.gridSize.x && 
           j >= 0 && j < this.gridSize.y && 
           k >= 0 && k < this.gridSize.z;
  }

  // Apply force to the soft body (e.g., from surgical tools)
  applyForceAtPoint(force: Vec3, point: Vec3, radius: number = 0.1) {
    this.bodies.forEach(body => {
      const distance = body.position.distanceTo(point);
      if (distance < radius) {
        // Apply force with falloff
        const falloff = Math.max(0, 1 - distance / radius);
        const scaledForce = force.clone().scale(falloff);
        body.applyForce(scaledForce, body.position);
      }
    });
  }

  // Cut the tissue by removing constraints and bodies
  cut(start: Vec3, end: Vec3, width: number = 0.05) {
    const cutDirection = end.clone().vsub(start).unit();
    const cutLength = start.distanceTo(end);

    // Find bodies along the cut line
    const bodiesToRemove: number[] = [];
    const constraintsToRemove: number[] = [];

    this.bodies.forEach((body, index) => {
      const toBody = body.position.clone().vsub(start);
      const projectionLength = toBody.dot(cutDirection);
      
      if (projectionLength >= 0 && projectionLength <= cutLength) {
        const projectionPoint = start.clone().vadd(cutDirection.clone().scale(projectionLength));
        const distanceToCutLine = body.position.distanceTo(projectionPoint);
        
        if (distanceToCutLine < width) {
          bodiesToRemove.push(index);
        }
      }
    });

    // Remove constraints connected to removed bodies
    this.constraints.forEach((constraint, index) => {
      const bodyAIndex = this.bodies.indexOf(constraint.bodyA);
      const bodyBIndex = this.bodies.indexOf(constraint.bodyB);
      
      if (bodiesToRemove.includes(bodyAIndex) || bodiesToRemove.includes(bodyBIndex)) {
        constraintsToRemove.push(index);
      }
    });

    // Remove in reverse order to maintain indices
    constraintsToRemove.sort((a, b) => b - a).forEach(index => {
      this.constraints.splice(index, 1);
    });

    // Mark bodies for removal (don't remove immediately to avoid index issues)
    return bodiesToRemove.map(index => this.bodies[index]);
  }

  // Get deformation data for visualization
  getDeformationData() {
    return this.bodies.map(body => ({
      position: [body.position.x, body.position.y, body.position.z] as [number, number, number],
      velocity: [body.velocity.x, body.velocity.y, body.velocity.z] as [number, number, number],
      stress: body.velocity.length(), // Simple stress approximation
    }));
  }

  // Update spring constraints (call this in physics step)
  updateConstraints(deltaTime: number) {
    this.constraints.forEach(constraint => {
      if (constraint.type === 'spring') {
        const { bodyA, bodyB, restLength, stiffness, damping } = constraint;
        
        const direction = bodyB.position.clone().vsub(bodyA.position);
        const currentLength = direction.length();
        
        if (currentLength > 0) {
          const extension = currentLength - restLength;
          const forceDirection = direction.unit();
          
          // Spring force
          const springForce = forceDirection.clone().scale(extension * stiffness);
          
          // Damping force
          const relativeVelocity = bodyB.velocity.clone().vsub(bodyA.velocity);
          const dampingForce = forceDirection.clone().scale(relativeVelocity.dot(forceDirection) * damping);
          
          const totalForce = springForce.vadd(dampingForce);
          
          bodyA.applyForce(totalForce, bodyA.position);
          bodyB.applyForce(totalForce.negate(), bodyB.position);
        }
      }
    });
  }
}

// Utility functions for surgical tool physics
export class SurgicalToolPhysics {
  static createScalpel(position: Vec3): Body {
    const scalpelBody = new Body({
      mass: 0.1, // 100g
      position: position.clone(),
      shape: new Box(new Vec3(0.005, 0.001, 0.1)), // Thin blade
      material: PHYSICS_MATERIALS.METAL,
    });
    return scalpelBody;
  }

  static createForceps(position: Vec3): Body {
    const forcepsBody = new Body({
      mass: 0.15, // 150g
      position: position.clone(),
      shape: new Box(new Vec3(0.01, 0.01, 0.15)), // Forceps shape approximation
      material: PHYSICS_MATERIALS.METAL,
    });
    return forcepsBody;
  }

  static createSuction(position: Vec3): Body {
    const suctionBody = new Body({
      mass: 0.2, // 200g
      position: position.clone(),
      shape: new Box(new Vec3(0.015, 0.015, 0.1)), // Suction tip
      material: PHYSICS_MATERIALS.PLASTIC,
    });
    return suctionBody;
  }

  static createCautery(position: Vec3): Body {
    const cauteryBody = new Body({
      mass: 0.08, // 80g
      position: position.clone(),
      shape: new Box(new Vec3(0.003, 0.003, 0.12)), // Thin cautery tip
      material: PHYSICS_MATERIALS.METAL,
    });
    return cauteryBody;
  }
}

// Blood particle system for realistic bleeding
export interface BloodParticle {
  id: string;
  position: Vec3;
  velocity: Vec3;
  life: number; // 0-1, 1 is fresh, 0 is dried
  size: number;
}

export class BloodSystem {
  private particles: BloodParticle[] = [];
  private maxParticles = 1000;

  createBloodSpray(origin: Vec3, force: Vec3, intensity: number = 1) {
    const particleCount = Math.floor(intensity * 20);
    
    for (let i = 0; i < particleCount; i++) {
      const particle: BloodParticle = {
        id: `blood_${Date.now()}_${i}`,
        position: origin.clone().vadd(new Vec3(
          (Math.random() - 0.5) * 0.01,
          (Math.random() - 0.5) * 0.01,
          (Math.random() - 0.5) * 0.01
        )),
        velocity: force.clone().scale(0.1 + Math.random() * 0.9).vadd(new Vec3(
          (Math.random() - 0.5) * 0.5,
          (Math.random() - 0.5) * 0.5,
          (Math.random() - 0.5) * 0.5
        )),
        life: 1.0,
        size: 0.001 + Math.random() * 0.003,
      };
      
      this.particles.push(particle);
    }

    // Remove excess particles
    if (this.particles.length > this.maxParticles) {
      this.particles.splice(0, this.particles.length - this.maxParticles);
    }
  }

  updateParticles(deltaTime: number) {
    const gravity = new Vec3(0, -9.82, 0);
    
    this.particles = this.particles.filter(particle => {
      // Apply gravity
      particle.velocity.vadd(gravity.clone().scale(deltaTime), particle.velocity);
      
      // Update position
      particle.position.vadd(particle.velocity.clone().scale(deltaTime), particle.position);
      
      // Age particle
      particle.life -= deltaTime * 0.5; // Dries over 2 seconds
      
      // Remove dead particles
      return particle.life > 0;
    });
  }

  getParticleData() {
    return this.particles.map(p => ({
      position: [p.position.x, p.position.y, p.position.z] as [number, number, number],
      life: p.life,
      size: p.size,
    }));
  }

  clear() {
    this.particles = [];
  }
}

// Utility function to detect collision between surgical tool and tissue
export function detectToolTissueCollision(
  toolBody: Body, 
  tissueBody: Body, 
  threshold: number = 0.01
): boolean {
  const distance = toolBody.position.distanceTo(tissueBody.position);
  return distance < threshold;
}

// Calculate cutting force based on tool type and tissue properties
export function calculateCuttingForce(
  toolType: string, 
  tissueType: TissueProperties, 
  velocity: number
): number {
  const baseForces = {
    scalpel: 10,
    cautery: 15,
    laser: 5,
    ultrasonic: 8,
  };
  
  const baseForce = baseForces[toolType as keyof typeof baseForces] || 10;
  const hardnessFactor = tissueType.hardness;
  const velocityFactor = Math.min(velocity / 0.1, 3); // Cap at 3x for very fast cuts
  
  return baseForce * hardnessFactor * velocityFactor;
}