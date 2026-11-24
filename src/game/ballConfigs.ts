import { BallForm } from '../types/game';

export interface BallFormConfig {
  form: BallForm;
  name: string;
  radius: number;
  density: number;        // Matter.js density units relative to WATER_DENSITY (0.0037)
  restitution: number;    // Elasticity / bounciness
  friction: number;       // Platform surface grip
  frictionAir: number;    // Atmospheric drag
  maxSpeed: number;       // Maximum rolling speed (px/frame)
  acceleration: number;   // Horizontal ground acceleration snap
  airAcceleration: number;// Mid-air steering authority
  groundDamping: number;  // Braking response on flat platforms
  airDamping: number;     // Momentum preservation during leaps
  jumpVelocity: number;   // Vertical jump impulse
  gravityScale: number;   // Gravity multiplier
  windResistance: number; // 0.0 = completely unaffected, 1.0 = full wind effect
  iceSpeedMultiplier: number; // Traction multiplier on icy slopes
  canBreakCrackedWall: boolean;
  canActivateHeavyPlate: boolean;
  canWalkOnFragileSnow: boolean;
  canBreachWater: boolean;
  canSwimUnderwater: boolean;
}

export const BALL_FORM_CONFIGS: Record<BallForm, BallFormConfig> = {
  original: {
    form: 'original',
    name: 'Original Red Ball',
    radius: 24,
    density: 0.0042,        // Slightly denser than water (sinks slowly if not swimming)
    restitution: 0.35,      // Classic bouncy rubber
    friction: 0.08,
    frictionAir: 0.005,
    maxSpeed: 5.0,          // Calibrated comfortable rolling speed (~300px/s, reduced from 6.4)
    acceleration: 0.36,     // Smooth progressive rolling acceleration (was 0.45)
    airAcceleration: 0.15, // Aerodynamic mid-air steering authority (was 0.18)
    groundDamping: 0.86,   // Natural rolling friction deceleration
    airDamping: 0.985,      // Preserves ballistic leap arcs
    jumpVelocity: -14.68,   // Calibrated 1.1x standard jump height (166.2px, was 150.9px with -14.0)
    gravityScale: 1.0,
    windResistance: 0.55,   // Moderate drift
    iceSpeedMultiplier: 1.0,
    canBreakCrackedWall: false,
    canActivateHeavyPlate: false,
    canWalkOnFragileSnow: false,
    canBreachWater: true,
    canSwimUnderwater: true,
  },
  big: {
    form: 'big',
    name: 'Big Ball',
    radius: 34,             // Large 68px diameter, cannot fit in tight passages
    density: 0.0015,        // Highly buoyant (floats with ~40% submersion)
    restitution: 0.48,      // Extra springy bounce
    friction: 0.12,
    frictionAir: 0.008,     // Higher aerodynamic drag
    maxSpeed: 4.4,          // Floaty, massive buoyant roll (was 5.6)
    acceleration: 0.26,     // High mass inertia (was 0.32)
    airAcceleration: 0.12,  // (was 0.14)
    groundDamping: 0.88,    // Rolls longer due to high inertia
    airDamping: 0.980,
    jumpVelocity: -15.73,   // Calibrated 1.1x high springy leap (201.4px, was 183.0px with -15.0)
    gravityScale: 0.95,     // Graceful flight
    windResistance: 0.85,   // Large sail area catches wind
    iceSpeedMultiplier: 0.95,
    canBreakCrackedWall: false,
    canActivateHeavyPlate: false,
    canWalkOnFragileSnow: false,
    canBreachWater: true,   // High surface breach launch
    canSwimUnderwater: false, // Floats automatically to surface
  },
  stone: {
    form: 'stone',
    name: 'Stone Ball',
    radius: 25,
    density: 0.010,         // Plummets like an anchor in water (rho_rel = 2.7)
    restitution: 0.12,      // Dull, heavy thud
    friction: 0.18,         // High surface friction, stable footing
    frictionAir: 0.003,
    maxSpeed: 3.8,          // Steady heavy roll (was 4.8)
    acceleration: 0.44,     // Firm stone traction (was 0.55)
    airAcceleration: 0.07,  // Heavy stone resists mid-air steering (was 0.08)
    groundDamping: 0.80,    // Fast braking on ground contact
    airDamping: 0.990,      // Heavy projectile trajectory
    jumpVelocity: -12.80,   // Calibrated 1.1x punchy heavy jump (99.7px, was 90.3px with -12.2)
    gravityScale: 1.25,     // Falls quickly, feels genuinely heavy
    windResistance: 0.005,  // Extremely heavy stone strides easily through mountain gales
    iceSpeedMultiplier: 0.85,
    canBreakCrackedWall: true,
    canActivateHeavyPlate: true,
    canWalkOnFragileSnow: false, // Instantly collapses fragile snow (0.15s)
    canBreachWater: false,  // Sinks to seabed
    canSwimUnderwater: false,
  },
  snow: {
    form: 'snow',
    name: 'Snow Ball',
    radius: 16,             // Small 32px diameter, slips through 38px tunnels
    density: 0.0013,        // Light, floats high
    restitution: 0.28,      // Soft, powdery snow bounce
    friction: 0.03,         // Low friction, extremely slick
    frictionAir: 0.007,
    maxSpeed: 5.25,         // Calibrated slightly faster than normal speed (5.0) for comfortable agile steering
    acceleration: 0.30,     // Smooth rolling acceleration (was 0.32)
    airAcceleration: 0.15,  // Balanced mid-air authority matching normal form
    groundDamping: 0.87,    // Natural slick glide across snow, braking predictably upon input release
    airDamping: 0.985,
    jumpVelocity: -13.84,   // Calibrated 1.1x agile hop (164.3px, was 149.3px with -13.2)
    gravityScale: 0.90,     // Fluttery gravity
    windResistance: 1.35,   // Blown away by strong wind
    iceSpeedMultiplier: 1.04,// Gentle controlled glide on pure ice slopes (was 1.25)
    canBreakCrackedWall: false,
    canActivateHeavyPlate: false,
    canWalkOnFragileSnow: true, // Glides safely across fragile snow bridges
    canBreachWater: true,
    canSwimUnderwater: true,
  },
};
