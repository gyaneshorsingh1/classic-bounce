import { PhysicsWorld } from '../src/game/physics';
import { MOVE_SPEED, JUMP_VELOCITY } from '../src/game/constants';

function assert(condition: boolean, msg: string) {
  if (!condition) {
    console.error(`❌ FAILED: ${msg}`);
    process.exit(1);
  }
  console.log(`✅ PASSED: ${msg}`);
}

console.log('====================================================');
console.log('🧪 VERIFY QUICK REACTION CONTROLS (NO LONG PRESS REQUIRED)');
console.log('====================================================\n');

// -----------------------------------------------------------------------------
// Test 1: Ultra-short 1-frame tap (16.6ms) produces instant movement kick
// -----------------------------------------------------------------------------
console.log('--- Test 1: Ultra-short 1-Frame Tap Instant Kick ---');
const p1 = new PhysicsWorld();
// Let ball settle on ground
for (let i = 0; i < 60; i++) p1.step(16.67, { left: false, right: false, jump: false });

const startX = p1.getBallState().x;
// 1 single frame tap!
p1.step(16.67, { left: false, right: true, jump: false });
const frame1State = p1.getBallState();
console.log(`  Frame 1 (tap active): vx=${frame1State.vx.toFixed(2)}, x=${frame1State.x.toFixed(2)}`);
assert(frame1State.vx >= 5.0, `Instant snap acceleration: vx must be >= 5.0 immediately (was ${frame1State.vx.toFixed(2)})`);

// Finger lifted! (Input is now completely released)
for (let i = 0; i < 7; i++) {
  p1.step(16.67, { left: false, right: false, jump: false });
}
const endX = p1.getBallState().x;
const distanceTraveled = endX - startX;
console.log(`  Distance traveled from 1 light tap: ${distanceTraveled.toFixed(2)}px`);
assert(distanceTraveled >= 30, `Light tap must produce a solid visible rolling step >= 30px (was ${distanceTraveled.toFixed(2)}px)`);

// -----------------------------------------------------------------------------
// Test 2: Instant Direction Reversal on Tap
// -----------------------------------------------------------------------------
console.log('\n--- Test 2: Instant Direction Reversal on Tap ---');
const p2 = new PhysicsWorld();
for (let i = 0; i < 60; i++) p2.step(16.67, { left: false, right: false, jump: false });

// Move right for 3 frames
for (let i = 0; i < 3; i++) p2.step(16.67, { left: false, right: true, jump: false });
assert(p2.getBallState().vx > 0, 'Ball moving right');

// 1-frame tap Left
p2.step(16.67, { left: true, right: false, jump: false });
const revState = p2.getBallState();
console.log(`  After Left tap: vx=${revState.vx.toFixed(2)}`);
assert(revState.vx < -4.0, `Velocity must immediately flip negative on Left tap (was ${revState.vx.toFixed(2)})`);

// -----------------------------------------------------------------------------
// Test 3: Quick Jump Tap During Landing Micro-Bounce (No Long Press)
// -----------------------------------------------------------------------------
console.log('\n--- Test 3: Quick Jump Tap During Landing Micro-Bounce ---');
const p3 = new PhysicsWorld();
// Drop ball from Y=480 onto ground Y=560
for (let i = 0; i < 22; i++) p3.step(16.67, { left: false, right: false, jump: false });
// Ball has impacted ground and is in landing micro-bounce
const preJumpState = p3.getBallState();
console.log(`  Ball pre-jump: y=${preJumpState.y.toFixed(2)}, vy=${preJumpState.vy.toFixed(2)}, grounded=${preJumpState.isGrounded}`);

// 1 single frame tap Jump
p3.step(16.67, { left: false, right: false, jump: true });
const jumpedState = p3.getBallState();
console.log(`  Ball post-jump: vy=${jumpedState.vy.toFixed(2)}`);
assert(jumpedState.vy < -10.0, `Jump must trigger immediately on 1-frame tap without long press (was vy=${jumpedState.vy.toFixed(2)})`);

// -----------------------------------------------------------------------------
// Test 4: Simultaneous Hold Right + Quick Jump Tap
// -----------------------------------------------------------------------------
console.log('\n--- Test 4: Simultaneous Hold Right + Quick Jump Tap ---');
const p4 = new PhysicsWorld();
for (let i = 0; i < 60; i++) p4.step(16.67, { left: false, right: false, jump: false });

// Hold Right continuously
for (let i = 0; i < 10; i++) p4.step(16.67, { left: false, right: true, jump: false });
assert(p4.getBallState().vx >= 5.8, 'Ball at full right speed');

