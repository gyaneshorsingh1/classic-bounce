import Matter from 'matter-js';
import { getLevelData } from '../src/game/levels';
import { PhysicsWorld } from '../src/game/physics';
import { InputController } from '../src/controllers/InputController';

function assert(condition: boolean, msg: string) {
  if (!condition) {
    console.error(`❌ FAILED: ${msg}`);
    process.exit(1);
  }
  console.log(`✅ PASSED: ${msg}`);
}

async function runBuoyancyTests() {
  console.log('================================================================');
  console.log('🧪 VERIFY WATER BUOYANCY PHYSICS FOR ALL 5 BALL FORMS');
  console.log('================================================================\n');

  const level2 = getLevelData(2);
  const input = new InputController();

  // Water Pool 1: id 'l2_sec1_water', x: 1250, y: 1820, width: 800, height: 260
  // Water Top: 1820 - 130 = 1690
  // Water Bottom: 1820 + 130 = 1950
  const waterTop = 1690;

  // ---------------------------------------------------------------------------
  // Test 1: Small Ball - Sinks steadily, limited buoyancy, responsive swimming
  // ---------------------------------------------------------------------------
  console.log('--- Test 1: Small Ball Physics in Water ---');
  {
    const p = new PhysicsWorld(
      level2.platforms,
      level2.worldWidth,
      level2.worldHeight,
      level2.initialBallX,
      level2.initialBallY
    );

    p.setBallSize('small');
    assert(p.getCurrentSize() === 'small', 'Ball is configured as Small Ball (r=15)');
    assert(p.getCurrentRadius() === 15, 'Small ball radius is 15px');

    // Place Small Ball submerged in water
    // @ts-ignore
    Matter.Body.setPosition(p['ball'], { x: 1250, y: 1750 });
    // @ts-ignore
    Matter.Body.setVelocity(p['ball'], { x: 0, y: 0 });

    for (let i = 0; i < 30; i++) p.step(16.67, input);

    const state = p.getBallState();
    console.log(`  Small Ball: submerged y=1750 -> final y=${state.y.toFixed(1)}, vy=${state.vy.toFixed(3)}`);
    assert(state.isInWater === true, 'Small ball is detected inside water zone');
    assert(state.y > 1750, 'Small ball sinks underwater (y increased)');
    assert(state.vy > 0.4, 'Small ball has steady downward velocity (sinking)');

    // Test responsive underwater swimming controls
    input.setJump(true);
    p.step(16.67, input);
    const swimVy = p.getBallState().vy;
    console.log(`  Small Ball swim stroke impulse vy: ${swimVy.toFixed(2)}`);
    assert(swimVy < -5.0, 'Small ball responds to jump with upward swim stroke underwater');
    input.setJump(false);
  }

  // ---------------------------------------------------------------------------
  // Test 2: Normal Ball - Sinks slowly, does NOT automatically float
  // ---------------------------------------------------------------------------
  console.log('\n--- Test 2: Normal Ball Physics in Water ---');
  {
    const p = new PhysicsWorld(
      level2.platforms,
      level2.worldWidth,
      level2.worldHeight,
      level2.initialBallX,
      level2.initialBallY
    );

    assert(p.getCurrentSize() === 'normal' && p.getCurrentForm() === 'original', 'Ball is Normal Ball (r=24)');

    // Place Normal Ball submerged in water
    // @ts-ignore
    Matter.Body.setPosition(p['ball'], { x: 1250, y: 1750 });
    // @ts-ignore
    Matter.Body.setVelocity(p['ball'], { x: 0, y: 0 });

    for (let i = 0; i < 40; i++) p.step(16.67, input);

    const state = p.getBallState();
    console.log(`  Normal Ball: submerged y=1750 -> final y=${state.y.toFixed(1)}, vy=${state.vy.toFixed(3)}`);
    assert(state.isInWater === true, 'Normal ball is detected inside water zone');
    assert(state.y > 1750, 'Normal ball sinks slowly downward (y increased)');
    assert(state.y < 1800, 'Normal ball sinks slowly, not plunging prematurely');
    assert(state.vy > 0 && state.vy < 1.0, 'Normal ball maintains gentle downward drift, does NOT auto-float');
  }

  // ---------------------------------------------------------------------------
  // Test 3: Big Ball - Floats naturally on surface, partially submerged, moves horizontally
  // ---------------------------------------------------------------------------
  console.log('\n--- Test 3: Big Ball Physics in Water ---');
  {
    const p = new PhysicsWorld(
      level2.platforms,
      level2.worldWidth,
      level2.worldHeight,
      level2.initialBallX,
      level2.initialBallY
    );

    p.setBallSize('large');
    assert(p.getCurrentSize() === 'large', 'Ball is Big Ball (r=34)');

    // Place Big Ball deep in water
    // @ts-ignore
    Matter.Body.setPosition(p['ball'], { x: 1250, y: 1820 });
    // @ts-ignore
    Matter.Body.setVelocity(p['ball'], { x: 0, y: 0 });

    // Step physics: buoyancy must lift Big Ball to surface and settle
    for (let i = 0; i < 120; i++) {
      p.step(16.67, input);
      if (i === 60 || i === 80 || i === 100 || i === 119) {
        const s = p.getBallState();
        console.log(`    step ${i+1}: y=${s.y.toFixed(1)}, vy=${s.vy.toFixed(3)}, sub=${((s.submergedRatio ?? 0) * 100).toFixed(1)}%`);
      }
    }

    const state = p.getBallState();
    const ballBottom = state.y + state.radius;
    const submersionPx = ballBottom - waterTop;
    const submergedPercent = (submersionPx / (2 * state.radius)) * 100;
    console.log(
      `  Big Ball: deep y=1820 -> surface y=${state.y.toFixed(1)}, submerged=${submergedPercent.toFixed(1)}%, vy=${state.vy.toFixed(3)}`
    );

    assert(state.y < 1720, 'Big ball rises upward toward water surface');
    assert(ballBottom > waterTop, 'Big ball bottom remains in water (partially submerged, does not hover)');
    assert(submergedPercent > 35 && submergedPercent < 60, 'Big ball is partially submerged in equilibrium (~40-50%)');
    assert(Math.abs(state.vy) < 0.6, 'Big ball settles stably on water surface without erratic bouncing');

    // Test horizontal movement while floating
    input.setRight(true);
    for (let i = 0; i < 15; i++) p.step(16.67, input);
    const movingState = p.getBallState();
    console.log(`  Big Ball floating horizontal speed: vx=${movingState.vx.toFixed(2)}`);
    assert(movingState.vx > 4.5, 'Big ball moves horizontally while floating across water');
    input.setRight(false);

    // Test surface breach leap
    input.setJump(true);
    p.step(16.67, input);
    const breachVy = p.getBallState().vy;
    console.log(`  Big Ball surface breach jump vy: ${breachVy.toFixed(2)}`);
    assert(breachVy <= -10.0, 'Big ball performs powerful surface breach leap out of water');
    input.setJump(false);
  }

  // ---------------------------------------------------------------------------
  // Test 4: Stone Ball - Sinks quickly, strong downward movement, cannot float
  // ---------------------------------------------------------------------------
  console.log('\n--- Test 4: Stone Ball Physics in Water ---');
  {
    const p = new PhysicsWorld(
      level2.platforms,
      level2.worldWidth,
      level2.worldHeight,
      level2.initialBallX,
      level2.initialBallY
    );

    p.setBallForm('stone');
    assert(p.getCurrentForm() === 'stone', 'Ball transformed to Stone Ball (r=25, heavy)');

    // Place Stone Ball in water
    // @ts-ignore
    Matter.Body.setPosition(p['ball'], { x: 1250, y: 1720 });
    // @ts-ignore
    Matter.Body.setVelocity(p['ball'], { x: 0, y: 0 });

    for (let i = 0; i < 30; i++) p.step(16.67, input);

    const state = p.getBallState();
    console.log(`  Stone Ball: submerged y=1720 -> final y=${state.y.toFixed(1)}, vy=${state.vy.toFixed(3)}`);
    assert(state.y > 1755, 'Stone ball sinks quickly (large downward displacement)');
    assert(state.vy > 1.6, 'Stone ball maintains strong downward velocity (>1.6 px/step)');

    // Verify Stone Ball cannot paddle upward in mid-water
    const vyBefore = state.vy;
    input.setJump(true);
    p.step(16.67, input);
    const vyAfter = p.getBallState().vy;
    console.log(`  Stone Ball jump attempt underwater: before=${vyBefore.toFixed(2)}, after=${vyAfter.toFixed(2)}`);
    assert(vyAfter >= vyBefore - 0.5, 'Stone ball cannot paddle in mid-water; downward plunge maintained');
    input.setJump(false);
  }

  // ---------------------------------------------------------------------------
  // Test 5: Snow Ball - Floats naturally on surface, partially submerged, glides
  // ---------------------------------------------------------------------------
  console.log('\n--- Test 5: Snow Ball Physics in Water ---');
  {
    const p = new PhysicsWorld(
      level2.platforms,
      level2.worldWidth,
      level2.worldHeight,
      level2.initialBallX,
      level2.initialBallY
    );

    p.setBallForm('snow');
    assert(p.getCurrentForm() === 'snow', 'Ball transformed to Snow Ball (r=16, light)');

    // Place Snow Ball deep in water
    // @ts-ignore
    Matter.Body.setPosition(p['ball'], { x: 1250, y: 1800 });
    // @ts-ignore
    Matter.Body.setVelocity(p['ball'], { x: 0, y: 0 });

    for (let i = 0; i < 80; i++) p.step(16.67, input);

    const state = p.getBallState();
    const ballBottom = state.y + state.radius;
    const submersionPx = ballBottom - waterTop;
    const submergedPercent = (submersionPx / (2 * state.radius)) * 100;
    console.log(
      `  Snow Ball: deep y=1800 -> surface y=${state.y.toFixed(1)}, submerged=${submergedPercent.toFixed(1)}%, vy=${state.vy.toFixed(3)}`
    );

    assert(state.y < 1720, 'Snow ball rises to water surface under buoyancy');
    assert(ballBottom > waterTop, 'Snow ball remains partially submerged (does not hover)');
    assert(submergedPercent > 28 && submergedPercent < 55, 'Snow ball is partially submerged in equilibrium (~35-45%)');

    // Test surface gliding
    input.setRight(true);
    for (let i = 0; i < 15; i++) p.step(16.67, input);
    const glideState = p.getBallState();
    console.log(`  Snow Ball surface glide vx: ${glideState.vx.toFixed(2)}`);
    assert(glideState.vx > 4.5, 'Snow ball glides across water surface');
    input.setRight(false);
  }

  // ---------------------------------------------------------------------------
  // Test 6: Direct Side-by-Side Comparison of All 5 Forms in the Same Water Area
  // ---------------------------------------------------------------------------
  console.log('\n--- Test 6: Direct Comparison of All 5 Forms in Identical Water Area ---');
  {
    const simulateForm = (formSetup: (p: PhysicsWorld) => void, name: string) => {
      const p = new PhysicsWorld(
        level2.platforms,
        level2.worldWidth,
        level2.worldHeight,
        level2.initialBallX,
        level2.initialBallY
      );
      formSetup(p);
      // Place at exact same water coordinate: x: 1250, y: 1720 (just beneath waterTop 1690)
      // @ts-ignore
      Matter.Body.setPosition(p['ball'], { x: 1250, y: 1720 });
      // @ts-ignore
      Matter.Body.setVelocity(p['ball'], { x: 0, y: 0 });

      for (let i = 0; i < 50; i++) p.step(16.67, input);
      const s = p.getBallState();
      return { name, y: s.y, vy: s.vy, submerged: s.submergedRatio ?? 0 };
    };

    const big = simulateForm((p) => p.setBallSize('large'), 'Big Ball');
    const snow = simulateForm((p) => p.setBallForm('snow'), 'Snow Ball');
    const normal = simulateForm((p) => p.setBallSize('normal'), 'Normal Ball');
    const small = simulateForm((p) => p.setBallSize('small'), 'Small Ball');
    const stone = simulateForm((p) => p.setBallForm('stone'), 'Stone Ball');

    console.log(`  Comparison Results after 50 steps from y=1720:`);
    console.log(`  ${big.name.padEnd(12)}: y=${big.y.toFixed(1)}, vy=${big.vy.toFixed(3)}, sub=${(big.submerged * 100).toFixed(0)}%`);
    console.log(`  ${snow.name.padEnd(12)}: y=${snow.y.toFixed(1)}, vy=${snow.vy.toFixed(3)}, sub=${(snow.submerged * 100).toFixed(0)}%`);
    console.log(`  ${normal.name.padEnd(12)}: y=${normal.y.toFixed(1)}, vy=${normal.vy.toFixed(3)}, sub=${(normal.submerged * 100).toFixed(0)}%`);
    console.log(`  ${small.name.padEnd(12)}: y=${small.y.toFixed(1)}, vy=${small.vy.toFixed(3)}, sub=${(small.submerged * 100).toFixed(0)}%`);
    console.log(`  ${stone.name.padEnd(12)}: y=${stone.y.toFixed(1)}, vy=${stone.vy.toFixed(3)}, sub=${(stone.submerged * 100).toFixed(0)}%`);

    // Verify ordering:
    // Floating balls (Big, Snow) rose toward surface (y < 1720)
    assert(big.y < 1715, 'Big ball floated to surface');
    assert(snow.y < 1715, 'Snow ball floated to surface');

    // Sinking balls (Normal, Small, Stone) descended (y > 1720)
    assert(normal.y > 1720, 'Normal ball sank slowly');
    assert(small.y > normal.y, 'Small ball sank deeper than Normal ball');
    assert(stone.y > small.y, 'Stone ball sank deepest and fastest of all forms');

    // Velocity ordering: Stone sank fastest, Normal sank slowly
    assert(stone.vy > small.vy, 'Stone ball sinking velocity > Small ball sinking velocity');
    assert(small.vy > normal.vy, 'Small ball sinking velocity > Normal ball sinking velocity');
  }

  // ---------------------------------------------------------------------------
  // Test 7: Smooth Surface Entry Without Ejection Spikes
  // ---------------------------------------------------------------------------
  console.log('\n--- Test 7: Smooth Surface Entry Without Spurious Ejections ---');
  {
    const p = new PhysicsWorld(
      level2.platforms,
      level2.worldWidth,
      level2.worldHeight,
      level2.initialBallX,
      level2.initialBallY
    );

    // Drop normal ball from air (y: 1650, top of water is 1690)
    // @ts-ignore
    Matter.Body.setPosition(p['ball'], { x: 1250, y: 1650 });
    // @ts-ignore
    Matter.Body.setVelocity(p['ball'], { x: 0, y: 4.0 });

    let maxUpwardVy = 0;
    for (let i = 0; i < 30; i++) {
      p.step(16.67, input);
      const vy = p.getBallState().vy;
      if (vy < maxUpwardVy) maxUpwardVy = vy;
    }

    console.log(`  Drop from air into water: min vy=${maxUpwardVy.toFixed(2)}`);
    assert(maxUpwardVy > -8.0, 'Ball enters water smoothly without erratic high-speed ejection');
  }

  console.log('\n🎉 ALL WATER BUOYANCY TESTS PASSED SUCCESSFULLY!');
}

runBuoyancyTests();
