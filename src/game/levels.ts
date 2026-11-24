import { PlatformData, LevelTheme, CoinData, KeyData, RisingZoneConfig, StarThresholds, ChallengeTimerConfig } from '../types/game';
import { LEVEL_4_CONFIG } from './levels/level4';
import { LEVEL_5_CONFIG } from './levels/level5';

export interface LevelConfig {
  id: number;
  name: string;
  subtitle: string;
  difficulty: 'EASY' | 'MEDIUM' | 'CHALLENGE' | 'EXPERT';
  badgeColor: string;
  themeColor: string;
  description: string;
  platforms: PlatformData[];
  coins?: CoinData[];
  keys?: KeyData[];
  worldWidth: number;
  worldHeight: number;
  initialBallX: number;
  initialBallY: number;
  theme?: LevelTheme;
  starThresholds?: StarThresholds;
  risingZone?: RisingZoneConfig;
  challengeTimers?: ChallengeTimerConfig[];
}

// =============================================================================
// LEVEL 1: Sunny Meadow & Skyways (Expansive 5200x1500 Multi-Tier 2D Adventure)
// =============================================================================
const LEVEL_1_PLATFORMS: PlatformData[] = [
  // --- Boundary Walls (Enclosing 5200 x 1500 World) ---
  { id: 'l1_wall_left', x: -20, y: 750, width: 40, height: 2000, type: 'wall' },
  { id: 'l1_wall_right', x: 5220, y: 750, width: 40, height: 2000, type: 'wall' },
  { id: 'l1_ceiling', x: 2600, y: -30, width: 5600, height: 60, type: 'wall' },

  // SECTION 1: Starting Area (x: 0 - 850, y: 1380)
  { id: 'sec1_ground', x: 425, y: 1380, width: 850, height: 80, type: 'ground' },
  { id: 'sec1_step_1', x: 480, y: 1260, width: 180, height: 28, type: 'floating' },
  { id: 'sec1_step_2', x: 720, y: 1180, width: 180, height: 28, type: 'floating' },
  // Phase 1: Secret Meadow Grotto false wall hiding bonus coin cache
  { id: 'l1_sec1_secret_wall', x: 620, y: 1340, width: 40, height: 80, type: 'secret_passage' },

  // SECTION 2: Vertical Climbing Towers (x: 850 - 1800, y: 1250 down to 780)
  { id: 'sec2_pit_floor', x: 1325, y: 1440, width: 950, height: 60, type: 'ground' },
  // Phase 1: High-powered Pit Bounce Pad launching back up to climbing towers
  { id: 'l1_sec2_bounce_pad', x: 1325, y: 1400, width: 80, height: 20, type: 'bounce_pad', launchForceY: -22.5 },
  { id: 'sec2_recovery_step', x: 920, y: 1340, width: 140, height: 26, type: 'floating' },
  { id: 'sec2_step_1', x: 960, y: 1100, width: 180, height: 28, type: 'floating' },
  { id: 'sec2_step_3', x: 920, y: 910, width: 160, height: 28, type: 'floating' },
  // Phase 1: Upper Spring Pad launching directly to the Bronze Key alcove
  { id: 'l1_sec2_key_bounce', x: 940, y: 880, width: 90, height: 18, type: 'bounce_pad', launchForceY: -22.0 },
  { id: 'l1_sec2_key_shelf', x: 800, y: 600, width: 140, height: 24, type: 'floating' },
  // Enhanced Section 2 climbing steps: removed old step 2, lowered step 4, added intermediate stepping platform
  { id: 'sec2_step_4', x: 1180, y: 980, width: 220, height: 28, type: 'floating' },
  { id: 'sec2_step_mid', x: 1400, y: 880, width: 200, height: 28, type: 'floating' },
  { id: 'sec2_ledge', x: 1620, y: 780, width: 240, height: 28, type: 'floating' },

  // SECTION 3: Obstacle Cavern (x: 1800 - 2700, y: 780 -> 700)
  // Phase 1: Locked Bronze Gate guarding entrance to Section 3 (requires Bronze Key)
  { id: 'l1_door_bronze', x: 1820, y: 710, width: 34, height: 110, type: 'locked_door', requiredKeyId: 'bronze_key', keyColor: '#cd7f32' },
  { id: 'sec3_pit_ground', x: 2250, y: 1040, width: 850, height: 40, type: 'ground' },
  { id: 'sec3_spikes_1', x: 2050, y: 1012, width: 240, height: 24, type: 'spike' },
  { id: 'sec3_spikes_2', x: 2360, y: 1012, width: 260, height: 24, type: 'spike' },
  { id: 'sec3_pillar_1', x: 1860, y: 760, width: 160, height: 28, type: 'floating' },
  { id: 'sec3_pillar_2', x: 2140, y: 740, width: 150, height: 28, type: 'floating' },
  // Phase 1: Wall Switch lowering bridge over cavern spike chasm
  { id: 'l1_sec3_switch', x: 2140, y: 685, width: 28, height: 28, type: 'wall_switch', targetIds: ['l1_sec3_bridge_ext'] },
  { id: 'l1_sec3_bridge_ext', x: 2270, y: 735, width: 110, height: 24, type: 'stone_gate', isOpen: false },
  { id: 'sec3_bridge_step', x: 2400, y: 730, width: 150, height: 28, type: 'floating' },
  { id: 'sec3_safe_island', x: 2680, y: 700, width: 180, height: 30, type: 'floating' },
  // Level 1 Midpoint Checkpoint Sanctuary
  { id: 'l1_checkpoint_1', x: 2680, y: 645, width: 36, height: 48, type: 'checkpoint' },
  // Intermediate escape steps out of Section 3 spike cavern pit to catch upper path
  { id: 'sec3_pit_step_1', x: 2750, y: 925, width: 130, height: 24, type: 'floating' },
  { id: 'sec3_pit_step_2', x: 2870, y: 800, width: 110, height: 24, type: 'floating' },

  // SECTION 4: Moving Platform Sector (x: 2700 - 3650, y: 700 -> 440)
  { id: 'sec4_chasm_spikes', x: 3150, y: 1080, width: 800, height: 24, type: 'spike' },
  // Phase 1: Moving Saw hazard traversing the lower cavern chasm
  {
    id: 'l1_sec4_moving_saw',
    x: 3150,
    y: 980,
    width: 44,
    height: 44,
    type: 'moving_saw',
    sawRadius: 22,
    pathStartX: 2900,
    pathStartY: 980,
    pathEndX: 3400,
    pathEndY: 980,
    moveSpeed: 1.6,
  },
  {
    id: 'sec4_moving_h',
    x: 2960,
    y: 680,
    width: 150,
    height: 28,
    type: 'moving',
    moveRangeX: 130,
    moveSpeed: 1.8,
  },
  { id: 'sec4_mid_island', x: 3250, y: 620, width: 150, height: 28, type: 'floating' },
  {
    id: 'sec4_moving_v',
    x: 3500,
    y: 540,
    width: 140,
    height: 28,
    type: 'moving',
    moveRangeY: 85,
    moveSpeed: 1.6,
  },
  { id: 'sec4_landing_ledge', x: 3720, y: 440, width: 180, height: 28, type: 'floating' },

  // SECTION 5: High-Altitude Skyways (x: 3650 - 4500, y: 440 -> 220 -> 800)
  { id: 'sec5_tower_1', x: 3920, y: 330, width: 140, height: 28, type: 'floating' },
  // Phase 1: Disappearing and Falling Platforms testing agile skyway leaps
  {
    id: 'l1_sec5_disappear_1',
    x: 4030,
    y: 270,
    width: 110,
    height: 26,
    type: 'disappearing_platform',
    cyclePeriod: 4.2,
    openDuration: 2.3,
    cycleOffset: 0,
  },
  { id: 'sec5_apex_crown', x: 4140, y: 220, width: 180, height: 30, type: 'floating' },
  { id: 'l1_sec5_falling_1', x: 4260, y: 290, width: 110, height: 26, type: 'falling_platform' },
  { id: 'sec5_drop_ledge_1', x: 4340, y: 380, width: 130, height: 26, type: 'floating' },
  { id: 'sec5_drop_ledge_2', x: 4200, y: 560, width: 140, height: 26, type: 'floating' },
  { id: 'sec5_drop_ledge_3', x: 4380, y: 740, width: 150, height: 28, type: 'floating' },

  // SECTION 6: Final Gauntlet & Golden Exit Ring (x: 4500 - 5200, y: 800 -> 920)
  { id: 'sec6_base_ground', x: 4600, y: 920, width: 260, height: 50, type: 'ground' },
  { id: 'sec6_spike_hazard', x: 4780, y: 910, width: 90, height: 24, type: 'spike' },
  { id: 'sec6_stepping_stone', x: 4910, y: 850, width: 130, height: 28, type: 'floating' },
  { id: 'sec6_goal_pedestal', x: 5100, y: 800, width: 200, height: 40, type: 'floating' },
  { id: 'sec6_golden_exit', x: 5100, y: 720, width: 50, height: 50, type: 'exit' },
];

