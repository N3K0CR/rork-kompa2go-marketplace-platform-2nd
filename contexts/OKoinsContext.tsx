import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './AuthContext';
import { OKOINS_EARNING_RATES, OKoinsCategory } from '@/constants/okoins';

interface OKoinsContextType {
  balance: number;
  transactions: OKoinsTransaction[];
  addOKoins: (amount: number, reason: string) => Promise<void>;
  spendOKoins: (amount: number, reason: string) => Promise<boolean>;
  getTransactionHistory: () => OKoinsTransaction[];
  isLoading: boolean;
  // Loyalty program methods
  awardServiceCompletion: (serviceAmount: number) => Promise<void>;
  awardProviderRating: () => Promise<void>;
  awardFriendReferral: () => Promise<void>;
  awardDailyBonus: () => Promise<boolean>;
  awardReservationPass: () => Promise<void>;
  canAffordDiscount: (discountAmount: number) => boolean;
  applyServiceDiscount: (discountAmount: number) => Promise<boolean>;
  purchaseKraffleTicket: (ticketCost: number, raffleName: string) => Promise<boolean>;
  getLastDailyBonusDate: () => Date | null;
}

interface OKoinsTransaction {
  id: string;
  amount: number;
  type: 'earned' | 'spent';
  reason: string;
  timestamp: Date;
  category?: OKoinsCategory;
}

interface DailyBonusData {
  lastClaimedDate: string;
  streak: number;
}

const OKoinsContext = createContext<OKoinsContextType | undefined>(undefined);

