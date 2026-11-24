import { saveManager } from '../src/services/SaveManager';
import { getLevelData } from '../src/game/levels';
import { PhysicsWorld } from '../src/game/physics';
import { InputController } from '../src/controllers/InputController';
import { PlayerController } from '../src/controllers/PlayerController';
import { BALL_FORM_CONFIGS } from '../src/game/ballConfigs';
import Matter from 'matter-js';

declare const process: any;

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    process.exit(1);
  } else {
    console.log(`✅ PASSED: ${message}`);
  }
}

async function runMobilePerformanceTests() {
  console.log('=== Starting Mobile Performance & Touch Responsiveness Test Suite ===\n');

  await saveManager.resetForTesting();
  const inputController = new InputController();
  const playerController = new PlayerController();

  // -------------------------------------------------------------
  // TEST 1: Simultaneous Multi-Touch & Independent Input Tracking
  // -------------------------------------------------------------
  console.log('--- Test 1: Simultaneous Multi-Touch (Right + Jump) ---');
  inputController.resetAll();

  // Press Right
  inputController.setRight(true);
  let state = inputController.getState();
  assert(state.rightPressed && !state.leftPressed && !state.jumpPressed, 'Only Right is active initially');

  // Simultaneously press Jump
  inputController.setJump(true);
  state = inputController.getState();
  assert(state.rightPressed && state.jumpPressed && !state.leftPressed, 'Both Right and Jump are simultaneously active');

  // Consume step state: both should be reported to physics
  let consumed = inputController.consumeStepState();
  assert(consumed.rightPressed && consumed.jumpPressed && !consumed.leftPressed, 'Physics step consumed Right + Jump simultaneously');

  // Next frame while still holding both: both must remain active (continuous holding)
  consumed = inputController.consumeStepState();
  assert(consumed.rightPressed && consumed.jumpPressed, 'Holding buttons preserves continuous active state');

  // Release Right: Jump must remain active independently
  inputController.setRight(false);
  state = inputController.getState();
  assert(!state.rightPressed && state.jumpPressed, 'Releasing Right leaves Jump active independently');

  // Release Jump
  inputController.setJump(false);
  state = inputController.getState();
  assert(!state.rightPressed && !state.jumpPressed && !state.leftPressed, 'All inputs clean after release');

  // -------------------------------------------------------------
  // TEST 2: Kinematics - Continuous Movement & Continuous Jumping
  // -------------------------------------------------------------
  console.log('\n--- Test 2: Kinematics with Continuous Multi-Touch ---');
  const config = BALL_FORM_CONFIGS.original;

  // Grounded with Right + Jump held
  let currentVx = 0;
  let currentVy = 0;
  const multiInput = { leftPressed: false, rightPressed: true, jumpPressed: true };

  // Calculate horizontal velocity: should accelerate right
  currentVx = playerController.computeHorizontalVelocity(currentVx, true, multiInput, config);
  assert(currentVx > 0, `Accelerates horizontally (vx=${currentVx.toFixed(2)})`);

  // Calculate jump: should jump immediately
  const jumpRes1 = playerController.computeVerticalVelocity(currentVy, true, multiInput, config);
  assert(jumpRes1.didJump, `Initial jump triggered immediately (vy=${jumpRes1.vy.toFixed(2)})`);
  currentVy = jumpRes1.vy;

  // Next frame while airborne with Jump still held: should NOT double-jump mid-air
  const jumpResAir = playerController.computeVerticalVelocity(currentVy, false, multiInput, config);
  assert(!jumpResAir.didJump, 'Prevented mid-air double jump while airborne');

  // Once landed on ground with Jump still held: should trigger continuous jump!
  const jumpResLanded = playerController.computeVerticalVelocity(0, true, multiInput, config);
  assert(jumpResLanded.didJump, 'Continuous jump automatically executes upon landing when holding Jump');

  // -------------------------------------------------------------
  // TEST 3: Deterministic Dual-Directional Neutralization (Left + Right)
  // -------------------------------------------------------------
  console.log('\n--- Test 3: Dual-Directional Cancellation ---');
  const dualDirInput = { leftPressed: true, rightPressed: true, jumpPressed: false };
  const stoppedVx = playerController.computeHorizontalVelocity(5.0, true, dualDirInput, config);
  assert(stoppedVx < 5.0, 'Holding both Left and Right brakes the ball cleanly without deadlock');

  // -------------------------------------------------------------
  // TEST 4: Broadphase Culling Accuracy in PhysicsWorld
  // -------------------------------------------------------------
  console.log('\n--- Test 4: Broadphase Hazard & Platform Culling ---');
  const lvl1 = getLevelData(1);
  const world = new PhysicsWorld(
    lvl1.platforms,
    lvl1.worldWidth,
    lvl1.worldHeight,
    lvl1.initialBallX,
    lvl1.initialBallY,
    lvl1.coins,
    undefined,
    lvl1.keys,
    undefined,
    false,
    lvl1.risingZone
  );

  // Initial step: player standing on ground platform
  world.step(16.667, inputController);
  assert(world.getLives() === 3, 'Initial spawn survives safely with broadphase checks');

  // Find a spike in Level 1
  const spike = lvl1.platforms.find((p) => p.type === 'spike');
  assert(spike !== undefined, 'Level 1 has a spike hazard');

  // 4a. Place ball far from spike (500px away) -> Broadphase skips it, lives stay 3
  Matter.Body.setPosition((world as any).ball, { x: spike!.x + 500, y: spike!.y });
  world.step(16.667, inputController);
  assert(world.getLives() === 3, 'Distant spike (500px) does not harm ball');

  // 4b. Place ball directly on spike -> Lethal collision detected correctly
  Matter.Body.setPosition((world as any).ball, { x: spike!.x, y: spike!.y });
  world.step(16.667, inputController);
  assert(world.getLives() === 2, 'Direct contact with spike correctly deducts 1 life (3 -> 2)');

  // -------------------------------------------------------------
  // TEST 5: 60 FPS Physics Simulation Performance Benchmark
  // -------------------------------------------------------------
  console.log('\n--- Test 5: Physics Step Performance Benchmark (300 frames) ---');
  const startBenchmark = Date.now();
  inputController.setRight(true);

  for (let frame = 0; frame < 300; frame++) {
    world.step(16.667, inputController);
  }

  const durationMs = Date.now() - startBenchmark;
  const avgFrameTimeMs = durationMs / 300;
  console.log(`Executed 300 physics steps in ${durationMs}ms (avg ${avgFrameTimeMs.toFixed(3)}ms per step)`);
  assert(avgFrameTimeMs < 5.0, `Physics step is well within 16.67ms 60 FPS budget (measured: ${avgFrameTimeMs.toFixed(3)}ms)`);

  console.log('\n🎉 ALL MOBILE PERFORMANCE & TOUCH RESPONSIVENESS TESTS PASSED! 🎉\n');
}

runMobilePerformanceTests().catch((err) => {
  console.error('Test suite failed:', err);
  process.exit(1);
});
