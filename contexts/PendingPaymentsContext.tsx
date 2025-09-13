import { useState, useEffect, useCallback, useMemo } from 'react';
import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './AuthContext';

interface PendingPayment {
  id: string;
  userId?: string;
  userName?: string;
  userEmail?: string;
  amount: number;
  paymentMethod: 'sinpe' | 'kash';
  proofImage: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  type: 'booking_pass' | 'reservation_plan';
  planId?: string;
  planName?: string;
}

export const [PendingPaymentsProvider, usePendingPayments] = createContextHook(() => {
  const { user } = useAuth();
  const [pendingPayments, setPendingPayments] = useState<PendingPayment[]>([]);
  const [hasNewPayments, setHasNewPayments] = useState(false);
  const [lastCheckedCount, setLastCheckedCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const loadPendingPayments = useCallback(async () => {
    try {
      const storedPayments = await AsyncStorage.getItem('pendingPayments');
      if (storedPayments) {
        const paymentsData = JSON.parse(storedPayments);
        const sortedPayments = paymentsData.sort((a: PendingPayment, b: PendingPayment) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setPendingPayments(sortedPayments);
        
        // Check for new payments
        const currentPendingCount = sortedPayments.filter((p: PendingPayment) => p.status === 'pending').length;
        if (currentPendingCount > lastCheckedCount && lastCheckedCount > 0) {
          setHasNewPayments(true);
          // Play sound alert for admin users
          if (user?.userType === 'admin') {
            console.log('🔔 URGENT PAYMENT ALERT: New payment proof submitted!');
            console.log('📱 Admin notification: Payment requires immediate review');
          }
        }
        setLastCheckedCount(currentPendingCount);
      }
    } catch (error) {
      console.error('Error loading pending payments:', error);
    } finally {
      setLoading(false);
    }
  }, [lastCheckedCount, user]);

  const markAsChecked = useCallback(() => {
    setHasNewPayments(false);
  }, []);

  const getPendingCount = useCallback(() => {
    return pendingPayments.filter(p => p.status === 'pending').length;
  }, [pendingPayments]);

  const getProcessedCount = useCallback(() => {
    return pendingPayments.filter(p => p.status !== 'pending').length;
  }, [pendingPayments]);

  const updatePaymentStatus = useCallback(async (paymentId: string, status: 'approved' | 'rejected') => {
    try {
      const updatedPayments = pendingPayments.map(payment => 
        payment.id === paymentId ? { ...payment, status } : payment
      );
      
      await AsyncStorage.setItem('pendingPayments', JSON.stringify(updatedPayments));
      setPendingPayments(updatedPayments);
      
      return true;
    } catch (error) {
      console.error('Error updating payment status:', error);
      return false;
    }
  }, [pendingPayments]);

  const addPaymentProof = useCallback(async (paymentData: Omit<PendingPayment, 'id' | 'createdAt' | 'status'>) => {
    try {
      const newPayment: PendingPayment = {
        ...paymentData,
        id: Date.now().toString(),
        status: 'pending',
        createdAt: new Date().toISOString()
      };

      const existingPayments = await AsyncStorage.getItem('pendingPayments');
      const payments = existingPayments ? JSON.parse(existingPayments) : [];
      payments.push(newPayment);
      await AsyncStorage.setItem('pendingPayments', JSON.stringify(payments));
      
      // Reload payments to trigger notifications
      await loadPendingPayments();
      
      return newPayment.id;
    } catch (error) {
      console.error('Error adding payment proof:', error);
      throw error;
    }
  }, [loadPendingPayments]);

  // Auto-refresh for admin users
  useEffect(() => {
    if (user?.userType === 'admin') {
      loadPendingPayments();
      
      const interval = setInterval(() => {
        loadPendingPayments();
      }, 30000); // Increased to 30 seconds to reduce load and prevent loops
      
      return () => clearInterval(interval);
    } else {
      loadPendingPayments();
    }
  }, [user]); // Remove loadPendingPayments from dependencies to prevent infinite loop

  return useMemo(() => ({
    pendingPayments,
    hasNewPayments,
    loading,
    getPendingCount,
    getProcessedCount,
    updatePaymentStatus,
    addPaymentProof,
    markAsChecked,
    refreshPayments: loadPendingPayments
  }), [pendingPayments, hasNewPayments, loading, getPendingCount, getProcessedCount, updatePaymentStatus, addPaymentProof, markAsChecked, loadPendingPayments]);
});

export type { PendingPayment };