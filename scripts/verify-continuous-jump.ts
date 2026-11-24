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
console.log('🧪 VERIFY CONTINUOUS JUMP WHILE HOLDING JUMP BUTTON');
console.log('================================================================\n');

// -----------------------------------------------------------------------------
// Test 1: Tap Jump once -> The ball jumps once and stays grounded upon landing
// -----------------------------------------------------------------------------
console.log('--- Test 1: Tap Jump once ---');
{
  const p = new PhysicsWorld();
  const input = new InputController();

  // Settle ball on ground
  for (let i = 0; i < 60; i++) p.step(16.67, input);
  assert(p.getBallState().isGrounded, 'Ball is grounded initially');

  // Tap Jump (press and release before landing)
  input.setJump(true);
  p.step(16.67, input);
  const initialJumpVy = p.getBallState().vy;
  console.log(`  Initial jump vy: ${initialJumpVy.toFixed(2)}`);
  assert(initialJumpVy < -10.0, 'Jump 1 triggered immediately on press');

  // Release jump button while airborne
  input.setJump(false);

  // Wait through flight until ball lands (approx 80-85 frames)
  for (let i = 0; i < 90; i++) p.step(16.67, input);

  // Wait an extra 20 frames for complete resting on ground
  for (let i = 0; i < 20; i++) p.step(16.67, input);

  const landedState = p.getBallState();
  console.log(`  After landing with button released: vy=${landedState.vy.toFixed(2)}, grounded=${landedState.isGrounded}`);
  assert(landedState.isGrounded, 'Ball settled on ground after tap');
  assert(landedState.vy > -5.0, 'Ball did NOT jump again (jumped exactly once)');
}

// -----------------------------------------------------------------------------
// Test 2: Hold Jump -> The ball repeatedly jumps after every landing
// -----------------------------------------------------------------------------
console.log('\n--- Test 2: Hold Jump continuously (repeated jumps after each landing) ---');
{
  const p = new PhysicsWorld();
  const input = new InputController();

  // Settle ball
  for (let i = 0; i < 60; i++) p.step(16.67, input);
  assert(p.getBallState().isGrounded, 'Ball grounded before holding Jump');

  // Press and HOLD Jump continuously
  input.setJump(true);

  // 1st Jump
  p.step(16.67, input);
  const jump1Vy = p.getBallState().vy;
  console.log(`  Jump 1 vy: ${jump1Vy.toFixed(2)}`);
  assert(jump1Vy < -10.0, 'Jump 1 triggered on initial hold');

  // Let ball travel through the air and track when Jump 2 triggers upon landing
  let jump2Triggered = false;
  let jump2Vy = 0;
  for (let i = 0; i < 80; i++) {
    p.step(16.67, input);
    const state = p.getBallState();
    // After descending, when it hits ground, it should trigger jump with vy < -10
    if (i > 30 && state.vy < -10.0) {
      jump2Triggered = true;
      jump2Vy = state.vy;
      console.log(`  Jump 2 automatically triggered at frame ${i} upon landing with vy=${jump2Vy.toFixed(2)}!`);
      break;
    }
  }
  assert(jump2Triggered, 'Jump 2 triggered automatically upon landing');

  // Continue holding through flight to verify Jump 3
  let jump3Triggered = false;
  let jump3Vy = 0;
  for (let i = 0; i < 80; i++) {
    p.step(16.67, input);
    const state = p.getBallState();
    if (i > 30 && state.vy < -10.0) {
      jump3Triggered = true;
      jump3Vy = state.vy;
      console.log(`  Jump 3 automatically triggered at frame ${i} upon landing with vy=${jump3Vy.toFixed(2)}!`);
      break;
    }
  }
  assert(jump3Triggered, 'Jump 3 triggered automatically upon landing');
}

// -----------------------------------------------------------------------------
// Test 3: Release Jump while airborne -> Ball lands normally without jumping again
// -----------------------------------------------------------------------------
console.log('\n--- Test 3: Release Jump while airborne ---');
{
  const p = new PhysicsWorld();
  const input = new InputController();

  for (let i = 0; i < 60; i++) p.step(16.67, input);

  // Hold jump to launch
  input.setJump(true);
  p.step(16.67, input);
  assert(p.getBallState().vy < -10.0, 'Ball launched into air');

  // Progress into mid-air flight (frame 20)
  for (let i = 0; i < 20; i++) p.step(16.67, input);
  assert(!p.getBallState().isGrounded, 'Ball is in mid-air');

  // Player releases Jump button while still airborne
  input.setJump(false);

  // Ball completes flight and lands
  for (let i = 0; i < 60; i++) p.step(16.67, input);

  const state = p.getBallState();
  console.log(`  State after landing: grounded=${state.isGrounded}, vy=${state.vy.toFixed(2)}`);
  assert(state.isGrounded, 'Ball is landed');
  assert(state.vy > -5.0, 'Ball landed cleanly without triggering another jump');
}

