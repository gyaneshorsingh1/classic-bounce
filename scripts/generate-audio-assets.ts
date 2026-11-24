// @ts-nocheck
import * as fs from 'fs';
import * as path from 'path';

const SAMPLE_RATE = 44100;

/**
 * Creates a standard 44-byte RIFF/WAVE header for 16-bit PCM mono or stereo.
 */
function createWavBuffer(samples: Float32Array, channels: number = 1): Buffer {
  const numSamples = samples.length;
  const bytesPerSample = 2; // 16-bit
  const subChunk2Size = numSamples * bytesPerSample;
  const chunkSize = 36 + subChunk2Size;

  const buffer = Buffer.alloc(44 + subChunk2Size);

  // RIFF header
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(chunkSize, 4);
  buffer.write('WAVE', 8);

  // fmt subchunk
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16); // Subchunk1Size (16 for PCM)
  buffer.writeUInt16LE(1, 20); // AudioFormat (1 for PCM)
  buffer.writeUInt16LE(channels, 22); // NumChannels
  buffer.writeUInt32LE(SAMPLE_RATE, 24); // SampleRate
  buffer.writeUInt32LE(SAMPLE_RATE * channels * bytesPerSample, 28); // ByteRate
  buffer.writeUInt16LE(channels * bytesPerSample, 32); // BlockAlign
  buffer.writeUInt16LE(16, 34); // BitsPerSample

  // data subchunk
  buffer.write('data', 36);
  buffer.writeUInt32LE(subChunk2Size, 40);

  // PCM 16-bit sample data
  for (let i = 0; i < numSamples; i++) {
    // Clamping to -1.0 to 1.0
    const clamped = Math.max(-1.0, Math.min(1.0, samples[i]));
    const intSample = clamped < 0 ? clamped * 32768 : clamped * 32767;
    buffer.writeInt16LE(Math.round(intSample), 44 + i * 2);
  }

  return buffer;
}

// -----------------------------------------------------------------------------
// Waveform Generators
// -----------------------------------------------------------------------------
function sine(phase: number): number {
  return Math.sin(phase * 2 * Math.PI);
}

function triangle(phase: number): number {
  const p = phase % 1;
  return p < 0.5 ? 4 * p - 1 : 3 - 4 * p;
}

function square(phase: number): number {
  return phase % 1 < 0.5 ? 1 : -1;
}

function noise(): number {
  return Math.random() * 2 - 1;
}

// -----------------------------------------------------------------------------
// SFX Synthesizers
// -----------------------------------------------------------------------------

function generateCoinSfx(): Float32Array {
  const duration = 0.30;
  const totalSamples = Math.floor(SAMPLE_RATE * duration);
  const out = new Float32Array(totalSamples);

  let phase1 = 0;
  let phase2 = 0;

  for (let i = 0; i < totalSamples; i++) {
    const t = i / SAMPLE_RATE;
    // B5 (987.77 Hz) for first 0.08s, then E6 (1318.51 Hz) with sparkle
    const freq = t < 0.08 ? 987.77 : 1318.51;
    const env = t < 0.08
      ? Math.min(1, t / 0.005) * Math.exp(-t * 12)
      : Math.min(1, (t - 0.08) / 0.005) * Math.exp(-(t - 0.08) * 9);

    phase1 += freq / SAMPLE_RATE;
    phase2 += (freq * 2) / SAMPLE_RATE;

    const s = (sine(phase1) * 0.75 + triangle(phase2) * 0.25) * env * 0.45;
    out[i] = s;
  }
  return out;
}

function generateJumpSfx(): Float32Array {
  const duration = 0.18;
  const totalSamples = Math.floor(SAMPLE_RATE * duration);
  const out = new Float32Array(totalSamples);
  let phase = 0;

  for (let i = 0; i < totalSamples; i++) {
    const t = i / SAMPLE_RATE;
    // Ascending rubbery bounce 220Hz -> 540Hz
    const freq = 220 + (540 - 220) * Math.pow(t / duration, 0.75);
    const env = Math.min(1, t / 0.008) * Math.max(0, 1 - Math.pow(t / duration, 1.2));

    phase += freq / SAMPLE_RATE;
    out[i] = (sine(phase) * 0.8 + triangle(phase * 0.5) * 0.2) * env * 0.35;
  }
  return out;
}

