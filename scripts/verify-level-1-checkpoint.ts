import Matter from 'matter-js';
import { getLevelData } from '../src/game/levels';
import { PhysicsWorld } from '../src/game/physics';
import { InputController } from '../src/controllers/InputController';
import { saveManager } from '../src/services/SaveManager';
import { walletService } from '../src/wallet/walletService';

function assert(condition: boolean, msg: string) {
  if (!condition) {
    console.error(`❌ FAILED: ${msg}`);
    process.exit(1);
  }
  console.log(`✅ PASSED: ${msg}`);
}

async function runLevel1CheckpointTests() {
  console.log('================================================================');
  console.log('🧪 VERIFY LEVEL 1 CHECKPOINT & 3-LIFE RESPAWN SAVE SYSTEM');
  console.log('================================================================\n');

  await saveManager.resetForTesting();
  await walletService.saveCoins(100);

  const level1 = getLevelData(1);
  const input = new InputController();

  // ---------------------------------------------------------------------------
  // Test 1: Checkpoint definition in Level 1 platforms
  // ---------------------------------------------------------------------------
  console.log('--- Test 1: Checkpoint Platform Definition in Level 1 ---');
  const cp1 = level1.platforms.find((plat) => plat.id === 'l1_checkpoint_1');
  assert(cp1 !== undefined, 'l1_checkpoint_1 exists in Level 1 platforms');
  assert(cp1?.type === 'checkpoint', 'l1_checkpoint_1 type is "checkpoint"');
  assert(cp1?.x === 2680 && cp1?.y === 645, 'l1_checkpoint_1 positioned at (2680, 645) on sec3_safe_island');
  assert(cp1?.isActivated !== true, 'l1_checkpoint_1 is initially unactivated');

  const p = new PhysicsWorld(
    level1.platforms,
    level1.worldWidth,
    level1.worldHeight,
    level1.initialBallX,
    level1.initialBallY,
    level1.coins ?? [],
    (coin) => {
      walletService.addCoins(coin.value ?? 1).catch(() => {});
    }
  );

  assert(p.getLives() === 3, 'Player starts with 3 lives');
  assert(
    p.getActiveCheckpoint().x === level1.initialBallX &&
      p.getActiveCheckpoint().y === level1.initialBallY,
    'Active checkpoint starts at Level 1 spawn (160, 1300)'
  );

  // ---------------------------------------------------------------------------
  // Test 2: Dying before reaching checkpoint respawns at Level 1 start
  // ---------------------------------------------------------------------------
  console.log('\n--- Test 2: Death Prior to Checkpoint Respawns at Start ---');
  const spike1 = level1.platforms.find((plat) => plat.id === 'sec3_spikes_1')!;
  // @ts-ignore
  Matter.Body.setPosition(p['ball'], { x: spike1.x, y: spike1.y });
  p.step(16.67, input);

  console.log(`  Lives after pre-checkpoint death: ${p.getLives()}`);
  const statePreDeath = p.getBallState();
  console.log(`  Ball position after pre-checkpoint death: (${statePreDeath.x}, ${statePreDeath.y})`);

  assert(p.getLives() === 2, 'Lives decremented from 3 to 2');
  assert(
    statePreDeath.x === level1.initialBallX && statePreDeath.y === level1.initialBallY,
    'Ball respawned at Level 1 start position (160, 1300)'
  );
  assert(p.getIsInvulnerable(), 'Ball enters 1.2s invulnerability window');

  // Advance time past invulnerability window
  for (let i = 0; i < 80; i++) p.step(16.67, input);
  assert(!p.getIsInvulnerable(), 'Invulnerability expires');

  // ---------------------------------------------------------------------------
  // Test 3: Touching Checkpoint activates beacon and sets activeCheckpoint
  // ---------------------------------------------------------------------------
  console.log('\n--- Test 3: Activating Checkpoint on sec3_safe_island ---');
  // Teleport ball right onto checkpoint beacon
  // @ts-ignore
  Matter.Body.setPosition(p['ball'], { x: cp1!.x, y: cp1!.y });
  p.step(16.67, input);

  assert(cp1!.isActivated === true, 'l1_checkpoint_1 marked isActivated = true');
  const activeCp = p.getActiveCheckpoint();
  console.log(`  Active checkpoint coordinates: (${activeCp.x}, ${activeCp.y})`);
  assert(
    activeCp.x === cp1!.x && activeCp.y === cp1!.y - 10,
    `Active checkpoint updated to (${cp1!.x}, ${cp1!.y - 10})`
  );

  // ---------------------------------------------------------------------------
  // Test 4: Dying after checkpoint respawns at Checkpoint (2 -> 1 Life)
  // ---------------------------------------------------------------------------
  console.log('\n--- Test 4: Death After Checkpoint Respawns at Midpoint ---');
  // Teleport into Section 4 chasm spikes (x: 3150, y: 1080)
  const chasmSpikes = level1.platforms.find((plat) => plat.id === 'sec4_chasm_spikes')!;
  // @ts-ignore
  Matter.Body.setPosition(p['ball'], { x: chasmSpikes.x, y: chasmSpikes.y });
  p.step(16.67, input);

  console.log(`  Lives after post-checkpoint death: ${p.getLives()}`);
  const statePostDeath = p.getBallState();
  console.log(`  Ball position after death: (${statePostDeath.x}, ${statePostDeath.y})`);

  assert(p.getLives() === 1, 'Lives decremented from 2 to 1');
  assert(
    statePostDeath.x === cp1!.x && statePostDeath.y === cp1!.y - 10,
    'Ball respawned at Checkpoint 1 on sec3_safe_island (2680, 635)!'
  );
  assert(p.getIsInvulnerable(), 'Ball is protected by 1.2s invulnerability');

  // Advance time past invulnerability
  for (let i = 0; i < 80; i++) p.step(16.67, input);

  // ---------------------------------------------------------------------------
  // Test 5: Dying a 3rd time triggers Game Over and Level Restart
  // ---------------------------------------------------------------------------
  console.log('\n--- Test 5: 3rd Death Triggers Game Over & Level Restart ---');
  // Teleport into Section 4 spikes again for 3rd failure
  // @ts-ignore
  Matter.Body.setPosition(p['ball'], { x: chasmSpikes.x, y: chasmSpikes.y });
  p.step(16.67, input);

  console.log(`  Lives after 3rd failure: ${p.getLives()}`);
  console.log(`  Game Over banner: "${p.getGameOverNotification()}"`);
  const stateGameOver = p.getBallState();
  console.log(`  Ball position after Game Over: (${stateGameOver.x}, ${stateGameOver.y})`);

  assert(p.getLives() === 3, 'All 3 lives restored on Game Over / Level Restart');
  assert(cp1!.isActivated === false, 'l1_checkpoint_1 reset to unactivated');
  assert(
    p.getActiveCheckpoint().x === level1.initialBallX &&
      p.getActiveCheckpoint().y === level1.initialBallY,
    'Active checkpoint reset back to original Level 1 starting point (160, 1300)'
  );
  assert(
    stateGameOver.x === level1.initialBallX && stateGameOver.y === level1.initialBallY,
    'Ball respawned at Level 1 start (160, 1300)'
  );
  assert(
    p.getGameOverNotification() !== null && p.getGameOverNotification()!.includes('RESTARTED'),
    'Game Over / Level Restart notification triggered'
  );

  // ---------------------------------------------------------------------------
  // Test 6: Wallet and Coin Collection Persistence Across Level 1
  // ---------------------------------------------------------------------------
  console.log('\n--- Test 6: Persistent Coins Across Level 1 Checkpoint & Deaths ---');
  const coins = p.getActiveCoins();
  assert(coins.length > 0, 'Level 1 has active coins');
  const coin = coins[0];

  // Collect coin
  // @ts-ignore
  Matter.Body.setPosition(p['ball'], { x: coin.x, y: coin.y });
  p.step(16.67, input);

  await new Promise((r) => setTimeout(r, 60));
  const walletCoins = await walletService.loadCoins();
  assert(walletCoins === 101, 'Wallet balance incremented by 1');
  assert(saveManager.isCoinCollected(coin.id), 'Coin marked permanently collected in SaveManager');

  console.log('\n🎉 ALL 6 LEVEL 1 CHECKPOINT & 3-LIFE RESPAWN TESTS PASSED PERFECTLY!\n');
}

runLevel1CheckpointTests().catch((err) => {
  console.error(err);
  process.exit(1);
});
