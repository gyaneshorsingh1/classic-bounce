import AsyncStorage from '@react-native-async-storage/async-storage';
import { GameSettings, LevelProgressRecord } from '../types/game';

const COLLECTED_COINS_KEY = '@bounce_collected_coins_v1';
const COLLECTED_KEYS_KEY = '@bounce_collected_keys_v1';
const UNLOCKED_DOORS_KEY = '@bounce_unlocked_doors_v1';
const PROGRESS_KEY = '@bounce_progression_v2';
const SETTINGS_KEY = '@bounce_settings_v2';

export const TOTAL_LEVELS = 5;

export const DEFAULT_SETTINGS: GameSettings = {
  soundVolume: 1.0,
  musicVolume: 0.7,
  soundMuted: false,
  musicMuted: false,
  vibrationEnabled: false,
  controlLayout: 'split',
  controlButtonSize: 'normal',
  graphicsQuality: 'high',
};

interface SerializedProgress {
  unlockedLevels: number[];
  completedLevels: number[];
  records: Record<number, LevelProgressRecord>;
  lastPlayedLevel: number;
}

export class SaveManager {
  private static instance: SaveManager;
  private collectedCoins: Set<string> = new Set();
  private collectedKeys: Set<string> = new Set();
  private unlockedDoors: Set<string> = new Set();

  // Flag to unlock all levels (enabled for open gameplay & testing)
  private allLevelsUnlocked: boolean = true;

  private unlockedLevels: Set<number> = new Set([1, 2, 3, 4, 5]);
  private completedLevels: Set<number> = new Set();
  private levelRecords: Map<number, LevelProgressRecord> = new Map([
    [1, { levelId: 1, unlocked: true, completed: false, completionsCount: 0 }],
    [2, { levelId: 2, unlocked: true, completed: false, completionsCount: 0 }],
    [3, { levelId: 3, unlocked: true, completed: false, completionsCount: 0 }],
    [4, { levelId: 4, unlocked: true, completed: false, completionsCount: 0 }],
    [5, { levelId: 5, unlocked: true, completed: false, completionsCount: 0 }],
  ]);
  private lastPlayedLevel: number = 1;
  private settings: GameSettings = { ...DEFAULT_SETTINGS };

  private isLoaded: boolean = false;
  private loadPromise: Promise<void> | null = null;
  private listeners: Set<(settings: GameSettings) => void> = new Set();

  private constructor() {
    this.loadAllSaveData().catch(() => {});
  }

  public static getInstance(): SaveManager {
    if (!SaveManager.instance) {
      SaveManager.instance = new SaveManager();
    }
    return SaveManager.instance;
  }

  public setAllLevelsUnlocked(unlocked: boolean): void {
    this.allLevelsUnlocked = unlocked;
    this.notifyListeners();
  }

  public isAllLevelsUnlocked(): boolean {
    return this.allLevelsUnlocked;
  }