// =============================================================================
// LEVEL 2: Aqueduct Caverns & The Sunken Temple (Expansive 7200x2400 Adventure)
// Floating Water, Ball Size Transformations (Small/Normal/Large), and Buoyancy
// =============================================================================
const LEVEL_2_PLATFORMS: PlatformData[] = [
  // --- Boundary Walls (Enclosing 7200 x 2400 World) ---
  { id: 'l2_wall_left', x: -20, y: 1200, width: 40, height: 3200, type: 'wall' },
  { id: 'l2_wall_right', x: 7220, y: 1200, width: 40, height: 3200, type: 'wall' },
  { id: 'l2_ceiling', x: 3600, y: -30, width: 7600, height: 60, type: 'wall' },

  // ===========================================================================
  // SECTION 1: Water Entrance (x: 0 - 1800, y: 1800 -> 1600)
  // Introduction to water, buoyant floating crates, and Inflator Pump
  // ===========================================================================
  { id: 'l2_start_ground', x: 350, y: 1850, width: 700, height: 80, type: 'ground' },
  { id: 'l2_start_step1', x: 520, y: 1760, width: 160, height: 28, type: 'floating' },
  { id: 'l2_start_step2', x: 750, y: 1690, width: 150, height: 28, type: 'floating' },
  // Inflator Gate introducing large buoyant ball
  { id: 'l2_sec1_gate_grow', x: 950, y: 1640, width: 42, height: 42, type: 'transformer_grow' },
  // Water Pool 1
  { id: 'l2_sec1_water', x: 1250, y: 1820, width: 800, height: 260, type: 'water' },
  { id: 'l2_sec1_crate1', x: 1120, y: 1700, width: 120, height: 24, type: 'floating' },
  { id: 'l2_sec1_crate2', x: 1380, y: 1700, width: 120, height: 24, type: 'floating' },
  // Reset Gate
  { id: 'l2_sec1_gate_normal', x: 1620, y: 1640, width: 42, height: 42, type: 'transformer_normal' },
  // Checkpoint 1 Sanctuary
  { id: 'l2_cp1_ledge', x: 1800, y: 1620, width: 220, height: 30, type: 'floating' },
  { id: 'l2_checkpoint_1', x: 1800, y: 1565, width: 36, height: 48, type: 'checkpoint' },

  // ===========================================================================
  // SECTION 2: Underwater Tunnel (x: 1800 - 3000, y: 1600 -> 2300)
  // Deflator Pump shrinks ball to slip through a 37px narrow seabed conduit
  // ===========================================================================
  { id: 'l2_sec2_gate_shrink', x: 1950, y: 1650, width: 42, height: 42, type: 'transformer_shrink' },
  { id: 'l2_sec2_water', x: 2450, y: 2050, width: 1200, height: 600, type: 'water' },
  // Low-ceiling submerged tunnel (37px clearance - only small ball fits)
  { id: 'l2_sec2_tunnel_ceil', x: 2450, y: 2238, width: 700, height: 40, type: 'ground' },
  { id: 'l2_sec2_tunnel_floor', x: 2450, y: 2320, width: 700, height: 50, type: 'ground' },
  // Tunnel exit grotto
  { id: 'l2_sec2_exit_shelf', x: 2950, y: 2300, width: 200, height: 40, type: 'ground' },
  // Phase 1: Paired Teleporter A (Submerged Seabed Grotto)
  { id: 'l2_teleport_a', x: 2800, y: 2260, width: 46, height: 46, type: 'teleporter', targetTeleporterId: 'l2_teleport_b', portalColor: '#38bdf8' },
  { id: 'l2_sec2_gate_normal', x: 2950, y: 2240, width: 42, height: 42, type: 'transformer_normal' },
  { id: 'l2_sec2_step1', x: 2980, y: 2080, width: 150, height: 28, type: 'floating' },
  { id: 'l2_sec2_step2', x: 3120, y: 1920, width: 150, height: 28, type: 'floating' },

  // ===========================================================================
  // SECTION 3: Floating Platform Area (x: 3000 - 4200, y: 2000 -> 1240)
  // High buoyancy Lake: surface breach jumps onto floating buoyant pontoons
  // ===========================================================================
  { id: 'l2_cp2_cliff', x: 3150, y: 1850, width: 220, height: 30, type: 'floating' },
  { id: 'l2_checkpoint_2', x: 3150, y: 1795, width: 36, height: 48, type: 'checkpoint' },
  // Phase 1: High Ancient Shrine Ruin with Paired Teleporter B
  { id: 'l2_shrine_plat', x: 3350, y: 1590, width: 130, height: 26, type: 'floating' },
  { id: 'l2_teleport_b', x: 3350, y: 1540, width: 46, height: 46, type: 'teleporter', targetTeleporterId: 'l2_teleport_a', portalColor: '#38bdf8' },
  { id: 'l2_sec3_gate_grow', x: 3300, y: 1780, width: 42, height: 42, type: 'transformer_grow' },
  { id: 'l2_sec3_water', x: 3700, y: 1850, width: 1100, height: 500, type: 'water' },
  // Phase 1: Underwater Submerged Mine Rotating Spikes
  { id: 'l2_sec3_mine_spike', x: 3920, y: 1750, width: 32, height: 32, type: 'rotating_spikes', armLength: 70, spikeCount: 3, angularSpeed: 1.4 },
  { id: 'l2_sec3_pontoon_1', x: 3550, y: 1520, width: 140, height: 26, type: 'floating' },
  { id: 'l2_sec3_pontoon_2', x: 3800, y: 1420, width: 140, height: 26, type: 'floating' },
  {
    id: 'l2_sec3_moving_pontoon',
    x: 4050,
    y: 1320,
    width: 130,
    height: 26,
    type: 'moving',
    moveRangeY: 60,
    moveSpeed: 1.8,
  },
  { id: 'l2_sec3_apex_cliff', x: 4250, y: 1240, width: 200, height: 30, type: 'floating' },
  // Phase 1: Locked Sapphire Temple Gate (requires Sapphire Key found in underwater conduit)
  { id: 'l2_door_sapphire', x: 4250, y: 1160, width: 36, height: 140, type: 'locked_door', requiredKeyId: 'sapphire_key', keyColor: '#38bdf8' },

  // ===========================================================================
  // SECTION 4: Deep Water Chamber (x: 4200 - 5400, y: 1240 -> 2250)
  // Sinking with Small Ball under moving spikes, then rising with Large Ball
  // ===========================================================================
  { id: 'l2_cp3_shelf', x: 4350, y: 1240, width: 200, height: 30, type: 'floating' },
  { id: 'l2_checkpoint_3', x: 4350, y: 1185, width: 36, height: 48, type: 'checkpoint' },
  { id: 'l2_sec4_gate_shrink', x: 4450, y: 1280, width: 42, height: 42, type: 'transformer_shrink' },
  { id: 'l2_sec4_water', x: 4850, y: 1750, width: 1000, height: 1000, type: 'water' },
  // Phase 1: Dual Underwater Pressure Switches unlocking the Grand Temple Drain Gate
  { id: 'l2_sw_water_1', x: 4600, y: 2240, width: 64, height: 20, type: 'pressure_plate', isLatched: true },
  { id: 'l2_sw_water_2', x: 5100, y: 2240, width: 64, height: 20, type: 'pressure_plate', isLatched: true },
  {
    id: 'l2_sec4_mov_spike1',
    x: 4700,
    y: 1550,
    width: 80,
    height: 24,
    type: 'spike',
    moveRangeX: 60,
    moveSpeed: 2.0,
  },
  {
    id: 'l2_sec4_mov_spike2',
    x: 5000,
    y: 1550,
    width: 80,
    height: 24,
    type: 'spike',
    moveRangeX: 60,
    moveSpeed: 2.0,
  },
  { id: 'l2_sec4_chamber_floor', x: 4850, y: 2280, width: 1000, height: 60, type: 'ground' },
  { id: 'l2_sec4_gate_grow', x: 4850, y: 2210, width: 42, height: 42, type: 'transformer_grow' },
  { id: 'l2_sec4_upper_exit', x: 5350, y: 1400, width: 180, height: 30, type: 'floating' },
  // Phase 1: Grand Sunken Drain Gate opened only when both switches (l2_sw_water_1 & l2_sw_water_2) are triggered
  { id: 'l2_door_drain', x: 5350, y: 1310, width: 36, height: 150, type: 'locked_door', requiredSwitches: ['l2_sw_water_1', 'l2_sw_water_2'], keyColor: '#00e5ff' },

  // ===========================================================================
  // SECTION 5: Waterfall Climb (x: 5400 - 6400, y: 2200 -> 800)
  // Cascading waterfalls providing upward fluid lift across crumbling cliffs
  // ===========================================================================
  { id: 'l2_cp4_shelf', x: 5450, y: 1750, width: 200, height: 30, type: 'floating' },
  { id: 'l2_checkpoint_4', x: 5450, y: 1695, width: 36, height: 48, type: 'checkpoint' },
  { id: 'l2_sec5_waterfall1', x: 5750, y: 1450, width: 220, height: 600, type: 'waterfall' },
  // Phase 1: Secret Air Chamber hidden behind Waterfall 1
  { id: 'l2_secret_waterfall', x: 5750, y: 1250, width: 50, height: 100, type: 'secret_passage' },
  { id: 'l2_sec5_waterfall2', x: 6100, y: 1050, width: 220, height: 600, type: 'waterfall' },
  { id: 'l2_sec5_step1', x: 5550, y: 1650, width: 140, height: 26, type: 'floating' },
  { id: 'l2_sec5_crumb1', x: 5750, y: 1530, width: 130, height: 26, type: 'crumbling' },
  // Phase 1: Timed Water Gate in the flume channel
  { id: 'l2_sec5_timed_gate', x: 5950, y: 1100, width: 36, height: 110, type: 'timed_door', cyclePeriod: 4.8, openDuration: 2.4, cycleOffset: 0 },
  { id: 'l2_sec5_step2', x: 5950, y: 1410, width: 140, height: 26, type: 'floating' },
  { id: 'l2_sec5_crumb2', x: 5750, y: 1290, width: 130, height: 26, type: 'crumbling' },
  { id: 'l2_sec5_step3', x: 5950, y: 1170, width: 140, height: 26, type: 'floating' },
  // Phase 1: Moving Saw in upper aqueduct channel
  {
    id: 'l2_sec5_saw',
    x: 6300,
    y: 880,
    width: 44,
    height: 44,
    type: 'moving_saw',
    sawRadius: 22,
    pathStartX: 6180,
    pathStartY: 880,
    pathEndX: 6420,
    pathEndY: 880,
    moveSpeed: 1.5,
  },
  { id: 'l2_sec5_crumb3', x: 6150, y: 1050, width: 130, height: 26, type: 'crumbling' },
  { id: 'l2_sec5_step4', x: 6000, y: 930, width: 140, height: 26, type: 'floating' },
  { id: 'l2_sec5_cliff_apex', x: 6280, y: 830, width: 220, height: 30, type: 'floating' },

  // ===========================================================================
  // SECTION 6: Final Escape & Aqueduct Temple (x: 6400 - 7200, y: 830 -> 520)
  // Water flume, shrink conduit, final growth jump & Golden Exit Ring!
  // ===========================================================================
  { id: 'l2_sec6_water', x: 6650, y: 800, width: 500, height: 180, type: 'water' },
  { id: 'l2_sec6_gate_shrink', x: 6480, y: 780, width: 42, height: 42, type: 'transformer_shrink' },
  { id: 'l2_sec6_low_arch', x: 6700, y: 720, width: 260, height: 30, type: 'ground' },
  // Periodic Fire Burner Hazard: fires upward flame for 1s and stops for 3s (4s cycle)
  {
    id: 'l2_sec6_fire_trap',
    x: 6700,
    y: 695,
    width: 44,
    height: 20,
    type: 'geyser',
    geyserHeight: 110,
    geyserCycleTime: 4.0,
    geyserEruptStart: 0.0,
    geyserEruptDuration: 1.0,
  },
  { id: 'l2_sec6_gate_grow', x: 6880, y: 780, width: 42, height: 42, type: 'transformer_grow' },
  { id: 'l2_goal_pedestal', x: 7050, y: 600, width: 220, height: 40, type: 'floating' },
  { id: 'l2_golden_exit', x: 7050, y: 520, width: 54, height: 54, type: 'exit' },
];

