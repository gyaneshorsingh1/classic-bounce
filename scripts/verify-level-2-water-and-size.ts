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

async function runLevel2Tests() {
  console.log('================================================================');
  console.log('🧪 VERIFY LEVEL 2: FLOATING WATER, BALL SIZE & DENSITY MECHANICS');
  console.log('================================================================\n');

  const level2 = getLevelData(2);
  const input = new InputController();

  // ---------------------------------------------------------------------------
  // Test 1: Map Scope & 6 Connected Sections Verification
  // ---------------------------------------------------------------------------
  console.log('--- Test 1: Map Dimensions, Scope & 6 Sections Verification ---');
  console.log(`  Map Dimensions: ${level2.worldWidth} x ${level2.worldHeight}`);
  console.log(`  Spawn Point: (${level2.initialBallX}, ${level2.initialBallY})`);

  assert(level2.worldWidth === 7200, 'Level 2 worldWidth is 7200px (vast expansion)');
  assert(level2.worldHeight === 2400, 'Level 2 worldHeight is 2400px (deep vertical exploration)');
  assert(level2.initialBallX === 160 && level2.initialBallY === 1780, 'Spawn point matches water entrance');

  const pIds = level2.platforms.map((p) => p.id);

  // Section 1: Water Entrance
  assert(
    pIds.includes('l2_sec1_water') &&
      pIds.includes('l2_sec1_gate_grow') &&
      pIds.includes('l2_sec1_crate1') &&
      pIds.includes('l2_checkpoint_1'),
    'Section 1 (Water Entrance, Growth Gate & Checkpoint 1) present'
  );

  // Section 2: Underwater Tunnel
  assert(
    pIds.includes('l2_sec2_water') &&
      pIds.includes('l2_sec2_gate_shrink') &&
      pIds.includes('l2_sec2_tunnel_ceil') &&
      pIds.includes('l2_sec2_tunnel_floor') &&
      pIds.includes('l2_sec2_gate_normal'),
    'Section 2 (Underwater Tunnel, Deflator Gate & Narrow Conduit) present'
  );

  // Section 3: Floating Platform Area
  assert(
    pIds.includes('l2_checkpoint_2') &&
      pIds.includes('l2_sec3_water') &&
      pIds.includes('l2_sec3_gate_grow') &&
      pIds.includes('l2_sec3_pontoon_1') &&
      pIds.includes('l2_sec3_moving_pontoon'),
    'Section 3 (Floating Platform Area & Pontoon Climb) present'
  );

  // Section 4: Deep Water Chamber
  assert(
    pIds.includes('l2_checkpoint_3') &&
      pIds.includes('l2_sec4_water') &&
      pIds.includes('l2_sec4_gate_shrink') &&
      pIds.includes('l2_sec4_mov_spike1') &&
      pIds.includes('l2_sec4_gate_grow'),
    'Section 4 (Deep Water Chamber & Sinking/Rising Gate Sequence) present'
  );

  // Section 5: Waterfall Climb
  assert(
    pIds.includes('l2_checkpoint_4') &&
      pIds.includes('l2_sec5_waterfall1') &&
      pIds.includes('l2_sec5_waterfall2') &&
      pIds.includes('l2_sec5_crumb1') &&
      pIds.includes('l2_sec5_cliff_apex'),
    'Section 5 (Waterfall Climb & Cascading Waterfalls) present'
  );

  // Section 6: Final Escape
  assert(
    pIds.includes('l2_sec6_water') &&
      pIds.includes('l2_sec6_gate_shrink') &&
      pIds.includes('l2_sec6_gate_grow') &&
      pIds.includes('l2_golden_exit'),
    'Section 6 (Final Escape, Aqueduct Flume & Golden Exit Ring) present'
  );

  // ---------------------------------------------------------------------------
  // Test 2: Water Entry, Fluid Drag & Density-Driven Buoyancy
  // ---------------------------------------------------------------------------
  console.log('\n--- Test 2: Water Entry, Fluid Drag & Density-Driven Buoyancy ---');
  {
    const p = new PhysicsWorld(
      level2.platforms,
      level2.worldWidth,
      level2.worldHeight,
      level2.initialBallX,
      level2.initialBallY
    );

    // Initial state in air
    assert(!p.getIsInWater(), 'Ball is not in water at start');

    // Teleport ball into Section 1 water pool (x: 1250, y: 1780)
    // @ts-ignore
    Matter.Body.setPosition(p['ball'], { x: 1250, y: 1780 });
    // @ts-ignore
    Matter.Body.setVelocity(p['ball'], { x: 5.0, y: 5.0 });
    p.step(16.67, input);

    assert(p.getIsInWater() === true, 'Ball enters water zone');
    const ballWaterState = p.getBallState();
    assert((ballWaterState.submergedRatio ?? 0) > 0, 'Submerged ratio computed in water');
    console.log(`  In water state: submergedRatio=${ballWaterState.submergedRatio?.toFixed(2)}, vy=${ballWaterState.vy.toFixed(2)}`);

    // Verify Large Ball (Light Density: 0.45) Floats High
    p.setBallSize('large');
    assert(p.getCurrentSize() === 'large', 'Ball transformed to large');
    assert(p.getCurrentDensity() === 'light', 'Large ball has light density (0.45)');

    // Step physics: high upward buoyancy must lift large ball toward surface
    // @ts-ignore
    Matter.Body.setPosition(p['ball'], { x: 1250, y: 1800 });
    // @ts-ignore
    Matter.Body.setVelocity(p['ball'], { x: 0, y: 0 });
    for (let i = 0; i < 20; i++) p.step(16.67, input);

    const largeBallY = p.getBallState().y;
    console.log(`  Large ball submerged y=1800 -> buoyant surface y=${largeBallY.toFixed(1)}`);
    assert(largeBallY < 1800, 'Large ball rises upward toward water surface under buoyancy');

    // Verify Small Ball (Heavy Density: 1.7) Sinks
    p.setBallSize('small');
    assert(p.getCurrentSize() === 'small', 'Ball transformed to small');
    assert(p.getCurrentDensity() === 'heavy', 'Small ball has heavy density (1.7)');

    // Step physics: gravity exceeds buoyancy so small ball steadily sinks
    // @ts-ignore
    Matter.Body.setPosition(p['ball'], { x: 1250, y: 1720 });
    // @ts-ignore
    Matter.Body.setVelocity(p['ball'], { x: 0, y: 0 });
    for (let i = 0; i < 20; i++) p.step(16.67, input);

    const smallBallY = p.getBallState().y;
    console.log(`  Small ball submerged y=1720 -> sinking y=${smallBallY.toFixed(1)}`);
    assert(smallBallY > 1720, 'Small heavy ball steadily sinks downward in water');
  }

  // ---------------------------------------------------------------------------
  // Test 3: Ball Size Transformation & Collision Body Scaling
  // ---------------------------------------------------------------------------
  console.log('\n--- Test 3: Ball Size Transformations & Matter.js Collision Scaling ---');
  {
    const p = new PhysicsWorld(
      level2.platforms,
      level2.worldWidth,
      level2.worldHeight,
      level2.initialBallX,
      level2.initialBallY
    );

    // Default Normal Ball
    assert(p.getCurrentRadius() === 24, 'Normal ball radius is 24px (diameter 48px)');

    // Transform to Small Ball
    p.setBallSize('small');
    assert(p.getCurrentRadius() === 15, 'Small ball radius is 15px (diameter 30px)');
    assert(p.getCurrentSize() === 'small', 'Size is small');
    // @ts-ignore
    assert(p['ball'].circleRadius === 15, 'Matter.js body circle radius updated to 15');

    // Transform to Large Ball
    p.setBallSize('large');
    assert(p.getCurrentRadius() === 34, 'Large ball radius is 34px (diameter 68px)');
    assert(p.getCurrentSize() === 'large', 'Size is large');
    // @ts-ignore
    assert(p['ball'].circleRadius === 34, 'Matter.js body circle radius updated to 34');

    // Transform back to Normal Ball
    p.setBallSize('normal');
    assert(p.getCurrentRadius() === 24, 'Normal ball radius restored to 24px');
  }

  // ---------------------------------------------------------------------------
  // Test 4: Narrow Conduit Clearance (Only Small Ball Fits)
  // ---------------------------------------------------------------------------
  console.log('\n--- Test 4: Narrow Conduit Passage & Anti-Clipping Safety ---');
  {
    const p = new PhysicsWorld(
      level2.platforms,
      level2.worldWidth,
      level2.worldHeight,
      level2.initialBallX,
      level2.initialBallY
    );

    // Section 2 narrow conduit: ceil y=2238 (bottom y=2258), floor y=2320 (top y=2295)
    // Conduit center: x=2450, y=2276. Gap height = 37px
    p.setBallSize('small'); // radius 15, diameter 30 fits in 37px gap

    // Place small ball inside the narrow conduit
    // @ts-ignore
    Matter.Body.setPosition(p['ball'], { x: 2450, y: 2276 });
    p.step(16.67, input);

    const insidePos = p.getBallState();
    console.log(`  Small ball inside 37px conduit: (${insidePos.x}, ${insidePos.y})`);
    assert(insidePos.x === 2450, 'Small ball fits securely inside the narrow conduit');

    // Attempting to expand to Large (diameter 68px) inside the 37px conduit must be safely prevented!
    const expandResult = p.setBallSize('large');
    console.log(`  Expansion attempt to large inside tight conduit result: ${expandResult}`);
    assert(expandResult === false, 'Expansion safely prevented inside narrow tunnel (anti-clipping protection)');
    assert(p.getCurrentSize() === 'small', 'Ball remains safely in small mode without clipping');
  }

  // ---------------------------------------------------------------------------
  // Test 5: Underwater Swimming Stroke & Surface Breach Leap
  // ---------------------------------------------------------------------------
  console.log('\n--- Test 5: Underwater Swimming & Surface Breach Leap ---');
  {
    const p = new PhysicsWorld(
      level2.platforms,
      level2.worldWidth,
      level2.worldHeight,
      level2.initialBallX,
      level2.initialBallY
    );

    // 1. Deep submerged swim stroke:
    // @ts-ignore
    Matter.Body.setPosition(p['ball'], { x: 1250, y: 1840 }); // deep in Section 1 water
    // @ts-ignore
    Matter.Body.setVelocity(p['ball'], { x: 0, y: 0 });
    input.setJump(true);
    p.step(16.67, input);

    const swimVy = p.getBallState().vy;
    console.log(`  Submerged paddle stroke vy: ${swimVy.toFixed(2)}`);
    assert(swimVy < -5.0, 'Pressing Jump underwater triggers upward swim stroke (vy < -5.0)');

    // 2. Surface breach leap:
    input.setJump(false);
    p.step(16.67, input);
    // Move ball right to water surface (top is y=1690)
    // @ts-ignore
    Matter.Body.setPosition(p['ball'], { x: 1250, y: 1695 });
    // @ts-ignore
    Matter.Body.setVelocity(p['ball'], { x: 0, y: 0 });
    input.setJump(true);
    p.step(16.67, input);

    const breachVy = p.getBallState().vy;
    console.log(`  Surface breach leap vy: ${breachVy.toFixed(2)}`);
    assert(breachVy < -10.0, 'Pressing Jump at water surface triggers powerful breach leap (vy < -10.0)');
    input.setJump(false);
  }

  // ---------------------------------------------------------------------------
  // Test 6: Waterfall Cascading Upward Lift
  // ---------------------------------------------------------------------------
  console.log('\n--- Test 6: Waterfall Cascading Upward Lift ---');
  {
    const p = new PhysicsWorld(
      level2.platforms,
      level2.worldWidth,
      level2.worldHeight,
      level2.initialBallX,
      level2.initialBallY
    );

    p.setBallSize('large'); // Buoyant large ball
    // Place inside Section 5 waterfall stream (x: 5750, y: 1420, clear of solid ledges)
    // @ts-ignore
    Matter.Body.setPosition(p['ball'], { x: 5750, y: 1420 });
    // @ts-ignore
    Matter.Body.setVelocity(p['ball'], { x: 0, y: 0 });

    for (let i = 0; i < 20; i++) p.step(16.67, input);

    const waterfallY = p.getBallState().y;
    console.log(`  Waterfall climb: initial y=1420 -> current y=${waterfallY.toFixed(1)}`);
    assert(waterfallY < 1420, 'Waterfall current provides upward fluid lift, assisting vertical climb');
  }

  // ---------------------------------------------------------------------------
  // Test 7: Progressive 4-Checkpoint Sequence & Respawn State
  // ---------------------------------------------------------------------------
  console.log('\n--- Test 7: Progressive 4-Checkpoint System ---');
  {
    const p = new PhysicsWorld(
      level2.platforms,
      level2.worldWidth,
      level2.worldHeight,
      level2.initialBallX,
      level2.initialBallY
    );

    const checkpoints = [
      { id: 'l2_checkpoint_1', x: 1800, y: 1565 },
      { id: 'l2_checkpoint_2', x: 3150, y: 1795 },
      { id: 'l2_checkpoint_3', x: 4350, y: 1185 },
      { id: 'l2_checkpoint_4', x: 5450, y: 1695 },
    ];

    for (let i = 0; i < checkpoints.length; i++) {
      const cpData = checkpoints[i];
      const cp = level2.platforms.find((plat) => plat.id === cpData.id)!;
      assert(!cp.isActivated, `Checkpoint ${i + 1} (${cpData.id}) initially inactive`);

      // Touch checkpoint
      // @ts-ignore
      Matter.Body.setPosition(p['ball'], { x: cp.x, y: cp.y });
      p.step(16.67, input);

      assert(cp.isActivated === true, `Checkpoint ${i + 1} activated on touch`);
      const active = p.getActiveCheckpoint();
      assert(active.x === cp.x && active.y === cp.y - 10, `Active checkpoint updated to Checkpoint ${i + 1}`);

      // Die by teleporting into moving spike
      const spike = level2.platforms.find((plat) => plat.type === 'spike')!;
      // @ts-ignore
      Matter.Body.setPosition(p['ball'], { x: spike.x, y: spike.y });
      p.step(16.67, input);

      const respawnState = p.getBallState();
      assert(
        respawnState.x === cp.x && respawnState.y === cp.y - 10,
        `Death correctly respawns ball at Checkpoint ${i + 1} (${respawnState.x}, ${respawnState.y})`
      );

      // Reset lives & clear invulnerability for next test
      p.getLifeManager().resetLives();
      for (let k = 0; k < 80; k++) p.step(16.67, input);
    }
  }

  // ---------------------------------------------------------------------------
  // Test 8: Golden Exit Ring Victory Trigger in Section 6
  // ---------------------------------------------------------------------------
  console.log('\n--- Test 8: Golden Exit Ring Victory Trigger in Section 6 ---');
  {
    const p = new PhysicsWorld(
      level2.platforms,
      level2.worldWidth,
      level2.worldHeight,
      level2.initialBallX,
      level2.initialBallY
    );

    assert(!p.getIsLevelComplete(), 'Level 2 not complete at start');

    // Teleport to Golden Exit Ring at x: 7050, y: 520
    // @ts-ignore
    Matter.Body.setPosition(p['ball'], { x: 7050, y: 520 });
    p.step(16.67, input);

    console.log(`  Level complete status: ${p.getIsLevelComplete()}`);
    assert(p.getIsLevelComplete(), 'Entering Golden Exit Ring in Section 6 triggers victory!');
  }

  console.log('\n🎉 ALL 8 LEVEL 2 WATER, SIZE TRANSFORMATION & BUOYANCY TESTS PASSED WITH 100% SUCCESS!\n');
}

runLevel2Tests().catch((err) => {
  console.error(err);
  process.exit(1);
});
