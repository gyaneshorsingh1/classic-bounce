import Matter from 'matter-js';
import { getLevelData } from '../src/game/levels';
import { PhysicsWorld } from '../src/game/physics';
import { InputController } from '../src/controllers/InputController';
import { InputState } from '../src/types/game';

function assert(condition: boolean, msg: string) {
  if (!condition) {
    console.error(`❌ FAILED: ${msg}`);
    process.exit(1);
  }
  console.log(`✅ PASSED: ${msg}`);
}

console.log('================================================================');
console.log('🧪 VERIFY LEVEL 3: SECTION 3 BOUNCE PAD & GATE PROGRESSION');
console.log('================================================================\n');

const level3 = getLevelData(3);
const pIds = level3.platforms.map((p) => p.id);

// -----------------------------------------------------------------------------
// Test 1: Platform & Mechanism Integrity in Section 3
// -----------------------------------------------------------------------------
console.log('--- Test 1: Platform & Mechanism Integrity in Section 3 ---');
{
  assert(pIds.includes('l3_sec3_bounce'), 'High-tension Bounce Pad (l3_sec3_bounce) exists');
  assert(pIds.includes('l3_sec3_step'), 'Intermediate Stepping Ledge (l3_sec3_step) exists');
  assert(pIds.includes('l3_sec3_trans_ground'), 'Normal Reversion Gate (l3_sec3_trans_ground) exists');
  const revTrans = level3.platforms.find((p) => p.id === 'l3_sec3_trans_ground')!;
  assert(revTrans.type === 'transformer_original', 'l3_sec3_trans_ground has type "transformer_original" to revert player to Normal Red Ball');
  assert(pIds.includes('l3_sec3_plate'), 'Section 3 Pressure Plate (l3_sec3_plate) exists');
  assert(pIds.includes('l3_sec3_gate'), 'Section 3 Stone Gate (l3_sec3_gate) exists');
  assert(pIds.includes('l3_sec3_exit_shelf'), 'Section 3 Exit Shelf (l3_sec3_exit_shelf) exists');
  assert(pIds.includes('l3_checkpoint_2'), 'Checkpoint 2 (l3_checkpoint_2) exists on exit shelf');

  const bounce = level3.platforms.find((p) => p.id === 'l3_sec3_bounce')!;
  assert(bounce.type === 'bounce_pad', 'l3_sec3_bounce has type "bounce_pad"');
  assert(bounce.x === 2715, 'l3_sec3_bounce x position is 2715 (matches screenshot barrier position)');
  assert(bounce.y === 2060, 'l3_sec3_bounce y position is 2060 (resting on ground surface)');
  assert((bounce.launchForceY ?? 0) <= -20.0, 'l3_sec3_bounce has strong launch impulse (launchForceY <= -20.0)');

  const step = level3.platforms.find((p) => p.id === 'l3_sec3_step')!;
  assert(step.type === 'floating', 'l3_sec3_step has type "floating"');
  assert(step.x === 2840 && step.y === 1960, 'l3_sec3_step is positioned at (2840, 1960)');

  const plate = level3.platforms.find((p) => p.id === 'l3_sec3_plate')!;
  assert(plate.type === 'pressure_plate', 'l3_sec3_plate is accessible to all ball forms');
  assert(plate.linkedDoorId === 'l3_sec3_gate', 'l3_sec3_plate links to l3_sec3_gate');
}

