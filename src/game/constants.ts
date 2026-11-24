import { PlatformData } from '../types/game';

export const WORLD_WIDTH = 2600;
export const WORLD_HEIGHT = 650;
export const GROUND_Y = 560;
export const GROUND_HEIGHT = 80;

export const BALL_RADIUS = 24;
export const BALL_INITIAL_X = 140;
export const BALL_INITIAL_Y = 480;

// Movement & Physics Tuning
export const MOVE_SPEED = 5.0; // Calibrated comfortable rolling speed (was 8.5)
export const MOVE_ACCELERATION = 0.36; // Smooth progressive rolling acceleration (was 0.92)
export const AIR_MOVE_ACCELERATION = 0.15; // Natural mid-air steering authority (was 0.80)
export const GROUND_DAMPING = 0.86; // Crisp braking on platform surfaces
export const AIR_DAMPING = 0.985; // Preserves forward momentum during jumps
export const JUMP_VELOCITY = -14.68; // Calibrated 1.1x standard jump height (was -14.0)
export const GRAVITY_Y = 2.20;
export const BALL_RESTITUTION = 0.35;
export const BALL_FRICTION = 0.08;
export const BALL_AIR_FRICTION = 0.005;
export const BALL_DENSITY = 0.004;

// Hydrodynamic Water Physics Constants
export const WATER_DENSITY = 0.0037; // Fluid density in Matter.js units (rho_water)
export const WATER_DRAG_X = 0.94; // Horizontal water damping
export const WATER_DRAG_Y = 0.88; // Vertical hydrodynamic damping (critically damps bobbing)
export const WATER_SWIM_IMPULSE = -8.5; // Submerged swimming stroke
export const WATER_BREACH_IMPULSE = -15.5; // Surface breach leap

// Ball Density Multipliers (relative to BALL_DENSITY = 0.004)
export const DENSITY_MULT_SMALL = 1.35; // rho_rel = 1.35 (sinks steadily)
export const DENSITY_MULT_NORMAL = 1.08; // rho_rel = 1.08 (sinks slowly, does not auto-float)
export const DENSITY_MULT_LARGE = 0.42; // rho_rel = 0.42 (floats naturally, ~42% submerged)
export const DENSITY_MULT_STONE = 2.60; // rho_rel = 2.60 (sinks quickly, heavy downward movement)
export const DENSITY_MULT_SNOW = 0.35; // rho_rel = 0.35 (floats naturally, ~35% submerged)

// Classic Nokia Bounce Colors
export const COLOR_SKY_TOP = '#58a0de';
export const COLOR_SKY_BOTTOM = '#96cef6';

export const COLOR_BALL = '#e52521';
export const COLOR_BALL_SHADOW = '#85120f';
export const COLOR_BALL_HIGHLIGHT = '#ff7b79';
export const COLOR_BALL_SPECULAR = '#ffffff';

export const COLOR_GROUND_MAIN = '#ad3a1b';
export const COLOR_GROUND_TOP = '#db5832';
export const COLOR_GROUND_BORDER = '#691d09';

export const COLOR_PLATFORM_MAIN = '#be411e';
export const COLOR_PLATFORM_TOP = '#e0633b';
export const COLOR_PLATFORM_BORDER = '#691d09';

// Hazard & Interactive Colors
export const COLOR_SPIKE = '#d32f2f';
export const COLOR_SPIKE_BORDER = '#5f0907';
export const COLOR_MOVING_ACCENT = '#00e5ff';
export const COLOR_EXIT_RING = '#ffd700';
export const COLOR_EXIT_GLOW = '#fff59d';