// =============================================================================
// LEVEL 3: Frozen Mountain Kingdom (Expansive 8800x2600 Alpine Adventure)
// Progression-based Nokia Bounce adventure: Original -> Big -> Stone -> Snow
// =============================================================================
const LEVEL_3_PLATFORMS: PlatformData[] = [
  // --- Boundary Walls (Enclosing 8800 x 2600 Mountain World) ---
  { id: 'l3_wall_left', x: -20, y: 1300, width: 40, height: 3600, type: 'wall' },
  { id: 'l3_wall_right', x: 8820, y: 1300, width: 40, height: 3600, type: 'wall' },
  { id: 'l3_ceiling', x: 4400, y: -30, width: 9400, height: 60, type: 'wall' },

  // ===========================================================================
  // SECTION 1: Frozen Valley (x: 0 - 900, y: 2250 -> 2100)
  // Player spawns as Original Red Ball. Introduction to mountain terrain.
  // ===========================================================================
  { id: 'l3_sec1_ground', x: 450, y: 2250, width: 900, height: 80, type: 'ground' },
  { id: 'l3_sec1_step1', x: 520, y: 2160, width: 140, height: 28, type: 'floating' },
  { id: 'l3_sec1_step2', x: 700, y: 2080, width: 140, height: 28, type: 'floating' },
  { id: 'l3_sec1_cliff', x: 860, y: 2080, width: 160, height: 28, type: 'floating' },
  // Big Ball Transformation Object before the Water Passage
  { id: 'l3_sec1_transformer_big', x: 860, y: 2020, width: 44, height: 44, type: 'transformer_big' },

  // ===========================================================================
  // SECTION 2: Alpine Water Passage (x: 900 - 1900, y: 2200 -> 2000)
  // Deep water basin: Big Ball's low density allows it to float across and breach jump
  // ===========================================================================
  { id: 'l3_sec2_water', x: 1350, y: 2200, width: 850, height: 280, type: 'water' },
  { id: 'l3_sec2_spikes', x: 1350, y: 2330, width: 850, height: 24, type: 'spike' },
  { id: 'l3_sec2_floe', x: 1350, y: 2120, width: 120, height: 24, type: 'ice' },
  { id: 'l3_sec2_landing', x: 1850, y: 2040, width: 200, height: 30, type: 'floating' },

  // CHECKPOINT 1 SANCTUARY (x: 1850, y: 1985)
  { id: 'l3_checkpoint_1', x: 1850, y: 1985, width: 36, height: 48, type: 'checkpoint' },

  // ===========================================================================
  // SECTION 3: Stone Fortress & Heavy Gate (x: 1900 - 3000, y: 2040 -> 1750)
  // Stone Ball smashes thick cracked wall and depresses heavy pressure plate
  // ===========================================================================
  { id: 'l3_sec3_pedestal', x: 2020, y: 2040, width: 140, height: 28, type: 'floating' },
  // Stone Ball Transformation Object right at entry/checkpoint 1 sanctuary
  { id: 'l3_sec3_transformer_stone', x: 2020, y: 1980, width: 44, height: 44, type: 'transformer_stone' },
  { id: 'l3_sec3_ground', x: 2500, y: 2080, width: 800, height: 50, type: 'ground' },
  { id: 'l3_sec3_crack1', x: 2250, y: 2020, width: 46, height: 90, type: 'cracked_wall' },
  // Normal Ball Reversion Gate allowing player to return to agile Red Ball form after smashing the cracked wall
  { id: 'l3_sec3_trans_ground', x: 2380, y: 2020, width: 44, height: 44, type: 'transformer_original' },
  { id: 'l3_sec3_plate', x: 2520, y: 2045, width: 64, height: 20, type: 'pressure_plate', linkedDoorId: 'l3_sec3_gate' },
  { id: 'l3_sec3_icicle', x: 2650, y: 1750, width: 26, height: 54, type: 'falling_icicle', icicleStartY: 1750, icicleEndY: 2050 },
  // High-tension spring bounce pad directly in front of the gate to launch up to the terrace
  { id: 'l3_sec3_bounce', x: 2715, y: 2060, width: 70, height: 18, type: 'bounce_pad', launchForceY: -24.0, launchForceX: 4.0 },
  { id: 'l3_sec3_gate', x: 2800, y: 1940, width: 40, height: 180, type: 'stone_gate' },
  // Intermediate stepping ledge to bridge the 220px vertical cliff once gate opens
  { id: 'l3_sec3_step', x: 2840, y: 1960, width: 100, height: 26, type: 'floating' },
  { id: 'l3_sec3_exit_shelf', x: 2950, y: 1850, width: 200, height: 30, type: 'floating' },

  // CHECKPOINT 2 SANCTUARY (x: 2950, y: 1795)
  { id: 'l3_checkpoint_2', x: 2950, y: 1795, width: 36, height: 48, type: 'checkpoint' },

  // ===========================================================================
  // SECTION 4: Narrow Glacial Ice Tunnel & Slopes (x: 3000 - 4500, y: 1800 -> 2150 -> 1600)
  // 38px low ceiling conduit: only small Snow Ball fits, followed by downhill icy slides
  // ===========================================================================
  { id: 'l3_sec4_shelf', x: 3100, y: 1820, width: 120, height: 28, type: 'floating' },
  // Snow Ball Transformation Object before narrow ice tunnel
  { id: 'l3_sec4_transformer_snow', x: 3100, y: 1760, width: 42, height: 42, type: 'transformer_snow' },
  // 40px low-clearance tunnel (Big Ball and Stone Ball cannot enter)
  { id: 'l3_sec4_tunnel_ceil', x: 3450, y: 1770, width: 500, height: 30, type: 'ground' },
  { id: 'l3_sec4_tunnel_floor', x: 3450, y: 1840, width: 500, height: 30, type: 'ground' },
  // Downhill icy speed slopes
  { id: 'l3_sec4_ice1', x: 3850, y: 1890, width: 260, height: 28, type: 'ice' },
  { id: 'l3_sec4_spikes', x: 4050, y: 2250, width: 240, height: 24, type: 'spike' },
  { id: 'l3_sec4_ice2', x: 4220, y: 1960, width: 240, height: 28, type: 'ice' },
  { id: 'l3_sec4_step', x: 4380, y: 1780, width: 140, height: 28, type: 'floating' },
  { id: 'l3_sec4_terrace', x: 4520, y: 1660, width: 180, height: 30, type: 'floating' },

  // CHECKPOINT 3 SANCTUARY (x: 4520, y: 1605)
  { id: 'l3_checkpoint_3', x: 4520, y: 1605, width: 36, height: 48, type: 'checkpoint' },

  // ===========================================================================
  // SECTION 5: Windy Mountain Ridge (x: 4500 - 5800, y: 1600 -> 1100)
  // Severe mountain gale blowing leftward (-6.5 force): Stone Ball resists wind drift
  // ===========================================================================
  { id: 'l3_sec5_staging', x: 4660, y: 1620, width: 120, height: 28, type: 'floating' },
  // Stone Ball Transformation Object before gale zone
  { id: 'l3_sec5_transformer_stone', x: 4660, y: 1560, width: 44, height: 44, type: 'transformer_stone' },
  // Phase 1: High-Altitude Spring Bounce Pad launching through headwind
  { id: 'l3_sec5_bounce_1', x: 4780, y: 1640, width: 70, height: 20, type: 'bounce_pad', launchForceY: -22.0, launchForceX: 6.0 },
  { id: 'l3_sec5_wind1', x: 4950, y: 1450, width: 500, height: 450, type: 'wind_zone', windForceX: -6.0, windForceY: -0.4 },
  { id: 'l3_sec5_wind2', x: 5450, y: 1250, width: 500, height: 450, type: 'wind_zone', windForceX: -6.5, windForceY: -0.4 },
  { id: 'l3_sec5_ledge1', x: 4860, y: 1520, width: 130, height: 28, type: 'floating' },
  // Phase 1: Rotating Blizzard Spikes in the windy gorge
  { id: 'l3_sec5_rot_spikes', x: 5200, y: 1200, width: 32, height: 32, type: 'rotating_spikes', armLength: 85, spikeCount: 3, angularSpeed: 2.0 },
  {
    id: 'l3_sec5_mov1',
    x: 5080,
    y: 1420,
    width: 130,
    height: 28,
    type: 'moving',
    moveRangeY: 60,
    moveSpeed: 1.8,
  },
  { id: 'l3_sec5_ledge2', x: 5300, y: 1320, width: 130, height: 28, type: 'floating' },
  {
    id: 'l3_sec5_mov2',
    x: 5520,
    y: 1200,
    width: 130,
    height: 28,
    type: 'moving',
    moveRangeX: 70,
    moveSpeed: 2.0,
  },
  { id: 'l3_sec5_chasm_spikes', x: 5200, y: 1750, width: 900, height: 30, type: 'spike' },
  { id: 'l3_sec5_ridge_top', x: 5780, y: 1100, width: 200, height: 30, type: 'floating' },
  // Phase 1: Ancient Grand Citadel Portcullis (requires Frost Key found in Section 3 cracked grotto)
  { id: 'l3_door_frost', x: 5850, y: 1040, width: 40, height: 180, type: 'locked_door', requiredKeyId: 'frost_key', keyColor: '#a5f3fc' },

  // CHECKPOINT 4 SANCTUARY (x: 5780, y: 1045)
  { id: 'l3_checkpoint_4', x: 5780, y: 1045, width: 36, height: 48, type: 'checkpoint' },

  // ===========================================================================
  // SECTION 6: Glacial Lake & Floating Floes (x: 5800 - 7400, y: 1100 -> 800)
  // Deep lake traversal: Big Ball floats safely on open water; Snow Ball crosses snow bridges
  // ===========================================================================
  { id: 'l3_sec6_shore', x: 5940, y: 1080, width: 140, height: 28, type: 'floating' },
  // Big Ball Transformation Object at lake shore
  { id: 'l3_sec6_transformer_big', x: 5940, y: 1020, width: 44, height: 44, type: 'transformer_big' },
  { id: 'l3_sec6_water', x: 6550, y: 1120, width: 1050, height: 320, type: 'water' },
  { id: 'l3_sec6_seabed', x: 6550, y: 1290, width: 1050, height: 50, type: 'ground' },
  { id: 'l3_sec6_ice_floe1', x: 6200, y: 1020, width: 150, height: 26, type: 'ice' },
  // Phase 1: Multi-Switch Mechanism in Citadel (Heavy Plate + Wall Switch)
  { id: 'l3_citadel_plate', x: 6380, y: 990, width: 64, height: 20, type: 'heavy_pressure_plate', isLatched: true },
  { id: 'l3_sec6_snow_bridge', x: 6450, y: 980, width: 140, height: 24, type: 'snow_platform' },
  // Phase 1: Moving Saw hazard over ice floes
  {
    id: 'l3_sec6_saw',
    x: 6550,
    y: 880,
    width: 46,
    height: 46,
    type: 'moving_saw',
    sawRadius: 23,
    pathStartX: 6400,
    pathStartY: 880,
    pathEndX: 6700,
    pathEndY: 880,
    moveSpeed: 1.8,
  },
  { id: 'l3_sec6_icicle', x: 6450, y: 680, width: 26, height: 54, type: 'falling_icicle', icicleStartY: 680, icicleEndY: 980 },
  { id: 'l3_sec6_ice_floe2', x: 6720, y: 940, width: 150, height: 26, type: 'ice' },
  { id: 'l3_citadel_switch', x: 6720, y: 860, width: 30, height: 30, type: 'wall_switch', isLatched: true },
  {
    id: 'l3_sec6_mov_ice',
    x: 6980,
    y: 900,
    width: 140,
    height: 26,
    type: 'moving',
    moveRangeY: 50,
    moveSpeed: 1.9,
  },
  { id: 'l3_sec6_far_shore', x: 7280, y: 840, width: 200, height: 30, type: 'floating' },
  // Phase 1: Multi-Switch Citadel Summit Gate (unlocked when both l3_citadel_plate & l3_citadel_switch are active)
  { id: 'l3_door_summit', x: 7100, y: 830, width: 40, height: 160, type: 'locked_door', requiredSwitches: ['l3_citadel_plate', 'l3_citadel_switch'], keyColor: '#ffd700' },

  // CHECKPOINT 5 SANCTUARY (x: 7280, y: 785)
  { id: 'l3_checkpoint_5', x: 7280, y: 785, width: 36, height: 48, type: 'checkpoint' },

  // ===========================================================================
  // SECTION 7: Mountain Summit Grand Gauntlet (x: 7400 - 8800, y: 800 -> 300)
  // Master finale sequence: Stone breaks gate -> Snow crosses fragile arch -> Original leaps to Victory!
  // ===========================================================================
  // Step 1: Stone Ball Gate
  { id: 'l3_sec7_shelf1', x: 7440, y: 840, width: 140, height: 28, type: 'floating' },
  { id: 'l3_sec7_transformer_stone', x: 7440, y: 780, width: 44, height: 44, type: 'transformer_stone' },
  { id: 'l3_sec7_crack', x: 7620, y: 790, width: 46, height: 90, type: 'cracked_wall' },

  // Phase 1: Summit Shortcut Paired Teleporter (Warp across abyssal mountain crevasse)
  { id: 'l3_teleport_a', x: 7550, y: 760, width: 48, height: 48, type: 'teleporter', targetTeleporterId: 'l3_teleport_b', portalColor: '#a855f7' },
  { id: 'l3_teleport_b', x: 7950, y: 650, width: 48, height: 48, type: 'teleporter', targetTeleporterId: 'l3_teleport_a', portalColor: '#a855f7' },

  // Step 2: Snow Ball Fragile Arch
  { id: 'l3_sec7_shelf2', x: 7780, y: 780, width: 140, height: 28, type: 'floating' },
  { id: 'l3_sec7_transformer_snow', x: 7780, y: 720, width: 42, height: 42, type: 'transformer_snow' },
  { id: 'l3_sec7_snow1', x: 7980, y: 730, width: 130, height: 24, type: 'snow_platform' },
  { id: 'l3_sec7_snow2', x: 8160, y: 670, width: 130, height: 24, type: 'snow_platform' },
  // Phase 1: Secret Ice Cave False Wall hiding bonus coin cache
  { id: 'l3_secret_ice_cave', x: 8160, y: 540, width: 40, height: 90, type: 'secret_passage' },

  // Step 3: Original Red Ball Pinnacle Leap
  { id: 'l3_sec7_launchpad', x: 8360, y: 600, width: 160, height: 28, type: 'floating' },
  { id: 'l3_sec7_transformer_original', x: 8360, y: 540, width: 44, height: 44, type: 'transformer_original' },
  { id: 'l3_sec7_pinnacle', x: 8520, y: 470, width: 140, height: 28, type: 'floating' },
  { id: 'l3_goal_pedestal', x: 8680, y: 380, width: 220, height: 40, type: 'floating' },
  { id: 'l3_golden_exit', x: 8680, y: 300, width: 54, height: 54, type: 'exit' },
];