function generateLandSfx(): Float32Array {
  const duration = 0.14;
  const totalSamples = Math.floor(SAMPLE_RATE * duration);
  const out = new Float32Array(totalSamples);
  let phase = 0;

  for (let i = 0; i < totalSamples; i++) {
    const t = i / SAMPLE_RATE;
    // Low frequency thud 130Hz -> 45Hz
    const freq = 130 * Math.exp(-t * 18) + 45;
    const env = Math.min(1, t / 0.004) * Math.exp(-t * 22);

    phase += freq / SAMPLE_RATE;
    const n = noise() * 0.12 * Math.exp(-t * 30);
    out[i] = (triangle(phase) * 0.8 + n) * env * 0.40;
  }
  return out;
}

function generateTransformSfx(): Float32Array {
  const duration = 0.40;
  const totalSamples = Math.floor(SAMPLE_RATE * duration);
  const out = new Float32Array(totalSamples);

  const notes = [329.63, 415.3, 493.88, 659.25, 830.61]; // E4, G#4, B4, E5, G#5
  let phase = 0;

  for (let i = 0; i < totalSamples; i++) {
    const t = i / SAMPLE_RATE;
    const noteIdx = Math.min(notes.length - 1, Math.floor((t / duration) * notes.length));
    const baseFreq = notes[noteIdx];
    // Gentle vibrato
    const freq = baseFreq * (1 + 0.02 * sine(t * 14));
    const env = Math.min(1, t / 0.02) * (1 - t / duration);

    phase += freq / SAMPLE_RATE;
    const shimmer = sine(phase * 2) * 0.25;
    out[i] = (sine(phase) * 0.65 + shimmer) * env * 0.38;
  }
  return out;
}

function generateBreakStoneSfx(): Float32Array {
  const duration = 0.35;
  const totalSamples = Math.floor(SAMPLE_RATE * duration);
  const out = new Float32Array(totalSamples);
  let phase = 0;

  for (let i = 0; i < totalSamples; i++) {
    const t = i / SAMPLE_RATE;
    const freq = 140 * Math.exp(-t * 14) + 35;
    phase += freq / SAMPLE_RATE;

    const env = Math.min(1, t / 0.005) * Math.exp(-t * 10);
    const crunch = noise() * Math.exp(-t * 14);
    out[i] = (square(phase) * 0.35 + crunch * 0.65) * env * 0.45;
  }
  return out;
}

function generateSwitchSfx(): Float32Array {
  const duration = 0.12;
  const totalSamples = Math.floor(SAMPLE_RATE * duration);
  const out = new Float32Array(totalSamples);
  let phase = 0;

  for (let i = 0; i < totalSamples; i++) {
    const t = i / SAMPLE_RATE;
    const freq = t < 0.04 ? 620 : 880;
    const env = t < 0.04
      ? Math.min(1, t / 0.003) * Math.exp(-t * 40)
      : Math.min(1, (t - 0.04) / 0.003) * Math.exp(-(t - 0.04) * 35);

    phase += freq / SAMPLE_RATE;
    out[i] = square(phase) * env * 0.32;
  }
  return out;
}

function generateDoorOpenSfx(): Float32Array {
  const duration = 0.45;
  const totalSamples = Math.floor(SAMPLE_RATE * duration);
  const out = new Float32Array(totalSamples);
  let phase = 0;

  for (let i = 0; i < totalSamples; i++) {
    const t = i / SAMPLE_RATE;
    const freq = 180 + 260 * (t / duration);
    phase += freq / SAMPLE_RATE;

    const env = Math.min(1, t / 0.03) * (1 - Math.pow(t / duration, 1.5));
    const rumble = noise() * 0.18 * (1 - t / duration);
    out[i] = (triangle(phase) * 0.7 + rumble) * env * 0.40;
  }
  return out;
}

