import { PhysicsWorld } from '../src/game/physics';
import { InputController } from '../src/controllers/InputController';
import { PlayerController } from '../src/controllers/PlayerController';
import { BALL_FORM_CONFIGS } from '../src/game/ballConfigs';
import { PlatformData } from '../src/types/game';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    process.exit(1);
  } else {
    console.log(`✅ PASSED: ${message}`);
  }
}

console.log('================================================================');
console.log('🧪 VERIFY REBUILT PLAYER MOVEMENT, TOUCH & JUMP CONTROLLER');
console.log('================================================================');

// -----------------------------------------------------------------------------
// Scenario 1: Tap Jump once
// -----------------------------------------------------------------------------
console.log('\n--- Scenario 1: Tap Jump once ---');
{
  const p = new PhysicsWorld();
  const input = new InputController();

  // Settle ball on ground
  for (let i = 0; i < 60; i++) p.step(16.67, input);
  assert(p.getBallState().isGrounded, 'Ball is landed on ground initially');

  // Player taps Jump once
  input.setJump(true);
  p.step(16.67, input);
  const launchVy = p.getBallState().vy;
  console.log(`  Tap launch vy: ${launchVy.toFixed(2)}`);
  assert(launchVy < -10.0, 'Ball jumps once on tap');

  // Player releases Jump while airborne
  input.setJump(false);
  p.step(16.67, input);
  assert(!p.getBallState().isGrounded, 'Ball is airborne');

  // Ball completes arc and lands on ground
  let landed = false;
  for (let i = 0; i < 80; i++) {
    p.step(16.67, input);
    if (p.getBallState().isGrounded) {
      landed = true;
      break;
    }
  }
  assert(landed, 'Ball landed on ground');

  // Observe for 30 more frames: verify ball stays on ground and does NOT jump again
  let didUnexpectedJump = false;
  for (let i = 0; i < 30; i++) {
    p.step(16.67, input);
    if (p.getBallState().vy < -5.0) {
      didUnexpectedJump = true;
      break;
    }
  }
  assert(!didUnexpectedJump, 'Ball lands normally and never auto-jumps after single tap');
}

// -----------------------------------------------------------------------------
// Scenario 2: Hold Jump continuously for several jumps
// -----------------------------------------------------------------------------
console.log('\n--- Scenario 2: Hold Jump continuously for several jumps ---');
{
  const p = new PhysicsWorld();
  const input = new InputController();

  for (let i = 0; i < 60; i++) p.step(16.67, input);

  // Player presses and HOLDS Jump continuously
  input.setJump(true);
  p.step(16.67, input);
  assert(p.getBallState().vy < -10.0, 'First jump triggered on initial press');

  let jumpCount = 1;
  let framesInAir = 0;

  for (let i = 0; i < 200; i++) {
    p.step(16.67, input);
    const state = p.getBallState();

    if (framesInAir > 20 && state.vy < -10.0) {
      // Ball landed and immediately triggered the next jump on the landing frame!
      jumpCount++;
      framesInAir = 0;
      console.log(`  Jump ${jumpCount} automatically triggered upon landing (frame ${i}, vy=${state.vy.toFixed(2)})`);
      if (jumpCount >= 4) break;
    } else if (!state.isGrounded) {
      framesInAir++;
      // While airborne, must not trigger mid-air jump
      assert(state.vy > -15.0, 'No mid-air super jump allowed while airborne');
    }
  }

  assert(jumpCount >= 4, `Successfully executed 4 continuous jumps while holding Jump (${jumpCount})`);
}

// -----------------------------------------------------------------------------
// Scenario 3: Release Jump while airborne
// -----------------------------------------------------------------------------
console.log('\n--- Scenario 3: Release Jump while airborne ---');
{
  const p = new PhysicsWorld();
  const input = new InputController();

  for (let i = 0; i < 60; i++) p.step(16.67, input);

  input.setJump(true);
  p.step(16.67, input);
  assert(p.getBallState().vy < -10.0, 'Ball launched into air');

  // Progress into air flight
  for (let i = 0; i < 15; i++) p.step(16.67, input);
  assert(!p.getBallState().isGrounded, 'Ball is in mid-air');

  // Release jump button in mid-air
  input.setJump(false);

  // Ball completes flight and lands
  for (let i = 0; i < 60; i++) p.step(16.67, input);
  const state = p.getBallState();
  console.log(`  State after landing: grounded=${state.isGrounded}, vy=${state.vy.toFixed(2)}`);
  assert(state.isGrounded, 'Ball landed on ground');
  assert(state.vy >= -1.0, 'Ball settled on ground without launching another jump');
}