export const LEVEL_1_KEYS: KeyData[] = [
  {
    id: 'l1_key_bronze',
    keyId: 'bronze_key',
    x: 880,
    y: 570,
    name: 'Bronze Key',
    color: '#cd7f32',
  },
];

export const LEVEL_2_KEYS: KeyData[] = [
  {
    id: 'l2_key_sapphire',
    keyId: 'sapphire_key',
    x: 2950,
    y: 2260,
    name: 'Sapphire Key',
    color: '#38bdf8',
  },
];

export const LEVEL_3_KEYS: KeyData[] = [
  {
    id: 'l3_key_frost',
    keyId: 'frost_key',
    x: 2360,
    y: 1950,
    name: 'Frost Key',
    color: '#a5f3fc',
  },
];

export const LEVEL_1_COINS: CoinData[] = [
  { id: 'l1_coin_01', x: 480, y: 1210, value: 1 },
  { id: 'l1_coin_02', x: 720, y: 1130, value: 1 },
  { id: 'l1_coin_secret_1', x: 620, y: 1340, value: 5 }, // Secret meadow grotto
  { id: 'l1_coin_03', x: 1180, y: 930, value: 1 },
  { id: 'l1_coin_04', x: 1400, y: 830, value: 1 },
  { id: 'l1_coin_05', x: 1620, y: 730, value: 1 },
  { id: 'l1_coin_06', x: 2360, y: 950, value: 1 },
  { id: 'l1_coin_07', x: 2960, y: 650, value: 1 },
  { id: 'l1_coin_08', x: 3350, y: 680, value: 1 },
  { id: 'l1_coin_09', x: 4000, y: 430, value: 1 }, // High skyway secret
  { id: 'l1_coin_10', x: 4320, y: 850, value: 1 },
  { id: 'l1_coin_11', x: 4880, y: 1030, value: 1 },
  { id: 'l1_coin_12', x: 5080, y: 710, value: 1 },
];

