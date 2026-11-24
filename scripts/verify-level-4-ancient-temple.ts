import { getLevelData } from '../src/game/levels';
import { PhysicsWorld } from '../src/game/physics';
import { saveManager } from '../src/services/SaveManager';
import { BALL_FORM_CONFIGS } from '../src/game/ballConfigs';

function assert(condition: boolean, msg: string) {
  if (!condition) {
    console.error(`❌ FAILED: ${msg}`);
    process.exit(1);
  }
  console.log(`✅ PASSED: ${msg}`);
}

const noInput = { left: false, right: false, jump: false };

console.log('================================================================');
console.log('🏛️ VERIFY LEVEL 4: ANCIENT TEMPLE KINGDOM (END-TO-END SUITE)');
console.log('================================================================\n');

// -----------------------------------------------------------------------------
// Test 1: Configuration, Dimensions, Scale & Theme
// -----------------------------------------------------------------------------
console.log('--- Test 1: Configuration, Dimensions & Theme ---');
const level4 = getLevelData(4);
assert(level4.id === 4, 'Level 4 has ID 4');
assert(level4.worldWidth === 9600, 'Level 4 worldWidth is 9,600px');
assert(level4.worldHeight === 2600, 'Level 4 worldHeight is 2,600px');
assert(level4.theme === 'ancient_temple', 'Level 4 theme is ancient_temple');
assert(level4.initialBallX === 180 && level4.initialBallY === 2200, 'Spawn point is (180, 2200)');
assert(level4.starThresholds?.threeStarTimeSeconds === 200, '3-Star threshold is 200s');

const pIds = level4.platforms.map((p) => p.id);
const kIds = (level4.keys ?? []).map((k) => k.id);

// Check all 7 sections
assert(pIds.includes('l4_sec1_ground') && pIds.includes('l4_checkpoint_1'), 'Section 1 (Entrance) present');
assert(pIds.includes('l4_door_entrance'), 'Section 1 locked entrance gate present');
assert(pIds.includes('l4_sec2_trans_stone') && pIds.includes('l4_sec2_plate_heavy'), 'Section 2 (Machinery) present');
assert(pIds.includes('l4_sec3_water') && pIds.includes('l4_checkpoint_2'), 'Section 3 (Underground) present');
assert(pIds.includes('l4_sec4_crack1') && pIds.includes('l4_door_statue'), 'Section 4 (Statue Chamber) present');
assert(pIds.includes('l4_teleport_a') && pIds.includes('l4_secret_treasure_wall'), 'Section 5 (Lost Treasure Room) present');
assert(pIds.includes('l4_sec6_trans_stone') && pIds.includes('l4_door_guardian'), 'Section 6 (Guardian Gate) present');
assert(pIds.includes('l4_sec7_goal_altar') && pIds.includes('l4_golden_exit'), 'Section 7 (Ancient Exit) present');

// Coins & Keys check
assert(level4.coins !== undefined && level4.coins.length === 27, `Level 4 has exactly 27 coins (found: ${level4.coins?.length})`);
assert(kIds.includes('l4_key_sun') && kIds.includes('l4_key_catacomb'), 'Sun Key and Catacomb Key present');

// -----------------------------------------------------------------------------
// Test 2: Section 1 — Jumping Challenge, Sun Key & Locked Temple Gate
// -----------------------------------------------------------------------------
console.log('\n--- Test 2: Section 1 Sun Key Collection & Locked Gate ---');
{
  const world = new PhysicsWorld(
    level4.platforms,
    level4.worldWidth,
    level4.worldHeight,
    level4.initialBallX,
    level4.initialBallY,
    level4.coins,
    undefined,
    level4.keys
  );

  const doorEntrance = world.getPlatforms().find((p) => p.id === 'l4_door_entrance');
  assert(doorEntrance !== undefined && !doorEntrance.isOpen, 'Temple entrance gate is initially locked');

  // Move ball to collect Sun Key (x: 740, y: 1900)
  world.setBallPosition(740, 1900);
  world.step(16.667, noInput);
  assert(saveManager.isKeyCollected('l4_key_sun'), 'Sun Key collected upon contact');

  // Move ball to Temple Gate (x: 1460, y: 2020)
  world.setBallPosition(1460, 2020);
  world.step(16.667, noInput);
  const updatedDoor = world.getPlatforms().find((p) => p.id === 'l4_door_entrance');
  assert(updatedDoor?.isOpen === true, 'Temple entrance gate unlocks and opens with Sun Key');
}

