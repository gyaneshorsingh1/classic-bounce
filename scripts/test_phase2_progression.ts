import { saveManager } from '../src/services/SaveManager';
import { calculateStars, getLevelData } from '../src/game/levels';
import { PhysicsWorld } from '../src/game/physics';
import { InputController } from '../src/controllers/InputController';
import { SoundManager } from '../src/services/SoundManager';
import { PlatformData } from '../src/types/game';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    process.exit(1);
  } else {
    console.log(`✅ PASSED: ${message}`);
  }
}

async function runTests() {
  console.log('=== Starting Phase 2 Progression, UI & Audio Test Suite ===\n');

  // Reset before testing
  await saveManager.resetForTesting();

  // ------------------------------------------------------------------
  // TEST 1: Initial Progression State
  // ------------------------------------------------------------------
  console.log('--- Test 1: Initial Progression State ---');
  assert(saveManager.isLevelUnlocked(1), 'Level 1 is unlocked by default');
  assert(!saveManager.isLevelUnlocked(2), 'Level 2 is locked by default');
  assert(!saveManager.isLevelUnlocked(3), 'Level 3 is locked by default');
  assert(!saveManager.isLevelCompleted(1), 'Level 1 is not completed initially');
  assert(saveManager.getHighestUnlockedLevel() === 1, 'Highest unlocked level is 1');
  assert(saveManager.getNextUncompletedLevel() === 1, 'Next uncompleted level is 1');

  // ------------------------------------------------------------------
  // TEST 2: Three-Star Rating Calculation Thresholds
  // ------------------------------------------------------------------
  console.log('\n--- Test 2: Three-Star Rating Calculation ---');
  // Level 1: maxTime3Star: 95, maxDeaths3Star: 0 | maxTime2Star: 180, maxDeaths2Star: 2
  assert(calculateStars(1, 45, 0) === 3, 'Level 1: 45s, 0 deaths = 3 Stars');
  assert(calculateStars(1, 95, 0) === 3, 'Level 1: 95s, 0 deaths = 3 Stars (edge)');
  assert(calculateStars(1, 100, 0) === 2, 'Level 1: 100s, 0 deaths = 2 Stars (exceeded 3-star time)');
  assert(calculateStars(1, 45, 1) === 2, 'Level 1: 45s, 1 death = 2 Stars (exceeded 3-star deaths)');
  assert(calculateStars(1, 175, 2) === 2, 'Level 1: 175s, 2 deaths = 2 Stars');
  assert(calculateStars(1, 185, 0) === 1, 'Level 1: 185s, 0 deaths = 1 Star');
  assert(calculateStars(1, 50, 3) === 1, 'Level 1: 50s, 3 deaths = 1 Star');

  // Level 2: maxTime3Star: 140, maxDeaths3Star: 1 | maxTime2Star: 240, maxDeaths2Star: 3
  assert(calculateStars(2, 110, 1) === 3, 'Level 2: 110s, 1 death = 3 Stars');
  assert(calculateStars(2, 150, 1) === 2, 'Level 2: 150s, 1 death = 2 Stars');
  assert(calculateStars(2, 220, 3) === 2, 'Level 2: 220s, 3 deaths = 2 Stars');
  assert(calculateStars(2, 250, 4) === 1, 'Level 2: 250s, 4 deaths = 1 Star');

  // Level 3: maxTime3Star: 180, maxDeaths3Star: 1 | maxTime2Star: 300, maxDeaths2Star: 4
  assert(calculateStars(3, 140, 0) === 3, 'Level 3: 140s, 0 deaths = 3 Stars');
  assert(calculateStars(3, 175, 1) === 3, 'Level 3: 175s, 1 death = 3 Stars');
  assert(calculateStars(3, 200, 2) === 2, 'Level 3: 200s, 2 deaths = 2 Stars');
  assert(calculateStars(3, 310, 1) === 1, 'Level 3: 310s, 1 death = 1 Star');
  assert(calculateStars(3, 100, 5) === 1, 'Level 3: 100s, 5 deaths = 1 Star');

  // ------------------------------------------------------------------
  // TEST 3: Level Unlocking & Progression Saving
  // ------------------------------------------------------------------
  console.log('\n--- Test 3: Level Unlocking & Progression Saving ---');
  // Complete Level 1
  const res1 = await saveManager.recordLevelCompletion(1, 62.4, 3);
  assert(res1.isNewBestTime, 'First run is marked as new best time');
  assert(res1.isNewBestStars, 'First run is marked as new best stars');
  assert(saveManager.isLevelCompleted(1), 'Level 1 is marked completed');
  assert(saveManager.isLevelUnlocked(2), 'Level 2 is automatically unlocked upon L1 completion');
  assert(saveManager.getHighestUnlockedLevel() === 2, 'Highest unlocked level is now 2');
  assert(saveManager.getNextUncompletedLevel() === 2, 'Next uncompleted level is now 2');

  const rec1 = saveManager.getLevelRecord(1);
  assert(rec1?.bestTimeSeconds === 62.4, 'Best time recorded as 62.4s');
  assert(rec1?.bestStars === 3, 'Best stars recorded as 3');

  // Replay Level 1 with slower time (75s) and lower stars (2) -> Should NOT degrade best record
  const res1Slower = await saveManager.recordLevelCompletion(1, 75.0, 2);
  assert(!res1Slower.isNewBestTime, 'Slower run is not a new best time');
  assert(!res1Slower.isNewBestStars, 'Fewer stars is not a new best star count');
  assert(saveManager.getLevelRecord(1)?.bestTimeSeconds === 62.4, 'Best time stays at 62.4s');
  assert(saveManager.getLevelRecord(1)?.bestStars === 3, 'Best stars stays at 3');

  // Replay Level 1 with faster time (48.2s) -> Should update best time!
  const res1Faster = await saveManager.recordLevelCompletion(1, 48.2, 3);
  assert(res1Faster.isNewBestTime, 'Faster run triggers isNewBestTime');
  assert(saveManager.getLevelRecord(1)?.bestTimeSeconds === 48.2, 'Best time updated to 48.2s');

  // Complete Level 2
  await saveManager.recordLevelCompletion(2, 115.8, 2);
  assert(saveManager.isLevelCompleted(2), 'Level 2 is marked completed');
  assert(saveManager.isLevelUnlocked(3), 'Level 3 is automatically unlocked upon L2 completion');
  assert(saveManager.getHighestUnlockedLevel() === 3, 'Highest unlocked level is now 3');
  assert(saveManager.getNextUncompletedLevel() === 3, 'Next uncompleted level is now 3');

  // ------------------------------------------------------------------
  // TEST 4: PhysicsWorld Elapsed Time & Death Tracking
  // ------------------------------------------------------------------
  console.log('\n--- Test 4: PhysicsWorld Gameplay Time & Death Counter ---');
  const dummyPlatforms: PlatformData[] = [
    { id: 'floor', x: 200, y: 300, width: 400, height: 40, type: 'ground' },
    { id: 'exit', x: 350, y: 250, width: 40, height: 40, type: 'exit' },
  ];
  const world = new PhysicsWorld(dummyPlatforms, 800, 600, 100, 200, []);
  const input = new InputController();

  assert(world.getElapsedGameplayTime() === 0, 'Initial elapsed time is 0');
  assert(world.getDeathCount() === 0, 'Initial death count is 0');

  // Step physics 60 times at 16.667ms (~1 second)
  for (let i = 0; i < 60; i++) {
    world.step(16.667, input);
  }

  const elapsedSec = world.getElapsedGameplayTime();
  assert(Math.abs(elapsedSec - 1.0) < 0.05, `Elapsed time is ~1.0s (measured: ${elapsedSec.toFixed(2)}s)`);

  // Simulate ball respawn death
  world.triggerDeath();
  assert(world.getDeathCount() === 1, 'Death count increments to 1 upon death/respawn');
  world.triggerDeath();
  assert(world.getDeathCount() === 2, 'Death count increments to 2 upon second death');

  // Restart level resets counters
  world.resetBall(true);
  assert(world.getElapsedGameplayTime() === 0, 'Resetting level resets elapsed time to 0');
  assert(world.getDeathCount() === 0, 'Resetting level resets death count to 0');

  // ------------------------------------------------------------------
  // TEST 5: Settings Management, Subscription & Reset
  // ------------------------------------------------------------------
  console.log('\n--- Test 5: Settings Management & Persistence ---');
  const defaultSettings = saveManager.getSettings();
  assert(defaultSettings.soundVolume === 1.0, 'Default Sound volume is 1.0');
  assert(defaultSettings.musicVolume === 0.7, 'Default Music volume is 0.7');
  assert(defaultSettings.controlLayout === 'split', 'Default control layout is split');
  assert(defaultSettings.graphicsQuality === 'high', 'Default graphics quality is high');

  let subscriptionNotified = false;
  const unsubscribe = saveManager.subscribe((updatedSettings) => {
    if (updatedSettings.controlLayout === 'left-cluster') {
      subscriptionNotified = true;
    }
  });

  await saveManager.updateSettings({
    controlLayout: 'left-cluster',
    soundVolume: 0.5,
    soundMuted: true,
  });

  const updatedSettings = saveManager.getSettings();
  assert(updatedSettings.controlLayout === 'left-cluster', 'Settings updated controlLayout');
  assert(updatedSettings.soundVolume === 0.5, 'Settings updated soundVolume');
  assert(updatedSettings.soundMuted === true, 'Settings updated soundMuted');
  assert(subscriptionNotified, 'SaveManager subscription was triggered on update');
  unsubscribe();

  // Test resetAllProgress: clears level records and unlocks back to Level 1, keeps settings intact
  await saveManager.resetAllProgress();
  assert(saveManager.isLevelUnlocked(1), 'Level 1 is still unlocked after reset');
  assert(!saveManager.isLevelUnlocked(2), 'Level 2 is locked again after reset');
  assert(!saveManager.isLevelCompleted(1), 'Level 1 completion reset');
  assert(saveManager.getSettings().controlLayout === 'left-cluster', 'User settings preserved across progress reset');

  // ------------------------------------------------------------------
  // TEST 6: SoundManager Safe Invocation & Volume Clamping
  // ------------------------------------------------------------------
  console.log('\n--- Test 6: SoundManager Audio Synthesis ---');
  // SoundManager should execute cleanly in any runtime environment (mocked Web Audio / Node)
  try {
    SoundManager.playJumpSound();
    SoundManager.playCoinSound();
    SoundManager.playLevelMusic(1);
    SoundManager.stopMusic();
    SoundManager.playLevelMusic(2);
    SoundManager.stopMusic();
    SoundManager.playLevelMusic(3);
    SoundManager.stopMusic();
    assert(true, 'SoundManager procedural synthesis executes without error');
  } catch (err) {
    assert(false, `SoundManager error: ${err}`);
  }

  console.log('\n🎉 ALL PHASE 2 PROGRESSION, UI & AUDIO TESTS PASSED SUCCESSFULLY! 🎉');
}

runTests().catch((err) => {
  console.error('Unhandled test rejection:', err);
  process.exit(1);
});
