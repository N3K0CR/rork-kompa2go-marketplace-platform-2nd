import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  Timestamp,
  runTransaction
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type {
  KommuteWalletBalance,
  KommuteWalletRecharge,
  KommuteWalletTransaction,
  KommutePaymentDistribution,
  KommuteWalletStats,
  RechargeApprovalRequest
} from '@/src/shared/types';

const COLLECTIONS = {
  WALLET_BALANCES: 'kommute_wallet_balances',
  RECHARGES: 'kommute_wallet_recharges',
  TRANSACTIONS: 'kommute_wallet_transactions',
  PAYMENT_DISTRIBUTIONS: 'kommute_payment_distributions',
  USER_PROFILES: 'user_profiles'
} as const;

export class FirestoreWalletService {
  async getBalance(userId: string): Promise<KommuteWalletBalance | null> {
    try {
      const balanceRef = doc(db, COLLECTIONS.WALLET_BALANCES, userId);
      const balanceSnap = await getDoc(balanceRef);
      
      if (!balanceSnap.exists()) {
        return null;
      }
      
      const data = balanceSnap.data();
      return {
        userId,
        balance: data.balance,
        currency: 'CRC',
        lastUpdated: data.lastUpdated?.toDate() || new Date(),
        createdAt: data.createdAt?.toDate() || new Date()
      };
    } catch (error) {
      console.error('[WalletService] Error getting balance:', error);
      throw error;
    }
  }

  async initializeBalance(userId: string): Promise<KommuteWalletBalance> {
    try {
      const balanceRef = doc(db, COLLECTIONS.WALLET_BALANCES, userId);
      const now = Timestamp.now();
      
      const balance: KommuteWalletBalance = {
        userId,
        balance: 0,
        currency: 'CRC',
        lastUpdated: now.toDate(),
        createdAt: now.toDate()
      };
      
      await setDoc(balanceRef, {
        balance: 0,
        currency: 'CRC',
        lastUpdated: now,
        createdAt: now,
        freeTripsUsed: 0
      });
      
      return balance;
    } catch (error) {
      console.error('[WalletService] Error initializing balance:', error);
      throw error;
    }
  }

  async createRecharge(
    userId: string,
    amount: number,
    receiptUrl: string,
    receiptFileName: string,
    sinpeReference?: string
  ): Promise<KommuteWalletRecharge> {
    try {
      const rechargeRef = doc(collection(db, COLLECTIONS.RECHARGES));
      const now = Timestamp.now();
      
      const recharge: KommuteWalletRecharge = {
        id: rechargeRef.id,
        userId,
        amount,
        receiptUrl,
        receiptFileName,
        status: 'pending',
        sinpeReference,
        requestedAt: now.toDate()
      };
      
      await setDoc(rechargeRef, {
        userId,
        amount,
        receiptUrl,
        receiptFileName,
        status: 'pending',
        sinpeReference: sinpeReference || null,
        requestedAt: now
      });
      
      return recharge;
    } catch (error) {
      console.error('[WalletService] Error creating recharge:', error);
      throw error;
    }
  }

  async getPendingRecharges(): Promise<RechargeApprovalRequest[]> {
    try {
      const rechargesQuery = query(
        collection(db, COLLECTIONS.RECHARGES),
        where('status', '==', 'pending'),
        orderBy('requestedAt', 'desc')
      );
      
      const snapshot = await getDocs(rechargesQuery);
      const requests: RechargeApprovalRequest[] = [];
      
      for (const docSnap of snapshot.docs) {
        const data = docSnap.data();
        const userRef = doc(db, COLLECTIONS.USER_PROFILES, data.userId);
        const userSnap = await getDoc(userRef);
        const userData = userSnap.data();
        
        requests.push({
          recharge: {
            id: docSnap.id,
            userId: data.userId,
            amount: data.amount,
            receiptUrl: data.receiptUrl,
            receiptFileName: data.receiptFileName,
            status: data.status,
            sinpeReference: data.sinpeReference,
            notes: data.notes,
            requestedAt: data.requestedAt?.toDate() || new Date(),
            reviewedAt: data.reviewedAt?.toDate(),
            reviewedBy: data.reviewedBy,
            rejectionReason: data.rejectionReason
          },
          userInfo: {
            name: userData?.name || 'Unknown',
            email: userData?.email || '',
            phone: userData?.phone
          }
        });
      }
      
      return requests;
    } catch (error) {
      console.error('[WalletService] Error getting pending recharges:', error);
      throw error;
    }
  }