// -----------------------------------------------------------------------------
// Test 3: Section 2 — Stone Ball Transformation & Heavy Pressure Plate
// -----------------------------------------------------------------------------
console.log('\n--- Test 3: Section 2 Stone Ball Transformation & Heavy Pressure Plate ---');
{
  const world = new PhysicsWorld(
    level4.platforms,
    level4.worldWidth,
    level4.worldHeight,
    level4.initialBallX,
    level4.initialBallY
  );

  const machineryGate = world.getPlatforms().find((p) => p.id === 'l4_sec2_gate_machinery');
  assert(machineryGate !== undefined && !machineryGate.isOpen, 'Machinery stone gate is initially closed');

  // Original ball steps on heavy pressure plate at (1850, 2245)
  world.setBallPosition(1850, 2215);
  world.step(16.667, noInput);
  const plateBefore = world.getPlatforms().find((p) => p.id === 'l4_sec2_plate_heavy');
  assert(!plateBefore?.isPressed, 'Original Ball CANNOT activate heavy pressure plate');

  // Transform to Stone Ball at transformer (1600, 2040)
  world.setBallPosition(1600, 2040);
  world.step(16.667, noInput);
  assert(world.getCurrentForm() === 'stone', 'Ball transforms to Stone Ball');

  // Stone Ball steps on heavy pressure plate at (1850, 2245)
  world.setBallPosition(1850, 2215);
  world.step(16.667, noInput);
  const plateAfter = world.getPlatforms().find((p) => p.id === 'l4_sec2_plate_heavy');
  assert(plateAfter?.isPressed === true, 'Stone Ball successfully activates heavy pressure plate');

  const gateAfter = world.getPlatforms().find((p) => p.id === 'l4_sec2_gate_machinery');
  assert(gateAfter?.isOpen === true, 'Machinery stone gate lowers/opens when plate is pressed');
}

// -----------------------------------------------------------------------------
// Test 4: Section 3 — Catacomb Water Buoyancy & Sunken Catacomb Key
// -----------------------------------------------------------------------------
console.log('\n--- Test 4: Section 3 Catacomb Water Buoyancy & Sunken Catacomb Key ---');
{
  const world = new PhysicsWorld(
    level4.platforms,
    level4.worldWidth,
    level4.worldHeight,
    level4.initialBallX,
    level4.initialBallY,
    level4.coins,
    undefined,
    level4.keys
  );

  // Ball enters water zone (x: 3700, y: 2380) as Stone Ball
  world.setBallForm('stone');
  world.setBallPosition(3550, 2300);
  for (let i = 0; i < 60; i++) {
    world.step(16.667, noInput);
  }
  const snap = world.getBallState();
  assert(snap.isInWater === true, 'Ball is in catacomb water canal');
  assert(snap.y > 2450, `Stone Ball sinks rapidly toward seabed (y = ${snap.y.toFixed(1)})`);

  // Move to seabed and collect Catacomb Key (3550, 2530)
  world.setBallPosition(3550, 2530);
  world.step(16.667, noInput);
  assert(saveManager.isKeyCollected('l4_key_catacomb'), 'Sunken Catacomb Key collected on seabed');

  // Submerged plate at (3850, 2550)
  world.setBallPosition(3850, 2525);
  world.step(16.667, noInput);
  const drainGate = world.getPlatforms().find((p) => p.id === 'l4_sec3_drain_gate');
  assert(drainGate?.isOpen === true, 'Submerged heavy plate opens underwater drain gate');

  // Transform to Red Ball at seabed transformer (3980, 2520) to swim up
  world.setBallPosition(3980, 2520);
  world.step(16.667, noInput);
  assert(world.getCurrentForm() === 'original', 'Transformed to Red Ball on seabed to allow swimming');

  // Test Big Ball high water surface breach jump
  world.setBallForm('big');
  world.setBallPosition(3700, 2215); // At water surface
  world.step(16.667, { left: false, right: false, jump: true });
  const vyBig = world.getBallState().vy;
  assert(vyBig < -10, `Big Ball achieves strong vertical breach velocity (vy = ${vyBig.toFixed(2)})`);

  // Unlock Catacomb Door (4320, 2090) with Catacomb Key
  world.setBallPosition(4320, 2090);
  world.step(16.667, noInput);
  const catacombDoor = world.getPlatforms().find((p) => p.id === 'l4_door_catacomb');
  assert(catacombDoor?.isOpen === true, 'Catacomb door unlocks with Catacomb Key');
}

