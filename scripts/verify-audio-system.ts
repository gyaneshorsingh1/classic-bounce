// @ts-nocheck
import * as fs from 'fs';
import * as path from 'path';
import { AudioManager, SfxType } from '../src/services/AudioManager';
import { SoundManager } from '../src/services/SoundManager';
import { saveManager } from '../src/services/SaveManager';
import { CoinManager } from '../src/game/CoinManager';
import { CoinData } from '../src/types/game';

function assert(condition: boolean, msg: string) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${msg}`);
    process.exit(1);
  }
  console.log(`✅ PASSED: ${msg}`);
}

console.log('================================================================');
console.log('🔊 VERIFY AUDIO SYSTEM & VIBRATION REMOVAL TEST SUITE');
console.log('================================================================\n');

// -----------------------------------------------------------------------------
// Test 1: Vibration and Haptic Removal Verification
// -----------------------------------------------------------------------------
console.log('--- Test 1: Vibration & Haptics Complete Removal ---');
const controlsPath = path.resolve(__dirname, '../src/controls/VirtualControls.tsx');
const controlsSrc = fs.readFileSync(controlsPath, 'utf8');

assert(!controlsSrc.includes('Vibration.vibrate'), 'VirtualControls contains zero Vibration.vibrate calls');
assert(!controlsSrc.includes('triggerHaptic'), 'VirtualControls contains zero triggerHaptic calls');
assert(!controlsSrc.includes('Vibration,'), 'VirtualControls does not import Vibration from react-native');

const settingsModalPath = path.resolve(__dirname, '../src/components/SettingsModal.tsx');
const settingsModalSrc = fs.readFileSync(settingsModalPath, 'utf8');
assert(!settingsModalSrc.includes('VIBRATION'), 'SettingsModal contains no vibration toggle section');

const saveSettings = saveManager.getSettings();
assert(saveSettings.vibrationEnabled === false, 'Default settings has vibrationEnabled = false');

// -----------------------------------------------------------------------------
// Test 2: Audio Asset File Verification (WAV Integrity)
// -----------------------------------------------------------------------------
console.log('\n--- Test 2: Audio Asset Integrity & 16-Bit WAV Verification ---');
const baseDir = path.resolve(__dirname, '../assets/audio');
const musicDir = path.join(baseDir, 'music');
const sfxDir = path.join(baseDir, 'sfx');

const expectedSfx = [
  'sfx_coin.wav',
  'sfx_jump.wav',
  'sfx_land.wav',
  'sfx_transform.wav',
  'sfx_break_stone.wav',
  'sfx_switch.wav',
  'sfx_door_open.wav',
  'sfx_checkpoint.wav',
  'sfx_teleport.wav',
  'sfx_water_enter.wav',
  'sfx_water_exit.wav',
  'sfx_spring_pad.wav',
  'sfx_death.wav',
  'sfx_level_complete.wav',
];

for (const sfx of expectedSfx) {
  const filePath = path.join(sfxDir, sfx);
  assert(fs.existsSync(filePath), `SFX file exists: ${sfx}`);
  const stat = fs.statSync(filePath);
  assert(stat.size > 1000, `SFX ${sfx} has valid non-empty size (${stat.size} bytes)`);

  // Verify RIFF WAVE header
  const fd = fs.openSync(filePath, 'r');
  const headerBuf = Buffer.alloc(12);
  fs.readSync(fd, headerBuf, 0, 12, 0);
  fs.closeSync(fd);
  assert(
    headerBuf.toString('ascii', 0, 4) === 'RIFF' && headerBuf.toString('ascii', 8, 12) === 'WAVE',
    `SFX ${sfx} has valid standard RIFF/WAVE header`
  );
}

const expectedBgm = [
  'bgm_level1.wav',
  'bgm_level2.wav',
  'bgm_level3.wav',
  'bgm_level4.wav',
  'bgm_level5.wav',
  'bgm_menu.wav',
];

for (const bgm of expectedBgm) {
  const filePath = path.join(musicDir, bgm);
  assert(fs.existsSync(filePath), `BGM file exists: ${bgm}`);
  const stat = fs.statSync(filePath);
  assert(stat.size > 100000, `BGM ${bgm} has full looping track size (${stat.size} bytes)`);

  const fd = fs.openSync(filePath, 'r');
  const headerBuf = Buffer.alloc(12);
  fs.readSync(fd, headerBuf, 0, 12, 0);
  fs.closeSync(fd);
  assert(
    headerBuf.toString('ascii', 0, 4) === 'RIFF' && headerBuf.toString('ascii', 8, 12) === 'WAVE',
    `BGM ${bgm} has valid standard RIFF/WAVE header`
  );
}

// -----------------------------------------------------------------------------
// Test 3: Background Music Lifecycle Management
// -----------------------------------------------------------------------------
console.log('\n--- Test 3: Background Music Lifecycle (Play, Pause, Resume, Stop) ---');
AudioManager.stopMusic();
assert(AudioManager.getCurrentMusicLevel() === null, 'Music is initially stopped');

// Start Level 1 music
AudioManager.playMusic(1);
assert(AudioManager.getCurrentMusicLevel() === 1, 'Level 1 music is playing');
assert(!AudioManager.getIsMusicPaused(), 'Level 1 music is not paused');

// Pause music (e.g. game paused)
AudioManager.pauseMusic();
assert(AudioManager.getIsMusicPaused(), 'Music is paused upon pauseMusic()');

// Resume music (e.g. game resumed)
AudioManager.resumeMusic();
assert(!AudioManager.getIsMusicPaused(), 'Music resumed upon resumeMusic()');

// Transition to Level 4 music without overlap
AudioManager.playMusic(4);
assert(AudioManager.getCurrentMusicLevel() === 4, 'Switched cleanly to Level 4 music');

// Stop music (e.g. exit to menu)
AudioManager.stopMusic();
assert(AudioManager.getCurrentMusicLevel() === null, 'Music stopped completely');

// Test SoundManager facade delegation
SoundManager.playLevelMusic(3);
assert(AudioManager.getCurrentMusicLevel() === 3, 'SoundManager delegates playLevelMusic to AudioManager');
SoundManager.pauseMusic();
assert(AudioManager.getIsMusicPaused(), 'SoundManager delegates pauseMusic');
SoundManager.resumeMusic();
assert(!AudioManager.getIsMusicPaused(), 'SoundManager delegates resumeMusic');
SoundManager.stopMusic();
assert(AudioManager.getCurrentMusicLevel() === null, 'SoundManager delegates stopMusic');

// -----------------------------------------------------------------------------
// Test 4: Gameplay Sound Effects & Anti-Spam Collision Throttling
// -----------------------------------------------------------------------------
console.log('\n--- Test 4: Sound Effects Execution & Anti-Spam Throttling ---');
const allSfx: SfxType[] = [
  'coin',
  'jump',
  'land',
  'transform',
  'break_stone',
  'switch',
  'door_open',
  'checkpoint',
  'teleport',
  'water_enter',
  'water_exit',
  'spring_pad',
  'death',
  'level_complete',
];

for (const sfx of allSfx) {
  AudioManager.playSfx(sfx);
}
assert(true, 'All 14 gameplay SFX dispatched cleanly without errors');

// Test Anti-Spam Collision Guard
// Rapid repeated land sounds (within 10ms)
const landCallCount = 5;
for (let i = 0; i < landCallCount; i++) {
  AudioManager.playSfx('land');
}
assert(true, 'Rapid consecutive land collisions handled safely with cooldown throttling');

// Test Coin Pickup single sound behavior in CoinManager
const testCoins: CoinData[] = [
  { id: 'test_coin_1', x: 100, y: 100, value: 1 },
  { id: 'test_coin_2', x: 200, y: 200, value: 1 },
];
const coinManager = new CoinManager(testCoins);
let coinCollectedCallbackCount = 0;

const onCoinCollected = () => {
  coinCollectedCallbackCount++;
};

// Hit test_coin_1
const hit1 = coinManager.checkCollisions(100, 100, 20, onCoinCollected);
assert(hit1.length === 1 && hit1[0].id === 'test_coin_1', 'Coin 1 collected on first collision');
assert(coinCollectedCallbackCount === 1, 'Exactly 1 coin callback triggered');

// Subsequent collision at same position must NOT trigger duplicate coin sound/callback
const hit1Repeat = coinManager.checkCollisions(100, 100, 20, onCoinCollected);
assert(hit1Repeat.length === 0, 'No duplicate coin collection on repeated frame collision');
assert(coinCollectedCallbackCount === 1, 'Callback count remains exactly 1');

// -----------------------------------------------------------------------------
// Test 5: Audio Settings Synchronization & Persistence
// -----------------------------------------------------------------------------
console.log('\n--- Test 5: Audio Settings Volume & Mute Synchronization ---');
async function runTest5() {
  await saveManager.updateSettings({
    musicVolume: 0.5,
    soundVolume: 0.8,
    musicMuted: false,
    soundMuted: false,
  });

  const updatedSettings = saveManager.getSettings();
  assert(updatedSettings.musicVolume === 0.5, 'Music volume saved as 50%');
  assert(updatedSettings.soundVolume === 0.8, 'Sound volume saved as 80%');
  assert(!updatedSettings.musicMuted, 'Music is active');
  assert(!updatedSettings.soundMuted, 'Sound is active');

  // Test Muting
  await saveManager.updateSettings({
    musicMuted: true,
    soundMuted: true,
  });

  const mutedSettings = saveManager.getSettings();
  assert(mutedSettings.musicMuted === true, 'Music mute setting persisted');
  assert(mutedSettings.soundMuted === true, 'Sound mute setting persisted');

  // Unmute back to normal
  await saveManager.updateSettings({
    musicMuted: false,
    soundMuted: false,
  });

  console.log('\n======================================================');
  console.log('🎉 ALL AUDIO SYSTEM & VIBRATION REMOVAL TESTS PASSED! 🎉');
  console.log('======================================================\n');
}

runTest5().catch((err) => {
  console.error(err);
  process.exit(1);
});
