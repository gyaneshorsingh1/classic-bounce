import { PlatformData, KeyData, CoinData } from '../../types/game';
import { LevelConfig } from '../levels';

// =============================================================================
// LEVEL 5: Sky Kingdom (Expansive 10400x3200 Floating Realm)
// Floating Islands, Cloud Platforms, Gale Wind Tunnels & Updrafts, Disappearing Clouds,
// Sky Temple Sanctuary, Storm Passages, Highest Summit, and Grand Sky Finale
// =============================================================================

export const LEVEL_5_PLATFORMS: PlatformData[] = [
  // --- Boundary Walls (Enclosing 10,400 x 3,200 Sky Realm) ---
  { id: 'l5_wall_left', x: -20, y: 1600, width: 40, height: 3800, type: 'wall' },
  { id: 'l5_wall_right', x: 10420, y: 1600, width: 40, height: 3800, type: 'wall' },
  { id: 'l5_ceiling', x: 5200, y: -30, width: 11000, height: 60, type: 'wall' },

  // ===========================================================================
  // SECTION 1: Cloud Valley (x: 0 - 1600, y: 2400 -> 3000)
  // Floating islands, introductory cloud platforms, vertical ascending camera
  // ===========================================================================
  // Spawn Isle
  { id: 'l5_sec1_island_spawn', x: 200, y: 2860, width: 340, height: 50, type: 'ground' },

  // Ascending Cloud Steps
  { id: 'l5_sec1_cloud_1', x: 450, y: 2750, width: 150, height: 28, type: 'floating' },
  { id: 'l5_sec1_cloud_2', x: 720, y: 2620, width: 160, height: 28, type: 'floating' },
  { id: 'l5_sec1_cloud_3', x: 1000, y: 2500, width: 160, height: 28, type: 'floating' },

  // Cloud Valley High Ridge
  { id: 'l5_sec1_bridge', x: 1250, y: 2420, width: 220, height: 30, type: 'floating' },

  // CHECKPOINT 1 SANCTUARY ISLE (x: 1450, y: 2420)
  { id: 'l5_sec1_isle_cp1', x: 1450, y: 2420, width: 240, height: 40, type: 'floating' },
  { id: 'l5_checkpoint_1', x: 1450, y: 2365, width: 36, height: 48, type: 'checkpoint' },

  // ===========================================================================
  // SECTION 2: Wind Tunnels (x: 1600 - 3200, y: 1800 -> 2500)
  // Form aerodynamics: Vertical updrafts propel Snow Ball; gale headwinds resist
  // Snow Ball but Stone Ball strides through with 0.06 wind resistance
  // ===========================================================================
  // Entrance Isle
  { id: 'l5_sec2_isle_start', x: 1720, y: 2420, width: 220, height: 36, type: 'floating' },
  // Snow Ball Transformer (enables ball to catch vertical updraft)
  { id: 'l5_sec2_trans_snow', x: 1720, y: 2360, width: 44, height: 44, type: 'transformer_snow' },

  // Vertical Updraft Base
  { id: 'l5_sec2_isle_updraft', x: 2020, y: 2450, width: 260, height: 36, type: 'floating' },
  // Vertical Updraft Wind Tunnel (launches Snow Ball upward to high ridge)
  {
    id: 'l5_sec2_wind_updraft',
    x: 2020,
    y: 2200,
    width: 220,
    height: 420,
    type: 'wind_zone',
    windForceX: 0,
    windForceY: -8.5,
  },
  // High cloud ledge reached via updraft
  { id: 'l5_sec2_cloud_high', x: 2020, y: 1950, width: 180, height: 26, type: 'floating' },

  // Stone Ball Isle (placed after high cloud or lower jump)
  { id: 'l5_sec2_isle_stone', x: 2300, y: 2260, width: 240, height: 36, type: 'floating' },
  // Stone Ball Transformer (enables walking through -7.5 gale headwind)
  { id: 'l5_sec2_trans_stone', x: 2300, y: 2200, width: 44, height: 44, type: 'transformer_stone' },

  // Gale Headwind Bridge (450px long corridor with strong horizontal wind)
  { id: 'l5_sec2_bridge_gale', x: 2650, y: 2260, width: 460, height: 36, type: 'floating' },
  {
    id: 'l5_sec2_wind_headwind',
    x: 2650,
    y: 2210,
    width: 450,
    height: 180,
    type: 'wind_zone',
    windForceX: -7.5,
    windForceY: 0,
  },

  // Post-wind Haven Isle
  { id: 'l5_sec2_isle_end', x: 3000, y: 2240, width: 260, height: 36, type: 'floating' },
  // Original Ball Transformer
  { id: 'l5_sec2_trans_normal', x: 2950, y: 2180, width: 44, height: 44, type: 'transformer_original' },

  // CHECKPOINT 2 SANCTUARY (x: 3050, y: 2185)
  { id: 'l5_checkpoint_2', x: 3050, y: 2185, width: 36, height: 48, type: 'checkpoint' },

  // ===========================================================================
  // SECTION 3: Floating Island Challenge (x: 3200 - 4800, y: 1500 -> 2200)
  // Moving cloud platforms, crumbling/disappearing platforms, and bounce pads
  // ===========================================================================
  // Horizontal Moving Cloud Platform
  {
    id: 'l5_sec3_cloud_move1',
    x: 3350,
    y: 2100,
    width: 140,
    height: 26,
    type: 'moving',
    moveRangeX: 90,
    moveSpeed: 2.2,
  },
  // Disappearing/Crumbling Cloud Platform 1
  {
    id: 'l5_sec3_cloud_crumb1',
    x: 3600,
    y: 2000,
    width: 130,
    height: 24,
    type: 'crumbling',
  },
  // Vertical Moving Cloud Platform
  {
    id: 'l5_sec3_cloud_vert',
    x: 3850,
    y: 1900,
    width: 140,
    height: 26,
    type: 'moving',
    moveRangeY: 85,
    moveSpeed: 1.9,
  },
  // Spring Bounce Pad (launches across wide sky chasm)
  {
    id: 'l5_sec3_bounce_spring',
    x: 4100,
    y: 1950,
    width: 90,
    height: 20,
    type: 'bounce_pad',
    launchForceY: -22.5,
  },
  // Disappearing/Crumbling Cloud Platform 2
  {
    id: 'l5_sec3_cloud_crumb2',
    x: 4350,
    y: 1720,
    width: 130,
    height: 24,
    type: 'crumbling',
  },
  // High Floating Island Terrace
  { id: 'l5_sec3_isle_terrace', x: 4620, y: 1680, width: 280, height: 36, type: 'floating' },

  // ===========================================================================
  // SECTION 4: Sky Temple (x: 4800 - 6400, y: 1100 -> 1800)
  // Temple colonnades, Stone Ball Heavy Pressure Plate, Zephyr Key,
  // Linked Teleporters, Cracked Cloud Wall secret, and locked Sky Temple Gate
  // ===========================================================================
  // Sky Temple Portico
  { id: 'l5_sec4_portico', x: 4950, y: 1680, width: 280, height: 36, type: 'floating' },
  // Stone Ball Transformer
  { id: 'l5_sec4_trans_stone', x: 4920, y: 1620, width: 44, height: 44, type: 'transformer_stone' },

  // Heavy Pressure Plate (activates lower temple gate)
  {
    id: 'l5_sec4_plate_heavy',
    x: 5080,
    y: 1650,
    width: 64,
    height: 20,
    type: 'heavy_pressure_plate',
    isLatched: true,
    linkedDoorId: 'l5_sec4_gate_temple',
  },
  // Stone Temple Gate
  {
    id: 'l5_sec4_gate_temple',
    x: 5220,
    y: 1560,
    width: 36,
    height: 180,
    type: 'stone_gate',
  },

  // Central Temple Isle
  { id: 'l5_sec4_isle_central', x: 5450, y: 1680, width: 320, height: 36, type: 'floating' },
  // Pillar holding the Zephyr Key
  { id: 'l5_sec4_pillar_key', x: 5450, y: 1420, width: 130, height: 28, type: 'floating' },

  // Teleporter A (Sky Altar Portal -> teleports to High Sky Spire)
  {
    id: 'l5_teleport_a',
    x: 5600,
    y: 1625,
    width: 44,
    height: 60,
    type: 'teleporter',
    targetTeleporterId: 'l5_teleport_b',
  },

  // Secret Passage: Cracked Cloud Wall
  {
    id: 'l5_secret_cloud_wall',
    x: 5750,
    y: 1620,
    width: 34,
    height: 120,
    type: 'cracked_wall',
  },
  // Hidden Cloud Sanctuary Floor
  { id: 'l5_sec4_secret_floor', x: 5920, y: 1680, width: 200, height: 30, type: 'floating' },

  // Teleporter B (High Sky Spire)
  {
    id: 'l5_teleport_b',
    x: 5750,
    y: 1225,
    width: 44,
    height: 60,
    type: 'teleporter',
    targetTeleporterId: 'l5_teleport_a',
  },
  // Original Ball Transformer (returns ball to agile form for high jumping)
  { id: 'l5_sec4_trans_normal', x: 5840, y: 1220, width: 44, height: 44, type: 'transformer_original' },
  // High Spire Floor
  { id: 'l5_sec4_spire_floor', x: 5800, y: 1280, width: 220, height: 30, type: 'floating' },

  // Locked Sky Temple Gate (requires Zephyr Key)
  {
    id: 'l5_door_sky',
    x: 5970,
    y: 1230,
    width: 36,
    height: 170,
    type: 'locked_door',
    requiredKeyId: 'zephyr_key',
    keyColor: '#38bdf8',
  },

  // Outer Temple Terrace
  { id: 'l5_sec4_terrace_out', x: 6150, y: 1320, width: 260, height: 36, type: 'floating' },
  // CHECKPOINT 3 SANCTUARY (x: 6150, y: 1265)
  { id: 'l5_checkpoint_3', x: 6150, y: 1265, width: 36, height: 48, type: 'checkpoint' },

  // ===========================================================================
  // SECTION 5: Storm Passage (x: 6400 - 7800, y: 800 -> 1500)
  // Timed lightning doors with predictable cadences, oscillating storm hazards,
  // and rotating lightning blades
  // ===========================================================================
  { id: 'l5_sec5_isle_1', x: 6450, y: 1320, width: 240, height: 36, type: 'floating' },

  // Timed Lightning Gate 1 (2.8s cycle, 1.5s open window)
  {
    id: 'l5_sec5_timed_door_1',
    x: 6650,
    y: 1230,
    width: 34,
    height: 160,
    type: 'timed_door',
    cyclePeriod: 2.8,
    openDuration: 1.5,
    cycleOffset: 0,
  },

  // Storm Intermediate Isle
  { id: 'l5_sec5_isle_mid', x: 6850, y: 1320, width: 260, height: 36, type: 'floating' },
  // Moving storm spark hazard
  {
    id: 'l5_sec5_moving_spike',
    x: 6850,
    y: 1270,
    width: 34,
    height: 34,
    type: 'spike',
    moveRangeX: 65,
    moveSpeed: 1.8,
  },

  // Timed Lightning Gate 2 (alternating offset 1.4s)
  {
    id: 'l5_sec5_timed_door_2',
    x: 7050,
    y: 1230,
    width: 34,
    height: 160,
    type: 'timed_door',
    cyclePeriod: 2.8,
    openDuration: 1.5,
    cycleOffset: 1.4,
  },

  // Rotating lightning storm blade
  {
    id: 'l5_sec5_rot_blade',
    x: 7250,
    y: 1150,
    width: 32,
    height: 32,
    type: 'rotating_spikes',
    armLength: 70,
    spikeCount: 3,
    angularSpeed: 1.8,
  },

  // Safe Haven Isle after Storm
  { id: 'l5_sec5_isle_safe', x: 7500, y: 1220, width: 280, height: 36, type: 'floating' },
  // CHECKPOINT 4 SANCTUARY (x: 7500, y: 1165)
  { id: 'l5_checkpoint_4', x: 7500, y: 1165, width: 36, height: 48, type: 'checkpoint' },

  // ===========================================================================
  // SECTION 6: Highest Summit (x: 7800 - 9200, y: 350 -> 1200)
  // Summit ascent: Snow Ball rides vertical updraft shaft, Stone Ball breaks
  // massive cracked crystal barrier to access the highest mountain peak
  // ===========================================================================
  // Summit Base Isle
  { id: 'l5_sec6_isle_base', x: 7850, y: 1220, width: 240, height: 36, type: 'floating' },
  // Snow Ball Transformer
  { id: 'l5_sec6_trans_snow', x: 7850, y: 1160, width: 44, height: 44, type: 'transformer_snow' },

  // Summit Great Updraft Wind Shaft (carries Snow Ball 500px vertically upward)
  {
    id: 'l5_sec6_wind_summit',
    x: 8050,
    y: 880,
    width: 220,
    height: 550,
    type: 'wind_zone',
    windForceX: 0,
    windForceY: -9.0,
  },

  // Summit Mid-Tier Terrace
  { id: 'l5_sec6_isle_mid', x: 8250, y: 650, width: 260, height: 36, type: 'floating' },
  // Stone Ball Transformer
  { id: 'l5_sec6_trans_stone', x: 8250, y: 590, width: 44, height: 44, type: 'transformer_stone' },

  // Massive Cracked Crystal Barrier
  {
    id: 'l5_sec6_crystal_wall',
    x: 8450,
    y: 580,
    width: 36,
    height: 140,
    type: 'cracked_wall',
  },

  // Secret Summit Nook (underneath mid terrace)
  { id: 'l5_sec6_secret_floor', x: 8350, y: 880, width: 160, height: 26, type: 'floating' },

  // Post-barrier Summit Ridge
  { id: 'l5_sec6_isle_ridge', x: 8650, y: 650, width: 240, height: 36, type: 'floating' },
  // Original Ball Transformer
  { id: 'l5_sec6_trans_normal', x: 8600, y: 590, width: 44, height: 44, type: 'transformer_original' },

  // Highest Summit Peak Isle
  { id: 'l5_sec6_peak', x: 8850, y: 650, width: 260, height: 36, type: 'floating' },
  // CHECKPOINT 5 SANCTUARY (x: 8850, y: 595)
  { id: 'l5_checkpoint_5', x: 8850, y: 595, width: 36, height: 48, type: 'checkpoint' },

  // ===========================================================================
  // SECTION 7: Sky Kingdom Finale (x: 9200 - 10400, y: 200 -> 800)
  // Precision aerial acrobatics: High bounce pads, moving cloud disc,
  // Golden Sky Altar, and the Golden Exit Ring
  // ===========================================================================
  { id: 'l5_sec7_isle_1', x: 9150, y: 650, width: 200, height: 36, type: 'floating' },

  // Bounce Pad across Grand Abyss 1
  {
    id: 'l5_sec7_bounce_1',
    x: 9350,
    y: 680,
    width: 90,
    height: 20,
    type: 'bounce_pad',
    launchForceY: -21.0,
  },

  // Oscillating Cloud Disc
  {
    id: 'l5_sec7_moving_disc',
    x: 9600,
    y: 550,
    width: 140,
    height: 26,
    type: 'moving',
    moveRangeX: 75,
    moveRangeY: 40,
    moveSpeed: 2.0,
  },

  // Final Bounce Pad onto Golden Altar
  {
    id: 'l5_sec7_bounce_2',
    x: 9850,
    y: 620,
    width: 90,
    height: 20,
    type: 'bounce_pad',
    launchForceY: -21.0,
  },

  // Golden Grand Sky Altar
  { id: 'l5_sec7_altar', x: 10150, y: 650, width: 340, height: 48, type: 'floating' },

  // GOLDEN EXIT RING
  {
    id: 'l5_golden_exit',
    x: 10250,
    y: 550,
    width: 48,
    height: 64,
    type: 'exit',
  },
];

