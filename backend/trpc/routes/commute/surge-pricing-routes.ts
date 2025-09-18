// ============================================================================
// SURGE PRICING ROUTES
// ============================================================================
// Rutas tRPC para el sistema de precios dinámicos

import { z } from 'zod';
import { publicProcedure } from '../../create-context';
import {
  calculateSurgePrice,
  getSurgePrice,
  updateDemandMetrics,
  getDemandMetrics,
  createSurgePricingConfig,
  updateSurgePricingConfig,
  getSurgePricingConfig,
  getAllSurgePricingConfigs,
  getSurgePricingAnalytics,
} from './surge-pricing-service';

// ============================================================================
// INPUT SCHEMAS
// ============================================================================

const CalculateSurgePriceInputSchema = z.object({
  zoneId: z.string(),
  basePrice: z.number().positive(),
  saturationStatus: z.object({
    zoneId: z.string(),
    currentDrivers: z.number().min(0),
    maxDrivers: z.number().positive(),
    saturationLevel: z.number().min(0).max(100),
    status: z.enum(['low', 'optimal', 'high', 'saturated']),
    waitingList: z.number().min(0),
    estimatedWaitTime: z.number().min(0).optional(),
    recommendations: z.array(z.object({
      type: z.enum(['move_to_zone', 'wait', 'try_later', 'alternative_zone']),
      message: z.string(),
      alternativeZoneId: z.string().optional(),
    })),
    lastUpdated: z.date(),
  }).optional(),
});

const UpdateDemandMetricsInputSchema = z.object({
  zoneId: z.string(),
  waitingPassengers: z.number().min(0),
  availableDrivers: z.number().min(0),
  completedTrips: z.number().min(0),
});

const CreateSurgePricingConfigInputSchema = z.object({
  zoneId: z.string(),
  baseMultiplier: z.number().min(0.1).max(10).default(1.0),
  maxMultiplier: z.number().min(1).max(10).default(3.0),
  demandThreshold: z.number().min(0).max(1).default(0.7),
  timeBasedMultipliers: z.object({
    peakHours: z.array(z.number().min(0).max(23)),
    offPeakHours: z.array(z.number().min(0).max(23)),
    peakMultiplier: z.number().min(0.1).max(5).default(1.5),
    offPeakMultiplier: z.number().min(0.1).max(2).default(0.8),
  }),
  weatherMultipliers: z.object({
    rain: z.number().min(0.1).max(5).default(1.3),
    storm: z.number().min(0.1).max(5).default(1.8),
    snow: z.number().min(0.1).max(5).default(2.0),
  }),
  eventMultipliers: z.object({
    holiday: z.number().min(0.1).max(5).default(1.4),
    specialEvent: z.number().min(0.1).max(5).default(1.6),
    emergency: z.number().min(0.1).max(10).default(2.5),
  }),
  isActive: z.boolean().default(true),
});

const UpdateSurgePricingConfigInputSchema = z.object({
  zoneId: z.string(),
  baseMultiplier: z.number().min(0.1).max(10).optional(),
  maxMultiplier: z.number().min(1).max(10).optional(),
  demandThreshold: z.number().min(0).max(1).optional(),
  timeBasedMultipliers: z.object({
    peakHours: z.array(z.number().min(0).max(23)),
    offPeakHours: z.array(z.number().min(0).max(23)),
    peakMultiplier: z.number().min(0.1).max(5),
    offPeakMultiplier: z.number().min(0.1).max(2),
  }).optional(),
  weatherMultipliers: z.object({
    rain: z.number().min(0.1).max(5),
    storm: z.number().min(0.1).max(5),
    snow: z.number().min(0.1).max(5),
  }).optional(),
  eventMultipliers: z.object({
    holiday: z.number().min(0.1).max(5),
    specialEvent: z.number().min(0.1).max(5),
    emergency: z.number().min(0.1).max(10),
  }).optional(),
  isActive: z.boolean().optional(),
});

// ============================================================================
// SURGE PRICING CALCULATION PROCEDURES
// ============================================================================

export const calculateSurgePriceProcedure = publicProcedure
  .input(CalculateSurgePriceInputSchema)
  .query(async ({ input }) => {
    console.log('💰 tRPC: Calculating surge price for zone:', input.zoneId);
    return await calculateSurgePrice(input.zoneId, input.basePrice, input.saturationStatus);
  });

export const getSurgePriceProcedure = publicProcedure
  .input(z.object({ zoneId: z.string() }))
  .query(async ({ input }) => {
    console.log('💰 tRPC: Getting cached surge price for zone:', input.zoneId);
    return await getSurgePrice(input.zoneId);
  });

// ============================================================================
// DEMAND METRICS PROCEDURES
// ============================================================================

