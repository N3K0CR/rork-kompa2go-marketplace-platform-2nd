import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './AuthContext';

interface OKoinsContextType {
  balance: number;
  transactions: OKoinsTransaction[];
  addOKoins: (amount: number, reason: string) => Promise<void>;
  spendOKoins: (amount: number, reason: string) => Promise<boolean>;
  getTransactionHistory: () => OKoinsTransaction[];
  isLoading: boolean;
}

interface OKoinsTransaction {
  id: string;
  amount: number;
  type: 'earned' | 'spent';
  reason: string;
  timestamp: Date;
}

const OKoinsContext = createContext<OKoinsContextType | undefined>(undefined);

export function OKoinsProvider({ children }: { children: React.ReactNode }) {
  const [balance, setBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState<OKoinsTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  const saveOKoinsData = useCallback(async (newBalance: number, newTransactions: OKoinsTransaction[]) => {
    try {
      const balanceKey = `okoins_balance_${user?.id}`;
      const transactionsKey = `okoins_transactions_${user?.id}`;
      
      await Promise.all([
        AsyncStorage.setItem(balanceKey, newBalance.toString()),
        AsyncStorage.setItem(transactionsKey, JSON.stringify(newTransactions))
      ]);
    } catch (error) {
      console.error('Error saving OKoins data:', error);
    }
  }, [user?.id]);

  const addOKoins = useCallback(async (amount: number, reason: string) => {
    const newTransaction: OKoinsTransaction = {
      id: Date.now().toString(),
      amount,
      type: 'earned',
      reason,
      timestamp: new Date()
    };

    const newBalance = balance + amount;
    const newTransactions = [newTransaction, ...transactions];

    setBalance(newBalance);
    setTransactions(newTransactions);
    await saveOKoinsData(newBalance, newTransactions);
  }, [balance, transactions, saveOKoinsData]);

  const loadOKoinsData = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      setIsLoading(true);
      const balanceKey = `okoins_balance_${user.id}`;
      const transactionsKey = `okoins_transactions_${user.id}`;
      
      const [storedBalance, storedTransactions] = await Promise.all([
        AsyncStorage.getItem(balanceKey),
        AsyncStorage.getItem(transactionsKey)
      ]);

      if (storedBalance) {
        const parsedBalance = parseInt(storedBalance, 10);
        setBalance(parsedBalance);
      } else {
        // Welcome bonus for new users - set directly without circular dependency
        const welcomeTransaction: OKoinsTransaction = {
          id: Date.now().toString(),
          amount: 100,
          type: 'earned',
          reason: 'Bono de bienvenida',
          timestamp: new Date()
        };
        setBalance(100);
        setTransactions([welcomeTransaction]);
        // Save directly without using saveOKoinsData to avoid circular dependency
        try {
          await Promise.all([
            AsyncStorage.setItem(balanceKey, '100'),
            AsyncStorage.setItem(transactionsKey, JSON.stringify([welcomeTransaction]))
          ]);
        } catch (saveError) {
          console.error('Error saving welcome bonus:', saveError);
        }
        return; // Exit early to avoid setting transactions again
      }

      if (storedTransactions) {
        const parsedTransactions = JSON.parse(storedTransactions).map((t: any) => ({
          ...t,
          timestamp: new Date(t.timestamp)
        }));
        setTransactions(parsedTransactions);
      }
    } catch (error) {
      console.error('Error loading OKoins data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user?.id) {
      loadOKoinsData();
    }
  }, [user?.id]);



  const spendOKoins = useCallback(async (amount: number, reason: string): Promise<boolean> => {
    if (balance < amount) {
      return false;
    }

    const newTransaction: OKoinsTransaction = {
      id: Date.now().toString(),
      amount,
      type: 'spent',
      reason,
      timestamp: new Date()
    };

    const newBalance = balance - amount;
    const newTransactions = [newTransaction, ...transactions];

    setBalance(newBalance);
    setTransactions(newTransactions);
    await saveOKoinsData(newBalance, newTransactions);
    return true;
  }, [balance, transactions, saveOKoinsData]);

  const getTransactionHistory = useCallback(() => {
    return transactions.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }, [transactions]);

  const contextValue = useMemo(() => ({
    balance,
    transactions,
    addOKoins,
    spendOKoins,
    getTransactionHistory,
    isLoading
  }), [balance, transactions, addOKoins, spendOKoins, getTransactionHistory, isLoading]);

  return (
    <OKoinsContext.Provider value={contextValue}>
      {children}
    </OKoinsContext.Provider>
  );
}

export function useOKoins() {
  const context = useContext(OKoinsContext);
  if (context === undefined) {
    throw new Error('useOKoins must be used within an OKoinsProvider');
  }
  return context;
}