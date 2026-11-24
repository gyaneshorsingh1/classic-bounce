import { GAME_LEVELS, getLevelData } from '../src/game/levels';
import { LEVEL_5_CONFIG } from '../src/game/levels/level5';
import { PhysicsWorld } from '../src/game/physics';
import { SaveManager, saveManager } from '../src/services/SaveManager';

// Custom in-memory storage mock for SaveManager
class MockStorage {
  private store = new Map<string, string>();
  async getItem(key: string): Promise<string | null> {
    return this.store.get(key) ?? null;
  }
  async setItem(key: string, value: string): Promise<void> {
    this.store.set(key, value);
  }
  async removeItem(key: string): Promise<void> {
    this.store.delete(key);
  }
  async clear(): Promise<void> {
    this.store.clear();
  }
}

function assert(condition: boolean, msg: string) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${msg}`);
    throw new Error(msg);
  }
  console.log(`✅ PASSED: ${msg}`);
}

console.log('================================================================');
console.log('☁️ VERIFY LEVEL 5: SKY KINGDOM (END-TO-END SUITE)');
console.log('================================================================\n');

// -----------------------------------------------------------------------------
// Test 1: Configuration, Dimensions, Theme & Structure
// -----------------------------------------------------------------------------
console.log('--- Test 1: Configuration, Dimensions & Theme ---');
const level5 = getLevelData(5);
assert(level5.id === 5, 'Level 5 has ID 5');
assert(level5.worldWidth === 10400, 'Level 5 worldWidth is 10,400px');
assert(level5.worldHeight === 3200, 'Level 5 worldHeight is 3,200px');
assert(level5.theme === 'sky_kingdom', 'Level 5 theme is sky_kingdom');
assert(level5.initialBallX === 180 && level5.initialBallY === 2800, 'Spawn point is (180, 2800)');
assert(level5.starThresholds?.threeStarTimeSeconds === 220, '3-Star threshold is 220s');

const pIds = level5.platforms.map((p) => p.id);
const kIds = level5.keys?.map((k) => k.id) || [];

// Check all 7 sections are present
assert(pIds.includes('l5_sec1_island_spawn') && pIds.includes('l5_checkpoint_1'), 'Section 1 (Cloud Valley) present');
assert(pIds.includes('l5_sec2_wind_updraft') && pIds.includes('l5_sec2_wind_headwind'), 'Section 2 (Wind Tunnels) present');
assert(pIds.includes('l5_sec3_cloud_move1') && pIds.includes('l5_sec3_cloud_crumb1'), 'Section 3 (Floating Island Challenge) present');
assert(pIds.includes('l5_sec4_plate_heavy') && pIds.includes('l5_door_sky'), 'Section 4 (Sky Temple) present');
assert(pIds.includes('l5_sec5_timed_door_1') && pIds.includes('l5_checkpoint_4'), 'Section 5 (Storm Passage) present');
assert(pIds.includes('l5_sec6_wind_summit') && pIds.includes('l5_sec6_crystal_wall'), 'Section 6 (Highest Summit) present');
assert(pIds.includes('l5_sec7_altar') && pIds.includes('l5_golden_exit'), 'Section 7 (Sky Kingdom Finale) present');

// Coins & Keys check
assert(level5.coins !== undefined && level5.coins.length === 28, `Level 5 has exactly 28 coins (found: ${level5.coins?.length})`);
assert(kIds.includes('l5_key_zephyr'), 'Zephyr Key present');

// -----------------------------------------------------------------------------
// Test 2: Section 1 — Cloud Valley Spawning & Checkpoint 1
// -----------------------------------------------------------------------------
console.log('\n--- Test 2: Section 1 Cloud Valley Spawning & Checkpoint 1 ---');
{
  const world = new PhysicsWorld(
    level5.platforms,
    level5.worldWidth,
    level5.worldHeight,
    level5.initialBallX,
    level5.initialBallY,
    level5.coins,
    undefined,
    level5.keys
  );

  // Let ball settle on spawn platform
  for (let i = 0; i < 40; i++) world.step(16.667, { left: false, right: false, jump: false });
  const b = world.getBallState();
  assert(b.y < 2860 && b.y > 2800, `Ball settles securely on spawn floating island (y = ${b.y.toFixed(1)})`);

  // Navigate to Checkpoint 1
  world.setBallPosition(1450, 2370);
  for (let i = 0; i < 15; i++) world.step(16.667, { left: false, right: false, jump: false });
  const cp = world.getActiveCheckpoint();
  assert(cp !== null && cp.x === 1450, 'Checkpoint 1 successfully activated');
}

// -----------------------------------------------------------------------------
// Test 3: Section 2 — Wind Tunnel Physics: Updraft & Gale Headwind Resistance
// -----------------------------------------------------------------------------
console.log('\n--- Test 3: Section 2 Wind Tunnel Aerodynamics & Form Resistance ---');
{
  const world = new PhysicsWorld(
    level5.platforms,
    level5.worldWidth,
    level5.worldHeight,
    level5.initialBallX,
    level5.initialBallY,
    level5.coins,
    undefined,
    level5.keys
  );

  // 1. Transform to Snow Ball at updraft base
  world.setBallPosition(1720, 2360);
  world.step(16.667, { left: false, right: false, jump: false });
  assert(world.getCurrentForm() === 'snow', 'Transformed to Snow Ball');

  // Place Snow Ball into vertical updraft zone (x: 2020, y: 2200, windForceY: -8.5)
  world.setBallPosition(2020, 2250);
  world.step(16.667, { left: false, right: false, jump: false });
  const snowState = world.getBallState();
  // With windResistance = 1.35 and windForceY = -8.5, vertical velocity should be strongly negative (lifting)
  assert(snowState.vy < -2.0, `Snow Ball propelled upward by vertical updraft (vy = ${snowState.vy.toFixed(2)})`);

  // 2. Gale Headwind Test: Compare Snow Ball vs Stone Ball
  // Test Snow Ball in headwind (windForceX: -7.5) trying to run right
  world.setBallPosition(2650, 2220);
  for (let i = 0; i < 20; i++) {
    world.step(16.667, { left: false, right: true, jump: false });
  }
  const snowInWind = world.getBallState();
  assert(snowInWind.vx < 0, `Snow Ball pushed backward by gale headwind despite pressing right (vx = ${snowInWind.vx.toFixed(2)})`);

  // Transform to Stone Ball
  world.setBallPosition(2300, 2200);
  world.step(16.667, { left: false, right: false, jump: false });
  assert(world.getCurrentForm() === 'stone', 'Transformed to Stone Ball');

  // Stone Ball in headwind running right
  world.setBallPosition(2650, 2220);
  for (let i = 0; i < 20; i++) {
    world.step(16.667, { left: false, right: true, jump: false });
  }
  const stoneInWind = world.getBallState();
  assert(stoneInWind.vx > 0.5, `Stone Ball resists gale headwind and strides forward with ease (vx = ${stoneInWind.vx.toFixed(2)})`);

  // Reach Checkpoint 2
  world.setBallPosition(3050, 2190);
  for (let i = 0; i < 15; i++) world.step(16.667, { left: false, right: false, jump: false });
  const cp2 = world.getActiveCheckpoint();
  assert(cp2 !== null && cp2.x === 3050, 'Checkpoint 2 successfully activated');
}

// -----------------------------------------------------------------------------
// Test 4: Section 3 — Moving Platforms, Crumbling Clouds & Bounce Pad
// -----------------------------------------------------------------------------
console.log('\n--- Test 4: Section 3 Floating Island Challenge Mechanics ---');
{
  const world = new PhysicsWorld(
    level5.platforms,
    level5.worldWidth,
    level5.worldHeight,
    level5.initialBallX,
    level5.initialBallY,
    level5.coins,
    undefined,
    level5.keys
  );

  // Moving platform oscillation test
  const p1Before = world.getPlatforms().find((p) => p.id === 'l5_sec3_cloud_move1');
  const initialX = p1Before?.x ?? 0;
  for (let i = 0; i < 30; i++) world.step(16.667, { left: false, right: false, jump: false });
  const p1After = world.getPlatforms().find((p) => p.id === 'l5_sec3_cloud_move1');
  assert(p1After !== undefined && p1After.x !== initialX, `Moving cloud platform oscillates (x moved from ${initialX} to ${p1After?.x.toFixed(1)})`);

  // Bounce pad launch
  world.setBallPosition(4100, 1930);
  world.step(16.667, { left: false, right: false, jump: false });
  const bounceState = world.getBallState();
  assert(bounceState.vy < -15, `Spring Bounce Pad launches ball with high vertical velocity (vy = ${bounceState.vy.toFixed(2)})`);

  // Crumbling cloud test
  world.setBallPosition(3600, 1968);
  for (let i = 0; i < 45; i++) world.step(16.667, { left: false, right: false, jump: false });
  const crumbPlat = world.getPlatforms().find((p) => p.id === 'l5_sec3_cloud_crumb1');
  assert(crumbPlat?.isCollapsed === true, 'Crumbling cloud collapsed after player grounding');
}

// -----------------------------------------------------------------------------
// Test 5: Section 4 — Sky Temple, Zephyr Key, Heavy Plate, Teleporters & Secret Cloud Wall
// -----------------------------------------------------------------------------
console.log('\n--- Test 5: Section 4 Sky Temple, Zephyr Key & Teleporters ---');
{
  const world = new PhysicsWorld(
    level5.platforms,
    level5.worldWidth,
    level5.worldHeight,
    level5.initialBallX,
    level5.initialBallY,
    level5.coins,
    undefined,
    level5.keys
  );

  // 1. Heavy Plate with Normal Ball vs Stone Ball
  world.setBallPosition(5080, 1620);
  world.step(16.667, { left: false, right: false, jump: false });
  const gateBefore = world.getPlatforms().find((p) => p.id === 'l5_sec4_gate_temple');
  assert(gateBefore?.isOpen !== true, 'Sky temple gate is initially closed');

  // Transform to Stone Ball
  world.setBallPosition(4920, 1620);
  world.step(16.667, { left: false, right: false, jump: false });
  assert(world.getCurrentForm() === 'stone', 'Transformed to Stone Ball');

  // Step on Heavy Pressure Plate with Stone Ball
  world.setBallPosition(5080, 1620);
  for (let i = 0; i < 15; i++) world.step(16.667, { left: false, right: false, jump: false });
  const gateAfter = world.getPlatforms().find((p) => p.id === 'l5_sec4_gate_temple');
  assert(gateAfter?.isOpen === true, 'Heavy pressure plate opened the Sky Temple gate');

  // 2. Smash Secret Cracked Cloud Wall with Stone Ball
  world.setBallPosition(5710, 1620);
  for (let i = 0; i < 15; i++) world.step(16.667, { left: false, right: true, jump: false });
  const crackedWall = world.getPlatforms().find((p) => p.id === 'l5_secret_cloud_wall');
  assert(crackedWall?.isBroken === true, 'Stone Ball smashed the Secret Cracked Cloud Wall');

  // Collect Secret Coin 1 (value: 5)
  world.setBallPosition(5920, 1620);
  world.step(16.667, { left: false, right: false, jump: false });
  const secretCoin = level5.coins?.find((c) => c.id === 'l5_coin_secret_1');
  assert(secretCoin !== undefined && secretCoin.value === 5, 'Secret Cloud Sanctuary coin has value 5');

  // 3. Collect Zephyr Key
  world.setBallPosition(5450, 1350);
  world.step(16.667, { left: false, right: false, jump: false });
  assert(saveManager.isKeyCollected('l5_key_zephyr'), 'Zephyr Key collected');

  // 4. Teleportation from Altar (Teleporter A) to High Spire (Teleporter B)
  world.setBallPosition(5600, 1625);
  world.step(16.667, { left: false, right: false, jump: false });
  const postTeleport = world.getBallState();
  const distToSpire = Math.hypot(postTeleport.x - 5750, postTeleport.y - 1210);
  assert(distToSpire < 60, `Teleported to High Sky Spire (dist = ${distToSpire.toFixed(1)}px)`);

  // 5. Unlock Sky Temple Gate
  world.setBallPosition(5950, 1230);
  for (let i = 0; i < 20; i++) world.step(16.667, { left: false, right: true, jump: false });
  const skyDoor = world.getPlatforms().find((p) => p.id === 'l5_door_sky');
  assert(skyDoor?.isOpen === true, 'Locked Sky Temple Gate opened with Zephyr Key');

  // Checkpoint 3
  world.setBallPosition(6150, 1270);
  for (let i = 0; i < 15; i++) world.step(16.667, { left: false, right: false, jump: false });
  const cp3 = world.getActiveCheckpoint();
  assert(cp3 !== null && cp3.x === 6150, 'Checkpoint 3 successfully activated');
}

// -----------------------------------------------------------------------------
// Test 6: Section 5 — Storm Passage Timed Obstacles & Safe Haven
// -----------------------------------------------------------------------------
console.log('\n--- Test 6: Section 5 Storm Passage Timed Lightning Gates ---');
{
  const world = new PhysicsWorld(
    level5.platforms,
    level5.worldWidth,
    level5.worldHeight,
    level5.initialBallX,
    level5.initialBallY,
    level5.coins,
    undefined,
    level5.keys
  );

  const door1Initial = world.getPlatforms().find((p) => p.id === 'l5_sec5_timed_door_1');
  const wasInitiallyOpen = door1Initial?.isOpen ?? false;

  // Advance time by 100 frames (~1.67s > 1.5s openDuration) to observe closed state
  for (let i = 0; i < 100; i++) world.step(16.667, { left: false, right: false, jump: false });
  const door1Later = world.getPlatforms().find((p) => p.id === 'l5_sec5_timed_door_1');
  assert(wasInitiallyOpen === true, 'Timed Lightning Gate 1 is initially open');
  assert(door1Later?.isOpen === false, 'Timed Lightning Gate 1 closes following open duration window');

  // Checkpoint 4
  world.setBallPosition(7500, 1170);
  for (let i = 0; i < 15; i++) world.step(16.667, { left: false, right: false, jump: false });
  const cp4 = world.getActiveCheckpoint();
  assert(cp4 !== null && cp4.x === 7500, 'Checkpoint 4 successfully activated in Safe Haven');
}

// -----------------------------------------------------------------------------
// Test 7: Section 6 — Highest Summit Ascent & Cracked Crystal Wall
// -----------------------------------------------------------------------------
console.log('\n--- Test 7: Section 6 Highest Summit Vertical Updraft & Crystal Wall ---');
{
  const world = new PhysicsWorld(
    level5.platforms,
    level5.worldWidth,
    level5.worldHeight,
    level5.initialBallX,
    level5.initialBallY,
    level5.coins,
    undefined,
    level5.keys
  );

  // Snow Ball in Summit Updraft
  world.setBallPosition(7850, 1160);
  world.step(16.667, { left: false, right: false, jump: false });
  assert(world.getCurrentForm() === 'snow', 'Transformed to Snow Ball for summit updraft');

  world.setBallPosition(8050, 1100);
  world.step(16.667, { left: false, right: false, jump: false });
  const summitDraft = world.getBallState();
  assert(summitDraft.vy < -3.0, `Summit updraft propels Snow Ball toward mountain peak (vy = ${summitDraft.vy.toFixed(2)})`);

  // Stone Ball smashes cracked crystal wall
  world.setBallPosition(8250, 590);
  world.step(16.667, { left: false, right: false, jump: false });
  assert(world.getCurrentForm() === 'stone', 'Transformed to Stone Ball for crystal barrier');

  world.setBallPosition(8410, 580);
  for (let i = 0; i < 15; i++) world.step(16.667, { left: false, right: true, jump: false });
  const crystalWall = world.getPlatforms().find((p) => p.id === 'l5_sec6_crystal_wall');
  assert(crystalWall?.isBroken === true, 'Stone Ball smashed through the Highest Summit Crystal Wall');

  // Checkpoint 5
  world.setBallPosition(8850, 600);
  for (let i = 0; i < 15; i++) world.step(16.667, { left: false, right: false, jump: false });
  const cp5 = world.getActiveCheckpoint();
  assert(cp5 !== null && cp5.x === 8850, 'Checkpoint 5 successfully activated at Summit Peak');
}

// -----------------------------------------------------------------------------
// Test 8: Section 7 — Sky Kingdom Finale & Golden Exit Ring
// -----------------------------------------------------------------------------
console.log('\n--- Test 8: Section 7 Sky Kingdom Finale & Golden Exit Ring ---');
{
  const world = new PhysicsWorld(
    level5.platforms,
    level5.worldWidth,
    level5.worldHeight,
    level5.initialBallX,
    level5.initialBallY,
    level5.coins,
    undefined,
    level5.keys
  );

  assert(!world.getIsLevelComplete(), 'Level is not complete initially');

  // Reach Golden Grand Altar and Golden Exit Ring
  world.setBallPosition(10250, 550);
  world.step(16.667, { left: false, right: false, jump: false });
  assert(world.getIsLevelComplete(), 'Touching Golden Exit Ring completes Level 5!');
}

// -----------------------------------------------------------------------------
// Test 9: Checkpoints, Form Preservation & Life System
// -----------------------------------------------------------------------------
console.log('\n--- Test 9: Checkpoints, Form Preservation & Life System ---');
{
  const freshLvl = getLevelData(5);
  const world = new PhysicsWorld(
    freshLvl.platforms,
    freshLvl.worldWidth,
    freshLvl.worldHeight,
    freshLvl.initialBallX,
    freshLvl.initialBallY,
    freshLvl.coins,
    undefined,
    freshLvl.keys
  );

  // Transform into Snow Ball first
  world.setBallPosition(1720, 2360);
  world.step(16.667, { left: false, right: false, jump: false });
  assert(world.getCurrentForm() === 'snow', 'Transformed to Snow Ball');

  // Activate Checkpoint 2 while in Snow Ball form
  world.setBallPosition(3050, 2190);
  for (let i = 0; i < 15; i++) world.step(16.667, { left: false, right: false, jump: false });
  assert(world.getActiveCheckpoint()?.x === 3050, 'Checkpoint 2 activated in Snow Ball form');

  // Simulate falling into sky abyss (drop below world height + 150)
  world.setBallPosition(3500, 3400);
  world.step(16.667, { left: false, right: false, jump: false });

  assert(world.getLives() === 2, 'Lives reduced to 2');
  const respawnState = world.getBallState();
  const distToCp2 = Math.hypot(respawnState.x - 3050, respawnState.y - 2185);
  assert(distToCp2 < 50, `Player respawned at Checkpoint 2 (dist = ${distToCp2.toFixed(1)}px)`);
  assert(world.getCurrentForm() === 'snow', 'Snow Ball form preserved upon checkpoint respawn');

  // Trigger game over
  world.setBallPosition(3500, 3400);
  world.step(16.667, { left: false, right: false, jump: false }); // lives -> 1
  assert(world.getLives() === 1, 'Lives reduced to 1');

  world.setBallPosition(3500, 3400);
  world.step(16.667, { left: false, right: false, jump: false }); // lives -> 0 -> Game Over reset
  assert(world.getLives() === 3, 'Game Over triggers full restart with 3 lives restored');
  const resetState = world.getBallState();
  assert(
    Math.hypot(resetState.x - level5.initialBallX, resetState.y - level5.initialBallY) < 30,
    'Player reset to initial spawn point after losing all 3 lives'
  );
}

// -----------------------------------------------------------------------------
// Test 10: Campaign Completion & SaveManager
// -----------------------------------------------------------------------------
console.log('\n--- Test 10: Campaign Completion & SaveManager ---');
{
  assert(GAME_LEVELS.length === 5, `All 5 levels are registered (count = ${GAME_LEVELS.length})`);

  saveManager.recordLevelCompletion(5, 195, 3).then(() => {
    assert(saveManager.isLevelCompleted(5), 'Level 5 marked completed in SaveManager');
    const rec5 = saveManager.getLevelRecord(5);
    assert(rec5?.bestStars === 3, 'Level 5 earned 3 stars');
    let totalStars = 0;
    for (let i = 1; i <= 5; i++) {
      totalStars += saveManager.getLevelRecord(i)?.bestStars ?? 0;
    }
    assert(totalStars >= 3, `Total campaign stars computed correctly (stars = ${totalStars})`);

    console.log('\n======================================================');
    console.log('🎉 ALL LEVEL 5 SKY KINGDOM TESTS PASSED! 🎉');
    console.log('======================================================\n');
  });
}
