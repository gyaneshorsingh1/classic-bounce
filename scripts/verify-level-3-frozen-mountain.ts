import Matter from 'matter-js';
import { getLevelData } from '../src/game/levels';
import { PhysicsWorld } from '../src/game/physics';
import { InputController } from '../src/controllers/InputController';

function assert(condition: boolean, msg: string) {
  if (!condition) {
    console.error(`❌ FAILED: ${msg}`);
    process.exit(1);
  }
  console.log(`✅ PASSED: ${msg}`);
}

console.log('================================================================');
console.log('🧪 VERIFY LEVEL 3: FROZEN MOUNTAIN KINGDOM (THREE BALL FORMS)');
console.log('================================================================\n');

const level3 = getLevelData(3);

// -----------------------------------------------------------------------------
// Test 1: Map Dimensions, Scope & 8 Connected Sections Integrity
// -----------------------------------------------------------------------------
console.log('--- Test 1: Map Dimensions, Scope & 8 Sections Integrity ---');
{
  console.log(`  Map Dimensions: ${level3.worldWidth} x ${level3.worldHeight}`);
  console.log(`  Theme: ${level3.theme}`);
  console.log(`  Spawn Point: (${level3.initialBallX}, ${level3.initialBallY})`);

  assert(level3.worldWidth === 8800, 'Level 3 worldWidth is 8,800px (largest level)');
  assert(level3.worldHeight === 2600, 'Level 3 worldHeight is 2,600px (deep alpine scale)');
  assert(level3.theme === 'frozen_mountain', 'Level 3 theme is frozen_mountain');
  assert(level3.initialBallX === 160 && level3.initialBallY === 2180, 'Spawn position matches frozen valley floor');

  const pIds = level3.platforms.map((p) => p.id);

  // Section 1: Frozen Valley
  assert(
    pIds.includes('l3_sec1_ground') &&
      pIds.includes('l3_sec1_snow_shelf') &&
      pIds.includes('l3_checkpoint_1'),
    'Section 1 (Frozen Valley & Checkpoint 1) present'
  );

  // Section 2: Stone Gate
  assert(
    pIds.includes('l3_sec2_crack1') &&
      pIds.includes('l3_sec2_plate') &&
      pIds.includes('l3_sec2_gate'),
    'Section 2 (Stone Gate, Cracked Wall & Heavy Pressure Plate) present'
  );

  // Section 3: Icy Slopes
  assert(
    pIds.includes('l3_sec3_ice_slope1') &&
      pIds.includes('l3_sec3_mov_ice') &&
      pIds.includes('l3_checkpoint_2'),
    'Section 3 (Icy Slopes & Checkpoint 2) present'
  );

  // Section 4: Frozen Cave
  assert(
    pIds.includes('l3_sec4_tunnel_ceil') &&
      pIds.includes('l3_sec4_tunnel_floor') &&
      pIds.includes('l3_sec4_crack') &&
      pIds.includes('l3_checkpoint_3'),
    'Section 4 (Frozen Cave, Narrow Snow Tunnel & Checkpoint 3) present'
  );

  // Section 5: Windy Cliffs
  assert(
    pIds.includes('l3_sec5_wind1') &&
      pIds.includes('l3_sec5_mov1') &&
      pIds.includes('l3_sec5_cliff_top'),
    'Section 5 (Windy Cliffs & Gale-Force Wind Zones) present'
  );

  // Section 6: Snowfall Bridge
  assert(
    pIds.includes('l3_sec6_snow1') &&
      pIds.includes('l3_sec6_icicle1') &&
      pIds.includes('l3_sec6_mov_ice') &&
      pIds.includes('l3_checkpoint_4'),
    'Section 6 (Snowfall Bridge, Fragile Snow & Checkpoint 4) present'
  );

  // Section 7: Frozen Lake
  assert(
    pIds.includes('l3_sec7_seabed') &&
      pIds.includes('l3_sec7_water') &&
      pIds.includes('l3_sec7_plate') &&
      pIds.includes('l3_sec7_sub_gate'),
    'Section 7 (Frozen Lake, Seabed Plate & Sunken Gate) present'
  );

  // Section 8: Mountain Summit
  assert(
    pIds.includes('l3_sec8_final_wall') &&
      pIds.includes('l3_sec8_ice_ramp') &&
      pIds.includes('l3_sec8_snow_arch') &&
      pIds.includes('l3_golden_exit'),
    'Section 8 (Mountain Summit & Golden Exit Ring) present'
  );
}

