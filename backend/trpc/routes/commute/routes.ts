// ============================================================================
// 2KOMMUTE tRPC ROUTES
// ============================================================================
// Rutas tRPC para el módulo de transporte avanzado

import { z } from 'zod';
import { protectedProcedure } from '@/backend/trpc/create-context';
import { TRPCError } from '@trpc/server';
import { MatchingService } from './matching-service';
import { RealTimeService } from './realtime-service';
import { TripChainingService } from './trip-chaining-service';
import {
  CreateRouteInputSchema,
  UpdateRouteInputSchema,
  StartTripInputSchema,
  UpdateTripInputSchema,
  AddTrackingPointInputSchema,
  MatchingRequestSchema,
  MatchingResponseSchema,
  SubscriptionInputSchema,
  RouteSchema,
  TripSchema,
  RealTimeEventSchema,
  // Trip chaining schemas
  AcceptNextTripInputSchema,
  FindNextTripsInputSchema,
  CreateTripChainInputSchema,
  TripChainSchema,
  TripQueueEntrySchema,
} from './types';

// ============================================================================
// ROUTE MANAGEMENT PROCEDURES
// ============================================================================

/**
 * Crea una nueva ruta
 */
export const createRoute = protectedProcedure
  .input(CreateRouteInputSchema)
  .output(z.object({
    success: z.boolean(),
    route: RouteSchema,
  }))
  .mutation(async ({ input, ctx }) => {
    console.log('🛣️ Creating new route:', input.name);
    
    try {
      // Simular creación de ruta (en producción sería BD)
      const routeId = `route_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Calcular métricas de la ruta
      const distance = calculateRouteDistance(input.points);
      const duration = estimateRouteDuration(distance, input.transportModeIds);
      const cost = estimateRouteCost(distance, input.transportModeIds);
      const carbonFootprint = estimateCarbonFootprint(distance, input.transportModeIds);
      
      const route = {
        id: routeId,
        userId: ctx.user.id,
        name: input.name,
        points: input.points.map((point, index) => ({
          ...point,
          id: `point_${routeId}_${index}`,
        })),
        transportModes: await getTransportModesByIds(input.transportModeIds),
        distance,
        duration,
        estimatedCost: cost,
        carbonFootprint,
        status: 'planned' as const,
        isRecurring: input.isRecurring,
        recurringPattern: input.recurringPattern,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      // Agregar ruta al servicio de matching
      MatchingService.addRoute(route);
      
      return {
        success: true,
        route,
      };
    } catch (error) {
      console.error('❌ Error creating route:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to create route',
        cause: error,
      });
    }
  });

/**
 * Obtiene las rutas del usuario
 */
export const getUserRoutes = protectedProcedure
  .input(z.object({
    status: z.enum(['planned', 'active', 'completed', 'cancelled']).optional(),
    limit: z.number().default(20),
    offset: z.number().default(0),
  }))
  .output(z.object({
    routes: z.array(RouteSchema),
    total: z.number(),
    hasMore: z.boolean(),
  }))
  .query(async ({ input, ctx }) => {
    console.log('📋 Getting routes for user:', ctx.user.id);
    
    try {
      // En producción, esto sería una consulta a BD
      const allRoutes = MatchingService.getActiveRoutes()
        .filter(route => route.userId === ctx.user.id);
      
      const filteredRoutes = input.status ?
        allRoutes.filter(route => route.status === input.status) :
        allRoutes;
      
      const paginatedRoutes = filteredRoutes
        .slice(input.offset, input.offset + input.limit);
      
      return {
        routes: paginatedRoutes,
        total: filteredRoutes.length,
        hasMore: input.offset + input.limit < filteredRoutes.length,
      };
    } catch (error) {
      console.error('❌ Error getting user routes:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to get routes',
        cause: error,
      });
    }
  });

/**
 * Actualiza una ruta existente
 */
export const updateRoute = protectedProcedure
  .input(UpdateRouteInputSchema)
  .output(z.object({
    success: z.boolean(),
    route: RouteSchema,
  }))
  .mutation(async ({ input, ctx }) => {
    console.log('✏️ Updating route:', input.routeId);
    
    try {
      // En producción, verificaríamos ownership en BD
      const existingRoutes = MatchingService.getActiveRoutes();
      const existingRoute = existingRoutes.find(r => r.id === input.routeId && r.userId === ctx.user.id);
      
      if (!existingRoute) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Route not found or access denied',
        });
      }
      
      // Recalcular métricas si cambiaron puntos o modos de transporte
      let points = existingRoute.points;
      let transportModes = existingRoute.transportModes;
      let distance = existingRoute.distance;
      let duration = existingRoute.duration;
      let estimatedCost = existingRoute.estimatedCost;
      let carbonFootprint = existingRoute.carbonFootprint;
      
      if (input.points || input.transportModeIds) {
        if (input.points) {
          points = input.points.map((point, index) => ({
            ...point,
            id: `point_${input.routeId}_${index}`,
          }));
        }
        
        const transportModeIds = input.transportModeIds || existingRoute.transportModes.map(tm => tm.id);
        
        distance = calculateRouteDistance(points);
        duration = estimateRouteDuration(distance, transportModeIds);
        estimatedCost = estimateRouteCost(distance, transportModeIds);
        carbonFootprint = estimateCarbonFootprint(distance, transportModeIds);
        
        if (input.transportModeIds) {
          transportModes = await getTransportModesByIds(transportModeIds);
        }
      }
      
      // Actualizar ruta
      const updatedRoute = {
        id: existingRoute.id,
        userId: existingRoute.userId,
        name: input.name ?? existingRoute.name,
        points,
        transportModes,
        distance,
        duration,
        estimatedCost,
        carbonFootprint,
        status: input.status ?? existingRoute.status,
        isRecurring: input.isRecurring ?? existingRoute.isRecurring,
        recurringPattern: input.recurringPattern ?? existingRoute.recurringPattern,
        createdAt: existingRoute.createdAt,
        updatedAt: new Date(),
      };
      
      // Actualizar en el servicio de matching
      MatchingService.removeRoute(input.routeId);
      MatchingService.addRoute(updatedRoute);
      
      return {
        success: true,
        route: updatedRoute,
      };
    } catch (error) {
      console.error('❌ Error updating route:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to update route',
        cause: error,
      });
    }
  });

/**
 * Elimina una ruta
 */
export const deleteRoute = protectedProcedure
  .input(z.object({ routeId: z.string() }))
  .output(z.object({ success: z.boolean() }))
  .mutation(async ({ input, ctx }) => {
    console.log('🗑️ Deleting route:', input.routeId);
    
    try {
      // Verificar ownership (en producción sería BD)
      const existingRoutes = MatchingService.getActiveRoutes();
      const existingRoute = existingRoutes.find(r => r.id === input.routeId && r.userId === ctx.user.id);
      
      if (!existingRoute) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Route not found or access denied',
        });
      }
      
      // Remover del servicio de matching
      MatchingService.removeRoute(input.routeId);
      
      return { success: true };
    } catch (error) {
      console.error('❌ Error deleting route:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to delete route',
        cause: error,
      });
    }
  });

// ============================================================================
// TRIP MANAGEMENT PROCEDURES
// ============================================================================

/**
 * Inicia un nuevo viaje
 */
export const startTrip = protectedProcedure
  .input(StartTripInputSchema)
  .output(z.object({
    success: z.boolean(),
    trip: TripSchema,
  }))
  .mutation(async ({ input, ctx }) => {
    console.log('🚀 Starting trip for route:', input.routeId);
    
    try {
      const tripId = `trip_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const trip = {
        id: tripId,
        routeId: input.routeId,
        userId: ctx.user.id,
        startTime: input.startTime || new Date(),
        status: 'in_progress' as const,
        trackingPoints: [],
        notes: input.notes,
        canAcceptNextTrip: false,
      };
      
      // Agregar al servicio de matching
      MatchingService.addTrip(trip);
      
      // Iniciar tracking en tiempo real
      await RealTimeService.startTripTracking(tripId, ctx.user.id);
      
      return {
        success: true,
        trip,
      };
    } catch (error) {
      console.error('❌ Error starting trip:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to start trip',
        cause: error,
      });
    }
  });