// -----------------------------------------------------------------------------
// Scenario 4: Press Jump immediately before landing
// -----------------------------------------------------------------------------
console.log('\n--- Scenario 4: Press Jump immediately before landing ---');
{
  const p = new PhysicsWorld();
  const input = new InputController();

  for (let i = 0; i < 60; i++) p.step(16.67, input);

  // Jump up first
  input.setJump(true);
  p.step(16.67, input);
  input.setJump(false);

  // Wait until falling down (vy > 4.0, near ground)
  let nearGround = false;
  for (let i = 0; i < 40; i++) {
    p.step(16.67, input);
    const b = p.getBallState();
    if (b.vy > 5.0 && b.y > 450) {
      nearGround = true;
      break;
    }
  }
  assert(nearGround, 'Ball is falling downward near ground');

  // Player presses Jump in mid-air right before touching ground
  input.setJump(true);
  p.step(16.67, input);

  // Within the next frames, it should land and trigger jump immediately
  let jumpedOnLanding = false;
  for (let i = 0; i < 30; i++) {
    p.step(16.67, input);
    const b = p.getBallState();
    if (b.vy < -10.0) {
      jumpedOnLanding = true;
      console.log(`  Jump successfully triggered on landing: vy=${b.vy.toFixed(2)} at frame ${i}`);
      break;
    }
  }
  assert(jumpedOnLanding, 'Pressing Jump right before landing triggers jump on contact');
}

// -----------------------------------------------------------------------------
// Scenario 5: Press Left + Jump simultaneously
// -----------------------------------------------------------------------------
console.log('\n--- Scenario 5: Press Left + Jump simultaneously ---');
{
  const p = new PhysicsWorld();
  const input = new InputController();

  for (let i = 0; i < 60; i++) p.step(16.67, input);

  input.setLeft(true);
  input.setJump(true);
  p.step(16.67, input);

  const state = p.getBallState();
  console.log(`  Left + Jump step: vx=${state.vx.toFixed(2)}, vy=${state.vy.toFixed(2)}`);
  assert(state.vy < -10.0, 'Vertical jump triggered');
  assert(state.vx < -0.2, 'Horizontal left movement started simultaneously');
}

// -----------------------------------------------------------------------------
// Scenario 6: Press Right + Jump simultaneously
// -----------------------------------------------------------------------------
console.log('\n--- Scenario 6: Press Right + Jump simultaneously ---');
{
  const p = new PhysicsWorld();
  const input = new InputController();

  for (let i = 0; i < 60; i++) p.step(16.67, input);

  input.setRight(true);
  input.setJump(true);
  p.step(16.67, input);

  const state = p.getBallState();
  console.log(`  Right + Jump step: vx=${state.vx.toFixed(2)}, vy=${state.vy.toFixed(2)}`);
  assert(state.vy < -10.0, 'Vertical jump triggered');
  assert(state.vx > 0.2, 'Horizontal right movement started simultaneously');
}

// -----------------------------------------------------------------------------
// Scenario 7: Hold Left + Right together (neutral input)
// -----------------------------------------------------------------------------
console.log('\n--- Scenario 7: Hold Left + Right together (neutral input) ---');
{
  const p = new PhysicsWorld();
  const input = new InputController();

  for (let i = 0; i < 60; i++) p.step(16.67, input);

  // Move right first
  input.setRight(true);
  for (let i = 0; i < 20; i++) p.step(16.67, input);
  assert(p.getBallState().vx > 2.0, 'Ball is rolling right');

  // Now press Left simultaneously while still holding Right
  input.setLeft(true);
  for (let i = 0; i < 30; i++) p.step(16.67, input);

  const state = p.getBallState();
  console.log(`  Velocity when both Left + Right held: vx=${state.vx.toFixed(4)}`);
  assert(state.vx === 0, 'Holding both Left + Right safely cancels horizontal velocity to 0');
}

// -----------------------------------------------------------------------------
// Scenario 8: Rapidly tap Jump repeatedly
// -----------------------------------------------------------------------------
console.log('\n--- Scenario 8: Rapidly tap Jump repeatedly ---');
{
  const p = new PhysicsWorld();
  const input = new InputController();

  for (let i = 0; i < 60; i++) p.step(16.67, input);

  for (let tap = 1; tap <= 3; tap++) {
    input.setJump(true);
    p.step(16.67, input);
    assert(p.getBallState().vy < -10.0, `Jump ${tap} launched`);

    input.setJump(false);
    // Let ball fly and land
    let landed = false;
    for (let i = 0; i < 80; i++) {
      p.step(16.67, input);
      if (p.getBallState().isGrounded) {
        landed = true;
        break;
      }
    }
    assert(landed, `Ball landed cleanly after tap ${tap}`);
  }
}

