import { PlatformData, KeyData, CoinData, ChallengeTimerConfig } from '../../types/game';
import { LevelConfig } from '../levels';

// =============================================================================
// LEVEL 4: Ancient Temple – The Four Trials
// Theme: Ancient Temple Kingdom
// Featuring:
// 1. Trial 1 – The Five Flames: 5 sequential fire hazards with countdown timer
// 2. Trial 2 – The Wind Passage: Narrow floating platforms over a spike pit with alternating wind
// 3. Trial 3 – The Rotating Machinery: Revolving stone beams, platforms & rotating spike hazards
// 4. Trial 4 – The Double High-Jump Chamber: Two consecutive launch machines with recovery shelves
// Followed by the Temple Crown Altar and Exit Gateway
// =============================================================================

export const LEVEL_4_PLATFORMS: PlatformData[] = [
  // --- Boundary Walls (Enclosing 7600 x 2400 World) ---
  { id: 'l4_wall_left', x: -20, y: 1200, width: 40, height: 3200, type: 'wall' },
  { id: 'l4_wall_right', x: 7620, y: 1200, width: 40, height: 3200, type: 'wall' },
  { id: 'l4_ceiling', x: 3800, y: -30, width: 8000, height: 60, type: 'wall' },

  // ===========================================================================
  // SECTION 0: Temple Gates & Entry Sanctuary (x: 0 - 750, y: 1900)
  // Safe starting sanctuary, carved ruin pillars, and Checkpoint 1
  // ===========================================================================
  { id: 'l4_sec1_ground', x: 380, y: 1920, width: 760, height: 60, type: 'ground' },

  // CHECKPOINT 1 SANCTUARY (Observation Area before Trial 1)
  { id: 'l4_cp_1', x: 600, y: 1865, width: 36, height: 48, type: 'checkpoint' },

  // ===========================================================================
  // SECTION 1: Trial 1 – The Five Flames (x: 750 - 2150, y: 1900 - 1800)
  // Narrow stone corridor with 5 consecutive timed flame traps & safe pedestals
  // Countdown Timer: 18.0s (Failure resets challenge to Checkpoint 1)
  // ===========================================================================
  { id: 'l4_t1_floor', x: 1450, y: 1920, width: 1400, height: 60, type: 'ground' },
  { id: 'l4_t1_ceil', x: 1450, y: 1680, width: 1400, height: 40, type: 'ground' },

  // 5 Consecutive Flame Traps (Predictable Wave Cycles with 0.5s Pre-Eruption Warning)
  // Flame 1 (Wave A)
  {
    id: 'l4_flame_1',
    x: 920,
    y: 1890,
    width: 44,
    height: 24,
    type: 'geyser',
    geyserHeight: 115,
    geyserCycleTime: 3.6,
    geyserEruptStart: 0.0,
    geyserEruptDuration: 1.3,
  },
  { id: 'l4_t1_step_1', x: 1060, y: 1890, width: 84, height: 24, type: 'floating' },

  // Flame 2 (Wave B)
  {
    id: 'l4_flame_2',
    x: 1200,
    y: 1890,
    width: 44,
    height: 24,
    type: 'geyser',
    geyserHeight: 115,
    geyserCycleTime: 3.6,
    geyserEruptStart: 1.8,
    geyserEruptDuration: 1.3,
  },
  { id: 'l4_t1_step_2', x: 1340, y: 1890, width: 84, height: 24, type: 'floating' },

  // Flame 3 (Wave A)
  {
    id: 'l4_flame_3',
    x: 1480,
    y: 1890,
    width: 44,
    height: 24,
    type: 'geyser',
    geyserHeight: 115,
    geyserCycleTime: 3.6,
    geyserEruptStart: 0.0,
    geyserEruptDuration: 1.3,
  },
  { id: 'l4_t1_step_3', x: 1620, y: 1890, width: 84, height: 24, type: 'floating' },

  // Flame 4 (Wave B)
  {
    id: 'l4_flame_4',
    x: 1760,
    y: 1890,
    width: 44,
    height: 24,
    type: 'geyser',
    geyserHeight: 115,
    geyserCycleTime: 3.6,
    geyserEruptStart: 1.8,
    geyserEruptDuration: 1.3,
  },
  { id: 'l4_t1_step_4', x: 1900, y: 1890, width: 84, height: 24, type: 'floating' },

  // Flame 5 (Wave A)
  {
    id: 'l4_flame_5',
    x: 2040,
    y: 1890,
    width: 44,
    height: 24,
    type: 'geyser',
    geyserHeight: 115,
    geyserCycleTime: 3.6,
    geyserEruptStart: 0.0,
    geyserEruptDuration: 1.3,
  },

  // Trial 1 Exit Landing Terrace
  { id: 'l4_t1_exit', x: 2200, y: 1890, width: 160, height: 28, type: 'floating' },

  // ===========================================================================
  // SECTION 2: Observation Terrace & Checkpoint 2 (x: 2200 - 2450, y: 1820)
  // Safe sanctuary between Trial 1 and Trial 2
  // ===========================================================================
  { id: 'l4_sec2_sanctuary', x: 2320, y: 1820, width: 240, height: 30, type: 'floating' },

  // CHECKPOINT 2 SANCTUARY (Observation Area before Trial 2)
  { id: 'l4_cp_2', x: 2340, y: 1765, width: 36, height: 48, type: 'checkpoint' },

  // ===========================================================================
  // SECTION 3: Trial 2 – The Wind Passage (x: 2450 - 3800, y: 1800 -> 1540)
  // Narrow stone platforms suspended over a deep spike chasm with alternating wind
  // Countdown Timer: 22.0s (Falling or running out of time resets to Checkpoint 2)
  // ===========================================================================
  // Deep Chasm Pit Lined with Ancient Spikes
  { id: 'l4_t2_pit', x: 3120, y: 2320, width: 1400, height: 40, type: 'ground' },
  { id: 'l4_t2_spikes', x: 3120, y: 2280, width: 1350, height: 24, type: 'spike' },

  // Alternating Dynamic Wind Zone (Reverses direction smoothly every 7.0 seconds)
  {
    id: 'l4_t2_wind',
    x: 3120,
    y: 1680,
    width: 1350,
    height: 550,
    type: 'wind_zone',
    isAlternating: true,
    windCycleTime: 7.0,
    windForceXMax: 4.6,
  },

  // Narrow stepping platforms requiring controlled jumps with and against wind
  { id: 'l4_t2_step1', x: 2560, y: 1770, width: 100, height: 26, type: 'floating' },
  { id: 'l4_t2_step2', x: 2740, y: 1720, width: 94, height: 26, type: 'floating' },
  { id: 'l4_t2_step3', x: 2930, y: 1680, width: 90, height: 26, type: 'floating' },
  { id: 'l4_t2_step4', x: 3130, y: 1640, width: 110, height: 26, type: 'floating' }, // Safe midpoint pillar
  { id: 'l4_t2_step5', x: 3320, y: 1600, width: 90, height: 26, type: 'floating' },
  { id: 'l4_t2_step6', x: 3510, y: 1570, width: 94, height: 26, type: 'floating' },

  // Trial 2 Exit Landing Terrace
  { id: 'l4_t2_exit', x: 3720, y: 1540, width: 200, height: 30, type: 'floating' },

  // ===========================================================================
  // SECTION 4: Observation Terrace & Checkpoint 3 (x: 3720 - 4000, y: 1540)
  // Safe sanctuary between Trial 2 and Trial 3
  // ===========================================================================
  { id: 'l4_sec3_sanctuary', x: 3850, y: 1540, width: 260, height: 30, type: 'floating' },

  // CHECKPOINT 3 SANCTUARY (Observation Area before Trial 3)
  { id: 'l4_cp_3', x: 3880, y: 1485, width: 36, height: 48, type: 'checkpoint' },

  // ===========================================================================
  // SECTION 5: Trial 3 – The Rotating Machinery (x: 4000 - 5500, y: 1540 -> 1400)
  // Ancient mechanical chamber with revolving stone platforms, revolving mace hazards,
  // and safe resting islands
  // ===========================================================================
  { id: 'l4_t3_pit', x: 4750, y: 2200, width: 1500, height: 40, type: 'ground' },
  { id: 'l4_t3_spikes', x: 4750, y: 2160, width: 1450, height: 24, type: 'spike' },

  { id: 'l4_t3_entry', x: 4060, y: 1520, width: 120, height: 26, type: 'floating' },

  // Rotating Stone Platform 1 (Orbits around gear pivot at x=4280, y=1510)
  {
    id: 'l4_t3_rot_plat1',
    x: 4280,
    y: 1510,
    width: 94,
    height: 24,
    type: 'floating',
    isRotatingPlatform: true,
    pivotX: 4280,
    pivotY: 1510,
    orbitRadius: 85,
    angularSpeed: 1.2,
  },

  // Rotating Spike Hazard 1 (Triple mace arm revolving around anchor)
  {
    id: 'l4_t3_rot_spike1',
    x: 4430,
    y: 1380,
    width: 32,
    height: 32,
    type: 'rotating_spikes',
    armLength: 72,
    angularSpeed: 1.5,
    spikeCount: 3,
  },

  // Safe Central Resting Island (Allows observing the next rotating sector safely)
  { id: 'l4_t3_island_mid', x: 4600, y: 1480, width: 140, height: 28, type: 'floating' },

  // Rotating Spike Hazard 2 (Counter-revolving mace arm)
  {
    id: 'l4_t3_rot_spike2',
    x: 4770,
    y: 1360,
    width: 32,
    height: 32,
    type: 'rotating_spikes',
    armLength: 75,
    angularSpeed: -1.4,
    spikeCount: 3,
  },

  // Rotating Stone Platform 2 (Orbits around gear pivot at x=4940, y=1460)
  {
    id: 'l4_t3_rot_plat2',
    x: 4940,
    y: 1460,
    width: 94,
    height: 24,
    type: 'floating',
    isRotatingPlatform: true,
    pivotX: 4940,
    pivotY: 1460,
    orbitRadius: 85,
    angularSpeed: -1.2,
  },

  // Secondary Safe Resting Shelf
  { id: 'l4_t3_shelf_mid2', x: 5140, y: 1440, width: 120, height: 26, type: 'floating' },

  // Rotating Stone Beam Platform 3 (Orbits around gear pivot at x=5320, y=1420)
  {
    id: 'l4_t3_rot_plat3',
    x: 5320,
    y: 1420,
    width: 90,
    height: 24,
    type: 'floating',
    isRotatingPlatform: true,
    pivotX: 5320,
    pivotY: 1420,
    orbitRadius: 80,
    angularSpeed: 1.3,
  },

  // Trial 3 Exit Landing Terrace
  { id: 'l4_t3_exit', x: 5520, y: 1400, width: 180, height: 30, type: 'floating' },

  // ===========================================================================
  // SECTION 6: Observation Terrace & Checkpoint 4 (x: 5500 - 5800, y: 1400)
  // Safe sanctuary between Trial 3 and Trial 4
  // ===========================================================================
  { id: 'l4_sec4_sanctuary', x: 5650, y: 1400, width: 220, height: 30, type: 'floating' },

  // CHECKPOINT 4 SANCTUARY (Observation Area before Trial 4)
  { id: 'l4_cp_4', x: 5670, y: 1345, width: 36, height: 48, type: 'checkpoint' },

  // ===========================================================================
  // SECTION 7: Trial 4 – The Double High-Jump Chamber (x: 5800 - 7000, y: 1800 up to 700)
  // Vertical temple chamber with exactly two consecutive mechanical launch machines
  // ===========================================================================
  // Bottom Spikes in High-Jump Chamber
  { id: 'l4_sec4_chasm_pit', x: 6400, y: 1800, width: 1300, height: 40, type: 'ground' },
  { id: 'l4_sec4_chasm_spikes', x: 6400, y: 1760, width: 1250, height: 24, type: 'spike' },

  // --- STAGE A ---
  // Lower Staging Platform
  { id: 'l4_sec4_stage_a_base', x: 5880, y: 1600, width: 200, height: 30, type: 'floating' },

  // Launch Machine A: Powerful pneumatic catapult boosting ball vertically ~420px
  {
    id: 'l4_launch_a',
    x: 5940,
    y: 1575,
    width: 76,
    height: 20,
    type: 'bounce_pad',
    isLaunchMachine: true,
    launchForceY: -27.5,
    launchDirection: 'up',
  },

  // Narrow Elevated Landing Platform A (Elevated ~395px above launch machine)
  { id: 'l4_sec4_plat_a', x: 6180, y: 1180, width: 130, height: 26, type: 'floating' },

  // Lower Recovery Catch Floor below Stage A (Ensures machine is reusable on missed jump)
  { id: 'l4_sec4_recovery_a', x: 6100, y: 1650, width: 360, height: 30, type: 'floating' },
  { id: 'l4_sec4_ramp_a', x: 5980, y: 1625, width: 80, height: 24, type: 'floating' },

  // --- STAGE B ---
  // Elevated Stepping Platform leading to Launch Machine B
  { id: 'l4_sec4_step_b', x: 6310, y: 1180, width: 120, height: 26, type: 'floating' },

  // Launch Machine B: Second pneumatic catapult boosting ball toward final elevated platform
  {
    id: 'l4_launch_b',
    x: 6350,
    y: 1155,
    width: 76,
    height: 20,
    type: 'bounce_pad',
    isLaunchMachine: true,
    launchForceY: -28.0,
    launchDirection: 'up',
  },

  // Final Elevated Summit Platform (Elevated ~415px above Launch Machine B)
  { id: 'l4_sec4_summit', x: 6600, y: 740, width: 140, height: 28, type: 'floating' },

  // Lower Recovery Catch Floor below Stage B (Ensures reusable attempts without dying)
  { id: 'l4_sec4_recovery_b', x: 6480, y: 1240, width: 240, height: 26, type: 'floating' },
  { id: 'l4_sec4_ramp_b', x: 6390, y: 1210, width: 80, height: 24, type: 'floating' },

  // ===========================================================================
  // SECTION 8: Temple Crown Altar & Exit Sanctuary (x: 6600 - 7400, y: 740)
  // Grand Temple Altar, Checkpoint 5, and the Ancient Temple Gateway
  // ===========================================================================
  { id: 'l4_altar_floor', x: 6880, y: 740, width: 460, height: 40, type: 'ground' },

  // CHECKPOINT 5 SANCTUARY (Crown Altar)
  { id: 'l4_cp_5', x: 6750, y: 685, width: 36, height: 48, type: 'checkpoint' },

  // Ancient Temple Gateway (Exit Portal)
  {
    id: 'l4_exit',
    x: 7120,
    y: 670,
    width: 50,
    height: 100,
    type: 'exit',
  },
];

