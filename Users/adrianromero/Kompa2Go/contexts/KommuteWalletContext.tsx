import { useState, useEffect, useCallback, useMemo } from 'react';
import createContextHook from '@nkzw/create-context-hook';
import { walletService } from '../src/modules/kommute-wallet/services/firestore-wallet-service';
import { useFirebaseAuth } from './FirebaseAuthContext';
import type {
  KommuteWalletBalance,
  KommuteWalletTransaction,
  KommuteWalletStats
} from '../src/shared/types/kommute-wallet-types';

type KommuteWalletContextType = {
  balance: KommuteWalletBalance | null;
  transactions: KommuteWalletTransaction[];
  stats: KommuteWalletStats | null;
  isLoading: boolean;
  error: string | null;
  refreshBalance: () => Promise<void>;
  refreshTransactions: () => Promise<void>;
  refreshStats: () => Promise<void>;
  createRecharge: (
    amount: number,
    receiptUrl: string,
    receiptFileName: string,
    sinpeReference?: string
  ) => Promise<void>;
};

export const [KommuteWalletContext, useKommuteWallet] = createContextHook<KommuteWalletContextType>(() => {
  const { user } = useFirebaseAuth();
  const [balance, setBalance] = useState<KommuteWalletBalance | null>(null);
  const [transactions, setTransactions] = useState<KommuteWalletTransaction[]>([]);
  const [stats, setStats] = useState<KommuteWalletStats | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const refreshBalance = useCallback(async () => {
    if (!user?.uid) {
      console.log('[KommuteWallet] No user, skipping balance refresh');
      return;
    }

    try {
      setError(null);
      console.log('[KommuteWallet] Refreshing balance for user:', user.uid);
      
      let userBalance = await walletService.getBalance(user.uid);
      
      if (!userBalance) {
        console.log('[KommuteWallet] No balance found, initializing...');
        userBalance = await walletService.initializeBalance(user.uid);
      }
      
      setBalance(userBalance);
      console.log('[KommuteWallet] Balance refreshed:', userBalance);
    } catch (err) {
      console.error('[KommuteWallet] Error refreshing balance:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar el saldo');
    }
  }, [user?.uid]);

  const refreshTransactions = useCallback(async () => {
    if (!user?.uid) {
      console.log('[KommuteWallet] No user, skipping transactions refresh');
      return;
    }

    try {
      setError(null);
      console.log('[KommuteWallet] Refreshing transactions for user:', user.uid);
      
      const userTransactions = await walletService.getUserTransactions(user.uid, 50);
      setTransactions(userTransactions);
      
      console.log('[KommuteWallet] Transactions refreshed:', userTransactions.length);
    } catch (err) {
      console.error('[KommuteWallet] Error refreshing transactions:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar transacciones');
    }
  }, [user?.uid]);

  const refreshStats = useCallback(async () => {
    if (!user?.uid) {
      console.log('[KommuteWallet] No user, skipping stats refresh');
      return;
    }

    try {
      setError(null);
      console.log('[KommuteWallet] Refreshing stats for user:', user.uid);
      
      const userStats = await walletService.getWalletStats(user.uid);
      setStats(userStats);
      
      console.log('[KommuteWallet] Stats refreshed:', userStats);
    } catch (err) {
      console.error('[KommuteWallet] Error refreshing stats:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar estadísticas');
    }
  }, [user?.uid]);

  const createRecharge = useCallback(async (
    amount: number,
    receiptUrl: string,
    receiptFileName: string,
    sinpeReference?: string
  ) => {
    if (!user?.uid) {
      throw new Error('Usuario no autenticado');
    }

    try {
      setError(null);
      console.log('[KommuteWallet] Creating recharge:', { amount, receiptFileName });
      
      await walletService.createRecharge(
        user.uid,
        amount,
        receiptUrl,
        receiptFileName,
        sinpeReference
      );
      
      console.log('[KommuteWallet] Recharge created successfully');
      await refreshStats();
    } catch (err) {
      console.error('[KommuteWallet] Error creating recharge:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error al crear recarga';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [user?.uid, refreshStats]);

  useEffect(() => {
    const loadWalletData = async () => {
      if (!user?.uid) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        await Promise.all([
          refreshBalance(),
          refreshTransactions(),
          refreshStats()
        ]);
      } catch (err) {
        console.error('[KommuteWallet] Error loading wallet data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadWalletData();
  }, [user?.uid, refreshBalance, refreshTransactions, refreshStats]);

  return useMemo(() => ({
    balance,
    transactions,
    stats,
    isLoading,
    error,
    refreshBalance,
    refreshTransactions,
    refreshStats,
    createRecharge
  }), [
    balance,
    transactions,
    stats,
    isLoading,
    error,
    refreshBalance,
    refreshTransactions,
    refreshStats,
    createRecharge
  ]);
});