  async approveRecharge(
    rechargeId: string,
    reviewedBy: string,
    notes?: string
  ): Promise<void> {
    try {
      await runTransaction(db, async (transaction) => {
        const rechargeRef = doc(db, COLLECTIONS.RECHARGES, rechargeId);
        const rechargeSnap = await transaction.get(rechargeRef);
        
        if (!rechargeSnap.exists()) {
          throw new Error('Recharge not found');
        }
        
        const rechargeData = rechargeSnap.data();
        const userId = rechargeData.userId;
        const amount = rechargeData.amount;
        
        const balanceRef = doc(db, COLLECTIONS.WALLET_BALANCES, userId);
        const balanceSnap = await transaction.get(balanceRef);
        
        let currentBalance = 0;
        if (balanceSnap.exists()) {
          currentBalance = balanceSnap.data().balance;
        }
        
        const newBalance = currentBalance + amount;
        const now = Timestamp.now();
        
        transaction.update(rechargeRef, {
          status: 'approved',
          reviewedAt: now,
          reviewedBy,
          notes: notes || null
        });
        
        if (balanceSnap.exists()) {
          transaction.update(balanceRef, {
            balance: newBalance,
            lastUpdated: now
          });
        } else {
          transaction.set(balanceRef, {
            balance: newBalance,
            currency: 'CRC',
            lastUpdated: now,
            createdAt: now,
            freeTripsUsed: 0
          });
        }
        
        const transactionRef = doc(collection(db, COLLECTIONS.TRANSACTIONS));
        transaction.set(transactionRef, {
          userId,
          type: 'recharge',
          amount,
          balanceBefore: currentBalance,
          balanceAfter: newBalance,
          rechargeId,
          description: `Recarga aprobada - ₡${amount.toLocaleString()}`,
          createdAt: now
        });
      });
      
      console.log('[WalletService] Recharge approved successfully:', rechargeId);
    } catch (error) {
      console.error('[WalletService] Error approving recharge:', error);
      throw error;
    }
  }

  async rejectRecharge(
    rechargeId: string,
    reviewedBy: string,
    rejectionReason: string
  ): Promise<void> {
    try {
      const rechargeRef = doc(db, COLLECTIONS.RECHARGES, rechargeId);
      const now = Timestamp.now();
      
      await updateDoc(rechargeRef, {
        status: 'rejected',
        reviewedAt: now,
        reviewedBy,
        rejectionReason
      });
      
      console.log('[WalletService] Recharge rejected:', rechargeId);
    } catch (error) {
      console.error('[WalletService] Error rejecting recharge:', error);
      throw error;
    }
  }

