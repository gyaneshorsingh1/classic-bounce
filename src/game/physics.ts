import Matter from 'matter-js';
import {
  BALL_DENSITY,
  BALL_INITIAL_X,
  BALL_INITIAL_Y,
  BALL_RADIUS,
  DENSITY_MULT_LARGE,
  DENSITY_MULT_NORMAL,
  DENSITY_MULT_SMALL,
  GRAVITY_Y,
  LEVEL_PLATFORMS,
  WATER_BREACH_IMPULSE,
  WATER_DENSITY,
  WATER_DRAG_X,
  WATER_DRAG_Y,
  WATER_SWIM_IMPULSE,
  WORLD_HEIGHT,
  WORLD_WIDTH,
} from './constants';
import {
  BallDensity,
  BallForm,
  BallSize,
  BallState,
  ChallengeTimerConfig,
  CoinData,
  InputState,
  KeyData,
  PlatformData,
  Position,
  RisingZoneConfig,
  TransformationEffect,
} from '../types/game';
import { InputController, RawInputState } from '../controllers/InputController';
import { PlayerController } from '../controllers/PlayerController';
import { LifeManager } from './LifeManager';
import { CoinManager } from './CoinManager';
import { KeyManager } from './KeyManager';
import { BALL_FORM_CONFIGS } from './ballConfigs';
import { SoundManager } from '../services/SoundManager';
import { saveManager } from '../services/SaveManager';

interface LockedDoorTrack {
  plat: PlatformData;
  body: Matter.Body;
  baseX: number;
  baseY: number;
}

interface BouncePadTrack {
  plat: PlatformData;
  body: Matter.Body;
  baseX: number;
  baseY: number;
}

interface TimedDoorTrack {
  plat: PlatformData;
  body: Matter.Body;
  baseX: number;
  baseY: number;
}

interface DisappearingPlatformTrack {
  plat: PlatformData;
  body: Matter.Body;
  baseX: number;
  baseY: number;
}

interface FallingPlatformTrack {
  plat: PlatformData;
  body: Matter.Body;
  baseX: number;
  baseY: number;
  shakeTimer?: number;
  respawnTimer?: number;
}

interface MovingPlatformTrack {
  plat: PlatformData;
  body: Matter.Body;
  baseX: number;
  baseY: number;
  moveRangeX: number;
  moveRangeY: number;
  moveSpeed: number;
}

interface MovingSpikeTrack {
  spike: PlatformData;
  baseX: number;
  baseY: number;
  moveRangeX: number;
  moveRangeY: number;
  moveSpeed: number;
}

interface CrumblingPlatformTrack {
  plat: PlatformData;
  body: Matter.Body;
  baseX: number;
  baseY: number;
  crumbleTime?: number;
  respawnTime?: number;
}

interface GeyserTrack {
  plat: PlatformData;
  baseY: number;
  height: number;
  cycleTime: number;
  eruptStart: number;
  eruptDuration: number;
}

interface FallingRockTrack {
  plat: PlatformData;
  baseX: number;
  startY: number;
  endY: number;
  speed: number;
  interval: number;
}

interface CrackedWallTrack {
  plat: PlatformData;
  body: Matter.Body;
  baseX?: number;
  baseY?: number;
}

interface RotatingPlatformTrack {
  plat: PlatformData;
  body: Matter.Body;
  pivotX: number;
  pivotY: number;
  orbitRadius: number;
  angularSpeed: number;
}

interface StoneGateTrack {
  plat: PlatformData;
  body: Matter.Body;
  closedY: number;
  openY: number;
}

interface FragileSnowTrack {
  plat: PlatformData;
  body: Matter.Body;
  baseX: number;
  baseY: number;
  collapseTimer?: number;
  respawnTimer?: number;
}

interface FallingIcicleTrack {
  plat: PlatformData;
  startY: number;
  endY: number;
  isDropping: boolean;
}

/**
 * Compute the submerged area fraction (0.0 to 1.0) of a circular disc of radius r
 * immersed to depth h (from the bottom of the disc).
 * Uses the exact geometric circular segment formula:
 * theta = 2 * acos(1 - h/r)
 * area_segment = r^2 * (theta - sin(theta)) / 2
 * ratio = area_segment / (pi * r^2) = (theta - sin(theta)) / (2 * pi)
 */
export function computeCircularSubmergedRatio(h: number, r: number): number {
  if (h <= 0) return 0;
  if (h >= 2 * r) return 1.0;
  const cosVal = Math.max(-1, Math.min(1, 1 - h / r));
  const theta = 2 * Math.acos(cosVal);
  return (theta - Math.sin(theta)) / (2 * Math.PI);
}

/**
 * PhysicsWorld:
 * Pure simulation engine handling rigid-body dynamics, moving platforms,
 * moving spike traps, crumbling bridges, checkpoints, exit triggers,
 * lava pits, rising magma, geysers, falling rocks, water buoyancy,
 * and three ball forms (Original, Stone, Snow) with environmental interactions.
 */
export class PhysicsWorld {
  private engine: Matter.Engine;
  private ball: Matter.Body;
  private platforms: PlatformData[];
  private platformBodies: Map<string, Matter.Body> = new Map();
  private playerController: PlayerController;
  private visualAngle: number = 0;
  private isCurrentlyGrounded: boolean = false;
  private lastGroundedPlatformId: string | null = null;
  private prevVy: number = 0;
  private scaleX: number = 1.0;
  private scaleY: number = 1.0;

  // Level configuration & dimensions
  private worldWidth: number;
  private worldHeight: number;
  private initialX: number;
  private initialY: number;
  private activeCheckpoint: Position;

  // Life & Coin Management
  private lifeManager: LifeManager;
  private coinManager: CoinManager;
  private onCoinCollected?: (coin: CoinData) => void;
  private gameOverNotification: string | null = null;
  private gameOverNotificationTimer: number = 0;

  // Dynamic interactive elements
  private movingPlatforms: MovingPlatformTrack[] = [];
  private movingSpikes: MovingSpikeTrack[] = [];
  private crumblingPlatforms: CrumblingPlatformTrack[] = [];
  private lavaPits: PlatformData[] = [];
  private geysers: GeyserTrack[] = [];
  private fallingRocks: FallingRockTrack[] = [];
  private risingLavaY?: number;
  private isRisingLavaActive: boolean = false;
  private spikes: PlatformData[] = [];
  private checkpoints: PlatformData[] = [];
  private exitRing: PlatformData | null = null;
  private simTime: number = 0;
  private isLevelComplete: boolean = false;
  private elapsedGameplayTime: number = 0;
  private deathCount: number = 0;
  private coinsCollectedThisRun: number = 0;

  // Water, Fluid & Size Transformation State
  private currentRadius: number = BALL_RADIUS;
  private currentSize: BallSize = 'normal';
  private currentDensity: BallDensity = 'normal';
  private currentForm: BallForm = 'original';
  private activeCheckpointForm: BallForm = 'original';
  private transformationEffect: TransformationEffect | null = null;
  private waterZones: PlatformData[] = [];
  private transformerGates: PlatformData[] = [];
  private isInWater: boolean = false;
  private submergedRatio: number = 0;
  private lastSwimTime: number = -1;

  // Frozen Mountain Kingdom elements
  private crackedWalls: CrackedWallTrack[] = [];
  private pressurePlates: PlatformData[] = [];
  private stoneGates: StoneGateTrack[] = [];
  private windZones: PlatformData[] = [];
  private fragileSnowPlatforms: FragileSnowTrack[] = [];
  private fallingIcicles: FallingIcicleTrack[] = [];

  // Phase 1 Advanced Gameplay Mechanics
  private keyManager: KeyManager;
  private onKeyCollected?: (key: KeyData) => void;
  private playerTeleportCooldown: number = 0;
  private lockedDoors: LockedDoorTrack[] = [];
  private wallSwitches: PlatformData[] = [];
  private bouncePads: BouncePadTrack[] = [];
  private teleporters: PlatformData[] = [];
  private rotatingSpikes: PlatformData[] = [];
  private rotatingPlatforms: RotatingPlatformTrack[] = [];
  private movingSaws: PlatformData[] = [];
  private timedDoors: TimedDoorTrack[] = [];
  private disappearingPlatforms: DisappearingPlatformTrack[] = [];
  private fallingPlatforms: FallingPlatformTrack[] = [];
  private secretPassages: PlatformData[] = [];
  private isMobile: boolean = false;
  private risingZoneConfig?: RisingZoneConfig;
  private challengeTimers: ChallengeTimerConfig[] = [];
  private activeChallengeTimer: {
    id: string;
    label: string;
    remainingSeconds: number;
    maxSeconds: number;
  } | null = null;
  private completedTimerIds: Set<string> = new Set();

