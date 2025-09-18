// ============================================================================
// TRIP CHAINING TYPES
// ============================================================================
// Comprehensive TypeScript types for Trip Chaining functionality

import { z } from 'zod';
import type {
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

// Base schemas for reuse
const LocationSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  address: z.string(),
});

const TimestampLocationSchema = LocationSchema.extend({
  timestamp: z.date(),
});

// Trip chain validation
export const TripChainValidationSchema = z.object({
  id: z.string(),
  driverId: z.string(),
  trips: z.array(z.object({
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
    trackingPoints: z.array(z.any()),
    notes: z.string().optional(),
    // Trip chaining properties
    chainId: z.string().optional(),
    previousTripId: z.string().optional(),
    nextTripId: z.string().optional(),
    isChainedTrip: z.boolean().optional(),
  })),
  status: z.enum(['active', 'completed', 'cancelled', 'paused']),
  totalDistance: z.number().min(0),
  totalDuration: z.number().min(0),
  totalEarnings: z.number().min(0),
  maxChainLength: z.number().positive().optional(),
  targetDestination: z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    address: z.string(),
    name: z.string().optional(),
    type: z.enum(['origin', 'destination', 'waypoint']),
    estimatedArrival: z.date().optional(),
    actualArrival: z.date().optional(),
  }).optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
  metadata: z.object({
    averageRating: z.number().min(0).max(5).optional(),
    completionRate: z.number().min(0).max(1).optional(),
    preferredAreas: z.array(z.string()).optional(),
    driverNotes: z.string().optional(),
  }).optional(),
});

// Trip queue entry validation
export const TripQueueEntryValidationSchema = z.object({
  id: z.string(),
  tripId: z.string(),
  passengerId: z.string(),
  pickupLocation: LocationSchema,
  dropoffLocation: LocationSchema,
  requestedTime: z.date(),
  maxWaitTime: z.number().positive(),
  priority: z.number().min(1).max(10),
  estimatedFare: z.number().min(0),
  status: z.enum(['queued', 'matched', 'expired', 'cancelled']),
  createdAt: z.date(),
  expiresAt: z.date(),
  requirements: z.object({
    vehicleType: z.string().optional(),
    accessibility: z.boolean().optional(),
    childSeat: z.boolean().optional(),
    petFriendly: z.boolean().optional(),
  }).optional(),
  passengerPreferences: z.object({
    maxDetour: z.number().positive().optional(),
    shareRide: z.boolean().optional(),
    preferredDriverRating: z.number().min(0).max(5).optional(),
  }).optional(),
});

// Driver availability validation
export const DriverAvailabilityValidationSchema = z.object({
  driverId: z.string(),
  currentTripId: z.string().optional(),
  currentLocation: TimestampLocationSchema,
  estimatedCompletionTime: z.date().optional(),
  isAcceptingChainedTrips: z.boolean(),
  maxChainLength: z.number().positive(),
  preferredAreas: z.array(z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    radius: z.number().positive(),
  })).optional(),
  targetDestination: z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    address: z.string(),
    arrivalBy: z.date().optional(),
  }).optional(),
  vehicleInfo: z.object({
    type: z.string(),
    capacity: z.number().positive(),
    accessibility: z.boolean(),
    petFriendly: z.boolean(),
  }),
  driverRating: z.number().min(0).max(5),
  completedTripsToday: z.number().min(0),
  earningsToday: z.number().min(0),
});

// Trip chaining configuration validation
export const TripChainingConfigValidationSchema = z.object({
  enabled: z.boolean(),
  maxChainLength: z.number().positive(),
  proximityRadius: z.number().positive(),
  advanceNoticeTime: z.number().positive(),
  maxWaitTime: z.number().positive(),
  minTripGap: z.number().min(0),
  allowedTransitionTime: z.number().positive(),
  priorityWeights: z.object({
    distance: z.number().min(0).max(1),
    fare: z.number().min(0).max(1),
    rating: z.number().min(0).max(1),
    waitTime: z.number().min(0).max(1),
  }),
});

// ============================================================================
// INPUT VALIDATION SCHEMAS
// ============================================================================

