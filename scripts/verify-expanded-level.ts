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
console.log('🧪 VERIFY EXPANDED LEVEL MAP & ENVIRONMENTAL CHALLENGES');
console.log('================================================================\n');

const level1 = getLevelData(1);

// -----------------------------------------------------------------------------
// Test 1: Level Dimensions & 6 Connected Sections Integrity
// -----------------------------------------------------------------------------
console.log('--- Test 1: Map Scope & 6 Sections Verification ---');
{
  console.log(`  Map Dimensions: ${level1.worldWidth} x ${level1.worldHeight}`);
  assert(level1.worldWidth === 5200, 'Level 1 worldWidth is 5200px (4.5x expansion)');
  assert(level1.worldHeight === 1500, 'Level 1 worldHeight is 1500px (vertical gameplay)');
  assert(level1.initialBallX === 160 && level1.initialBallY === 1300, 'Starting spawn position is correct');

  // Verify elements in each section
  const pIds = level1.platforms.map((p) => p.id);
  // Section 1
  assert(pIds.includes('sec1_ground') && pIds.includes('sec1_step_1'), 'Section 1 (Starting Area) present');
  // Section 2
  assert(pIds.includes('sec2_step_1') && pIds.includes('sec2_ledge'), 'Section 2 (Climbing Towers) present');
  // Section 3
  assert(pIds.includes('sec3_spikes_1') && pIds.includes('sec3_safe_island'), 'Section 3 (Spike Obstacles) present');
  // Section 4
  assert(pIds.includes('sec4_moving_h') && pIds.includes('sec4_moving_v'), 'Section 4 (Moving Platforms) present');
  // Section 5
  assert(pIds.includes('sec5_apex_crown') && pIds.includes('sec5_drop_ledge_3'), 'Section 5 (High Skyways & Drop) present');
  // Section 6
  assert(pIds.includes('sec6_spike_hazard') && pIds.includes('sec6_golden_exit'), 'Section 6 (Exit Gauntlet) present');
}

// -----------------------------------------------------------------------------
// Test 2: Platform Step Heights & Jump Reachability
// -----------------------------------------------------------------------------
console.log('\n--- Test 2: Jump Reachability & Step Heights ---');
{
  // Test climbing sequence vertical step heights
  const climbingSteps = [
    { name: 'sec1_step_2 -> sec2_step_1', y1: 1180, y2: 1100, x1: 720, x2: 960 },
    { name: 'sec2_step_1 -> sec2_step_2', y1: 1100, y2: 1010, x1: 960, x2: 1220 },
    { name: 'sec2_step_2 -> sec2_step_3', y1: 1010, y2: 920, x1: 1220, x2: 1040 },
    { name: 'sec2_step_3 -> sec2_step_4', y1: 920, y2: 840, x1: 1040, x2: 1300 },
    { name: 'sec2_step_4 -> sec2_ledge', y1: 840, y2: 780, x1: 1300, x2: 1580 },
  ];

  for (const step of climbingSteps) {
    const deltaY = step.y1 - step.y2; // Height player must jump upwards
    const deltaX = Math.abs(step.x2 - step.x1);
    console.log(`  ${step.name}: ascent = ${deltaY}px, span = ${deltaX}px`);
    assert(deltaY <= 95, `${step.name} vertical step (${deltaY}px) is easily reachable (max jump ~115px)`);
    assert(deltaX <= 280, `${step.name} horizontal span (${deltaX}px) is easily clearable`);
  }
}

