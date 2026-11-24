import { PhysicsWorld } from '../src/game/physics';
import { KeyManager } from '../src/game/KeyManager';
import { saveManager } from '../src/services/SaveManager';
import { KeyData, PlatformData } from '../src/types/game';
import { InputController } from '../src/controllers/InputController';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    process.exit(1);
  } else {
    console.log(`✅ PASSED: ${message}`);
  }
}

async function runTests() {
  console.log('=== Starting Advanced Gameplay Mechanics Test Suite ===\n');

  // Clear save data before testing
  await saveManager.resetForTesting();

  const dummyInput = new InputController();

  // -------------------------------------------------------------
  // TEST 1: Keys & Locked Doors Collection and Persistence
  // -------------------------------------------------------------
  console.log('--- Test 1: Keys & Locked Doors ---');
  const testKeys: KeyData[] = [
    { id: 'key_meadow_bronze', keyId: 'key_meadow_bronze', name: 'Bronze Key', x: 100, y: 100, color: '#D4AF37' },
    { id: 'key_meadow_gold', keyId: 'key_meadow_gold', name: 'Gold Key', x: 300, y: 100, color: '#FFD700' },
  ];

  const keyMgr = new KeyManager(testKeys);
  assert(keyMgr.getActiveKeys().length === 2, 'Initial active keys count is 2');

  // Ball at (100, 100) collects bronze key
  const collected1 = keyMgr.checkCollisions(100, 100, 16);
  assert(collected1.length === 1 && collected1[0].id === 'key_meadow_bronze', 'Bronze key collected on contact');
  assert(keyMgr.getActiveKeys().length === 1, 'Active keys count decreases to 1');
  assert(saveManager.isKeyCollected('key_meadow_bronze'), 'SaveManager persists collected key');

  // Repeat collection attempt must fail (deduplication)
  const collectedRepeat = keyMgr.checkCollisions(100, 100, 16);
  assert(collectedRepeat.length === 0, 'Cannot re-collect already collected key');

  // Re-initialization from level config filters out already saved keys
  const keyMgrReinit = new KeyManager(testKeys);
  assert(keyMgrReinit.getActiveKeys().length === 1, 'Re-initialized KeyManager filters out saved keys');
  assert(keyMgrReinit.getActiveKeys()[0].id === 'key_meadow_gold', 'Gold key remains active');

  // Test Locked Door in PhysicsWorld
  const testPlatforms1: PlatformData[] = [
    { id: 'ground_1', x: 0, y: 300, width: 600, height: 40, type: 'ground' },
    { id: 'door_bronze', x: 200, y: 200, width: 24, height: 100, type: 'locked_door', requiredKeyId: 'key_meadow_bronze' },
    { id: 'door_gold', x: 350, y: 200, width: 24, height: 100, type: 'locked_door', requiredKeyId: 'key_meadow_gold' },
  ];

  // Ball starts away from door
  const world1 = new PhysicsWorld(testPlatforms1, 600, 400, 50, 200, [], undefined, testKeys);
  world1.step(16, dummyInput);
  let bronzeDoor = world1.getPlatforms().find((p) => p.id === 'door_bronze');
  assert(bronzeDoor?.isOpen !== true, 'Door remains closed until player approaches with key');

  // Ball moves to touch bronze door (player possesses bronze key)
  world1.setBallPosition(185, 200);
  world1.step(16, dummyInput);
  bronzeDoor = world1.getPlatforms().find((p) => p.id === 'door_bronze');
  assert(bronzeDoor?.isOpen === true, 'Door unlocks and opens when player touches it with bronze key');
  assert(saveManager.isDoorUnlocked('door_bronze'), 'Door unlock state is saved in SaveManager');

  // Ball moves to touch gold door (player does NOT possess gold key)
  world1.setBallPosition(335, 200);
  world1.step(16, dummyInput);
  const goldDoor = world1.getPlatforms().find((p) => p.id === 'door_gold');
  assert(goldDoor?.isOpen !== true, 'Door requiring uncollected gold key remains locked even upon contact');

  // -------------------------------------------------------------
  // TEST 2: Pressure Plates and Switches
  // -------------------------------------------------------------
  console.log('\n--- Test 2: Pressure Plates and Switches ---');
  const testPlatforms2: PlatformData[] = [
    { id: 'ground_2', x: 400, y: 300, width: 800, height: 40, type: 'ground' },
    { id: 'sw_normal', x: 100, y: 280, width: 36, height: 14, type: 'pressure_plate' },
    { id: 'sw_heavy', x: 250, y: 280, width: 48, height: 16, type: 'heavy_pressure_plate' },
    { id: 'multi_door', x: 500, y: 200, width: 24, height: 100, type: 'locked_door', requiredSwitches: ['sw_p1', 'sw_p2'] },
    { id: 'sw_p1', x: 350, y: 280, width: 36, height: 14, type: 'pressure_plate' },
    { id: 'sw_p2', x: 420, y: 280, width: 36, height: 14, type: 'pressure_plate' },
  ];

  // Test Normal Pressure Plate with original ball
  const world2 = new PhysicsWorld(testPlatforms2, 800, 400, 100, 250);
  world2.step(16, dummyInput);
  let platforms2 = world2.getPlatforms();
  const normalSwitch = platforms2.find((p) => p.id === 'sw_normal');
  assert(normalSwitch?.isPressed === true, 'Original ball activates normal pressure plate');

  // Test Heavy Pressure Plate with original ball (must NOT activate)
  const worldHeavy1 = new PhysicsWorld(testPlatforms2, 800, 400, 250, 250);
  worldHeavy1.setBallForm('original');
  worldHeavy1.step(16, dummyInput);
  platforms2 = worldHeavy1.getPlatforms();
  let heavyPlate = platforms2.find((p) => p.id === 'sw_heavy');
  assert(heavyPlate?.isPressed !== true, 'Original ball CANNOT activate heavy pressure plate');

  // Test Heavy Pressure Plate with Stone ball (MUST activate)
  const worldHeavy2 = new PhysicsWorld(testPlatforms2, 800, 400, 250, 250);
  assert(worldHeavy2.setBallForm('stone') === true, 'Ball transforms to Stone form');
  worldHeavy2.step(16, dummyInput);
  platforms2 = worldHeavy2.getPlatforms();
  heavyPlate = platforms2.find((p) => p.id === 'sw_heavy');
  assert(heavyPlate?.isPressed === true, 'Stone ball successfully activates heavy pressure plate');

  // Test Multi-switch Door (sw_p1 and sw_p2)
  // Step 1: Only activate sw_p1
  const worldMulti = new PhysicsWorld(testPlatforms2, 800, 400, 350, 250);
  worldMulti.step(16, dummyInput);
  platforms2 = worldMulti.getPlatforms();
  let multiDoor = platforms2.find((p) => p.id === 'multi_door');
  assert(multiDoor !== undefined && multiDoor.isOpen !== true, 'Multi-switch door remains locked when only 1 of 2 switches is triggered');

  // Step 2: Now ball moves to trigger sw_p2 as well
  worldMulti.setBallPosition(420, 250);
  worldMulti.step(16, dummyInput);
  platforms2 = worldMulti.getPlatforms();
  multiDoor = platforms2.find((p) => p.id === 'multi_door');
  assert(multiDoor?.isOpen === true, 'Multi-switch door unlocks when ALL required switches are triggered');

  // -------------------------------------------------------------
  // TEST 3: Spring and Bounce Pads
  // -------------------------------------------------------------
  console.log('\n--- Test 3: Spring and Bounce Pads ---');
  // Pad top is at y = 250 - 10 = 240.
  const testPlatforms3: PlatformData[] = [
    { id: 'bounce_1', x: 200, y: 250, width: 60, height: 20, type: 'bounce_pad', launchForceY: -20 },
  ];

  // Test Original form launch (radius 24 -> center at 240 - 24 = 216)
  const worldBounceOrig = new PhysicsWorld(testPlatforms3, 600, 400, 200, 216);
  worldBounceOrig.setBallForm('original');
  worldBounceOrig.step(16, dummyInput);
  const vyOrig = worldBounceOrig.getBallState().vy;
  assert(vyOrig <= -18, `Original ball launched upward with vy = ${vyOrig.toFixed(2)}`);

  // Test Big form launch (radius 34 -> center at 240 - 34 = 206, 1.3x multiplier -> higher launch velocity)
  const worldBounceBig = new PhysicsWorld(testPlatforms3, 600, 400, 200, 206);
  worldBounceBig.setBallForm('big');
  worldBounceBig.step(16, dummyInput);
  const vyBig = worldBounceBig.getBallState().vy;
  assert(vyBig < vyOrig, `Big ball has stronger launch force (vyBig = ${vyBig.toFixed(2)} vs vyOrig = ${vyOrig.toFixed(2)})`);

  // Test Stone form launch (radius 25 -> center at 240 - 25 = 215, 0.65x multiplier -> dampened launch)
  const worldBounceStone = new PhysicsWorld(testPlatforms3, 600, 400, 200, 215);
  worldBounceStone.setBallForm('stone');
  worldBounceStone.step(16, dummyInput);
  const vyStone = worldBounceStone.getBallState().vy;
  assert(vyStone > vyOrig && vyStone < 0, `Stone ball has heavier/dampened launch force (vyStone = ${vyStone.toFixed(2)} vs vyOrig = ${vyOrig.toFixed(2)})`);

  // -------------------------------------------------------------
  // TEST 4: Teleporters and Loop Prevention
  // -------------------------------------------------------------
  console.log('\n--- Test 4: Teleporters and Loop Prevention ---');
  const testPlatforms4: PlatformData[] = [
    { id: 'tp_alpha', x: 100, y: 200, width: 44, height: 60, type: 'teleporter', targetTeleporterId: 'tp_beta' },
    { id: 'tp_beta', x: 500, y: 200, width: 44, height: 60, type: 'teleporter', targetTeleporterId: 'tp_alpha' },
  ];

  const worldTP = new PhysicsWorld(testPlatforms4, 800, 400, 100, 200);
  worldTP.setBallForm('snow');
  // First step triggers teleport from alpha to beta (target 500, 188)
  worldTP.step(16, dummyInput);
  let ballState = worldTP.getBallState();
  assert(Math.abs(ballState.x - 500) < 5 && Math.abs(ballState.y - 188) < 5, `Ball teleported to destination (x=${ballState.x}, y=${ballState.y})`);
  assert(ballState.form === 'snow', `Ball form 'snow' preserved across teleportation`);

  // Next immediate step at destination must NOT immediately trigger tp_beta back to 100 (loop prevention)
  worldTP.step(16, dummyInput);
  ballState = worldTP.getBallState();
  assert(Math.abs(ballState.x - 500) < 10, `Cooldown prevents infinite teleport loop (ball remains near destination at x=${ballState.x.toFixed(1)})`);

  // -------------------------------------------------------------
  // TEST 5: Advanced Hazards & Life Manager
  // -------------------------------------------------------------
  console.log('\n--- Test 5: Advanced Hazards & 3-Life System ---');
  // Spikes armLength=80, count=2, at angle 0 the first spike is at (200 + 80 = 280, 200)
  const testPlatforms5: PlatformData[] = [
    { id: 'hazard_spikes', x: 200, y: 200, width: 48, height: 48, type: 'rotating_spikes', armLength: 80, spikeCount: 2, angularSpeed: 0 },
    { id: 'hazard_saw', x: 400, y: 200, width: 44, height: 44, type: 'moving_saw', sawRadius: 22, pathStartX: 400, pathEndX: 600, moveSpeed: 0 },
  ];

  // Ball placed at spike location (280, 200)
  const worldHazard = new PhysicsWorld(testPlatforms5, 800, 400, 280, 200);
  assert(worldHazard.getLives() === 3, 'Initial lives is 3');

  // Contact with rotating spikes
  worldHazard.step(16, dummyInput);
  assert(worldHazard.getLives() === 2, 'Contact with rotating spikes reduces lives from 3 to 2');
  assert(worldHazard.getIsInvulnerable() === true, 'Player enters invulnerability state after hit');

  // Next step during invulnerability must not drain remaining lives
  worldHazard.step(16, dummyInput);
  assert(worldHazard.getLives() === 2, 'Invulnerability prevents duplicate damage');

  // -------------------------------------------------------------
  // TEST 6: Disappearing, Falling Platforms & Secret Passages
  // -------------------------------------------------------------
  console.log('\n--- Test 6: Disappearing, Falling Platforms & Secret Passages ---');
  const testPlatforms6: PlatformData[] = [
    { id: 'disapp_1', x: 100, y: 200, width: 80, height: 20, type: 'disappearing_platform', cyclePeriod: 2.0, openDuration: 1.0 },
    { id: 'fall_1', x: 300, y: 200, width: 80, height: 20, type: 'falling_platform' },
    { id: 'secret_1', x: 500, y: 200, width: 60, height: 60, type: 'secret_passage' },
  ];

  // Disappearing platform initially solid/open (simTime = 0 < openDuration 1.0)
  const worldPlatforms = new PhysicsWorld(testPlatforms6, 800, 400, 50, 100);
  worldPlatforms.step(16, dummyInput);
  let pList = worldPlatforms.getPlatforms();
  let dp = pList.find((p) => p.id === 'disapp_1');
  assert(dp?.isCollapsed !== true, 'Disappearing platform is initially solid');

  // Fast forward simulation time by 1.2s -> now phase > openDuration -> platform disappears / collapses
  for (let i = 0; i < 75; i++) {
    worldPlatforms.step(16, dummyInput);
  }
  pList = worldPlatforms.getPlatforms();
  dp = pList.find((p) => p.id === 'disapp_1');
  assert(dp?.isCollapsed === true, 'Disappearing platform phases out and becomes non-solid during closed phase');

  // Ball steps onto falling platform top (fall_1 top is 190, ball r=24 at y=166 rests on top)
  worldPlatforms.setBallPosition(300, 166);
  worldPlatforms.step(16, dummyInput); // Grounding evaluated
  worldPlatforms.step(16, dummyInput); // Platform reaction triggered
  pList = worldPlatforms.getPlatforms();
  let fallP = pList.find((p) => p.id === 'fall_1');
  assert(fallP?.isShaking === true, 'Player landing on falling platform triggers warning tremor shake');

  // Ball moves into secret passage at (500, 200)
  worldPlatforms.setBallPosition(500, 200);
  worldPlatforms.step(16, dummyInput);
  pList = worldPlatforms.getPlatforms();
  let secretP = pList.find((p) => p.id === 'secret_1');
  assert(secretP?.isRevealed === true, 'Player discovering secret passage triggers reveal state');

  console.log('\n======================================================');
  console.log('🎉 ALL ADVANCED MECHANICS UNIT & INTEGRATION TESTS PASSED!');
  console.log('======================================================');
}

runTests().catch((e) => {
  console.error('Fatal error in test suite:', e);
  process.exit(1);
});
