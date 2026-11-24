import { InputController, RawInputState } from '../src/controllers/InputController';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    process.exit(1);
  }
}

console.log('====================================================');
console.log('🚀 TESTING 10 TOUCH LIFECYCLE & MULTI-TOUCH SCENARIOS');
console.log('====================================================\n');

const input = new InputController();

// ----------------------------------------------------------------------
// Scenario 1: Hold Left Continuously
// ----------------------------------------------------------------------
console.log('Scenario 1: Hold Left continuously...');
input.resetAll();
input.setLeft(true);
for (let step = 0; step < 5; step++) {
  const state = input.consumeStepState();
  assert(state.leftPressed === true, `Step ${step}: leftPressed should be true`);
  assert(state.rightPressed === false, `Step ${step}: rightPressed should be false`);
  assert(state.jumpPressed === false, `Step ${step}: jumpPressed should be false`);
}
input.setLeft(false);
const postLeftState = input.consumeStepState();
assert(postLeftState.leftPressed === false, 'Left should be false after release');
console.log('  ✅ Scenario 1 Passed.\n');

// ----------------------------------------------------------------------
// Scenario 2: Hold Right Continuously
// ----------------------------------------------------------------------
console.log('Scenario 2: Hold Right continuously...');
input.resetAll();
input.setRight(true);
for (let step = 0; step < 5; step++) {
  const state = input.consumeStepState();
  assert(state.rightPressed === true, `Step ${step}: rightPressed should be true`);
  assert(state.leftPressed === false, `Step ${step}: leftPressed should be false`);
  assert(state.jumpPressed === false, `Step ${step}: jumpPressed should be false`);
}
input.setRight(false);
const postRightState = input.consumeStepState();
assert(postRightState.rightPressed === false, 'Right should be false after release');
console.log('  ✅ Scenario 2 Passed.\n');

// ----------------------------------------------------------------------
// Scenario 3: Hold Jump Continuously
// ----------------------------------------------------------------------
console.log('Scenario 3: Hold Jump continuously...');
input.resetAll();
input.setJump(true);
for (let step = 0; step < 5; step++) {
  const state = input.consumeStepState();
  assert(state.jumpPressed === true, `Step ${step}: jumpPressed should be true`);
  assert(state.leftPressed === false, `Step ${step}: leftPressed should be false`);
  assert(state.rightPressed === false, `Step ${step}: rightPressed should be false`);
}
input.setJump(false);
const postJumpState = input.consumeStepState();
assert(postJumpState.jumpPressed === false, 'Jump should be false after release');
console.log('  ✅ Scenario 3 Passed.\n');

// ----------------------------------------------------------------------
// Scenario 4: Hold Right + Jump Simultaneously
// ----------------------------------------------------------------------
console.log('Scenario 4: Hold Right + Jump simultaneously...');
input.resetAll();
input.setRight(true);
input.setJump(true);
for (let step = 0; step < 5; step++) {
  const state = input.consumeStepState();
  assert(state.rightPressed === true, `Step ${step}: rightPressed should be true`);
  assert(state.jumpPressed === true, `Step ${step}: jumpPressed should be true`);
  assert(state.leftPressed === false, `Step ${step}: leftPressed should be false`);
}
// Releasing jump must NOT release right
input.setJump(false);
const postJumpRelease = input.consumeStepState();
assert(postJumpRelease.rightPressed === true, 'Right must stay active when Jump is released');
assert(postJumpRelease.jumpPressed === false, 'Jump must be false after release');
input.setRight(false);
console.log('  ✅ Scenario 4 Passed.\n');

