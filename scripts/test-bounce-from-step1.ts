import { PhysicsWorld } from '../src/game/physics';
import { GAME_LEVELS } from '../src/game/levels';
import { InputController } from '../src/controllers/InputController';

const level1 = GAME_LEVELS[0];
// Ball is at sec2_step_1 at x: 960, y: 1062
const world = new PhysicsWorld(
  level1.platforms,
  level1.worldWidth,
  level1.worldHeight,
  960,
  1062,
  level1.coins,
  undefined,
  level1.keys
);
const input = new InputController();

for (let i = 0; i < 30; i++) world.step(16.666, input);

// Jump towards the bounce pad at x: 940, y: 880
input.setLeft(true);
input.setJump(true);

console.log('\n--- Tracking Ball Trajectory from sec2_step_1 to Bounce Pad ---');
for (let frame = 0; frame < 60; frame++) {
  world.step(16.666, input);
  const s = world.getBallState();
  console.log(
    `f=${frame.toString().padStart(2, '0')}: x=${s.x.toFixed(1).padStart(6)}, y=${s.y.toFixed(1).padStart(6)}, vx=${s.vx.toFixed(2).padStart(6)}, vy=${s.vy.toFixed(2).padStart(6)}, grounded=${s.isGrounded}`
  );
}
