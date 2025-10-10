// ============================================================================
// PRICE NEGOTIATION SERVICE
// ============================================================================
// Servicio para gestionar negociación de tarifas competitivas con Uber

import { db } from '@/lib/firebase';
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
  serverTimestamp,
  increment,
  Timestamp,
} from 'firebase/firestore';
import type {
  UberPriceComparison,
  UserNegotiationProfile,
  PriceNegotiationSettings,
  ScreenshotVerificationRequest,
} from '@/src/shared/types/price-negotiation-types';
import { DEFAULT_NEGOTIATION_SETTINGS } from '@/src/shared/types/price-negotiation-types';

const COLLECTIONS = {
  PRICE_COMPARISONS: 'price_comparisons',
  USER_NEGOTIATION_PROFILES: 'user_negotiation_profiles',
  NEGOTIATION_SETTINGS: 'negotiation_settings',
  SCREENSHOT_VERIFICATIONS: 'screenshot_verifications',
} as const;

// ============================================================================
// USER PROFILE MANAGEMENT
// ============================================================================

export async function getUserNegotiationProfile(
  userId: string
): Promise<UserNegotiationProfile> {
  console.log('[PriceNegotiation] Getting profile for user:', userId);

  const profileRef = doc(db, COLLECTIONS.USER_NEGOTIATION_PROFILES, userId);
  const profileSnap = await getDoc(profileRef);

  if (!profileSnap.exists()) {
    const newProfile: UserNegotiationProfile = {
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

    await setDoc(profileRef, {
      ...newProfile,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    console.log('[PriceNegotiation] Created new profile for user:', userId);
    return newProfile;
  }

  const data = profileSnap.data();
  return {
    ...data,
    createdAt: data.createdAt?.toDate() || new Date(),
    updatedAt: data.updatedAt?.toDate() || new Date(),
    blockedAt: data.blockedAt?.toDate(),
  } as UserNegotiationProfile;
}

export async function updateUserNegotiationProfile(
  userId: string,
  updates: Partial<UserNegotiationProfile>
): Promise<void> {
  console.log('[PriceNegotiation] Updating profile for user:', userId);

  const profileRef = doc(db, COLLECTIONS.USER_NEGOTIATION_PROFILES, userId);
  await updateDoc(profileRef, {
    ...updates,
    updatedAt: serverTimestamp(),
  });

  console.log('[PriceNegotiation] Profile updated successfully');
}

// ============================================================================
// PRICE NEGOTIATION
// ============================================================================

export async function createPriceNegotiation(params: {
  userId: string;
  origin: { latitude: number; longitude: number; address: string };
  destination: { latitude: number; longitude: number; address: string };
  distance: number;
  kommuteOriginalPrice: number;
  uberReportedPrice: number;
}): Promise<UberPriceComparison> {
  console.log('[PriceNegotiation] Creating price negotiation');

  const profile = await getUserNegotiationProfile(params.userId);

  if (profile.isBlocked) {
    throw new Error(
      `Usuario bloqueado por: ${profile.blockReason || 'violación de términos'}`
    );
  }

  const settings = await getNegotiationSettings();

  const discountPercentage = Math.min(
    settings.maxDiscountPercentage,
    Math.max(settings.minDiscountPercentage, 2.5)
  );

  const kommuteNegotiatedPrice = Math.round(
    params.uberReportedPrice * (1 - discountPercentage / 100)
  );

  const requiresScreenshot =
    profile.totalNegotiations >= profile.requiresScreenshotAfterTrip - 1;

  const negotiationId = `neg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const negotiation: UberPriceComparison = {
    id: negotiationId,
    userId: params.userId,
    origin: params.origin,
    destination: params.destination,
    distance: params.distance,
    kommuteOriginalPrice: params.kommuteOriginalPrice,
    uberReportedPrice: params.uberReportedPrice,
    kommuteNegotiatedPrice,
    discountPercentage,
    tripNumber: profile.totalNegotiations + 1,
    requiresScreenshot,
    status: 'active',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  await setDoc(doc(db, COLLECTIONS.PRICE_COMPARISONS, negotiationId), {
    ...negotiation,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  await updateDoc(doc(db, COLLECTIONS.USER_NEGOTIATION_PROFILES, params.userId), {
    totalNegotiations: increment(1),
    freeNegotiationsRemaining: Math.max(0, profile.freeNegotiationsRemaining - 1),
    updatedAt: serverTimestamp(),
  });

  console.log('[PriceNegotiation] Negotiation created:', negotiationId);
  return negotiation;
}

export async function completePriceNegotiation(
  negotiationId: string,
  tripId: string,
  screenshotUrl?: string
): Promise<void> {
  console.log('[PriceNegotiation] Completing negotiation:', negotiationId);

  const negotiationRef = doc(db, COLLECTIONS.PRICE_COMPARISONS, negotiationId);
  const negotiationSnap = await getDoc(negotiationRef);

  if (!negotiationSnap.exists()) {
    throw new Error('Negociación no encontrada');
  }

  const negotiation = negotiationSnap.data() as UberPriceComparison;

  if (negotiation.requiresScreenshot && !screenshotUrl) {
    throw new Error('Se requiere captura de pantalla para este viaje');
  }

  const updates: Partial<UberPriceComparison> = {
    tripId,
    status: 'completed',
    completedAt: new Date(),
    updatedAt: new Date(),
  };

  if (screenshotUrl) {
    updates.screenshotUrl = screenshotUrl;

    const verificationId = `ver_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const verification: ScreenshotVerificationRequest = {
      id: verificationId,
      negotiationId,
      userId: negotiation.userId,
      screenshotUrl,
      autoVerificationStatus: 'pending',
      autoVerificationConfidence: 0,
      manualReviewRequired: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await setDoc(doc(db, COLLECTIONS.SCREENSHOT_VERIFICATIONS, verificationId), {
      ...verification,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  await updateDoc(negotiationRef, {
    ...updates,
    completedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  const savings = negotiation.kommuteOriginalPrice - negotiation.kommuteNegotiatedPrice;

  await updateDoc(doc(db, COLLECTIONS.USER_NEGOTIATION_PROFILES, negotiation.userId), {
    successfulNegotiations: increment(1),
    totalSavings: increment(savings),
    updatedAt: serverTimestamp(),
  });

  console.log('[PriceNegotiation] Negotiation completed successfully');
}

export async function getUserNegotiations(
  userId: string,
  limitCount: number = 20
): Promise<UberPriceComparison[]> {
  console.log('[PriceNegotiation] Getting negotiations for user:', userId);

  const q = query(
    collection(db, COLLECTIONS.PRICE_COMPARISONS),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc'),
    limit(limitCount)
  );

  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      ...data,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
      completedAt: data.completedAt?.toDate(),
      screenshotVerifiedAt: data.screenshotVerifiedAt?.toDate(),
    } as UberPriceComparison;
  });
}

// ============================================================================
// FRAUD DETECTION
// ============================================================================

export async function detectFraud(negotiationId: string): Promise<{
  isFraud: boolean;
  reason?: string;
  confidence: number;
}> {
  console.log('[PriceNegotiation] Detecting fraud for negotiation:', negotiationId);

  const negotiationRef = doc(db, COLLECTIONS.PRICE_COMPARISONS, negotiationId);
  const negotiationSnap = await getDoc(negotiationRef);

  if (!negotiationSnap.exists()) {
    throw new Error('Negociación no encontrada');
  }

  const negotiation = negotiationSnap.data() as UberPriceComparison;
  const settings = await getNegotiationSettings();

  const priceDifference =
    Math.abs(negotiation.uberReportedPrice - negotiation.kommuteOriginalPrice) /
    negotiation.kommuteOriginalPrice;

  if (priceDifference > settings.maxPriceDifferencePercentage / 100) {
    return {
      isFraud: true,
      reason: 'Diferencia de precio sospechosa (>50%)',
      confidence: 0.9,
    };
  }

  const userNegotiations = await getUserNegotiations(negotiation.userId, 10);
  const recentNegotiations = userNegotiations.filter(
    (n) =>
      n.createdAt.getTime() > Date.now() - 24 * 60 * 60 * 1000 &&
      n.status === 'active'
  );

  if (recentNegotiations.length > settings.suspiciousPatternThreshold) {
    return {
      isFraud: true,
      reason: 'Patrón sospechoso: demasiadas negociaciones en 24h',
      confidence: 0.75,
    };
  }

  return {
    isFraud: false,
    confidence: 0.1,
  };
}

export async function blockUserForFraud(
  userId: string,
  reason: string
): Promise<void> {
  console.log('[PriceNegotiation] Blocking user for fraud:', userId);

  await updateDoc(doc(db, COLLECTIONS.USER_NEGOTIATION_PROFILES, userId), {
    isBlocked: true,
    blockReason: reason,
    blockedAt: serverTimestamp(),
    fraudAttempts: increment(1),
    updatedAt: serverTimestamp(),
  });

  const userNegotiations = await getUserNegotiations(userId);
  const activeNegotiations = userNegotiations.filter((n) => n.status === 'active');

  for (const negotiation of activeNegotiations) {
    await updateDoc(doc(db, COLLECTIONS.PRICE_COMPARISONS, negotiation.id), {
      status: 'fraud_detected',
      fraudReason: reason,
      updatedAt: serverTimestamp(),
    });
  }

  console.log('[PriceNegotiation] User blocked successfully');
}

// ============================================================================
// SETTINGS
// ============================================================================

export async function getNegotiationSettings(): Promise<PriceNegotiationSettings> {
  const settingsRef = doc(db, COLLECTIONS.NEGOTIATION_SETTINGS, 'default');
  const settingsSnap = await getDoc(settingsRef);

  if (!settingsSnap.exists()) {
    await setDoc(settingsRef, DEFAULT_NEGOTIATION_SETTINGS);
    return DEFAULT_NEGOTIATION_SETTINGS;
  }

  return settingsSnap.data() as PriceNegotiationSettings;
}

export async function updateNegotiationSettings(
  updates: Partial<PriceNegotiationSettings>
): Promise<void> {
  console.log('[PriceNegotiation] Updating settings');

  const settingsRef = doc(db, COLLECTIONS.NEGOTIATION_SETTINGS, 'default');
  await updateDoc(settingsRef, updates);

  console.log('[PriceNegotiation] Settings updated successfully');
}

// ============================================================================
// ANALYTICS
// ============================================================================

export async function getNegotiationAnalytics(params: {
  startDate: Date;
  endDate: Date;
}): Promise<{
  totalNegotiations: number;
  successfulNegotiations: number;
  averageDiscount: number;
  totalDiscountAmount: number;
  fraudDetections: number;
}> {
  console.log('[PriceNegotiation] Getting analytics');

  const q = query(
    collection(db, COLLECTIONS.PRICE_COMPARISONS),
    where('createdAt', '>=', Timestamp.fromDate(params.startDate)),
    where('createdAt', '<=', Timestamp.fromDate(params.endDate))
  );

  const snapshot = await getDocs(q);
  const negotiations = snapshot.docs.map((doc) => doc.data() as UberPriceComparison);

  const totalNegotiations = negotiations.length;
  const successfulNegotiations = negotiations.filter(
    (n) => n.status === 'completed'
  ).length;
  const fraudDetections = negotiations.filter(
    (n) => n.status === 'fraud_detected'
  ).length;

  const totalDiscount = negotiations.reduce(
    (sum, n) => sum + (n.kommuteOriginalPrice - n.kommuteNegotiatedPrice),
    0
  );

  const averageDiscount =
    totalNegotiations > 0
      ? negotiations.reduce((sum, n) => sum + n.discountPercentage, 0) /
        totalNegotiations
      : 0;

  return {
    totalNegotiations,
    successfulNegotiations,
    averageDiscount,
    totalDiscountAmount: totalDiscount,
    fraudDetections,
  };
}

console.log('🚀 Price Negotiation Service initialized');
