import { PhysicsWorld } from '../src/game/physics';
import { GAME_LEVELS } from '../src/game/levels';
import { InputController } from '../src/controllers/InputController';

const level1 = GAME_LEVELS[0];

console.log('--- Simulating Level 1 Section 2 Traversal with GAME_LEVELS[0] ---');

// 1. Ball starts above sec2_step_1 (x: 960, y: 1100). Settle on platform
const world = new PhysicsWorld(
  level1.platforms,
  level1.worldWidth,
  level1.worldHeight,
  960,
  1062,
  level1.coins,
  undefined,
  level1.keys
);
const input = new InputController();

for (let i = 0; i < 30; i++) {
  world.step(16.666, input);
}
let state = world.getBallState();
console.log(`Landed on sec2_step_1 at x: ${state.x.toFixed(1)}, y: ${state.y.toFixed(1)}, grounded: ${state.isGrounded}`);
if (!state.isGrounded) {
  console.error('Failed to settle on sec2_step_1');
  process.exit(1);
}

// 2. Jump right towards sec2_step_4 (x: 1180, y: 980, width: 220)
input.setRight(true);
for (let i = 0; i < 8; i++) world.step(16.666, input);
input.setJump(true);
world.step(16.666, input);
input.setJump(false);

let reachedStep4 = false;
for (let frame = 0; frame < 50; frame++) {
  world.step(16.666, input);
  state = world.getBallState();

  if (state.x >= 1100 && state.x <= 1260 && state.isGrounded) {
    reachedStep4 = true;
    console.log(`✅ Successfully reached sec2_step_4 at frame ${frame}, x: ${state.x.toFixed(1)}, y: ${state.y.toFixed(1)}`);
    break;
  }
}

if (!reachedStep4) {
  console.error(`❌ Failed to reach sec2_step_4! Final pos: x=${state.x.toFixed(1)}, y=${state.y.toFixed(1)}, grounded=${state.isGrounded}`);
  process.exit(1);
}

// Settle on step 4
input.setRight(false);
for (let i = 0; i < 30; i++) {
  world.step(16.666, input);
}

// 3. Jump right from sec2_step_4 towards sec2_step_mid (x: 1400, y: 880, width: 200)
input.setRight(true);
for (let i = 0; i < 8; i++) world.step(16.666, input);
input.setJump(true);
world.step(16.666, input);
input.setJump(false);

let reachedStepMid = false;
for (let frame = 0; frame < 50; frame++) {
  world.step(16.666, input);
  state = world.getBallState();

  if (state.x >= 1320 && state.x <= 1480 && state.isGrounded) {
    reachedStepMid = true;
    console.log(`✅ Successfully reached sec2_step_mid at frame ${frame}, x: ${state.x.toFixed(1)}, y: ${state.y.toFixed(1)}`);
    break;
  }
}

if (!reachedStepMid) {
  console.error(`❌ Failed to reach sec2_step_mid! Final pos: x=${state.x.toFixed(1)}, y=${state.y.toFixed(1)}, grounded=${state.isGrounded}`);
  process.exit(1);
}

// Settle on step mid
input.setRight(false);
for (let i = 0; i < 30; i++) {
  world.step(16.666, input);
}

// 4. Jump right from sec2_step_mid to sec2_ledge (x: 1620, y: 780, width: 240)
input.setRight(true);
for (let i = 0; i < 8; i++) world.step(16.666, input);
input.setJump(true);
world.step(16.666, input);
input.setJump(false);

let reachedLedge = false;
for (let frame = 0; frame < 50; frame++) {
  world.step(16.666, input);
  state = world.getBallState();

  if (state.x >= 1520 && state.x <= 1720 && state.isGrounded) {
    reachedLedge = true;
    console.log(`✅ Successfully reached sec2_ledge at frame ${frame}, x: ${state.x.toFixed(1)}, y: ${state.y.toFixed(1)}`);
    break;
  }
}

if (!reachedLedge) {
  console.error(`❌ Failed to reach sec2_ledge! Final pos: x=${state.x.toFixed(1)}, y=${state.y.toFixed(1)}, grounded=${state.isGrounded}`);
  process.exit(1);
}

// 5. Test hopping left from sec2_step_4 onto Spring Pad (sec2_step_3) and collecting Bronze Key
console.log('\n--- Testing Spring Pad Hop and Key Collection ---');
let keyCollected = false;
const world2 = new PhysicsWorld(
  level1.platforms,
  level1.worldWidth,
  level1.worldHeight,
  1150,
  942,
  level1.coins,
  undefined,
  level1.keys,
  () => {
    keyCollected = true;
  }
);
const input2 = new InputController();
for (let i = 0; i < 30; i++) world2.step(16.666, input2);

input2.setLeft(true);
for (let i = 0; i < 8; i++) world2.step(16.666, input2);
input2.setJump(true);
world2.step(16.666, input2);
input2.setJump(false);

for (let frame = 0; frame < 150; frame++) {
  const s = world2.getBallState();
  // Once launched upward from the bounce pad (x: 940), steer left to reach the key shelf (x: 800, y: 600)
  if (s.vy < -15.0) {
    input2.setLeft(true);
    input2.setRight(false);
  }
  // Once landed on the shelf, roll toward the key alcove (x: 880, y: 570)
  if (s.isGrounded && s.x <= 820) {
    input2.setLeft(false);
    input2.setRight(true);
  }
  world2.step(16.666, input2);
  if (keyCollected) {
    console.log(`✅ Bronze Key Collected at frame ${frame}! x=${s.x.toFixed(1)}, y=${s.y.toFixed(1)}`);
    break;
  }
}

if (!keyCollected) {
  console.error('❌ Failed to collect Bronze Key from Spring Pad launch');
  process.exit(1);
}

console.log('\n🎉 ALL LEVEL 1 SECTION 2 ENHANCEMENTS AND CLIMBING TESTS PASSED PERFECTLY! 🎉\n');
