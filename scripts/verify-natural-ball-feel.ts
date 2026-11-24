import { BALL_FORM_CONFIGS } from '../src/game/ballConfigs';
import { PlayerController } from '../src/controllers/PlayerController';
import { InputController } from '../src/controllers/InputController';
import { PhysicsWorld } from '../src/game/physics';
import { LEVEL_PLATFORMS, WORLD_WIDTH, WORLD_HEIGHT } from '../src/game/constants';

function assert(condition: boolean, msg: string) {
  if (!condition) {
    console.error(`❌ FAILED: ${msg}`);
    process.exit(1);
  }
  console.log(`✅ PASSED: ${msg}`);
}

console.log('================================================================');
console.log('⚽ VERIFY NATURAL BALL MOVEMENT & KINEMATICS ACROSS ALL FORMS');
console.log('================================================================\n');

const controller = new PlayerController();

// -----------------------------------------------------------------------------
// Test 1: Original Red Ball - Natural Rolling Acceleration & Inertia
// -----------------------------------------------------------------------------
console.log('--- Test 1: Original Red Ball Natural Rolling Acceleration ---');
{
  const config = BALL_FORM_CONFIGS.original;
  let vx = 0;
  const rightInput = { leftPressed: false, rightPressed: true, jumpPressed: false };

  // Frame 1
  vx = controller.computeHorizontalVelocity(vx, true, rightInput, config);
  assert(vx > 0.3 && vx < 0.6, `Frame 1 acceleration is smooth & progressive (vx: ${vx.toFixed(2)})`);

  // Accelerate to top speed
  for (let f = 2; f <= 20; f++) {
    vx = controller.computeHorizontalVelocity(vx, true, rightInput, config);
  }
  assert(Math.abs(vx - config.maxSpeed) < 0.05, `Top speed reaches exactly ${config.maxSpeed} px/frame (measured: ${vx.toFixed(2)})`);

  // Turnaround: tap Left while moving Right at max speed
  const leftInput = { leftPressed: true, rightPressed: false, jumpPressed: false };
  const skidVx = controller.computeHorizontalVelocity(vx, true, leftInput, config);
  assert(skidVx < vx && skidVx > 0, `Turnaround immediately applies skid braking (skidVx: ${skidVx.toFixed(2)})`);

  // Coasting: release input and verify natural rolling friction
  let coastVx = config.maxSpeed;
  const neutralInput = { leftPressed: false, rightPressed: false, jumpPressed: false };
  let framesToStop = 0;
  for (let f = 1; f <= 50; f++) {
    coastVx = controller.computeHorizontalVelocity(coastVx, true, neutralInput, config);
    if (coastVx === 0) {
      framesToStop = f;
      break;
    }
  }
  console.log(`  Frames to coast to a complete stop: ${framesToStop} frames (~${(framesToStop * 16.667).toFixed(0)}ms)`);
  assert(framesToStop >= 20 && framesToStop <= 35, `Ball coasts gracefully to a stop over ~0.35-0.5s (${framesToStop} frames)`);
}

// -----------------------------------------------------------------------------
// Test 2: In-Air Parabolic Ballistics & Aerodynamic Steering
// -----------------------------------------------------------------------------
console.log('\n--- Test 2: In-Air Parabolic Ballistics & Steering ---');
{
  const config = BALL_FORM_CONFIGS.original;
  // Ball airborne moving forward at 5.0 px/frame
  let vx = 5.0;
  const neutralInput = { leftPressed: false, rightPressed: false, jumpPressed: false };

  // Preserve momentum during leap
  for (let f = 0; f < 10; f++) {
    vx = controller.computeHorizontalVelocity(vx, false, neutralInput, config);
  }
  assert(vx > 4.2, `Airborne ball preserves forward momentum throughout leap (vx: ${vx.toFixed(2)})`);

  // Gentle mid-air nudge
  const leftInput = { leftPressed: true, rightPressed: false, jumpPressed: false };
  const steerVx = controller.computeHorizontalVelocity(vx, false, leftInput, config);
  assert(steerVx < vx && steerVx > vx - 0.4, `In-air steering is subtle and non-teleporting (measured delta: ${(vx - steerVx).toFixed(2)})`);
}

// -----------------------------------------------------------------------------
// Test 3: Distinct Physical Personalities Across Ball Forms
// -----------------------------------------------------------------------------
console.log('\n--- Test 3: Form-Specific Physical Personalities ---');
{
  // Big Ball: large inertia, slower acceleration, floaty
  const bigConfig = BALL_FORM_CONFIGS.big;
  const bigVx1 = controller.computeHorizontalVelocity(0, true, { leftPressed: false, rightPressed: true, jumpPressed: false }, bigConfig);
  assert(bigVx1 < 0.4, `Big Ball has noticeable mass inertia (vx1: ${bigVx1.toFixed(2)})`);
  assert(bigConfig.maxSpeed === 4.4, 'Big Ball maxSpeed is 4.4 px/frame');

  // Stone Ball: punchy, heavy, rapid braking
  const stoneConfig = BALL_FORM_CONFIGS.stone;
  const stoneVx1 = controller.computeHorizontalVelocity(0, true, { leftPressed: false, rightPressed: true, jumpPressed: false }, stoneConfig);
  assert(stoneVx1 >= 0.40, `Stone Ball has powerful immediate traction (vx1: ${stoneVx1.toFixed(2)})`);
  assert(stoneConfig.maxSpeed === 3.8, 'Stone Ball maxSpeed is 3.8 px/frame');
  assert(stoneConfig.groundDamping < BALL_FORM_CONFIGS.original.groundDamping, 'Stone Ball brakes faster on ground');

  // Snow Ball: nimble sprint, long slick glide
  const snowConfig = BALL_FORM_CONFIGS.snow;
  assert(snowConfig.maxSpeed === 5.25, 'Snow Ball maxSpeed is 5.25 px/frame');
  assert(snowConfig.groundDamping > BALL_FORM_CONFIGS.original.groundDamping, 'Snow Ball glides much farther on surfaces');
}

// -----------------------------------------------------------------------------
// Test 4: Full Physics Engine Integration (Continuous Rolling & Jumping)
// -----------------------------------------------------------------------------
console.log('\n--- Test 4: Physics Engine Integration Simulation ---');
{
  const world = new PhysicsWorld(LEVEL_PLATFORMS, WORLD_WIDTH, WORLD_HEIGHT, 140, 536);
  const input = new InputController();
  input.setRight(true);

  // Roll forward for 30 frames
  for (let f = 0; f < 30; f++) {
    world.step(16.667, input);
  }
  const state1 = world.getBallState();
  console.log(`  State at frame 30: x=${state1.x.toFixed(1)}, vx=${state1.vx.toFixed(2)}`);
  assert(Math.abs(state1.vx - 5.0) < 0.3, 'Integrated physics simulation reaches ~5.0 px/frame smoothly');

  // Trigger jump while rolling
  input.setJump(true);
  world.step(16.667, input);
  const jumpState = world.getBallState();
  console.log(`  Jump launch: vy=${jumpState.vy.toFixed(2)}, vx=${jumpState.vx.toFixed(2)}`);
  assert(jumpState.vy <= -13.0, 'Ball launched into jump with full vertical impulse');
  assert(jumpState.vx > 4.5, 'Ball retained rolling forward speed into ballistic jump');
}

console.log('\n======================================================');
console.log('🎉 ALL NATURAL BALL MOVEMENT TESTS PASSED! 🎉');
console.log('======================================================\n');
