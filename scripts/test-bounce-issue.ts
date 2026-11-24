import { PhysicsWorld } from '../src/game/physics';
import { GAME_LEVELS } from '../src/game/levels';
import { InputController } from '../src/controllers/InputController';

const level1 = GAME_LEVELS[0];
// Ball is at position shown in screenshot: resting on sec2_step_4 at x: 1080, y: 956
const world = new PhysicsWorld(
  level1.platforms,
  level1.worldWidth,
  level1.worldHeight,
  1080,
  950,
  level1.coins,
  undefined,
  level1.keys
);
const input = new InputController();

// Settle on sec2_step_4
for (let i = 0; i < 30; i++) world.step(16.666, input);
console.log('Ball initial resting position:', world.getBallState());

// Player moves left and jumps towards the bounce platform
input.setLeft(true);
for (let i = 0; i < 6; i++) world.step(16.666, input);
input.setJump(true);
world.step(16.666, input);
input.setJump(false);

console.log('\n--- Tracking Ball Trajectory towards & across Bounce Pad ---');
for (let frame = 0; frame < 90; frame++) {
  world.step(16.666, input);
  const s = world.getBallState();
  console.log(
    `f=${frame.toString().padStart(2, '0')}: x=${s.x.toFixed(1).padStart(6)}, y=${s.y.toFixed(1).padStart(6)}, vx=${s.vx.toFixed(2).padStart(6)}, vy=${s.vy.toFixed(2).padStart(6)}, grounded=${s.isGrounded}`
  );
}
