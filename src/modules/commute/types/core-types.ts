// ============================================================================
// 2KOMMUTE CORE TYPES
// ============================================================================
// Core type definitions shared across the 2Kommute module

// Transport mode definition (Kommute vehicle types)
export type KommuteVehicleType = 'kommute-4' | 'kommute-large';

export interface TransportMode {
  id: KommuteVehicleType;
  name: string;
  icon: string;
  color: string;
  capacity: number; // number of passengers
  carbonFactor: number; // kg CO2 per km
  costFactor: number; // cost per km
  speedFactor: number; // average speed in km/h
  available: boolean;
  description: string;
}

// Location and route point types
export interface RoutePoint {
  id: string;
  latitude: number;
  longitude: number;
  address: string;
  name?: string;
  type: 'origin' | 'destination' | 'waypoint';
  estimatedArrival?: Date;
  actualArrival?: Date;
}

export interface TrackingPoint {
  id: string;
  tripId: string;
  latitude: number;
  longitude: number;
  timestamp: Date;
  speed?: number;
  accuracy?: number;
  altitude?: number;
}

// Route definition
export interface Route {
  id: string;
  userId: string;
  name: string;
  points: RoutePoint[];
  transportModes: TransportMode[];
  distance: number; // in meters
  duration: number; // in seconds
  estimatedCost: number;
  carbonFootprint: number;
  status: 'planned' | 'active' | 'completed' | 'cancelled';
  isRecurring: boolean;
  recurringPattern?: {
    type: 'daily' | 'weekly' | 'monthly';
    daysOfWeek?: number[]; // 0-6, Sunday = 0
    startDate: Date;
    endDate?: Date;
    exceptions?: Date[];
  };
  createdAt: Date;
  updatedAt: Date;
}

// Trip definition
export interface Trip {
  id: string;
  routeId: string;
  userId: string;
  startTime: Date;
  endTime?: Date;
  actualDistance?: number;
  actualDuration?: number;
  actualCost?: number;
  actualCarbonFootprint?: number;
  status: 'planned' | 'in_progress' | 'completed' | 'cancelled';
  trackingPoints: TrackingPoint[];
  notes?: string;
  // Trip chaining properties
  chainId?: string;
  previousTripId?: string;
  nextTripId?: string;
  isChainedTrip?: boolean;
}

// Carbon footprint tracking
export interface CarbonFootprint {
  id: string;
  userId: string;
  period: 'daily' | 'weekly' | 'monthly' | 'yearly';
  startDate: Date;
  endDate: Date;
  totalEmissions: number; // kg CO2
  transportBreakdown: {
    transportModeId: string;
    emissions: number;
    distance: number;
    trips: number;
  }[];
  comparisonData?: {
    previousPeriod: number;
    average: number;
    target?: number;
  };
}

