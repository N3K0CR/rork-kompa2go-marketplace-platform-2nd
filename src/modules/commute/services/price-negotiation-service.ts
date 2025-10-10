import { db } from '@/lib/firebase';
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  updateDoc,
  serverTimestamp,
  increment,
} from 'firebase/firestore';
import {
  UberPriceComparison,
  UserNegotiationProfile,
  DEFAULT_NEGOTIATION_SETTINGS,
  ScreenshotVerificationRequest,
} from '@/src/shared/types/price-negotiation-types';

export class PriceNegotiationService {
  static async getUserProfile(userId: string): Promise<UserNegotiationProfile | null> {
    try {
      const profileRef = doc(db, 'user_negotiation_profiles', userId);
      const profileSnap = await getDoc(profileRef);

      if (!profileSnap.exists()) {
        return null;
      }

      const data = profileSnap.data();
      return {
        ...data,
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate(),
        blockedAt: data.blockedAt?.toDate(),
      } as UserNegotiationProfile;
    } catch (error) {
      console.error('[PriceNegotiationService] Error getting user profile:', error);
      throw error;
    }
  }

  static async createOrGetUserProfile(userId: string): Promise<UserNegotiationProfile> {
    try {
      let profile = await this.getUserProfile(userId);

      if (!profile) {
        profile = {
          userId,
          totalNegotiations: 0,
          successfulNegotiations: 0,
          fraudAttempts: 0,
          isBlocked: false,
          freeNegotiationsRemaining: DEFAULT_NEGOTIATION_SETTINGS.freeNegotiationsLimit,
          requiresScreenshotAfterTrip: DEFAULT_NEGOTIATION_SETTINGS.screenshotRequiredAfterTrip,
          averageDiscount: 0,
          totalSavings: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        await setDoc(doc(db, 'user_negotiation_profiles', userId), {
          ...profile,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }

      return profile;
    } catch (error) {
      console.error('[PriceNegotiationService] Error creating user profile:', error);
      throw error;
    }
  }

  static async createNegotiation(params: {
    userId: string;
    tripId?: string;
    origin: { latitude: number; longitude: number; address: string };
    destination: { latitude: number; longitude: number; address: string };
    distance: number;
    kommuteOriginalPrice: number;
    uberReportedPrice: number;
    screenshotUrl?: string;
  }): Promise<UberPriceComparison> {
    try {
      const profile = await this.createOrGetUserProfile(params.userId);

      if (profile.isBlocked) {
        throw new Error('Tu cuenta está bloqueada para negociaciones de precio');
      }

      const tripNumber = profile.totalNegotiations + 1;
      const requiresScreenshot = tripNumber >= profile.requiresScreenshotAfterTrip;

      if (requiresScreenshot && !params.screenshotUrl) {
        throw new Error('Se requiere captura de pantalla de Uber para este viaje');
      }

      const discountPercentage = Math.random() * 
        (DEFAULT_NEGOTIATION_SETTINGS.maxDiscountPercentage - DEFAULT_NEGOTIATION_SETTINGS.minDiscountPercentage) + 
        DEFAULT_NEGOTIATION_SETTINGS.minDiscountPercentage;

      const kommuteNegotiatedPrice = params.uberReportedPrice * (1 - discountPercentage / 100);

      const negotiationId = `neg_${Date.now()}_${params.userId.substring(0, 8)}`;

      const negotiation: UberPriceComparison = {
        id: negotiationId,
        userId: params.userId,
        tripId: params.tripId,
        origin: params.origin,
        destination: params.destination,
        distance: params.distance,
        kommuteOriginalPrice: params.kommuteOriginalPrice,
        uberReportedPrice: params.uberReportedPrice,
        kommuteNegotiatedPrice,
        discountPercentage,
        tripNumber,
        requiresScreenshot,
        screenshotUrl: params.screenshotUrl,
        screenshotVerified: false,
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await setDoc(doc(db, 'price_negotiations', negotiationId), {
        ...negotiation,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      await updateDoc(doc(db, 'user_negotiation_profiles', params.userId), {
        totalNegotiations: increment(1),
        updatedAt: serverTimestamp(),
      });

      if (requiresScreenshot && params.screenshotUrl) {
        await this.createScreenshotVerification(negotiationId, params.userId, params.screenshotUrl);
      }

      console.log('✅ Negotiation created:', negotiationId);
      return negotiation;
    } catch (error) {
      console.error('[PriceNegotiationService] Error creating negotiation:', error);
      throw error;
    }
  }

  static async createScreenshotVerification(
    negotiationId: string,
    userId: string,
    screenshotUrl: string
  ): Promise<ScreenshotVerificationRequest> {
    try {
      const verificationId = `verify_${Date.now()}_${negotiationId}`;

      const verification: ScreenshotVerificationRequest = {
        id: verificationId,
        negotiationId,
        userId,
        screenshotUrl,
        autoVerificationStatus: 'pending',
        autoVerificationConfidence: 0,
        manualReviewRequired: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await setDoc(doc(db, 'screenshot_verifications', verificationId), {
        ...verification,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      console.log('✅ Screenshot verification created:', verificationId);
      return verification;
    } catch (error) {
      console.error('[PriceNegotiationService] Error creating screenshot verification:', error);
      throw error;
    }
  }

  static async completeNegotiation(negotiationId: string): Promise<void> {
    try {
      const negotiationRef = doc(db, 'price_negotiations', negotiationId);
      const negotiationSnap = await getDoc(negotiationRef);

      if (!negotiationSnap.exists()) {
        throw new Error('Negociación no encontrada');
      }

      const negotiation = negotiationSnap.data() as UberPriceComparison;

      await updateDoc(negotiationRef, {
        status: 'completed',
        completedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      const savings = negotiation.kommuteOriginalPrice - negotiation.kommuteNegotiatedPrice;

      await updateDoc(doc(db, 'user_negotiation_profiles', negotiation.userId), {
        successfulNegotiations: increment(1),
        totalSavings: increment(savings),
        updatedAt: serverTimestamp(),
      });

      console.log('✅ Negotiation completed:', negotiationId);
    } catch (error) {
      console.error('[PriceNegotiationService] Error completing negotiation:', error);
      throw error;
    }
  }

  static async reportFraud(negotiationId: string, reason: string): Promise<void> {
    try {
      const negotiationRef = doc(db, 'price_negotiations', negotiationId);
      const negotiationSnap = await getDoc(negotiationRef);

      if (!negotiationSnap.exists()) {
        throw new Error('Negociación no encontrada');
      }

      const negotiation = negotiationSnap.data() as UberPriceComparison;

      await updateDoc(negotiationRef, {
        status: 'fraud_detected',
        fraudReason: reason,
        updatedAt: serverTimestamp(),
      });

      await updateDoc(doc(db, 'user_negotiation_profiles', negotiation.userId), {
        fraudAttempts: increment(1),
        isBlocked: true,
        blockReason: reason,
        blockedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      console.log('⚠️ Fraud reported for negotiation:', negotiationId);
    } catch (error) {
      console.error('[PriceNegotiationService] Error reporting fraud:', error);
      throw error;
    }
  }

  static async getUserNegotiations(userId: string): Promise<UberPriceComparison[]> {
    try {
      const negotiationsRef = collection(db, 'price_negotiations');
      const q = query(negotiationsRef, where('userId', '==', userId));
      const snapshot = await getDocs(q);

      return snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          ...data,
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate(),
          completedAt: data.completedAt?.toDate(),
          screenshotVerifiedAt: data.screenshotVerifiedAt?.toDate(),
        } as UberPriceComparison;
      });
    } catch (error) {
      console.error('[PriceNegotiationService] Error getting user negotiations:', error);
      throw error;
    }
  }

  static calculateNegotiatedPrice(
    uberPrice: number,
    discountPercentage?: number
  ): { negotiatedPrice: number; discount: number } {
    const discount = discountPercentage || 
      Math.random() * 
      (DEFAULT_NEGOTIATION_SETTINGS.maxDiscountPercentage - DEFAULT_NEGOTIATION_SETTINGS.minDiscountPercentage) + 
      DEFAULT_NEGOTIATION_SETTINGS.minDiscountPercentage;

    const negotiatedPrice = uberPrice * (1 - discount / 100);

    return {
      negotiatedPrice: Math.round(negotiatedPrice * 100) / 100,
      discount: Math.round(discount * 100) / 100,
    };
  }
}
