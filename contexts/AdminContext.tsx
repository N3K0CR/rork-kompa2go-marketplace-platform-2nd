import { useState, useEffect, useCallback, useMemo } from 'react';
import createContextHook from '@nkzw/create-context-hook';
import { trpc } from '@/lib/trpc';
import { useFirebaseAuth } from './FirebaseAuthContext';
import type {
  AdminMetrics,
  RechargeApprovalStats,
  DistributionStats,
  AdminActivity
} from '@/src/shared/types';
import type {
  KommuteWalletTransaction,
  RechargeApprovalRequest,
  KommutePaymentDistribution
} from '@/Users/adrianromero/Kompa2Go/src/shared/types/kommute-wallet-types';

type AdminContextType = {
  metrics: AdminMetrics | null;
  rechargeStats: RechargeApprovalStats | null;
  distributionStats: DistributionStats | null;
  pendingRecharges: RechargeApprovalRequest[];
  pendingDistributions: KommutePaymentDistribution[];
  allTransactions: KommuteWalletTransaction[];
  isLoading: boolean;
  error: string | null;
  refreshMetrics: () => Promise<void>;
  refreshRecharges: () => Promise<void>;
  refreshDistributions: () => Promise<void>;
  refreshTransactions: () => Promise<void>;
  approveRecharge: (rechargeId: string, notes?: string) => Promise<void>;
  rejectRecharge: (rechargeId: string, reason: string) => Promise<void>;
  completeDistribution: (distributionId: string, sinpeReference: string) => Promise<void>;
  failDistribution: (distributionId: string, reason: string) => Promise<void>;
};

