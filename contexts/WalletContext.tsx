import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './AuthContext';

interface Transaction {
  id: string;
  type: 'booking_commission' | 'wallet_topup' | 'okoins_earned' | 'okoins_spent' | 'raffle_ticket';
  amount: number;
  currency: 'CRC' | 'OKOINS';
  description: string;
  date: Date;
  status: 'pending' | 'approved' | 'rejected';
  providerId?: string;
  serviceId?: string;
}

interface BookingPass {
  id: string;
  userId: string;
  isUsed: boolean;
  createdAt: Date;
  usedAt?: Date;
  providerId?: string;
  serviceId?: string;
}

interface WalletContextType {
  walletBalance: number;
  okoins: number;
  transactions: Transaction[];
  bookingPasses: BookingPass[];
  loading: boolean;
  
  // Wallet functions
  addFunds: (amount: number, method: 'bank_transfer' | 'sinpe' | 'kash') => Promise<void>;
  purchaseBookingPass: () => Promise<string>;
  useBookingPass: (passId: string, providerId: string, serviceId: string) => Promise<void>;
  
  // OKoins functions
  earnOkoins: (amount: number, reason: string) => Promise<void>;
  spendOkoins: (amount: number, reason: string) => Promise<void>;
  
  // Transaction functions
  getTransactionHistory: () => Transaction[];
  refreshWallet: () => Promise<void>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

const BOOKING_COMMISSION = 500; // CRC
const WELCOME_OKOINS = 100;

export function WalletProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [walletBalance, setWalletBalance] = useState(0);
  const [okoins, setOkoins] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [bookingPasses, setBookingPasses] = useState<BookingPass[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadWalletData();
    }
  }, [user]);

  const loadWalletData = async () => {
    if (!user) return;
    
    try {
      const walletData = await AsyncStorage.getItem(`wallet_${user.id}`);
      const transactionData = await AsyncStorage.getItem(`transactions_${user.id}`);
      const passData = await AsyncStorage.getItem(`booking_passes_${user.id}`);
      
      if (walletData) {
        const data = JSON.parse(walletData);
        setWalletBalance(data.balance || 0);
        setOkoins(data.okoins || (user.userType === 'client' ? WELCOME_OKOINS : 0));
      } else if (user.userType === 'client') {
        // Welcome bonus for new clients
        setOkoins(WELCOME_OKOINS);
        // Create welcome transaction directly to avoid circular dependency
        const welcomeTransaction: Transaction = {
          id: Date.now().toString(),
          type: 'okoins_earned',
          amount: WELCOME_OKOINS,
          currency: 'OKOINS',
          description: 'Bono de bienvenida',
          date: new Date(),
          status: 'approved'
        };
        setTransactions(prev => [welcomeTransaction, ...prev]);
      }
      
      if (transactionData) {
        const parsedTransactions = JSON.parse(transactionData).map((t: any) => ({
          ...t,
          date: new Date(t.date)
        }));
        setTransactions(parsedTransactions);
      }
      
      if (passData) {
        const parsedPasses = JSON.parse(passData).map((p: any) => ({
          ...p,
          createdAt: new Date(p.createdAt),
          usedAt: p.usedAt ? new Date(p.usedAt) : undefined
        }));
        setBookingPasses(parsedPasses);
      }
    } catch (error) {
      console.error('Error loading wallet data:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveWalletData = async () => {
    if (!user) return;
    
    try {
      await AsyncStorage.setItem(`wallet_${user.id}`, JSON.stringify({
        balance: walletBalance,
        okoins: okoins
      }));
      
      await AsyncStorage.setItem(`transactions_${user.id}`, JSON.stringify(transactions));
      await AsyncStorage.setItem(`booking_passes_${user.id}`, JSON.stringify(bookingPasses));
    } catch (error) {
      console.error('Error saving wallet data:', error);
    }
  };

  const addFunds = async (amount: number, method: 'bank_transfer' | 'sinpe' | 'kash') => {
    if (!user) throw new Error('Usuario no autenticado');
    
    const transaction: Transaction = {
      id: Date.now().toString(),
      type: 'wallet_topup',
      amount,
      currency: 'CRC',
      description: `Recarga de billetera vía ${method}`,
      date: new Date(),
      status: 'pending' // Requires admin approval
    };
    
    setTransactions(prev => [transaction, ...prev]);
    await saveWalletData();
  };

  const purchaseBookingPass = async (): Promise<string> => {
    if (!user) throw new Error('Usuario no autenticado');
    if (walletBalance < BOOKING_COMMISSION) {
      throw new Error('Saldo insuficiente en la billetera');
    }
    
    const passId = `pass_${Date.now()}`;
    const newPass: BookingPass = {
      id: passId,
      userId: user.id,
      isUsed: false,
      createdAt: new Date()
    };
    
    const transaction: Transaction = {
      id: Date.now().toString(),
      type: 'booking_commission',
      amount: BOOKING_COMMISSION,
      currency: 'CRC',
      description: 'Compra de pase de reserva',
      date: new Date(),
      status: 'approved'
    };
    
    setWalletBalance(prev => prev - BOOKING_COMMISSION);
    setBookingPasses(prev => [newPass, ...prev]);
    setTransactions(prev => [transaction, ...prev]);
    
    // Earn OKoins for booking
    await earnOkoins(10, 'Compra de pase de reserva');
    
    await saveWalletData();
    return passId;
  };

  const useBookingPass = async (passId: string, providerId: string, serviceId: string) => {
    if (!user) throw new Error('Usuario no autenticado');
    
    const passIndex = bookingPasses.findIndex(p => p.id === passId && !p.isUsed);
    if (passIndex === -1) {
      throw new Error('Pase de reserva no válido o ya utilizado');
    }
    
    const updatedPasses = [...bookingPasses];
    updatedPasses[passIndex] = {
      ...updatedPasses[passIndex],
      isUsed: true,
      usedAt: new Date(),
      providerId,
      serviceId
    };
    
    setBookingPasses(updatedPasses);
    
    // Earn OKoins for completing booking
    await earnOkoins(25, 'Reserva completada');
    
    await saveWalletData();
  };

  const earnOkoins = async (amount: number, reason: string) => {
    if (!user) return;
    
    const transaction: Transaction = {
      id: Date.now().toString(),
      type: 'okoins_earned',
      amount,
      currency: 'OKOINS',
      description: reason,
      date: new Date(),
      status: 'approved'
    };
    
    setOkoins(prev => prev + amount);
    setTransactions(prev => [transaction, ...prev]);
    await saveWalletData();
  };

  const spendOkoins = async (amount: number, reason: string) => {
    if (!user) throw new Error('Usuario no autenticado');
    if (okoins < amount) {
      throw new Error('OKoins insuficientes');
    }
    
    const transaction: Transaction = {
      id: Date.now().toString(),
      type: 'okoins_spent',
      amount,
      currency: 'OKOINS',
      description: reason,
      date: new Date(),
      status: 'approved'
    };
    
    setOkoins(prev => prev - amount);
    setTransactions(prev => [transaction, ...prev]);
    await saveWalletData();
  };

  const getTransactionHistory = () => {
    return transactions.sort((a, b) => b.date.getTime() - a.date.getTime());
  };

  const refreshWallet = async () => {
    await loadWalletData();
  };

  const value = useMemo(() => ({
    walletBalance,
    okoins,
    transactions,
    bookingPasses,
    loading,
    addFunds,
    purchaseBookingPass,
    useBookingPass,
    earnOkoins,
    spendOkoins,
    getTransactionHistory,
    refreshWallet
  }), [walletBalance, okoins, transactions, bookingPasses, loading]);

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}

export type { Transaction, BookingPass };