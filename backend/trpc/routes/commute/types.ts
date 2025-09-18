// ============================================================================
// 2KOMMUTE BACKEND TYPES
// ============================================================================
// Tipos específicos para el backend de 2Kommute

import { z } from 'zod';

// Validation schemas for transport modes
export const TransportModeSchema = z.object({
  id: z.string(),
  name: z.string(),
  icon: z.string(),
  color: z.string(),
  carbonFactor: z.number().positive(),
  costFactor: z.number().positive(),
  speedFactor: z.number().positive(),
  available: z.boolean(),
});

// Validation schemas for route points
export const RoutePointSchema = z.object({
  id: z.string(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  address: z.string(),
  name: z.string().optional(),
  type: z.enum(['origin', 'destination', 'waypoint']),
  estimatedArrival: z.date().optional(),
  actualArrival: z.date().optional(),
});

// Validation schemas for routes
export const RouteSchema = z.object({
  id: z.string(),
  userId: z.string(),
  name: z.string(),
  points: z.array(RoutePointSchema),
  transportModes: z.array(TransportModeSchema),
  distance: z.number().positive(),
  duration: z.number().positive(),
  estimatedCost: z.number().min(0),
  carbonFootprint: z.number().min(0),
  status: z.enum(['planned', 'active', 'completed', 'cancelled']),
  isRecurring: z.boolean(),
  recurringPattern: z.object({
    type: z.enum(['daily', 'weekly', 'monthly']),
    daysOfWeek: z.array(z.number().min(0).max(6)).optional(),
    startDate: z.date(),
    endDate: z.date().optional(),
    exceptions: z.array(z.date()).optional(),
  }).optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Validation schemas for trips
export const TripSchema = z.object({
  id: z.string(),
  routeId: z.string(),
  userId: z.string(),
  startTime: z.date(),
  endTime: z.date().optional(),
  actualDistance: z.number().positive().optional(),
  actualDuration: z.number().positive().optional(),
  actualCost: z.number().min(0).optional(),
  actualCarbonFootprint: z.number().min(0).optional(),
  status: z.enum(['planned', 'in_progress', 'completing', 'completed', 'cancelled']),
  trackingPoints: z.array(z.object({
    id: z.string(),
    tripId: z.string(),
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    timestamp: z.date(),
    speed: z.number().min(0).optional(),
    accuracy: z.number().positive().optional(),
    altitude: z.number().optional(),
  })),
  notes: z.string().optional(),
  // Trip chaining fields
  nextTripId: z.string().optional(),
  previousTripId: z.string().optional(),
  chainId: z.string().optional(),
  estimatedCompletionTime: z.date().optional(),
  canAcceptNextTrip: z.boolean().default(false),
});

// Trip chain validation schema
export const TripChainSchema = z.object({
  id: z.string(),
  driverId: z.string(),
  trips: z.array(TripSchema),
  status: z.enum(['active', 'completed', 'cancelled']),
  totalDistance: z.number().min(0),
  totalDuration: z.number().min(0),
  totalEarnings: z.number().min(0),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Queue entry for trip matching
export const TripQueueEntrySchema = z.object({
  id: z.string(),
  tripId: z.string(),
  passengerId: z.string(),
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
  maxWaitTime: z.number().positive().default(300), // 5 minutes
  proximityRadius: z.number().positive().default(2000), // 2km
  status: z.enum(['queued', 'matched', 'expired', 'cancelled']),
  createdAt: z.date(),
  expiresAt: z.date(),
});

// Validation schemas for team transport
export const TeamTransportSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  adminId: z.string(),
  members: z.array(z.object({
    userId: z.string(),
    role: z.enum(['admin', 'member']),
    joinedAt: z.date(),
    preferences: z.object({
      canDrive: z.boolean(),
      hasVehicle: z.boolean(),
      vehicleCapacity: z.number().positive().optional(),
      preferredTransportModes: z.array(z.string()),
    }),
  })),
  routes: z.array(RouteSchema),
  settings: z.object({
    allowCarpooling: z.boolean(),
    maxDetourDistance: z.number().positive(),
    costSharingEnabled: z.boolean(),
    carbonTrackingEnabled: z.boolean(),
    notificationsEnabled: z.boolean(),
  }),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Input validation schemas
export const CreateRouteInputSchema = z.object({
  name: z.string().min(1).max(100),
  points: z.array(RoutePointSchema.omit({ id: true })).min(2),
  transportModeIds: z.array(z.string()).min(1),
  isRecurring: z.boolean().default(false),
  recurringPattern: z.object({
    type: z.enum(['daily', 'weekly', 'monthly']),
    daysOfWeek: z.array(z.number().min(0).max(6)).optional(),
    startDate: z.date(),
    endDate: z.date().optional(),
    exceptions: z.array(z.date()).optional(),
  }).optional(),
});

export const UpdateRouteInputSchema = z.object({
  routeId: z.string(),
  name: z.string().min(1).max(100).optional(),
  points: z.array(RoutePointSchema.omit({ id: true })).min(2).optional(),
  transportModeIds: z.array(z.string()).min(1).optional(),
  status: z.enum(['planned', 'active', 'completed', 'cancelled']).optional(),
  isRecurring: z.boolean().optional(),
  recurringPattern: z.object({
    type: z.enum(['daily', 'weekly', 'monthly']),
    daysOfWeek: z.array(z.number().min(0).max(6)).optional(),
    startDate: z.date(),
    endDate: z.date().optional(),
    exceptions: z.array(z.date()).optional(),
  }).optional(),
});

export const StartTripInputSchema = z.object({
  routeId: z.string(),
  startTime: z.date().optional(),
  notes: z.string().optional(),
});

export const UpdateTripInputSchema = z.object({
  tripId: z.string(),
  endTime: z.date().optional(),
  actualDistance: z.number().positive().optional(),
  actualDuration: z.number().positive().optional(),
  actualCost: z.number().min(0).optional(),
  actualCarbonFootprint: z.number().min(0).optional(),
  status: z.enum(['in_progress', 'completing', 'completed', 'cancelled']).optional(),
  notes: z.string().optional(),
  estimatedCompletionTime: z.date().optional(),
  canAcceptNextTrip: z.boolean().optional(),
});

// Trip chaining input schemas
export const AcceptNextTripInputSchema = z.object({
  currentTripId: z.string(),
  nextTripId: z.string(),
  estimatedTransitionTime: z.number().positive().default(300), // 5 minutes
});

export const FindNextTripsInputSchema = z.object({
  currentTripId: z.string(),
  currentLocation: z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
  }),
  maxProximityRadius: z.number().positive().default(5000), // 5km
  maxWaitTime: z.number().positive().default(900), // 15 minutes
  minTimeBeforeCompletion: z.number().positive().default(300), // 5 minutes
});

export const CreateTripChainInputSchema = z.object({
  driverId: z.string(),
  initialTripId: z.string(),
});

export const AddTrackingPointInputSchema = z.object({
  tripId: z.string(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  timestamp: z.date().optional(),
  speed: z.number().min(0).optional(),
  accuracy: z.number().positive().optional(),
  altitude: z.number().optional(),
});

export const CreateTeamInputSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  settings: z.object({
    allowCarpooling: z.boolean().default(true),
    maxDetourDistance: z.number().positive().default(5000),
    costSharingEnabled: z.boolean().default(true),
    carbonTrackingEnabled: z.boolean().default(true),
    notificationsEnabled: z.boolean().default(true),
  }).optional(),
});

export const JoinTeamInputSchema = z.object({
  teamId: z.string(),
  preferences: z.object({
    canDrive: z.boolean(),
    hasVehicle: z.boolean(),
    vehicleCapacity: z.number().positive().optional(),
    preferredTransportModes: z.array(z.string()),
  }),
});

export const MatchingRequestSchema = z.object({
  userId: z.string(),
  routeId: z.string(),
  departureTime: z.date(),
  flexibility: z.object({
    timeWindow: z.number().positive().default(30), // minutes
    maxDetour: z.number().positive().default(2000), // meters
    acceptSharedRide: z.boolean().default(true),
  }).optional(),
  preferences: z.object({
    transportModes: z.array(z.string()).optional(),
    maxCost: z.number().positive().optional(),
    prioritizeCarbonSaving: z.boolean().default(false),
    prioritizeCost: z.boolean().default(false),
    prioritizeTime: z.boolean().default(true),
  }).optional(),
});

export const MatchingResponseSchema = z.object({
  matches: z.array(z.object({
    id: z.string(),
    type: z.enum(['direct_route', 'shared_ride', 'public_transport', 'mixed_mode']),
    route: RouteSchema,
    participants: z.array(z.object({
      userId: z.string(),
      role: z.enum(['driver', 'passenger']),
      pickupPoint: RoutePointSchema,
      dropoffPoint: RoutePointSchema,
    })),
    estimatedCost: z.number().min(0),
    estimatedDuration: z.number().positive(),
    carbonFootprint: z.number().min(0),
    confidence: z.number().min(0).max(1),
    availableUntil: z.date(),
  })),
  alternatives: z.array(z.object({
    type: z.enum(['public_transport', 'taxi', 'bike_share', 'walk']),
    estimatedCost: z.number().min(0),
    estimatedDuration: z.number().positive(),
    carbonFootprint: z.number().min(0),
    instructions: z.array(z.string()),
  })),
});

// Real-time event schemas
export const RealTimeEventSchema = z.object({
  id: z.string(),
  type: z.enum([
    'trip_started',
    'trip_ended',
    'trip_completing',
    'next_trip_available',
    'next_trip_accepted',
    'trip_chain_started',
    'trip_chain_completed',
    'location_update',
    'route_deviation',
    'delay_detected',
    'match_found',
    'match_cancelled',
    'emergency_alert',
    'team_notification'
  ]),
  userId: z.string(),
  tripId: z.string().optional(),
  teamId: z.string().optional(),
  chainId: z.string().optional(),
  data: z.record(z.string(), z.any()),
  timestamp: z.date(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
});

export const SubscriptionInputSchema = z.object({
  userId: z.string(),
  eventTypes: z.array(z.enum([
    'trip_started',
    'trip_ended',
    'location_update',
    'route_deviation',
    'delay_detected',
    'match_found',
    'match_cancelled',
    'emergency_alert',
    'team_notification'
  ])),
  filters: z.object({
    tripIds: z.array(z.string()).optional(),
    teamIds: z.array(z.string()).optional(),
    priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  }).optional(),
});

// Analytics schemas
export const AnalyticsRequestSchema = z.object({
  userId: z.string(),
  period: z.object({
    startDate: z.date(),
    endDate: z.date(),
  }),
  groupBy: z.enum(['day', 'week', 'month']).default('day'),
  includeTeamData: z.boolean().default(false),
});

export const CarbonFootprintSchema = z.object({
  id: z.string(),
  userId: z.string(),
  period: z.enum(['daily', 'weekly', 'monthly', 'yearly']),
  startDate: z.date(),
  endDate: z.date(),
  totalEmissions: z.number().min(0),
  transportBreakdown: z.array(z.object({
    transportModeId: z.string(),
    emissions: z.number().min(0),
    distance: z.number().min(0),
    trips: z.number().min(0),
  })),
  comparisonData: z.object({
    previousPeriod: z.number().min(0),
    average: z.number().min(0),
    target: z.number().min(0).optional(),
  }).optional(),
});

// Error types
export const CommuteErrorSchema = z.object({
  code: z.enum([
    'ROUTE_NOT_FOUND',
    'TRIP_NOT_FOUND',
    'TEAM_NOT_FOUND',
    'INVALID_LOCATION',
    'MATCHING_FAILED',
    'TRACKING_ERROR',
    'PERMISSION_DENIED',
    'EXTERNAL_API_ERROR',
    'VALIDATION_ERROR'
  ]),
  message: z.string(),
  details: z.record(z.string(), z.any()).optional(),
});

// Export types for use in other files
export type TransportMode = z.infer<typeof TransportModeSchema>;
export type RoutePoint = z.infer<typeof RoutePointSchema>;
export type Route = z.infer<typeof RouteSchema>;
export type Trip = z.infer<typeof TripSchema>;
export type TeamTransport = z.infer<typeof TeamTransportSchema>;
export type CreateRouteInput = z.infer<typeof CreateRouteInputSchema>;
export type UpdateRouteInput = z.infer<typeof UpdateRouteInputSchema>;
export type StartTripInput = z.infer<typeof StartTripInputSchema>;
export type UpdateTripInput = z.infer<typeof UpdateTripInputSchema>;
export type AddTrackingPointInput = z.infer<typeof AddTrackingPointInputSchema>;
export type CreateTeamInput = z.infer<typeof CreateTeamInputSchema>;
export type JoinTeamInput = z.infer<typeof JoinTeamInputSchema>;
export type MatchingRequest = z.infer<typeof MatchingRequestSchema>;
export type MatchingResponse = z.infer<typeof MatchingResponseSchema>;
export type RealTimeEvent = z.infer<typeof RealTimeEventSchema>;
export type SubscriptionInput = z.infer<typeof SubscriptionInputSchema>;
export type AnalyticsRequest = z.infer<typeof AnalyticsRequestSchema>;
export type CarbonFootprint = z.infer<typeof CarbonFootprintSchema>;
export type CommuteError = z.infer<typeof CommuteErrorSchema>;

// Trip chaining types
export type TripChain = z.infer<typeof TripChainSchema>;
export type TripQueueEntry = z.infer<typeof TripQueueEntrySchema>;
export type AcceptNextTripInput = z.infer<typeof AcceptNextTripInputSchema>;
export type FindNextTripsInput = z.infer<typeof FindNextTripsInputSchema>;
export type CreateTripChainInput = z.infer<typeof CreateTripChainInputSchema>;