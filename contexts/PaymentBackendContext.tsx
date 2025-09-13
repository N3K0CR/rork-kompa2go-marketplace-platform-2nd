import { useState, useEffect, useCallback } from 'react';
import createContextHook from '@nkzw/create-context-hook';
import { useAuth } from './AuthContext';
import { trpc } from '@/lib/trpc';

interface PaymentTransaction {
  id: string;
  userId: string;
  amount: number;
  currency: string;
  paymentMethod: 'sinpe' | 'kash' | 'card' | 'bank_transfer' | 'paypal' | 'stripe';
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'refunded' | 'disputed';
  countryCode: string;
  description: string;
  reference?: string;
  externalId?: string;
  metadata?: Record<string, any>;
  proofImage?: string;
  verificationStatus: 'pending' | 'verified' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  processingFee: number;
  taxAmount: number;
  totalAmount: number;
  planId?: string;
  bookingId?: string;
  adminNotes?: string;
  processedBy?: string;
}

interface CountryConfig {
  code: string;
  name: string;
  currency: string;
  symbol: string;
  supportedMethods: string[];
  taxRate: number;
  processingFees: Record<string, number>;
  regulations: {
    requiresKYC: boolean;
    maxTransactionAmount?: number;
    requiresTaxId: boolean;
  };
}

interface CreatePaymentRequest {
  amount: number;
  paymentMethod: 'sinpe' | 'kash' | 'card' | 'bank_transfer' | 'paypal' | 'stripe';
  description: string;
  planId?: string;
  bookingId?: string;
  proofImage?: string;
  metadata?: Record<string, any>;
  countryCode?: string;
}