// Crystal Caverns Theme (Level 2)
export const COLOR_CAVERN_TOP = '#0a0e1a';
export const COLOR_CAVERN_BOTTOM = '#161e2e';
export const COLOR_OBSIDIAN_MAIN = '#1c222d';
export const COLOR_OBSIDIAN_TOP = '#00e5ff';
export const COLOR_OBSIDIAN_BORDER = '#0a0f16';
export const COLOR_CHECKPOINT_INACTIVE = '#7b1fa2';
export const COLOR_CHECKPOINT_ACTIVE = '#ffd700';
export const COLOR_CRUMBLING_MAIN = '#2b2326';
export const COLOR_CRUMBLING_TOP = '#ff7043';

// The Lava Kingdom Theme (Level 3 Legacy / Volcanic)
export const COLOR_LAVA_SKY_TOP = '#120705';
export const COLOR_LAVA_SKY_BOTTOM = '#3d1207';
export const COLOR_BASALT_MAIN = '#1e1614';
export const COLOR_BASALT_TOP = '#ff5722';
export const COLOR_BASALT_BORDER = '#0d0807';
export const COLOR_LAVA_CORE = '#fff176';
export const COLOR_LAVA_MID = '#ff9100';
export const COLOR_LAVA_DEEP = '#d50000';
export const COLOR_GEYSER_STEAM = 'rgba(255, 112, 67, 0.4)';
export const COLOR_FALLING_ROCK = '#2c1e1c';
export const COLOR_CHECKPOINT_LAVA_INACTIVE = '#b71c1c';
export const COLOR_CHECKPOINT_LAVA_ACTIVE = '#ffea00';

// Frozen Mountain Kingdom Theme (Level 3)
export const COLOR_FROZEN_SKY_TOP = '#0d1829';
export const COLOR_FROZEN_SKY_BOTTOM = '#253d5a';
export const COLOR_FROZEN_PEAK_FAR = '#4a6582';
export const COLOR_FROZEN_PEAK_NEAR = '#6f8fae';
export const COLOR_FROZEN_SNOW_CAP = '#eaf3fb';
export const COLOR_FROZEN_PINE = '#132832';
export const COLOR_FROZEN_GROUND_MAIN = '#1a2938';
export const COLOR_FROZEN_GROUND_TOP = '#e1f0fa';
export const COLOR_FROZEN_GROUND_BORDER = '#0e1823';
export const COLOR_ICE_MAIN = '#38bdf8';
export const COLOR_ICE_TOP = '#bae6fd';
export const COLOR_ICE_BORDER = '#0284c7';
export const COLOR_SNOW_MAIN = '#e2e8f0';
export const COLOR_SNOW_TOP = '#ffffff';
export const COLOR_SNOW_BORDER = '#94a3b8';
export const COLOR_STONE_BALL = '#52525b';
export const COLOR_STONE_SHADOW = '#27272a';
export const COLOR_STONE_CRACK = '#18181b';
export const COLOR_STONE_HIGHLIGHT = '#a1a1aa';
export const COLOR_SNOW_BALL = '#f8fafc';
export const COLOR_SNOW_SHADOW = '#cbd5e1';
export const COLOR_SNOW_CORE = '#7dd3fc';
export const COLOR_PRESSURE_PLATE_BASE = '#334155';
export const COLOR_PRESSURE_PLATE_ACTIVE = '#38bdf8';
export const COLOR_STONE_GATE = '#475569';
export const COLOR_ICICLE_MAIN = '#a5f3fc';
export const COLOR_ICICLE_CORE = '#cffafe';

// Ancient Temple Theme (Level 4)
export const COLOR_ANCIENT_SKY_TOP = '#1c1017';
export const COLOR_ANCIENT_SKY_BOTTOM = '#3d202e';
export const COLOR_ANCIENT_PYRAMID_FAR = '#522b3b';
export const COLOR_ANCIENT_PYRAMID_NEAR = '#6b394d';
export const COLOR_ANCIENT_GROUND_MAIN = '#442330';
export const COLOR_ANCIENT_GROUND_TOP = '#d97706';
export const COLOR_ANCIENT_GROUND_BORDER = '#26131b';
export const COLOR_ANCIENT_PLAT_MAIN = '#5c3142';
export const COLOR_ANCIENT_PLAT_TOP = '#f59e0b';
export const COLOR_ANCIENT_PLAT_BORDER = '#2d1720';

