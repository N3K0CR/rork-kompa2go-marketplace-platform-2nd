import { z } from 'zod';
import { publicProcedure } from '../../create-context';
import { db } from '@/lib/firebase';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  setDoc,
  updateDoc,
  serverTimestamp,
  increment,
} from 'firebase/firestore';

const createNegotiationSchema = z.object({
  userId: z.string(),
  tripId: z.string().optional(),
  origin: z.object({
    latitude: z.number(),
    longitude: z.number(),
    address: z.string(),
  }),
  destination: z.object({
    latitude: z.number(),
    longitude: z.number(),
    address: z.string(),
  }),
  distance: z.number(),
  kommuteOriginalPrice: z.number(),
  uberReportedPrice: z.number(),
  screenshotBase64: z.string().optional(),
});

const completeNegotiationSchema = z.object({
  negotiationId: z.string(),
});

const reportFraudSchema = z.object({
  negotiationId: z.string(),
  reason: z.string(),
});

export const getUserNegotiationProfile = publicProcedure
  .input(z.object({ userId: z.string() }))
  .query(async ({ input }) => {
      try {
        const profileRef = doc(db, 'user_negotiation_profiles', input.userId);
        const profileSnap = await getDoc(profileRef);

        if (!profileSnap.exists()) {
          return null;
        }

        return profileSnap.data();
      } catch (error) {
        console.error('[priceNegotiationRouter] Error getting user profile:', error);
        throw new Error('Error al obtener perfil de usuario');
      }
  });

export const createPriceNegotiation = publicProcedure
    .input(createNegotiationSchema)
    .mutation(async ({ input }) => {
      try {
        const profileRef = doc(db, 'user_negotiation_profiles', input.userId);
        let profileSnap = await getDoc(profileRef);

        let profile: any;
        if (!profileSnap.exists()) {
          profile = {
            userId: input.userId,
            totalNegotiations: 0,
            successfulNegotiations: 0,
            fraudAttempts: 0,
            isBlocked: false,
            freeNegotiationsRemaining: 10,
            requiresScreenshotAfterTrip: 11,
            averageDiscount: 0,
            totalSavings: 0,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          };

          await setDoc(profileRef, profile);
        } else {
          profile = profileSnap.data();
        }

        if (profile.isBlocked) {
          throw new Error('Tu cuenta está bloqueada para negociaciones de precio');
        }

        const tripNumber = profile.totalNegotiations + 1;
        const requiresScreenshot = tripNumber >= profile.requiresScreenshotAfterTrip;

        if (requiresScreenshot && !input.screenshotBase64) {
          throw new Error('Se requiere captura de pantalla de Uber para este viaje');
        }

        const discountPercentage = Math.random() * (3 - 2) + 2;
        const kommuteNegotiatedPrice = input.uberReportedPrice * (1 - discountPercentage / 100);

        const negotiationId = `neg_${Date.now()}_${input.userId.substring(0, 8)}`;

        const negotiation = {
          id: negotiationId,
          userId: input.userId,
          tripId: input.tripId,
          origin: input.origin,
          destination: input.destination,
          distance: input.distance,
          kommuteOriginalPrice: input.kommuteOriginalPrice,
          uberReportedPrice: input.uberReportedPrice,
          kommuteNegotiatedPrice,
          discountPercentage,
          tripNumber,
          requiresScreenshot,
          screenshotUrl: input.screenshotBase64 ? `data:image/png;base64,${input.screenshotBase64}` : undefined,
          screenshotVerified: false,
          status: 'pending',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };

        await setDoc(doc(db, 'price_negotiations', negotiationId), negotiation);

        await updateDoc(profileRef, {
          totalNegotiations: increment(1),
          updatedAt: serverTimestamp(),
        });

        console.log('✅ Negotiation created:', negotiationId);

        return {
          ...negotiation,
          kommuteNegotiatedPrice: Math.round(kommuteNegotiatedPrice * 100) / 100,
          discountPercentage: Math.round(discountPercentage * 100) / 100,
        };
      } catch (error: any) {
        console.error('[priceNegotiationRouter] Error creating negotiation:', error);
        throw new Error(error.message || 'Error al crear negociación');
      }
  });

