import { PhysicsWorld } from '../src/game/physics';
import { InputController } from '../src/controllers/InputController';
import { MOVE_SPEED, JUMP_VELOCITY } from '../src/game/constants';

function assert(condition: boolean, msg: string) {
  if (!condition) {
    console.error(`❌ FAILED: ${msg}`);
    process.exit(1);
  }
  console.log(`✅ PASSED: ${msg}`);
}

console.log('================================================================');
console.log('🧪 VERIFY REBUILT INPUTCONTROLLER & PLAYERCONTROLLER ARCHITECTURE');
console.log('================================================================\n');

// -----------------------------------------------------------------------------
// Scenario 1: Hold Right for several seconds
// -----------------------------------------------------------------------------
console.log('--- Scenario 1: Hold Right for several seconds ---');
{
  const p = new PhysicsWorld();
  const input = new InputController();
  // Settle on ground
  for (let i = 0; i < 60; i++) p.step(16.67, input);

  input.setRight(true);
  for (let i = 0; i < 90; i++) p.step(16.67, input); // ~1.5 seconds

  const state = p.getBallState();
  console.log(`  State after holding Right: x=${state.x.toFixed(2)}, vx=${state.vx.toFixed(2)}`);
  assert(state.vx >= 4.5, `Ball must roll right at calibrated speed (was ${state.vx.toFixed(2)})`);
  assert(state.x > 500, `Ball must travel continuously across ground (x=${state.x.toFixed(2)})`);
}

// -----------------------------------------------------------------------------
// Scenario 2: Hold Left for several seconds
// -----------------------------------------------------------------------------
console.log('\n--- Scenario 2: Hold Left for several seconds ---');
{
  const p = new PhysicsWorld();
  const input = new InputController();
  for (let i = 0; i < 60; i++) p.step(16.67, input);

  // Move right on the wide platform first so ball has open track to roll left
  input.setRight(true);
  for (let i = 0; i < 40; i++) p.step(16.67, input);
  input.setRight(false);

  // Hold Left for several seconds
  input.setLeft(true);
  for (let i = 0; i < 30; i++) p.step(16.67, input);

  const state = p.getBallState();
  console.log(`  State after holding Left: x=${state.x.toFixed(2)}, vx=${state.vx.toFixed(2)}`);
  assert(state.vx <= -4.5, `Ball must roll left at calibrated negative speed (was ${state.vx.toFixed(2)})`);
}

// -----------------------------------------------------------------------------
// Scenario 3: Hold Right + Jump simultaneously
// -----------------------------------------------------------------------------
console.log('\n--- Scenario 3: Hold Right + Jump simultaneously ---');
{
  const p = new PhysicsWorld();
  const input = new InputController();
  for (let i = 0; i < 60; i++) p.step(16.67, input);

  input.setRight(true);
  input.setJump(true);
  p.step(16.67, input);

  const state = p.getBallState();
  console.log(`  Simultaneous step: vx=${state.vx.toFixed(2)}, vy=${state.vy.toFixed(2)}`);
  assert(state.vx > 0.3, `Horizontal acceleration triggers simultaneously with jump (vx=${state.vx.toFixed(2)})`);
  assert(state.vy < -10.0, `Vertical jump must trigger while holding Right (vy=${state.vy.toFixed(2)})`);

  // Continue holding right in air
  for (let i = 0; i < 20; i++) p.step(16.67, input);
  const airState = p.getBallState();
  assert(airState.vx >= 3.0, `Ball continues accelerating in air while holding Right (vx=${airState.vx.toFixed(2)})`);
}

// -----------------------------------------------------------------------------
// Scenario 4: Hold Left + Jump simultaneously
// -----------------------------------------------------------------------------
console.log('\n--- Scenario 4: Hold Left + Jump simultaneously ---');
{
  const p = new PhysicsWorld();
  const input = new InputController();
  for (let i = 0; i < 60; i++) p.step(16.67, input);

  input.setLeft(true);
  input.setJump(true);
  p.step(16.67, input);

  const state = p.getBallState();
  console.log(`  Simultaneous Left + Jump step: vx=${state.vx.toFixed(2)}, vy=${state.vy.toFixed(2)}`);
  assert(state.vx < -0.3, `Horizontal acceleration moves left while jumping (vx=${state.vx.toFixed(2)})`);
  assert(state.vy < -10.0, `Vertical jump must trigger while holding Left (vy=${state.vy.toFixed(2)})`);

  // Continue holding left in air
  for (let i = 0; i < 20; i++) p.step(16.67, input);
  const airState = p.getBallState();
  assert(airState.vx <= -3.0, `Ball continues accelerating left in air while holding Left (vx=${airState.vx.toFixed(2)})`);
}

// -----------------------------------------------------------------------------
// Scenario 5: Hold Right + Jump, release Jump, continue holding Right
// -----------------------------------------------------------------------------
console.log('\n--- Scenario 5: Release Jump while continuing to hold Right ---');
{
  const p = new PhysicsWorld();
  const input = new InputController();
  for (let i = 0; i < 60; i++) p.step(16.67, input);

  // Both held
  input.setRight(true);
  input.setJump(true);
  p.step(16.67, input);

  // Release Jump, keep holding Right
  input.setJump(false);
  for (let i = 0; i < 15; i++) p.step(16.67, input);

  const state = p.getBallState();
  console.log(`  After releasing Jump: vx=${state.vx.toFixed(2)}, vy=${state.vy.toFixed(2)}`);
  assert(state.vx > 2.0, `Releasing jump must never interrupt holding Right (vx=${state.vx.toFixed(2)})`);
}