export const LEVEL_2_COINS: CoinData[] = [
  { id: 'l2_coin_01', x: 520, y: 1710, value: 1 },
  { id: 'l2_coin_02', x: 1250, y: 1780, value: 1 }, // Water entrance sunken coin
  { id: 'l2_coin_03', x: 2300, y: 2280, value: 1 }, // Narrow underwater tunnel 1
  { id: 'l2_coin_04', x: 2650, y: 2280, value: 1 }, // Narrow underwater tunnel 2
  { id: 'l2_coin_shrine', x: 3350, y: 1480, value: 5 }, // Teleporter destination ancient shrine
  { id: 'l2_coin_05', x: 3150, y: 1740, value: 1 }, // Checkpoint 2 shelf
  { id: 'l2_coin_06', x: 3550, y: 1470, value: 1 }, // Pontoon 1
  { id: 'l2_coin_07', x: 3800, y: 1370, value: 1 }, // Pontoon 2
  { id: 'l2_coin_08', x: 4050, y: 1270, value: 1 }, // Moving pontoon
  { id: 'l2_coin_09', x: 4350, y: 1130, value: 1 }, // Checkpoint 3 shelf
  { id: 'l2_coin_10', x: 4850, y: 2220, value: 1 }, // Deep seabed treasure
  { id: 'l2_coin_11', x: 5450, y: 1640, value: 1 }, // Checkpoint 4 cliff
  { id: 'l2_coin_secret_waterfall', x: 5750, y: 1250, value: 5 }, // Secret waterfall air chamber
  { id: 'l2_coin_12', x: 5750, y: 1380, value: 1 }, // Waterfall 1 mist
  { id: 'l2_coin_13', x: 6100, y: 980, value: 1 },  // Waterfall 2 crest
  { id: 'l2_coin_14', x: 6650, y: 740, value: 1 },  // Water flume
  { id: 'l2_coin_15', x: 7050, y: 460, value: 1 },  // Temple victory apex
];

