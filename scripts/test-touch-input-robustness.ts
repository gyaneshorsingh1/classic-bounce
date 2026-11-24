import { InputController, RawInputState } from '../src/controllers/InputController';
import { PlayerController } from '../src/controllers/PlayerController';
import { BALL_FORM_CONFIGS } from '../src/game/ballConfigs';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    process.exit(1);
  }
}

console.log('--- STARTING TOUCH INPUT & PHYSICS CONTROLLER ROBUSTNESS TESTS ---');

// Test 1: Independent Button States & Simultaneous Multi-Touch
{
  console.log('\n[Test 1] Independent Pointer & Simultaneous Multi-Touch...');
  const input = new InputController();

  // Initially all false
  let state = input.getState();
  assert(!state.leftPressed && !state.rightPressed && !state.jumpPressed, 'Initial state must be all false');

  // Finger 0 presses Left
  input.press('left', 0);
  state = input.getState();
  assert(state.leftPressed && !state.rightPressed && !state.jumpPressed, 'Left must be true');

  // Finger 1 presses Jump simultaneously
  input.press('jump', 1);
  state = input.getState();
  assert(state.leftPressed && !state.rightPressed && state.jumpPressed, 'Both Left and Jump must be true');

  // Finger 0 releases Left
  input.release('left', 0);
  state = input.getState();
  assert(!state.leftPressed && !state.rightPressed && state.jumpPressed, 'Left released, Jump must remain true');

  // Finger 1 releases Jump
  input.release('jump', 1);
  state = input.getState();
  assert(!state.leftPressed && !state.rightPressed && !state.jumpPressed, 'All released');

  console.log('✓ Passed: Left + Jump multi-touch independently tracked');
}

// Test 2: Multi-Finger on Same Control (Two thumbs or rapid double tap)
{
  console.log('\n[Test 2] Multi-Finger on Same Control...');
  const input = new InputController();

  // Finger 0 presses Jump
  input.press('jump', 0);
  assert(input.getState().jumpPressed, 'Jump pressed by finger 0');

  // Finger 1 also touches Jump
  input.press('jump', 1);
  assert(input.getState().jumpPressed, 'Jump pressed by fingers 0 and 1');

  // Finger 0 lifts
  input.release('jump', 0);
  assert(input.getState().jumpPressed, 'Jump must STILL be pressed because finger 1 is held');

  // Finger 1 lifts
  input.release('jump', 1);
  assert(!input.getState().jumpPressed, 'Jump released after both fingers lift');

  console.log('✓ Passed: Releasing one finger does not cancel another active finger on the same button');
}

// Test 3: Left + Right Opposing Controls
{
  console.log('\n[Test 3] Left + Right Opposing Controls & Kinematics...');
  const input = new InputController();
  const player = new PlayerController();
  const config = BALL_FORM_CONFIGS.original;

  // Finger 0 on Left, Finger 1 on Right
  input.press('left', 0);
  input.press('right', 1);
  let state = input.getState();
  assert(state.leftPressed && state.rightPressed, 'Both Left and Right pressed');

  // In PlayerController, Left + Right must cancel to neutral (0)
  let vx = player.computeHorizontalVelocity(0, true, state, config);
  assert(vx === 0, `Left + Right must result in vx = 0, got ${vx}`);

  // If moving right and both pressed, should apply rolling friction towards 0
  vx = player.computeHorizontalVelocity(3.0, true, state, config);
  assert(vx < 3.0, `Left + Right should apply damping to current velocity, got ${vx}`);

  // Releasing Left should immediately move Right
  input.release('left', 0);
  state = input.getState();
  assert(!state.leftPressed && state.rightPressed, 'Only Right pressed now');
  vx = player.computeHorizontalVelocity(0, true, state, config);
  assert(vx > 0, `Right press should accelerate positively, got ${vx}`);

  console.log('✓ Passed: Opposing directional controls neutralize cleanly');
}

// Test 4: Sub-Frame Tap Latching
{
  console.log('\n[Test 4] Sub-frame Tap Latching...');
  const input = new InputController();

  // Press and release within 1ms (sub-frame tap)
  input.press('jump', 0);
  input.release('jump', 0);

  // Real-time state is false
  assert(!input.getState().jumpPressed, 'Real-time state is false after release');

  // But consumeStepState for the 60fps physics step must catch the tap
  const stepState = input.consumeStepState();
  assert(stepState.jumpPressed, 'consumeStepState must catch sub-frame tap via latchedJump');

  // Next physics step should have consumed the latch
  const nextStep = input.consumeStepState();
  assert(!nextStep.jumpPressed, 'Next step must NOT repeat the tap');

  console.log('✓ Passed: Sub-frame tap caught exactly once without duplicate actions');
}

// Test 5: Single Tap Jump Lifecycle with PlayerController
{
  console.log('\n[Test 5] Single Tap Jump Lifecycle...');
  const player = new PlayerController();
  const config = BALL_FORM_CONFIGS.original;

  // Step 1: Ball on ground, player taps Jump
  let res = player.computeVerticalVelocity(0, true, { leftPressed: false, rightPressed: false, jumpPressed: true }, config);
  assert(res.didJump && res.vy === config.jumpVelocity, 'Must jump on initial tap');

  // Step 2: Ball is now airborne, player releases Jump while in mid-air
  res = player.computeVerticalVelocity(-8, false, { leftPressed: false, rightPressed: false, jumpPressed: false }, config);
  assert(!res.didJump, 'Must not jump while airborne');

  // Step 3: Ball lands on platform (transition from air to ground, jumpPressed = false)
  res = player.computeVerticalVelocity(1.0, true, { leftPressed: false, rightPressed: false, jumpPressed: false }, config);
  assert(!res.didJump, 'Must NOT jump on landing after a single tap');

  // Step 4: Ball resting on ground, player taps again
  res = player.computeVerticalVelocity(0, true, { leftPressed: false, rightPressed: false, jumpPressed: true }, config);
  assert(res.didJump, 'Second tap must jump cleanly');

  console.log('✓ Passed: Single tap produces exactly 1 jump, releasing airborne prevents re-jumping on landing');
}