export const CreateTripChainInputSchema = z.object({
  driverId: z.string(),
  maxChainLength: z.number().positive().optional(),
  targetDestination: z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    address: z.string(),
    name: z.string().optional(),
    type: z.enum(['origin', 'destination', 'waypoint']),
    estimatedArrival: z.date().optional(),
  }).optional(),
});

export const AddTripToQueueInputSchema = z.object({
  tripId: z.string(),
  passengerId: z.string(),
  pickupLocation: LocationSchema,
  dropoffLocation: LocationSchema,
  requestedTime: z.date(),
  maxWaitTime: z.number().positive().default(1800), // 30 minutes
  priority: z.number().min(1).max(10).default(5),
  estimatedFare: z.number().min(0),
  requirements: z.object({
    vehicleType: z.string().optional(),
    accessibility: z.boolean().optional(),
    childSeat: z.boolean().optional(),
    petFriendly: z.boolean().optional(),
  }).optional(),
  passengerPreferences: z.object({
    maxDetour: z.number().positive().optional(),
    shareRide: z.boolean().optional(),
    preferredDriverRating: z.number().min(0).max(5).optional(),
  }).optional(),
});

export const FindNextTripsInputSchema = z.object({
  currentTripId: z.string(),
  currentLocation: z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
  }),
  maxProximityRadius: z.number().positive().default(5000), // 5km
  maxWaitTime: z.number().positive().default(600), // 10 minutes
  limit: z.number().positive().default(10),
});

export const AcceptNextTripInputSchema = z.object({
  currentTripId: z.string(),
  nextTripId: z.string(),
  estimatedTransitionTime: z.number().positive(),
});

export const UpdateDriverAvailabilityInputSchema = z.object({
  driverId: z.string(),
  currentLocation: z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
  }),
  isAcceptingChainedTrips: z.boolean().optional(),
  maxChainLength: z.number().positive().optional(),
  targetDestination: z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    address: z.string(),
    arrivalBy: z.date().optional(),
  }).optional(),
});

export const GetTripChainingAnalyticsInputSchema = z.object({
  driverId: z.string(),
  period: z.object({
    startDate: z.date(),
    endDate: z.date(),
  }),
  includeMetrics: z.array(z.enum([
    'efficiency',
    'earnings',
    'completion_rate',
    'top_areas'
  ])).optional(),
});

// Trip matching validation
export const TripMatchValidationSchema = z.object({
  id: z.string(),
  driverId: z.string(),
  queueEntryId: z.string(),
  tripId: z.string(),
  confidence: z.number().min(0).max(1),
  estimatedPickupTime: z.date(),
  estimatedTransitionTime: z.number().positive(),
  distanceToPickup: z.number().min(0),
  matchScore: z.number().min(0),
  reasons: z.array(z.string()),
  warnings: z.array(z.string()).optional(),
  createdAt: z.date(),
  expiresAt: z.date(),
});

// ============================================================================
// INFERRED TYPES
// ============================================================================

export type CreateTripChainInput = z.infer<typeof CreateTripChainInputSchema>;
export type AddTripToQueueInput = z.infer<typeof AddTripToQueueInputSchema>;
export type FindNextTripsInput = z.infer<typeof FindNextTripsInputSchema>;
export type AcceptNextTripInput = z.infer<typeof AcceptNextTripInputSchema>;
export type UpdateDriverAvailabilityInput = z.infer<typeof UpdateDriverAvailabilityInputSchema>;
export type GetTripChainingAnalyticsInput = z.infer<typeof GetTripChainingAnalyticsInputSchema>;

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };
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

// Trip chaining API responses
export interface CreateTripChainResponse extends ApiResponse<TripChain> {}
export interface GetTripChainsResponse extends PaginatedResponse<TripChain> {}
export interface AddTripToChainResponse extends ApiResponse<TripChain> {}
export interface CompleteTripChainResponse extends ApiResponse<TripChain> {}

export interface AddTripToQueueResponse extends ApiResponse<TripQueueEntry> {}
export interface GetQueueStatusResponse extends ApiResponse<{
  totalQueued: number;
  totalMatched: number;
  totalExpired: number;
  averageWaitTime: number;
  queueEntries: TripQueueEntry[];
}> {}

export interface FindNextTripsResponse extends ApiResponse<TripQueueEntry[]> {}
export interface AcceptNextTripResponse extends ApiResponse<{
  success: boolean;
  chainId: string;
  estimatedPickupTime: Date;
  transitionInstructions: string[];
}> {}