// -----------------------------------------------------------------------------
// Scenario 9: Jump on moving platforms
// -----------------------------------------------------------------------------
console.log('\n--- Scenario 9: Jump on moving platforms ---');
{
  const movingPlat: PlatformData = {
    id: 'test_moving_plat',
    x: 400,
    y: 500,
    width: 250,
    height: 30,
    type: 'moving',
    moveRangeX: 100,
    moveSpeed: 1.5,
  };
  const p = new PhysicsWorld([movingPlat], 1000, 800, 400, 420);
  const input = new InputController();

  // Drop onto moving platform
  for (let i = 0; i < 60; i++) p.step(16.67, input);
  assert(p.getBallState().isGrounded, 'Ball grounded on moving platform');

  // Jump off moving platform
  input.setJump(true);
  p.step(16.67, input);
  const jumpVy = p.getBallState().vy;
  console.log(`  Jump vy from moving platform: ${jumpVy.toFixed(2)}`);
  assert(jumpVy < -10.0, 'Jump triggered cleanly off moving platform');
}

// -----------------------------------------------------------------------------
// Scenario 10: Jump on different ball forms
// -----------------------------------------------------------------------------
console.log('\n--- Scenario 10: Jump on different ball forms ---');
{
  const forms: Array<'original' | 'big' | 'stone' | 'snow'> = ['original', 'big', 'stone', 'snow'];

  for (const form of forms) {
    const p = new PhysicsWorld();
    const input = new InputController();
    p.setBallForm(form);

    for (let i = 0; i < 60; i++) p.step(16.67, input);
    assert(p.getBallState().isGrounded, `${form} ball is grounded`);

    input.setJump(true);
    p.step(16.67, input);
    const vy = p.getBallState().vy;
    const expectedJump = BALL_FORM_CONFIGS[form].jumpVelocity;
    // Step applies 1 frame of gravity (delta ~ 0.63)
    const expectedAfterStep = expectedJump + 0.63;
    console.log(`  ${form} form jump vy: ${vy.toFixed(2)} (expected initial: ${expectedJump}, after gravity step: ${expectedAfterStep.toFixed(2)})`);
    assert(Math.abs(vy - expectedAfterStep) < 0.2, `${form} ball jumped with exact calibrated velocity`);
  }
}

// -----------------------------------------------------------------------------
// Scenario 11: Pause and resume while a button is pressed
// -----------------------------------------------------------------------------
console.log('\n--- Scenario 11: Pause and resume while a button is pressed ---');
{
  const input = new InputController();
  input.setRight(true);
  input.setJump(true);
  assert(input.getState().rightPressed && input.getState().jumpPressed, 'Buttons active');

  // Simulate Pause: inputController.resetAll() is called by useGameLoop
  input.resetAll();
  const resetState = input.getState();
  assert(!resetState.leftPressed && !resetState.rightPressed && !resetState.jumpPressed, 'All inputs safely zeroed upon pause');

  // Resume: inputs remain 0 until player physically touches down again
  assert(input.getState().jumpPressed === false, 'Jump is not stuck after unpausing');
}

// -----------------------------------------------------------------------------
// Scenario 12: Test touch cancellation and multiple simultaneous fingers
// -----------------------------------------------------------------------------
console.log('\n--- Scenario 12: Test touch cancellation and multiple simultaneous fingers ---');
{
  const input = new InputController();

  // Finger 1 touches Left, Finger 2 touches Jump
  input.setLeft(true);
  input.setJump(true);
  assert(input.getState().leftPressed && input.getState().jumpPressed, 'Both Left and Jump active');

  // Finger 1 (Left) is cancelled (e.g. system notification or slide off)
  input.setLeft(false);
  assert(input.getState().leftPressed === false, 'Left released on cancel');
  assert(input.getState().jumpPressed === true, 'Jump remains active independently');

  // Finger 2 releases
  input.setJump(false);
  assert(input.getState().jumpPressed === false, 'Jump released');
}

console.log('\n🎉 ALL 12 REBUILT MOVEMENT, TOUCH & JUMP SCENARIOS PASSED WITH 100% SUCCESS!\n');
