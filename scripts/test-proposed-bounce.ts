import { PhysicsWorld } from '../src/game/physics';
import { GAME_LEVELS } from '../src/game/levels';
import { InputController } from '../src/controllers/InputController';

// Test new bounce pad logic directly
const level1 = GAME_LEVELS[0];

console.log('=== TESTING PROPOSED BOUNCE PHYSICS ===\n');

// Simulate launch from bounce pad at x: 940, y: 880
// Pad width: 90 (left: 895, right: 985, center: 940)
// Shelf: x: 800, y: 600, width: 140 (left: 730, right: 870, top surface: 588)
// Step 4: x: 1180, y: 980, width: 220 (left: 1070, right: 1290, top surface: 966)

for (const offset of [-0.6, 0.0, 0.6]) {
  const hitX = 940 + offset * 45;
  console.log(`\n--- Test Hit Offset: ${offset.toFixed(1)} (hitX: ${hitX.toFixed(1)}) ---`);

  const mult = 1.0;
  const launchSpeedY = Math.max(22.0, Math.abs(19.0)) * mult;
  const targetVy = -launchSpeedY;
  const targetVx = offset * 2.8 * mult;

  console.log(`Launch Velocity: vx=${targetVx.toFixed(2)}, vy=${targetVy.toFixed(2)}`);

  // Track trajectory under gravity (0.6 px/frame^2)
  let x = hitX;
  let y = 880 - 9 - 24 - 2; // padTop - r - 2 = 845
  let vx = targetVx;
  let vy = targetVy;

  let min_y = y;
  let landedOn: string | null = null;

  for (let frame = 0; frame < 90; frame++) {
    // Air steering: player can steer slightly (+/- 0.15 airAccel)
    // If offset < 0, player naturally steers left towards shelf
    // If offset > 0, player naturally steers right towards step 4
    const steer = offset < 0 ? -0.15 : offset > 0 ? 0.15 : 0;
    vx = Math.max(-5.0, Math.min(5.0, vx + steer));
    x += vx;
    y += vy;
    vy += 0.6; // gravity

    if (y < min_y) min_y = y;

    if (vy > 0 && y >= 550 && y <= 620) {
      console.log(`  Descend pass: f=${frame}, x=${x.toFixed(1)}, y=${y.toFixed(1)}, vy=${vy.toFixed(2)}`);
    }

    // Check shelf collision (x: 730-870, top surface: 588, ball resting: 564)
    if (x >= 730 && x <= 870 && vy > 0 && Math.abs(y - 564) < 12) {
      landedOn = `l1_sec2_key_shelf (frame ${frame}, x=${x.toFixed(1)}, y=${y.toFixed(1)})`;
      break;
    }

    // Check step 4 collision (x: 1070-1290, top surface: 966, ball resting: 942)
    if (x >= 1070 && x <= 1290 && vy > 0 && Math.abs(y - 942) < 12) {
      landedOn = `sec2_step_4 (frame ${frame}, x=${x.toFixed(1)}, y=${y.toFixed(1)})`;
      break;
    }

    // Check bounce pad / step 3 (x: 840-1000, surface: 910 - 14 - 24 = 872)
    if (frame > 20 && x >= 840 && x <= 1000 && vy > 0 && Math.abs(y - 845) < 12) {
      landedOn = `bounce pad / step 3 (frame ${frame}, x=${x.toFixed(1)}, y=${y.toFixed(1)})`;
      break;
    }
  }

  console.log(`Apex Y: ${min_y.toFixed(1)} (cleared shelf top by ${(564 - min_y).toFixed(1)} px)`);
  console.log(`Landed on: ${landedOn ?? 'none / fell past'}`);
}
