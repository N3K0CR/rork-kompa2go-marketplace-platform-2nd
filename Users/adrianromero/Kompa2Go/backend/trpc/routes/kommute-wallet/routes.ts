import { z } from 'zod';
import { protectedProcedure } from '@/backend/trpc/create-context';
import { walletService } from '../../../../src/modules/kommute-wallet/services/firestore-wallet-service';

export const getBalance = protectedProcedure
  .query(async ({ ctx }) => {
    const userId = ctx.user?.id;
    if (!userId) {
      throw new Error('User not authenticated');
    }

    console.log('[tRPC] Getting balance for user:', userId);
    
    let balance = await walletService.getBalance(userId);
    
    if (!balance) {
      console.log('[tRPC] No balance found, initializing...');
      balance = await walletService.initializeBalance(userId);
    }
    
    return balance;
  });

export const getTransactions = protectedProcedure
  .input(z.object({
    limit: z.number().optional().default(50)
  }))
  .query(async ({ ctx, input }) => {
    const userId = ctx.user?.id;
    if (!userId) {
      throw new Error('User not authenticated');
    }

    console.log('[tRPC] Getting transactions for user:', userId);
    return await walletService.getUserTransactions(userId, input.limit);
  });

export const getStats = protectedProcedure
  .query(async ({ ctx }) => {
    const userId = ctx.user?.id;
    if (!userId) {
      throw new Error('User not authenticated');
    }

    console.log('[tRPC] Getting wallet stats for user:', userId);
    return await walletService.getWalletStats(userId);
  });

export const createRecharge = protectedProcedure
  .input(z.object({
    amount: z.number().positive(),
    receiptUrl: z.string().url(),
    receiptFileName: z.string(),
    sinpeReference: z.string().optional()
  }))
  .mutation(async ({ ctx, input }) => {
    const userId = ctx.user?.id;
    if (!userId) {
      throw new Error('User not authenticated');
    }

    console.log('[tRPC] Creating recharge for user:', userId, input);
    
    return await walletService.createRecharge(
      userId,
      input.amount,
      input.receiptUrl,
      input.receiptFileName,
      input.sinpeReference
    );
  });

export const getPendingRecharges = protectedProcedure
  .query(async () => {
    console.log('[tRPC] Getting pending recharges');
    return await walletService.getPendingRecharges();
  });

export const approveRecharge = protectedProcedure
  .input(z.object({
    rechargeId: z.string(),
    notes: z.string().optional()
  }))
  .mutation(async ({ ctx, input }) => {
    const userId = ctx.user?.id;
    if (!userId) {
      throw new Error('User not authenticated');
    }

    console.log('[tRPC] Approving recharge:', input.rechargeId);
    
    await walletService.approveRecharge(
      input.rechargeId,
      userId,
      input.notes
    );
    
    return { success: true };
  });

export const rejectRecharge = protectedProcedure
  .input(z.object({
    rechargeId: z.string(),
    rejectionReason: z.string()
  }))
  .mutation(async ({ ctx, input }) => {
    const userId = ctx.user?.id;
    if (!userId) {
      throw new Error('User not authenticated');
    }

    console.log('[tRPC] Rejecting recharge:', input.rechargeId);
    
    await walletService.rejectRecharge(
      input.rechargeId,
      userId,
      input.rejectionReason
    );
    
    return { success: true };
  });

export const getAllTransactions = protectedProcedure
  .input(z.object({
    limit: z.number().optional().default(1000)
  }))
  .query(async ({ input }) => {
    console.log('[tRPC] Getting all transactions');
    return await walletService.getAllTransactions(input.limit);
  });

export const getPendingDistributions = protectedProcedure
  .query(async () => {
    console.log('[tRPC] Getting pending distributions');
    return await walletService.getPendingDistributions();
  });

export const markDistributionCompleted = protectedProcedure
  .input(z.object({
    distributionId: z.string(),
    sinpeReference: z.string()
  }))
  .mutation(async ({ input }) => {
    console.log('[tRPC] Marking distribution completed:', input.distributionId);
    
    await walletService.markDistributionCompleted(
      input.distributionId,
      input.sinpeReference
    );
    
    return { success: true };
  });

export const markDistributionFailed = protectedProcedure
  .input(z.object({
    distributionId: z.string(),
    failureReason: z.string()
  }))
  .mutation(async ({ input }) => {
    console.log('[tRPC] Marking distribution failed:', input.distributionId);
    
    await walletService.markDistributionFailed(
      input.distributionId,
      input.failureReason
    );
    
    return { success: true };
  });