export const updateDemandMetricsProcedure = publicProcedure
  .input(UpdateDemandMetricsInputSchema)
  .mutation(async ({ input }) => {
    console.log('📊 tRPC: Updating demand metrics for zone:', input.zoneId);
    return await updateDemandMetrics(
      input.zoneId,
      input.waitingPassengers,
      input.availableDrivers,
      input.completedTrips
    );
  });

export const getDemandMetricsProcedure = publicProcedure
  .input(z.object({ zoneId: z.string() }))
  .query(async ({ input }) => {
    console.log('📈 tRPC: Getting demand metrics for zone:', input.zoneId);
    return await getDemandMetrics(input.zoneId);
  });

// ============================================================================
// SURGE PRICING CONFIGURATION PROCEDURES
// ============================================================================

export const createSurgePricingConfigProcedure = publicProcedure
  .input(CreateSurgePricingConfigInputSchema)
  .mutation(async ({ input }) => {
    console.log('🏗️ tRPC: Creating surge pricing config for zone:', input.zoneId);
    return await createSurgePricingConfig(input);
  });

export const updateSurgePricingConfigProcedure = publicProcedure
  .input(UpdateSurgePricingConfigInputSchema)
  .mutation(async ({ input }) => {
    console.log('📝 tRPC: Updating surge pricing config for zone:', input.zoneId);
    const { zoneId, ...updates } = input;
    return await updateSurgePricingConfig(zoneId, updates);
  });

export const getSurgePricingConfigProcedure = publicProcedure
  .input(z.object({ zoneId: z.string() }))
  .query(async ({ input }) => {
    console.log('🔍 tRPC: Getting surge pricing config for zone:', input.zoneId);
    return await getSurgePricingConfig(input.zoneId);
  });

export const getAllSurgePricingConfigsProcedure = publicProcedure
  .query(async () => {
    console.log('📋 tRPC: Getting all surge pricing configs');
    return await getAllSurgePricingConfigs();
  });

// ============================================================================
// ANALYTICS PROCEDURES
// ============================================================================

export const getSurgePricingAnalyticsProcedure = publicProcedure
  .input(z.object({ zoneId: z.string() }))
  .query(async ({ input }) => {
    console.log('📈 tRPC: Getting surge pricing analytics for zone:', input.zoneId);
    return await getSurgePricingAnalytics(input.zoneId);
  });

// ============================================================================
// BULK OPERATIONS PROCEDURES
// ============================================================================

export const getMultiZoneSurgePricingProcedure = publicProcedure
  .input(z.object({
    zoneIds: z.array(z.string()),
    basePrice: z.number().positive(),
  }))
  .query(async ({ input }) => {
    console.log('💰 tRPC: Getting surge pricing for multiple zones:', input.zoneIds.length);
    
    const results = await Promise.all(
      input.zoneIds.map(async (zoneId) => {
        try {
          const cached = await getSurgePrice(zoneId);
          if (cached) return cached;
          
          return await calculateSurgePrice(zoneId, input.basePrice);
        } catch (error) {
          console.error(`Error getting surge price for zone ${zoneId}:`, error);
          return {
            zoneId,
            basePrice: input.basePrice,
            surgeMultiplier: 1.0,
            finalPrice: input.basePrice,
            factors: {
              demand: 1.0,
              time: 1.0,
              weather: 1.0,
              event: 1.0,
              saturation: 1.0,
            },
            explanation: ['Error calculating surge price'],
            validUntil: new Date(Date.now() + 15 * 60 * 1000),
          };
        }
      })
    );
    
    return results;
  });

export const getSurgeHeatmapProcedure = publicProcedure
  .input(z.object({
    bounds: z.object({
      north: z.number().min(-90).max(90),
      south: z.number().min(-90).max(90),
      east: z.number().min(-180).max(180),
      west: z.number().min(-180).max(180),
    }),
    basePrice: z.number().positive(),
  }))
  .query(async ({ input }) => {
    console.log('🗺️ tRPC: Getting surge heatmap for bounds');
    
    // Get all configs and calculate surge for zones within bounds
    const allConfigs = await getAllSurgePricingConfigs();
    
    const heatmapData = await Promise.all(
      allConfigs
        .filter(config => config.isActive)
        .map(async (config) => {
          try {
            const surgeData = await calculateSurgePrice(config.zoneId, input.basePrice);
            return {
              zoneId: config.zoneId,
              surgeMultiplier: surgeData.surgeMultiplier,
              finalPrice: surgeData.finalPrice,
              intensity: Math.min((surgeData.surgeMultiplier - 1) / 2, 1), // Normalize to 0-1
            };
          } catch (error) {
            console.error(`Error calculating surge for heatmap zone ${config.zoneId}:`, error);
            return {
              zoneId: config.zoneId,
              surgeMultiplier: 1.0,
              finalPrice: input.basePrice,
              intensity: 0,
            };
          }
        })
    );
    
    return {
      bounds: input.bounds,
      timestamp: new Date(),
      zones: heatmapData,
    };
  });

console.log('🚀 Surge Pricing Routes initialized');