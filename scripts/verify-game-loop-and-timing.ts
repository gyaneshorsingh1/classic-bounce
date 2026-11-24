// @ts-nocheck
import { PhysicsWorld } from '../src/game/physics';
import { InputController } from '../src/controllers/InputController';
import { LEVEL_PLATFORMS, WORLD_WIDTH, WORLD_HEIGHT } from '../src/game/constants';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    process.exit(1);
  } else {
    console.log(`✅ PASSED: ${message}`);
  }
}

console.log('=== Starting Game Loop Timing & Mobile Performance Test Suite ===\n');

// --- Test 1: Accumulator Timing Invariance Across Different Frame Rates ---
console.log('--- Test 1: Accumulator Fixed Timestep Sub-Stepping ---');

function simulateGameLoop(fps: number, totalRealTimeMs: number) {
  const world = new PhysicsWorld(LEVEL_PLATFORMS, WORLD_WIDTH, WORLD_HEIGHT, 100, 300);
  const input = new InputController();
  input.setRight(true); // Moving right

  const frameIntervalMs = 1000 / fps;
  let accumulator = 0;
  let lastTime = 0;
  const FIXED_TIMESTEP = 1000 / 60; // 16.6667ms
  const MAX_SUB_STEPS = 5;

  let currentRealTime = 0;

  while (currentRealTime < totalRealTimeMs) {
    currentRealTime += frameIntervalMs;
    const rawDelta = currentRealTime - lastTime;
    lastTime = currentRealTime;

    const safeDelta = Math.min(Math.max(rawDelta, 0), 120);
    accumulator += safeDelta;

    let steps = 0;
    while (accumulator >= FIXED_TIMESTEP && steps < MAX_SUB_STEPS) {
      world.step(FIXED_TIMESTEP, input);
      accumulator -= FIXED_TIMESTEP;
      steps++;
    }

    if (accumulator > FIXED_TIMESTEP * 2) {
      accumulator = 0;
    }
  }

  return {
    elapsedGameTime: world.getElapsedGameplayTime(),
    finalBallX: world.getBallState().x,
  };
}

const sim60 = simulateGameLoop(60, 2000); // 2 seconds at 60 FPS
const sim30 = simulateGameLoop(30, 2000); // 2 seconds at 30 FPS
const sim20 = simulateGameLoop(20, 2000); // 2 seconds at 20 FPS
const sim15 = simulateGameLoop(15, 2000); // 2 seconds at 15 FPS

console.log(`60 FPS (Laptop): Game Time = ${sim60.elapsedGameTime.toFixed(2)}s, Ball X = ${sim60.finalBallX.toFixed(1)}`);
console.log(`30 FPS (Mobile): Game Time = ${sim30.elapsedGameTime.toFixed(2)}s, Ball X = ${sim30.finalBallX.toFixed(1)}`);
console.log(`20 FPS (Low-end Mobile): Game Time = ${sim20.elapsedGameTime.toFixed(2)}s, Ball X = ${sim20.finalBallX.toFixed(1)}`);
console.log(`15 FPS (Heavy mobile lag): Game Time = ${sim15.elapsedGameTime.toFixed(2)}s, Ball X = ${sim15.finalBallX.toFixed(1)}`);

assert(
  Math.abs(sim60.elapsedGameTime - 2.0) <= 0.05,
  `60 FPS elapsed game time is ~2.0s (measured: ${sim60.elapsedGameTime.toFixed(2)}s)`
);
assert(
  Math.abs(sim30.elapsedGameTime - 2.0) <= 0.05,
  `30 FPS elapsed game time is ~2.0s (measured: ${sim30.elapsedGameTime.toFixed(2)}s)`
);
assert(
  Math.abs(sim20.elapsedGameTime - 2.0) <= 0.05,
  `20 FPS elapsed game time is ~2.0s (measured: ${sim20.elapsedGameTime.toFixed(2)}s)`
);
assert(
  Math.abs(sim15.elapsedGameTime - 2.0) <= 0.05,
  `15 FPS elapsed game time is ~2.0s (measured: ${sim15.elapsedGameTime.toFixed(2)}s)`
);

// Ball travel distance must be virtually identical regardless of FPS
assert(
  Math.abs(sim60.finalBallX - sim30.finalBallX) < 15,
  `Ball distance at 30 FPS matches 60 FPS within tight margin (60fps: ${sim60.finalBallX.toFixed(1)}, 30fps: ${sim30.finalBallX.toFixed(1)})`
);
assert(
  Math.abs(sim60.finalBallX - sim15.finalBallX) < 25,
  `Ball distance at 15 FPS matches 60 FPS within tight margin (60fps: ${sim60.finalBallX.toFixed(1)}, 15fps: ${sim15.finalBallX.toFixed(1)})`
);

// --- Test 2: Frustum Culling Simulation ---
console.log('\n--- Test 2: Frustum Culling Verification ---');

