import { PhysicsWorld } from '../src/game/physics';
import { getLevelData } from '../src/game/levels';
import { InputController } from '../src/controllers/InputController';

function assert(condition: boolean, msg: string) {
  if (!condition) {
    console.error(`❌ FAILED: ${msg}`);
    process.exit(1);
  }
  console.log(`✅ PASSED: ${msg}`);
}

console.log('================================================================');
console.log('🧪 VERIFY LEVEL 1 SECTION 3 PIT ESCAPE STEPS IN ENGINE');
console.log('================================================================\n');

const level1 = getLevelData(1);

// Verify step platforms exist in Level 1
const s1 = level1.platforms.find((p) => p.id === 'sec3_pit_step_1');
const s2 = level1.platforms.find((p) => p.id === 'sec3_pit_step_2');
assert(s1 !== undefined, 'sec3_pit_step_1 platform exists in Level 1');
assert(s2 !== undefined, 'sec3_pit_step_2 platform exists in Level 1');
assert(s1?.x === 2750 && s1?.y === 925, 'sec3_pit_step_1 positioned correctly at (2750, 925)');
assert(s2?.x === 2870 && s2?.y === 800, 'sec3_pit_step_2 positioned correctly at (2870, 800)');

// Test 1: Pit Ground -> Step 1
console.log('\n--- Test 1: Pit Ground -> Step 1 ---');
{
  const p = new PhysicsWorld(level1.platforms, level1.worldWidth, level1.worldHeight, level1.initialBallX, level1.initialBallY);
  const input = new InputController();

  p.setBallPosition(2630, 996.3);
  for (let f = 0; f < 10; f++) p.step(16.666, input);
  input.setRight(true);

  let landed = false;
  let finalSt: any = null;
  for (let f = 0; f < 60; f++) {
    const stBefore = p.getBallState();
    if (stBefore.x >= 2640 && stBefore.isGrounded) input.setJump(true);
    p.step(16.666, input);
    input.setJump(false);
    const st = p.getBallState();
    finalSt = st;
    if (st.isGrounded && st.x >= 2685 && st.x <= 2815 && Math.abs(st.y - (925 - 12 - 24)) < 4) {
      landed = true;
      console.log(`  Landed on Step 1 at frame ${f}: x=${st.x.toFixed(1)}, y=${st.y.toFixed(1)}`);
      break;
    }
  }
  assert(landed, `Ball successfully jumps from Pit Ground onto Step 1 (pos: ${finalSt?.x.toFixed(1)}, ${finalSt?.y.toFixed(1)})`);
}

// Test 2: Step 1 -> Step 2
console.log('\n--- Test 2: Step 1 -> Step 2 ---');
{
  const p = new PhysicsWorld(level1.platforms, level1.worldWidth, level1.worldHeight, level1.initialBallX, level1.initialBallY);
  const input = new InputController();

  p.setBallPosition(2740, 889);
  for (let f = 0; f < 10; f++) p.step(16.666, input);
  input.setRight(true);

  let landed = false;
  let finalSt: any = null;
  for (let f = 0; f < 60; f++) {
    const stBefore = p.getBallState();
    if (stBefore.x >= 2760 && stBefore.isGrounded) input.setJump(true);
    p.step(16.666, input);
    input.setJump(false);
    const st = p.getBallState();
    finalSt = st;
    if (st.isGrounded && st.x >= 2815 && st.x <= 2925 && Math.abs(st.y - (800 - 12 - 24)) < 4) {
      landed = true;
      console.log(`  Landed on Step 2 at frame ${f}: x=${st.x.toFixed(1)}, y=${st.y.toFixed(1)}`);
      break;
    }
  }
  assert(landed, `Ball successfully jumps from Step 1 onto Step 2 (pos: ${finalSt?.x.toFixed(1)}, ${finalSt?.y.toFixed(1)})`);
}

// Test 3: Step 2 -> Safe Island (Checkpoint 1)
console.log('\n--- Test 3: Step 2 -> Safe Island (Checkpoint 1) ---');
{
  const p = new PhysicsWorld(level1.platforms, level1.worldWidth, level1.worldHeight, level1.initialBallX, level1.initialBallY);
  const input = new InputController();

  p.setBallPosition(2850, 764);
  for (let f = 0; f < 10; f++) p.step(16.666, input);
  input.setLeft(true);

  let landed = false;
  let finalSt: any = null;
  for (let f = 0; f < 60; f++) {
    const stBefore = p.getBallState();
    if (stBefore.isGrounded) input.setJump(true);
    p.step(16.666, input);
    input.setJump(false);
    const st = p.getBallState();
    finalSt = st;
    if (st.isGrounded && st.x >= 2590 && st.x <= 2770 && Math.abs(st.y - (700 - 15 - 24)) < 4) {
      landed = true;
      console.log(`  Landed on Safe Island at frame ${f}: x=${st.x.toFixed(1)}, y=${st.y.toFixed(1)}`);
      break;
    }
  }
  assert(landed, `Ball successfully jumps from Step 2 onto Safe Island (pos: ${finalSt?.x.toFixed(1)}, ${finalSt?.y.toFixed(1)})`);
}

console.log('\n🎉 ALL ESCAPE STEP TESTS PASSED WITH 100% SUCCESS!');