  constructor(
    customPlatforms: PlatformData[] = LEVEL_PLATFORMS,
    worldWidth: number = WORLD_WIDTH,
    worldHeight: number = WORLD_HEIGHT,
    initialX: number = BALL_INITIAL_X,
    initialY: number = BALL_INITIAL_Y,
    customCoins: CoinData[] = [],
    onCoinCollected?: (coin: CoinData) => void,
    customKeys: KeyData[] = [],
    onKeyCollected?: (key: KeyData) => void,
    isMobile: boolean = false,
    risingZoneConfig?: RisingZoneConfig,
    challengeTimers?: ChallengeTimerConfig[]
  ) {
    this.isMobile = isMobile;
    this.risingZoneConfig = risingZoneConfig;
    this.challengeTimers = challengeTimers ?? [];
    this.platforms = customPlatforms;
    this.worldWidth = worldWidth;
    this.worldHeight = worldHeight;
    this.initialX = initialX;
    this.initialY = initialY;
    this.activeCheckpoint = { x: initialX, y: initialY };
    this.playerController = new PlayerController();
    this.lifeManager = new LifeManager(3);
    this.coinManager = new CoinManager(customCoins);
    this.onCoinCollected = onCoinCollected;
    this.keyManager = new KeyManager(customKeys);
    this.onKeyCollected = onKeyCollected;

    // Initialize Matter.js Engine
    this.engine = Matter.Engine.create({
      gravity: {
        x: 0,
        y: GRAVITY_Y,
        scale: 0.001,
      },
    });

    // Create the Player Ball with Original Red Ball physics configuration
    const initialConfig = BALL_FORM_CONFIGS.original;
    this.currentRadius = initialConfig.radius;
    this.ball = Matter.Bodies.circle(this.initialX, this.initialY, initialConfig.radius, {
      restitution: initialConfig.restitution,
      friction: 0.001,
      frictionAir: 0.001,
      density: initialConfig.density,
      label: 'player_ball',
    });

    Matter.Composite.add(this.engine.world, this.ball);

    // Create Platform static bodies
    const staticBodies: Matter.Body[] = [];
    for (const plat of this.platforms) {
      if (plat.type === 'spike') {
        this.spikes.push(plat);
        if (plat.moveRangeX || plat.moveRangeY) {
          this.movingSpikes.push({
            spike: plat,
            baseX: plat.x,
            baseY: plat.y,
            moveRangeX: plat.moveRangeX ?? 0,
            moveRangeY: plat.moveRangeY ?? 0,
            moveSpeed: plat.moveSpeed ?? 1.5,
          });
        }
        continue; // Spikes are hazard triggers, handled via overlap
      }

      if (plat.type === 'exit') {
        this.exitRing = plat;
        continue; // Exit ring is a trigger portal
      }

      if (plat.type === 'checkpoint') {
        this.checkpoints.push(plat);
        continue; // Checkpoint is a trigger beacon
      }

      if (plat.type === 'lava') {
        this.lavaPits.push(plat);
        continue; // Lava is hazard trigger, handled via overlap
      }

      if (plat.type === 'geyser') {
        this.geysers.push({
          plat,
          baseY: plat.y,
          height: plat.geyserHeight ?? 150,
          cycleTime: plat.geyserCycleTime ?? 4.0,
          eruptStart: plat.geyserEruptStart ?? 2.0,
          eruptDuration: plat.geyserEruptDuration ?? 1.4,
        });
        continue; // Geyser is timed hazard trigger
      }

      if (plat.type === 'falling_rock') {
        this.fallingRocks.push({
          plat,
          baseX: plat.x,
          startY: plat.fallStartY ?? plat.y,
          endY: plat.fallEndY ?? plat.y + 500,
          speed: plat.fallSpeed ?? 240,
          interval: plat.fallInterval ?? 2.5,
        });
        continue; // Falling rock is dynamic projectile hazard
      }

      if (plat.type === 'water' || plat.type === 'waterfall') {
        this.waterZones.push(plat);
        continue; // Water is fluid zone, handled via hydrodynamic simulation
      }

      if (
        plat.type === 'transformer_shrink' ||
        plat.type === 'transformer_grow' ||
        plat.type === 'transformer_normal' ||
        plat.type === 'transformer_stone' ||
        plat.type === 'transformer_snow' ||
        plat.type === 'transformer_original' ||
        plat.type === 'transformer_big'
      ) {
        this.transformerGates.push(plat);
        continue; // Transformer gate is an interactive portal
      }

      if (plat.type === 'wind_zone') {
        this.windZones.push(plat);
        continue; // Wind zone is dynamic force trigger
      }

      if (plat.type === 'falling_icicle') {
        this.fallingIcicles.push({
          plat,
          startY: plat.icicleStartY ?? plat.y,
          endY: plat.icicleEndY ?? plat.y + 450,
          isDropping: false,
        });
        continue; // Falling icicle is proximity drop hazard
      }

      if (plat.type === 'teleporter') {
        this.teleporters.push(plat);
        continue; // Teleporter is portal trigger
      }

      if (plat.type === 'rotating_spikes') {
        this.rotatingSpikes.push(plat);
        continue; // Rotating spikes hazard
      }

      if (plat.type === 'moving_saw') {
        this.movingSaws.push(plat);
        continue; // Moving saw blade hazard
      }

      if (plat.type === 'secret_passage') {
        this.secretPassages.push(plat);
        continue; // Secret passage is illusory sensor
      }

      if (plat.type === 'wall_switch') {
        this.wallSwitches.push(plat);
        continue; // Wall switch is contact trigger
      }

      const frictionVal = plat.type === 'ice' ? 0.005 : 0.1;
      const body = Matter.Bodies.rectangle(plat.x, plat.y, plat.width, plat.height, {
        isStatic: true,
        friction: frictionVal,
        restitution: 0.1,
        label: `platform_${plat.id}`,
      });
      this.platformBodies.set(plat.id, body);
      staticBodies.push(body);

      if (plat.type === 'cracked_wall') {
        if (plat.isBroken) {
          body.isSensor = true;
          Matter.Body.setPosition(body, { x: -9999, y: -9999 });
        }
        this.crackedWalls.push({ plat, body, baseX: plat.x, baseY: plat.y });
      }

      if (plat.type === 'heavy_pressure_plate' || plat.type === 'pressure_plate') {
        this.pressurePlates.push(plat);
      }

      if (plat.type === 'locked_door') {
        if (saveManager.isDoorUnlocked(plat.id) || plat.isOpen) {
          plat.isOpen = true;
          plat.doorState = 'open';
          body.isSensor = true;
          Matter.Body.setPosition(body, { x: -9999, y: -9999 });
        }
        this.lockedDoors.push({ plat, body, baseX: plat.x, baseY: plat.y });
      }

      if (plat.type === 'bounce_pad') {
        body.isSensor = true;
        this.bouncePads.push({ plat, body, baseX: plat.x, baseY: plat.y });
      }

      if (plat.type === 'timed_door') {
        this.timedDoors.push({ plat, body, baseX: plat.x, baseY: plat.y });
      }

      if (plat.type === 'disappearing_platform') {
        this.disappearingPlatforms.push({ plat, body, baseX: plat.x, baseY: plat.y });
      }

      if (plat.type === 'falling_platform') {
        this.fallingPlatforms.push({ plat, body, baseX: plat.x, baseY: plat.y });
      }

      if (plat.type === 'stone_gate') {
        if (plat.isOpen) {
          body.isSensor = true;
          Matter.Body.setPosition(body, { x: -9999, y: -9999 });
        }
        this.stoneGates.push({
          plat,
          body,
          closedY: plat.y,
          openY: plat.y - plat.height - 40,
        });
      }

      if (plat.type === 'snow_platform') {
        this.fragileSnowPlatforms.push({
          plat,
          body,
          baseX: plat.x,
          baseY: plat.y,
        });
      }

      if (plat.type === 'moving') {
        this.movingPlatforms.push({
          plat,
          body,
          baseX: plat.x,
          baseY: plat.y,
          moveRangeX: plat.moveRangeX ?? 0,
          moveRangeY: plat.moveRangeY ?? 0,
          moveSpeed: plat.moveSpeed ?? 1.5,
        });
      }

      if (
        plat.isRotatingPlatform ||
        (plat.pivotX !== undefined &&
          plat.pivotY !== undefined &&
          (plat.orbitRadius !== undefined || plat.armLength !== undefined))
      ) {
        this.rotatingPlatforms.push({
          plat,
          body,
          pivotX: plat.pivotX!,
          pivotY: plat.pivotY!,
          orbitRadius: plat.orbitRadius ?? plat.armLength ?? 80,
          angularSpeed: plat.angularSpeed ?? 1.5,
        });
      }

      if (plat.type === 'crumbling') {
        this.crumblingPlatforms.push({
          plat,
          body,
          baseX: plat.x,
          baseY: plat.y,
        });
      }
    }
    Matter.Composite.add(this.engine.world, staticBodies);
  }

  /**
   * Authoritative grounded detection across solid platform surfaces.
   * Tolerant to landing micro-restitution rebound (vy >= -3.0) while strictly
   * rejecting ascending jump trajectories (vy < -3.0, where jumpVy is ~ -13.4).
   */
  private checkGrounded(): boolean {
    if (this.ball.velocity.y < -3.0) {
      this.lastGroundedPlatformId = null;
      return false;
    }

    const ballBottom = this.ball.position.y + this.currentRadius;
    const ballX = this.ball.position.x;

    for (const plat of this.platforms) {
      // Spatial Broadphase Culling: skip platform if ball is nowhere near it horizontally or vertically
      if (
        Math.abs(plat.x - ballX) > plat.width / 2 + 20 ||
        Math.abs(plat.y - ballBottom) > plat.height / 2 + 35
      ) {
        continue;
      }

      if (
        plat.type === 'bounce_pad' ||
        plat.type === 'wall' ||
        plat.type === 'spike' ||
        plat.type === 'lava' ||
        plat.type === 'geyser' ||
        plat.type === 'falling_rock' ||
        plat.type === 'exit' ||
        plat.type === 'checkpoint' ||
        plat.type === 'water' ||
        plat.type === 'waterfall' ||
        plat.type.startsWith('transformer_') ||
        plat.type === 'wind_zone' ||
        plat.type === 'falling_icicle' ||
        plat.type === 'secret_passage' ||
        plat.type === 'wall_switch' ||
        plat.isCollapsed ||
        plat.isBroken ||
        plat.isOpen
      ) {
        continue;
      }

      const platTop = plat.y - plat.height / 2;
      const platLeft = plat.x - plat.width / 2;
      const platRight = plat.x + plat.width / 2;

      // Ball is horizontally aligned with platform surface
      if (ballX >= platLeft - 10 && ballX <= platRight + 10) {
        const distanceToTop = ballBottom - platTop;
        if (distanceToTop >= -4 && distanceToTop <= 8) {
          this.lastGroundedPlatformId = plat.id;
          return true;
        }
      }
    }

    this.lastGroundedPlatformId = null;
    return false;
  }

  /**
   * Check if the player has touched any spike hazard.
   */
  private checkSpikeCollision(): boolean {
    const bx = this.ball.position.x;
    const by = this.ball.position.y;
    const hitRadius = (this.currentRadius ?? BALL_RADIUS) * 0.85;

    for (const spike of this.spikes) {
      // Broadphase AABB Culling: skip spikes farther than 90px
      if (Math.abs(spike.x - bx) > 90 || Math.abs(spike.y - by) > 90) {
        continue;
      }

      const left = spike.x - spike.width / 2;
      const right = spike.x + spike.width / 2;
      const top = spike.y - spike.height / 2;
      const bottom = spike.y + spike.height / 2;

      const closestX = Math.max(left, Math.min(bx, right));
      const closestY = Math.max(top, Math.min(by, bottom));
      const dx = bx - closestX;
      const dy = by - closestY;

      if (dx * dx + dy * dy < hitRadius * hitRadius) {
        return true;
      }
    }
    return false;
  }