export const LEVEL_3_COINS: CoinData[] = [
  { id: 'l3_coin_01', x: 320, y: 2190, value: 1 },
  { id: 'l3_coin_02', x: 520, y: 2110, value: 1 },
  { id: 'l3_coin_03', x: 700, y: 2030, value: 1 },
  { id: 'l3_coin_04', x: 1100, y: 2070, value: 1 },
  { id: 'l3_coin_05', x: 1350, y: 2060, value: 1 },
  { id: 'l3_coin_06', x: 1600, y: 2070, value: 1 },
  { id: 'l3_coin_07', x: 2150, y: 1990, value: 1 },
  { id: 'l3_coin_secret_grotto', x: 2360, y: 1900, value: 5 }, // Secret cracked wall grotto
  { id: 'l3_coin_08', x: 2380, y: 2010, value: 1 },
  { id: 'l3_coin_09', x: 2700, y: 1990, value: 1 },
  { id: 'l3_coin_10', x: 3450, y: 1810, value: 1 }, // Inside narrow ice tunnel
  { id: 'l3_coin_11', x: 3850, y: 1840, value: 1 },
  { id: 'l3_coin_12', x: 4220, y: 1910, value: 1 },
  { id: 'l3_coin_13', x: 4860, y: 1470, value: 1 },
  { id: 'l3_coin_14', x: 5080, y: 1370, value: 1 },
  { id: 'l3_coin_15', x: 5520, y: 1150, value: 1 },
  { id: 'l3_coin_16', x: 6200, y: 970, value: 1 },
  { id: 'l3_coin_17', x: 6720, y: 890, value: 1 },
  { id: 'l3_coin_18', x: 6980, y: 850, value: 1 },
  { id: 'l3_coin_secret_cave', x: 8160, y: 500, value: 5 }, // Secret summit ice cave
  { id: 'l3_coin_19', x: 8160, y: 620, value: 1 },
  { id: 'l3_coin_20', x: 8680, y: 240, value: 1 }, // Summit victory coin
];

