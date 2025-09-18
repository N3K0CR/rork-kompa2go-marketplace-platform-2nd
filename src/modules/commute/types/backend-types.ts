// ============================================================================
// 2KOMMUTE BACKEND TYPES
// ============================================================================
// Type definitions for backend API interactions and tRPC procedures

import { z } from 'zod';
import type {
  TransportMode,
  RoutePoint,
  Route,
  Trip,
  TeamTransport,
  CarbonFootprint,
  CommuteEvent,
  TripChain,
  TripQueueEntry,
  TripMatch,
  DriverAvailability,
  TripChainingConfig,
  TripChainingAnalytics,
} from './core-types';

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

// Transport mode validation
export const TransportModeSchema = z.object({
  id: z.string(),
  name: z.string(),
  icon: z.string(),
  color: z.string(),
  carbonFactor: z.number().min(0),
  costFactor: z.number().min(0),
  speedFactor: z.number().positive(),
  available: z.boolean(),
});

// Route point validation
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

// Route validation
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

// Trip validation
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
  status: z.enum(['planned', 'in_progress', 'completed', 'cancelled']),
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
});

// ============================================================================
// INPUT VALIDATION SCHEMAS
// ============================================================================

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
  status: z.enum(['in_progress', 'completed', 'cancelled']).optional(),
  notes: z.string().optional(),
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

// ============================================================================
// MATCHING AND OPTIMIZATION SCHEMAS
// ============================================================================

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

// ============================================================================
// REAL-TIME AND ANALYTICS SCHEMAS
// ============================================================================

export const RealTimeEventSchema = z.object({
  id: z.string(),
  type: z.enum([
    'trip_started',
    'trip_ended',
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
  data: z.record(z.string(), z.any()),
  timestamp: z.date(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
});

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

// ============================================================================
// ERROR HANDLING SCHEMAS
// ============================================================================

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

// ============================================================================
// INFERRED TYPES
// ============================================================================

export type CreateRouteInput = z.infer<typeof CreateRouteInputSchema>;
export type UpdateRouteInput = z.infer<typeof UpdateRouteInputSchema>;
export type StartTripInput = z.infer<typeof StartTripInputSchema>;
export type UpdateTripInput = z.infer<typeof UpdateTripInputSchema>;
export type AddTrackingPointInput = z.infer<typeof AddTrackingPointInputSchema>;
export type MatchingRequest = z.infer<typeof MatchingRequestSchema>;
export type MatchingResponse = z.infer<typeof MatchingResponseSchema>;
export type RealTimeEvent = z.infer<typeof RealTimeEventSchema>;
export type AnalyticsRequest = z.infer<typeof AnalyticsRequestSchema>;
export type CommuteError = z.infer<typeof CommuteErrorSchema>;

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: CommuteError;
  timestamp: Date;
}

export interface PaginatedResponse<T = any> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Route API responses
export interface CreateRouteResponse extends ApiResponse<Route> {}
export interface GetRoutesResponse extends PaginatedResponse<Route> {}
export interface UpdateRouteResponse extends ApiResponse<Route> {}
export interface DeleteRouteResponse extends ApiResponse<{ deleted: boolean }> {}

// Trip API responses
export interface StartTripResponse extends ApiResponse<Trip> {}
export interface GetTripsResponse extends PaginatedResponse<Trip> {}
export interface UpdateTripResponse extends ApiResponse<Trip> {}
export interface EndTripResponse extends ApiResponse<Trip> {}

// Matching API responses
export interface FindMatchesResponse extends ApiResponse<MatchingResponse> {}
export interface OptimizeRouteResponse extends ApiResponse<Route> {}

// Analytics API responses
export interface GetAnalyticsResponse extends ApiResponse<any> {} // Will be properly typed when implemented
export interface GetCarbonFootprintResponse extends ApiResponse<CarbonFootprint> {}

// Real-time API responses
export interface SubscribeEventsResponse extends ApiResponse<{ subscriptionId: string }> {}
export interface UnsubscribeEventsResponse extends ApiResponse<{ unsubscribed: boolean }> {}

// ============================================================================
// TRPC PROCEDURE TYPES
// ============================================================================

// Input types for tRPC procedures
export interface GetRoutesInput {
  userId?: string;
  status?: Route['status'];
  limit?: number;
  offset?: number;
}

export interface GetTripsInput {
  userId?: string;
  routeId?: string;
  status?: Trip['status'];
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

export interface GetAnalyticsInput {
  userId: string;
  period: {
    startDate: Date;
    endDate: Date;
  };
  groupBy?: 'day' | 'week' | 'month';
  includeTeamData?: boolean;
}

// Output types for tRPC procedures
export interface RouteWithStats extends Route {
  stats: {
    totalTrips: number;
    completedTrips: number;
    totalDistance: number;
    totalDuration: number;
    averageRating?: number;
  };
}

export interface TripWithRoute extends Trip {
  route: Route;
}

// Subscription types for real-time updates
export interface EventSubscription {
  userId: string;
  eventTypes: CommuteEvent['type'][];
  filters?: {
    tripIds?: string[];
    teamIds?: string[];
    priority?: CommuteEvent['priority'];
  };
}

// Batch operation types
export interface BatchCreateRoutesInput {
  routes: CreateRouteInput[];
}

export interface BatchUpdateTripsInput {
  updates: { tripId: string; updates: Partial<UpdateTripInput> }[];
}

export interface BatchDeleteRoutesInput {
  routeIds: string[];
}

// ============================================================================
// TRIP CHAINING IMPORTS
// ============================================================================
// Import trip chaining types and schemas from dedicated file

export type {
  // Input types
  CreateTripChainInput,
  AddTripToQueueInput,
  FindNextTripsInput,
  AcceptNextTripInput,
  UpdateDriverAvailabilityInput,
  GetTripChainingAnalyticsInput,
  // Response types
  CreateTripChainResponse,
  GetTripChainsResponse,
  AddTripToChainResponse,
  CompleteTripChainResponse,
  AddTripToQueueResponse,
  GetQueueStatusResponse,
  FindNextTripsResponse,
  AcceptNextTripResponse,
  UpdateDriverAvailabilityResponse,
  GetDriverAvailabilityResponse,
  GetTripChainingAnalyticsResponse,
  GetTripMatchesResponse,
  // Event types
  TripChainEvent,
  // Batch operations
  BatchAddTripsToQueueInput,
  BatchUpdateDriverAvailabilityInput,
  BatchProcessQueueInput,
  // Utility types
  TripChainStatus,
  TripQueueStatus,
  LocationCoordinates,
  LocationWithAddress,
  LocationWithTimestamp,
  DriverChainState,
  TripTransition,
  MatchingCriteria,
  MatchingScore,
  ChainEfficiencyMetrics,
  DriverPerformanceMetrics,
  TripChainingSettings,
  TripChainingErrorCode,
  TripChainingError,
} from './trip-chaining-types';

export {
  // Validation schemas
  TripChainValidationSchema,
  TripQueueEntryValidationSchema,
  DriverAvailabilityValidationSchema,
  TripChainingConfigValidationSchema,
  TripMatchValidationSchema,
  // Input schemas
  CreateTripChainInputSchema,
  AddTripToQueueInputSchema,
  FindNextTripsInputSchema,
  AcceptNextTripInputSchema,
  UpdateDriverAvailabilityInputSchema,
  GetTripChainingAnalyticsInputSchema,
} from './trip-chaining-types';