// -----------------------------------------------------------------------------
// Test 4: Hold Right + Jump -> Continuously moves right and jumps repeatedly
// -----------------------------------------------------------------------------
console.log('\n--- Test 4: Hold Right + Jump continuously ---');
{
  const p = new PhysicsWorld();
  const input = new InputController();

  for (let i = 0; i < 60; i++) p.step(16.67, input);
  const startX = p.getBallState().x;

  // Hold Right + Jump simultaneously
  input.setRight(true);
  input.setJump(true);

  // Step 1: initial jump
  p.step(16.67, input);
  assert(p.getBallState().vy < -10.0, 'Initial jump triggered with Right held');
  assert(p.getBallState().vx > 0.3, 'Horizontal movement started immediately');

  // Run through two complete jump cycles while holding Right + Jump
  let landingsCount = 0;
  for (let i = 0; i < 120; i++) {
    p.step(16.67, input);
    const b = p.getBallState();
    // Verify horizontal speed ramps up and is maintained
    if (i > 30) {
      assert(b.vx >= 4.0, `Speed maintained (vx=${b.vx.toFixed(2)})`);
    }
    if (i > 20 && b.vy < -10.0) {
      landingsCount++;
    }
  }

  const endX = p.getBallState().x;
  console.log(`  Ball traveled from x=${startX.toFixed(1)} to x=${endX.toFixed(1)} across repeated jumps`);
  assert(endX > startX + 500, 'Ball traversed continuous distance across repeated jumps');
  assert(landingsCount >= 2, `Ball successfully triggered multiple jumps (${landingsCount})`);
}

// -----------------------------------------------------------------------------
// Test 5: Hold Left + Jump -> Continuously moves left and jumps repeatedly
// -----------------------------------------------------------------------------
console.log('\n--- Test 5: Hold Left + Jump continuously ---');
{
  const p = new PhysicsWorld();
  const input = new InputController();

  // Position ball further right first
  for (let i = 0; i < 60; i++) p.step(16.67, input);
  input.setRight(true);
  for (let i = 0; i < 60; i++) p.step(16.67, input);
  input.setRight(false);
  for (let i = 0; i < 30; i++) p.step(16.67, input);

  const startX = p.getBallState().x;

  // Hold Left + Jump simultaneously
  input.setLeft(true);
  input.setJump(true);

  p.step(16.67, input);
  assert(p.getBallState().vy < -10.0, 'Jump triggered while holding Left');
  assert(p.getBallState().vx < -0.3, 'Left velocity active immediately');

  for (let i = 0; i < 80; i++) {
    p.step(16.67, input);
    const b = p.getBallState();
    if (i > 30) {
      assert(b.vx <= -4.0, `Leftward velocity maintained: vx=${b.vx.toFixed(2)}`);
    }
  }

  const endX = p.getBallState().x;
  console.log(`  Ball rolled left from x=${startX.toFixed(1)} to x=${endX.toFixed(1)}`);
  assert(endX < startX - 300, 'Ball moved significantly left across continuous jumps');
}

// -----------------------------------------------------------------------------
// Test 6: Hold Jump while landing on floating platform
// -----------------------------------------------------------------------------
console.log('\n--- Test 6: Hold Jump while landing on floating platform ---');
{
  const platforms = [
    { id: 'floor', x: 200, y: 560, width: 400, height: 40, type: 'ground' as const },
    { id: 'plat1', x: 350, y: 440, width: 200, height: 28, type: 'floating' as const },
  ];
  const p = new PhysicsWorld(platforms, 1000, 800, 350, 300);
  const input = new InputController();

  // Position ball above floating platform
  // Drop ball from above plat1 with Jump held
  input.setJump(true);

  // Let ball fall toward plat1
  let jumpedFromPlatform = false;
  for (let i = 0; i < 60; i++) {
    p.step(16.67, input);
    const b = p.getBallState();
    // Check if it triggered jump from platform top
    if (b.y < 420 && b.vy < -10.0) {
      jumpedFromPlatform = true;
      console.log(`  Ball triggered jump off floating platform: y=${b.y.toFixed(2)}, vy=${b.vy.toFixed(2)}`);
      break;
    }
  }
  assert(jumpedFromPlatform, 'Ball automatically jumped again upon landing on floating platform!');
}

console.log('\n🎉 ALL 6 CONTINUOUS JUMP WHILE HOLDING BUTTON TESTS PASSED WITH 100% SUCCESS!\n');