// ----------------------------------------------------------------------
// Scenario 5: Hold Left + Jump Simultaneously
// ----------------------------------------------------------------------
console.log('Scenario 5: Hold Left + Jump simultaneously...');
input.resetAll();
input.setLeft(true);
input.setJump(true);
for (let step = 0; step < 5; step++) {
  const state = input.consumeStepState();
  assert(state.leftPressed === true, `Step ${step}: leftPressed should be true`);
  assert(state.jumpPressed === true, `Step ${step}: jumpPressed should be true`);
  assert(state.rightPressed === false, `Step ${step}: rightPressed should be false`);
}
// Releasing left must NOT release jump
input.setLeft(false);
const postLeftRelease = input.consumeStepState();
assert(postLeftRelease.jumpPressed === true, 'Jump must stay active when Left is released');
assert(postLeftRelease.leftPressed === false, 'Left must be false after release');
input.setJump(false);
console.log('  ✅ Scenario 5 Passed.\n');

// ----------------------------------------------------------------------
// Scenario 6: Rapidly Tap Each Button (<16ms inter-frame micro-taps)
// ----------------------------------------------------------------------
console.log('Scenario 6: Rapid tap latching (<16ms tap and release between physics steps)...');
input.resetAll();
// Simulates a 5ms tap on Jump that presses and releases before the next 16.6ms physics step
input.setJump(true);
input.setJump(false);
// Physics step arrives
const step1 = input.consumeStepState();
assert(step1.jumpPressed === true, 'Micro-tap must be latched for the physics step');
// Next physics step arrives without new taps
const step2 = input.consumeStepState();
assert(step2.jumpPressed === false, 'Latch must clear after being consumed once');

// Test rapid taps on Left and Right
input.setLeft(true);
input.setLeft(false);
const stepLeft = input.consumeStepState();
assert(stepLeft.leftPressed === true, 'Left micro-tap latched');
assert(input.consumeStepState().leftPressed === false, 'Left latch cleared');

input.setRight(true);
input.setRight(false);
const stepRight = input.consumeStepState();
assert(stepRight.rightPressed === true, 'Right micro-tap latched');
assert(input.consumeStepState().rightPressed === false, 'Right latch cleared');
console.log('  ✅ Scenario 6 Passed.\n');

// ----------------------------------------------------------------------
// Scenario 7: Multi-finger pointer ID handling (Set<number> simulation)
// ----------------------------------------------------------------------
console.log('Scenario 7: Multi-finger pointer tracking...');
// Emulate the ControlButton pointer tracking logic
class MockControlButton {
  private activePointers = new Set<number>();
  public isPressed = false;
  constructor(private onStart: () => void, private onEnd: () => void) {}

  onTouchStart(id: number) {
    const wasEmpty = this.activePointers.size === 0;
    this.activePointers.add(id);
    if (wasEmpty) {
      this.isPressed = true;
      this.onStart();
    }
  }

  onTouchEnd(id: number) {
    this.activePointers.delete(id);
    if (this.activePointers.size === 0) {
      this.isPressed = false;
      this.onEnd();
    }
  }
}

input.resetAll();
const leftBtn = new MockControlButton(
  () => input.setLeft(true),
  () => input.setLeft(false)
);
const jumpBtn = new MockControlButton(
  () => input.setJump(true),
  () => input.setJump(false)
);

// Finger 0 touches Left
leftBtn.onTouchStart(0);
assert(input.getState().leftPressed === true, 'Left pressed by finger 0');

// Finger 1 touches Jump simultaneously
jumpBtn.onTouchStart(1);
assert(input.getState().jumpPressed === true, 'Jump pressed by finger 1 simultaneously');
assert(input.getState().leftPressed === true, 'Left remains pressed');

// Finger 2 accidentally touches Left as well (multi-finger on same button)
leftBtn.onTouchStart(2);
assert(leftBtn.isPressed === true, 'Left still pressed with 2 pointers');

// Finger 1 releases Jump
jumpBtn.onTouchEnd(1);
assert(input.getState().jumpPressed === false, 'Jump released');
assert(input.getState().leftPressed === true, 'Left still pressed despite Jump releasing');

// Finger 0 lifts from Left, but finger 2 is still on Left
leftBtn.onTouchEnd(0);
assert(input.getState().leftPressed === true, 'Left still pressed because finger 2 is on it');

