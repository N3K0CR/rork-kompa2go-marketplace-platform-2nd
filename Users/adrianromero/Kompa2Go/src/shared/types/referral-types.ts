export interface ReferralData {
  id: string;
  referrerId: string;
  referredId: string;
  referralCode: string;
  status: 'pending' | 'active' | 'completed' | 'rejected';
  referredTripsCompleted: number;
  referrerRewardPaid: boolean;
  referredRewardPaid: boolean;
  createdAt: Date;
  updatedAt: Date;
  metadata: {
    referrerDeviceId?: string;
    referredDeviceId?: string;
    referrerIpAddress?: string;
    referredIpAddress?: string;
    referredSignupDate: Date;
    firstTripDate?: Date;
    twentyTripsCompletedDate?: Date;
    twentyFiveTripsCompletedDate?: Date;
  };
}

export interface ReferralReward {
  id: string;
  userId: string;
  referralId: string;
  amount: number;
  currency: 'CRC';
  type: 'referrer' | 'referred';
  status: 'pending' | 'processing' | 'paid' | 'failed';
  paidAt?: Date;
  createdAt: Date;
}

export interface ReferralStats {
  totalReferrals: number;
  activeReferrals: number;
  completedReferrals: number;
  totalEarnings: number;
  pendingEarnings: number;
  referrals: ReferralData[];
}

export interface ReferralValidation {
  isValid: boolean;
  reason?: string;
  fraudScore: number;
  checks: {
    uniqueDevice: boolean;
    uniqueIp: boolean;
    validTrips: boolean;
    accountAge: boolean;
    suspiciousActivity: boolean;
  };
}

export interface TripValidation {
  tripId: string;
  isValid: boolean;
  isCancelled: boolean;
  isFraudulent: boolean;
  completedAt: Date;
  validatedAt: Date;
}