  /**
   * Check if the player has touched any lava pit.
   */
  private checkLavaCollision(): boolean {
    const bx = this.ball.position.x;
    const by = this.ball.position.y;
    const hitRadius = (this.currentRadius ?? BALL_RADIUS) * 0.85;

    for (const lava of this.lavaPits) {
      // Broadphase AABB Culling: skip lava pits farther than extent + 90px
      if (
        Math.abs(lava.x - bx) > lava.width / 2 + 90 ||
        Math.abs(lava.y - by) > lava.height / 2 + 90
      ) {
        continue;
      }

      const left = lava.x - lava.width / 2;
      const right = lava.x + lava.width / 2;
      const top = lava.y - lava.height / 2;
      const bottom = lava.y + lava.height / 2;

      const closestX = Math.max(left, Math.min(bx, right));
      const closestY = Math.max(top, Math.min(by, bottom));
      const dx = bx - closestX;
      const dy = by - closestY;

      if (dx * dx + dy * dy < hitRadius * hitRadius) {
        return true;
      }
    }
    return false;
  }

  /**
   * Check if the player has touched an actively erupting lava geyser.
   */
  private checkGeyserCollision(): boolean {
    const bx = this.ball.position.x;
    const by = this.ball.position.y;
    const hitRadius = (this.currentRadius ?? BALL_RADIUS) * 0.85;

    for (const g of this.geysers) {
      if (!g.plat.isErupting) continue;
      // Broadphase AABB Culling
      if (Math.abs(g.plat.x - bx) > g.plat.width / 2 + 80) continue;

      // The erupting lava column extends upwards from baseY by height
      const left = g.plat.x - g.plat.width / 2;
      const right = g.plat.x + g.plat.width / 2;
      const top = g.baseY - g.height;
      const bottom = g.baseY + g.plat.height / 2;

      const closestX = Math.max(left, Math.min(bx, right));
      const closestY = Math.max(top, Math.min(by, bottom));
      const dx = bx - closestX;
      const dy = by - closestY;

      if (dx * dx + dy * dy < hitRadius * hitRadius) {
        return true;
      }
    }
    return false;
  }

  /**
   * Check if the player collided with a falling volcanic boulder.
   */
  private checkFallingRockCollision(): boolean {
    const bx = this.ball.position.x;
    const by = this.ball.position.y;
    const hitRadius = BALL_RADIUS * 0.9;

    for (const fr of this.fallingRocks) {
      if (fr.plat.y < -100) continue; // Rock offscreen

      const rRadius = fr.plat.width / 2;
      const dx = bx - fr.plat.x;
      const dy = by - fr.plat.y;
      const combinedRadius = hitRadius + rRadius;

      if (dx * dx + dy * dy < combinedRadius * combinedRadius) {
        return true;
      }
    }
    return false;
  }

  /**
   * Check if the player collided with a falling icicle.
   */
  private checkIcicleCollision(): boolean {
    const bx = this.ball.position.x;
    const by = this.ball.position.y;
    const r = this.currentRadius;

    for (const fi of this.fallingIcicles) {
      if (!fi.isDropping) continue;
      // Broadphase culling: skip icicles farther than 80px
      if (Math.abs(fi.plat.x - bx) > 80 || Math.abs(fi.plat.y - by) > 80) continue;

      const left = fi.plat.x - fi.plat.width / 2;
      const right = fi.plat.x + fi.plat.width / 2;
      const top = fi.plat.y - fi.plat.height / 2;
      const bottom = fi.plat.y + fi.plat.height / 2;

      const closestX = Math.max(left, Math.min(bx, right));
      const closestY = Math.max(top, Math.min(by, bottom));
      const dx = bx - closestX;
      const dy = by - closestY;

      if (dx * dx + dy * dy < r * r * 0.85) {
        return true;
      }
    }
    return false;
  }

  /**
   * Check if the player collided with any revolving spike head.
   */
  private checkRotatingSpikesCollision(): boolean {
    const bx = this.ball.position.x;
    const by = this.ball.position.y;
    const r = this.currentRadius;

    for (const rs of this.rotatingSpikes) {
      const armLength = rs.armLength ?? 80;
      // Broadphase culling: skip revolving spike if ball is farther than armLength + 40
      if (Math.abs(rs.x - bx) > armLength + 40 || Math.abs(rs.y - by) > armLength + 40) {
        continue;
      }

      const count = rs.spikeCount ?? 2;
      const baseAngle = rs.currentAngle ?? 0;
      const spikeRadius = 14;

      for (let i = 0; i < count; i++) {
        const angle = baseAngle + (i * 2 * Math.PI) / count;
        const sx = rs.x + Math.cos(angle) * armLength;
        const sy = rs.y + Math.sin(angle) * armLength;
        const dx = bx - sx;
        const dy = by - sy;
        const combined = r + spikeRadius;
        if (dx * dx + dy * dy < combined * combined) {
          return true;
        }
      }
    }
    return false;
  }

  /**
   * Check if the player collided with any moving saw blade.
   */
  private checkMovingSawsCollision(): boolean {
    const bx = this.ball.position.x;
    const by = this.ball.position.y;
    const r = this.currentRadius;

    for (const saw of this.movingSaws) {
      const sawRadius = saw.sawRadius ?? 22;
      // Broadphase culling: skip saw if ball is farther than sawRadius + 50
      if (Math.abs(saw.x - bx) > sawRadius + 50 || Math.abs(saw.y - by) > sawRadius + 50) {
        continue;
      }

      const dx = bx - saw.x;
      const dy = by - saw.y;
      const combined = r + sawRadius;
      if (dx * dx + dy * dy < combined * combined) {
        return true;
      }
    }
    return false;
  }

  /**
   * Resolves target mechanisms (doors, gates) when switches/pressure plates trigger.
   */
  private resolveSwitchTargets(trigger: PlatformData): void {
    // 1. Linked door (direct)
    if (trigger.linkedDoorId) {
      const gateTrack = this.stoneGates.find((g) => g.plat.id === trigger.linkedDoorId);
      if (gateTrack) {
        gateTrack.plat.isOpen = true;
        gateTrack.body.isSensor = true;
        Matter.Body.setPosition(gateTrack.body, { x: -9999, y: -9999 });
      }
      const lockedTrack = this.lockedDoors.find((d) => d.plat.id === trigger.linkedDoorId);
      if (lockedTrack) {
        lockedTrack.plat.isOpen = true;
        lockedTrack.plat.doorState = 'open';
        lockedTrack.body.isSensor = true;
        Matter.Body.setPosition(lockedTrack.body, { x: -9999, y: -9999 });
      }
    }

    // 2. Target IDs array
    if (trigger.targetIds) {
      for (const tid of trigger.targetIds) {
        const gate = this.stoneGates.find((g) => g.plat.id === tid);
        if (gate) {
          gate.plat.isOpen = true;
          gate.body.isSensor = true;
          Matter.Body.setPosition(gate.body, { x: -9999, y: -9999 });
        }
        const door = this.lockedDoors.find((d) => d.plat.id === tid);
        if (door) {
          door.plat.isOpen = true;
          door.plat.doorState = 'open';
          door.body.isSensor = true;
          Matter.Body.setPosition(door.body, { x: -9999, y: -9999 });
        }
      }
    }

    // 3. Multi-switch puzzles: evaluate doors requiring multiple active switches
    for (const gate of this.stoneGates) {
      if (gate.plat.requiredSwitches && gate.plat.requiredSwitches.length > 0) {
        const allActive = gate.plat.requiredSwitches.every((swId) => {
          const sw =
            this.pressurePlates.find((p) => p.id === swId) ??
            this.wallSwitches.find((w) => w.id === swId);
          return sw ? sw.isActivated || sw.isPressed : false;
        });
        if (allActive) {
          gate.plat.isOpen = true;
          gate.body.isSensor = true;
          Matter.Body.setPosition(gate.body, { x: -9999, y: -9999 });
        }
      }
    }

    for (const door of this.lockedDoors) {
      if (door.plat.requiredSwitches && door.plat.requiredSwitches.length > 0) {
        const allActive = door.plat.requiredSwitches.every((swId) => {
          const sw =
            this.pressurePlates.find((p) => p.id === swId) ??
            this.wallSwitches.find((w) => w.id === swId);
          return sw ? sw.isActivated || sw.isPressed : false;
        });
        if (allActive) {
          door.plat.isOpen = true;
          door.plat.doorState = 'open';
          door.body.isSensor = true;
          Matter.Body.setPosition(door.body, { x: -9999, y: -9999 });
          saveManager.markDoorUnlocked(door.plat.id).catch(() => {});
        }
      }
    }
  }

  /**
   * Check if the player has entered the golden exit ring.
   */
  private checkExitRing(): void {
    if (!this.exitRing || this.isLevelComplete) return;

    const dx = this.ball.position.x - this.exitRing.x;
    const dy = this.ball.position.y - this.exitRing.y;
    const touchRadius = this.currentRadius + this.exitRing.width / 2;

    if (dx * dx + dy * dy < touchRadius * touchRadius) {
      this.isLevelComplete = true;
      // Immediately zero ball velocity to prevent falling into void / hazards
      Matter.Body.setVelocity(this.ball, { x: 0, y: 0 });
      SoundManager.playLevelCompleteSound();
    }
  }

  /**
   * Check if the player has touched a checkpoint beacon.
   */
  private checkCheckpoints(): void {
    const bx = this.ball.position.x;
    const by = this.ball.position.y;
    const touchRadiusSq = (this.currentRadius + 28) * (this.currentRadius + 28);

    for (const cp of this.checkpoints) {
      const dx = bx - cp.x;
      const dy = by - cp.y;
      if (dx * dx + dy * dy < touchRadiusSq) {
        if (!cp.isActivated) {
          cp.isActivated = true;
          this.activeCheckpoint = { x: cp.x, y: cp.y - 10 };
          this.activeCheckpointForm = this.currentForm;
          SoundManager.playCheckpointSound();
        }
      }
    }
  }