// -----------------------------------------------------------------------------
// Scenario 6: Hold both directional buttons (deterministic direction handling)
// -----------------------------------------------------------------------------
console.log('\n--- Scenario 6: Hold both Left and Right (deterministic cancellation) ---');
{
  const p = new PhysicsWorld();
  const input = new InputController();
  for (let i = 0; i < 60; i++) p.step(16.67, input);

  // Move right first
  input.setRight(true);
  for (let i = 0; i < 15; i++) p.step(16.67, input);
  assert(p.getBallState().vx > 0, 'Ball moving right initially');

  // Now press Left AT THE SAME TIME as Right
  input.setLeft(true);
  for (let i = 0; i < 25; i++) p.step(16.67, input);

  const state = p.getBallState();
  console.log(`  State when both buttons held: vx=${state.vx.toFixed(4)}`);
  assert(state.vx === 0, `Holding both buttons must safely cancel horizontal speed to 0 (vx=${state.vx})`);
}

// -----------------------------------------------------------------------------
// Scenario 7: Rapidly tap Jump
// -----------------------------------------------------------------------------
console.log('\n--- Scenario 7: Rapidly tap Jump ---');
{
  const p = new PhysicsWorld();
  const input = new InputController();
  for (let i = 0; i < 60; i++) p.step(16.67, input);

  // Rapid tap: down then up
  input.setJump(true);
  p.step(16.67, input);
  const jump1Vy = p.getBallState().vy;
  input.setJump(false);
  p.step(16.67, input);

  console.log(`  Jump 1 vy: ${jump1Vy.toFixed(2)}`);
  assert(jump1Vy < -10.0, 'Jump 1 triggered on tap');

  // Let ball land
  for (let i = 0; i < 80; i++) p.step(16.67, input);
  assert(p.getBallState().isGrounded, 'Ball landed after jump 1');

  // Rapid tap 2
  input.setJump(true);
  p.step(16.67, input);
  const jump2Vy = p.getBallState().vy;
  input.setJump(false);
  p.step(16.67, input);

  console.log(`  Jump 2 vy: ${jump2Vy.toFixed(2)}`);
  assert(jump2Vy < -10.0, 'Jump 2 triggered on second tap after landing');
}

// -----------------------------------------------------------------------------
// Scenario 8: Continuous repeated jumps while holding Jump button
// -----------------------------------------------------------------------------
console.log('\n--- Scenario 8: Continuous repeated jumps while holding Jump button ---');
{
  const p = new PhysicsWorld();
  const input = new InputController();
  for (let i = 0; i < 60; i++) p.step(16.67, input);

  // Press and HOLD Jump continuously
  input.setJump(true);
  p.step(16.67, input);
  assert(p.getBallState().vy < -10.0, 'Initial jump triggered');

  // Wait through flight and track second jump automatically triggered upon landing
  let secondJumpTriggered = false;
  for (let i = 0; i < 80; i++) {
    p.step(16.67, input);
    const b = p.getBallState();
    if (i > 30 && b.vy < -10.0) {
      secondJumpTriggered = true;
      console.log(`  Second jump triggered at frame ${i} upon landing: vy=${b.vy.toFixed(2)}`);
      break;
    }
  }
  assert(secondJumpTriggered, 'Continuous jump triggered automatically on landing while holding Jump!');

  // Release button: ball will land and stop jumping
  input.setJump(false);
  for (let i = 0; i < 80; i++) p.step(16.67, input);
  const landedState = p.getBallState();
  assert(landedState.isGrounded, 'Ball settled on ground after releasing Jump');
  assert(landedState.vy > -5.0, 'Auto-jumping stopped immediately when Jump released');
}

// -----------------------------------------------------------------------------
// Scenario 9: Change direction while airborne
// -----------------------------------------------------------------------------
console.log('\n--- Scenario 9: Change direction while airborne ---');
{
  const p = new PhysicsWorld();
  const input = new InputController();
  for (let i = 0; i < 60; i++) p.step(16.67, input);

  // Move right on ground first
  input.setRight(true);
  for (let i = 0; i < 30; i++) p.step(16.67, input);
  assert(p.getBallState().vx >= 4.5, 'Moving right on ground');

  // Jump moving right
  input.setJump(true);
  p.step(16.67, input);
  input.setJump(false);
  assert(p.getBallState().vx >= 4.0, 'Moving right airborne');

  // Switch to Left mid-air!
  input.setRight(false);
  input.setLeft(true);
  for (let i = 0; i < 40; i++) p.step(16.67, input);

  const midAirState = p.getBallState();
  console.log(`  Mid-air reversed velocity: vx=${midAirState.vx.toFixed(2)}`);
  assert(midAirState.vx < 0, `Ball successfully reversed direction in mid-air (vx=${midAirState.vx.toFixed(2)})`);
}

// -----------------------------------------------------------------------------
// Scenario 10: Interrupt touch / focus loss (resetAll)
// -----------------------------------------------------------------------------
console.log('\n--- Scenario 10: Interrupt touch / focus loss (resetAll) ---');
{
  const input = new InputController();
  input.setRight(true);
  input.setJump(true);
  assert(input.getState().rightPressed && input.getState().jumpPressed, 'Buttons active');

  // Notification shade pulled down or focus lost:
  input.resetAll();
  const resetState = input.getState();
  assert(!resetState.leftPressed && !resetState.rightPressed && !resetState.jumpPressed, 'All inputs safely zeroed without sticking');
}

console.log('\n🎉 ALL 10 REBUILT CONTROLS SCENARIOS PASSED WITH 100% SUCCESS!');