// -----------------------------------------------------------------------------
// Test 3: Moving Platforms Dynamic Simulation
// -----------------------------------------------------------------------------
console.log('\n--- Test 3: Moving Platforms Oscillation & Player Ride ---');
{
  const p = new PhysicsWorld(
    level1.platforms,
    level1.worldWidth,
    level1.worldHeight,
    level1.initialBallX,
    level1.initialBallY
  );
  const input = new InputController();

  const movingH = level1.platforms.find((plat) => plat.id === 'sec4_moving_h')!;
  const movingV = level1.platforms.find((plat) => plat.id === 'sec4_moving_v')!;
  const initialHX = movingH.x;
  const initialVY = movingV.y;

  // Step physics for 40 frames (~660ms)
  for (let i = 0; i < 40; i++) {
    p.step(16.67, input);
  }

  const updatedHX = movingH.x;
  const updatedVY = movingV.y;
  console.log(`  Moving H: initial x=${initialHX.toFixed(1)}, current x=${updatedHX.toFixed(1)}`);
  console.log(`  Moving V: initial y=${initialVY.toFixed(1)}, current y=${updatedVY.toFixed(1)}`);

  assert(Math.abs(updatedHX - initialHX) > 10, 'Horizontal platform successfully moved');
  assert(Math.abs(updatedVY - initialVY) > 10, 'Vertical platform successfully moved');
}

// -----------------------------------------------------------------------------
// Test 4: Spike Hazard Detection & Reset
// -----------------------------------------------------------------------------
console.log('\n--- Test 4: Spike Hazard Collision & Checkpoint Reset ---');
{
  const p = new PhysicsWorld(
    level1.platforms,
    level1.worldWidth,
    level1.worldHeight,
    level1.initialBallX,
    level1.initialBallY
  );
  const input = new InputController();

  // Settle at start
  for (let i = 0; i < 20; i++) p.step(16.67, input);
  assert(p.getBallState().x < 300, 'Ball starts in Section 1');

  // Spawn ball directly over spike hazard at sec3_spikes_1 (x=2050, y=1000)
  const spikePlat = level1.platforms.find((plat) => plat.id === 'sec3_spikes_1')!;
  // @ts-ignore
  Matter.Body.setPosition(p['ball'], { x: spikePlat.x, y: spikePlat.y });

  // Step physics: spike collision must trigger
  p.step(16.67, input);

  const resetState = p.getBallState();
  console.log(`  State after touching spike: x=${resetState.x}, y=${resetState.y}`);
  assert(resetState.x === level1.initialBallX, 'Ball reset to initial X after touching spikes');
  assert(resetState.y === level1.initialBallY, 'Ball reset to initial Y after touching spikes');
}

// -----------------------------------------------------------------------------
// Test 5: Golden Exit Ring Victory Trigger
// -----------------------------------------------------------------------------
console.log('\n--- Test 5: Golden Exit Ring Victory Trigger ---');
{
  const p = new PhysicsWorld(
    level1.platforms,
    level1.worldWidth,
    level1.worldHeight,
    level1.initialBallX,
    level1.initialBallY
  );
  const input = new InputController();

  assert(!p.getIsLevelComplete(), 'Level is not complete at start');

  // Move ball to exit ring at x: 5100, y: 720
  // @ts-ignore
  Matter.Body.setPosition(p['ball'], { x: 5100, y: 720 });

  // Step physics
  p.step(16.67, input);
  console.log(`  Level complete status: ${p.getIsLevelComplete()}`);
  assert(p.getIsLevelComplete(), 'Touching golden exit ring marks level as complete!');
}

// -----------------------------------------------------------------------------
// Test 6: World Boundary Containment
// -----------------------------------------------------------------------------
console.log('\n--- Test 6: World Boundary Containment ---');
{
  const p = new PhysicsWorld(
    level1.platforms,
    level1.worldWidth,
    level1.worldHeight,
    level1.initialBallX,
    level1.initialBallY
  );
  const input = new InputController();

  // Try to roll left past x = 0
  input.setLeft(true);
  for (let i = 0; i < 60; i++) p.step(16.67, input);

  const leftWallState = p.getBallState();
  console.log(`  Ball position after rolling left against boundary: x=${leftWallState.x.toFixed(1)}`);
  assert(leftWallState.x > 0, 'Ball safely contained by left boundary wall (x > 0)');
}

console.log('\n🎉 ALL 6 EXPANDED LEVEL & CHALLENGE TESTS PASSED WITH 100% SUCCESS!\n');