// Test 6: Continuous Hold Jump Lifecycle with PlayerController
{
  console.log('\n[Test 6] Continuous Hold Jump Lifecycle...');
  const player = new PlayerController();
  const config = BALL_FORM_CONFIGS.original;
  const holdInput: RawInputState = { leftPressed: false, rightPressed: false, jumpPressed: true };

  // Jump 1: Grounded + hold -> jumps!
  let res = player.computeVerticalVelocity(0, true, holdInput, config);
  assert(res.didJump, 'First jump must trigger');

  // Airborne frames (should NOT jump mid-air even though jump is held)
  for (let i = 0; i < 10; i++) {
    res = player.computeVerticalVelocity(-5 + i, false, holdInput, config);
    assert(!res.didJump, `Must not jump during airborne frame ${i}`);
  }

  // Lands on ground with jump STILL HELD -> immediately triggers jump 2!
  res = player.computeVerticalVelocity(2.0, true, holdInput, config);
  assert(res.didJump, 'Must trigger immediate second jump upon landing while jump is held');

  // Airborne again
  res = player.computeVerticalVelocity(-8, false, holdInput, config);
  assert(!res.didJump, 'Airborne again, no mid-air jump');

  // Lands on ground with jump STILL HELD -> triggers jump 3!
  res = player.computeVerticalVelocity(2.0, true, holdInput, config);
  assert(res.didJump, 'Must trigger consecutive jump 3 upon landing');

  // Release jump now
  res = player.computeVerticalVelocity(-8, false, { leftPressed: false, rightPressed: false, jumpPressed: false }, config);
  assert(!res.didJump, 'Airborne release');

  // Lands after release -> NO jump!
  res = player.computeVerticalVelocity(2.0, true, { leftPressed: false, rightPressed: false, jumpPressed: false }, config);
  assert(!res.didJump, 'Must stop jumping on landing after release');

  console.log('✓ Passed: Continuous hold re-triggers immediately on landing until released');
}

// Test 7: Touch Cancellation & resetAll Fail-Safes
{
  console.log('\n[Test 7] Touch Cancellation & resetAll...');
  const input = new InputController();

  // Multiple buttons pressed by different pointers
  input.press('left', 0);
  input.press('jump', 1);
  assert(input.getState().leftPressed && input.getState().jumpPressed, 'Left and Jump pressed');

  // releasePointer for pointer 0 (e.g. system gesture stole left finger)
  input.releasePointer(0);
  assert(!input.getState().leftPressed, 'Left released after pointer 0 release');
  assert(input.getState().jumpPressed, 'Jump still active on pointer 1');

  // App loses focus or goes to background -> resetAll()
  input.resetAll();
  const resetState = input.getState();
  assert(!resetState.leftPressed && !resetState.rightPressed && !resetState.jumpPressed, 'All zeroed after resetAll');
  const consumed = input.consumeStepState();
  assert(!consumed.leftPressed && !consumed.rightPressed && !consumed.jumpPressed, 'Consumed state zeroed');

  console.log('✓ Passed: Pointer cancellation and resetAll flush all active inputs');
}

// Test 8: Diagnostics & Latency Tracking
{
  console.log('\n[Test 8] Diagnostics & Latency Tracking...');
  const input = new InputController();
  input.enableDiagnostics(true);
  assert(input.isDiagnosticsEnabled(), 'Diagnostics enabled');

  // Press Left
  input.press('left', 'thumb-1');
  // Press Jump
  input.press('jump', 'thumb-2');

  const diagsBeforeConsume = input.getDiagnostics();
  assert(diagsBeforeConsume.length === 2, `Expected 2 events, got ${diagsBeforeConsume.length}`);
  assert(diagsBeforeConsume[0].control === 'left' && diagsBeforeConsume[0].pointerId === 'thumb-1', 'Event 0 correct');
  assert(diagsBeforeConsume[1].control === 'jump' && diagsBeforeConsume[1].pointerId === 'thumb-2', 'Event 1 correct');
  assert(diagsBeforeConsume[0].consumedTimestamp === undefined, 'Not consumed yet');

  // Simulate game loop consuming state 10ms later
  const consumed = input.consumeStepState();
  assert(consumed.leftPressed && consumed.jumpPressed, 'Consumed both');

  const diagsAfterConsume = input.getDiagnostics();
  assert(diagsAfterConsume[0].consumedTimestamp !== undefined, 'Consumed timestamp recorded');
  assert(typeof diagsAfterConsume[0].latencyMs === 'number', 'Latency in ms calculated');
  console.log(`Measured simulated touch latency: ${diagsAfterConsume[0].latencyMs}ms`);

  // Disable diagnostics
  input.enableDiagnostics(false);
  assert(!input.isDiagnosticsEnabled() && input.getDiagnostics().length === 0, 'Diagnostics disabled and cleared');

  console.log('✓ Passed: Diagnostics captures touch timestamps, IDs, states, and game loop latency');
}

console.log('\n🎉 ALL TOUCH INPUT & PHYSICS CONTROLLER ROBUSTNESS TESTS PASSED PERFECTLY!\n');