  /**
   * Check if the ball can safely expand to target radius without clipping into static platforms.
   * If direct expansion would clip, tests candidate nudges.
   */
  private checkExpansionClearance(targetRadius: number): { canExpand: boolean; nudgeY?: number } {
    const bx = this.ball.position.x;
    const by = this.ball.position.y;
    const candidateOffsets = [0, -(targetRadius - this.currentRadius), (targetRadius - this.currentRadius)];

    for (const dy of candidateOffsets) {
      const testY = by + dy;
      let hasCollision = false;

      for (const plat of this.platforms) {
        const isSolid =
          plat.type === 'ground' ||
          plat.type === 'floating' ||
          plat.type === 'wall' ||
          plat.type === 'ice' ||
          (plat.type === 'snow_platform' && !plat.isCollapsed) ||
          (plat.type === 'cracked_wall' && !plat.isBroken && targetRadius !== 25) ||
          (plat.type === 'stone_gate' && !plat.isOpen);

        if (!isSolid) {
          continue;
        }

        const left = plat.x - plat.width / 2;
        const right = plat.x + plat.width / 2;
        const top = plat.y - plat.height / 2;
        const bottom = plat.y + plat.height / 2;

        const closestX = Math.max(left, Math.min(bx, right));
        const closestY = Math.max(top, Math.min(testY, bottom));
        const distSq = (bx - closestX) * (bx - closestX) + (testY - closestY) * (testY - closestY);

        if (distSq < targetRadius * targetRadius * 0.95) {
          hasCollision = true;
          break;
        }
      }

      if (!hasCollision) {
        return { canExpand: true, nudgeY: dy };
      }
    }

    return { canExpand: false };
  }

  /**
   * Dynamically transforms the player ball's size and physical density.
   * Updates Matter.js rigid body scale and density.
   */
  public setBallSize(size: BallSize, density?: BallDensity): boolean {
    if (this.currentSize === size && (!density || this.currentDensity === density)) {
      return true;
    }

    const targetRadius = size === 'small' ? 15 : size === 'large' ? 34 : 24;
    const targetDensity = density ?? (size === 'small' ? 'heavy' : size === 'large' ? 'light' : 'normal');

    if (targetRadius > this.currentRadius) {
      const clearance = this.checkExpansionClearance(targetRadius);
      if (!clearance.canExpand) {
        return false; // Prevent clipping into tight tunnels
      }
      if (clearance.nudgeY) {
        Matter.Body.setPosition(this.ball, {
          x: this.ball.position.x,
          y: this.ball.position.y + clearance.nudgeY,
        });
      }
    }

    const scaleFactor = targetRadius / this.currentRadius;
    Matter.Body.scale(this.ball, scaleFactor, scaleFactor);
    this.currentRadius = targetRadius;
    this.currentSize = size;
    this.currentDensity = targetDensity;
    this.currentForm = 'original';

    // Physically adjust density & mass
    const densityMult =
      targetDensity === 'heavy'
        ? DENSITY_MULT_SMALL
        : targetDensity === 'light'
        ? DENSITY_MULT_LARGE
        : DENSITY_MULT_NORMAL;
    Matter.Body.setDensity(this.ball, BALL_DENSITY * densityMult);
    return true;
  }

  /**
   * Dynamically transforms the ball into one of four playable forms:
   * - 'original': Classic red bouncing ball (r=24)
   * - 'big': Large buoyant ball (r=34) - floats high on water, high springy breach leaps
   * - 'stone': Slate-grey stone ball (r=25) - breaks cracked walls, depresses heavy plates, resists wind, sinks fast
   * - 'snow': Frosted snow ball (r=16) - fits narrow tunnels, glides over fragile snow, fast on ice
   */
  public setBallForm(form: BallForm): boolean {
    if (this.currentForm === form) return true;

    const config = BALL_FORM_CONFIGS[form];
    if (!config) return false;

    if (config.radius > this.currentRadius) {
      const clearance = this.checkExpansionClearance(config.radius);
      if (!clearance.canExpand) {
        return false; // Safely prevent expanding inside narrow tunnels
      }
      if (clearance.nudgeY) {
        Matter.Body.setPosition(this.ball, {
          x: this.ball.position.x,
          y: this.ball.position.y + clearance.nudgeY,
        });
      }
    }

    const scaleFactor = config.radius / this.currentRadius;
    Matter.Body.scale(this.ball, scaleFactor, scaleFactor);
    this.currentRadius = config.radius;
    this.currentForm = form;
    this.currentSize = form === 'big' ? 'large' : form === 'snow' ? 'small' : 'normal';
    this.currentDensity =
      form === 'stone' ? 'heavy' : (form === 'big' || form === 'snow') ? 'light' : 'normal';

    // Apply exact Matter.js physical properties from authoritative config
    Matter.Body.setDensity(this.ball, config.density);
    this.ball.friction = 0.001;
    this.ball.frictionAir = 0.001;
    this.ball.restitution = config.restitution;

    // Trigger visual transformation effect & audio synthesis
    this.transformationEffect = {
      form,
      startTime: this.simTime,
      duration: 0.45,
    };
    SoundManager.playTransformationSound(form);

    return true;
  }

