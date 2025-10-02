import { collection, doc, setDoc, getDoc, getDocs, query, where, orderBy, limit, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { ReferralData, ReferralReward, ReferralStats, ReferralValidation, TripValidation } from '../../../../src/shared/types/referral-types';

const REFERRER_REWARD_AMOUNT = 20000;
const REFERRED_REWARD_AMOUNT = 10000;
const REFERRER_TRIPS_REQUIRED = 20;
const REFERRED_TRIPS_REQUIRED = 25;
const FRAUD_SCORE_THRESHOLD = 0.7;

export class ReferralService {
  static async generateReferralCode(userId: string): Promise<string> {
    const code = `REF${userId.substring(0, 6).toUpperCase()}${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    return code;
  }

  static async createReferral(
    referrerId: string,
    referredId: string,
    referralCode: string,
    metadata: {
      referredDeviceId?: string;
      referredIpAddress?: string;
    }
  ): Promise<ReferralData> {
    const referrerDoc = await getDoc(doc(db, 'users', referrerId));

    if (!referrerDoc.exists()) {
      throw new Error('Referrer not found');
    }

    const validation = await this.validateReferral(referrerId, referredId, metadata);
    
    if (!validation.isValid) {
      throw new Error(`Referral validation failed: ${validation.reason}`);
    }

    const referralId = `${referrerId}_${referredId}_${Date.now()}`;
    const referralData: ReferralData = {
      id: referralId,
      referrerId,
      referredId,
      referralCode,
      status: 'pending',
      referredTripsCompleted: 0,
      referrerRewardPaid: false,
      referredRewardPaid: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      metadata: {
        ...metadata,
        referredSignupDate: new Date(),
      },
    };

    await setDoc(doc(db, 'referrals', referralId), referralData);

    await this.logAuditEvent('referral_created', {
      referralId,
      referrerId,
      referredId,
      fraudScore: validation.fraudScore,
    });

    return referralData;
  }

  static async validateReferral(
    referrerId: string,
    referredId: string,
    metadata: {
      referredDeviceId?: string;
      referredIpAddress?: string;
    }
  ): Promise<ReferralValidation> {
    const checks = {
      uniqueDevice: true,
      uniqueIp: true,
      validTrips: true,
      accountAge: true,
      suspiciousActivity: false,
    };

    let fraudScore = 0;

    if (referrerId === referredId) {
      return {
        isValid: false,
        reason: 'Cannot refer yourself',
        fraudScore: 1,
        checks: { ...checks, suspiciousActivity: true },
      };
    }

    if (metadata.referredDeviceId) {
      const q = query(
        collection(db, 'referrals'),
        where('metadata.referredDeviceId', '==', metadata.referredDeviceId),
        limit(1)
      );
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        checks.uniqueDevice = false;
        fraudScore += 0.4;
      }
    }

    if (metadata.referredIpAddress) {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const q = query(
        collection(db, 'referrals'),
        where('metadata.referredIpAddress', '==', metadata.referredIpAddress),
        where('createdAt', '>', Timestamp.fromDate(sevenDaysAgo))
      );
      const snapshot = await getDocs(q);

      if (snapshot.size > 3) {
        checks.uniqueIp = false;
        fraudScore += 0.3;
      }
    }

    const q = query(
      collection(db, 'referrals'),
      where('referrerId', '==', referrerId)
    );
    const snapshot = await getDocs(q);
    const referrerReferrals = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    const recentReferrals = referrerReferrals.filter(
      (r: any) => new Date(r.createdAt.toDate()).getTime() > Date.now() - 24 * 60 * 60 * 1000
    );

    if (recentReferrals.length > 5) {
      checks.suspiciousActivity = true;
      fraudScore += 0.3;
    }

    const isValid = fraudScore < FRAUD_SCORE_THRESHOLD;

    return {
      isValid,
      reason: isValid ? undefined : 'Suspicious activity detected',
      fraudScore,
      checks,
    };
  }

  static async validateTrip(tripId: string): Promise<TripValidation> {
    const tripDoc = await getDoc(doc(db, 'trips', tripId));

    if (!tripDoc.exists()) {
      throw new Error('Trip not found');
    }

    const trip = tripDoc.data();

    const isValid = 
      trip.status === 'completed' &&
      !trip.isCancelled &&
      trip.completedAt !== null;

    const isFraudulent = await this.detectFraudulentTrip(tripId);

    return {
      tripId,
      isValid: isValid && !isFraudulent,
      isCancelled: trip.isCancelled || false,
      isFraudulent,
      completedAt: trip.completedAt || new Date(),
      validatedAt: new Date(),
    };
  }

  static async detectFraudulentTrip(tripId: string): Promise<boolean> {
    const tripDoc = await getDoc(doc(db, 'trips', tripId));

    if (!tripDoc.exists()) return true;

    const trip = tripDoc.data();

    if (trip.distance && trip.distance < 0.5) {
      return true;
    }

    if (trip.duration && trip.duration < 300) {
      return true;
    }

    if (trip.fare && trip.fare < 1000) {
      return true;
    }

    return false;
  }

  static async updateReferralProgress(referredId: string, tripId: string): Promise<void> {
    const q = query(
      collection(db, 'referrals'),
      where('referredId', '==', referredId),
      limit(1)
    );
    const snapshot = await getDocs(q);

    if (snapshot.empty) return;

    const referralDoc = snapshot.docs[0];
    const referral = { id: referralDoc.id, ...referralDoc.data() } as ReferralData;

    const tripValidation = await this.validateTrip(tripId);

    if (!tripValidation.isValid) {
      await this.logAuditEvent('invalid_trip_detected', {
        referralId: referral.id,
        tripId,
        reason: tripValidation.isFraudulent ? 'fraudulent' : 'cancelled',
      });
      return;
    }

    const newTripsCount = referral.referredTripsCompleted + 1;

    await updateDoc(doc(db, 'referrals', referral.id), {
      referredTripsCompleted: newTripsCount,
      updatedAt: Timestamp.now(),
    });

    if (newTripsCount === REFERRER_TRIPS_REQUIRED && !referral.referrerRewardPaid) {
      await this.processReferrerReward(referral.id);
    }

    if (newTripsCount === REFERRED_TRIPS_REQUIRED && !referral.referredRewardPaid) {
      await this.processReferredReward(referral.id);
    }

    await this.logAuditEvent('referral_progress_updated', {
      referralId: referral.id,
      tripsCompleted: newTripsCount,
      tripId,
    });
  }

  static async processReferrerReward(referralId: string): Promise<void> {
    const referralDoc = await getDoc(doc(db, 'referrals', referralId));

    if (!referralDoc.exists()) return;

    const referral = { id: referralDoc.id, ...referralDoc.data() } as ReferralData;

    if (referral.referrerRewardPaid) return;

    const rewardId = `reward_${referral.id}_referrer`;
    const rewardData: ReferralReward = {
      id: rewardId,
      userId: referral.referrerId,
      referralId: referral.id,
      amount: REFERRER_REWARD_AMOUNT,
      currency: 'CRC',
      type: 'referrer',
      status: 'pending',
      createdAt: new Date(),
    };

    await setDoc(doc(db, 'referralRewards', rewardId), rewardData);

    await updateDoc(doc(db, 'referrals', referralId), {
      referrerRewardPaid: true,
      'metadata.twentyTripsCompletedDate': Timestamp.now(),
      updatedAt: Timestamp.now(),
    });

    await this.logAuditEvent('referrer_reward_created', {
      referralId,
      userId: referral.referrerId,
      amount: REFERRER_REWARD_AMOUNT,
    });
  }

  static async processReferredReward(referralId: string): Promise<void> {
    const referralDoc = await getDoc(doc(db, 'referrals', referralId));

    if (!referralDoc.exists()) return;

    const referral = { id: referralDoc.id, ...referralDoc.data() } as ReferralData;

    if (referral.referredRewardPaid) return;

    const rewardId = `reward_${referral.id}_referred`;
    const rewardData: ReferralReward = {
      id: rewardId,
      userId: referral.referredId,
      referralId: referral.id,
      amount: REFERRED_REWARD_AMOUNT,
      currency: 'CRC',
      type: 'referred',
      status: 'pending',
      createdAt: new Date(),
    };

    await setDoc(doc(db, 'referralRewards', rewardId), rewardData);

    await updateDoc(doc(db, 'referrals', referralId), {
      referredRewardPaid: true,
      status: 'completed',
      'metadata.twentyFiveTripsCompletedDate': Timestamp.now(),
      updatedAt: Timestamp.now(),
    });

    await this.logAuditEvent('referred_reward_created', {
      referralId,
      userId: referral.referredId,
      amount: REFERRED_REWARD_AMOUNT,
    });
  }

  static async getReferralStats(userId: string): Promise<ReferralStats> {
    const referralsQuery = query(
      collection(db, 'referrals'),
      where('referrerId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    const referralsSnapshot = await getDocs(referralsQuery);
    const userReferrals = referralsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as ReferralData[];

    const rewardsQuery = query(
      collection(db, 'referralRewards'),
      where('userId', '==', userId)
    );
    const rewardsSnapshot = await getDocs(rewardsQuery);
    const rewards = rewardsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as ReferralReward[];

    const totalEarnings = rewards
      .filter((r) => r.status === 'paid')
      .reduce((sum, r) => sum + r.amount, 0);

    const pendingEarnings = rewards
      .filter((r) => r.status === 'pending' || r.status === 'processing')
      .reduce((sum, r) => sum + r.amount, 0);

    return {
      totalReferrals: userReferrals.length,
      activeReferrals: userReferrals.filter((r) => r.status === 'active').length,
      completedReferrals: userReferrals.filter((r) => r.status === 'completed').length,
      totalEarnings,
      pendingEarnings,
      referrals: userReferrals,
    };
  }

  static async logAuditEvent(eventType: string, data: any): Promise<void> {
    console.log(`[REFERRAL AUDIT] ${eventType}:`, JSON.stringify(data, null, 2));
  }
}
