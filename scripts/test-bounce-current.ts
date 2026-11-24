import { PhysicsWorld } from '../src/game/physics';
import { GAME_LEVELS } from '../src/game/levels';
import { InputController } from '../src/controllers/InputController';

const level1 = GAME_LEVELS[0];

console.log('--- TEST 1: Ball on sec2_step_4 (user screenshot) hopping onto bounce pad ---');
{
  const world = new PhysicsWorld(
    level1.platforms,
    level1.worldWidth,
    level1.worldHeight,
    1180,
    950,
    level1.coins,
    undefined,
    level1.keys
  );
  const input = new InputController();
  for (let i = 0; i < 30; i++) world.step(16.666, input);

  // Jump left towards bounce pad (at x: 940, y: 880)
  input.setLeft(true);
  for (let i = 0; i < 8; i++) world.step(16.666, input);
  input.setJump(true);
  world.step(16.666, input);
  input.setJump(false);

  // Release left once in air so we see pure bounce pad launch behavior
  let launched = false;
  let launchFrame = -1;
  let apexY = 1000;

  for (let f = 0; f < 80; f++) {
    world.step(16.666, input);
    const s = world.getBallState();
    if (s.vy < -15.0 && !launched) {
      launched = true;
      launchFrame = f;
      console.log(`🚀 Bounce pad triggered at frame ${f}! x=${s.x.toFixed(1)}, y=${s.y.toFixed(1)}, vx=${s.vx.toFixed(2)}, vy=${s.vy.toFixed(2)}`);
    }
    if (launched && s.y < apexY) {
      apexY = s.y;
    }
    if (launched && f - launchFrame <= 35 && (f - launchFrame) % 5 === 0) {
      console.log(`  +${f - launchFrame}f: x=${s.x.toFixed(1)}, y=${s.y.toFixed(1)}, vx=${s.vx.toFixed(2)}, vy=${s.vy.toFixed(2)}`);
    }
  }

  console.log(`Launched: ${launched}, Apex Y: ${apexY.toFixed(1)}`);
}
