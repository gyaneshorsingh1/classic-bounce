import { KeyData } from '../types/game';
import { saveManager } from '../services/SaveManager';
import { SoundManager } from '../services/SoundManager';

export class KeyManager {
  private activeKeys: KeyData[] = [];
  private allLevelKeys: KeyData[] = [];

  constructor(levelKeys: KeyData[] = []) {
    this.initialize(levelKeys);
  }

  /**
   * Initializes keys for the level, filtering out any already collected keys.
   */
  public initialize(levelKeys: KeyData[]): void {
    this.allLevelKeys = [...levelKeys];
    this.activeKeys = levelKeys.filter((k) => !saveManager.isKeyCollected(k.id));
  }

  /**
   * Re-evaluates active keys against persistent SaveManager.
   */
  public refreshActiveKeys(): void {
    this.activeKeys = this.allLevelKeys.filter((k) => !saveManager.isKeyCollected(k.id));
  }

  public getActiveKeys(): KeyData[] {
    return this.activeKeys;
  }

  public getAllLevelKeys(): KeyData[] {
    return this.allLevelKeys;
  }

  /**
   * Check collision between ball and active collectible keys.
   * Atomically marks key as collected in SaveManager and notifies callback.
   */
  public checkCollisions(
    ballX: number,
    ballY: number,
    ballRadius: number,
    onKeyCollected?: (key: KeyData) => void
  ): KeyData[] {
    if (this.activeKeys.length === 0) return [];

    const collectedThisFrame: KeyData[] = [];
    const remainingKeys: KeyData[] = [];
    const hitDistanceSq = (ballRadius + 18) * (ballRadius + 18);

    for (const key of this.activeKeys) {
      const dx = ballX - key.x;
      const dy = ballY - key.y;

      if (dx * dx + dy * dy < hitDistanceSq) {
        const isNew = !saveManager.isKeyCollected(key.id);
        if (isNew) {
          saveManager.markKeyCollected(key.id).catch(() => {});
          if (key.keyId && key.keyId !== key.id) {
            saveManager.markKeyCollected(key.keyId).catch(() => {});
          }
          collectedThisFrame.push(key);
          SoundManager.playKeyCollectSound();
          onKeyCollected?.(key);
        }
      } else {
        remainingKeys.push(key);
      }
    }

    if (collectedThisFrame.length > 0) {
      this.activeKeys = remainingKeys;
    }

    return collectedThisFrame;
  }
}
