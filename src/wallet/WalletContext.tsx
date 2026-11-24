import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { DEFAULT_STARTING_COINS, walletService } from './walletService';

interface WalletContextType {
  coins: number;
  isLoading: boolean;
  addCoins: (amount: number) => Promise<void>;
  spendCoins: (amount: number) => Promise<boolean>;
  refreshWallet: () => Promise<void>;
}

const WalletContext = createContext<WalletContextType>({
  coins: DEFAULT_STARTING_COINS,
  isLoading: true,
  addCoins: async () => {},
  spendCoins: async () => false,
  refreshWallet: async () => {},
});

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [coins, setCoins] = useState<number>(DEFAULT_STARTING_COINS);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Load persistent wallet on mount
  const refreshWallet = useCallback(async () => {
    try {
      const loaded = await walletService.loadCoins();
      setCoins(loaded);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshWallet();
  }, [refreshWallet]);

  // Add coins (e.g. earned in level)
  const addCoins = useCallback(async (amount: number) => {
    if (amount <= 0) return;
    setCoins((prev) => {
      const next = prev + amount;
      walletService.saveCoins(next).catch(() => {});
      return next;
    });
  }, []);

  // Spend coins (e.g. purchase items or revive)
  const spendCoins = useCallback(async (amount: number): Promise<boolean> => {
    if (amount <= 0) return true;
    let success = false;
    setCoins((prev) => {
      if (prev >= amount) {
        success = true;
        const next = prev - amount;
        walletService.saveCoins(next).catch(() => {});
        return next;
      }
      success = false;
      return prev;
    });
    return success;
  }, []);

  return (
    <WalletContext.Provider
      value={{
        coins,
        isLoading,
        addCoins,
        spendCoins,
        refreshWallet,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};

export function useWallet(): WalletContextType {
  return useContext(WalletContext);
}