export const LEVEL_4_COINS: CoinData[] = [
  // Section 0: Entry Sanctuary
  { id: 'l4_c01', x: 220, y: 1860, value: 1 },
  { id: 'l4_c02', x: 480, y: 1860, value: 1 },

  // Section 1: Trial 1 – The Five Flames (Above safe pedestals)
  { id: 'l4_c03', x: 1060, y: 1840, value: 1 },
  { id: 'l4_c04', x: 1340, y: 1840, value: 1 },
  { id: 'l4_c05', x: 1620, y: 1840, value: 1 },
  { id: 'l4_c06', x: 1900, y: 1840, value: 1 },

  // Section 2: Sanctuary 2
  { id: 'l4_c07', x: 2280, y: 1760, value: 1 },
  { id: 'l4_c08', x: 2390, y: 1760, value: 1 },

  // Section 3: Trial 2 – The Wind Passage (Above stepping platforms)
  { id: 'l4_c09', x: 2560, y: 1710, value: 1 },
  { id: 'l4_c10', x: 2740, y: 1660, value: 1 },
  { id: 'l4_c11', x: 2930, y: 1620, value: 1 },
  { id: 'l4_c12', x: 3320, y: 1540, value: 1 },
  { id: 'l4_c13', x: 3510, y: 1510, value: 1 },

  // Section 4: Sanctuary 3
  { id: 'l4_c14', x: 3820, y: 1480, value: 1 },
  { id: 'l4_c15', x: 3940, y: 1480, value: 1 },

  // Section 5: Trial 3 – The Rotating Machinery
  { id: 'l4_c16', x: 4280, y: 1400, value: 1 },
  { id: 'l4_c17', x: 4600, y: 1420, value: 1 },
  { id: 'l4_c18', x: 4940, y: 1350, value: 1 },
  { id: 'l4_c19', x: 5140, y: 1380, value: 1 },

  // Section 6: Sanctuary 4
  { id: 'l4_c20', x: 5620, y: 1340, value: 1 },
  { id: 'l4_c21', x: 5720, y: 1340, value: 1 },

  // Section 7: Trial 4 – Double High-Jump Chamber
  { id: 'l4_c22', x: 6060, y: 1360, value: 1 }, // Mid-air arc Stage A
  { id: 'l4_c23', x: 6470, y: 920, value: 1 },  // Mid-air arc Stage B

  // Section 8: Temple Crown Altar (High-value bonus victory coins)
  { id: 'l4_c24', x: 6880, y: 670, value: 5 },
  { id: 'l4_c25', x: 7000, y: 670, value: 5 },
];