  public step(
    deltaTimeMs: number,
    input: InputController | InputState | RawInputState
  ): void {
    // If level is already completed, freeze ball and bypass all physics/hazard/death steps
    if (this.isLevelComplete) {
      Matter.Body.setVelocity(this.ball, { x: 0, y: 0 });
      return;
    }

    const clampedDelta = Math.min(deltaTimeMs, 16.667);
    this.simTime += clampedDelta / 1000;
    if (!this.isLevelComplete) {
      this.elapsedGameplayTime += clampedDelta / 1000;
    }

    const hazardSpeedScale = this.isMobile ? 0.82 : 1.0;

    // 1. Update Moving Platforms
    for (const track of this.movingPlatforms) {
      const targetX =
        track.baseX +
        (track.moveRangeX ? Math.sin(this.simTime * track.moveSpeed * hazardSpeedScale) * track.moveRangeX : 0);
      const targetY =
        track.baseY +
        (track.moveRangeY ? Math.cos(this.simTime * track.moveSpeed * hazardSpeedScale) * track.moveRangeY : 0);

      const dx = targetX - track.plat.x;
      const dy = targetY - track.plat.y;

      track.plat.x = targetX;
      track.plat.y = targetY;
      Matter.Body.setPosition(track.body, { x: targetX, y: targetY });

      // If ball is resting on top of this moving platform, carry the ball smoothly
      if (this.isCurrentlyGrounded && this.lastGroundedPlatformId === track.plat.id) {
        Matter.Body.setPosition(this.ball, {
          x: this.ball.position.x + dx,
          y: this.ball.position.y + dy,
        });
      }
    }

    // 1.1. Update Rotating Platforms (Revolving Orbit Around Center Anchor)
    for (const rp of this.rotatingPlatforms) {
      const spd = rp.angularSpeed * hazardSpeedScale;
      rp.plat.currentAngle =
        ((rp.plat.currentAngle ?? 0) + spd * (clampedDelta / 1000)) % (2 * Math.PI);
      const targetX = rp.pivotX + Math.cos(rp.plat.currentAngle) * rp.orbitRadius;
      const targetY = rp.pivotY + Math.sin(rp.plat.currentAngle) * rp.orbitRadius;

      const dx = targetX - rp.plat.x;
      const dy = targetY - rp.plat.y;

      rp.plat.x = targetX;
      rp.plat.y = targetY;
      Matter.Body.setPosition(rp.body, { x: targetX, y: targetY });

      // If ball is resting on top of this revolving platform, carry the ball smoothly
      if (this.isCurrentlyGrounded && this.lastGroundedPlatformId === rp.plat.id) {
        Matter.Body.setPosition(this.ball, {
          x: this.ball.position.x + dx,
          y: this.ball.position.y + dy,
        });
      }
    }

    // 2. Update Moving Spikes
    for (const ms of this.movingSpikes) {
      const targetX =
        ms.baseX +
        (ms.moveRangeX ? Math.sin(this.simTime * ms.moveSpeed * hazardSpeedScale) * ms.moveRangeX : 0);
      const targetY =
        ms.baseY +
        (ms.moveRangeY ? Math.cos(this.simTime * ms.moveSpeed * hazardSpeedScale) * ms.moveRangeY : 0);

      ms.spike.x = targetX;
      ms.spike.y = targetY;
    }

    // 3. Update Crumbling Platforms
    for (const cp of this.crumblingPlatforms) {
      // If ball was grounded on it, initiate collapse timer
      if (
        this.isCurrentlyGrounded &&
        this.lastGroundedPlatformId === cp.plat.id &&
        cp.crumbleTime === undefined
      ) {
        cp.crumbleTime = this.simTime + 0.55;
      }

      // If timer reached, collapse platform
      if (cp.crumbleTime && this.simTime >= cp.crumbleTime && !cp.plat.isCollapsed) {
        cp.plat.isCollapsed = true;
        cp.respawnTime = this.simTime + 2.8;
        Matter.Body.setPosition(cp.body, { x: -9999, y: -9999 });
        if (this.lastGroundedPlatformId === cp.plat.id) {
          this.isCurrentlyGrounded = false;
          this.lastGroundedPlatformId = null;
        }
      }

      // If respawn timer reached, restore platform
      if (cp.plat.isCollapsed && cp.respawnTime && this.simTime >= cp.respawnTime) {
        cp.plat.isCollapsed = false;
        cp.crumbleTime = undefined;
        cp.respawnTime = undefined;
        Matter.Body.setPosition(cp.body, { x: cp.baseX, y: cp.baseY });
      }
    }

    // 4. Update Lava Geysers (Timed Periodic Eruptions & Visible Warning Timing)
    for (const g of this.geysers) {
      const cycleTime = g.cycleTime;
      const offset = g.plat.cycleOffset ?? 0;
      const phase = (this.simTime + offset) % cycleTime;
      const isErupting = phase >= g.eruptStart && phase < g.eruptStart + g.eruptDuration;
      g.plat.isErupting = isErupting;
      // 0.5s visual warning prior to eruption
      const warnStart = (g.eruptStart - 0.5 + cycleTime) % cycleTime;
      const isWarning =
        !isErupting &&
        (warnStart < g.eruptStart
          ? phase >= warnStart && phase < g.eruptStart
          : phase >= warnStart || phase < g.eruptStart);
      g.plat.isWarning = isWarning;
    }

    // 5. Update Falling Rocks (Periodic Volcanic Boulders)
    for (const fr of this.fallingRocks) {
      const fallDuration = (fr.endY - fr.startY) / fr.speed;
      const cycleTime = Math.max(fr.interval, fallDuration);
      const phase = this.simTime % cycleTime;
      if (phase < fallDuration) {
        fr.plat.y = fr.startY + phase * fr.speed;
      } else {
        fr.plat.y = -9999;
      }
    }

    // 5.1. Update Moving Saws (Rail Sliding Oscillator)
    for (const saw of this.movingSaws) {
      const startX = saw.pathStartX ?? saw.x;
      const startY = saw.pathStartY ?? saw.y;
      const endX = saw.pathEndX ?? saw.x + 200;
      const endY = saw.pathEndY ?? saw.y;
      const speed = (saw.moveSpeed ?? 1.6) * hazardSpeedScale;
      const t = (Math.sin(this.simTime * speed) + 1) / 2;
      saw.x = startX + (endX - startX) * t;
      saw.y = startY + (endY - startY) * t;
    }

    // 5.2. Update Rotating Spikes (Continuous Angular Revolution)
    for (const rs of this.rotatingSpikes) {
      const spd = (rs.angularSpeed ?? 1.8) * hazardSpeedScale;
      rs.currentAngle = ((rs.currentAngle ?? 0) + spd * (clampedDelta / 1000)) % (2 * Math.PI);
    }

    // 5.3. Update Timed Doors (Cyclic Shutter Gates)
    for (const td of this.timedDoors) {
      const period = td.plat.cyclePeriod ?? 4.5;
      const openDur = td.plat.openDuration ?? 2.0;
      const offset = td.plat.cycleOffset ?? 0;
      const phase = (this.simTime + offset) % period;
      const isOpen = phase < openDur;
      td.plat.isOpen = isOpen;
      td.plat.doorState = isOpen ? 'open' : 'locked';
      if (isOpen) {
        td.body.isSensor = true;
        Matter.Body.setPosition(td.body, { x: -9999, y: -9999 });
      } else {
        td.body.isSensor = false;
        Matter.Body.setPosition(td.body, { x: td.baseX, y: td.baseY });
      }
    }

    // 5.4. Update Disappearing / Phasing Platforms
    for (const dp of this.disappearingPlatforms) {
      const period = dp.plat.cyclePeriod ?? 4.0;
      const openDur = dp.plat.openDuration ?? 2.2;
      const offset = dp.plat.cycleOffset ?? 0;
      const phase = (this.simTime + offset) % period;
      const isVisible = phase < openDur;
      dp.plat.isCollapsed = !isVisible;
      if (isVisible) {
        dp.body.isSensor = false;
        Matter.Body.setPosition(dp.body, { x: dp.baseX, y: dp.baseY });
      } else {
        dp.body.isSensor = true;
        Matter.Body.setPosition(dp.body, { x: -9999, y: -9999 });
        if (this.lastGroundedPlatformId === dp.plat.id) {
          this.isCurrentlyGrounded = false;
          this.lastGroundedPlatformId = null;
        }
      }
    }

    // 5.5. Update Falling Platforms (Tremor & Drop on Contact)
    for (const fp of this.fallingPlatforms) {
      if (fp.plat.isFalling) {
        fp.plat.y += (clampedDelta / 1000) * 380;
        Matter.Body.setPosition(fp.body, { x: fp.baseX, y: fp.plat.y });
        if (fp.respawnTimer && this.simTime >= fp.respawnTimer) {
          fp.plat.isFalling = false;
          fp.plat.isShaking = false;
          fp.shakeTimer = undefined;
          fp.respawnTimer = undefined;
          fp.plat.y = fp.baseY;
          Matter.Body.setPosition(fp.body, { x: fp.baseX, y: fp.baseY });
        }
      } else if (fp.plat.isShaking) {
        fp.plat.x = fp.baseX + (Math.random() - 0.5) * 4;
        if (fp.shakeTimer && this.simTime >= fp.shakeTimer) {
          fp.plat.isShaking = false;
          fp.plat.isFalling = true;
          fp.plat.x = fp.baseX;
          fp.respawnTimer = this.simTime + 3.2;
          if (this.lastGroundedPlatformId === fp.plat.id) {
            this.isCurrentlyGrounded = false;
            this.lastGroundedPlatformId = null;
          }
        }
      } else {
        if (this.isCurrentlyGrounded && this.lastGroundedPlatformId === fp.plat.id) {
          fp.plat.isShaking = true;
          fp.shakeTimer = this.simTime + 0.35;
        }
      }
    }

    // 6. Update Rising Danger Hazard Zone
    if (this.risingZoneConfig) {
      const rz = this.risingZoneConfig;
      const triggerX = rz.triggerX ?? rz.startX;
      const riseStartX = rz.riseStartX ?? (rz.startX + 100);

      // Pre-activate and show at bottom when player enters the section
      if (this.ball.position.x >= triggerX && this.ball.position.x <= rz.endX) {
        if (!this.isRisingLavaActive || this.risingLavaY === undefined) {
          this.isRisingLavaActive = true;
          this.risingLavaY = rz.initialY;
        }
      }

      // Smoothly rise towards targetY once ball advances past the safe starting platform
      if (this.isRisingLavaActive && this.risingLavaY !== undefined) {
        if (this.ball.position.x >= riseStartX) {
          const riseDelta = (clampedDelta / 1000) * rz.speed;
          this.risingLavaY = Math.max(rz.targetY, this.risingLavaY - riseDelta);
        }
      }
    }

    // Clear game over notification when timer expires
    if (this.gameOverNotification && this.simTime >= this.gameOverNotificationTimer) {
      this.gameOverNotification = null;
    }

    // Clear transformation effect when duration expires
    if (
      this.transformationEffect &&
      this.simTime >= this.transformationEffect.startTime + this.transformationEffect.duration
    ) {
      this.transformationEffect = null;
    }

    // 7. Coin Collection Check
    const collectedCoins = this.coinManager.checkCollisions(
      this.ball.position.x,
      this.ball.position.y,
      this.currentRadius,
      this.onCoinCollected
    );
    if (collectedCoins.length > 0) {
      this.coinsCollectedThisRun += collectedCoins.length;
    }

    // 7.1. Key Collection Check
    this.keyManager.checkCollisions(
      this.ball.position.x,
      this.ball.position.y,
      this.currentRadius,
      this.onKeyCollected
    );

    // 7.2. Locked Doors Check
    for (const ld of this.lockedDoors) {
      if (ld.plat.isOpen) continue;
      const left = ld.plat.x - ld.plat.width / 2;
      const right = ld.plat.x + ld.plat.width / 2;
      const top = ld.plat.y - ld.plat.height / 2;
      const bottom = ld.plat.y + ld.plat.height / 2;
      const bx = this.ball.position.x;
      const by = this.ball.position.y;
      const r = this.currentRadius;

      const closestX = Math.max(left, Math.min(bx, right));
      const closestY = Math.max(top, Math.min(by, bottom));
      const dx = bx - closestX;
      const dy = by - closestY;

      if (dx * dx + dy * dy < (r + 8) * (r + 8)) {
        const reqKey = ld.plat.requiredKeyId;
        const hasKey = reqKey
          ? saveManager.isKeyCollected(reqKey) ||
            this.keyManager
              .getAllLevelKeys()
              .some((k) => (k.keyId === reqKey || k.id === reqKey) && saveManager.isKeyCollected(k.id))
          : true;
        if (hasKey) {
          ld.plat.isOpen = true;
          ld.plat.doorState = 'open';
          ld.body.isSensor = true;
          Matter.Body.setPosition(ld.body, { x: -9999, y: -9999 });
          saveManager.markDoorUnlocked(ld.plat.id).catch(() => {});
          SoundManager.playDoorUnlockSound();
        }
      }
    }

    // 7.3. Spring & Bounce Pads Check
    for (const bp of this.bouncePads) {
      if (bp.plat.springCompression && bp.plat.springCompression > 0) {
        bp.plat.springCompression = Math.max(
          0,
          bp.plat.springCompression - (clampedDelta / 1000) * 4.5
        );
      }

      const bx = this.ball.position.x;
      const by = this.ball.position.y;
      const r = this.currentRadius;
      const padTop = bp.plat.y - bp.plat.height / 2;
      const padLeft = bp.plat.x - bp.plat.width / 2;
      const padRight = bp.plat.x + bp.plat.width / 2;

      // Check if ball makes contact with the bounce pad surface
      const isOverHoriz = bx >= padLeft - r * 0.25 && bx <= padRight + r * 0.25;
      const isAtSurface = by + r >= padTop - 6 && by + r <= padTop + 16;

      if (isOverHoriz && isAtSurface && this.ball.velocity.y >= -2.0) {
        const mult =
          this.currentForm === 'big'
            ? 1.30
            : this.currentForm === 'snow'
            ? 1.10
            : this.currentForm === 'stone'
            ? 0.65
            : 1.00;

        // Determine launch direction from platform configuration
        const dir = bp.plat.launchDirection ?? 'up';
        let dirX = 0;
        let dirY = -1; // Default upward
        if (dir === 'down') {
          dirX = 0;
          dirY = 1;
        } else if (dir === 'left') {
          dirX = -1;
          dirY = 0;
        } else if (dir === 'right') {
          dirX = 1;
          dirY = 0;
        }

        // Calculate vertical launch velocity (strictly upward unless platform explicitly points elsewhere)
        const rawForceY = bp.plat.launchForceY ?? -22.0;
        const baseSpeedY = Math.max(22.0, Math.abs(rawForceY));
        const launchVy = dirY * baseSpeedY * mult;

        // Calculate horizontal launch velocity based on collision contact position on the pad
        let launchVx = 0;
        if (bp.plat.launchForceX !== undefined && bp.plat.launchForceX !== 0) {
          // Explicit platform horizontal force (e.g. angled launch pads in Level 3)
          launchVx = bp.plat.launchForceX * mult;
        } else if (dir === 'up') {
          // Calculate normalized collision position (-1.0 at left edge, 0 at center, +1.0 at right edge)
          const padHalfW = bp.plat.width / 2;
          const contactX = Math.max(padLeft, Math.min(padRight, bx));
          const normOffset = padHalfW > 0 ? (contactX - bp.plat.x) / padHalfW : 0;
          // Center contact launches cleanly straight up; off-center contact adds gentle directional deflection
          launchVx = Math.abs(normOffset) >= 0.15 ? normOffset * 2.2 * mult : 0;
        } else if (dir === 'left' || dir === 'right') {
          const rawForceX = bp.plat.launchForceX ?? 18.0;
          launchVx = dirX * Math.abs(rawForceX) * mult;
        }

        // Safely position ball slightly above the bounce pad surface to prevent sticking
        Matter.Body.setPosition(this.ball, { x: bx, y: padTop - r - 2 });
        Matter.Body.setVelocity(this.ball, { x: launchVx, y: launchVy });

        this.isCurrentlyGrounded = false;
        this.lastGroundedPlatformId = null;
        bp.plat.springCompression = 1.0;
        SoundManager.playBouncePadSound();
        this.scaleX = 0.82;
        this.scaleY = 1.25;
      }
    }

    // 7.4. Paired Teleporters Check
    if (this.playerTeleportCooldown > 0) {
      this.playerTeleportCooldown -= clampedDelta / 1000;
    }

    for (const tp of this.teleporters) {
      if (tp.teleportCooldown && tp.teleportCooldown > 0) {
        tp.teleportCooldown -= clampedDelta / 1000;
      }

      if (this.playerTeleportCooldown <= 0 && (!tp.teleportCooldown || tp.teleportCooldown <= 0)) {
        const dx = this.ball.position.x - tp.x;
        const dy = this.ball.position.y - tp.y;
        if (dx * dx + dy * dy < 34 * 34) {
          const target = this.teleporters.find((t) => t.id === tp.targetTeleporterId);
          if (target) {
            const destX = target.x;
            const destY = target.y - 12;

            Matter.Body.setPosition(this.ball, { x: destX, y: destY });
            Matter.Body.setVelocity(this.ball, { x: 0, y: Math.min(this.ball.velocity.y, -3.5) });

            this.playerTeleportCooldown = 1.4;
            tp.teleportCooldown = 1.4;
            target.teleportCooldown = 1.4;
            SoundManager.playTeleportSound();
          }
        }
      }
    }

    // 7.45. Secret Passages Discovery Check
    for (const sp of this.secretPassages) {
      const left = sp.x - sp.width / 2;
      const right = sp.x + sp.width / 2;
      const top = sp.y - sp.height / 2;
      const bottom = sp.y + sp.height / 2;
      const bx = this.ball.position.x;
      const by = this.ball.position.y;

      if (bx >= left && bx <= right && by >= top && by <= bottom) {
        if (!sp.isRevealed) {
          sp.isRevealed = true;
          SoundManager.playSecretFoundSound();
        }
      }
    }

    // 7.5. Transformer Gates Trigger Check (Automatic in-world transformation)
    for (const gate of this.transformerGates) {
      const dx = this.ball.position.x - gate.x;
      const dy = this.ball.position.y - gate.y;
      const triggerRadius = this.currentRadius + gate.width / 2;
      if (dx * dx + dy * dy < triggerRadius * triggerRadius) {
        if (gate.type === 'transformer_big' && this.currentForm !== 'big') {
          this.setBallForm('big');
        } else if (gate.type === 'transformer_stone' && this.currentForm !== 'stone') {
          this.setBallForm('stone');
        } else if (gate.type === 'transformer_snow' && this.currentForm !== 'snow') {
          this.setBallForm('snow');
        } else if (gate.type === 'transformer_original' && this.currentForm !== 'original') {
          this.setBallForm('original');
        } else if (gate.type === 'transformer_shrink' && this.currentSize !== 'small') {
          this.setBallSize('small');
        } else if (gate.type === 'transformer_grow' && this.currentSize !== 'large') {
          this.setBallSize('large');
        } else if (gate.type === 'transformer_normal' && this.currentSize !== 'normal') {
          this.setBallSize('normal');
        }
      }
    }

    const currentConfig = BALL_FORM_CONFIGS[this.currentForm] ?? BALL_FORM_CONFIGS.original;

    // 7.7. Cracked Stone Walls Check
    for (const cw of this.crackedWalls) {
      if (cw.plat.isBroken) continue;
      const dx = this.ball.position.x - cw.plat.x;
      const dy = this.ball.position.y - cw.plat.y;
      const hitDistX = this.currentRadius + cw.plat.width / 2;
      const hitDistY = this.currentRadius + cw.plat.height / 2;
      if (Math.abs(dx) <= hitDistX + 3 && Math.abs(dy) <= hitDistY + 3) {
        if (currentConfig.canBreakCrackedWall) {
          cw.plat.isBroken = true;
          cw.body.isSensor = true;
          Matter.Body.setPosition(cw.body, { x: -9999, y: -9999 });
          SoundManager.playWallBreakSound();
        }
      }
    }

    // 7.8. Pressure Plates (Floor) & Wall Switches Check
    // Wall Switches
    for (const ws of this.wallSwitches) {
      const dx = Math.abs(this.ball.position.x - ws.x);
      const dy = Math.abs(this.ball.position.y - ws.y);
      const hitW = this.currentRadius + ws.width / 2 + 4;
      const hitH = this.currentRadius + ws.height / 2 + 4;
      if (dx <= hitW && dy <= hitH) {
        if (!ws.isActivated) {
          ws.isActivated = true;
          ws.isPressed = true;
          SoundManager.playSwitchSound(true);
          this.resolveSwitchTargets(ws);
        }
      }
    }

    // Floor Pressure Plates
    for (const plate of this.pressurePlates) {
      const left = plate.x - plate.width / 2;
      const right = plate.x + plate.width / 2;
      const top = plate.y - plate.height / 2 - 10;
      const bottom = plate.y + plate.height / 2 + 6;
      const bx = this.ball.position.x;
      const by = this.ball.position.y + this.currentRadius;

      const isOverPlate = bx >= left && bx <= right && by >= top && by <= bottom;
      const isHeavy = plate.type === 'heavy_pressure_plate' || plate.switchType === 'heavy';
      const canActivate = isHeavy ? currentConfig.canActivateHeavyPlate : true;

      if (isOverPlate && canActivate) {
        if (!plate.isPressed) {
          plate.isPressed = true;
          plate.isActivated = true;
          SoundManager.playSwitchSound(true);
          this.resolveSwitchTargets(plate);
        }
      }
    }

    // Keep any open stone gates and broken cracked walls reliably nonsolid
    for (const gate of this.stoneGates) {
      if (gate.plat.isOpen && (!gate.body.isSensor || gate.body.position.x > -1000)) {
        gate.body.isSensor = true;
        Matter.Body.setPosition(gate.body, { x: -9999, y: -9999 });
      }
    }
    for (const cw of this.crackedWalls) {
      if (cw.plat.isBroken && (!cw.body.isSensor || cw.body.position.x > -1000)) {
        cw.body.isSensor = true;
        Matter.Body.setPosition(cw.body, { x: -9999, y: -9999 });
      }
    }

    // 7.10. Fragile Snow Platforms Check
    for (const sp of this.fragileSnowPlatforms) {
      if (sp.plat.isCollapsed) {
        if (sp.respawnTimer && this.simTime >= sp.respawnTimer) {
          sp.plat.isCollapsed = false;
          sp.collapseTimer = undefined;
          sp.respawnTimer = undefined;
          Matter.Body.setPosition(sp.body, { x: sp.baseX, y: sp.baseY });
        }
        continue;
      }

      if (this.isCurrentlyGrounded && this.lastGroundedPlatformId === sp.plat.id) {
        if (currentConfig.canWalkOnFragileSnow) {
          // Snow Ball glides safely across fragile snow bridges!
        } else {
          // Stone Ball instantly collapses snow (0.15s), Big Ball in 0.35s, Original Ball in 0.45s
          if (sp.collapseTimer === undefined) {
            const delay =
              this.currentForm === 'stone' ? 0.15 : this.currentForm === 'big' ? 0.35 : 0.45;
            sp.collapseTimer = this.simTime + delay;
          }
        }
      }

      if (sp.collapseTimer && this.simTime >= sp.collapseTimer && !sp.plat.isCollapsed) {
        sp.plat.isCollapsed = true;
        sp.respawnTimer = this.simTime + 2.8;
        Matter.Body.setPosition(sp.body, { x: -9999, y: -9999 });
        if (this.lastGroundedPlatformId === sp.plat.id) {
          this.isCurrentlyGrounded = false;
          this.lastGroundedPlatformId = null;
        }
      }
    }

    // 7.11. Falling Icicles Hazard Update
    for (const fi of this.fallingIcicles) {
      if (!fi.isDropping) {
        const dx = Math.abs(this.ball.position.x - fi.plat.x);
        if (dx < 75 && this.ball.position.y > fi.startY && this.ball.position.y < fi.endY + 60) {
          fi.isDropping = true;
        }
      } else {
        fi.plat.y = Math.min(fi.endY, fi.plat.y + (clampedDelta / 1000) * 360);
      }
    }

    // 7.6. Water & Fluid Zone Overlap Check
    const wasInWater = this.isInWater;
    this.isInWater = false;
    this.submergedRatio = 0;
    const bx = this.ball.position.x;
    const by = this.ball.position.y;
    const r = this.currentRadius;
    let activeWater: PlatformData | null = null;
    let isWaterfall = false;

    for (const wz of this.waterZones) {
      const left = wz.x - wz.width / 2;
      const right = wz.x + wz.width / 2;
      const top = wz.y - wz.height / 2;
      const bottom = wz.y + wz.height / 2;

      // Check horizontal and vertical bounding overlaps
      const overlapLeft = Math.max(bx - r, left);
      const overlapRight = Math.min(bx + r, right);
      const overlapWidth = overlapRight - overlapLeft;

      const overlapTop = Math.max(by - r, top);
      const overlapBottom = Math.min(by + r, bottom);
      const overlapHeight = overlapBottom - overlapTop;

      if (overlapWidth > 0 && overlapHeight > 0) {
        this.isInWater = true;
        activeWater = wz;
        isWaterfall = wz.type === 'waterfall';

        // Submersion depth measured from bottom of the ball relative to water surface
        const depth = Math.min(2 * r, Math.max(0, (by + r) - top));
        const vertRatio = computeCircularSubmergedRatio(depth, r);
        const horizRatio = Math.min(1.0, Math.max(0, overlapWidth / (2 * r)));

        this.submergedRatio = Math.min(1.0, vertRatio * (horizRatio >= 0.85 ? 1.0 : horizRatio / 0.85));
        break;
      }
    }

    if (!wasInWater && this.isInWater) {
      SoundManager.playWaterSplashSound(true);
    } else if (wasInWater && !this.isInWater) {
      SoundManager.playWaterSplashSound(false);
    }

    // 8. Hazard Collision Checks
    const isInvulnerable = this.lifeManager.isInvulnerable(this.simTime);
    const hitHazard =
      !isInvulnerable &&
      (this.checkSpikeCollision() ||
        this.checkLavaCollision() ||
        this.checkGeyserCollision() ||
        this.checkFallingRockCollision() ||
        this.checkIcicleCollision() ||
        this.checkRotatingSpikesCollision() ||
        this.checkMovingSawsCollision());

    const submergedRisingLava =
      !isInvulnerable &&
      this.risingZoneConfig !== undefined &&
      this.isRisingLavaActive &&
      this.risingLavaY !== undefined &&
      this.ball.position.x >= this.risingZoneConfig.startX &&
      this.ball.position.x <= this.risingZoneConfig.endX &&
      this.ball.position.y >= this.risingLavaY - BALL_RADIUS * 0.7;

    const fellOutOfWorld = this.ball.position.y > this.worldHeight + 150;

    if (hitHazard || submergedRisingLava || fellOutOfWorld) {
      if (hitHazard) {
        SoundManager.playHazardHitSound();
      }
      this.triggerDeath();
      return;
    }

    // 9. Checkpoints Check
    this.checkCheckpoints();

    // 9.1. Update Challenge Countdown Timers (The Five Flames & The Wind Passage)
    if (this.activeChallengeTimer) {
      const curTimer = this.challengeTimers.find(
        (t) => t.id === this.activeChallengeTimer?.id
      );
      if (curTimer && bx >= curTimer.endX) {
        // Successfully crossed the challenge!
        this.completedTimerIds.add(curTimer.id);
        this.activeChallengeTimer = null;
        SoundManager.playCheckpointSound();
      } else {
        this.activeChallengeTimer.remainingSeconds -= clampedDelta / 1000;
        if (this.activeChallengeTimer.remainingSeconds <= 0) {
          // Timer expired: Challenge failed, reset player to active checkpoint
          this.activeChallengeTimer = null;
          this.triggerDeath();
          return;
        }
      }
    } else {
      for (const ct of this.challengeTimers) {
        if (!this.completedTimerIds.has(ct.id) && bx >= ct.startX && bx < ct.endX) {
          this.activeChallengeTimer = {
            id: ct.id,
            label: ct.label,
            remainingSeconds: ct.durationSeconds,
            maxSeconds: ct.durationSeconds,
          };
          break;
        }
      }
    }

    // 10. Exit Ring Trigger Check
    this.checkExitRing();
    if (this.isLevelComplete) {
      Matter.Body.setVelocity(this.ball, { x: 0, y: 0 });
      return;
    }

    const wasGrounded = this.isCurrentlyGrounded;

    // 11. Evaluate grounded status
    this.isCurrentlyGrounded = this.checkGrounded();

    // Landing Impact: Trigger squash-and-stretch bounce
    if (!wasGrounded && this.isCurrentlyGrounded && this.prevVy > 2.0) {
      const impactFactor = Math.min(this.prevVy * 0.024, 0.28);
      this.scaleX = 1.0 + impactFactor;
      this.scaleY = 1.0 - impactFactor;
      SoundManager.playLandSound();
    }

    const rawInput: RawInputState =
      input instanceof InputController
        ? input.consumeStepState()
        : {
            leftPressed: (input as any).leftPressed ?? (input as any).left ?? false,
            rightPressed: (input as any).rightPressed ?? (input as any).right ?? false,
            jumpPressed: (input as any).jumpPressed ?? (input as any).jump ?? false,
          };

    // 9. Compute Horizontal Movement via PlayerController with form-specific physics
    let newVx = this.playerController.computeHorizontalVelocity(
      this.ball.velocity.x,
      this.isCurrentlyGrounded,
      rawInput,
      currentConfig,
      this.isMobile
    );

    // 10. Compute Vertical Jump via PlayerController with form-specific jumpVelocity
    const jumpResult = this.playerController.computeVerticalVelocity(
      this.ball.velocity.y,
      this.isCurrentlyGrounded,
      rawInput,
      currentConfig
    );

    let newVy = jumpResult.vy;
    if (jumpResult.didJump) {
      this.isCurrentlyGrounded = false;
      this.lastGroundedPlatformId = null;
      if (jumpResult.scaleX && jumpResult.scaleY) {
        this.scaleX = jumpResult.scaleX;
        this.scaleY = jumpResult.scaleY;
      }
      SoundManager.playJumpSound();
    }

    if (this.isCurrentlyGrounded && Math.abs(newVx) > 2.2) {
      SoundManager.playRollSound();
    }

    // Apply gravity scale difference if form has custom gravity behavior
    if (currentConfig.gravityScale !== 1.0) {
      newVy += (currentConfig.gravityScale - 1.0) * GRAVITY_Y * 0.001 * (clampedDelta * clampedDelta);
    }

    // 10.2. Apply Mountain Wind Zone Forces with form-specific windResistance
    for (const wz of this.windZones) {
      if (wz.isAlternating || wz.windCycleTime) {
        const period = wz.windCycleTime ?? 7.0;
        const maxForce = wz.windForceXMax ?? 4.8;
        wz.windForceX = Math.sin((this.simTime * 2 * Math.PI) / period) * maxForce;
      }
      const left = wz.x - wz.width / 2;
      const right = wz.x + wz.width / 2;
      const top = wz.y - wz.height / 2;
      const bottom = wz.y + wz.height / 2;
      if (bx >= left && bx <= right && by >= top && by <= bottom) {
        const windX = wz.windForceX ?? 4.8;
        const windY = wz.windForceY ?? 0;
        const windPushX = windX * currentConfig.windResistance * (clampedDelta / 16.667);
        const windPushY = windY * currentConfig.windResistance * (clampedDelta / 16.667);

        newVx += windPushX;
        newVy += windPushY;

        // Terminal drift clamp: wind alone cannot blow the ball horizontally faster than terminal wind speed
        const termSpeedX = Math.abs(windX * currentConfig.windResistance);
        if (windX < 0 && newVx < -termSpeedX) {
          newVx = -termSpeedX;
        } else if (windX > 0 && newVx > termSpeedX) {
          newVx = termSpeedX;
        }

        // For vertical wind, do not clamp or crush player's intentional jump impulse
        if (!jumpResult.didJump) {
          const termSpeedY = Math.abs(windY * currentConfig.windResistance);
          if (windY < 0 && newVy < -termSpeedY && this.ball.velocity.y >= -termSpeedY) {
            newVy = -termSpeedY;
          } else if (windY > 0 && newVy > termSpeedY && this.ball.velocity.y <= termSpeedY) {
            newVy = termSpeedY;
          }
        }
      }
    }

    // 10.3. Ice Platform Traction & Controlled Speed on Ice
    if (this.isCurrentlyGrounded && this.lastGroundedPlatformId) {
      const gPlat = this.platforms.find((p) => p.id === this.lastGroundedPlatformId);
      if (gPlat?.type === 'ice') {
        const iceMult = currentConfig.iceSpeedMultiplier ?? 1.0;
        const maxIceSpeed = currentConfig.maxSpeed * Math.max(1.0, iceMult);
        newVx *= iceMult;
        if (Math.abs(newVx) > maxIceSpeed) {
          newVx = Math.sign(newVx) * maxIceSpeed;
        }
      }
    }

    // 10.5. Apply Water Buoyancy, Hydrodynamic Drag & Swimming
    if (this.isInWater && activeWater) {
      // Downward gravity acceleration added by Matter.js per frame (in px/frame)
      const gravityPerFrame = GRAVITY_Y * 0.001 * (clampedDelta * clampedDelta);

      // Archimedes' Principle with form-specific density:
      const ballArea = Math.PI * r * r;
      const displacedWaterMass = this.submergedRatio * ballArea * WATER_DENSITY;
      const ballMass = Math.max(0.001, this.ball.mass);
      const buoyantForce = displacedWaterMass * gravityPerFrame;
      const buoyantAcc = buoyantForce / ballMass;

      // Upward waterfall fluid current lift
      const waterfallLift = isWaterfall ? 1.6 * (clampedDelta / 16.667) : 0;
      const netBuoyantAcc = buoyantAcc + waterfallLift;

      // Apply buoyancy continuously countering gravity
      newVy -= netBuoyantAcc;

      // Apply continuous hydrodynamic drag proportional to submerged ratio
      const timeScale = clampedDelta / 16.667;
      const dragFactorX = 1.0 - (1.0 - WATER_DRAG_X) * this.submergedRatio;
      const dragFactorY = 1.0 - (1.0 - WATER_DRAG_Y) * this.submergedRatio;
      newVx *= Math.pow(dragFactorX, timeScale);
      newVy *= Math.pow(dragFactorY, timeScale);

      // Swimming strokes & surface breach jump
      if (rawInput.jumpPressed) {
        const waterTop = activeWater.y - activeWater.height / 2;
        const isNearSurface = by <= waterTop + r * 0.85;

        if (isNearSurface) {
          // Surface breach leap into the air
          if (currentConfig.canBreachWater) {
            newVy = WATER_BREACH_IMPULSE;
            this.scaleX = 0.88;
            this.scaleY = 1.15;
            this.isCurrentlyGrounded = false;
          }
        } else if (currentConfig.canSwimUnderwater && this.simTime - this.lastSwimTime > 0.22) {
          // Submerged swim stroke for agile underwater navigation
          this.lastSwimTime = this.simTime;
          newVy = WATER_SWIM_IMPULSE;
          this.scaleX = 0.92;
          this.scaleY = 1.08;
          this.isCurrentlyGrounded = false;
        }
      }
    }

    // Save current vy for landing impact detection
    this.prevVy = this.ball.velocity.y;

    // Apply updated velocities
    Matter.Body.setVelocity(this.ball, { x: newVx, y: newVy });

    // Step physics engine
    Matter.Engine.update(this.engine, clampedDelta);

    // 11. Update Rolling Rotation
    const deltaSeconds = clampedDelta / 1000;
    const deltaRotation = (this.ball.velocity.x * 60 * deltaSeconds) / this.currentRadius;
    this.visualAngle += deltaRotation;

    // 12. Smoothly recover squash/stretch back to 1.0
    this.scaleX += (1.0 - this.scaleX) * 0.18;
    this.scaleY += (1.0 - this.scaleY) * 0.18;
  }