  /**
   * Subscribe to settings or progress changes.
   */
  public subscribe(listener: (settings: GameSettings) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(): void {
    const currentSettings = this.getSettings();
    for (const listener of this.listeners) {
      try {
        listener(currentSettings);
      } catch {}
    }
  }

  /**
   * Load collected coin, key, door, progress, and settings data into in-memory cache.
   */
  public async loadAllSaveData(): Promise<void> {
    if (this.isLoaded) {
      return;
    }
    if (this.loadPromise) {
      return this.loadPromise;
    }

    this.loadPromise = (async () => {
      try {
        const [coinsRaw, keysRaw, doorsRaw, progressRaw, settingsRaw] = await Promise.all([
          AsyncStorage.getItem(COLLECTED_COINS_KEY),
          AsyncStorage.getItem(COLLECTED_KEYS_KEY),
          AsyncStorage.getItem(UNLOCKED_DOORS_KEY),
          AsyncStorage.getItem(PROGRESS_KEY),
          AsyncStorage.getItem(SETTINGS_KEY),
        ]);

        if (coinsRaw) {
          const parsed = JSON.parse(coinsRaw);
          if (Array.isArray(parsed)) {
            this.collectedCoins = new Set(parsed);
          }
        }

        if (keysRaw) {
          const parsed = JSON.parse(keysRaw);
          if (Array.isArray(parsed)) {
            this.collectedKeys = new Set(parsed);
          }
        }

        if (doorsRaw) {
          const parsed = JSON.parse(doorsRaw);
          if (Array.isArray(parsed)) {
            this.unlockedDoors = new Set(parsed);
          }
        }

        if (progressRaw) {
          const parsed: SerializedProgress = JSON.parse(progressRaw);
          if (parsed && Array.isArray(parsed.unlockedLevels)) {
            this.unlockedLevels = new Set(parsed.unlockedLevels);
            this.unlockedLevels.add(1); // Level 1 is always unlocked
          }
          if (parsed && Array.isArray(parsed.completedLevels)) {
            this.completedLevels = new Set(parsed.completedLevels);
          }
          if (parsed && parsed.records) {
            for (const [lvlStr, rec] of Object.entries(parsed.records)) {
              this.levelRecords.set(Number(lvlStr), rec);
            }
          }
          if (parsed && typeof parsed.lastPlayedLevel === 'number') {
            this.lastPlayedLevel = parsed.lastPlayedLevel;
          }
        }

        if (this.allLevelsUnlocked) {
          for (let i = 1; i <= TOTAL_LEVELS; i++) {
            this.unlockedLevels.add(i);
            const rec = this.levelRecords.get(i);
            if (rec) {
              rec.unlocked = true;
            }
          }
        }

        if (settingsRaw) {
          const parsed: Partial<GameSettings> = JSON.parse(settingsRaw);
          if (parsed && typeof parsed === 'object') {
            this.settings = { ...DEFAULT_SETTINGS, ...parsed };
          }
        }
      } catch {
        // Fallback to in-memory defaults
      } finally {
        this.isLoaded = true;
        this.loadPromise = null;
        this.notifyListeners();
      }
    })();

    return this.loadPromise;
  }

  // --- Coins ---

  public isCoinCollected(coinId: string): boolean {
    return this.collectedCoins.has(coinId);
  }

  public async markCoinCollected(coinId: string): Promise<boolean> {
    if (this.collectedCoins.has(coinId)) {
      return false;
    }

    this.collectedCoins.add(coinId);

    try {
      await AsyncStorage.setItem(
        COLLECTED_COINS_KEY,
        JSON.stringify(Array.from(this.collectedCoins))
      );
    } catch {}

    return true;
  }

  public getCollectedCoinIds(): Set<string> {
    return new Set(this.collectedCoins);
  }

  // --- Keys ---

  public isKeyCollected(keyId: string): boolean {
    return this.collectedKeys.has(keyId);
  }

  public async markKeyCollected(keyId: string): Promise<boolean> {
    if (this.collectedKeys.has(keyId)) {
      return false;
    }

    this.collectedKeys.add(keyId);

    try {
      await AsyncStorage.setItem(
        COLLECTED_KEYS_KEY,
        JSON.stringify(Array.from(this.collectedKeys))
      );
    } catch {}

    return true;
  }

  public getCollectedKeyIds(): Set<string> {
    return new Set(this.collectedKeys);
  }

  // --- Doors ---

  public isDoorUnlocked(doorId: string): boolean {
    return this.unlockedDoors.has(doorId);
  }

  public async markDoorUnlocked(doorId: string): Promise<boolean> {
    if (this.unlockedDoors.has(doorId)) {
      return false;
    }

    this.unlockedDoors.add(doorId);

    try {
      await AsyncStorage.setItem(
        UNLOCKED_DOORS_KEY,
        JSON.stringify(Array.from(this.unlockedDoors))
      );
    } catch {}

    return true;
  }

  public getUnlockedDoorIds(): Set<string> {
    return new Set(this.unlockedDoors);
  }

  // --- Level Progression ---

  public isLevelUnlocked(levelId: number): boolean {
    if (this.allLevelsUnlocked && levelId >= 1 && levelId <= TOTAL_LEVELS) {
      return true;
    }
    if (levelId === 1) return true;
    return this.unlockedLevels.has(levelId);
  }

  public isLevelCompleted(levelId: number): boolean {
    return this.completedLevels.has(levelId);
  }

  public getUnlockedLevels(): number[] {
    if (this.allLevelsUnlocked) {
      return [1, 2, 3, 4, 5];
    }
    return Array.from(this.unlockedLevels).sort((a, b) => a - b);
  }

  public getCompletedLevels(): number[] {
    return Array.from(this.completedLevels).sort((a, b) => a - b);
  }

  public getLevelRecord(levelId: number): LevelProgressRecord {
    const existing = this.levelRecords.get(levelId);
    if (existing) {
      return {
        ...existing,
        unlocked: this.isLevelUnlocked(levelId),
      };
    }
    const def: LevelProgressRecord = {
      levelId,
      unlocked: this.isLevelUnlocked(levelId),
      completed: this.isLevelCompleted(levelId),
      completionsCount: 0,
    };
    this.levelRecords.set(levelId, def);
    return def;
  }

  public getAllLevelRecords(): Map<number, LevelProgressRecord> {
    const map = new Map<number, LevelProgressRecord>();
    for (const [id, rec] of this.levelRecords.entries()) {
      map.set(id, {
        ...rec,
        unlocked: this.isLevelUnlocked(id),
      });
    }
    return map;
  }

  public getLastPlayedLevel(): number {
    return this.lastPlayedLevel;
  }

  public async setLastPlayedLevel(levelId: number): Promise<void> {
    this.lastPlayedLevel = levelId;
    await this.persistProgress();
  }

  public getHighestUnlockedLevel(): number {
    if (this.allLevelsUnlocked) {
      return TOTAL_LEVELS;
    }
    let max = 1;
    for (const lvl of this.unlockedLevels) {
      if (lvl > max) max = lvl;
    }
    return max;
  }

  public getNextUncompletedLevel(): number {
    for (let i = 1; i <= TOTAL_LEVELS; i++) {
      if (this.isLevelUnlocked(i) && !this.isLevelCompleted(i)) {
        return i;
      }
    }
    return this.lastPlayedLevel || 1;
  }

  /**
   * Unlocks the next consecutive level.
   */
  public async unlockNextLevel(currentLevelId: number): Promise<boolean> {
    const nextLevel = currentLevelId + 1;
    if (nextLevel > TOTAL_LEVELS) return false;

    if (!this.unlockedLevels.has(nextLevel)) {
      this.unlockedLevels.add(nextLevel);
      const rec = this.getLevelRecord(nextLevel);
      rec.unlocked = true;
      this.levelRecords.set(nextLevel, rec);
      await this.persistProgress();
      this.notifyListeners();
      return true;
    }
    return false;
  }

  /**
   * Record level completion with star rating and time score.
   */
  public async recordLevelCompletion(
    levelId: number,
    timeSeconds: number,
    stars: number
  ): Promise<{ isNewBestTime: boolean; isNewBestStars: boolean }> {
    this.completedLevels.add(levelId);

    const rec = this.getLevelRecord(levelId);
    rec.completed = true;
    rec.unlocked = true;
    rec.completionsCount += 1;

    let isNewBestTime = false;
    if (rec.bestTimeSeconds === undefined || timeSeconds < rec.bestTimeSeconds) {
      rec.bestTimeSeconds = Math.round(timeSeconds * 10) / 10;
      isNewBestTime = true;
    }

    let isNewBestStars = false;
    if (rec.bestStars === undefined || stars > rec.bestStars) {
      rec.bestStars = stars;
      isNewBestStars = true;
    }

    this.levelRecords.set(levelId, rec);

    // Unlock next level if available
    const nextLevel = levelId + 1;
    if (nextLevel <= TOTAL_LEVELS) {
      this.unlockedLevels.add(nextLevel);
      const nextRec = this.getLevelRecord(nextLevel);
      nextRec.unlocked = true;
      this.levelRecords.set(nextLevel, nextRec);
    }

    this.lastPlayedLevel = levelId;

    await this.persistProgress();
    this.notifyListeners();

    return { isNewBestTime, isNewBestStars };
  }

  private async persistProgress(): Promise<void> {
    try {
      const recordsObj: Record<number, LevelProgressRecord> = {};
      for (const [id, rec] of this.levelRecords.entries()) {
        recordsObj[id] = rec;
      }

      const payload: SerializedProgress = {
        unlockedLevels: Array.from(this.unlockedLevels),
        completedLevels: Array.from(this.completedLevels),
        records: recordsObj,
        lastPlayedLevel: this.lastPlayedLevel,
      };

      await AsyncStorage.setItem(PROGRESS_KEY, JSON.stringify(payload));
    } catch {}
  }

  // --- Settings ---

  public getSettings(): GameSettings {
    return { ...this.settings };
  }

  public async updateSettings(partial: Partial<GameSettings>): Promise<GameSettings> {
    this.settings = { ...this.settings, ...partial };
    try {
      await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(this.settings));
    } catch {}
    this.notifyListeners();
    return { ...this.settings };
  }