function isPlatformVisible(plat, camera, width, height) {
  const screenW = width > 0 ? width : 800;
  const screenH = height > 0 ? height : 400;
  const CULL_MARGIN = 160;
  const viewLeft = camera.x - CULL_MARGIN;
  const viewRight = camera.x + screenW + CULL_MARGIN;
  const viewTop = camera.y - CULL_MARGIN;
  const viewBottom = camera.y + screenH + CULL_MARGIN;

  const left = plat.x - plat.width / 2;
  const top = plat.y - plat.height / 2;
  const right = left + plat.width;
  const bottom = top + plat.height;

  let checkLeft = left;
  let checkRight = right;
  let checkTop = top;
  let checkBottom = bottom;

  if (plat.type === 'rotating_spikes') {
    const r = (plat.armLength ?? 80) + 25;
    checkLeft = plat.x - r;
    checkRight = plat.x + r;
    checkTop = plat.y - r;
    checkBottom = plat.y + r;
  } else if (plat.type === 'geyser') {
    const gh = plat.geyserHeight ?? 150;
    checkTop = plat.y - gh - plat.height / 2;
  }

  if (checkRight < viewLeft || checkLeft > viewRight || checkBottom < viewTop || checkTop > viewBottom) {
    return false;
  }
  return true;
}

const camera = { x: 500, y: 300 };
const screenWidth = 800;
const screenHeight = 400;

// Visible platform in the center of the camera
const centerPlat = { id: 'p1', x: 800, y: 450, width: 200, height: 40, type: 'ground' };
assert(isPlatformVisible(centerPlat, camera, screenWidth, screenHeight), 'Center platform is visible');

// Far distant platform in Level 4/5 (5000px away)
const farPlat = { id: 'p2', x: 5000, y: 450, width: 200, height: 40, type: 'ground' };
assert(!isPlatformVisible(farPlat, camera, screenWidth, screenHeight), 'Far off-screen platform is culled');

// Platform just behind camera (x=200, left=100, right=300; viewLeft = 500 - 160 = 340)
const behindPlat = { id: 'p3', x: 200, y: 450, width: 200, height: 40, type: 'ground' };
assert(!isPlatformVisible(behindPlat, camera, screenWidth, screenHeight), 'Platform behind camera view is culled');

// Platform just about to enter from right edge (viewRight = 500 + 800 + 160 = 1460; plat at x=1400)
const nearEdgePlat = { id: 'p4', x: 1400, y: 450, width: 100, height: 40, type: 'ground' };
assert(isPlatformVisible(nearEdgePlat, camera, screenWidth, screenHeight), 'Platform within 160px margin is preserved (no pop-in)');

// Rotating spike with extended arms reaching into viewport
const rotatingSpike = { id: 'rs1', x: 1500, y: 450, width: 20, height: 20, armLength: 100, type: 'rotating_spikes' };
// checkLeft = 1500 - 125 = 1375 <= viewRight (1460) -> visible!
assert(isPlatformVisible(rotatingSpike, camera, screenWidth, screenHeight), 'Rotating spike with reach entering viewport is preserved');

// --- Test 3: Natural Ball Rolling Kinematics Calibration ---
console.log('\n--- Test 3: Natural Ball Rolling Kinematics Calibration ---');

const world = new PhysicsWorld(LEVEL_PLATFORMS, WORLD_WIDTH, WORLD_HEIGHT, 140, 536, [], undefined, [], undefined, false);

const rightInput = new InputController();
rightInput.setRight(true);

// First frame response from stop (tap right) - should be smooth progressive roll, not an instant teleport
world.step(16.667, rightInput);
const vxFrame1 = world.getBallState().vx;
console.log(`Initial tap vx: ${vxFrame1.toFixed(2)} (smooth natural start)`);

assert(vxFrame1 > 0.3 && vxFrame1 < 1.0, `Ball starts smoothly with natural rotational acceleration (measured: ${vxFrame1.toFixed(2)})`);

// Accelerate to top speed over 30 frames
for (let i = 0; i < 30; i++) {
  world.step(16.667, rightInput);
}

const topVx = world.getBallState().vx;
console.log(`Calibrated natural top speed: ${topVx.toFixed(2)} px/frame`);
assert(Math.abs(topVx - 5.0) < 0.3, `Natural top speed is calibrated to ~5.0 px/frame (measured: ${topVx.toFixed(2)})`);

// Test Turnaround (Skid and reverse direction)
const leftInput = new InputController();
leftInput.setLeft(true);
world.step(16.667, leftInput);
const turnaroundVx1 = world.getBallState().vx;
console.log(`Turnaround frame 1 vx: ${turnaroundVx1.toFixed(2)} (crisp skid braking)`);
assert(turnaroundVx1 < topVx && turnaroundVx1 > 0, `Turnaround immediately applies firm skid-braking traction`);

// Test Coasting (Release controls to coast to a natural stop)
const neutralInput = new InputController();
for (let i = 0; i < 40; i++) {
  world.step(16.667, neutralInput);
}
const coastedVx = world.getBallState().vx;
console.log(`Coasted vx after release: ${coastedVx.toFixed(2)}`);
assert(coastedVx === 0, 'Ball smoothly coasts down to a complete, natural stop upon release');

console.log('\n======================================================');
console.log('🎉 ALL GAME LOOP & MOBILE TIMING TESTS PASSED! 🎉');
console.log('======================================================\n');
