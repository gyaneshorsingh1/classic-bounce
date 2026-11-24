import { saveManager } from './SaveManager';

// Register .wav asset extension for Node.js / CLI test environments
if (typeof require !== 'undefined' && (require as any).extensions && !(require as any).extensions['.wav']) {
  (require as any).extensions['.wav'] = (module: any, filename: string) => {
    module.exports = filename;
  };
}

export type SfxType =
  | 'coin'
  | 'jump'
  | 'land'
  | 'transform'
  | 'break_stone'
  | 'switch'
  | 'door_open'
  | 'checkpoint'
  | 'teleport'
  | 'water_enter'
  | 'water_exit'
  | 'spring_pad'
  | 'death'
  | 'level_complete';

// Dynamic resolver for expo-audio across Native and Node.js testing environments
let createAudioPlayerFn: ((source: any) => any) | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const expoAudio = require('expo-audio');
  if (expoAudio && typeof expoAudio.createAudioPlayer === 'function') {
    createAudioPlayerFn = expoAudio.createAudioPlayer;
  }
} catch {
  // Fallback for headless CLI test runners (e.g. tsx scripts)
}

/**
 * Headless fallback audio player for CLI test environments.
 */
class MockAudioPlayer {
  public playing: boolean = false;
  public loop: boolean = false;
  public volume: number = 1.0;
  constructor(public source: any) {}
  play() {
    this.playing = true;
  }
  pause() {
    this.playing = false;
  }
  seekTo(_seconds: number) {}
  release() {
    this.playing = false;
  }
}

function instantiatePlayer(source: any): any {
  if (createAudioPlayerFn) {
    try {
      return createAudioPlayerFn(source);
    } catch {
      return new MockAudioPlayer(source);
    }
  }
  return new MockAudioPlayer(source);
}

// Background Music Audio Sources
const BGM_SOURCES: Record<number, any> = {
  0: require('../../assets/audio/music/bgm_menu.wav'),
  1: require('../../assets/audio/music/bgm_level1.wav'),
  2: require('../../assets/audio/music/bgm_level2.wav'),
  3: require('../../assets/audio/music/bgm_level3.wav'),
  4: require('../../assets/audio/music/bgm_level4.wav'),
  5: require('../../assets/audio/music/bgm_level5.wav'),
};

// Sound Effect Audio Sources
const SFX_SOURCES: Record<SfxType, any> = {
  coin: require('../../assets/audio/sfx/sfx_coin.wav'),
  jump: require('../../assets/audio/sfx/sfx_jump.wav'),
  land: require('../../assets/audio/sfx/sfx_land.wav'),
  transform: require('../../assets/audio/sfx/sfx_transform.wav'),
  break_stone: require('../../assets/audio/sfx/sfx_break_stone.wav'),
  switch: require('../../assets/audio/sfx/sfx_switch.wav'),
  door_open: require('../../assets/audio/sfx/sfx_door_open.wav'),
  checkpoint: require('../../assets/audio/sfx/sfx_checkpoint.wav'),
  teleport: require('../../assets/audio/sfx/sfx_teleport.wav'),
  water_enter: require('../../assets/audio/sfx/sfx_water_enter.wav'),
  water_exit: require('../../assets/audio/sfx/sfx_water_exit.wav'),
  spring_pad: require('../../assets/audio/sfx/sfx_spring_pad.wav'),
  death: require('../../assets/audio/sfx/sfx_death.wav'),
  level_complete: require('../../assets/audio/sfx/sfx_level_complete.wav'),
};

// Anti-spam cooldown intervals in milliseconds
const SFX_COOLDOWNS: Partial<Record<SfxType, number>> = {
  coin: 40,
  jump: 90,
  land: 160,
  switch: 120,
  break_stone: 150,
  water_enter: 200,
  water_exit: 200,
  spring_pad: 150,
};

/**
 * Centralized AudioManager:
 * Native Android & Cross-Platform audio coordinator using expo-audio.
 * Manages seamless background music loops, pause/resume lifecycles,
 * anti-spam throttled sound effects, and volume persistence.
 */
export class AudioManagerService {
  private bgmPlayer: any = null;
  private currentMusicLevel: number | null = null;
  private isMusicPaused: boolean = false;

  private sfxPlayers: Map<SfxType, any> = new Map();
  private lastSfxTimes: Map<SfxType, number> = new Map();

  constructor() {
    // Synchronize volume and mute states whenever settings change
    saveManager.subscribe(() => {
      this.syncVolumeSettings();
    });
    this.preloadCommonSfx();
  }

  /**
   * Preloads common sound effects for zero-latency response.
   */
  private preloadCommonSfx(): void {
    const commonSfx: SfxType[] = ['coin', 'jump', 'land', 'spring_pad'];
    for (const type of commonSfx) {
      try {
        const player = instantiatePlayer(SFX_SOURCES[type]);
        if (player) {
          player.volume = this.getEffectiveSfxVolume();
          this.sfxPlayers.set(type, player);
        }
      } catch {}
    }
  }

