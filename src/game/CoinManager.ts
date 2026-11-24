import { CoinData } from '../types/game';
import { saveManager } from '../services/SaveManager';
import { SoundManager } from '../services/SoundManager';

export class CoinManager {
  private activeCoins: CoinData[] = [];
  private allLevelCoins: CoinData[] = [];

  constructor(levelCoins: CoinData[] = []) {
    this.initialize(levelCoins);
  }

  /**
   * Initializes coins for the level, filtering out any already collected coins.
   */
  public initialize(levelCoins: CoinData[]): void {
    this.allLevelCoins = [...levelCoins];
    this.activeCoins = levelCoins.filter((c) => !saveManager.isCoinCollected(c.id));
  }

  /**
   * Re-evaluates active coins against persistent SaveManager.
   */
  public refreshActiveCoins(): void {
    this.activeCoins = this.allLevelCoins.filter((c) => !saveManager.isCoinCollected(c.id));
  }

  public getActiveCoins(): CoinData[] {
    return this.activeCoins;
  }

  /**
   * Check circle collision between player ball and active collectible coins.
   * Atomically marks coin as collected and notifies callback.
   */
  public checkCollisions(
    ballX: number,
    ballY: number,
    ballRadius: number,
    onCoinCollected?: (coin: CoinData) => void
  ): CoinData[] {
    if (this.activeCoins.length === 0) return [];

    const collectedThisFrame: CoinData[] = [];
    const remainingCoins: CoinData[] = [];
    const hitDistanceSq = (ballRadius + 14) * (ballRadius + 14);

    for (const coin of this.activeCoins) {
      const dx = ballX - coin.x;
      const dy = ballY - coin.y;

      if (dx * dx + dy * dy < hitDistanceSq) {
        // Overlap detected: Atomically check and mark via SaveManager
        const isNew = !saveManager.isCoinCollected(coin.id);
        if (isNew) {
          saveManager.markCoinCollected(coin.id).catch(() => {});
          collectedThisFrame.push(coin);
          SoundManager.playCoinSound();
          onCoinCollected?.(coin);
        }
      } else {
        remainingCoins.push(coin);
      }
    }

    if (collectedThisFrame.length > 0) {
      this.activeCoins = remainingCoins;
    }

    return collectedThisFrame;
  }
}