// -----------------------------------------------------------------------------
// Test 5: Section 4 — Statue Chamber Breakable Walls & Multi-Switch Puzzle
// -----------------------------------------------------------------------------
console.log('\n--- Test 5: Section 4 Cracked Walls & Multi-Switch Puzzle ---');
{
  const world = new PhysicsWorld(
    level4.platforms,
    level4.worldWidth,
    level4.worldHeight,
    level4.initialBallX,
    level4.initialBallY
  );

  // Original Ball hits cracked wall (5250, 2220)
  world.setBallForm('original');
  world.setBallPosition(5240, 2220);
  world.step(16.667, noInput);
  const crackBefore = world.getPlatforms().find((p) => p.id === 'l4_sec4_crack1');
  assert(!crackBefore?.isBroken, 'Original ball cannot break cracked stone wall');

  // Stone Ball hits cracked wall
  world.setBallForm('stone');
  world.setBallPosition(5240, 2220);
  world.step(16.667, noInput);
  const crackAfter = world.getPlatforms().find((p) => p.id === 'l4_sec4_crack1');
  assert(crackAfter?.isBroken === true, 'Stone Ball smashes cracked stone wall');

  // Multi-Switch Statue Gate requires both plate (5000, 2245) and upper switch (5180, 1960)
  const statueDoor = world.getPlatforms().find((p) => p.id === 'l4_door_statue');
  assert(statueDoor !== undefined && !statueDoor.isOpen, 'Statue door is initially locked');

  // Trigger only the floor plate
  world.setBallPosition(5000, 2215);
  world.step(16.667, noInput);
  const doorHalf = world.getPlatforms().find((p) => p.id === 'l4_door_statue');
  assert(!doorHalf?.isOpen, 'Statue door remains locked when only 1 of 2 switches is triggered');

  // Trigger the upper wall switch
  world.setBallPosition(5180, 1960);
  world.step(16.667, noInput);
  const doorFull = world.getPlatforms().find((p) => p.id === 'l4_door_statue');
  assert(doorFull?.isOpen === true, 'Statue door unlocks when BOTH switches are activated');
}

// -----------------------------------------------------------------------------
// Test 6: Section 5 — Secret Passage, Bonus Coins & Teleporter Pair
// -----------------------------------------------------------------------------
console.log('\n--- Test 6: Section 5 Secret Room & Teleporters ---');
{
  const world = new PhysicsWorld(
    level4.platforms,
    level4.worldWidth,
    level4.worldHeight,
    level4.initialBallX,
    level4.initialBallY,
    level4.coins
  );

  // Reveal secret passage at (6250, 1400)
  const secretWall = world.getPlatforms().find((p) => p.id === 'l4_secret_treasure_wall');
  assert(secretWall !== undefined && !secretWall.isRevealed, 'Secret passage is initially hidden');

  world.setBallPosition(6250, 1400);
  world.step(16.667, noInput);
  assert(secretWall?.isRevealed === true, 'Secret passage revealed upon player discovery');

  // Verify secret bonus coins have value 5
  const secretCoins = (level4.coins ?? []).filter((c) => c.id.startsWith('l4_coin_secret_'));
  assert(secretCoins.length === 3, 'Found 3 secret treasure coins');
  assert(secretCoins.every((c) => c.value === 5), 'All secret treasure coins have value 5');

  // Teleporter A (6020, 1940) -> Teleporter B (6950, 1620)
  world.setBallPosition(6020, 1940);
  world.step(16.667, noInput);
  const snap = world.getBallState();
  const distToDest = Math.hypot(snap.x - 6950, snap.y - 1620);
  assert(distToDest < 20, `Player warped across crevasse to Teleporter B (dist = ${distToDest.toFixed(1)}px)`);
}