// -----------------------------------------------------------------------------
// Test 2: Three Ball Forms Physical Specs & Body Properties
// -----------------------------------------------------------------------------
console.log('\n--- Test 2: Three Ball Forms Physical Specs & Body Properties ---');
{
  const input = new InputController();
  const physics = new PhysicsWorld(
    level3.platforms,
    level3.worldWidth,
    level3.worldHeight,
    level3.initialBallX,
    level3.initialBallY,
    level3.coins
  );

  // Default Form: Original Ball
  assert(physics.getCurrentForm() === 'original', 'Initial ball form is original');
  const snapOriginal = physics.getBallState();
  assert(snapOriginal.radius === 24, 'Original Ball radius is 24px');
  assert(snapOriginal.form === 'original', 'Ball state form is original');

  // Transform to Stone Ball
  const stoneOk = physics.setBallForm('stone');
  assert(stoneOk, 'setBallForm("stone") succeeded');
  assert(physics.getCurrentForm() === 'stone', 'Current form is stone');
  const snapStone = physics.getBallState();
  assert(snapStone.radius === 25, 'Stone Ball radius is 25px');
  assert(snapStone.form === 'stone', 'Ball state form is stone');
  console.log(`  Stone Ball mass: ${physics.getBallBody().mass.toFixed(2)}`);
  assert(physics.getBallBody().mass > 15.0, 'Stone Ball has heavy mass (> 15.0)');

  // Transform to Snow Ball
  const snowOk = physics.setBallForm('snow');
  assert(snowOk, 'setBallForm("snow") succeeded');
  assert(physics.getCurrentForm() === 'snow', 'Current form is snow');
  const snapSnow = physics.getBallState();
  assert(snapSnow.radius === 16, 'Snow Ball radius is 16px (small & compact)');
  assert(snapSnow.form === 'snow', 'Ball state form is snow');
  console.log(`  Snow Ball mass: ${physics.getBallBody().mass.toFixed(2)}`);
  assert(physics.getBallBody().mass < 3.0, 'Snow Ball has lightweight mass (< 3.0)');

  // Switch back to Original
  physics.setBallForm('original');
  assert(physics.getCurrentForm() === 'original', 'Successfully switched back to original form');
}

// -----------------------------------------------------------------------------
// Test 3: Stone Ball Smashes Cracked Walls
// -----------------------------------------------------------------------------
console.log('\n--- Test 3: Stone Ball Smashes Cracked Walls ---');
{
  const input = new InputController();
  const physics = new PhysicsWorld(
    level3.platforms,
    level3.worldWidth,
    level3.worldHeight,
    level3.initialBallX,
    level3.initialBallY
  );

  const crackedWall = level3.platforms.find((p) => p.id === 'l3_sec2_crack1')!;
  assert(crackedWall !== undefined, 'Cracked wall found in level 3');
  assert(!crackedWall.isBroken, 'Cracked wall starts unbroken');

  // Move Original Ball right against cracked wall
  Matter.Body.setPosition(physics.getBallBody(), {
    x: crackedWall.x - crackedWall.width / 2 - 10,
    y: crackedWall.y,
  });
  input.setRight(true);

  // Step physics with Original Ball
  for (let i = 0; i < 20; i++) {
    physics.step(16, input);
  }
  assert(!crackedWall.isBroken, 'Original Ball CANNOT smash cracked stone wall');

  // Transform into Stone Ball
  physics.setBallForm('stone');
  Matter.Body.setPosition(physics.getBallBody(), {
    x: crackedWall.x - crackedWall.width / 2 - 5,
    y: crackedWall.y,
  });

  // Step physics with Stone Ball
  for (let i = 0; i < 20; i++) {
    physics.step(16, input);
    if (crackedWall.isBroken) break;
  }
  assert(crackedWall.isBroken === true, 'Stone Ball successfully SMASHES cracked stone wall!');
}

