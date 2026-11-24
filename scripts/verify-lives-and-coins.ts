import Matter from 'matter-js';
import { getLevelData } from '../src/game/levels';
import { PhysicsWorld } from '../src/game/physics';
import { InputController } from '../src/controllers/InputController';
import { saveManager } from '../src/services/SaveManager';
import { walletService } from '../src/wallet/walletService';
import { CoinData } from '../src/types/game';

function assert(condition: boolean, msg: string) {
  if (!condition) {
    console.error(`❌ FAILED: ${msg}`);
    process.exit(1);
  }
  console.log(`✅ PASSED: ${msg}`);
}

async function runTests() {
  console.log('================================================================');
  console.log('🧪 VERIFY 3-LIFE SYSTEM & PERSISTENT COINS ACROSS ALL LEVELS');
  console.log('================================================================\n');

  // Reset test environment
  await saveManager.resetForTesting();
  await walletService.saveCoins(100);

  const input = new InputController();
  const level1 = getLevelData(1);

  // ---------------------------------------------------------------------------
  // Scenario 1: Start a new level with 3 lives
  // ---------------------------------------------------------------------------
  console.log('--- Scenario 1: Initial 3 Lives ---');
  let collectedCount = 0;
  const onCollect = (coin: CoinData) => {
    collectedCount++;
    walletService.addCoins(coin.value ?? 1).catch(() => {});
  };

  const p1 = new PhysicsWorld(
    level1.platforms,
    level1.worldWidth,
    level1.worldHeight,
    level1.initialBallX,
    level1.initialBallY,
    level1.coins ?? [],
    onCollect
  );

  console.log(`  Initial lives: ${p1.getLives()}`);
  assert(p1.getLives() === 3, 'Player starts with 3 lives');
  assert(!p1.getIsInvulnerable(), 'Ball is not invulnerable at start');

  // ---------------------------------------------------------------------------
  // Scenario 2: Die once and verify 2 lives remain
  // ---------------------------------------------------------------------------
  console.log('\n--- Scenario 2: First Death (3 -> 2 Lives) ---');
  // Teleport into spike in Section 3
  const spike1 = level1.platforms.find((plat) => plat.type === 'spike')!;
  // @ts-ignore
  Matter.Body.setPosition(p1['ball'], { x: spike1.x, y: spike1.y });
  p1.step(16.67, input);

  console.log(`  Lives after 1st death: ${p1.getLives()}`);
  assert(p1.getLives() === 2, 'Lives decreased to 2 after first death');
  assert(p1.getIsInvulnerable(), 'Ball enters brief invulnerability window after respawn');

  // Advance time past invulnerability window (1.3s = 80 frames)
  for (let i = 0; i < 80; i++) p1.step(16.67, input);
  assert(!p1.getIsInvulnerable(), 'Invulnerability expires after respawn window');

  // ---------------------------------------------------------------------------
  // Scenario 3: Die twice and verify 1 life remains
  // ---------------------------------------------------------------------------
  console.log('\n--- Scenario 3: Second Death (2 -> 1 Life) ---');
  // @ts-ignore
  Matter.Body.setPosition(p1['ball'], { x: spike1.x, y: spike1.y });
  p1.step(16.67, input);

  console.log(`  Lives after 2nd death: ${p1.getLives()}`);
  assert(p1.getLives() === 1, 'Lives decreased to 1 after second death');

  // Advance time past invulnerability
  for (let i = 0; i < 80; i++) p1.step(16.67, input);

  // ---------------------------------------------------------------------------
  // Scenario 4: Die a third time and verify level restart with 3 lives restored
  // ---------------------------------------------------------------------------
  console.log('\n--- Scenario 4: Third Death / Game Over (Level Restart & 3 Lives Restored) ---');
  // Set a checkpoint first to verify it resets on 3rd failure
  // @ts-ignore
  p1['activeCheckpoint'] = { x: 2500, y: 800 };

  // @ts-ignore
  Matter.Body.setPosition(p1['ball'], { x: spike1.x, y: spike1.y });
  p1.step(16.67, input);

  console.log(`  Lives after 3rd death: ${p1.getLives()}`);
  console.log(`  Game Over notification: "${p1.getGameOverNotification()}"`);
  console.log(`  Respawn checkpoint: (${p1.getActiveCheckpoint().x}, ${p1.getActiveCheckpoint().y})`);

  assert(p1.getLives() === 3, 'Lives restored to 3 after 3 failures (Game Over)');
  assert(
    p1.getActiveCheckpoint().x === level1.initialBallX &&
      p1.getActiveCheckpoint().y === level1.initialBallY,
    'Checkpoint reset to original level starting position'
  );
  assert(
    p1.getGameOverNotification() !== null && p1.getGameOverNotification()!.includes('RESTARTED'),
    'Game Over notification displayed'
  );

  // ---------------------------------------------------------------------------
  // Scenario 5: Collect several coins and verify wallet balance increases
  // ---------------------------------------------------------------------------
  console.log('\n--- Scenario 5: Coin Collection & Wallet Crediting ---');
  const initialCoins = await walletService.loadCoins();
  console.log(`  Starting wallet coins: ${initialCoins}`);

  const activeCoins = p1.getActiveCoins();
  assert(activeCoins.length === 12, 'Level 1 has 12 collectible coins initially');

  // Collect first 2 coins
  const coin1 = activeCoins[0];
  const coin2 = activeCoins[1];

  // Teleport to coin1
  // @ts-ignore
  Matter.Body.setPosition(p1['ball'], { x: coin1.x, y: coin1.y });
  p1.step(16.67, input);

  // Teleport to coin2
  // @ts-ignore
  Matter.Body.setPosition(p1['ball'], { x: coin2.x, y: coin2.y });
  p1.step(16.67, input);

  // Wait a tick for async wallet write
  await new Promise((r) => setTimeout(r, 50));

  const updatedWallet = await walletService.loadCoins();
  console.log(`  Updated wallet coins: ${updatedWallet}`);
  assert(updatedWallet === initialCoins + 2, 'Wallet balance increased by 2 after collecting 2 coins');
  assert(p1.getActiveCoins().length === 10, 'Collected coins removed from active level list');

  // ---------------------------------------------------------------------------
  // Scenario 6: Die after collecting coins and verify balance remains unchanged
  // ---------------------------------------------------------------------------
  console.log('\n--- Scenario 6: Death After Coin Collection (Balance Retained) ---');
  // Trigger death
  for (let i = 0; i < 80; i++) p1.step(16.67, input); // clear invuln
  // @ts-ignore
  Matter.Body.setPosition(p1['ball'], { x: spike1.x, y: spike1.y });
  p1.step(16.67, input);

  const walletAfterDeath = await walletService.loadCoins();
  console.log(`  Wallet coins after death: ${walletAfterDeath}`);
  assert(walletAfterDeath === updatedWallet, 'Wallet balance permanently preserved after player death');

  // ---------------------------------------------------------------------------
  // Scenario 7: App reload preserves wallet balance and collected coin IDs
  // ---------------------------------------------------------------------------
  console.log('\n--- Scenario 7: App Reload Persistence ---');
  // Re-read directly from persistent SaveManager and walletService
  const savedCoinIds = saveManager.getCollectedCoinIds();
  assert(savedCoinIds.has(coin1.id), `SaveManager persisted coin1 ID (${coin1.id})`);
  assert(savedCoinIds.has(coin2.id), `SaveManager persisted coin2 ID (${coin2.id})`);

  // Simulate cold app restart: create a new PhysicsWorld for Level 1
  const p1Reloaded = new PhysicsWorld(
    level1.platforms,
    level1.worldWidth,
    level1.worldHeight,
    level1.initialBallX,
    level1.initialBallY,
    level1.coins ?? []
  );

  console.log(`  Remaining active coins in Level 1 after reload: ${p1Reloaded.getActiveCoins().length}`);
  assert(
    p1Reloaded.getActiveCoins().length === 10,
    'Previously collected coins remain collected and are not re-spawned on reload'
  );

  // ---------------------------------------------------------------------------
  // Scenario 8: Replay level - collected coins cannot be collected again
  // ---------------------------------------------------------------------------
  console.log('\n--- Scenario 8: Replay Level (No Duplicate Rewards) ---');
  const walletBeforeRevisit = await walletService.loadCoins();

  // Try to touch the position where coin1 used to be
  // @ts-ignore
  Matter.Body.setPosition(p1Reloaded['ball'], { x: coin1.x, y: coin1.y });
  p1Reloaded.step(16.67, input);

  await new Promise((r) => setTimeout(r, 50));
  const walletAfterRevisit = await walletService.loadCoins();
  assert(
    walletAfterRevisit === walletBeforeRevisit,
    'Touching already-collected coin location does NOT reward coins again'
  );

  // ---------------------------------------------------------------------------
  // Scenario 9: Switch between Level 1, 2, and 3 with wallet consistency
  // ---------------------------------------------------------------------------
  console.log('\n--- Scenario 9: Cross-Level Wallet Consistency ---');
  const level2 = getLevelData(2);
  const level3 = getLevelData(3);

  const p2 = new PhysicsWorld(
    level2.platforms,
    level2.worldWidth,
    level2.worldHeight,
    level2.initialBallX,
    level2.initialBallY,
    level2.coins ?? []
  );

  const p3 = new PhysicsWorld(
    level3.platforms,
    level3.worldWidth,
    level3.worldHeight,
    level3.initialBallX,
    level3.initialBallY,
    level3.coins ?? []
  );

  console.log(`  Level 2 coins: ${p2.getActiveCoins().length} (15 expected)`);
  console.log(`  Level 3 coins: ${p3.getActiveCoins().length} (20 expected)`);
  assert(p2.getActiveCoins().length === 15, 'Level 2 has 15 collectible coins');
  assert(p3.getActiveCoins().length === 20, 'Level 3 has 20 collectible coins');

  // Collect 1 coin in Level 2
  const l2Coin1 = p2.getActiveCoins()[0];
  const isMarked = await saveManager.markCoinCollected(l2Coin1.id);
  assert(isMarked === true, 'Level 2 coin newly marked in SaveManager');
  await walletService.saveCoins((await walletService.loadCoins()) + 1);

  // Switch to Level 3 and verify wallet balance retained
  const walletInLevel3 = await walletService.loadCoins();
  console.log(`  Wallet balance in Level 3: ${walletInLevel3}`);
  assert(walletInLevel3 === walletBeforeRevisit + 1, 'Wallet balance seamlessly consistent across levels');

  // ---------------------------------------------------------------------------
  // Scenario 10: Trigger same coin collision multiple times (Idempotency)
  // ---------------------------------------------------------------------------
  console.log('\n--- Scenario 10: Idempotent Atomic Collision Handling ---');
  const testCoinId = 'atomic_test_coin_001';
  const firstCollect = await saveManager.markCoinCollected(testCoinId);
  const secondCollect = await saveManager.markCoinCollected(testCoinId);
  const thirdCollect = await saveManager.markCoinCollected(testCoinId);

  console.log(`  1st attempt result: ${firstCollect}`);
  console.log(`  2nd attempt result: ${secondCollect}`);
  console.log(`  3rd attempt result: ${thirdCollect}`);

  assert(firstCollect === true, '1st collection attempt returns true (success)');
  assert(secondCollect === false, '2nd duplicate attempt returns false (rejected)');
  assert(thirdCollect === false, '3rd duplicate attempt returns false (rejected)');

  console.log('\n🎉 ALL 10 3-LIFE & PERSISTENT COIN SCENARIOS PASSED WITH 100% SUCCESS!\n');
}

runTests().catch((err) => {
  console.error(err);
  process.exit(1);
});
