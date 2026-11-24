import { PhysicsWorld } from '../src/game/physics';
import { GAME_LEVELS } from '../src/game/levels';
import { InputController } from '../src/controllers/InputController';

const level1 = GAME_LEVELS[0];
// Spawn ball directly on top of the bounce pad at x: 940, y: 847
const world = new PhysicsWorld(
  level1.platforms,
  level1.worldWidth,
  level1.worldHeight,
  940,
  845,
  level1.coins,
  undefined,
  level1.keys
);
const input = new InputController();

// Step until bounce pad triggers
let min_y = 1000;
let apex_frame = 0;
let triggered = false;

for (let f = 0; f < 80; f++) {
  world.step(16.666, input);
  const s = world.getBallState();
  if (s.vy < -15.0) triggered = true;
  if (s.y < min_y) {
    min_y = s.y;
    apex_frame = f;
  }
  if (f % 5 === 0 || f === apex_frame) {
    console.log(`f=${f}: x=${s.x.toFixed(1)}, y=${s.y.toFixed(1)}, vy=${s.vy.toFixed(2)}`);
  }
}

console.log(`\nTriggered: ${triggered}`);
console.log(`Min Y (Apex): ${min_y.toFixed(1)} at frame ${apex_frame}`);
console.log(`Shelf top surface Y: ${600 - 12 - 24} = 564.0`);
console.log(`Clears shelf by: ${(564.0 - min_y).toFixed(1)} pixels`);