function generateCheckpointSfx(): Float32Array {
  const duration = 0.45;
  const totalSamples = Math.floor(SAMPLE_RATE * duration);
  const out = new Float32Array(totalSamples);

  const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
  const phases = [0, 0, 0, 0];

  for (let i = 0; i < totalSamples; i++) {
    const t = i / SAMPLE_RATE;
    let sample = 0;

    notes.forEach((freq, idx) => {
      const start = idx * 0.08;
      if (t >= start) {
        const localT = t - start;
        const env = Math.min(1, localT / 0.008) * Math.exp(-localT * 7.5);
        phases[idx] += freq / SAMPLE_RATE;
        sample += triangle(phases[idx]) * env * 0.22;
      }
    });

    out[i] = sample;
  }
  return out;
}

function generateTeleportSfx(): Float32Array {
  const duration = 0.38;
  const totalSamples = Math.floor(SAMPLE_RATE * duration);
  const out = new Float32Array(totalSamples);
  let phase = 0;

  for (let i = 0; i < totalSamples; i++) {
    const t = i / SAMPLE_RATE;
    // Dive then ascend
    const freq = t < 0.15
      ? 900 - (900 - 220) * (t / 0.15)
      : 220 + (1400 - 220) * Math.pow((t - 0.15) / 0.23, 1.4);

    phase += freq / SAMPLE_RATE;
    const env = Math.min(1, t / 0.01) * (1 - t / duration);
    out[i] = sine(phase) * env * 0.35;
  }
  return out;
}

function generateWaterEnterSfx(): Float32Array {
  const duration = 0.26;
  const totalSamples = Math.floor(SAMPLE_RATE * duration);
  const out = new Float32Array(totalSamples);
  let phase = 0;

  for (let i = 0; i < totalSamples; i++) {
    const t = i / SAMPLE_RATE;
    const freq = 480 * Math.exp(-t * 9) + 160;
    phase += freq / SAMPLE_RATE;

    const env = Math.min(1, t / 0.01) * Math.exp(-t * 11);
    const bubbleNoise = noise() * 0.25 * Math.exp(-t * 8);
    out[i] = (sine(phase) * 0.7 + bubbleNoise) * env * 0.40;
  }
  return out;
}

function generateWaterExitSfx(): Float32Array {
  const duration = 0.24;
  const totalSamples = Math.floor(SAMPLE_RATE * duration);
  const out = new Float32Array(totalSamples);
  let phase = 0;

  for (let i = 0; i < totalSamples; i++) {
    const t = i / SAMPLE_RATE;
    const freq = 220 + (560 - 220) * Math.pow(t / duration, 0.7);
    phase += freq / SAMPLE_RATE;

    const env = Math.min(1, t / 0.008) * Math.exp(-t * 12);
    out[i] = sine(phase) * env * 0.38;
  }
  return out;
}

function generateSpringPadSfx(): Float32Array {
  const duration = 0.30;
  const totalSamples = Math.floor(SAMPLE_RATE * duration);
  const out = new Float32Array(totalSamples);
  let phase = 0;

  for (let i = 0; i < totalSamples; i++) {
    const t = i / SAMPLE_RATE;
    // Dynamic upward launch boing
    const freq = 180 + 580 * Math.pow(t / duration, 0.85);
    phase += freq / SAMPLE_RATE;

    const env = Math.min(1, t / 0.006) * Math.exp(-t * 9);
    out[i] = (sine(phase) * 0.8 + triangle(phase * 2) * 0.2) * env * 0.42;
  }
  return out;
}