  /**
   * Background Music: Volume scaled down so music never overpowers SFX.
   */
  private getEffectiveBgmVolume(): number {
    const settings = saveManager.getSettings();
    if (settings.musicMuted || settings.musicVolume <= 0) return 0;
    return Math.max(0, Math.min(1, settings.musicVolume * 0.40));
  }

  /**
   * Sound Effects: Full dynamic range according to settings.
   */
  private getEffectiveSfxVolume(): number {
    const settings = saveManager.getSettings();
    if (settings.soundMuted || settings.soundVolume <= 0) return 0;
    return Math.max(0, Math.min(1, settings.soundVolume * 0.90));
  }

  /**
   * Synchronizes volume and mute states across all active players.
   */
  public syncVolumeSettings(): void {
    const bgmVol = this.getEffectiveBgmVolume();
    if (this.bgmPlayer) {
      try {
        this.bgmPlayer.volume = bgmVol;
      } catch {}
    }

    const sfxVol = this.getEffectiveSfxVolume();
    for (const player of this.sfxPlayers.values()) {
      try {
        player.volume = sfxVol;
      } catch {}
    }
  }

  // =========================================================================
  // BACKGROUND MUSIC LIFECYCLE
  // =========================================================================

  /**
   * Plays continuous looping background music for the designated level (0 = menu).
   */
  public playMusic(levelId: number): void {
    // If the requested level music is already loaded
    if (this.currentMusicLevel === levelId && this.bgmPlayer) {
      if (this.isMusicPaused) {
        this.resumeMusic();
      }
      return;
    }

    // Stop and release previous music track
    this.stopMusic();

    const source = BGM_SOURCES[levelId] ?? BGM_SOURCES[1];
    try {
      this.bgmPlayer = instantiatePlayer(source);
      if (this.bgmPlayer) {
        this.bgmPlayer.loop = true;
        this.bgmPlayer.volume = this.getEffectiveBgmVolume();
        this.bgmPlayer.play();
        this.currentMusicLevel = levelId;
        this.isMusicPaused = false;
      }
    } catch {}
  }

  /**
   * Pauses background music when gameplay is paused.
   */
  public pauseMusic(): void {
    if (this.bgmPlayer && !this.isMusicPaused) {
      try {
        if (typeof this.bgmPlayer.pause === 'function') {
          this.bgmPlayer.pause();
        }
        this.isMusicPaused = true;
      } catch (err) {
        console.warn('AudioManager.pauseMusic caught error:', err);
      }
    }
  }

  /**
   * Resumes background music when gameplay resumes.
   */
  public resumeMusic(): void {
    if (this.bgmPlayer && this.isMusicPaused) {
      try {
        this.bgmPlayer.volume = this.getEffectiveBgmVolume();
        if (typeof this.bgmPlayer.play === 'function') {
          this.bgmPlayer.play();
        }
        this.isMusicPaused = false;
      } catch (err) {
        console.warn('AudioManager.resumeMusic caught error:', err);
      }
    }
  }

  /**
   * Stops background music and releases native resources.
   */
  public stopMusic(): void {
    if (this.bgmPlayer) {
      try {
        if (typeof this.bgmPlayer.pause === 'function') {
          this.bgmPlayer.pause();
        }
        if (typeof this.bgmPlayer.release === 'function') {
          this.bgmPlayer.release();
        }
      } catch (err) {
        console.warn('AudioManager.stopMusic caught error:', err);
      }
      this.bgmPlayer = null;
    }
    this.currentMusicLevel = null;
    this.isMusicPaused = false;
  }

  public getCurrentMusicLevel(): number | null {
    return this.currentMusicLevel;
  }

  public getIsMusicPaused(): boolean {
    return this.isMusicPaused;
  }

  // =========================================================================
  // SOUND EFFECTS PLAYBACK & ANTI-SPAM
  // =========================================================================

  /**
   * Plays a gameplay sound effect with anti-spam cooldown protection.
   */
  public playSfx(type: SfxType): void {
    const sfxVol = this.getEffectiveSfxVolume();
    if (sfxVol <= 0) return;

    // Check anti-spam cooldown
    const now = Date.now();
    const cooldown = SFX_COOLDOWNS[type] ?? 0;
    if (cooldown > 0) {
      const lastTime = this.lastSfxTimes.get(type) ?? 0;
      if (now - lastTime < cooldown) {
        return; // Throttled to avoid rapid collision rattle
      }
    }
    this.lastSfxTimes.set(type, now);

    try {
      let player = this.sfxPlayers.get(type);
      if (!player) {
        const source = SFX_SOURCES[type];
        if (!source) return;
        player = instantiatePlayer(source);
        if (player) {
          this.sfxPlayers.set(type, player);
        }
      }

      if (player) {
        player.volume = sfxVol;
        if (typeof player.seekTo === 'function') {
          player.seekTo(0);
        }
        player.play();
      }
    } catch {}
  }

  /**
   * Complete audio cleanup when tearing down or switching screens.
   */
  public releaseAll(): void {
    this.stopMusic();

    for (const player of this.sfxPlayers.values()) {
      try {
        if (player && typeof player.release === 'function') {
          player.release();
        }
      } catch {}
    }
    this.sfxPlayers.clear();
    this.lastSfxTimes.clear();
  }
}

export const AudioManager = new AudioManagerService();
