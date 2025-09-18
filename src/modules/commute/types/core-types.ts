// ============================================================================
// 2KOMMUTE CORE TYPES
// ============================================================================
// Core type definitions shared across the 2Kommute module

// Transport mode definition
export interface TransportMode {
  id: string;
  name: string;
  icon: string;
  color: string;
  carbonFactor: number; // kg CO2 per km
  costFactor: number; // cost per km
  speedFactor: number; // average speed in km/h
  available: boolean;
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
  | 'team_notification';

export interface CommuteEvent {
  id: string;
  type: CommuteEventType;
  userId: string;
  tripId?: string;
  teamId?: string;
  data: Record<string, any>;
  timestamp: Date;
  priority: 'low' | 'medium' | 'high' | 'critical';
}