  // --- Reset & Testing ---

  /**
   * Resets all game progression, completed levels, and collected items.
   * Preserves user control/audio settings.
   */
  public async resetAllProgress(): Promise<void> {
    this.collectedCoins.clear();
    this.collectedKeys.clear();
    this.unlockedDoors.clear();

    this.unlockedLevels = this.allLevelsUnlocked ? new Set([1, 2, 3, 4, 5]) : new Set([1]);
    this.completedLevels = new Set();
    this.levelRecords = new Map([
      [1, { levelId: 1, unlocked: true, completed: false, completionsCount: 0 }],
      [2, { levelId: 2, unlocked: this.allLevelsUnlocked, completed: false, completionsCount: 0 }],
      [3, { levelId: 3, unlocked: this.allLevelsUnlocked, completed: false, completionsCount: 0 }],
      [4, { levelId: 4, unlocked: this.allLevelsUnlocked, completed: false, completionsCount: 0 }],
      [5, { levelId: 5, unlocked: this.allLevelsUnlocked, completed: false, completionsCount: 0 }],
    ]);
    this.lastPlayedLevel = 1;

    try {
      await Promise.all([
        AsyncStorage.removeItem(COLLECTED_COINS_KEY),
        AsyncStorage.removeItem(COLLECTED_KEYS_KEY),
        AsyncStorage.removeItem(UNLOCKED_DOORS_KEY),
        AsyncStorage.removeItem(PROGRESS_KEY),
      ]);
    } catch {}

    this.notifyListeners();
  }

  /**
   * Completely resets everything including settings (for automated unit test suites).
   */
  public async resetForTesting(): Promise<void> {
    this.allLevelsUnlocked = false; // allows progression unit tests to verify sequential unlocking
    await this.resetAllProgress();
    this.settings = { ...DEFAULT_SETTINGS };
    try {
      await AsyncStorage.removeItem(SETTINGS_KEY);
    } catch {}
    this.isLoaded = true;
    this.notifyListeners();
  }
}

export const saveManager = SaveManager.getInstance();