export const LEVEL_4_KEYS: KeyData[] = [];

export const LEVEL_4_CHALLENGE_TIMERS: ChallengeTimerConfig[] = [
  {
    id: 'l4_trial1_fire_timer',
    label: '🔥 TRIAL 1: THE FIVE FLAMES',
    startX: 800,
    endX: 2160,
    durationSeconds: 18.0,
  },
  {
    id: 'l4_trial2_wind_timer',
    label: '💨 TRIAL 2: THE WIND PASSAGE',
    startX: 2480,
    endX: 3700,
    durationSeconds: 22.0,
  },
];

export const LEVEL_4_CONFIG: LevelConfig = {
  id: 4,
  name: 'Ancient Temple: The Four Trials',
  subtitle: 'The Five Flames, Wind Passage, Rotating Machinery & Double High-Jump',
  difficulty: 'EXPERT',
  badgeColor: '#f59e0b',
  themeColor: '#b45309',
  description:
    'Venture into the ancient stone temple and conquer the Four Trials: dodge the five sequential flame traps, traverse the narrow wind passage over the abyss, navigate rotating machinery, and master the double high-jump catapults!',
  platforms: LEVEL_4_PLATFORMS,
  coins: LEVEL_4_COINS,
  keys: LEVEL_4_KEYS,
  challengeTimers: LEVEL_4_CHALLENGE_TIMERS,
  worldWidth: 7600,
  worldHeight: 2400,
  initialBallX: 180,
  initialBallY: 1870,
  theme: 'ancient_temple',
  starThresholds: {
    threeStarTimeSeconds: 120,
    threeStarMaxDeaths: 1,
    twoStarTimeSeconds: 200,
    twoStarMaxDeaths: 3,
  },
};