function generateDeathSfx(): Float32Array {
  const duration = 0.45;
  const totalSamples = Math.floor(SAMPLE_RATE * duration);
  const out = new Float32Array(totalSamples);
  let phase = 0;

  for (let i = 0; i < totalSamples; i++) {
    const t = i / SAMPLE_RATE;
    const freq = 380 * Math.exp(-t * 4.2) + 65;
    phase += freq / SAMPLE_RATE;

    const env = Math.min(1, t / 0.01) * (1 - t / duration);
    out[i] = sawtooth(phase) * env * 0.36;
  }
  return out;
}

function sawtooth(phase: number): number {
  return 2 * (phase % 1) - 1;
}

function generateLevelCompleteSfx(): Float32Array {
  const duration = 0.75;
  const totalSamples = Math.floor(SAMPLE_RATE * duration);
  const out = new Float32Array(totalSamples);

  const notes = [523.25, 659.25, 783.99, 1046.5, 1318.51]; // C5, E5, G5, C6, E6
  const phases = [0, 0, 0, 0, 0];

  for (let i = 0; i < totalSamples; i++) {
    const t = i / SAMPLE_RATE;
    let sample = 0;

    notes.forEach((freq, idx) => {
      const start = idx * 0.10;
      if (t >= start) {
        const localT = t - start;
        const env = Math.min(1, localT / 0.01) * Math.exp(-localT * 4.5);
        phases[idx] += freq / SAMPLE_RATE;
        sample += (triangle(phases[idx]) * 0.7 + sine(phases[idx] * 2) * 0.3) * env * 0.24;
      }
    });

    out[i] = sample;
  }
  return out;
}

// -----------------------------------------------------------------------------
// BGM Synthesizers (Seamless Multi-Voice Loops, ~10s to ~14s)
// -----------------------------------------------------------------------------

/**
 * Synthesizes a seamless looping multi-track arrangement.
 */
function synthesizeBgmLoop(params: {
  bpm: number;
  measures: number;
  bassNotes: number[]; // measure roots
  melodyNotes: number[][]; // 4 notes per measure
  waveform: 'triangle' | 'sine' | 'square';
}): Float32Array {
  const secondsPerBeat = 60 / params.bpm;
  const beatsPerMeasure = 4;
  const totalDuration = params.measures * beatsPerMeasure * secondsPerBeat;
  const totalSamples = Math.floor(SAMPLE_RATE * totalDuration);
  const out = new Float32Array(totalSamples);

  let bassPhase = 0;
  let melodyPhase = 0;

  for (let i = 0; i < totalSamples; i++) {
    const t = (i / SAMPLE_RATE) % totalDuration;
    const currentMeasure = Math.floor(t / (beatsPerMeasure * secondsPerBeat)) % params.measures;
    const measureT = t % (beatsPerMeasure * secondsPerBeat);
    const beatFraction = measureT / secondsPerBeat;
    const noteInMeasure = Math.floor(beatFraction) % 4;

    // 1. Bass Track
    const bassFreq = params.bassNotes[currentMeasure];
    bassPhase += bassFreq / SAMPLE_RATE;
    const bassEnv = Math.min(1, (beatFraction % 1) / 0.05) * Math.exp(-(beatFraction % 1) * 2.8);
    const bassSample = sine(bassPhase) * bassEnv * 0.28;

    // 2. Melody Lead Track
    const melodySeq = params.melodyNotes[currentMeasure] || [440];
    const melodyFreq = melodySeq[noteInMeasure % melodySeq.length];
    melodyPhase += melodyFreq / SAMPLE_RATE;

    const noteLocalT = (beatFraction % 1);
    const melodyEnv = Math.min(1, noteLocalT / 0.04) * Math.exp(-noteLocalT * 3.2);

    let melodyOsc = 0;
    if (params.waveform === 'triangle') {
      melodyOsc = triangle(melodyPhase);
    } else if (params.waveform === 'square') {
      melodyOsc = square(melodyPhase) * 0.6;
    } else {
      melodyOsc = sine(melodyPhase);
    }
    const melodySample = melodyOsc * melodyEnv * 0.22;

    // 3. Subtle Percussion / Click on beats
    const beatPulse = (beatFraction % 1) < 0.05 ? noise() * 0.06 * (1 - (beatFraction % 1) / 0.05) : 0;

    out[i] = bassSample + melodySample + beatPulse;
  }

  // Crossfade boundary (first and last 100ms) to ensure 100% seamless looping without pops
  const crossfadeSamples = Math.floor(SAMPLE_RATE * 0.1);
  for (let i = 0; i < crossfadeSamples; i++) {
    const factor = i / crossfadeSamples;
    const startIdx = i;
    const endIdx = totalSamples - crossfadeSamples + i;
    const blended = out[startIdx] * factor + out[endIdx] * (1 - factor);
    out[startIdx] = blended;
    out[endIdx] = blended;
  }

  return out;
}