  async getUserTransactions(
    userId: string,
    limitCount: number = 50
  ): Promise<KommuteWalletTransaction[]> {
    try {
      const transactionsQuery = query(
        collection(db, COLLECTIONS.TRANSACTIONS),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );
      
      const snapshot = await getDocs(transactionsQuery);
      
      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          userId: data.userId,
          type: data.type,
          amount: data.amount,
          balanceBefore: data.balanceBefore,
          balanceAfter: data.balanceAfter,
          tripId: data.tripId,
          rechargeId: data.rechargeId,
          description: data.description,
          createdAt: data.createdAt?.toDate() || new Date(),
          metadata: data.metadata
        };
      });
    } catch (error) {
      console.error('[WalletService] Error getting transactions:', error);
      throw error;
    }
  }

  async getAllTransactions(limitCount: number = 1000): Promise<KommuteWalletTransaction[]> {
    try {
      const transactionsQuery = query(
        collection(db, COLLECTIONS.TRANSACTIONS),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );
      
      const snapshot = await getDocs(transactionsQuery);
      
      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          userId: data.userId,
          type: data.type,
          amount: data.amount,
          balanceBefore: data.balanceBefore,
          balanceAfter: data.balanceAfter,
          tripId: data.tripId,
          rechargeId: data.rechargeId,
          description: data.description,
          createdAt: data.createdAt?.toDate() || new Date(),
          metadata: data.metadata
        };
      });
    } catch (error) {
      console.error('[WalletService] Error getting all transactions:', error);
      throw error;
    }
  }

  async getWalletStats(userId: string): Promise<KommuteWalletStats> {
    try {
      const balance = await this.getBalance(userId);
      
      const rechargesQuery = query(
        collection(db, COLLECTIONS.RECHARGES),
        where('userId', '==', userId),
        where('status', '==', 'pending')
      );
      const rechargesSnap = await getDocs(rechargesQuery);
      
      const transactionsQuery = query(
        collection(db, COLLECTIONS.TRANSACTIONS),
        where('userId', '==', userId)
      );
      const transactionsSnap = await getDocs(transactionsQuery);
      
      const lastRechargeQuery = query(
        collection(db, COLLECTIONS.RECHARGES),
        where('userId', '==', userId),
        where('status', '==', 'approved'),
        orderBy('reviewedAt', 'desc'),
        limit(1)
      );
      const lastRechargeSnap = await getDocs(lastRechargeQuery);
      
      const balanceRef = doc(db, COLLECTIONS.WALLET_BALANCES, userId);
      const balanceSnap = await getDoc(balanceRef);
      const freeTripsUsed = balanceSnap.exists() ? (balanceSnap.data().freeTripsUsed || 0) : 0;
      
      return {
        totalBalance: balance?.balance || 0,
        pendingRecharges: rechargesSnap.size,
        totalTransactions: transactionsSnap.size,
        lastRecharge: lastRechargeSnap.empty ? undefined : lastRechargeSnap.docs[0].data().reviewedAt?.toDate(),
        freeTripsRemaining: Math.max(0, 2 - freeTripsUsed)
      };
    } catch (error) {
      console.error('[WalletService] Error getting wallet stats:', error);
      throw error;
    }
  }

  async holdFundsForTrip(
    userId: string,
    tripId: string,
    amount: number
  ): Promise<void> {
    try {
      await runTransaction(db, async (transaction) => {
        const balanceRef = doc(db, COLLECTIONS.WALLET_BALANCES, userId);
        const balanceSnap = await transaction.get(balanceRef);
        
        if (!balanceSnap.exists()) {
          throw new Error('Wallet not found');
        }
        
        const currentBalance = balanceSnap.data().balance;
        const freeTripsUsed = balanceSnap.data().freeTripsUsed || 0;
        
        if (freeTripsUsed < 2) {
          transaction.update(balanceRef, {
            freeTripsUsed: freeTripsUsed + 1,
            lastUpdated: Timestamp.now()
          });
          
          const transactionRef = doc(collection(db, COLLECTIONS.TRANSACTIONS));
          transaction.set(transactionRef, {
            userId,
            type: 'trip_hold',
            amount: 0,
            balanceBefore: currentBalance,
            balanceAfter: currentBalance,
            tripId,
            description: `Viaje gratis (${freeTripsUsed + 1}/2)`,
            createdAt: Timestamp.now(),
            metadata: { freeTrip: true }
          });
          
          return;
        }
        
        if (currentBalance < amount) {
          throw new Error('Insufficient balance');
        }
        
        const newBalance = currentBalance - amount;
        
        transaction.update(balanceRef, {
          balance: newBalance,
          lastUpdated: Timestamp.now()
        });
        
        const transactionRef = doc(collection(db, COLLECTIONS.TRANSACTIONS));
        transaction.set(transactionRef, {
          userId,
          type: 'trip_hold',
          amount,
          balanceBefore: currentBalance,
          balanceAfter: newBalance,
          tripId,
          description: `Fondos retenidos para viaje - ₡${amount.toLocaleString()}`,
          createdAt: Timestamp.now()
        });
      });
    } catch (error) {
      console.error('[WalletService] Error holding funds:', error);
      throw error;
    }
  }

  async schedulePaymentDistribution(
    kommuterId: string,
    tripId: string,
    amount: number
  ): Promise<void> {
    try {
      const now = new Date();
      const cutoffTime = new Date(now);
      cutoffTime.setHours(13, 0, 0, 0);
      
      let scheduledFor = new Date(now);
      if (now > cutoffTime) {
        scheduledFor.setDate(scheduledFor.getDate() + 1);
      }
      scheduledFor.setHours(13, 0, 0, 0);
      
      const distributionRef = doc(collection(db, COLLECTIONS.PAYMENT_DISTRIBUTIONS));
      
      await setDoc(distributionRef, {
        kommuterId,
        tripId,
        amount,
        status: 'pending',
        scheduledFor: Timestamp.fromDate(scheduledFor),
        createdAt: Timestamp.now()
      });
      
      console.log('[WalletService] Payment distribution scheduled:', {
        kommuterId,
        tripId,
        amount,
        scheduledFor
      });
    } catch (error) {
      console.error('[WalletService] Error scheduling payment:', error);
      throw error;
    }
  }

  async getPendingDistributions(): Promise<KommutePaymentDistribution[]> {
    try {
      const now = Timestamp.now();
      
      const distributionsQuery = query(
        collection(db, COLLECTIONS.PAYMENT_DISTRIBUTIONS),
        where('status', '==', 'pending'),
        where('scheduledFor', '<=', now),
        orderBy('scheduledFor', 'asc')
      );
      
      const snapshot = await getDocs(distributionsQuery);
      
      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          kommuterId: data.kommuterId,
          tripId: data.tripId,
          amount: data.amount,
          status: data.status,
          scheduledFor: data.scheduledFor?.toDate() || new Date(),
          processedAt: data.processedAt?.toDate(),
          sinpeReference: data.sinpeReference,
          failureReason: data.failureReason,
          createdAt: data.createdAt?.toDate() || new Date()
        };
      });
    } catch (error) {
      console.error('[WalletService] Error getting pending distributions:', error);
      throw error;
    }
  }

  async markDistributionCompleted(
    distributionId: string,
    sinpeReference: string
  ): Promise<void> {
    try {
      const distributionRef = doc(db, COLLECTIONS.PAYMENT_DISTRIBUTIONS, distributionId);
      
      await updateDoc(distributionRef, {
        status: 'completed',
        processedAt: Timestamp.now(),
        sinpeReference
      });
    } catch (error) {
      console.error('[WalletService] Error marking distribution completed:', error);
      throw error;
    }
  }

  async markDistributionFailed(
    distributionId: string,
    failureReason: string
  ): Promise<void> {
    try {
      const distributionRef = doc(db, COLLECTIONS.PAYMENT_DISTRIBUTIONS, distributionId);
      
      await updateDoc(distributionRef, {
        status: 'failed',
        processedAt: Timestamp.now(),
        failureReason
      });
    } catch (error) {
      console.error('[WalletService] Error marking distribution failed:', error);
      throw error;
    }
  }
}

export const walletService = new FirestoreWalletService();