// -----------------------------------------------------------------------------
// Test 4: Heavy Pressure Plate & Linked Stone Gate
// -----------------------------------------------------------------------------
console.log('\n--- Test 4: Heavy Pressure Plate & Linked Stone Gate ---');
{
  const input = new InputController();
  const physics = new PhysicsWorld(
    level3.platforms,
    level3.worldWidth,
    level3.worldHeight,
    level3.initialBallX,
    level3.initialBallY
  );

  const plate = level3.platforms.find((p) => p.id === 'l3_sec2_plate')!;
  const gate = level3.platforms.find((p) => p.id === 'l3_sec2_gate')!;
  assert(plate !== undefined && gate !== undefined, 'Plate and gate exist');
  assert(!plate.isPressed, 'Plate starts unpressed');
  assert(!gate.isOpen, 'Gate starts closed');

  // 1. Original ball stands on plate
  physics.setBallForm('original');
  Matter.Body.setPosition(physics.getBallBody(), {
    x: plate.x,
    y: plate.y - 20,
  });
  Matter.Body.setVelocity(physics.getBallBody(), { x: 0, y: 0 });

  for (let i = 0; i < 15; i++) {
    physics.step(16, input);
  }
  assert(!plate.isPressed, 'Original Ball is too light to press heavy pressure plate');
  assert(!gate.isOpen, 'Linked Stone Gate remains locked');

  // 2. Stone Ball stands on plate
  physics.setBallForm('stone');
  Matter.Body.setPosition(physics.getBallBody(), {
    x: plate.x,
    y: plate.y - 20,
  });
  Matter.Body.setVelocity(physics.getBallBody(), { x: 0, y: 0 });

  for (let i = 0; i < 15; i++) {
    physics.step(16, input);
    if (plate.isPressed) break;
  }
  assert(plate.isPressed === true, 'Stone Ball depresses heavy pressure plate');
  assert(gate.isOpen === true, 'Linked Stone Gate opens when heavy pressure plate is pressed!');
}

// -----------------------------------------------------------------------------
// Test 5: Snow Ball Navigates Narrow Tunnel & Anti-Clipping Clearance
// -----------------------------------------------------------------------------
console.log('\n--- Test 5: Snow Ball Navigates Narrow Tunnel & Anti-Clipping Clearance ---');
{
  const input = new InputController();
  const physics = new PhysicsWorld(
    level3.platforms,
    level3.worldWidth,
    level3.worldHeight,
    level3.initialBallX,
    level3.initialBallY
  );

  // Section 4 crawlspace tunnel: ceiling at y=2076, floor at y=2146 (gap = 40px)
  const tunnelX = 3650;
  const tunnelY = 2111;

  // Snow Ball (radius 16, height 32)
  physics.setBallForm('snow');
  Matter.Body.setPosition(physics.getBallBody(), { x: tunnelX, y: tunnelY });
  Matter.Body.setVelocity(physics.getBallBody(), { x: 0, y: 0 });

  // Move through tunnel
  input.setRight(true);
  for (let i = 0; i < 20; i++) {
    physics.step(16, input);
  }
  input.setRight(false);
  assert(physics.getBallBody().position.x > tunnelX, 'Snow Ball smoothly traverses narrow tunnel');

  // Attempt to expand to Stone Ball (radius 25, height 50) inside the 40px gap
  const stoneExpansion = physics.setBallForm('stone');
  assert(!stoneExpansion, 'Anti-clipping prevents expanding to Stone Ball inside narrow tunnel');
  assert(physics.getCurrentForm() === 'snow', 'Ball remains Snow Ball to prevent clipping into ceiling');

  // Attempt to expand to Original Ball (radius 24, height 48) inside 40px gap
  const originalExpansion = physics.setBallForm('original');
  assert(!originalExpansion, 'Anti-clipping prevents expanding to Original Ball inside narrow tunnel');
  assert(physics.getCurrentForm() === 'snow', 'Ball safely remains Snow Ball');
}

// -----------------------------------------------------------------------------
// Test 6: Wind Zone Physics (Stone Ball Resists, Snow Ball Drifts)
// -----------------------------------------------------------------------------
console.log('\n--- Test 6: Wind Zone Physics ---');
{
  const input = new InputController();
  const physics = new PhysicsWorld(
    level3.platforms,
    level3.worldWidth,
    level3.worldHeight,
    level3.initialBallX,
    level3.initialBallY
  );

  // Section 5 Wind Zone: x=4850, y=1450, windForceX = +5.5
  const windX = 4850;
  const windY = 1450;

  // 1. Test Snow Ball drift under wind
  physics.setBallForm('snow');
  Matter.Body.setPosition(physics.getBallBody(), { x: windX, y: windY });
  Matter.Body.setVelocity(physics.getBallBody(), { x: 0, y: 0 });

  for (let i = 0; i < 25; i++) {
    physics.step(16, input);
  }
  const snowVx = physics.getBallBody().velocity.x;
  console.log(`  Snow Ball wind velocity: ${snowVx.toFixed(3)} px/frame`);
  assert(snowVx > 1.0, 'Snow Ball experiences strong gale-force wind drift');

  // 2. Test Stone Ball resistance under identical wind
  physics.setBallForm('stone');
  Matter.Body.setPosition(physics.getBallBody(), { x: windX, y: windY });
  Matter.Body.setVelocity(physics.getBallBody(), { x: 0, y: 0 });

  for (let i = 0; i < 25; i++) {
    physics.step(16, input);
  }
  const stoneVx = physics.getBallBody().velocity.x;
  console.log(`  Stone Ball wind velocity: ${stoneVx.toFixed(3)} px/frame`);
  assert(stoneVx < snowVx * 0.2, 'Stone Ball firmly resists gale-force wind (heavy mass)');
}

