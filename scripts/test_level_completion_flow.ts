import { saveManager } from '../src/services/SaveManager';
import { calculateStars, getLevelData } from '../src/game/levels';
import { PhysicsWorld } from '../src/game/physics';
import { InputController } from '../src/controllers/InputController';
import Matter from 'matter-js';

declare const process: any;

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    process.exit(1);
  } else {
    console.log(`✅ PASSED: ${message}`);
  }
}

async function runTests() {
  console.log('=== Starting Level Completion & Anti-Crash Flow Test Suite ===\n');

  await saveManager.resetForTesting();

  const inputController = new InputController();

  // ------------------------------------------------------------------
  // TEST 1: Level 1 Exit Ring Trigger & Physics Freeze Verification
  // ------------------------------------------------------------------
  console.log('--- Test 1: Exit Ring Trigger, Physics Freeze & Anti-Void Protection ---');
  const lvl1 = getLevelData(1);
  const exitPlatform1 = lvl1.platforms.find((p) => p.type === 'exit');
  assert(exitPlatform1 !== undefined, 'Level 1 has an exit ring');

  const physics1 = new PhysicsWorld(
    lvl1.platforms,
    lvl1.worldWidth,
    lvl1.worldHeight,
    lvl1.initialBallX,
    lvl1.initialBallY,
    lvl1.coins,
    undefined,
    lvl1.keys,
    undefined,
    false,
    lvl1.risingZone
  );

  assert(!physics1.getIsLevelComplete(), 'Initially isLevelComplete is false');
  assert(physics1.getLives() === 3, 'Initial lives are 3');

  // Position ball directly onto the exit ring
  Matter.Body.setPosition((physics1 as any).ball, { x: exitPlatform1!.x, y: exitPlatform1!.y });

  // Step physics to process exit ring trigger
  physics1.step(16.667, inputController);

  assert(physics1.getIsLevelComplete(), 'Physics reports isLevelComplete = true after touching exit ring');

  const ballStateAtExit = physics1.getBallState();
  assert(ballStateAtExit.vx === 0 && ballStateAtExit.vy === 0, 'Ball velocity is immediately zeroed upon completion');

  // Now simulate 60 frames (1 full second) of physics steps with user trying to jump/move
  inputController.setRight(true);
  inputController.setJump(true);

  for (let i = 0; i < 60; i++) {
    physics1.step(16.667, inputController);
  }

  const ballStateAfter60Frames = physics1.getBallState();
  assert(
    ballStateAfter60Frames.vx === 0 && ballStateAfter60Frames.vy === 0,
    'Ball velocity remains completely frozen at 0 despite user input'
  );
  assert(physics1.getLives() === 3, 'Lives remain 3 — no hazard or void deaths can trigger');
  assert(physics1.getDeathCount() === 0, 'Death count remains 0 after completion');

  // Verify that even if ball were placed below world boundary after completion, triggerDeath does nothing
  Matter.Body.setPosition((physics1 as any).ball, { x: exitPlatform1!.x, y: lvl1.worldHeight + 500 });
  physics1.step(16.667, inputController);
  assert(physics1.getLives() === 3, 'Post-completion void falling never reduces lives');
  assert(physics1.getIsLevelComplete(), 'isLevelComplete remains true');

  // ------------------------------------------------------------------
  // TEST 2: Replay / Reset Resets Completion Flag Safely
  // ------------------------------------------------------------------
  console.log('\n--- Test 2: Replay / Reset Cleanses Level Completion State ---');
  physics1.resetBall(true);
  assert(!physics1.getIsLevelComplete(), 'resetBall(true) resets isLevelComplete back to false');
  assert(physics1.getLives() === 3, 'Lives restored to 3');
  const ballAfterReset = physics1.getBallState();
  assert(
    Math.abs(ballAfterReset.x - lvl1.initialBallX) < 5 && Math.abs(ballAfterReset.y - lvl1.initialBallY) < 5,
    'Ball returned to initial spawn point'
  );

  // ------------------------------------------------------------------
  // TEST 3: All 5 Levels Completion, Rewards & Unlocking Progression
  // ------------------------------------------------------------------
  console.log('\n--- Test 3: Progression Unlocks for Levels 1 through 5 ---');
  for (let lvl = 1; lvl <= 5; lvl++) {
    const lvlData = getLevelData(lvl);
    const exitPlat = lvlData.platforms.find((p) => p.type === 'exit');
    assert(exitPlat !== undefined, `Level ${lvl} has a valid exit platform`);

    const phys = new PhysicsWorld(
      lvlData.platforms,
      lvlData.worldWidth,
      lvlData.worldHeight,
      lvlData.initialBallX,
      lvlData.initialBallY,
      lvlData.coins,
      undefined,
      lvlData.keys,
      undefined,
      false,
      lvlData.risingZone
    );

    // Place at exit and step
    Matter.Body.setPosition((phys as any).ball, { x: exitPlat!.x, y: exitPlat!.y });
    phys.step(16.667, inputController);
    assert(phys.getIsLevelComplete(), `Level ${lvl} triggers completion upon reaching exit`);

    // Verify synchronous rating calculation
    const elapsed = 45;
    const deaths = 0;
    const stars = calculateStars(lvl, elapsed, deaths);
    assert(stars === 3, `Level ${lvl} calculated 3 stars for flawless run`);

    // Record completion in saveManager
    const result = await saveManager.recordLevelCompletion(lvl, elapsed, stars);
    assert(saveManager.isLevelCompleted(lvl), `Level ${lvl} is recorded as completed in SaveManager`);

    if (lvl < 5) {
      assert(saveManager.isLevelUnlocked(lvl + 1), `Next level (${lvl + 1}) is successfully unlocked`);
    }

    assert(result.isNewBestStars, `Level ${lvl} recorded new best stars`);
  }

  // Verify all 5 levels completed
  assert(saveManager.getCompletedLevels().length === 5, 'All 5 levels completed successfully in SaveManager');

  console.log('\n=== All Level Completion & Anti-Crash Tests Passed Flawlessly! ===\n');
}

runTests().catch((err) => {
  console.error('Unhandled error in test runner:', err);
  process.exit(1);
});