  public getBallState(): BallState {
    return {
      x: this.ball.position.x,
      y: this.ball.position.y,
      radius: this.currentRadius,
      angle: this.visualAngle,
      vx: Math.abs(this.ball.velocity.x) < 0.1 ? 0 : this.ball.velocity.x,
      vy: this.ball.velocity.y,
      scaleX: this.scaleX,
      scaleY: this.scaleY,
      isGrounded: this.isCurrentlyGrounded,
      size: this.currentSize,
      density: this.currentDensity,
      form: this.currentForm,
      isInWater: this.isInWater,
      submergedRatio: this.submergedRatio,
      transformationEffect: this.transformationEffect,
    };
  }

  public getCurrentForm(): BallForm {
    return this.currentForm;
  }

  public getCurrentSize(): BallSize {
    return this.currentSize;
  }

  public getCurrentDensity(): BallDensity {
    return this.currentDensity;
  }

  public getIsInWater(): boolean {
    return this.isInWater;
  }

  public getCurrentRadius(): number {
    return this.currentRadius;
  }

  public getPlatforms(): PlatformData[] {
    return this.platforms;
  }

  public getIsLevelComplete(): boolean {
    return this.isLevelComplete;
  }

  public getActiveCheckpoint(): Position {
    return { ...this.activeCheckpoint };
  }