// =============================================================================
// LEVEL 5 COINS: 28 Total Coins (26 Standard Coins + 2 Secret Coins value: 5)
// =============================================================================
export const LEVEL_5_COINS: CoinData[] = [
  // Section 1: Cloud Valley (3 coins)
  { id: 'l5_coin_01', x: 450, y: 2680, value: 1 },
  { id: 'l5_coin_02', x: 720, y: 2550, value: 1 },
  { id: 'l5_coin_03', x: 1000, y: 2430, value: 1 },

  // Section 2: Wind Tunnels (4 coins)
  { id: 'l5_coin_04', x: 2020, y: 1880, value: 1 }, // high in vertical updraft
  { id: 'l5_coin_05', x: 2550, y: 2190, value: 1 }, // along headwind bridge
  { id: 'l5_coin_06', x: 2750, y: 2190, value: 1 },
  { id: 'l5_coin_07', x: 2950, y: 2110, value: 1 },

  // Section 3: Floating Island Challenge (4 coins)
  { id: 'l5_coin_08', x: 3350, y: 2030, value: 1 }, // over moving cloud
  { id: 'l5_coin_09', x: 3600, y: 1930, value: 1 }, // over crumbling cloud
  { id: 'l5_coin_10', x: 4100, y: 1750, value: 1 }, // high spring arc
  { id: 'l5_coin_11', x: 4350, y: 1650, value: 1 },

  // Section 4: Sky Temple (4 standard + 1 secret coin of value 5)
  { id: 'l5_coin_12', x: 5080, y: 1580, value: 1 }, // above heavy plate
  { id: 'l5_coin_13', x: 5450, y: 1260, value: 1 }, // near Zephyr Key
  { id: 'l5_coin_14', x: 5750, y: 1150, value: 1 }, // post-teleport spire
  { id: 'l5_coin_15', x: 6150, y: 1200, value: 1 },
  { id: 'l5_coin_secret_1', x: 5920, y: 1620, value: 5 }, // Secret Cloud Sanctuary

  // Section 5: Storm Passage (4 coins)
  { id: 'l5_coin_16', x: 6650, y: 1140, value: 1 }, // beyond timed door 1
  { id: 'l5_coin_17', x: 6850, y: 1180, value: 1 },
  { id: 'l5_coin_18', x: 7050, y: 1140, value: 1 }, // beyond timed door 2
  { id: 'l5_coin_19', x: 7350, y: 1140, value: 1 },

  // Section 6: Highest Summit (4 standard + 1 secret coin of value 5)
  { id: 'l5_coin_20', x: 8050, y: 750, value: 1 }, // high summit updraft
  { id: 'l5_coin_21', x: 8250, y: 520, value: 1 },
  { id: 'l5_coin_22', x: 8500, y: 580, value: 1 }, // behind cracked crystal wall
  { id: 'l5_coin_23', x: 8750, y: 580, value: 1 },
  { id: 'l5_coin_secret_2', x: 8350, y: 820, value: 5 }, // Secret Summit Nook

  // Section 7: Sky Kingdom Finale (3 coins)
  { id: 'l5_coin_24', x: 9350, y: 500, value: 1 }, // high apex bounce 1
  { id: 'l5_coin_25', x: 9600, y: 460, value: 1 }, // over moving disc
  { id: 'l5_coin_26', x: 9850, y: 480, value: 1 }, // high apex bounce 2
];