/**
 * Actualiza un viaje en progreso
 */
export const updateTrip = protectedProcedure
  .input(UpdateTripInputSchema)
  .output(z.object({
    success: z.boolean(),
    trip: TripSchema,
  }))
  .mutation(async ({ input, ctx }) => {
    console.log('✏️ Updating trip:', input.tripId);
    
    try {
      // En producción, verificaríamos ownership en BD
      const existingTrips = MatchingService.getActiveTrips();
      const existingTrip = existingTrips.find(t => t.id === input.tripId && t.userId === ctx.user.id);
      
      if (!existingTrip) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Trip not found or access denied',
        });
      }
      
      const updatedTrip = {
        ...existingTrip,
        ...input,
      };
      
      // Handle trip chaining status changes
      if (input.status === 'completing' && input.canAcceptNextTrip) {
        // Trip is approaching completion and can accept next trips
        console.log('🔄 Trip entering completion phase, enabling next trip acceptance');
        
        // Emit event for nearby drivers (simplified - in real implementation would use RealTimeService)
        console.log('📡 Trip completing event:', {
          type: 'trip_completing',
          userId: ctx.user.id,
          tripId: input.tripId,
          estimatedCompletionTime: input.estimatedCompletionTime,
        });
      }
      
      // Si el viaje se completa o cancela, detener tracking
      if (input.status === 'completed' || input.status === 'cancelled') {
        await RealTimeService.stopTripTracking(input.tripId, ctx.user.id);
        MatchingService.removeTrip(input.tripId);
        
        // Complete trip chain if this was the last trip
        const driverChains = TripChainingService.getDriverChains(ctx.user.id);
        for (const chain of driverChains) {
          const tripInChain = chain.trips.find(t => t.id === input.tripId);
          if (tripInChain && !tripInChain.nextTripId) {
            // This is the last trip in the chain
            TripChainingService.completeTripChain(chain.id);
          }
        }
      }
      
      return {
        success: true,
        trip: updatedTrip,
      };
    } catch (error) {
      console.error('❌ Error updating trip:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to update trip',
        cause: error,
      });
    }
  });