  public getRisingLavaY(): number | undefined {
    return this.risingLavaY;
  }

  public getRisingZoneConfig(): RisingZoneConfig | undefined {
    return this.risingZoneConfig;
  }

  public getLives(): number {
    return this.lifeManager.getLives();
  }

  public getIsInvulnerable(): boolean {
    return this.lifeManager.isInvulnerable(this.simTime);
  }

  public getActiveCoins(): CoinData[] {
    return this.coinManager.getActiveCoins();
  }

  public getActiveKeys(): KeyData[] {
    return this.keyManager.getActiveKeys();
  }

  public getAllLevelKeys(): KeyData[] {
    return this.keyManager.getAllLevelKeys();
  }

  public getKeyManager(): KeyManager {
    return this.keyManager;
  }

  public getGameOverNotification(): string | null {
    return this.gameOverNotification;
  }

  public getLifeManager(): LifeManager {
    return this.lifeManager;
  }

  public getCoinManager(): CoinManager {
    return this.coinManager;
  }

  public getBallBody(): Matter.Body {
    return this.ball;
  }

  public setBallPosition(x: number, y: number): void {
    Matter.Body.setPosition(this.ball, { x, y });
    Matter.Body.setVelocity(this.ball, { x: 0, y: 0 });
  }

  public getElapsedGameplayTime(): number {
    return this.elapsedGameplayTime;
  }