// Level 1: Sunny Meadow (C Major / G Major, 128 BPM, cheerful bounce)
function generateLevel1Bgm(): Float32Array {
  return synthesizeBgmLoop({
    bpm: 128,
    measures: 4,
    bassNotes: [130.81, 146.83, 164.81, 196.0], // C3, D3, E3, G3
    melodyNotes: [
      [523.25, 659.25, 783.99, 659.25], // C5, E5, G5, E5
      [587.33, 698.46, 880.0, 698.46],  // D5, F5, A5, F5
      [659.25, 783.99, 987.77, 783.99], // E5, G5, B5, G5
      [783.99, 987.77, 1046.5, 783.99], // G5, B5, C6, G5
    ],
    waveform: 'triangle',
  });
}

// Level 2: Molten Caverns / Aqueducts (D Dorian, 92 BPM, mysterious water resonance)
function generateLevel2Bgm(): Float32Array {
  return synthesizeBgmLoop({
    bpm: 92,
    measures: 4,
    bassNotes: [146.83, 174.61, 196.0, 146.83], // D3, F3, G3, D3
    melodyNotes: [
      [293.66, 349.23, 440.0, 392.0], // D4, F4, A4, G4
      [349.23, 392.0, 523.25, 440.0], // F4, G4, C5, A4
      [392.0, 440.0, 587.33, 523.25], // G4, A4, D5, C5
      [440.0, 392.0, 349.23, 293.66], // A4, G4, F4, D4
    ],
    waveform: 'sine',
  });
}

// Level 3: Frozen Mountain (A Minor, 136 BPM, crystalline icy bells)
function generateLevel3Bgm(): Float32Array {
  return synthesizeBgmLoop({
    bpm: 136,
    measures: 4,
    bassNotes: [110.0, 130.81, 146.83, 164.81], // A2, C3, D3, E3
    melodyNotes: [
      [440.0, 523.25, 659.25, 880.0],  // A4, C5, E5, A5
      [523.25, 659.25, 783.99, 1046.5], // C5, E5, G5, C6
      [587.33, 698.46, 880.0, 1174.66], // D5, F5, A5, D6
      [659.25, 523.25, 440.0, 329.63],  // E5, C5, A4, E4
    ],
    waveform: 'triangle',
  });
}

// Level 4: Ancient Temple (E Phrygian, 108 BPM, mystical ancient tomb)
function generateLevel4Bgm(): Float32Array {
  return synthesizeBgmLoop({
    bpm: 108,
    measures: 4,
    bassNotes: [82.41, 87.31, 98.0, 110.0], // E2, F2, G2, A2
    melodyNotes: [
      [329.63, 349.23, 392.0, 493.88], // E4, F4, G4, B4
      [349.23, 392.0, 440.0, 523.25],  // F4, G4, A4, C5
      [415.3, 493.88, 523.25, 659.25], // G#4, B4, C5, E5 (Phrygian Dominant)
      [493.88, 440.0, 349.23, 329.63], // B4, A4, F4, E4
    ],
    waveform: 'triangle',
  });
}