/**
 * Obtiene los viajes del usuario
 */
export const getUserTrips = protectedProcedure
  .input(z.object({
    status: z.enum(['planned', 'in_progress', 'completed', 'cancelled']).optional(),
    limit: z.number().default(20),
    offset: z.number().default(0),
  }))
  .output(z.object({
    trips: z.array(TripSchema),
    total: z.number(),
    hasMore: z.boolean(),
  }))
  .query(async ({ input, ctx }) => {
    console.log('📋 Getting trips for user:', ctx.user.id);
    
    try {
      // En producción, esto sería una consulta a BD
      const allTrips = MatchingService.getActiveTrips()
        .filter(trip => trip.userId === ctx.user.id);
      
      const filteredTrips = input.status ?
        allTrips.filter(trip => trip.status === input.status) :
        allTrips;
      
      const paginatedTrips = filteredTrips
        .slice(input.offset, input.offset + input.limit);
      
      return {
        trips: paginatedTrips,
        total: filteredTrips.length,
        hasMore: input.offset + input.limit < filteredTrips.length,
      };
    } catch (error) {
      console.error('❌ Error getting user trips:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to get trips',
        cause: error,
      });
    }
  });

// ============================================================================
// MATCHING PROCEDURES
// ============================================================================

/**
 * Busca matches para una ruta
 */
export const findMatches = protectedProcedure
  .input(MatchingRequestSchema)
  .output(MatchingResponseSchema)
  .mutation(async ({ input, ctx }) => {
    console.log('🔍 Finding matches for user:', ctx.user.id);
    
    try {
      const request = {
        ...input,
        userId: ctx.user.id, // Asegurar que el userId sea del usuario autenticado
      };
      
      const matches = await MatchingService.findMatches(request);
      return matches;
    } catch (error) {
      console.error('❌ Error finding matches:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to find matches',
        cause: error,
      });
    }
  });

/**
 * Obtiene estadísticas del servicio de matching
 */
export const getMatchingStats = protectedProcedure
  .output(z.object({
    activeRoutes: z.number(),
    activeTrips: z.number(),
    activeTeams: z.number(),
    transportModes: z.number(),
    lastUpdate: z.date(),
  }))
  .query(async () => {
    console.log('📊 Getting matching stats');
    
    try {
      return MatchingService.getMatchingStats();
    } catch (error) {
      console.error('❌ Error getting matching stats:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to get matching stats',
        cause: error,
      });
    }
  });

// ============================================================================
// REAL-TIME PROCEDURES
// ============================================================================

/**
 * Suscribe a eventos en tiempo real
 */