export function OKoinsProvider({ children }: { children: React.ReactNode }) {
  const [balance, setBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState<OKoinsTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dailyBonusData, setDailyBonusData] = useState<DailyBonusData | null>(null);
  const { user } = useAuth();

  // Use imported earning rates
  const EARNING_RATES = OKOINS_EARNING_RATES;

  const saveOKoinsData = useCallback(async (newBalance: number, newTransactions: OKoinsTransaction[], newDailyBonusData?: DailyBonusData) => {
    try {
      const balanceKey = `okoins_balance_${user?.id}`;
      const transactionsKey = `okoins_transactions_${user?.id}`;
      const dailyBonusKey = `okoins_daily_bonus_${user?.id}`;
      
      const savePromises = [
        AsyncStorage.setItem(balanceKey, newBalance.toString()),
        AsyncStorage.setItem(transactionsKey, JSON.stringify(newTransactions))
      ];

      if (newDailyBonusData) {
        savePromises.push(AsyncStorage.setItem(dailyBonusKey, JSON.stringify(newDailyBonusData)));
      }
      
      await Promise.all(savePromises);
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
          amount: EARNING_RATES.WELCOME_BONUS,
          type: 'earned',
          reason: 'Bono de bienvenida - ¡Gracias por unirte a Kompa2Go!',
          timestamp: new Date(),
          category: 'welcome'
        };
        setBalance(EARNING_RATES.WELCOME_BONUS);
        setTransactions([welcomeTransaction]);
        // Save directly without using saveOKoinsData to avoid circular dependency
        try {
          await Promise.all([
            AsyncStorage.setItem(balanceKey, EARNING_RATES.WELCOME_BONUS.toString()),
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

      // Load daily bonus data
      const dailyBonusKey = `okoins_daily_bonus_${user.id}`;
      const storedDailyBonus = await AsyncStorage.getItem(dailyBonusKey);
      if (storedDailyBonus) {
        setDailyBonusData(JSON.parse(storedDailyBonus));
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

  // Loyalty program methods
  const awardServiceCompletion = useCallback(async (serviceAmount: number) => {
    const bonusAmount = EARNING_RATES.SERVICE_COMPLETION;
    const newTransaction: OKoinsTransaction = {
      id: Date.now().toString(),
      amount: bonusAmount,
      type: 'earned',
      reason: `Servicio completado (+${bonusAmount} OKoins)`,
      timestamp: new Date(),
      category: 'service'
    };

    const newBalance = balance + bonusAmount;
    const newTransactions = [newTransaction, ...transactions];

    setBalance(newBalance);
    setTransactions(newTransactions);
    await saveOKoinsData(newBalance, newTransactions);
  }, [balance, transactions, saveOKoinsData]);

  const awardProviderRating = useCallback(async () => {
    const bonusAmount = EARNING_RATES.PROVIDER_RATING;
    const newTransaction: OKoinsTransaction = {
      id: Date.now().toString(),
      amount: bonusAmount,
      type: 'earned',
      reason: `Calificación de proveedor (+${bonusAmount} OKoins)`,
      timestamp: new Date(),
      category: 'rating'
    };

    const newBalance = balance + bonusAmount;
    const newTransactions = [newTransaction, ...transactions];

    setBalance(newBalance);
    setTransactions(newTransactions);
    await saveOKoinsData(newBalance, newTransactions);
  }, [balance, transactions, saveOKoinsData]);

  const awardFriendReferral = useCallback(async () => {
    const bonusAmount = EARNING_RATES.FRIEND_REFERRAL;
    const newTransaction: OKoinsTransaction = {
      id: Date.now().toString(),
      amount: bonusAmount,
      type: 'earned',
      reason: `Referido exitoso (+${bonusAmount} OKoins)`,
      timestamp: new Date(),
      category: 'referral'
    };

    const newBalance = balance + bonusAmount;
    const newTransactions = [newTransaction, ...transactions];

    setBalance(newBalance);
    setTransactions(newTransactions);
    await saveOKoinsData(newBalance, newTransactions);
  }, [balance, transactions, saveOKoinsData]);

  const awardReservationPass = useCallback(async () => {
    const bonusAmount = EARNING_RATES.RESERVATION_PASS;
    const newTransaction: OKoinsTransaction = {
      id: Date.now().toString(),
      amount: bonusAmount,
      type: 'earned',
      reason: `Compra de Pase de Reserva (+${bonusAmount} OKoins)`,
      timestamp: new Date(),
      category: 'reservation_pass'
    };

    const newBalance = balance + bonusAmount;
    const newTransactions = [newTransaction, ...transactions];

    setBalance(newBalance);
    setTransactions(newTransactions);
    await saveOKoinsData(newBalance, newTransactions);
  }, [balance, transactions, saveOKoinsData]);

  const awardDailyBonus = useCallback(async (): Promise<boolean> => {
    const today = new Date().toDateString();
    
    if (dailyBonusData?.lastClaimedDate === today) {
      return false; // Already claimed today
    }

    const bonusAmount = EARNING_RATES.DAILY_BONUS;
    const newStreak = dailyBonusData ? dailyBonusData.streak + 1 : 1;
    
    const newDailyBonusData: DailyBonusData = {
      lastClaimedDate: today,
      streak: newStreak
    };

    const newTransaction: OKoinsTransaction = {
      id: Date.now().toString(),
      amount: bonusAmount,
      type: 'earned',
      reason: `Bono diario - Día ${newStreak} (+${bonusAmount} OKoins)`,
      timestamp: new Date(),
      category: 'daily'
    };

    const newBalance = balance + bonusAmount;
    const newTransactions = [newTransaction, ...transactions];

    setBalance(newBalance);
    setTransactions(newTransactions);
    setDailyBonusData(newDailyBonusData);
    await saveOKoinsData(newBalance, newTransactions, newDailyBonusData);
    
    return true;
  }, [balance, transactions, dailyBonusData, saveOKoinsData]);

  const canAffordDiscount = useCallback((discountAmount: number): boolean => {
    return balance >= discountAmount;
  }, [balance]);

  const applyServiceDiscount = useCallback(async (discountAmount: number): Promise<boolean> => {
    if (!canAffordDiscount(discountAmount)) {
      return false;
    }

    const newTransaction: OKoinsTransaction = {
      id: Date.now().toString(),
      amount: discountAmount,
      type: 'spent',
      reason: `Descuento aplicado (-${discountAmount} OKoins)`,
      timestamp: new Date(),
      category: 'discount'
    };

    const newBalance = balance - discountAmount;
    const newTransactions = [newTransaction, ...transactions];

    setBalance(newBalance);
    setTransactions(newTransactions);
    await saveOKoinsData(newBalance, newTransactions);
    return true;
  }, [balance, transactions, canAffordDiscount, saveOKoinsData]);

  const purchaseKraffleTicket = useCallback(async (ticketCost: number, raffleName: string): Promise<boolean> => {
    if (balance < ticketCost) {
      return false;
    }

    const newTransaction: OKoinsTransaction = {
      id: Date.now().toString(),
      amount: ticketCost,
      type: 'spent',
      reason: `Boleto Kraffle: ${raffleName} (-${ticketCost} OKoins)`,
      timestamp: new Date(),
      category: 'kraffle'
    };

    const newBalance = balance - ticketCost;
    const newTransactions = [newTransaction, ...transactions];

    setBalance(newBalance);
    setTransactions(newTransactions);
    await saveOKoinsData(newBalance, newTransactions);
    return true;
  }, [balance, transactions, saveOKoinsData]);

  const getLastDailyBonusDate = useCallback((): Date | null => {
    if (!dailyBonusData?.lastClaimedDate) return null;
    return new Date(dailyBonusData.lastClaimedDate);
  }, [dailyBonusData]);

  const contextValue = useMemo(() => ({
    balance,
    transactions,
    addOKoins,
    spendOKoins,
    getTransactionHistory,
    isLoading,
    // Loyalty program methods
    awardServiceCompletion,
    awardProviderRating,
    awardFriendReferral,
    awardDailyBonus,
    awardReservationPass,
    canAffordDiscount,
    applyServiceDiscount,
    purchaseKraffleTicket,
    getLastDailyBonusDate
  }), [
    balance,
    transactions,
    addOKoins,
    spendOKoins,
    getTransactionHistory,
    isLoading,
    awardServiceCompletion,
    awardProviderRating,
    awardFriendReferral,
    awardDailyBonus,
    awardReservationPass,
    canAffordDiscount,
    applyServiceDiscount,
    purchaseKraffleTicket,
    getLastDailyBonusDate
  ]);

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