// -----------------------------------------------------------------------------
// Test 7: Section 6 — Master Guardian Multi-Form Trial
// -----------------------------------------------------------------------------
console.log('\n--- Test 7: Section 6 Temple Guardian Gate Multi-Form Trial ---');
{
  const world = new PhysicsWorld(
    level4.platforms,
    level4.worldWidth,
    level4.worldHeight,
    level4.initialBallX,
    level4.initialBallY
  );

  const guardianDoor = world.getPlatforms().find((p) => p.id === 'l4_door_guardian');
  assert(guardianDoor !== undefined && !guardianDoor.isOpen, 'Temple Guardian gate is initially locked');

  // 1. Stone Ball smashes cracked barrier (7580, 1500) and hits Guardian Plate (7720, 1525)
  world.setBallForm('stone');
  world.setBallPosition(7580, 1500);
  world.step(16.667, noInput);
  world.setBallPosition(7720, 1495);
  world.step(16.667, noInput);

  const plateGuardian = world.getPlatforms().find((p) => p.id === 'l4_sec6_plate_guardian');
  assert(plateGuardian?.isPressed === true, 'Guardian Plate activated by Stone Ball');

  // 2. Snow Ball enters narrow conduit (height 40px between floor 1540 and ceil 1470)
  world.setBallForm('snow');
  assert(BALL_FORM_CONFIGS.snow.radius === 16, 'Snow Ball radius is 16px (fits in 40px conduit)');
  world.setBallPosition(8180, 1505);
  world.step(16.667, noInput);

  const catacombSwitch = world.getPlatforms().find((p) => p.id === 'l4_sec6_switch_catacomb');
  assert(catacombSwitch?.isActivated === true, 'Catacomb switch activated inside narrow conduit');

  // Verify Guardian Gate is now open!
  const guardianDoorAfter = world.getPlatforms().find((p) => p.id === 'l4_door_guardian');
  assert(guardianDoorAfter?.isOpen === true, 'Temple Guardian Gate unsealed after completing multi-form puzzle');
}

// -----------------------------------------------------------------------------
// Test 8: Section 7 — Golden Exit Ring & Level Completion
// -----------------------------------------------------------------------------
console.log('\n--- Test 8: Section 7 Golden Exit Ring & Level Completion ---');
{
  const world = new PhysicsWorld(
    level4.platforms,
    level4.worldWidth,
    level4.worldHeight,
    level4.initialBallX,
    level4.initialBallY
  );

  assert(!world.getIsLevelComplete(), 'Level is not complete initially');
  // Teleport to Golden Exit Ring (9480, 800)
  world.setBallPosition(9480, 800);
  world.step(16.667, noInput);
  assert(world.getIsLevelComplete(), 'Touching Golden Exit Ring completes Level 4!');
}

// -----------------------------------------------------------------------------
// Test 9: Checkpoints, Form Preservation & Life System
// -----------------------------------------------------------------------------
console.log('\n--- Test 9: Checkpoints, Form Preservation & Life System ---');
{
  const world = new PhysicsWorld(
    level4.platforms,
    level4.worldWidth,
    level4.worldHeight,
    level4.initialBallX,
    level4.initialBallY
  );

  // Activate Checkpoint 2 (3150, 2145) with Stone Ball form
  world.setBallForm('stone');
  world.setBallPosition(3150, 2145);
  world.step(16.667, noInput);

  const cp2 = world.getPlatforms().find((p) => p.id === 'l4_checkpoint_2');
  assert(cp2?.isActivated === true, 'Checkpoint 2 activated');

  // Trigger single death
  world.triggerDeath();
  assert(world.getLives() === 2, 'Lives reduced to 2');
  const respawnSnap = world.getBallState();
  assert(Math.hypot(respawnSnap.x - 3150, respawnSnap.y - 2145) < 30, 'Player respawned at Checkpoint 2');
  assert(world.getCurrentForm() === 'stone', 'Stone Ball form preserved upon checkpoint respawn');

  // Trigger 2 more deaths (Game Over -> Level Restart)
  world.triggerDeath();
  assert(world.getLives() === 1, 'Lives reduced to 1');
  world.triggerDeath();
  assert(world.getLives() === 3, 'Game Over triggers full restart with 3 lives restored');
  assert(
    Math.hypot(world.getBallState().x - level4.initialBallX, world.getBallState().y - level4.initialBallY) < 30,
    'Player reset to initial level spawn point after losing all 3 lives'
  );
}

// -----------------------------------------------------------------------------
// Test 10: Progression Unlock & Next Level
// -----------------------------------------------------------------------------
console.log('\n--- Test 10: Progression Unlock & SaveManager ---');
{
  saveManager.recordLevelCompletion(4, 150, 3).then((res) => {
    assert(saveManager.isLevelCompleted(4), 'Level 4 marked completed in SaveManager');
    assert(saveManager.isLevelUnlocked(5), 'Level 5 unlocked automatically upon Level 4 completion');
    console.log('\n======================================================');
    console.log('🎉 ALL LEVEL 4 ANCIENT TEMPLE KINGDOM TESTS PASSED! 🎉');
    console.log('======================================================');
  });
}
