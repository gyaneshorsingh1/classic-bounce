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

async function runSimultaneousControlTests() {
  console.log('--- STARTING SIMULTANEOUS MULTI-BUTTON CONTROLS TEST SUITE ---\n');

  // SCENARIO 1: Hold Right + Jump simultaneously
  console.log('SCENARIO 1: Hold Right + Jump simultaneously');
  {
    const physics = new PhysicsWorld();
    // Drop to ground
    for (let i = 0; i < 90; i++) physics.step(16.67, { left: false, right: false, jump: false });
    assert(physics.getBallState().isGrounded, 'Ball is landed on ground');

    // Trigger Right + Jump at the exact same moment
    const input: InputState = { left: false, right: true, jump: true };
    physics.step(16.67, input);

    const ball = physics.getBallState();
    console.log('  Ball state (Right + Jump):', { vx: ball.vx, vy: ball.vy, grounded: ball.isGrounded });
    assert(ball.vy < -10, `Ball launched upward with jump velocity (vy=${ball.vy.toFixed(2)})`);
    assert(ball.vx > 0.3, `Ball accelerated horizontally to the right (vx=${ball.vx.toFixed(2)})`);
    assert(!ball.isGrounded, 'Ball is airborne');

    // Continue holding Right in mid-air for 15 steps
    for (let i = 0; i < 15; i++) {
      physics.step(16.67, { left: false, right: true, jump: false });
    }
    const airBall = physics.getBallState();
    assert(airBall.vx > 2.0, `Horizontal speed maintained in mid-air (vx=${airBall.vx.toFixed(2)})`);
  }

  // SCENARIO 2: Hold Left + Jump simultaneously
  console.log('\nSCENARIO 2: Hold Left + Jump simultaneously');
  {
    const physics = new PhysicsWorld();
    for (let i = 0; i < 90; i++) physics.step(16.67, { left: false, right: false, jump: false });

    const input: InputState = { left: true, right: false, jump: true };
    physics.step(16.67, input);

    const ball = physics.getBallState();
    console.log('  Ball state (Left + Jump):', { vx: ball.vx, vy: ball.vy, grounded: ball.isGrounded });
    assert(ball.vy < -10, `Ball launched upward with jump velocity (vy=${ball.vy.toFixed(2)})`);
    assert(ball.vx < -0.3, `Ball accelerated horizontally to the left (vx=${ball.vx.toFixed(2)})`);
  }

  // SCENARIO 3: Hold Right continuously while jumping multiple times after landing
  console.log('\nSCENARIO 3: Hold Right continuously while jumping multiple times after landing');
  {
    const physics = new PhysicsWorld();
    for (let i = 0; i < 90; i++) physics.step(16.67, { left: false, right: false, jump: false });

    // Hold Right continuously
    const input: InputState = { left: false, right: true, jump: true };
    physics.step(16.67, input);
    assert(physics.getBallState().vx > 0.3, 'First jump launched with horizontal speed');

    // Fly through the air until landing (holding Right the entire time)
    let steps = 0;
    while (!physics.getBallState().isGrounded && steps < 120) {
      physics.step(16.67, { left: false, right: true, jump: false });
      steps++;
    }
    assert(physics.getBallState().isGrounded, `Landed after ${steps} steps`);
    assert(physics.getBallState().vx > 4.0, `Maintained forward momentum upon landing (vx=${physics.getBallState().vx.toFixed(2)})`);

    // Jump a second time while still holding Right
    physics.step(16.67, { left: false, right: true, jump: true });
    const secondJumpBall = physics.getBallState();
    assert(secondJumpBall.vy < -10, 'Second jump successfully triggered from ground');
    assert(secondJumpBall.vx > 4.0, 'Horizontal momentum preserved through second jump');
  }

  // SCENARIO 4: Change direction while airborne
  console.log('\nSCENARIO 4: Change direction while airborne');
  {
    const physics = new PhysicsWorld();
    for (let i = 0; i < 90; i++) physics.step(16.67, { left: false, right: false, jump: false });

    // Jump moving Right
    physics.step(16.67, { left: false, right: true, jump: true });
    assert(physics.getBallState().vx > 0, 'Ball moving right initially');

    // Switch to Left while in mid-air
    for (let i = 0; i < 18; i++) {
      physics.step(16.67, { left: true, right: false, jump: false });
    }
    const turnedBall = physics.getBallState();
    console.log('  Ball state after air steering:', { vx: turnedBall.vx, vy: turnedBall.vy });
    assert(turnedBall.vx < -2.0, `Ball reversed direction in mid-air (vx=${turnedBall.vx.toFixed(2)})`);
  }

  // SCENARIO 5: Release Jump while continuing to hold Right
  console.log('\nSCENARIO 5: Release Jump while continuing to hold Right');
  {
    const physics = new PhysicsWorld();
    for (let i = 0; i < 90; i++) physics.step(16.67, { left: false, right: false, jump: false });

    // Jump with Right held
    physics.step(16.67, { left: false, right: true, jump: true });

    // Simulate releasing Jump (jump button released, right remains held)
    for (let i = 0; i < 12; i++) {
      physics.step(16.67, { left: false, right: true, jump: false });
    }
    const continuingBall = physics.getBallState();
    assert(continuingBall.vx > 2.0, `Releasing jump did NOT affect holding Right (vx=${continuingBall.vx.toFixed(2)})`);
  }

  // SCENARIO 6: Release Right while continuing to hold Jump
  console.log('\nSCENARIO 6: Release Right while continuing to hold Jump');
  {
    const physics = new PhysicsWorld();
    for (let i = 0; i < 90; i++) physics.step(16.67, { left: false, right: false, jump: false });

    // Build right speed and jump
    for (let i = 0; i < 10; i++) physics.step(16.67, { left: false, right: true, jump: false });
    physics.step(16.67, { left: false, right: true, jump: true });
    const initialVx = physics.getBallState().vx;

    // Release Right while keeping Jump pressed
    for (let i = 0; i < 15; i++) {
      physics.step(16.67, { left: false, right: false, jump: true });
    }
    const coastingBall = physics.getBallState();
    console.log('  Coasting ball velocity:', coastingBall.vx, 'vs initial:', initialVx);
    assert(coastingBall.vx > initialVx * 0.7, 'Horizontal velocity coasts smoothly in mid-air without abrupt halt');
  }

  console.log('\n🎉 ALL 6/6 SIMULTANEOUS CONTROLS SCENARIOS PASSED WITH FLYING COLORS!\n');
}

runSimultaneousControlTests().catch((err) => {
  console.error(err);
  process.exit(1);
});