export const [PaymentBackendProvider, usePaymentBackend] = createContextHook(() => {
  const { user } = useAuth();
  const [selectedCountry, setSelectedCountry] = useState<string>('CR');
  const [supportedCountries, setSupportedCountries] = useState<CountryConfig[]>([]);
  const [currentCountryConfig, setCurrentCountryConfig] = useState<CountryConfig | null>(null);

  // Queries
  const countriesQuery = trpc.payments.getSupportedCountries.useQuery();
  const countryConfigQuery = trpc.payments.getCountryConfig.useQuery(
    { countryCode: selectedCountry },
    { enabled: !!selectedCountry }
  );
  const userPaymentsQuery = trpc.payments.getUserPayments.useQuery(
    { limit: 50 },
    { enabled: !!user }
  );
  const paymentStatsQuery = trpc.payments.getStats.useQuery(
    { countryCode: selectedCountry },
    { enabled: user?.userType === 'admin' }
  );

  // Mutations
  const createPaymentMutation = trpc.payments.create.useMutation({
    onSuccess: () => {
      userPaymentsQuery.refetch();
      if (user?.userType === 'admin') {
        paymentStatsQuery.refetch();
      }
    },
  });

  const updatePaymentStatusMutation = trpc.payments.updateStatus.useMutation({
    onSuccess: () => {
      userPaymentsQuery.refetch();
      if (user?.userType === 'admin') {
        paymentStatsQuery.refetch();
      }
    },
  });

  const refundPaymentMutation = trpc.payments.refund.useMutation({
    onSuccess: () => {
      userPaymentsQuery.refetch();
      if (user?.userType === 'admin') {
        paymentStatsQuery.refetch();
      }
    },
  });

  // Update supported countries when query succeeds
  useEffect(() => {
    if (countriesQuery.data) {
      setSupportedCountries(countriesQuery.data);
    }
  }, [countriesQuery.data]);

  // Update current country config when query succeeds
  useEffect(() => {
    if (countryConfigQuery.data) {
      setCurrentCountryConfig(countryConfigQuery.data);
    }
  }, [countryConfigQuery.data]);

  // Create a new payment
  const createPayment = useCallback(async (request: CreatePaymentRequest) => {
    if (!request || typeof request !== 'object') {
      throw new Error('Invalid payment request');
    }
    if (!request.description?.trim() || request.description.length > 500) {
      throw new Error('Invalid description');
    }
    if (!request.paymentMethod?.trim()) {
      throw new Error('Invalid payment method');
    }
    
    console.log('🔄 Creating payment via backend:', request);
    
    try {
      const result = await createPaymentMutation.mutateAsync({
        ...request,
        countryCode: request.countryCode || selectedCountry,
      });
      
      console.log('✅ Payment created successfully:', result.payment.id);
      return result.payment;
    } catch (error) {
      console.error('❌ Payment creation failed:', error);
      throw error;
    }
  }, [createPaymentMutation, selectedCountry]);

  // Update payment status (admin only)
  const updatePaymentStatus = useCallback(async (
    paymentId: string, 
    status: PaymentTransaction['status'],
    adminNotes?: string
  ) => {
    if (user?.userType !== 'admin') {
      throw new Error('Admin access required');
    }

    console.log('🔄 Updating payment status:', { paymentId, status });
    
    try {
      const result = await updatePaymentStatusMutation.mutateAsync({
        paymentId,
        status,
        adminNotes,
      });
      
      console.log('✅ Payment status updated:', result.payment.id);
      return result.payment;
    } catch (error) {
      console.error('❌ Payment status update failed:', error);
      throw error;
    }
  }, [updatePaymentStatusMutation, user]);

  // Refund payment (admin only)
  const refundPayment = useCallback(async (paymentId: string, reason?: string) => {
    if (user?.userType !== 'admin') {
      throw new Error('Admin access required');
    }

    console.log('💰 Processing refund:', { paymentId, reason });
    
    try {
      const result = await refundPaymentMutation.mutateAsync({
        paymentId,
        reason,
      });
      
      console.log('✅ Payment refunded:', result.payment.id);
      return result.payment;
    } catch (error) {
      console.error('❌ Refund failed:', error);
      throw error;
    }
  }, [refundPaymentMutation, user]);

  // Calculate fees for a payment
  const calculateFees = useCallback((amount: number, paymentMethod: string) => {
    if (!currentCountryConfig) {
      return { processingFee: 0, taxAmount: 0, totalAmount: amount };
    }

    const feeRate = currentCountryConfig.processingFees[paymentMethod] || 0;
    const processingFee = typeof feeRate === 'number' && feeRate < 1 
      ? amount * feeRate  // Percentage fee
      : feeRate;          // Fixed fee

    const taxAmount = amount * currentCountryConfig.taxRate;
    const totalAmount = amount + processingFee + taxAmount;

    return {
      processingFee: Math.round(processingFee * 100) / 100,
      taxAmount: Math.round(taxAmount * 100) / 100,
      totalAmount: Math.round(totalAmount * 100) / 100,
    };
  }, [currentCountryConfig]);

  // Check if payment method is supported
  const isPaymentMethodSupported = useCallback((method: string) => {
    if (!method?.trim() || method.length > 50) {
      return false;
    }
    return currentCountryConfig?.supportedMethods.includes(method) || false;
  }, [currentCountryConfig]);

  // Get user payments
  const getUserPayments = useCallback(() => {
    return userPaymentsQuery.data || [];
  }, [userPaymentsQuery.data]);

  // Get payment statistics (admin only)
  const getPaymentStats = useCallback(() => {
    if (user?.userType !== 'admin') {
      return null;
    }
    return paymentStatsQuery.data || null;
  }, [paymentStatsQuery.data, user]);

  // Format currency amount
  const formatAmount = useCallback((amount: number) => {
    if (!currentCountryConfig) return amount.toString();
    
    return `${currentCountryConfig.symbol}${amount.toLocaleString()}`;
  }, [currentCountryConfig]);

  return {
    // State
    selectedCountry,
    setSelectedCountry,
    supportedCountries,
    currentCountryConfig,
    
    // Loading states
    isLoadingCountries: countriesQuery.isLoading,
    isLoadingConfig: countryConfigQuery.isLoading,
    isLoadingPayments: userPaymentsQuery.isLoading,
    isCreatingPayment: createPaymentMutation.isPending,
    isUpdatingPayment: updatePaymentStatusMutation.isPending,
    isRefunding: refundPaymentMutation.isPending,
    
    // Actions
    createPayment,
    updatePaymentStatus,
    refundPayment,
    
    // Utilities
    calculateFees,
    isPaymentMethodSupported,
    formatAmount,
    
    // Data
    getUserPayments,
    getPaymentStats,
    
    // Refresh functions
    refreshPayments: userPaymentsQuery.refetch,
    refreshStats: paymentStatsQuery.refetch,
  };
});

export type { PaymentTransaction, CountryConfig, CreatePaymentRequest };