// =============================================================================
// LEVEL 5 KEYS: Zephyr Key
// =============================================================================
export const LEVEL_5_KEYS: KeyData[] = [
  {
    id: 'l5_key_zephyr',
    keyId: 'zephyr_key',
    x: 5450,
    y: 1350,
    name: 'Zephyr Key',
    color: '#38bdf8',
  },
];

// =============================================================================
// LEVEL 5 CONFIGURATION OBJECT
// =============================================================================
export const LEVEL_5_CONFIG: LevelConfig = {
  id: 5,
  name: 'Sky Kingdom',
  subtitle: 'Floating Islands, Gale Wind Tunnels & Cloud Temples',
  difficulty: 'EXPERT',
  badgeColor: '#38bdf8',
  themeColor: '#0284c7',
  description:
    'Ascend into an epic 10,400px floating sky realm featuring powerful wind tunnels, disappearing cloud steps, ancient sky temples, lightning storm passages, and the Highest Summit!',
  platforms: LEVEL_5_PLATFORMS,
  coins: LEVEL_5_COINS,
  keys: LEVEL_5_KEYS,
  worldWidth: 10400,
  worldHeight: 3200,
  initialBallX: 180,
  initialBallY: 2800,
  theme: 'sky_kingdom',
  starThresholds: {
    threeStarTimeSeconds: 220,
    threeStarMaxDeaths: 1,
    twoStarTimeSeconds: 340,
    twoStarMaxDeaths: 3,
  },
};
