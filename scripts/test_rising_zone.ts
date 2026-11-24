import { PhysicsWorld } from '../src/game/physics';
import { getLevelData } from '../src/game/levels';
import { InputController } from '../src/controllers/InputController';
import Matter from 'matter-js';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    process.exit(1);
  } else {
    console.log(`✅ PASSED: ${message}`);
  }
}

async function runRisingZoneTests() {
  console.log('=== Starting Rising Hazard Zone Unit & Integration Test Suite ===\n');

  const dummyInput = new InputController();

  // -------------------------------------------------------------
  // TEST 1: Level Configuration Isolation
  // -------------------------------------------------------------
  console.log('--- Test 1: Level Configuration Isolation ---');
  const level1Data = getLevelData(1);
  const level2Data = getLevelData(2);
  const level3Data = getLevelData(3);

  assert(!level1Data.risingZone, 'Level 1 has no rising zone configured');
  assert(!level3Data.risingZone, 'Level 3 has no rising zone configured');
  assert(!!level2Data.risingZone, 'Level 2 has rising zone configured');
  assert(level2Data.risingZone?.startX === 5400, 'Level 2 rising zone startX is 5400');
  assert(level2Data.risingZone?.endX === 6600, 'Level 2 rising zone endX is 6600');
  assert(level2Data.risingZone?.initialY === 1850, 'Level 2 rising zone initialY is 1850 (below floor)');
  assert(level2Data.risingZone?.targetY === 680, 'Level 2 rising zone targetY is 680 (summit)');
  assert(level2Data.risingZone?.speed === 16, 'Level 2 rising zone speed is 16 px/sec');

  // -------------------------------------------------------------
  // TEST 2: Pre-Activation & Visibility from Checkpoint 4
  // -------------------------------------------------------------
  console.log('\n--- Test 2: Pre-Activation & Visibility from Checkpoint 4 ---');
  // Ball starts at Checkpoint 4 (x: 5450, y: 1695)
  const world2 = new PhysicsWorld(
    level2Data.platforms,
    level2Data.worldWidth,
    level2Data.worldHeight,
    5450,
    1695,
    level2Data.coins ?? [],
    undefined,
    level2Data.keys ?? [],
    undefined,
    false,
    level2Data.risingZone
  );

  // Initial step at Checkpoint 4 (x = 5450 >= triggerX = 5400)
  world2.step(16.667, dummyInput);
  const initialY = world2.getRisingLavaY();
  assert(initialY !== undefined, 'Rising zone is immediately active and defined at Checkpoint 4');
  assert(initialY === 1850, `Rising zone initial Y is 1850 (measured: ${initialY})`);

  // Ball steps onto Step 1 (x: 5550, y: 1650)
  Matter.Body.setPosition((world2 as any).ball, { x: 5550, y: 1650 });
  Matter.Body.setVelocity((world2 as any).ball, { x: 0, y: 0 });
  world2.step(16.667, dummyInput);

  assert(world2.getLives() === 3, 'Ball standing on Step 1 (y: 1650) is safely ABOVE rising zone (y: 1850) and survives');
  assert(world2.getDeathCount() === 0, 'No instant death on Step 1');

  // -------------------------------------------------------------
  // TEST 3: Smooth Upward Ascent
  // -------------------------------------------------------------
  console.log('\n--- Test 3: Smooth Upward Ascent ---');
  // Advance ball past riseStartX (5500) into climb corridor at x = 5750, y = 1450
  Matter.Body.setPosition((world2 as any).ball, { x: 5750, y: 1450 });
  Matter.Body.setVelocity((world2 as any).ball, { x: 0, y: 0 });

  // Simulate 60 frames (~1.0 second)
  for (let i = 0; i < 60; i++) {
    world2.step(16.667, dummyInput);
  }

  const yAfter1s = world2.getRisingLavaY();
  assert(yAfter1s !== undefined, 'Rising zone remains active');
  if (yAfter1s !== undefined) {
    assert(
      yAfter1s < 1850,
      `Rising zone is rising upwards: ${yAfter1s.toFixed(1)} < 1850`
    );
    const riseAmount = 1850 - yAfter1s;
    assert(
      Math.abs(riseAmount - 16) < 2.0,
      `Rising zone rose ~16px in 1 second (actual: ${riseAmount.toFixed(2)}px)`
    );
  }

  // -------------------------------------------------------------
  // TEST 4: Lethality on Contact & Respawn Reset
  // -------------------------------------------------------------
  console.log('\n--- Test 4: Lethality on Contact & Respawn Reset ---');
  // Drop ball below the rising zone surface (y: 1900)
  Matter.Body.setPosition((world2 as any).ball, { x: 5750, y: 1900 });
  Matter.Body.setVelocity((world2 as any).ball, { x: 0, y: 0 });
  world2.step(16.667, dummyInput);

  assert(world2.getLives() === 2, 'Contact with rising zone correctly deducts 1 life (3 -> 2)');
  assert(world2.getDeathCount() === 1, 'Death count incremented to 1');

  // Upon respawn at Checkpoint 4 (x: 5450), rising zone resets to initialY (1850) and stays VISIBLE!
  const respawnY = world2.getRisingLavaY();
  assert(respawnY !== undefined, 'Rising zone remains defined upon respawn at Checkpoint 4');
  assert(respawnY === 1850, `Rising zone reset back to bottom at y: 1850 (measured: ${respawnY})`);

  // -------------------------------------------------------------
  // TEST 5: Level 1 & Level 3 No Phantom Rising Zone
  // -------------------------------------------------------------
  console.log('\n--- Test 5: Level 1 & Level 3 Phantom Trigger Prevention ---');
  const world1 = new PhysicsWorld(
    level1Data.platforms,
    level1Data.worldWidth,
    level1Data.worldHeight,
    5000,
    1400,
    level1Data.coins ?? []
  );
  Matter.Body.setPosition((world1 as any).ball, { x: 5600, y: 1400 });
  world1.step(16.667, dummyInput);
  assert(world1.getRisingLavaY() === undefined, 'Level 1 does not spawn rising zone at x: 5600');
  assert(world1.getLives() === 3, 'Level 1 player does not take damage');

  const world3 = new PhysicsWorld(
    level3Data.platforms,
    level3Data.worldWidth,
    level3Data.worldHeight,
    5600,
    1400,
    level3Data.coins ?? []
  );
  Matter.Body.setPosition((world3 as any).ball, { x: 6000, y: 1400 });
  world3.step(16.667, dummyInput);
  assert(world3.getRisingLavaY() === undefined, 'Level 3 does not spawn rising zone at x: 6000');
  assert(world3.getLives() === 3, 'Level 3 player does not take damage');

  console.log('\n🎉 ALL RISING HAZARD ZONE UNIT & INTEGRATION TESTS PASSED! 🎉');
}

runRisingZoneTests().catch((err) => {
  console.error('Unhandled test failure:', err);
  process.exit(1);
});
