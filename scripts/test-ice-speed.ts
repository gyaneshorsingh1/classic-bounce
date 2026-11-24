import { PhysicsWorld } from '../src/game/physics';
import { GAME_LEVELS } from '../src/game/levels';
import { InputController } from '../src/controllers/InputController';
import Matter from 'matter-js';

const l3 = GAME_LEVELS[2];
// Place ball on ice platform in Section 4: l3_sec4_ice1 at x: 3850, y: 1890
const icePlat = l3.platforms.find(p => p.id === 'l3_sec4_ice1')!;
console.log('Ice platform:', icePlat.id, 'type:', icePlat.type, 'x:', icePlat.x, 'y:', icePlat.y);

const world = new PhysicsWorld(l3.platforms, l3.worldWidth, l3.worldHeight, icePlat.x, icePlat.y - icePlat.height/2 - 16, l3.coins, undefined, l3.keys);
const input = new InputController();

(world as any).currentForm = 'snow';
(world as any).currentRadius = 16;
const ball = (world as any).ball;

// Settle on ice platform
for (let i = 0; i < 20; i++) world.step(16.666, input);

// Give a brief rightward push
input.setRight(true);
for (let i = 0; i < 5; i++) world.step(16.666, input);
input.setRight(false); // release button!

console.log('--- Released button on ice platform, tracking speed over 20 frames ---');
for (let frame = 0; frame < 20; frame++) {
  world.step(16.666, input);
  const s = world.getBallState();
  console.log(`frame ${frame}: vx=${s.vx.toFixed(2)}, grounded=${s.isGrounded}`);
}
