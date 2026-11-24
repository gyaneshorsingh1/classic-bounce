import { BallForm } from '../types/game';
import { AudioManager } from './AudioManager';

/**
 * SoundManager:
 * Backward-compatible facade delegating all sound effects and background music
 * to the centralized AudioManager service (powered by expo-audio).
 */
class SoundManagerFacade {
  public playJumpSound(): void {
    AudioManager.playSfx('jump');
  }

  public playLandSound(): void {
    AudioManager.playSfx('land');
  }

  private lastRollTime: number = 0;

  public playRollSound(): void {
    const now = Date.now();
    if (now - this.lastRollTime < 500) return;
    this.lastRollTime = now;
    // Rolling sound is throttled and does not spam the landing impact audio player
  }

  public playWaterSplashSound(isEntering: boolean = true): void {
    AudioManager.playSfx(isEntering ? 'water_enter' : 'water_exit');
  }

  public playWallBreakSound(): void {
    AudioManager.playSfx('break_stone');
  }

  public playCheckpointSound(): void {
    AudioManager.playSfx('checkpoint');
  }

  public playDeathSound(): void {
    AudioManager.playSfx('death');
  }

  public playLevelCompleteSound(): void {
    AudioManager.playSfx('level_complete');
  }

  public playTransformationSound(_form?: BallForm): void {
    AudioManager.playSfx('transform');
  }

  public playCoinSound(): void {
    AudioManager.playSfx('coin');
  }

  public playKeyCollectSound(): void {
    AudioManager.playSfx('coin');
  }

  public playDoorUnlockSound(): void {
    AudioManager.playSfx('door_open');
  }

  public playSwitchSound(_activated: boolean = true): void {
    AudioManager.playSfx('switch');
  }

  public playBouncePadSound(): void {
    AudioManager.playSfx('spring_pad');
  }

  public playTeleportSound(): void {
    AudioManager.playSfx('teleport');
  }

  public playSecretFoundSound(): void {
    AudioManager.playSfx('checkpoint');
  }

  public playHazardHitSound(): void {
    AudioManager.playSfx('death');
  }

  public playLevelMusic(levelId: number): void {
    AudioManager.playMusic(levelId);
  }

  public pauseMusic(): void {
    AudioManager.pauseMusic();
  }

  public resumeMusic(): void {
    AudioManager.resumeMusic();
  }

  public stopMusic(): void {
    AudioManager.stopMusic();
  }
}

export const SoundManager = new SoundManagerFacade();