export const subscribeToEvents = protectedProcedure
  .input(SubscriptionInputSchema)
  .output(z.object({ subscriptionId: z.string() }))
  .mutation(async ({ input, ctx }) => {
    console.log('📡 Creating subscription for user:', ctx.user.id);
    
    try {
      const subscription = {
        ...input,
        userId: ctx.user.id, // Asegurar que el userId sea del usuario autenticado
      };
      
      return await RealTimeService.subscribe(subscription);
    } catch (error) {
      console.error('❌ Error creating subscription:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to create subscription',
        cause: error,
      });
    }
  });

/**
 * Actualiza la ubicación en tiempo real
 */
export const updateLocation = protectedProcedure
  .input(AddTrackingPointInputSchema)
  .output(z.object({ success: z.boolean() }))
  .mutation(async ({ input, ctx }) => {
    console.log('📍 Updating location for trip:', input.tripId);
    
    try {
      // Verificar que el usuario tenga acceso al viaje
      const activeTrips = MatchingService.getActiveTrips();
      const trip = activeTrips.find(t => t.id === input.tripId && t.userId === ctx.user.id);
      
      if (!trip) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Trip not found or access denied',
        });
      }
      
      return await RealTimeService.updateLocation(input);
    } catch (error) {
      console.error('❌ Error updating location:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to update location',
        cause: error,
      });
    }
  });

/**
 * Obtiene el estado en tiempo real de un viaje
 */
export const getTripRealTimeStatus = protectedProcedure
  .input(z.object({ tripId: z.string() }))
  .output(z.object({
    tripId: z.string(),
    isActive: z.boolean(),
    lastUpdate: z.object({
      latitude: z.number(),
      longitude: z.number(),
      timestamp: z.date(),
      speed: z.number().optional(),
      accuracy: z.number().optional(),
    }).nullable(),
    totalUpdates: z.number(),
    activeAlerts: z.array(z.any()),
    stats: z.object({
      totalDistance: z.number(),
      totalDuration: z.number(),
      averageSpeed: z.number(),
      maxSpeed: z.number(),
    }),
  }))
  .query(async ({ input, ctx }) => {
    console.log('📊 Getting real-time status for trip:', input.tripId);
    
    try {
      // Verificar acceso al viaje
      const activeTrips = MatchingService.getActiveTrips();
      const trip = activeTrips.find(t => t.id === input.tripId && t.userId === ctx.user.id);
      
      if (!trip) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Trip not found or access denied',
        });
      }
      
      return await RealTimeService.getTripRealTimeStatus(input.tripId);
    } catch (error) {
      console.error('❌ Error getting trip status:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to get trip status',
        cause: error,
      });
    }
  });

/**
 * Obtiene eventos recientes del usuario
 */
export const getRecentEvents = protectedProcedure
  .input(z.object({ limit: z.number().default(50) }))
  .output(z.array(RealTimeEventSchema))
  .query(async ({ input, ctx }) => {
    console.log('📋 Getting recent events for user:', ctx.user.id);
    
    try {
      return RealTimeService.getRecentEvents(ctx.user.id, input.limit);
    } catch (error) {
      console.error('❌ Error getting recent events:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to get recent events',
        cause: error,
      });
    }
  });

/**
 * Obtiene estadísticas del servicio en tiempo real
 */
export const getRealTimeStats = protectedProcedure
  .output(z.object({
    activeSubscriptions: z.number(),
    recentEventsCount: z.number(),
    activeTripsTracking: z.number(),
    totalLocationUpdates: z.number(),
    lastEventTime: z.date().nullable(),
  }))
  .query(async () => {
    console.log('📊 Getting real-time stats');
    
    try {
      return RealTimeService.getRealTimeStats();
    } catch (error) {
      console.error('❌ Error getting real-time stats:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to get real-time stats',
        cause: error,
      });
    }
  });

// ============================================================================
// TRIP CHAINING PROCEDURES
// ============================================================================

/**
 * Creates a new trip chain for a driver
 */
export const createTripChain = protectedProcedure
  .input(CreateTripChainInputSchema)
  .output(z.object({
    success: z.boolean(),
    chain: TripChainSchema,
  }))
  .mutation(async ({ input, ctx }) => {
    console.log('🔗 Creating trip chain for driver:', ctx.user.id);
    
    try {
      const chainInput = {
        ...input,
        driverId: ctx.user.id, // Ensure driver is the authenticated user
      };
      
      const chain = TripChainingService.createTripChain(chainInput);
      
      return {
        success: true,
        chain,
      };
    } catch (error) {
      console.error('❌ Error creating trip chain:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to create trip chain',
        cause: error,
      });
    }
  });

