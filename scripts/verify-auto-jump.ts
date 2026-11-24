import { PhysicsWorld } from '../src/game/physics';
import { InputState } from '../src/types/game';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    process.exit(1);
  } else {
    console.log(`✅ PASSED: ${message}`);
  }
}

async function runAutoJumpTests() {
  console.log('--- STARTING CONTINUOUS AUTO-JUMP & JUMP BUFFERING TESTS ---\n');

  // TEST 1: Holding Jump continuously triggers automatic jumps on every landing
  console.log('TEST 1: Holding Jump continuously triggers automatic jumps on every landing');
  {
    const physics = new PhysicsWorld();
    // Drop to ground
    for (let i = 0; i < 90; i++) physics.step(16.67, { left: false, right: false, jump: false });
    assert(physics.getBallState().isGrounded, 'Ball is landed on ground');

    // Hold Jump continuously
    const holdJumpInput: InputState = { left: false, right: false, jump: true };

    // Step 1: First Jump launches
    physics.step(16.67, holdJumpInput);
    const jump1 = physics.getBallState();
    console.log('  Jump 1 launched:', { vy: jump1.vy.toFixed(2), grounded: jump1.isGrounded });
    assert(jump1.vy < -10, 'Jump 1 launched with upward velocity');
    assert(!jump1.isGrounded, 'Ball is airborne');

    // Step forward until landing and auto-jump 2 triggers
    let autoJump2Triggered = false;
    let stepCount = 0;
    for (let i = 0; i < 80; i++) {
      physics.step(16.67, holdJumpInput);
      const b = physics.getBallState();
      if (i > 30 && b.vy < -11) {
        autoJump2Triggered = true;
        stepCount = i;
        console.log(`  Auto-Jump 2 triggered on landing at step ${i}: vy=${b.vy.toFixed(2)}`);
        break;
      }
    }
    assert(autoJump2Triggered, `Auto-Jump 2 launched automatically upon landing (step ${stepCount}) without needing another click!`);

    // Step forward until landing and auto-jump 3 triggers
    let autoJump3Triggered = false;
    for (let i = 0; i < 80; i++) {
      physics.step(16.67, holdJumpInput);
      const b = physics.getBallState();
      if (i > 30 && b.vy < -11) {
        autoJump3Triggered = true;
        console.log(`  Auto-Jump 3 triggered on 2nd landing at step ${i}: vy=${b.vy.toFixed(2)}`);
        break;
      }
    }
    assert(autoJump3Triggered, 'Auto-Jump 3 launched automatically upon 2nd landing without needing another click!');
  }

  // TEST 2: Jump Buffering (Clicking Jump in mid-air right before landing)
  console.log('\nTEST 2: Jump Buffering (Clicking Jump in mid-air right before touchdown)');
  {
    const physics = new PhysicsWorld();
    for (let i = 0; i < 90; i++) physics.step(16.67, { left: false, right: false, jump: false });

    // Single jump
    physics.step(16.67, { left: false, right: false, jump: true });
    assert(!physics.getBallState().isGrounded, 'Ball is in mid-air');

    // Fall until close to ground (~68 steps, within ~180ms of landing)
    for (let i = 0; i < 68; i++) {
      physics.step(16.67, { left: false, right: false, jump: false });
    }
    assert(!physics.getBallState().isGrounded, 'Ball is still falling towards the ground');

    // User taps/clicks Jump button in mid-air (tap and release)
    physics.step(16.67, { left: false, right: false, jump: true });
    physics.step(16.67, { left: false, right: false, jump: false });

    // Step until landing (within remaining ~10 steps)
    let bufferedJumpTriggered = false;
    for (let i = 0; i < 25; i++) {
      physics.step(16.67, { left: false, right: false, jump: false });
      const b = physics.getBallState();
      if (b.vy < -11) {
        bufferedJumpTriggered = true;
        console.log(`  Buffered jump triggered upon landing at step ${i}: vy=${b.vy.toFixed(2)}`);
        break;
      }
    }

    assert(bufferedJumpTriggered, 'Pre-landing click was buffered and auto-triggered jump immediately upon landing!');
  }

  // TEST 3: Releasing Jump stops auto-jumping
  console.log('\nTEST 3: Releasing Jump stops auto-jumping when landing');
  {
    const physics = new PhysicsWorld();
    for (let i = 0; i < 90; i++) physics.step(16.67, { left: false, right: false, jump: false });

    // Jump once
    physics.step(16.67, { left: false, right: false, jump: true });

    // Release jump immediately and let ball land and settle on ground (~110 steps)
    for (let i = 0; i < 110; i++) {
      physics.step(16.67, { left: false, right: false, jump: false });
    }

    const settledBall = physics.getBallState();
    console.log('  Settled ball state:', { vy: settledBall.vy.toFixed(2), grounded: settledBall.isGrounded });
    assert(settledBall.isGrounded, 'Ball settled calmly on ground');
    assert(Math.abs(settledBall.vy) < 0.5, 'Ball did NOT jump because Jump button was released');
  }

  console.log('\n🎉 ALL AUTO-JUMP & JUMP BUFFERING TESTS PASSED PERFECTLY!\n');
}

runAutoJumpTests().catch((err) => {
  console.error(err);
  process.exit(1);
});