// Team transport (for future implementation)
export interface TeamTransport {
  id: string;
  name: string;
  description?: string;
  adminId: string;
  members: {
    userId: string;
    role: 'admin' | 'member';
    joinedAt: Date;
    preferences: {
      canDrive: boolean;
      hasVehicle: boolean;
      vehicleCapacity?: number;
      preferredTransportModes: string[];
    };
  }[];
  routes: Route[];
  settings: {
    allowCarpooling: boolean;
    maxDetourDistance: number;
    costSharingEnabled: boolean;
    carbonTrackingEnabled: boolean;
    notificationsEnabled: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

// Feature flags for gradual rollout
export interface FeatureFlags {
  KOMMUTE_ENABLED: boolean;
  KOMMUTE_TEAM_FEATURES: boolean;
  KOMMUTE_CARBON_TRACKING: boolean;
  KOMMUTE_OFFLINE_MAPS: boolean;
  KOMMUTE_EXTERNAL_APIS: boolean;
}

// Location and permissions
export interface LocationPermissions {
  granted: boolean;
  accuracy: 'high' | 'medium' | 'low';
  backgroundTracking: boolean;
}

export interface CurrentLocation {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp: Date;
}

// Analytics and insights
export interface TripAnalytics {
  totalTrips: number;
  totalDistance: number;
  totalDuration: number;
  totalCost: number;
  totalCarbonFootprint: number;
  averageSpeed: number;
  mostUsedTransportMode: string;
  carbonSavings: number;
  costSavings: number;
}

export interface RouteOptimization {
  originalRoute: Route;
  optimizedRoute: Route;
  improvements: {
    distanceSaved: number;
    timeSaved: number;
    costSaved: number;
    carbonSaved: number;
  };
  confidence: number;
}

// Error handling
export interface CommuteError {
  code: string;
  message: string;
  details?: Record<string, any>;
}

// ============================================================================
// TRIP CHAINING TYPES
// ============================================================================

// Trip chain status
export type TripChainStatus = 'active' | 'completed' | 'cancelled' | 'paused';

// Trip queue entry status
export type TripQueueStatus = 'queued' | 'matched' | 'expired' | 'cancelled';

// Trip chain definition
export interface TripChain {
  id: string;
  driverId: string;
  trips: Trip[];
  status: TripChainStatus;
  totalDistance: number; // in meters
  totalDuration: number; // in seconds
  totalEarnings: number; // in currency units
  maxChainLength?: number;
  targetDestination?: RoutePoint;
  createdAt: Date;
  updatedAt: Date;
  metadata?: {
    averageRating?: number;
    completionRate?: number;
    preferredAreas?: string[];
    driverNotes?: string;
  };
}

// Trip queue entry for matching
export interface TripQueueEntry {
  id: string;
  tripId: string;
  passengerId: string;
  pickupLocation: {
    latitude: number;
    longitude: number;
    address: string;
  };
  dropoffLocation: {
    latitude: number;
    longitude: number;
    address: string;
  };
  requestedTime: Date;
  maxWaitTime: number; // in seconds
  priority: number; // 1-10, higher is more priority
  estimatedFare: number;
  status: TripQueueStatus;
  createdAt: Date;
  expiresAt: Date;
  requirements?: {
    vehicleType?: string;
    accessibility?: boolean;
    childSeat?: boolean;
    petFriendly?: boolean;
  };
  passengerPreferences?: {
    maxDetour?: number; // in meters
    shareRide?: boolean;
    preferredDriverRating?: number;
  };
}

// Trip chaining configuration
export interface TripChainingConfig {
  enabled: boolean;
  maxChainLength: number;
  proximityRadius: number; // in meters
  advanceNoticeTime: number; // in seconds (e.g., 300 for 5 minutes)
  maxWaitTime: number; // in seconds
  minTripGap: number; // minimum time between trips in seconds
  allowedTransitionTime: number; // max time to get to next pickup
  priorityWeights: {
    distance: number;
    fare: number;
    rating: number;
    waitTime: number;
  };
}

// Driver availability for chaining
export interface DriverAvailability {
  driverId: string;
  currentTripId?: string;
  currentLocation: {
    latitude: number;
    longitude: number;
    timestamp: Date;
  };
  estimatedCompletionTime?: Date;
  isAcceptingChainedTrips: boolean;
  maxChainLength: number;
  preferredAreas?: {
    latitude: number;
    longitude: number;
    radius: number;
  }[];
  targetDestination?: {
    latitude: number;
    longitude: number;
    address: string;
    arrivalBy?: Date;
  };
  vehicleInfo: {
    type: string;
    capacity: number;
    accessibility: boolean;
    petFriendly: boolean;
  };
  driverRating: number;
  completedTripsToday: number;
  earningsToday: number;
}

// Trip matching result
export interface TripMatch {
  id: string;
  driverId: string;
  queueEntryId: string;
  tripId: string;
  confidence: number; // 0-1
  estimatedPickupTime: Date;
  estimatedTransitionTime: number; // seconds from current trip end to pickup
  distanceToPickup: number; // in meters
  matchScore: number; // calculated score based on various factors
  reasons: string[]; // why this match was suggested
  warnings?: string[]; // potential issues with this match
  createdAt: Date;
  expiresAt: Date;
}

// Trip chaining analytics
export interface TripChainingAnalytics {
  driverId: string;
  period: {
    startDate: Date;
    endDate: Date;
  };
  totalChains: number;
  completedChains: number;
  averageChainLength: number;
  totalChainedTrips: number;
  chainCompletionRate: number;
  averageTransitionTime: number;
  totalEarningsFromChains: number;
  efficiencyMetrics: {
    deadMileageReduction: number; // percentage
    timeUtilization: number; // percentage
    fuelSavings: number; // estimated
  };
  topPerformingAreas: {
    area: string;
    chainCount: number;
    averageEarnings: number;
  }[];
}

// Utility types
export type CommuteStatus = 'idle' | 'loading' | 'tracking' | 'error';
export type TripStatus = Trip['status'];
export type RouteStatus = Route['status'];
export type TransportModeId = TransportMode['id'];

// Event types for real-time updates
export type CommuteEventType = 
  | 'trip_started'
  | 'trip_ended'
  | 'location_update'
  | 'route_deviation'
  | 'delay_detected'
  | 'match_found'
  | 'match_cancelled'
  | 'emergency_alert'
  | 'team_notification'
  | 'trip_chain_started'
  | 'trip_chain_completed'
  | 'next_trip_accepted'
  | 'trip_queue_updated'
  | 'proximity_match_found';

export interface CommuteEvent {
  id: string;
  type: CommuteEventType;
  userId: string;
  tripId?: string;
  teamId?: string;
  chainId?: string;
  data: Record<string, any>;
  timestamp: Date;
  priority: 'low' | 'medium' | 'high' | 'critical';
}