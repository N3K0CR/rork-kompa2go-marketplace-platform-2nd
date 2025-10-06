export type KommuteWalletBalance = {
  userId: string;
  balance: number;
  currency: 'CRC';
  lastUpdated: Date;
  createdAt: Date;
};

export type KommuteWalletRechargeAmount = 5000 | 7000 | 10000 | 20000;

export type KommuteWalletRecharge = {
  id: string;
  userId: string;
  amount: number;
  receiptUrl: string;
  receiptFileName: string;
  status: 'pending' | 'approved' | 'rejected';
  sinpeReference?: string;
  notes?: string;
  requestedAt: Date;
  reviewedAt?: Date;
  reviewedBy?: string;
  rejectionReason?: string;
};

export type KommuteWalletTransaction = {
  id: string;
  userId: string;
  type: 'recharge' | 'trip_payment' | 'trip_hold' | 'trip_release' | 'refund';
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  tripId?: string;
  rechargeId?: string;
  description: string;
  createdAt: Date;
  metadata?: Record<string, any>;
};

export type KommutePaymentDistribution = {
  id: string;
  kommuterId: string;
  tripId: string;
  amount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  scheduledFor: Date;
  processedAt?: Date;
  sinpeReference?: string;
  failureReason?: string;
  createdAt: Date;
};

export type KommuteWalletStats = {
  totalBalance: number;
  pendingRecharges: number;
  totalTransactions: number;
  lastRecharge?: Date;
  noValidationTripsRemaining: number;
  totalTripsCompleted: number;
  bonusTripsAvailable: number;
};

export type RechargeApprovalRequest = {
  recharge: KommuteWalletRecharge;
  userInfo: {
    name: string;
    email: string;
    phone?: string;
  };
};