  public getDeathCount(): number {
    return this.deathCount;
  }

  public getCoinsCollectedThisRun(): number {
    return this.coinsCollectedThisRun;
  }

  /**
   * Internal player death handler. Decrements life count.
   * If all 3 lives lost, triggers Level Restart from beginning.
   */
  public triggerDeath(): void {
    // If level is already completed, do not decrement lives or trigger death
    if (this.isLevelComplete) return;

    this.deathCount += 1;
    SoundManager.playDeathSound();
    const deathResult = this.lifeManager.handleDeath(this.simTime);

    if (deathResult.isGameOver) {
      // 3 Failures: Level Restart from beginning
      this.activeCheckpoint = { x: this.initialX, y: this.initialY };
      for (const cp of this.checkpoints) {
        cp.isActivated = false;
      }
      this.gameOverNotification = '💔 LEVEL RESTARTED — 3 LIVES RESTORED';
      this.gameOverNotificationTimer = this.simTime + 2.0;
      this.resetBall(true);
    } else {
      // Normal Death: Respawn at latest activated checkpoint
      this.resetBall(false);
    }
  }

  public resetBall(isFullRestart: boolean = false): void {
    this.activeChallengeTimer = null;
    if (isFullRestart) {
      this.completedTimerIds.clear();
      this.elapsedGameplayTime = 0;
      this.deathCount = 0;
      this.coinsCollectedThisRun = 0;
      this.isLevelComplete = false;
      this.activeCheckpoint = { x: this.initialX, y: this.initialY };
      this.activeCheckpointForm = 'original';
      for (const cp of this.checkpoints) {
        cp.isActivated = false;
      }
      for (const gate of this.stoneGates) {
        gate.plat.isOpen = false;
        gate.body.isSensor = false;
        Matter.Body.setPosition(gate.body, { x: gate.plat.x, y: gate.closedY });
      }
      for (const plate of this.pressurePlates) {
        if (!plate.isLatched) {
          plate.isPressed = false;
          plate.isActivated = false;
        }
      }
      for (const ws of this.wallSwitches) {
        if (!ws.isLatched) {
          ws.isPressed = false;
          ws.isActivated = false;
        }
      }
      for (const fp of this.fallingPlatforms) {
        fp.plat.isFalling = false;
        fp.plat.isShaking = false;
        fp.shakeTimer = undefined;
        fp.respawnTimer = undefined;
        fp.plat.y = fp.baseY;
        fp.plat.x = fp.baseX;
        Matter.Body.setPosition(fp.body, { x: fp.baseX, y: fp.baseY });
      }
      for (const cw of this.crackedWalls) {
        cw.plat.isBroken = false;
        cw.body.isSensor = false;
        Matter.Body.setPosition(cw.body, { x: cw.baseX ?? cw.plat.x, y: cw.baseY ?? cw.plat.y });
      }
      for (const fi of this.fallingIcicles) {
        fi.isDropping = false;
        fi.plat.y = fi.startY;
      }
      for (const sp of this.fragileSnowPlatforms) {
        sp.plat.isCollapsed = false;
        sp.collapseTimer = undefined;
        sp.respawnTimer = undefined;
        Matter.Body.setPosition(sp.body, { x: sp.baseX, y: sp.baseY });
      }
      for (const cp of this.crumblingPlatforms) {
        cp.plat.isCollapsed = false;
        cp.crumbleTime = undefined;
        cp.respawnTime = undefined;
        Matter.Body.setPosition(cp.body, { x: cp.baseX, y: cp.baseY });
      }
    }

    Matter.Body.setPosition(this.ball, { x: this.activeCheckpoint.x, y: this.activeCheckpoint.y });
    Matter.Body.setVelocity(this.ball, { x: 0, y: 0 });
    this.visualAngle = 0;
    this.scaleX = 1.0;
    this.scaleY = 1.0;
    this.prevVy = 0;
    this.isCurrentlyGrounded = false;
    this.lastGroundedPlatformId = null;
    this.transformationEffect = null;
    this.playerController.reset();

    // Reset ball to the active checkpoint form (or original on full restart)
    const targetForm = isFullRestart ? 'original' : this.activeCheckpointForm;
    const config = BALL_FORM_CONFIGS[targetForm] ?? BALL_FORM_CONFIGS.original;

    if (this.currentRadius !== config.radius) {
      const resetScale = config.radius / this.currentRadius;
      Matter.Body.scale(this.ball, resetScale, resetScale);
      this.currentRadius = config.radius;
    }
    this.currentForm = targetForm;
    this.currentSize = targetForm === 'big' ? 'large' : targetForm === 'snow' ? 'small' : 'normal';
    this.currentDensity =
      targetForm === 'stone'
        ? 'heavy'
        : targetForm === 'big' || targetForm === 'snow'
        ? 'light'
        : 'normal';

    Matter.Body.setDensity(this.ball, config.density);
    this.ball.friction = 0.001;
    this.ball.frictionAir = 0.001;
    this.ball.restitution = config.restitution;

    // Reset Rising Hazard Zone state on death
    if (!isFullRestart && this.risingZoneConfig) {
      const rz = this.risingZoneConfig;
      const triggerX = rz.triggerX ?? rz.startX;
      // If checkpoint is within or immediately preceding the rising zone
      if (this.activeCheckpoint.x >= triggerX - 100 && this.activeCheckpoint.x <= rz.endX) {
        this.isRisingLavaActive = true;
        this.risingLavaY = rz.initialY;
      } else {
        this.isRisingLavaActive = false;
        this.risingLavaY = undefined;
      }
    } else {
      this.isRisingLavaActive = false;
      this.risingLavaY = undefined;
    }
  }

  public setIsMobile(isMobile: boolean): void {
    this.isMobile = isMobile;
  }

  public getIsMobile(): boolean {
    return this.isMobile;
  }

  public resetToCheckpoint(): void {
    this.resetBall(false);
  }

  public getChallengeTimer() {
    return this.activeChallengeTimer ? { ...this.activeChallengeTimer } : null;
  }
}
