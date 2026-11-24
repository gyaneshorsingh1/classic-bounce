import Matter from 'matter-js';
import { PhysicsWorld } from '../src/game/physics';
import { InputController } from '../src/controllers/InputController';
import {
  BALL_RADIUS,
  GROUND_Y,
  JUMP_VELOCITY,
  MOVE_SPEED,
  WORLD_HEIGHT,
  WORLD_WIDTH,
} from '../src/game/constants';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    process.exit(1);
  } else {
    console.log(`✅ PASSED: ${message}`);
  }
}

async function runTests() {
  console.log('--- STARTING BOUNCE BALL PHYSICS & GAMEPLAY SIMULATION TESTS ---');

  const physics = new PhysicsWorld();
  const input = new InputController();

  // TEST 1: Initial State
  const initialBall = physics.getBallState();
  console.log('Initial ball state:', initialBall);
  assert(initialBall.x === 140, 'Ball starts at designated initial X (140)');
  assert(initialBall.y === 480, 'Ball starts at designated initial Y (480)');
  assert(!initialBall.isGrounded, 'Ball is not grounded at start (in mid-air)');

  // TEST 2: Gravity & Ground Landing
  console.log('\n--- Simulating physics steps (falling onto ground under gravity)...');
  for (let i = 0; i < 90; i++) {
    physics.step(16.67, input);
  }

  const landedBall = physics.getBallState();
  console.log('Landed ball state:', landedBall);
  // Ground top is at GROUND_Y (560). Ball radius is 24. Expected resting Y ~ 560 - 24 = 536.
  assert(
    Math.abs(landedBall.y - (GROUND_Y - BALL_RADIUS)) < 3,
    `Ball rests securely on ground surface (y=${landedBall.y.toFixed(2)}, expected ~${GROUND_Y - BALL_RADIUS})`
  );
  assert(landedBall.isGrounded, 'Ball detects grounded status when resting on ground');

  // TEST 3: Right Movement & Rolling Animation
  console.log('\n--- Simulating Right movement (holding Right button for 30 steps)...');
  input.setRight(true);
  for (let i = 0; i < 30; i++) {
    physics.step(16.67, input);
  }
  input.setRight(false);

  const movingRightBall = physics.getBallState();
  console.log('Moving right ball state:', movingRightBall);
  assert(movingRightBall.x > initialBall.x + 50, 'Ball moved significantly to the right');
  assert(movingRightBall.vx > 0, 'Ball has positive horizontal velocity');
  assert(movingRightBall.angle > 0, 'Ball rotated clockwise (rolling animation)');

  // TEST 4: Deceleration
  console.log('\n--- Simulating coasting / deceleration (no keys held for 35 steps)...');
  for (let i = 0; i < 35; i++) {
    physics.step(16.67, input);
  }
  const stoppedBall = physics.getBallState();
  console.log('Stopped ball velocity:', stoppedBall.vx);
  assert(Math.abs(stoppedBall.vx) < 0.2, 'Ball decelerated naturally to a near complete stop');

  // TEST 5: Left Movement
  console.log('\n--- Simulating Left movement (holding Left button for 20 steps)...');
  const prevAngle = stoppedBall.angle;
  input.setLeft(true);
  for (let i = 0; i < 20; i++) {
    physics.step(16.67, input);
  }
  input.setLeft(false);
  const movingLeftBall = physics.getBallState();
  console.log('Moving left ball state:', movingLeftBall);
  assert(movingLeftBall.vx < 0, 'Ball has negative horizontal velocity moving left');
  assert(movingLeftBall.angle < prevAngle, 'Ball rotates counter-clockwise when rolling left');

  // Let ball settle back on ground
  for (let i = 0; i < 30; i++) {
    physics.step(16.67, input);
  }

  // TEST 6: Jumping Mechanics & Stretch Animation
  console.log('\n--- Simulating Jump while grounded...');
  assert(physics.getBallState().isGrounded, 'Ball is confirmed grounded before jump');
  input.setJump(true);
  physics.step(16.67, input);

  const jumpingBall = physics.getBallState();
  console.log('Jumping ball state:', jumpingBall);
  assert(jumpingBall.vy < -10, `Ball launched upward with jump velocity (vy=${jumpingBall.vy.toFixed(2)})`);
  assert(!jumpingBall.isGrounded, 'Ball is now airborne during jump');
  assert(jumpingBall.scaleY > 1.05, 'Ball stretched vertically on jump impulse');

  // TEST 7: Mid-Air Jump Prevention (No Double Jumps)
  console.log('\n--- Attempting mid-air jump (should be prevented)...');
  input.setJump(true);
  const vyBeforeAirJump = jumpingBall.vy;
  physics.step(16.67, input);
  const airJumpBall = physics.getBallState();
  assert(
    airJumpBall.vy > vyBeforeAirJump,
    'Mid-air jump attempt was rejected; ball continues normal trajectory under gravity'
  );

  // TEST 8: Floating Platform Landing & Squash Animation
  console.log('\n--- Testing landing on floating platform (x: 520, y: 430, width: 180, height: 28)...');
  const customPhysics = new PhysicsWorld();
  const customInput = new InputController();
  // @ts-ignore
  Matter.Body.setPosition(customPhysics.ball, { x: 520, y: 350 });
  // @ts-ignore
  Matter.Body.setVelocity(customPhysics.ball, { x: 0, y: 0 });

  for (let i = 0; i < 80; i++) {
    customPhysics.step(16.67, customInput);
  }

  const platformBall = customPhysics.getBallState();
  console.log('Ball resting on floating platform:', platformBall);
  // Platform top is at 430 - 14 = 416. Ball radius is 24. Expected resting Y = 416 - 24 = 392.
  assert(
    Math.abs(platformBall.y - 392) < 3,
    `Ball landed cleanly on floating platform top surface (y=${platformBall.y.toFixed(2)}, expected ~392)`
  );
  assert(platformBall.isGrounded, 'Ball detects grounded status on floating platform');

  // Ball can jump from floating platform
  customInput.setJump(true);
  customPhysics.step(16.67, customInput);
  const platformJumpBall = customPhysics.getBallState();
  assert(platformJumpBall.vy < -10, 'Ball successfully jumps from floating platform');

  console.log('\n🎉 ALL 8/8 SIMULATION AND PHYSICS TESTS PASSED PERFECTLY!\n');
}

runTests().catch((err) => {
  console.error(err);
  process.exit(1);
});
