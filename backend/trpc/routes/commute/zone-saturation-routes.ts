// ============================================================================
// ZONE SATURATION ROUTES
// ============================================================================
// Rutas tRPC para el sistema de zona con saturación

import { z } from 'zod';
import { publicProcedure } from '../../create-context';
import {
  CreateZoneInputSchema,
  UpdateZoneInputSchema,
  JoinZoneInputSchema,
  LeaveZoneInputSchema,
  GetZoneSaturationInputSchema,
  GetZoneRecommendationsInputSchema,
} from './types';
import {
  createZone,
  updateZone,
  deleteZone,
  getAllZones,
  getZoneById,
  joinZone,
  leaveZone,
  getDriverZoneAssignments,
  getZoneSaturation,
  getZoneRecommendations,
  getZoneAnalytics,
} from './zone-saturation-service';

// ============================================================================
// ZONE MANAGEMENT PROCEDURES
// ============================================================================

export const createZoneProcedure = publicProcedure
  .input(CreateZoneInputSchema)
  .mutation(async ({ input }) => {
    console.log('🏗️ tRPC: Creating zone:', input.name);
    return await createZone(input);
  });

export const updateZoneProcedure = publicProcedure
  .input(UpdateZoneInputSchema)
  .mutation(async ({ input }) => {
    console.log('📝 tRPC: Updating zone:', input.zoneId);
    return await updateZone(input);
  });

export const deleteZoneProcedure = publicProcedure
  .input(z.object({ zoneId: z.string() }))
  .mutation(async ({ input }) => {
    console.log('🗑️ tRPC: Deleting zone:', input.zoneId);
    return await deleteZone(input.zoneId);
  });

export const getAllZonesProcedure = publicProcedure
  .query(async () => {
    console.log('📋 tRPC: Getting all zones');
    return await getAllZones();
  });

export const getZoneByIdProcedure = publicProcedure
  .input(z.object({ zoneId: z.string() }))
  .query(async ({ input }) => {
    console.log('🔍 tRPC: Getting zone by ID:', input.zoneId);
    return await getZoneById(input.zoneId);
  });

// ============================================================================
// DRIVER ZONE ASSIGNMENT PROCEDURES
// ============================================================================

export const joinZoneProcedure = publicProcedure
  .input(z.object({
    driverId: z.string(),
    ...JoinZoneInputSchema.shape,
  }))
  .mutation(async ({ input }) => {
    console.log('🚗 tRPC: Driver joining zone:', input.driverId, input.zoneId);
    const { driverId, ...joinInput } = input;
    return await joinZone(driverId, joinInput);
  });

export const leaveZoneProcedure = publicProcedure
  .input(z.object({
    driverId: z.string(),
    ...LeaveZoneInputSchema.shape,
  }))
  .mutation(async ({ input }) => {
    console.log('🚪 tRPC: Driver leaving zone:', input.driverId, input.zoneId);
    const { driverId, ...leaveInput } = input;
    return await leaveZone(driverId, leaveInput);
  });

export const getDriverZoneAssignmentsProcedure = publicProcedure
  .input(z.object({ driverId: z.string() }))
  .query(async ({ input }) => {
    console.log('📋 tRPC: Getting driver zone assignments:', input.driverId);
    return await getDriverZoneAssignments(input.driverId);
  });

// ============================================================================
// ZONE SATURATION PROCEDURES
// ============================================================================

export const getZoneSaturationProcedure = publicProcedure
  .input(GetZoneSaturationInputSchema)
  .query(async ({ input }) => {
    console.log('📊 tRPC: Getting zone saturation for location');
    return await getZoneSaturation(input);
  });

export const getZoneRecommendationsProcedure = publicProcedure
  .input(GetZoneRecommendationsInputSchema)
  .query(async ({ input }) => {
    console.log('🎯 tRPC: Getting zone recommendations for driver:', input.driverId);
    return await getZoneRecommendations(input);
  });

export const getZoneAnalyticsProcedure = publicProcedure
  .input(z.object({ zoneId: z.string() }))
  .query(async ({ input }) => {
    console.log('📈 tRPC: Getting zone analytics:', input.zoneId);
    return await getZoneAnalytics(input.zoneId);
  });

// ============================================================================
// ZONE STATUS PROCEDURES
// ============================================================================

export const getZoneStatusProcedure = publicProcedure
  .input(z.object({ zoneId: z.string() }))
  .query(async ({ input }) => {
    console.log('📊 tRPC: Getting zone status:', input.zoneId);
    
    const zone = await getZoneById(input.zoneId);
    if (!zone) {
      throw new Error(`Zone not found: ${input.zoneId}`);
    }

    const saturationStatuses = await getZoneSaturation({
      location: zone.center,
      radius: 1000, // 1km radius around zone center
    });

    const zoneStatus = saturationStatuses.find(status => status.zoneId === input.zoneId);
    
    return {
      zone,
      saturationStatus: zoneStatus,
    };
  });

export const getNearbyZonesProcedure = publicProcedure
  .input(z.object({
    location: z.object({
      latitude: z.number().min(-90).max(90),
      longitude: z.number().min(-180).max(180),
    }),
    radius: z.number().positive().default(10000), // 10km
    includeInactive: z.boolean().default(false),
  }))
  .query(async ({ input }) => {
    console.log('🗺️ tRPC: Getting nearby zones');
    
    const allZones = await getAllZones();
    const saturationStatuses = await getZoneSaturation({
      location: input.location,
      radius: input.radius,
    });

    const nearbyZones = allZones
      .filter(zone => {
        if (!input.includeInactive && zone.status === 'inactive') {
          return false;
        }
        
        // Calculate distance to zone center
        const R = 6371e3; // Earth's radius in meters
        const φ1 = input.location.latitude * Math.PI / 180;
        const φ2 = zone.center.latitude * Math.PI / 180;
        const Δφ = (zone.center.latitude - input.location.latitude) * Math.PI / 180;
        const Δλ = (zone.center.longitude - input.location.longitude) * Math.PI / 180;

        const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
                Math.cos(φ1) * Math.cos(φ2) *
                Math.sin(Δλ/2) * Math.sin(Δλ/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        const distance = R * c;

        return distance <= input.radius;
      })
      .map(zone => {
        const saturationStatus = saturationStatuses.find(status => status.zoneId === zone.id);
        return {
          zone,
          saturationStatus,
        };
      });

    return nearbyZones;
  });

console.log('🚀 Zone Saturation Routes initialized');