export interface UpdateDriverAvailabilityResponse extends ApiResponse<DriverAvailability> {}
export interface GetDriverAvailabilityResponse extends ApiResponse<DriverAvailability> {}

export interface GetTripChainingAnalyticsResponse extends ApiResponse<TripChainingAnalytics> {}
export interface GetTripMatchesResponse extends ApiResponse<TripMatch[]> {}

// ============================================================================
// REAL-TIME EVENT TYPES
// ============================================================================

export interface TripChainEvent extends CommuteEvent {
  type: 'trip_chain_started' | 'trip_chain_completed' | 'next_trip_accepted' | 'trip_queue_updated' | 'proximity_match_found';
  chainId: string;
  data: {
    chainId: string;
    driverId?: string;
    tripId?: string;
    queueEntryId?: string;
    estimatedTransitionTime?: number;
    totalTrips?: number;
    totalEarnings?: number;
    [key: string]: any;
  };
}

// ============================================================================
// BATCH OPERATIONS
// ============================================================================

export interface BatchAddTripsToQueueInput {
  trips: AddTripToQueueInput[];
}

export interface BatchUpdateDriverAvailabilityInput {
  updates: { driverId: string; updates: Partial<UpdateDriverAvailabilityInput> }[];
}

export interface BatchProcessQueueInput {
  maxProcessingTime: number; // seconds
  priorityThreshold: number; // minimum priority to process
  maxMatches: number;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

// Trip chaining status types
export type TripChainStatus = TripChain['status'];
export type TripQueueStatus = TripQueueEntry['status'];

// Location types for convenience
export type LocationCoordinates = {
  latitude: number;
  longitude: number;
};

export type LocationWithAddress = LocationCoordinates & {
  address: string;
};

export type LocationWithTimestamp = LocationWithAddress & {
  timestamp: Date;
};

// Driver state types
export type DriverChainState = {
  isInChain: boolean;
  currentChainId?: string;
  chainPosition: number; // 0-based index in chain
  nextTripId?: string;
  estimatedChainCompletion?: Date;
};

// Trip transition types
export type TripTransition = {
  fromTripId: string;
  toTripId: string;
  transitionTime: number; // seconds
  distance: number; // meters
  instructions: string[];
  estimatedArrival: Date;
};

// Matching algorithm types
export type MatchingCriteria = {
  maxDistance: number;
  maxWaitTime: number;
  minDriverRating: number;
  requireVehicleType?: string;
  prioritizeEarnings: boolean;
  prioritizeEfficiency: boolean;
};

export type MatchingScore = {
  overall: number;
  distance: number;
  time: number;
  earnings: number;
  driverRating: number;
  passengerPreference: number;
};

// Analytics types
export type ChainEfficiencyMetrics = {
  averageChainLength: number;
  completionRate: number;
  deadMileageReduction: number; // percentage
  timeUtilization: number; // percentage
  fuelSavings: number; // estimated liters
  co2Reduction: number; // kg
};

export type DriverPerformanceMetrics = {
  totalChains: number;
  averageEarningsPerChain: number;
  averageTransitionTime: number;
  customerSatisfactionScore: number;
  onTimePerformance: number; // percentage
};

// Configuration types
export type TripChainingSettings = {
  global: TripChainingConfig;
  driverSpecific: Map<string, Partial<TripChainingConfig>>;
  areaSpecific: Map<string, Partial<TripChainingConfig>>;
};

// Error types specific to trip chaining
export type TripChainingErrorCode = 
  | 'CHAIN_NOT_FOUND'
  | 'CHAIN_FULL'
  | 'DRIVER_UNAVAILABLE'
  | 'TRIP_ALREADY_QUEUED'
  | 'QUEUE_EXPIRED'
  | 'INVALID_TRANSITION'
  | 'PROXIMITY_TOO_FAR'
  | 'TIME_CONFLICT'
  | 'VEHICLE_MISMATCH'
  | 'RATING_TOO_LOW';

export interface TripChainingError {
  code: TripChainingErrorCode;
  message: string;
  details?: {
    chainId?: string;
    tripId?: string;
    driverId?: string;
    queueEntryId?: string;
    [key: string]: any;
  };
}

// All validation schemas are already exported above