/**
 * Finds next available trips for a driver
 */
export const findNextTrips = protectedProcedure
  .input(FindNextTripsInputSchema)
  .output(z.array(TripQueueEntrySchema))
  .query(async ({ input, ctx }) => {
    console.log('🔍 Finding next trips for user:', ctx.user.id);
    
    try {
      // Verify the current trip belongs to the user
      const activeTrips = MatchingService.getActiveTrips();
      const currentTrip = activeTrips.find(t => t.id === input.currentTripId && t.userId === ctx.user.id);
      
      if (!currentTrip) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Current trip not found or access denied',
        });
      }
      
      const nextTrips = TripChainingService.findNextTrips(input);
      return nextTrips;
    } catch (error) {
      console.error('❌ Error finding next trips:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to find next trips',
        cause: error,
      });
    }
  });

/**
 * Accepts a next trip and creates the chain link
 */
export const acceptNextTrip = protectedProcedure
  .input(AcceptNextTripInputSchema)
  .output(z.object({ success: z.boolean() }))
  .mutation(async ({ input, ctx }) => {
    console.log('✅ Accepting next trip for user:', ctx.user.id);
    
    try {
      // Verify the current trip belongs to the user
      const activeTrips = MatchingService.getActiveTrips();
      const currentTrip = activeTrips.find(t => t.id === input.currentTripId && t.userId === ctx.user.id);
      
      if (!currentTrip) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Current trip not found or access denied',
        });
      }
      
      const success = TripChainingService.acceptNextTrip(input);
      
      if (!success) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Failed to accept next trip',
        });
      }
      
      return { success };
    } catch (error) {
      console.error('❌ Error accepting next trip:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to accept next trip',
        cause: error,
      });
    }
  });

/**
 * Gets active trip chains for the current driver
 */
export const getDriverChains = protectedProcedure
  .output(z.array(TripChainSchema))
  .query(async ({ ctx }) => {
    console.log('📋 Getting trip chains for driver:', ctx.user.id);
    
    try {
      const chains = TripChainingService.getDriverChains(ctx.user.id);
      return chains;
    } catch (error) {
      console.error('❌ Error getting driver chains:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to get driver chains',
        cause: error,
      });
    }
  });

/**
 * Adds a trip to the queue for matching
 */
export const addTripToQueue = protectedProcedure
  .input(z.object({
    tripId: z.string(),
    routeId: z.string(),
    requestedTime: z.date(),
    pickupLocation: z.object({
      latitude: z.number(),
      longitude: z.number(),
      address: z.string(),
    }),
    dropoffLocation: z.object({
      latitude: z.number(),
      longitude: z.number(),
      address: z.string(),
    }),
    priority: z.number().min(0).max(10).default(5),
    maxWaitTime: z.number().positive().default(300),
    proximityRadius: z.number().positive().default(2000),
  }))
  .output(TripQueueEntrySchema)
  .mutation(async ({ input, ctx }) => {
    console.log('📋 Adding trip to queue for user:', ctx.user.id);
    
    try {
      const queueEntry = TripChainingService.addTripToQueue({
        ...input,
        passengerId: ctx.user.id,
        status: 'queued',
      });
      
      return queueEntry;
    } catch (error) {
      console.error('❌ Error adding trip to queue:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to add trip to queue',
        cause: error,
      });
    }
  });

/**
 * Gets trip chaining statistics
 */
export const getTripChainingStats = protectedProcedure
  .output(z.object({
    totalQueued: z.number(),
    totalMatched: z.number(),
    totalExpired: z.number(),
    activeChains: z.number(),
    lastUpdate: z.date(),
  }))
  .query(async () => {
    console.log('📊 Getting trip chaining stats');
    
    try {
      return TripChainingService.getQueueStats();
    } catch (error) {
      console.error('❌ Error getting trip chaining stats:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to get trip chaining stats',
        cause: error,
      });
    }
  });

/**
 * Updates driver location for proximity matching
 */
export const updateDriverLocation = protectedProcedure
  .input(z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
  }))
  .output(z.object({ success: z.boolean() }))
  .mutation(async ({ input, ctx }) => {
    console.log('📍 Updating driver location for user:', ctx.user.id);
    
    try {
      TripChainingService.updateDriverLocation(ctx.user.id, input);
      return { success: true };
    } catch (error) {
      console.error('❌ Error updating driver location:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to update driver location',
        cause: error,
      });
    }
  });