export const completePriceNegotiation = publicProcedure
    .input(completeNegotiationSchema)
    .mutation(async ({ input }) => {
      try {
        const negotiationRef = doc(db, 'price_negotiations', input.negotiationId);
        const negotiationSnap = await getDoc(negotiationRef);

        if (!negotiationSnap.exists()) {
          throw new Error('Negociación no encontrada');
        }

        const negotiation = negotiationSnap.data();

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

        console.log('✅ Negotiation completed:', input.negotiationId);

        return { success: true };
      } catch (error: any) {
        console.error('[priceNegotiationRouter] Error completing negotiation:', error);
        throw new Error(error.message || 'Error al completar negociación');
      }
  });

export const detectFraud = publicProcedure
    .input(reportFraudSchema)
    .mutation(async ({ input }) => {
      try {
        const negotiationRef = doc(db, 'price_negotiations', input.negotiationId);
        const negotiationSnap = await getDoc(negotiationRef);

        if (!negotiationSnap.exists()) {
          throw new Error('Negociación no encontrada');
        }

        const negotiation = negotiationSnap.data();

        await updateDoc(negotiationRef, {
          status: 'fraud_detected',
          fraudReason: input.reason,
          updatedAt: serverTimestamp(),
        });

        await updateDoc(doc(db, 'user_negotiation_profiles', negotiation.userId), {
          fraudAttempts: increment(1),
          isBlocked: true,
          blockReason: input.reason,
          blockedAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

        console.log('⚠️ Fraud reported for negotiation:', input.negotiationId);

        return { success: true };
      } catch (error: any) {
        console.error('[priceNegotiationRouter] Error reporting fraud:', error);
        throw new Error(error.message || 'Error al reportar fraude');
      }
  });

export const getUserNegotiations = publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ input }) => {
      try {
        const negotiationsRef = collection(db, 'price_negotiations');
        const q = query(negotiationsRef, where('userId', '==', input.userId));
        const snapshot = await getDocs(q);

        return snapshot.docs.map((doc) => doc.data());
      } catch (error) {
        console.error('[priceNegotiationRouter] Error getting user negotiations:', error);
        throw new Error('Error al obtener negociaciones');
      }
  });

export const getNegotiationAnalytics = publicProcedure
  .input(z.object({
    startDate: z.string(),
    endDate: z.string(),
  }))
  .query(async ({ input }) => {
    try {
      const negotiationsRef = collection(db, 'price_negotiations');
      const snapshot = await getDocs(negotiationsRef);

      const negotiations = snapshot.docs.map((doc) => doc.data());

      const totalNegotiations = negotiations.length;
      const successfulNegotiations = negotiations.filter((n: any) => n.status === 'completed').length;
      const fraudDetections = negotiations.filter((n: any) => n.status === 'fraud_detected').length;

      const totalDiscount = negotiations.reduce((sum: number, n: any) => {
        if (n.status === 'completed') {
          return sum + (n.kommuteOriginalPrice - n.kommuteNegotiatedPrice);
        }
        return sum;
      }, 0);

      const averageDiscount = successfulNegotiations > 0
        ? negotiations.reduce((sum: number, n: any) => sum + (n.discountPercentage || 0), 0) / successfulNegotiations
        : 0;

      return {
        totalNegotiations,
        successfulNegotiations,
        fraudDetections,
        fraudRate: totalNegotiations > 0 ? (fraudDetections / totalNegotiations) * 100 : 0,
        conversionRate: totalNegotiations > 0 ? (successfulNegotiations / totalNegotiations) * 100 : 0,
        averageDiscount,
        totalDiscountAmount: totalDiscount,
      };
    } catch (error) {
      console.error('[priceNegotiationRouter] Error getting analytics:', error);
      throw new Error('Error al obtener analíticas');
    }
  });
