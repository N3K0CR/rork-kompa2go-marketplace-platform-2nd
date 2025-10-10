// ============================================================================
// PRICE NEGOTIATION tRPC ROUTES
// ============================================================================
// Rutas tRPC para negociación de tarifas competitivas con Uber

import { z } from 'zod';
import { protectedProcedure } from '@/backend/trpc/create-context';
import { TRPCError } from '@trpc/server';
import * as PriceNegotiationService from '@/src/modules/commute/services/price-negotiation-service';

// ============================================================================
// SCHEMAS
// ============================================================================

const LocationSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  address: z.string(),
});

const CreateNegotiationInputSchema = z.object({
  origin: LocationSchema,
  destination: LocationSchema,
  distance: z.number().positive(),
  kommuteOriginalPrice: z.number().positive(),
  uberReportedPrice: z.number().positive(),
});

const CompleteNegotiationInputSchema = z.object({
  negotiationId: z.string(),
  tripId: z.string(),
  screenshotUrl: z.string().url().optional(),
});

const UberPriceComparisonSchema = z.object({
  id: z.string(),
  userId: z.string(),
  tripId: z.string().optional(),
  origin: LocationSchema,
  destination: LocationSchema,
  distance: z.number(),
  kommuteOriginalPrice: z.number(),
  uberReportedPrice: z.number(),
  kommuteNegotiatedPrice: z.number(),
  discountPercentage: z.number(),
  tripNumber: z.number(),
  requiresScreenshot: z.boolean(),
  screenshotUrl: z.string().optional(),
  screenshotVerified: z.boolean().optional(),
  screenshotVerifiedAt: z.date().optional(),
  status: z.enum(['pending', 'active', 'completed', 'rejected', 'fraud_detected']),
  fraudReason: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
  completedAt: z.date().optional(),
});

const UserNegotiationProfileSchema = z.object({
  userId: z.string(),
  totalNegotiations: z.number(),
  successfulNegotiations: z.number(),
  fraudAttempts: z.number(),
  isBlocked: z.boolean(),
  blockReason: z.string().optional(),
  blockedAt: z.date().optional(),
  freeNegotiationsRemaining: z.number(),
  requiresScreenshotAfterTrip: z.number(),
  averageDiscount: z.number(),
  totalSavings: z.number(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// ============================================================================
// PROCEDURES
// ============================================================================

export const getUserNegotiationProfile = protectedProcedure
  .output(UserNegotiationProfileSchema)
  .query(async ({ ctx }) => {
    console.log('📊 Getting negotiation profile for user:', ctx.user.id);

    try {
      const profile = await PriceNegotiationService.getUserNegotiationProfile(
        ctx.user.id
      );
      return profile;
    } catch (error) {
      console.error('❌ Error getting negotiation profile:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to get negotiation profile',
        cause: error,
      });
    }
  });

export const createPriceNegotiation = protectedProcedure
  .input(CreateNegotiationInputSchema)
  .output(
    z.object({
      success: z.boolean(),
      negotiation: UberPriceComparisonSchema,
    })
  )
  .mutation(async ({ input, ctx }) => {
    console.log('💰 Creating price negotiation for user:', ctx.user.id);

    try {
      const negotiation = await PriceNegotiationService.createPriceNegotiation({
        userId: ctx.user.id,
        origin: input.origin,
        destination: input.destination,
        distance: input.distance,
        kommuteOriginalPrice: input.kommuteOriginalPrice,
        uberReportedPrice: input.uberReportedPrice,
      });

      return {
        success: true,
        negotiation,
      };
    } catch (error: any) {
      console.error('❌ Error creating price negotiation:', error);

      if (error.message?.includes('bloqueado')) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: error.message,
        });
      }

      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to create price negotiation',
        cause: error,
      });
    }
  });

export const completePriceNegotiation = protectedProcedure
  .input(CompleteNegotiationInputSchema)
  .output(z.object({ success: z.boolean() }))
  .mutation(async ({ input, ctx }) => {
    console.log('✅ Completing price negotiation:', input.negotiationId);

    try {
      await PriceNegotiationService.completePriceNegotiation(
        input.negotiationId,
        input.tripId,
        input.screenshotUrl
      );

      return { success: true };
    } catch (error: any) {
      console.error('❌ Error completing price negotiation:', error);

      if (error.message?.includes('captura de pantalla')) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: error.message,
        });
      }

      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to complete price negotiation',
        cause: error,
      });
    }
  });

export const getUserNegotiations = protectedProcedure
  .input(
    z.object({
      limit: z.number().min(1).max(100).default(20),
    })
  )
  .output(
    z.object({
      negotiations: z.array(UberPriceComparisonSchema),
      total: z.number(),
    })
  )
  .query(async ({ input, ctx }) => {
    console.log('📋 Getting negotiations for user:', ctx.user.id);

    try {
      const negotiations = await PriceNegotiationService.getUserNegotiations(
        ctx.user.id,
        input.limit
      );

      return {
        negotiations,
        total: negotiations.length,
      };
    } catch (error) {
      console.error('❌ Error getting user negotiations:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to get user negotiations',
        cause: error,
      });
    }
  });

export const detectFraud = protectedProcedure
  .input(z.object({ negotiationId: z.string() }))
  .output(
    z.object({
      isFraud: z.boolean(),
      reason: z.string().optional(),
      confidence: z.number(),
    })
  )
  .mutation(async ({ input, ctx }) => {
    console.log('🔍 Detecting fraud for negotiation:', input.negotiationId);

    try {
      const result = await PriceNegotiationService.detectFraud(input.negotiationId);
      return result;
    } catch (error) {
      console.error('❌ Error detecting fraud:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to detect fraud',
        cause: error,
      });
    }
  });

export const getNegotiationAnalytics = protectedProcedure
  .input(
    z.object({
      startDate: z.date(),
      endDate: z.date(),
    })
  )
  .output(
    z.object({
      totalNegotiations: z.number(),
      successfulNegotiations: z.number(),
      averageDiscount: z.number(),
      totalDiscountAmount: z.number(),
      fraudDetections: z.number(),
    })
  )
  .query(async ({ input, ctx }) => {
    console.log('📈 Getting negotiation analytics');

    try {
      const analytics = await PriceNegotiationService.getNegotiationAnalytics({
        startDate: input.startDate,
        endDate: input.endDate,
      });

      return analytics;
    } catch (error) {
      console.error('❌ Error getting negotiation analytics:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to get negotiation analytics',
        cause: error,
      });
    }
  });

console.log('🚀 Price Negotiation Routes initialized');
