import { DEFAULT_STARTING_COINS, walletService } from '../src/wallet/walletService';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    process.exit(1);
  } else {
    console.log(`✅ PASSED: ${message}`);
  }
}

async function runWalletTests() {
  console.log('--- STARTING PERSISTENT WALLET TESTS ---\n');

  // TEST 1: Initial default balance
  console.log('TEST 1: Initial default balance');
  const initialCoins = await walletService.loadCoins();
  console.log('  Loaded initial coins:', initialCoins);
  assert(initialCoins === DEFAULT_STARTING_COINS, `Default starting coins is ${DEFAULT_STARTING_COINS}`);

  // TEST 2: Save and reload coins
  console.log('\nTEST 2: Save and reload custom balance');
  await walletService.saveCoins(350);
  const reloadedCoins = await walletService.loadCoins();
  console.log('  Reloaded coins after saving 350:', reloadedCoins);
  assert(reloadedCoins === 350, 'Persistent storage correctly saved and reloaded 350 coins');

  // TEST 3: Negative coins prevention
  console.log('\nTEST 3: Negative balance clamp');
  await walletService.saveCoins(-50);
  const clampedCoins = await walletService.loadCoins();
  assert(clampedCoins === 0, 'Negative balance clamped to 0');

  // Restore 100 coins for clean initial state
  await walletService.saveCoins(100);
  assert((await walletService.loadCoins()) === 100, 'Reset to 100 coins');

  console.log('\n🎉 ALL PERSISTENT WALLET TESTS PASSED PERFECTLY!\n');
}

runWalletTests().catch((err) => {
  console.error(err);
  process.exit(1);
});