export const [AdminContext, useAdmin] = createContextHook<AdminContextType>(() => {
  const { firebaseUser } = useFirebaseAuth();
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [rechargeStats, setRechargeStats] = useState<RechargeApprovalStats | null>(null);
  const [distributionStats, setDistributionStats] = useState<DistributionStats | null>(null);
  const [pendingRecharges, setPendingRecharges] = useState<RechargeApprovalRequest[]>([]);
  const [pendingDistributions, setPendingDistributions] = useState<KommutePaymentDistribution[]>([]);
  const [allTransactions, setAllTransactions] = useState<KommuteWalletTransaction[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const getPendingRechargesQuery = trpc.kommuteWallet.getPendingRecharges.useQuery(
    undefined,
    { enabled: !!firebaseUser?.uid }
  );

  const getPendingDistributionsQuery = trpc.kommuteWallet.getPendingDistributions.useQuery(
    undefined,
    { enabled: !!firebaseUser?.uid }
  );

  const getAllTransactionsQuery = trpc.kommuteWallet.getAllTransactions.useQuery(
    { limit: 1000 },
    { enabled: !!firebaseUser?.uid }
  );

  const approveRechargeMutation = trpc.kommuteWallet.approveRecharge.useMutation();
  const rejectRechargeMutation = trpc.kommuteWallet.rejectRecharge.useMutation();
  const completeDistributionMutation = trpc.kommuteWallet.markDistributionCompleted.useMutation();
  const failDistributionMutation = trpc.kommuteWallet.markDistributionFailed.useMutation();

  const refreshMetrics = useCallback(async () => {
    if (!firebaseUser?.uid) {
      console.log('[Admin] No user, skipping metrics refresh');
      return;
    }

    try {
      setError(null);
      console.log('[Admin] Refreshing metrics');

      const mockMetrics: AdminMetrics = {
        totalUsers: 150,
        totalKommuters: 45,
        totalProviders: 30,
        activeTrips: 12,
        completedTripsToday: 87,
        pendingRecharges: pendingRecharges.length,
        pendingDistributions: pendingDistributions.length,
        totalRevenueToday: 450000,
        totalRevenue30Days: 12500000,
        averageTripPrice: 3500,
        topKommuters: [
          { id: '1', name: 'Juan Pérez', tripsCompleted: 234, earnings: 820000 },
          { id: '2', name: 'María González', tripsCompleted: 198, earnings: 693000 },
          { id: '3', name: 'Carlos Rodríguez', tripsCompleted: 176, earnings: 616000 }
        ],
        recentActivity: []
      };

      setMetrics(mockMetrics);
      console.log('[Admin] Metrics refreshed');
    } catch (err) {
      console.error('[Admin] Error refreshing metrics:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar métricas');
    }
  }, [firebaseUser?.uid, pendingRecharges.length, pendingDistributions.length]);

  const refreshRecharges = useCallback(async () => {
    if (!firebaseUser?.uid) {
      console.log('[Admin] No user, skipping recharges refresh');
      return;
    }

    try {
      setError(null);
      console.log('[Admin] Refreshing recharges');
      await getPendingRechargesQuery.refetch();
    } catch (err) {
      console.error('[Admin] Error refreshing recharges:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar recargas');
    }
  }, [firebaseUser?.uid, getPendingRechargesQuery]);

  const refreshDistributions = useCallback(async () => {
    if (!firebaseUser?.uid) {
      console.log('[Admin] No user, skipping distributions refresh');
      return;
    }

    try {
      setError(null);
      console.log('[Admin] Refreshing distributions');
      await getPendingDistributionsQuery.refetch();
    } catch (err) {
      console.error('[Admin] Error refreshing distributions:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar distribuciones');
    }
  }, [firebaseUser?.uid, getPendingDistributionsQuery]);

  const refreshTransactions = useCallback(async () => {
    if (!firebaseUser?.uid) {
      console.log('[Admin] No user, skipping transactions refresh');
      return;
    }

    try {
      setError(null);
      console.log('[Admin] Refreshing transactions');
      await getAllTransactionsQuery.refetch();
    } catch (err) {
      console.error('[Admin] Error refreshing transactions:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar transacciones');
    }
  }, [firebaseUser?.uid, getAllTransactionsQuery]);

  const approveRecharge = useCallback(async (rechargeId: string, notes?: string) => {
    if (!firebaseUser?.uid) {
      throw new Error('Usuario no autenticado');
    }

    try {
      setError(null);
      console.log('[Admin] Approving recharge:', rechargeId);
      
      await approveRechargeMutation.mutateAsync({ rechargeId, notes });
      
      console.log('[Admin] Recharge approved successfully');
      await refreshRecharges();
      await refreshMetrics();
    } catch (err) {
      console.error('[Admin] Error approving recharge:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error al aprobar recarga';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [firebaseUser?.uid, approveRechargeMutation, refreshRecharges, refreshMetrics]);

  const rejectRecharge = useCallback(async (rechargeId: string, reason: string) => {
    if (!firebaseUser?.uid) {
      throw new Error('Usuario no autenticado');
    }

    try {
      setError(null);
      console.log('[Admin] Rejecting recharge:', rechargeId);
      
      await rejectRechargeMutation.mutateAsync({ rechargeId, rejectionReason: reason });
      
      console.log('[Admin] Recharge rejected successfully');
      await refreshRecharges();
      await refreshMetrics();
    } catch (err) {
      console.error('[Admin] Error rejecting recharge:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error al rechazar recarga';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [firebaseUser?.uid, rejectRechargeMutation, refreshRecharges, refreshMetrics]);

  const completeDistribution = useCallback(async (distributionId: string, sinpeReference: string) => {
    if (!firebaseUser?.uid) {
      throw new Error('Usuario no autenticado');
    }

    try {
      setError(null);
      console.log('[Admin] Completing distribution:', distributionId);
      
      await completeDistributionMutation.mutateAsync({ distributionId, sinpeReference });
      
      console.log('[Admin] Distribution completed successfully');
      await refreshDistributions();
      await refreshMetrics();
    } catch (err) {
      console.error('[Admin] Error completing distribution:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error al completar distribución';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [firebaseUser?.uid, completeDistributionMutation, refreshDistributions, refreshMetrics]);

  const failDistribution = useCallback(async (distributionId: string, reason: string) => {
    if (!firebaseUser?.uid) {
      throw new Error('Usuario no autenticado');
    }

    try {
      setError(null);
      console.log('[Admin] Failing distribution:', distributionId);
      
      await failDistributionMutation.mutateAsync({ distributionId, failureReason: reason });
      
      console.log('[Admin] Distribution failed successfully');
      await refreshDistributions();
      await refreshMetrics();
    } catch (err) {
      console.error('[Admin] Error failing distribution:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error al marcar distribución como fallida';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [firebaseUser?.uid, failDistributionMutation, refreshDistributions, refreshMetrics]);

  useEffect(() => {
    if (getPendingRechargesQuery.data) {
      setPendingRecharges(getPendingRechargesQuery.data);
      
      const totalPending = getPendingRechargesQuery.data.length;
      const totalAmount = getPendingRechargesQuery.data.reduce((sum: number, r: RechargeApprovalRequest) => sum + r.recharge.amount, 0);
      
      setRechargeStats({
        totalPending,
        totalApprovedToday: 0,
        totalRejectedToday: 0,
        averageApprovalTime: 0,
        totalAmountPending: totalAmount
      });
    }
  }, [getPendingRechargesQuery.data]);

  useEffect(() => {
    if (getPendingDistributionsQuery.data) {
      setPendingDistributions(getPendingDistributionsQuery.data);
      
      const totalPending = getPendingDistributionsQuery.data.length;
      const totalAmount = getPendingDistributionsQuery.data.reduce((sum: number, d: KommutePaymentDistribution) => sum + d.amount, 0);
      
      setDistributionStats({
        totalPending,
        totalScheduledToday: 0,
        totalCompletedToday: 0,
        totalFailedToday: 0,
        totalAmountPending: totalAmount,
        totalAmountDistributedToday: 0
      });
    }
  }, [getPendingDistributionsQuery.data]);

  useEffect(() => {
    if (getAllTransactionsQuery.data) {
      setAllTransactions(getAllTransactionsQuery.data);
    }
  }, [getAllTransactionsQuery.data]);

  useEffect(() => {
    const loadAdminData = async () => {
      if (!firebaseUser?.uid) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        await refreshMetrics();
      } catch (err) {
        console.error('[Admin] Error loading admin data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadAdminData();
  }, [firebaseUser?.uid, refreshMetrics]);

  return useMemo(() => ({
    metrics,
    rechargeStats,
    distributionStats,
    pendingRecharges,
    pendingDistributions,
    allTransactions,
    isLoading,
    error,
    refreshMetrics,
    refreshRecharges,
    refreshDistributions,
    refreshTransactions,
    approveRecharge,
    rejectRecharge,
    completeDistribution,
    failDistribution
  }), [
    metrics,
    rechargeStats,
    distributionStats,
    pendingRecharges,
    pendingDistributions,
    allTransactions,
    isLoading,
    error,
    refreshMetrics,
    refreshRecharges,
    refreshDistributions,
    refreshTransactions,
    approveRecharge,
    rejectRecharge,
    completeDistribution,
    failDistribution
  ]);
});