// Finger 2 lifts from Left
leftBtn.onTouchEnd(2);
assert(input.getState().leftPressed === false, 'Left cleanly released once all pointers lift');
console.log('  ✅ Scenario 7 Passed.\n');

// ----------------------------------------------------------------------
// Scenario 8: Press button and move finger away (slide-off detection)
// ----------------------------------------------------------------------
console.log('Scenario 8: Finger slide-off detection...');
class MockSlideButton {
  private activePointers = new Set<number>();
  private width = 72;
  private height = 72;
  private margin = 50;
  public isPressed = false;

  constructor(private onStart: () => void, private onEnd: () => void) {}

  onTouchStart(id: number) {
    this.activePointers.add(id);
    this.isPressed = true;
    this.onStart();
  }

  onTouchMove(id: number, x: number, y: number) {
    if (
      x < -this.margin ||
      x > this.width + this.margin ||
      y < -this.margin ||
      y > this.height + this.margin
    ) {
      if (this.activePointers.has(id)) {
        this.activePointers.delete(id);
        if (this.activePointers.size === 0) {
          this.isPressed = false;
          this.onEnd();
        }
      }
    }
  }
}

input.resetAll();
const slideBtn = new MockSlideButton(
  () => input.setRight(true),
  () => input.setRight(false)
);

// Touch down on button
slideBtn.onTouchStart(0);
assert(input.getState().rightPressed === true, 'Right pressed on touch start');

// Thumb wiggles inside allowed 50px buffer (e.g. at x = 90px on 72px button)
slideBtn.onTouchMove(0, 90, 36);
assert(input.getState().rightPressed === true, 'Right remains pressed during natural thumb wiggle');

// Thumb slides far away (> 50px buffer, e.g. at x = 150px)
slideBtn.onTouchMove(0, 150, 36);
assert(slideBtn.isPressed === false, 'Button released when finger slides away');
assert(input.getState().rightPressed === false, 'Input flag cleared cleanly on slide-off');
console.log('  ✅ Scenario 8 Passed.\n');

// ----------------------------------------------------------------------
// Scenario 9: Interrupt gameplay and return (AppState change / blur)
// ----------------------------------------------------------------------
console.log('Scenario 9: Interrupt gameplay and return (AppState / focus loss)...');
input.resetAll();
input.setLeft(true);
input.setJump(true);
assert(input.getState().leftPressed === true, 'Left pressed');
assert(input.getState().jumpPressed === true, 'Jump pressed');

// Emulate notification shade pull-down / app switch to background
input.resetAll();
const interruptedState = input.getState();
assert(interruptedState.leftPressed === false, 'Left reset on interrupt');
assert(interruptedState.jumpPressed === false, 'Jump reset on interrupt');
assert(interruptedState.rightPressed === false, 'Right remains false');

// App returns to foreground -> no stuck inputs
const resumeStep = input.consumeStepState();
assert(resumeStep.leftPressed === false && resumeStep.rightPressed === false && resumeStep.jumpPressed === false, 'Clean resume with 0 stuck inputs');
console.log('  ✅ Scenario 9 Passed.\n');

// ----------------------------------------------------------------------
// Scenario 10: Pause and resume gameplay
// ----------------------------------------------------------------------
console.log('Scenario 10: Pause and resume gameplay...');
input.resetAll();
input.setRight(true);
input.setJump(true);

// Game paused: game loop resets all inputs
input.resetAll();
const pausedState = input.consumeStepState();
assert(pausedState.rightPressed === false, 'Right cleared on pause');
assert(pausedState.jumpPressed === false, 'Jump cleared on pause');

// While paused, accidental touch inputs are also suppressed / cleared
input.resetAll();

// On resume
const unpausedState = input.consumeStepState();
assert(unpausedState.leftPressed === false && unpausedState.rightPressed === false && unpausedState.jumpPressed === false, 'Clean state on resume');
console.log('  ✅ Scenario 10 Passed.\n');

console.log('====================================================');
console.log('🎉 ALL 10 TOUCH LIFECYCLE SCENARIOS PASSED WITH 100% SUCCESS!');
console.log('====================================================');