export const GAME_LEVELS: LevelConfig[] = [
  {
    id: 1,
    name: 'Sunny Meadow & Skyways',
    subtitle: 'Expansive 6-Section Adventure',
    difficulty: 'EASY',
    badgeColor: '#28a745',
    themeColor: '#78c257',
    description:
      'Explore an expansive 5,200px map with vertical towers, moving platforms, spike caverns, bounce pads, and the golden exit ring!',
    platforms: LEVEL_1_PLATFORMS,
    coins: LEVEL_1_COINS,
    keys: LEVEL_1_KEYS,
    worldWidth: 5200,
    worldHeight: 1500,
    initialBallX: 160,
    initialBallY: 1300,
    theme: 'meadow',
    starThresholds: {
      threeStarTimeSeconds: 95,
      threeStarMaxDeaths: 0,
      twoStarTimeSeconds: 180,
      twoStarMaxDeaths: 2,
    },
  },
  {
    id: 2,
    name: 'Aqueduct Caverns & The Sunken Temple',
    subtitle: 'Floating Water, Ball Size & Density Adventure',
    difficulty: 'MEDIUM',
    badgeColor: '#00e5ff',
    themeColor: '#0288d1',
    description:
      'A massive 7,200px subterranean water cavern featuring floating physics, ball size transformations, narrow underwater conduits, teleporters, and a waterfall climb!',
    platforms: LEVEL_2_PLATFORMS,
    coins: LEVEL_2_COINS,
    keys: LEVEL_2_KEYS,
    worldWidth: 7200,
    worldHeight: 2400,
    initialBallX: 160,
    initialBallY: 1780,
    theme: 'crystal_cave',
    starThresholds: {
      threeStarTimeSeconds: 140,
      threeStarMaxDeaths: 1,
      twoStarTimeSeconds: 240,
      twoStarMaxDeaths: 3,
    },
    risingZone: {
      startX: 5400,
      endX: 6600,
      initialY: 1850,
      targetY: 680,
      speed: 16,
      triggerX: 5400,
      riseStartX: 5500,
    },
  },
  {
    id: 3,
    name: 'Frozen Mountain Kingdom',
    subtitle: 'Three Ball Forms: Original, Stone & Snow',
    difficulty: 'EXPERT',
    badgeColor: '#00e5ff',
    themeColor: '#0288d1',
    description:
      'A colossal 8,800px alpine mountain world featuring three playable ball forms (Original, Stone, Snow), cracked stone walls, heavy pressure plates, teleporters, rotating spikes, and the crystal spire!',
    platforms: LEVEL_3_PLATFORMS,
    coins: LEVEL_3_COINS,
    keys: LEVEL_3_KEYS,
    worldWidth: 8800,
    worldHeight: 2600,
    initialBallX: 160,
    initialBallY: 2180,
    theme: 'frozen_mountain',
    starThresholds: {
      threeStarTimeSeconds: 180,
      threeStarMaxDeaths: 1,
      twoStarTimeSeconds: 300,
      twoStarMaxDeaths: 4,
    },
  },
  LEVEL_4_CONFIG,
  LEVEL_5_CONFIG,
];

export function calculateStars(
  levelId: number,
  timeSeconds: number,
  deaths: number
): number {
  const lvl = GAME_LEVELS.find((l) => l.id === levelId);
  const thresholds = lvl?.starThresholds ?? {
    threeStarTimeSeconds: 120,
    threeStarMaxDeaths: 0,
    twoStarTimeSeconds: 240,
    twoStarMaxDeaths: 3,
  };

  if (
    timeSeconds <= thresholds.threeStarTimeSeconds &&
    deaths <= thresholds.threeStarMaxDeaths
  ) {
    return 3;
  }

  if (
    timeSeconds <= thresholds.twoStarTimeSeconds &&
    deaths <= thresholds.twoStarMaxDeaths
  ) {
    return 2;
  }

  return 1;
}

export function getLevelData(levelId: number): LevelConfig {
  const found = GAME_LEVELS.find((l) => l.id === levelId);
  const lvl = found || GAME_LEVELS[0];
  return {
    ...lvl,
    platforms: lvl.platforms.map((p) => ({ ...p })),
    coins: lvl.coins?.map((c) => ({ ...c })),
    keys: lvl.keys?.map((k) => ({ ...k })),
    challengeTimers: lvl.challengeTimers?.map((t) => ({ ...t })),
  };
}
