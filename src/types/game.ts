export interface Position {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export type BallSize = 'small' | 'normal' | 'large';
export type BallDensity = 'light' | 'normal' | 'heavy';
export type BallForm = 'original' | 'big' | 'stone' | 'snow';

export interface TransformationEffect {
  form: BallForm;
  startTime: number;
  duration: number;
}

export interface BallState {
  x: number;
  y: number;
  radius: number;
  angle: number;
  vx: number;
  vy: number;
  scaleX: number;
  scaleY: number;
  isGrounded: boolean;
  size?: BallSize;
  density?: BallDensity;
  form?: BallForm;
  isInWater?: boolean;
  submergedRatio?: number;
  transformationEffect?: TransformationEffect | null;
}

export type PlatformType =
  | 'ground'
  | 'floating'
  | 'wall'
  | 'spike'
  | 'moving'
  | 'crumbling'
  | 'checkpoint'
  | 'exit'
  | 'lava'
  | 'geyser'
  | 'falling_rock'
  | 'water'
  | 'waterfall'
  | 'transformer_shrink'
  | 'transformer_grow'
  | 'transformer_normal'
  | 'ice'
  | 'snow_platform'
  | 'cracked_wall'
  | 'heavy_pressure_plate'
  | 'stone_gate'
  | 'wind_zone'
  | 'falling_icicle'
  | 'transformer_stone'
  | 'transformer_snow'
  | 'transformer_original'
  | 'transformer_big'
  // Phase 1 Advanced Mechanics
  | 'locked_door'
  | 'pressure_plate'
  | 'wall_switch'
  | 'bounce_pad'
  | 'teleporter'
  | 'rotating_spikes'
  | 'moving_saw'
  | 'timed_door'
  | 'disappearing_platform'
  | 'falling_platform'
  | 'secret_passage';

export interface PlatformData {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  type: PlatformType;
  // Moving platform & moving spike oscillation parameters
  moveRangeX?: number; // Total horizontal oscillation distance (+/- range)
  moveRangeY?: number; // Total vertical oscillation distance (+/- range)
  moveSpeed?: number;  // Oscillation angular speed (radians/sec)
  // Dynamic state flags
  isActivated?: boolean; // Checkpoint / switch activated state
  isCollapsed?: boolean; // Crumbling platform collapsed state
  spikeDirection?: 'up' | 'down' | 'left' | 'right'; // Direction spike points
  // Geyser properties
  geyserHeight?: number;      // Maximum height of erupting lava column
  geyserCycleTime?: number;   // Total cycle period (seconds, e.g. 4.0s)
  geyserEruptStart?: number;  // Time into cycle when eruption begins (e.g. 2.4s)
  geyserEruptDuration?: number;// Duration of deadly eruption (e.g. 1.2s)
  isErupting?: boolean;       // Real-time eruption state
  // Falling rock properties
  fallSpeed?: number;         // Speed of falling boulder (px/sec)
  fallInterval?: number;      // Periodic respawn interval
  fallStartY?: number;        // Top spawn Y
  fallEndY?: number;          // Ground/lava impact Y
  // Frozen Mountain Kingdom (Level 3) interactive properties
  isBroken?: boolean;         // Cracked stone wall destroyed state
  isPressed?: boolean;        // Heavy pressure plate depressed state
  isOpen?: boolean;           // Stone gate open state
  linkedDoorId?: string;      // ID of stone gate opened by this switch
  windForceX?: number;        // Horizontal wind force (+ rightward, - leftward)
  windForceY?: number;        // Vertical wind force (- upward draft)
  isDropping?: boolean;       // Falling icicle triggered state
  icicleStartY?: number;      // Initial hanging Y
  icicleEndY?: number;        // Ground impact Y

  // Phase 1: Keys & Locked Doors
  requiredKeyId?: string;     // Key id matching this locked door
  doorState?: 'locked' | 'opening' | 'open';
  doorOrientation?: 'vertical' | 'horizontal';
  keyColor?: string;          // Color matching the door's required key

  // Phase 1: Pressure Plates & Switches
  switchType?: 'heavy' | 'normal' | 'toggle';
  targetIds?: string[];       // Target mechanism/door/platform IDs
  requiredSwitches?: string[];// All switches required to activate this door/mechanism
  isLatched?: boolean;        // Whether switch locks permanently when activated

  // Phase 1: Spring & Bounce Pads
  launchForceX?: number;      // Horizontal launch impulse
  launchForceY?: number;      // Vertical launch impulse (e.g. -22)
  launchDirection?: 'up' | 'down' | 'left' | 'right';
  springCompression?: number; // 0.0 to 1.0 compression visual state

  // Phase 1: Paired Teleporters
  targetTeleporterId?: string;// Paired destination teleporter ID
  teleportCooldown?: number;  // Cooldown in seconds before reuse
  portalColor?: string;       // Color theme for portal aura

  // Phase 1: Rotating Spikes & Moving Saws
  pivotX?: number;            // Anchor pivot X
  pivotY?: number;            // Anchor pivot Y
  armLength?: number;         // Radius/length of rotating arm
  angularSpeed?: number;      // Radians per second
  currentAngle?: number;      // Real-time rotation angle
  spikeCount?: number;        // Number of spiked maces along arm
  sawRadius?: number;         // Circular blade radius
  pathStartX?: number;        // Track start X
  pathStartY?: number;        // Track start Y
  pathEndX?: number;          // Track end X
  pathEndY?: number;          // Track end Y

  // Phase 1: Timed Doors & Phasing Platforms
  cyclePeriod?: number;       // Total cycle period in seconds
  openDuration?: number;      // Time remaining open / visible
  closeDuration?: number;     // Time remaining closed / hidden
  cycleOffset?: number;       // Initial phase time offset

  // Phase 1: Falling Platforms
  shakeTime?: number;         // Shake elapsed time
  fallTimer?: number;         // Time before falling or respawning
  isShaking?: boolean;        // Warning vibration state
  isFalling?: boolean;        // Actively dropping downward

  // Phase 1: Secret Passages
  isRevealed?: boolean;       // Whether secret area has been discovered
  secretClueType?: 'cracks' | 'moss' | 'brick_shift';

  // Ancient Temple (Level 4) Interactive Mechanisms
  isAlternating?: boolean;    // Reversing wind zone / oscillator
  windCycleTime?: number;     // Period of wind direction change (seconds)
  windForceXMin?: number;     // Minimum horizontal wind force
  windForceXMax?: number;     // Maximum horizontal wind force
  isWarning?: boolean;        // Pre-eruption visual warning for flames
  isLaunchMachine?: boolean;  // High-tension ancient launch machine catapult
  isRotatingPlatform?: boolean;// Solid platform revolving around an anchor pivot
  orbitRadius?: number;       // Radius of platform revolution around anchor pivot
}

export interface ChallengeTimerConfig {
  id: string;
  label: string;
  startX: number;
  endX: number;
  durationSeconds: number;
}

export interface InputState {
  left: boolean;
  right: boolean;
  jump: boolean;
}

export interface CoinData {
  id: string;
  x: number;
  y: number;
  value?: number;
}

export interface KeyData {
  id: string;                 // e.g. 'l1_key_bronze'
  keyId: string;              // Type/Group identifier matching requiredKeyId, e.g. 'bronze_key'
  x: number;
  y: number;
  name: string;               // e.g. 'Bronze Key'
  color: string;              // e.g. '#cd7f32'
}

export type LevelTheme =
  | 'meadow'
  | 'crystal_cave'
  | 'lava_kingdom'
  | 'frozen_mountain'
  | 'ancient_temple'
  | 'sky_kingdom';

export type StarRating = 1 | 2 | 3;

export interface StarThresholds {
  threeStarTimeSeconds: number;
  threeStarMaxDeaths: number;
  twoStarTimeSeconds: number;
  twoStarMaxDeaths: number;
}

export interface LevelProgressRecord {
  levelId: number;
  unlocked: boolean;
  completed: boolean;
  bestTimeSeconds?: number;
  bestStars?: number;
  completionsCount: number;
}

export interface GameSettings {
  soundVolume: number;         // 0.0 - 1.0
  musicVolume: number;         // 0.0 - 1.0
  soundMuted: boolean;
  musicMuted: boolean;
  vibrationEnabled: boolean;
  controlLayout: 'split' | 'left-cluster' | 'right-cluster';
  controlButtonSize: 'compact' | 'normal' | 'large';
  graphicsQuality: 'high' | 'medium';
}

export interface RisingZoneConfig {
  startX: number;        // e.g. 5400
  endX: number;          // e.g. 6600
  initialY: number;      // e.g. 1850 (bottom of the waterfall chasm)
  targetY: number;       // e.g. 680 (summit of the waterfall climb)
  speed: number;         // e.g. 16 px/sec
  triggerX?: number;     // e.g. 5400 (where hazard activates and becomes visible)
  riseStartX?: number;   // e.g. 5500 (where upward rise begins after safe shelf)
}

export interface LevelRunSummary {
  levelId: number;
  levelName: string;
  timeSeconds: number;
  deaths: number;
  stars: number;
  coinsEarned: number;
  isNewBestTime: boolean;
  isNewBestStars: boolean;
}

export interface GameSnapshot {
  ball: BallState;
  camera: Position;
  platforms: PlatformData[];
  coins: CoinData[];
  keys?: KeyData[];
  collectedKeyIds?: string[];
  worldWidth: number;
  worldHeight: number;
  theme?: LevelTheme;
  isLevelComplete?: boolean;
  risingLavaY?: number;
  risingZoneStartX?: number;
  risingZoneEndX?: number;
  lives: number;
  isInvulnerable?: boolean;
  gameOverNotification?: string | null;
  ballForm?: BallForm;
  elapsedTime?: number;
  deaths?: number;
  challengeTimer?: {
    id: string;
    label: string;
    remainingSeconds: number;
    maxSeconds: number;
  } | null;
}
