export const INITIAL_LIVES = 3;
export const RESPAWN_INVULNERABLE_DURATION = 1.2; // seconds of invulnerability
export const GAME_OVER_INVULNERABLE_DURATION = 1.5;

export interface DeathResult {
  remainingLives: number;
  isGameOver: boolean;
}

export class LifeManager {
  private lives: number;
  private invulnerableUntil: number = 0;

  constructor(initialLives: number = INITIAL_LIVES) {
    this.lives = initialLives;
  }

  public getLives(): number {
    return this.lives;
  }

  public setLives(lives: number): void {
    this.lives = Math.max(0, Math.min(3, Math.floor(lives)));
  }

  public isInvulnerable(simTime: number): boolean {
    return simTime < this.invulnerableUntil;
  }

  /**
   * Called when player collides with a lethal hazard.
   * Decrements lives. If lives reach 0, resets to 3 lives and flags isGameOver = true.
   */
  public handleDeath(simTime: number): DeathResult {
    this.lives -= 1;

    if (this.lives <= 0) {
      // 3rd Failure: Game Over / Level Restart
      this.lives = INITIAL_LIVES;
      this.invulnerableUntil = simTime + GAME_OVER_INVULNERABLE_DURATION;
      return {
        remainingLives: INITIAL_LIVES,
        isGameOver: true,
      };
    }

    // Normal death: Respawn at latest checkpoint
    this.invulnerableUntil = simTime + RESPAWN_INVULNERABLE_DURATION;
    return {
      remainingLives: this.lives,
      isGameOver: false,
    };
  }

  public resetLives(): void {
    this.lives = INITIAL_LIVES;
    this.invulnerableUntil = 0;
  }
}