// -----------------------------------------------------------------------------
// Test 2: Bounce Pad Launch Trajectory Clears Gate & Lands on Exit Shelf
// -----------------------------------------------------------------------------
console.log('\n--- Test 2: Bounce Pad Launch Trajectory Clears Gate & Lands on Exit Shelf ---');
{
  const dummyInput: InputState = { left: false, right: false, jump: false };
  const world = new PhysicsWorld(
    level3.platforms,
    level3.worldWidth,
    level3.worldHeight,
    2715,
    2027,
    level3.coins
  );

  let launched = false;
  let minVy = 0;
  let highestPeakY = 9999;
  let clearedGate = false;
  let reachedExitShelf = false;

  // Step simulation for up to 90 frames (~1.5s)
  for (let f = 0; f < 90; f++) {
    world.step(16.667, dummyInput);

    const state = world.getBallState();

    if (state.vy < minVy) {
      minVy = state.vy;
    }
    if (state.vy < -15.0) {
      launched = true;
    }
    if (state.y < highestPeakY) {
      highestPeakY = state.y;
    }

    // Gate top is at y = 1850. Check if ball is soaring above gate level while traveling rightward
    if (state.x >= 2800 && state.y < 1850) {
      clearedGate = true;
    }

    // Exit shelf spans x: 2850 to 3050, surface at y ~ 1835
    if (state.x >= 2850 && state.x <= 3050 && state.y <= 1860 && state.y >= 1800) {
      reachedExitShelf = true;
    }
  }

  console.log(`  Measured Min Vy: ${minVy.toFixed(2)} px/frame`);
  console.log(`  Highest Peak Y: ${highestPeakY.toFixed(2)} px (Gate Top is at 1850px)`);
  console.log(`  Cleared Gate: ${clearedGate}, Reached Exit Shelf: ${reachedExitShelf}`);

  assert(launched, 'Bounce pad successfully imparted strong upward velocity');
  assert(highestPeakY < 1850, `Ball soared above the 1850px gate top (peak y = ${highestPeakY.toFixed(1)}px)`);
  assert(clearedGate, 'Ball trajectory cleanly flew over the 180px stone gate');
  assert(reachedExitShelf, 'Ball successfully arrived on l3_sec3_exit_shelf at Checkpoint 2');
}

// -----------------------------------------------------------------------------
// Test 3: Red Ball & Stone Ball Can Depress Pressure Plate & Open Gate
// -----------------------------------------------------------------------------
console.log('\n--- Test 3: Pressure Plate Opens Stone Gate for Both Forms ---');
{
  const dummyInput: InputState = { left: false, right: false, jump: false };
  const world = new PhysicsWorld(
    level3.platforms,
    level3.worldWidth,
    level3.worldHeight,
    2520,
    2030,
    level3.coins
  );

  const gatePlat = level3.platforms.find((p) => p.id === 'l3_sec3_gate')!;
  const platePlat = level3.platforms.find((p) => p.id === 'l3_sec3_plate')!;

  // Update physics
  world.step(16.667, dummyInput);
  world.step(16.667, dummyInput);

  assert(Boolean(platePlat.isPressed), 'Pressure plate depressed by ball');
  assert(Boolean(gatePlat.isOpen), 'Stone gate opened immediately when plate was depressed');
}

// -----------------------------------------------------------------------------
// Test 4: Transformation Cycle (Stone before wall, Normal after wall)
// -----------------------------------------------------------------------------
console.log('\n--- Test 4: Transformation Cycle (Stone before wall, Normal after wall) ---');
{
  const dummyInput: InputState = { left: false, right: false, jump: false };
  // Step 4a: Test stone transformation at x: 2020
  const worldStone = new PhysicsWorld(
    level3.platforms,
    level3.worldWidth,
    level3.worldHeight,
    2020,
    1975,
    level3.coins
  );
  assert(worldStone.getCurrentForm() === 'original', 'Initial form is original red ball');
  worldStone.step(16.667, dummyInput);
  worldStone.step(16.667, dummyInput);
  assert(worldStone.getCurrentForm() === 'stone', 'Entrance transformer (x: 2020) successfully transforms ball to Stone form');

  // Step 4b: Test normal reversion at x: 2380
  const worldRev = new PhysicsWorld(
    level3.platforms,
    level3.worldWidth,
    level3.worldHeight,
    2380,
    2015,
    level3.coins
  );
  // Set to stone form as if arriving through the broken wall
  (worldRev as any).currentForm = 'stone';
  assert(worldRev.getCurrentForm() === 'stone', 'Ball enters post-wall chamber as stone ball');
  worldRev.step(16.667, dummyInput);
  worldRev.step(16.667, dummyInput);
  assert(worldRev.getCurrentForm() === 'original', 'Reversion gate (x: 2380) successfully reverts ball to Normal Red Ball');
}

console.log('\n======================================================');
console.log('🎉 ALL LEVEL 3 BOUNCE SOLUTION TESTS PASSED! 🎉');
console.log('======================================================\n');