// -----------------------------------------------------------------------------
// Test 7: Fragile Snow Platform Dynamics
// -----------------------------------------------------------------------------
console.log('\n--- Test 7: Fragile Snow Platform Dynamics ---');
{
  const input = new InputController();
  const physics = new PhysicsWorld(
    level3.platforms,
    level3.worldWidth,
    level3.worldHeight,
    level3.initialBallX,
    level3.initialBallY
  );

  const snowPlat = level3.platforms.find((p) => p.id === 'l3_sec6_snow1')!;
  assert(snowPlat !== undefined, 'Fragile snow bridge platform found');

  // 1. Snow Ball lands on fragile snow
  physics.setBallForm('snow');
  Matter.Body.setPosition(physics.getBallBody(), { x: snowPlat.x, y: snowPlat.y - 18 });
  Matter.Body.setVelocity(physics.getBallBody(), { x: 0, y: 0 });

  for (let i = 0; i < 20; i++) {
    physics.step(16, input);
  }
  assert(!snowPlat.isCollapsed, 'Snow Ball glides safely across fragile snow bridge without collapsing it');

  // 2. Stone Ball lands on fragile snow
  physics.setBallForm('stone');
  Matter.Body.setPosition(physics.getBallBody(), { x: snowPlat.x, y: snowPlat.y - 27 });
  Matter.Body.setVelocity(physics.getBallBody(), { x: 0, y: 0 });

  for (let i = 0; i < 20; i++) {
    physics.step(16, input);
    if (snowPlat.isCollapsed) break;
  }
  assert(snowPlat.isCollapsed === true, 'Stone Ball instantly collapses fragile snow bridge (0.15s)');
}

// -----------------------------------------------------------------------------
// Test 8: Frigid Lake Form-Dependent Buoyancy
// -----------------------------------------------------------------------------
console.log('\n--- Test 8: Frigid Lake Form-Dependent Buoyancy ---');
{
  const input = new InputController();
  const physics = new PhysicsWorld(
    level3.platforms,
    level3.worldWidth,
    level3.worldHeight,
    level3.initialBallX,
    level3.initialBallY
  );

  const water = level3.platforms.find((p) => p.id === 'l3_sec7_water')!;
  const seabedY = water.y + water.height / 2;

  // 1. Snow Ball in water: Low density (0.38) -> floats high
  physics.setBallForm('snow');
  Matter.Body.setPosition(physics.getBallBody(), { x: water.x, y: water.y + 50 });
  Matter.Body.setVelocity(physics.getBallBody(), { x: 0, y: 0 });

  for (let i = 0; i < 35; i++) {
    physics.step(16, input);
  }
  const snowFinalY = physics.getBallBody().position.y;
  assert(snowFinalY < water.y + 60, 'Snow Ball floats buoyant near the water surface');

  // 2. Stone Ball in water: High density (2.6) -> sinks to lake bed
  physics.setBallForm('stone');
  Matter.Body.setPosition(physics.getBallBody(), { x: water.x, y: water.y + 50 });
  Matter.Body.setVelocity(physics.getBallBody(), { x: 0, y: 0 });

  for (let i = 0; i < 40; i++) {
    physics.step(16, input);
  }
  const stoneFinalY = physics.getBallBody().position.y;
  console.log(`  Stone Ball water depth Y: ${stoneFinalY.toFixed(1)} (Seabed: ${seabedY})`);
  assert(stoneFinalY > water.y + 90, 'Stone Ball sinks steadily through frigid water to seabed');
}