/**
 * Checks if a trip is approaching completion and finds nearby trips
 */
export const checkTripCompletionAndFindNearby = protectedProcedure
  .input(z.object({
    tripId: z.string(),
    currentLocation: z.object({
      latitude: z.number().min(-90).max(90),
      longitude: z.number().min(-180).max(180),
    }),
  }))
  .output(z.object({
    isNearCompletion: z.boolean(),
    nearbyTrips: z.array(TripQueueEntrySchema),
  }))
  .query(async ({ input, ctx }) => {
    console.log('🎯 Checking trip completion for user:', ctx.user.id);
    
    try {
      // Verify trip ownership
      const activeTrips = MatchingService.getActiveTrips();
      const trip = activeTrips.find(t => t.id === input.tripId && t.userId === ctx.user.id);
      
      if (!trip) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Trip not found or access denied',
        });
      }
      
      const isNearCompletion = TripChainingService.checkTripCompletion(input.tripId, input.currentLocation);
      const nearbyTrips = isNearCompletion ? 
        TripChainingService.findNearbyTripsForCompletion(input.tripId, input.currentLocation) : [];
      
      return {
        isNearCompletion,
        nearbyTrips,
      };
    } catch (error) {
      console.error('❌ Error checking trip completion:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to check trip completion',
        cause: error,
      });
    }
  });

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Calcula la distancia total de una ruta
 */
function calculateRouteDistance(points: any[]): number {
  if (points.length < 2) return 0;
  
  let totalDistance = 0;
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    totalDistance += calculateDistance(prev, curr);
  }
  
  return Math.round(totalDistance);
}

/**
 * Estima la duración de una ruta
 */
function estimateRouteDuration(distance: number, transportModeIds: string[]): number {
  // Velocidad promedio estimada basada en modos de transporte
  const avgSpeed = transportModeIds.includes('car_solo') ? 40 :
                  transportModeIds.includes('public_transport') ? 25 :
                  transportModeIds.includes('bicycle') ? 15 : 5;
  
  return Math.round((distance / 1000) / avgSpeed * 3600); // segundos
}

/**
 * Estima el costo de una ruta
 */
function estimateRouteCost(distance: number, transportModeIds: string[]): number {
  const costPerKm = transportModeIds.includes('car_solo') ? 1.2 :
                   transportModeIds.includes('public_transport') ? 0.5 :
                   0; // Bicicleta y caminar son gratis
  
  return Math.round((distance / 1000) * costPerKm * 100) / 100;
}

/**
 * Estima la huella de carbono de una ruta
 */
function estimateCarbonFootprint(distance: number, transportModeIds: string[]): number {
  const carbonPerKm = transportModeIds.includes('car_solo') ? 0.2 :
                     transportModeIds.includes('public_transport') ? 0.05 :
                     0; // Bicicleta y caminar no generan emisiones
  
  return Math.round((distance / 1000) * carbonPerKm * 100) / 100;
}

/**
 * Obtiene modos de transporte por IDs
 */
async function getTransportModesByIds(ids: string[]) {
  // Mock data - en producción sería consulta a BD
  const allModes = [
    { id: 'walking', name: 'Caminar', icon: 'walk', color: '#4CAF50', carbonFactor: 0, costFactor: 0, speedFactor: 5, available: true },
    { id: 'bicycle', name: 'Bicicleta', icon: 'bike', color: '#2196F3', carbonFactor: 0, costFactor: 0, speedFactor: 15, available: true },
    { id: 'public_transport', name: 'Transporte Público', icon: 'bus', color: '#FF9800', carbonFactor: 0.05, costFactor: 0.5, speedFactor: 25, available: true },
    { id: 'car_solo', name: 'Auto Personal', icon: 'car', color: '#F44336', carbonFactor: 0.2, costFactor: 1.2, speedFactor: 40, available: true },
  ];
  
  return allModes.filter(mode => ids.includes(mode.id));
}

/**
 * Calcula distancia entre dos puntos
 */
function calculateDistance(point1: any, point2: any): number {
  const R = 6371e3; // Radio de la Tierra en metros
  const φ1 = point1.latitude * Math.PI / 180;
  const φ2 = point2.latitude * Math.PI / 180;
  const Δφ = (point2.latitude - point1.latitude) * Math.PI / 180;
  const Δλ = (point2.longitude - point1.longitude) * Math.PI / 180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c;
}