// Sky Kingdom Theme (Level 5)
export const COLOR_SKY_REALM_TOP = '#0284c7';
export const COLOR_SKY_REALM_BOTTOM = '#bae6fd';
export const COLOR_SKY_ISLAND_FAR = '#7dd3fc';
export const COLOR_SKY_ISLAND_NEAR = '#38bdf8';
export const COLOR_SKY_ISLAND_MAIN = '#0284c7';
export const COLOR_SKY_ISLAND_TOP = '#f0f9ff';
export const COLOR_SKY_ISLAND_BORDER = '#0369a1';
export const COLOR_SKY_PLAT_MAIN = '#0ea5e9';
export const COLOR_SKY_PLAT_TOP = '#e0f2fe';
export const COLOR_SKY_PLAT_BORDER = '#0284c7';

// Side-view Level with Continuous Ground, Gaps, and Stepped Platforms
export const LEVEL_PLATFORMS: PlatformData[] = [
  // Left and Right Boundary Walls
  {
    id: 'wall_left',
    x: -20,
    y: WORLD_HEIGHT / 2,
    width: 40,
    height: WORLD_HEIGHT * 2,
    type: 'wall',
  },
  {
    id: 'wall_right',
    x: WORLD_WIDTH + 20,
    y: WORLD_HEIGHT / 2,
    width: 40,
    height: WORLD_HEIGHT * 2,
    type: 'wall',
  },

  // Ground Section 1 (0 to 820px)
  {
    id: 'ground_sec_1',
    x: 410,
    y: GROUND_Y + GROUND_HEIGHT / 2,
    width: 820,
    height: GROUND_HEIGHT,
    type: 'ground',
  },

  // Starter floating platform above section 1
  {
    id: 'plat_starter',
    x: 520,
    y: 430,
    width: 180,
    height: 28,
    type: 'floating',
  },

  // Low Bridge over Gap 1 (820px to 980px)
  {
    id: 'plat_gap_1',
    x: 900,
    y: 470,
    width: 170,
    height: 28,
    type: 'floating',
  },

  // Ground Section 2 (980px to 1780px)
  {
    id: 'ground_sec_2',
    x: 1380,
    y: GROUND_Y + GROUND_HEIGHT / 2,
    width: 800,
    height: GROUND_HEIGHT,
    type: 'ground',
  },

  // Ascending Steps above Section 2
  {
    id: 'plat_step_1',
    x: 1140,
    y: 380,
    width: 160,
    height: 28,
    type: 'floating',
  },
  {
    id: 'plat_step_2',
    x: 1390,
    y: 290,
    width: 180,
    height: 28,
    type: 'floating',
  },
  {
    id: 'plat_high_bridge',
    x: 1650,
    y: 210,
    width: 210,
    height: 28,
    type: 'floating',
  },

  // Stepping Platform across Gap 2 (1780px to 1960px)
  {
    id: 'plat_gap_2',
    x: 1870,
    y: 450,
    width: 150,
    height: 28,
    type: 'floating',
  },

  // Ground Section 3 (1960px to 2600px)
  {
    id: 'ground_sec_3',
    x: 2280,
    y: GROUND_Y + GROUND_HEIGHT / 2,
    width: 640,
    height: GROUND_HEIGHT,
    type: 'ground',
  },

  // Mid platform in section 3
  {
    id: 'plat_sec3_mid',
    x: 2160,
    y: 350,
    width: 180,
    height: 28,
    type: 'floating',
  },

  // Goal High Platform
  {
    id: 'plat_goal',
    x: 2450,
    y: 230,
    width: 220,
    height: 28,
    type: 'floating',
  },
];