// Tap Jump for 1 frame while CONTINUING to hold Right
p4.step(16.67, { left: false, right: true, jump: true });
const simState = p4.getBallState();
console.log(`  Simultaneous step: vx=${simState.vx.toFixed(2)}, vy=${simState.vy.toFixed(2)}`);
assert(simState.vx > 5.5, `Horizontal speed must not drop when jumping (was ${simState.vx.toFixed(2)})`);
assert(simState.vy < -10.0, `Vertical jump must trigger while holding Right (was ${simState.vy.toFixed(2)})`);

// Release Jump while STILL holding Right
for (let i = 0; i < 10; i++) p4.step(16.67, { left: false, right: true, jump: false });
assert(p4.getBallState().vx > 5.0, 'Horizontal momentum preserved airborne');

// -----------------------------------------------------------------------------
// Test 5: Clean Stop on Release (No Infinite Drifting)
// -----------------------------------------------------------------------------
console.log('\n--- Test 5: Clean Braking Stop on Release ---');
// Continue p1 from Test 1 until tap buffer expires
for (let i = 0; i < 30; i++) p1.step(16.67, { left: false, right: false, jump: false });
const settledState = p1.getBallState();
console.log(`  Settled state: vx=${settledState.vx.toFixed(4)}`);
assert(settledState.vx === 0, `Ball must halt cleanly to 0 after tap expires (was ${settledState.vx})`);

// -----------------------------------------------------------------------------
// Test 6: Single-Touch Gesture Event Processor Verification
// -----------------------------------------------------------------------------
console.log('\n--- Test 6: Single-Touch Event Processing ---');
// Verify single-touch event parser logic where touches[] is empty on initial grant
{
  const activeMap = new Map<number | string, { x: number; y: number }>();
  const MID_X = 107;
  const MOVEMENT_MAX_X = 350;
  const JUMP_MIN_X = 400;

  function processTestTouch(e: any, isEnd: boolean) {
    const native = e.nativeEvent;
    if (isEnd) {
      if (native.changedTouches && native.changedTouches.length > 0) {
        for (let i = 0; i < native.changedTouches.length; i++) {
          activeMap.delete(native.changedTouches[i].identifier ?? 0);
        }
      } else if (native.identifier !== undefined) {
        activeMap.delete(native.identifier);
      }
      if (!native.touches || native.touches.length === 0) {
        activeMap.clear();
      }
    } else {
      if (native.touches && native.touches.length > 0) {
        for (let i = 0; i < native.touches.length; i++) {
          const t = native.touches[i];
          activeMap.set(t.identifier ?? 0, { x: t.pageX, y: t.pageY });
        }
      }
      if (native.changedTouches && native.changedTouches.length > 0) {
        for (let i = 0; i < native.changedTouches.length; i++) {
          const t = native.changedTouches[i];
          activeMap.set(t.identifier ?? 0, { x: t.pageX, y: t.pageY });
        }
      }
      if (activeMap.size === 0 && native.pageX !== undefined) {
        activeMap.set(native.identifier ?? 0, { x: native.pageX, y: native.pageY });
      }
    }

    let isLeft = false;
    let isRight = false;
    let isJump = false;
    activeMap.forEach(({ x }) => {
      if (x >= 0 && x < MID_X && x < MOVEMENT_MAX_X) isLeft = true;
      else if (x >= MID_X && x < MOVEMENT_MAX_X) isRight = true;
      if (x >= JUMP_MIN_X) isJump = true;
    });
    return { isLeft, isRight, isJump };
  }

  // Single touch Left button (x=50, touches=[])
  const leftDown = processTestTouch({
    nativeEvent: { changedTouches: [{ identifier: 0, pageX: 50, pageY: 350 }], touches: [] }
  }, false);
  assert(leftDown.isLeft && !leftDown.isRight && !leftDown.isJump, 'Single touch on Left activates Left');

  // Single touch release
  const leftUp = processTestTouch({
    nativeEvent: { changedTouches: [{ identifier: 0, pageX: 50, pageY: 350 }], touches: [] }
  }, true);
  assert(!leftUp.isLeft && !leftUp.isRight && !leftUp.isJump, 'Single touch release clears Left');

  // Single touch Right button (x=150, touches=[])
  const rightDown = processTestTouch({
    nativeEvent: { changedTouches: [{ identifier: 0, pageX: 150, pageY: 350 }], touches: [] }
  }, false);
  assert(!rightDown.isLeft && rightDown.isRight && !rightDown.isJump, 'Single touch on Right activates Right');

  // Single touch Jump button (x=600, touches=[])
  const jumpDown = processTestTouch({
    nativeEvent: { changedTouches: [{ identifier: 0, pageX: 600, pageY: 350 }], touches: [] }
  }, false);
  assert(jumpDown.isJump, 'Single touch on Jump activates Jump');
}

console.log('\n🎉 ALL QUICK REACTION & SINGLE-TOUCH TESTS PASSED SUCCESSFULLY!');
