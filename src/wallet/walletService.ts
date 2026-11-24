import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@bounce_guest_wallet_v1';
export const DEFAULT_STARTING_COINS = 100;

export interface WalletRecord {
  coins: number;
  lastUpdated: number;
}

let memoryCoins = DEFAULT_STARTING_COINS;

export const walletService = {
  /**
   * Load wallet coins from persistent AsyncStorage.
   * If no wallet exists yet, initializes with default starting coins.
   */
  async loadCoins(): Promise<number> {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed: WalletRecord = JSON.parse(raw);
        if (typeof parsed.coins === 'number' && !isNaN(parsed.coins)) {
          memoryCoins = Math.max(0, Math.floor(parsed.coins));
          return memoryCoins;
        }
      }
      // Initialize if first time
      await this.saveCoins(DEFAULT_STARTING_COINS);
      return DEFAULT_STARTING_COINS;
    } catch {
      return memoryCoins;
    }
  },

  /**
   * Increment coins atomically.
   */
  async addCoins(amount: number): Promise<number> {
    if (amount <= 0) return memoryCoins;
    memoryCoins = Math.max(0, Math.floor(memoryCoins + amount));
    await this.saveCoins(memoryCoins);
    return memoryCoins;
  },

  /**
   * Save wallet coins to persistent AsyncStorage.
   */
  async saveCoins(coins: number): Promise<void> {
    memoryCoins = Math.max(0, Math.floor(coins));
    try {
      const record: WalletRecord = {
        coins: memoryCoins,
        lastUpdated: Date.now(),
      };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(record));
    } catch {
      // In memory fallback
    }
  },
};