// -----------------------------------------------------------------------------
// Test 9: 4 Progressive Checkpoints Sequence & 3-Life Respawn
// -----------------------------------------------------------------------------
console.log('\n--- Test 9: 4 Progressive Checkpoints Sequence & 3-Life Respawn ---');
{
  const input = new InputController();
  const physics = new PhysicsWorld(
    level3.platforms,
    level3.worldWidth,
    level3.worldHeight,
    level3.initialBallX,
    level3.initialBallY
  );

  const cp1 = level3.platforms.find((p) => p.id === 'l3_checkpoint_1')!;
  const cp2 = level3.platforms.find((p) => p.id === 'l3_checkpoint_2')!;
  const cp3 = level3.platforms.find((p) => p.id === 'l3_checkpoint_3')!;
  const cp4 = level3.platforms.find((p) => p.id === 'l3_checkpoint_4')!;

  assert(Boolean(cp1 && cp2 && cp3 && cp4), 'All 4 checkpoints exist');

  // Touch Checkpoint 1
  Matter.Body.setPosition(physics.getBallBody(), { x: cp1.x, y: cp1.y });
  physics.step(16, input);
  assert(cp1.isActivated === true, 'Checkpoint 1 activated');

  // Fall into abyss / out of world -> respawns at Checkpoint 1
  Matter.Body.setPosition(physics.getBallBody(), { x: 500, y: 2850 }); // Abyss fellOutOfWorld
  physics.step(16, input);
  assert(physics.getLives() === 2, 'Life decreased from 3 to 2');
  assert(
    Math.abs(physics.getBallBody().position.x - cp1.x) < 20,
    'Respawns accurately at activated Checkpoint 1'
  );

  // Touch Checkpoint 2
  Matter.Body.setPosition(physics.getBallBody(), { x: cp2.x, y: cp2.y });
  physics.step(16, input);
  assert(cp2.isActivated === true, 'Checkpoint 2 activated');

  // Touch Checkpoint 3
  Matter.Body.setPosition(physics.getBallBody(), { x: cp3.x, y: cp3.y });
  physics.step(16, input);
  assert(cp3.isActivated === true, 'Checkpoint 3 activated');

  // Touch Checkpoint 4
  Matter.Body.setPosition(physics.getBallBody(), { x: cp4.x, y: cp4.y });
  physics.step(16, input);
  assert(cp4.isActivated === true, 'Checkpoint 4 activated');

  // Exhaust remaining 2 lives
  Matter.Body.setPosition(physics.getBallBody(), { x: 500, y: 2850 });
  physics.step(16, input); // life -> 1
  physics.step(200, input);
  Matter.Body.setPosition(physics.getBallBody(), { x: 500, y: 2850 });
  physics.step(16, input); // life -> 0 -> Game Over reset!

  assert(physics.getLives() === 3, 'Game Over restores 3 lives');
  const ballReset = physics.getBallState();
  assert(
    ballReset.x === level3.initialBallX && ballReset.y === level3.initialBallY,
    'Game Over resets position back to level start (160, 2180)'
  );
  assert(!cp1.isActivated, 'Checkpoints reset on Game Over');
}

// -----------------------------------------------------------------------------
// Test 10: 20 Persistent Coins Collection & Golden Exit Ring
// -----------------------------------------------------------------------------
console.log('\n--- Test 10: 20 Persistent Coins Collection & Golden Exit Ring ---');
{
  const input = new InputController();
  const collectedCoins: string[] = [];
  const physics = new PhysicsWorld(
    level3.platforms,
    level3.worldWidth,
    level3.worldHeight,
    level3.initialBallX,
    level3.initialBallY,
    level3.coins,
    (coin) => {
      collectedCoins.push(coin.id);
    }
  );

  const coinsList = level3.coins ?? [];
  assert(coinsList.length === 20, 'Level 3 contains exactly 20 persistent coins');

  // Collect coin 1 at (350, 2150)
  const coin1 = coinsList[0];
  Matter.Body.setPosition(physics.getBallBody(), { x: coin1.x, y: coin1.y });
  physics.step(16, input);

  assert(collectedCoins.includes(coin1.id), 'Coin 1 collected and fired callback');
  assert(physics.getActiveCoins().length === 19, 'Coin removed from active world coins');

  // Enter Golden Exit Ring at Section 8 Summit Pinnacle (8650, 300)
  const exitRing = level3.platforms.find((p) => p.type === 'exit')!;
  assert(exitRing !== undefined, 'Golden exit ring found at summit');
  Matter.Body.setPosition(physics.getBallBody(), { x: exitRing.x, y: exitRing.y });
  physics.step(16, input);

  assert(physics.getIsLevelComplete() === true, 'Level complete triggered by Golden Exit Ring!');
}

console.log('\n================================================================');
console.log('🎉 ALL 10 TESTS PASSED! LEVEL 3 FROZEN MOUNTAIN KINGDOM IS 100% VERIFIED!');
console.log('================================================================');