// Level 5: Sky Kingdom (F Lydian, 144 BPM, triumphant celestial heights)
function generateLevel5Bgm(): Float32Array {
  return synthesizeBgmLoop({
    bpm: 144,
    measures: 4,
    bassNotes: [87.31, 98.0, 110.0, 130.81], // F2, G2, A2, C3
    melodyNotes: [
      [349.23, 440.0, 523.25, 698.46], // F4, A4, C5, F5
      [440.0, 523.25, 659.25, 783.99], // A4, C5, E5, G5
      [493.88, 587.33, 698.46, 987.77], // B4 (Lydian #4), D5, F5, B5
      [698.46, 659.25, 523.25, 440.0], // F5, E5, C5, A4
    ],
    waveform: 'sine',
  });
}

// Main Menu BGM: Retro bounce groove at 120 BPM
function generateMenuBgm(): Float32Array {
  return synthesizeBgmLoop({
    bpm: 120,
    measures: 4,
    bassNotes: [130.81, 164.81, 146.83, 196.0], // C3, E3, D3, G3
    melodyNotes: [
      [261.63, 329.63, 392.0, 523.25],
      [329.63, 392.0, 493.88, 659.25],
      [293.66, 349.23, 440.0, 587.33],
      [392.0, 493.88, 587.33, 783.99],
    ],
    waveform: 'triangle',
  });
}

// -----------------------------------------------------------------------------
// Generation & File Output Execution
// -----------------------------------------------------------------------------
function main() {
  const baseDir = path.resolve(__dirname, '../assets/audio');
  const musicDir = path.join(baseDir, 'music');
  const sfxDir = path.join(baseDir, 'sfx');

  fs.mkdirSync(musicDir, { recursive: true });
  fs.mkdirSync(sfxDir, { recursive: true });

  console.log('🎵 Generating High-Quality 16-Bit 44.1kHz Gameplay Sound Effects...');

  const sfxAssets: Record<string, () => Float32Array> = {
    'sfx_coin.wav': generateCoinSfx,
    'sfx_jump.wav': generateJumpSfx,
    'sfx_land.wav': generateLandSfx,
    'sfx_transform.wav': generateTransformSfx,
    'sfx_break_stone.wav': generateBreakStoneSfx,
    'sfx_switch.wav': generateSwitchSfx,
    'sfx_door_open.wav': generateDoorOpenSfx,
    'sfx_checkpoint.wav': generateCheckpointSfx,
    'sfx_teleport.wav': generateTeleportSfx,
    'sfx_water_enter.wav': generateWaterEnterSfx,
    'sfx_water_exit.wav': generateWaterExitSfx,
    'sfx_spring_pad.wav': generateSpringPadSfx,
    'sfx_death.wav': generateDeathSfx,
    'sfx_level_complete.wav': generateLevelCompleteSfx,
  };

  for (const [filename, generator] of Object.entries(sfxAssets)) {
    const samples = generator();
    const buf = createWavBuffer(samples);
    const dest = path.join(sfxDir, filename);
    fs.writeFileSync(dest, buf);
    console.log(`  ✓ ${filename} (${(buf.length / 1024).toFixed(1)} KB)`);
  }

  console.log('\n🎶 Generating Seamless Looping Background Music Tracks...');

  const musicAssets: Record<string, () => Float32Array> = {
    'bgm_level1.wav': generateLevel1Bgm,
    'bgm_level2.wav': generateLevel2Bgm,
    'bgm_level3.wav': generateLevel3Bgm,
    'bgm_level4.wav': generateLevel4Bgm,
    'bgm_level5.wav': generateLevel5Bgm,
    'bgm_menu.wav': generateMenuBgm,
  };

  for (const [filename, generator] of Object.entries(musicAssets)) {
    const samples = generator();
    const buf = createWavBuffer(samples);
    const dest = path.join(musicDir, filename);
    fs.writeFileSync(dest, buf);
    console.log(`  ✓ ${filename} (${(buf.length / 1024).toFixed(1)} KB)`);
  }

  console.log('\n✨ All 14 SFX and 6 BGM Audio Assets Successfully Created!');
}

main();
