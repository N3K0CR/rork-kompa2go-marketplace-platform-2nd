import React from "react";
// ============================================================================
// 2KOMMUTE CONTEXT TYPES
// ============================================================================
// Type definitions for React contexts and hooks

import type {
  TransportMode,
  Route,
  Trip,
  TrackingPoint,
  CarbonFootprint,
  FeatureFlags,
  CurrentLocation,
  CommuteStatus,
} from './core-types';

// Main transport context interface
export interface TransportContextType {
  // Core state
  isEnabled: boolean;
  currentTrip: Trip | null;
  activeRoute: Route | null;
  transportModes: TransportMode[];
  isTracking: boolean;
  
  // Actions
  startTrip: (routeId: string) => Promise<void>;
  endTrip: (tripId: string) => Promise<void>;
  updateLocation: (point: Omit<TrackingPoint, 'id' | 'tripId'>) => void;
}

// Route management context interface
export interface RouteContextType {
  createRoute: (route: Omit<Route, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Route>;
  updateRoute: (routeId: string, updates: Partial<Route>) => Promise<void>;
  deleteRoute: (routeId: string) => Promise<void>;
  optimizeRoute: (routeId: string) => Promise<Route>;
}

// Carbon footprint context interface
export interface CarbonFootprintContextType {
  currentFootprint: CarbonFootprint | null;
  isLoading: boolean;
  calculateFootprint: (period: { startDate: Date; endDate: Date }) => Promise<CarbonFootprint>;
  getComparison: (period: string) => Promise<{ current: number; previous: number; average: number }>;
  setTarget: (target: number) => Promise<void>;
}

// Location tracking context interface
export interface LocationTrackingContextType {
  currentLocation: CurrentLocation | null;
  hasPermission: boolean;
  isTracking: boolean;
  accuracy: 'high' | 'medium' | 'low';
  requestPermission: () => Promise<boolean>;
  startTracking: () => Promise<void>;
  stopTracking: () => Promise<void>;
  updateLocation: (location: CurrentLocation) => void;
}

// Team transport context interface (for future implementation)
export interface TeamTransportContextType {
  teams: any[]; // Will be properly typed when implemented
  currentTeam: any | null;
  isLoading: boolean;
  createTeam: (team: any) => Promise<any>;
  joinTeam: (teamId: string) => Promise<void>;
  leaveTeam: (teamId: string) => Promise<void>;
}

// Analytics context interface
export interface TransportAnalyticsContextType {
  analytics: any | null; // Will be properly typed when implemented
  isLoading: boolean;
  refreshAnalytics: () => Promise<void>;
  getInsights: (period: string) => Promise<any>;
}

// Offline maps context interface (for future implementation)
export interface OfflineMapsContextType {
  downloadedMaps: string[];
  isDownloading: boolean;
  downloadProgress: number;
  downloadMap: (region: string) => Promise<void>;
  deleteMap: (region: string) => Promise<void>;
  isMapAvailable: (region: string) => boolean;
}

// Combined context type for the main CommuteContext
export interface CommuteContextType extends TransportContextType {
  // Feature flags
  featureFlags: FeatureFlags;
  updateFeatureFlags: (flags: Partial<FeatureFlags>) => Promise<void>;
  
  // Data management
  routes: Route[];
  trips: Trip[];
  
  // Route operations
  createRoute: (route: Omit<Route, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Route>;
  updateRoute: (routeId: string, updates: Partial<Route>) => Promise<void>;
  deleteRoute: (routeId: string) => Promise<void>;
  
  // Location and permissions
  currentLocation: CurrentLocation | null;
  hasLocationPermission: boolean;
  
  // Initialization state
  isInitialized: boolean;
  
  // Utility functions
  calculateDistance: (points: TrackingPoint[]) => number;
}

// Hook return types
export interface UseRoutesReturn extends RouteContextType {
  routes: Route[];
  isLoading: boolean;
}

export interface UseCarbonFootprintReturn extends CarbonFootprintContextType {
  // Additional properties specific to the hook
}

export interface UseKommuteAdminReturn {
  featureFlags: FeatureFlags;
  enableKommute: () => Promise<void>;
  disableKommute: () => Promise<void>;
  toggleFeature: (feature: keyof FeatureFlags) => Promise<void>;
  updateFeatureFlags: (flags: Partial<FeatureFlags>) => Promise<void>;
}

// Storage and persistence types
export interface CommuteStorageData {
  routes: Route[];
  trips: Trip[];
  preferences: {
    defaultTransportModes: string[];
    homeLocation?: { latitude: number; longitude: number; address: string };
    workLocation?: { latitude: number; longitude: number; address: string };
    carbonTrackingEnabled: boolean;
    teamTransportEnabled: boolean;
  };
  lastSync: Date;
}

// Configuration types
export interface CommuteConfig {
  storageKey: string;
  featureFlagsKey: string;
  defaultFeatureFlags: FeatureFlags;
  defaultTransportModes: TransportMode[];
  locationAccuracy: 'high' | 'medium' | 'low';
  trackingInterval: number; // milliseconds
  maxTrackingPoints: number;
}

// Event handler types
export type CommuteEventHandler<T = any> = (event: T) => void | Promise<void>;
export type LocationUpdateHandler = CommuteEventHandler<CurrentLocation>;
export type TripEventHandler = CommuteEventHandler<{ trip: Trip; event: string }>;
export type RouteEventHandler = CommuteEventHandler<{ route: Route; event: string }>;

// Provider props types
export interface CommuteProviderProps {
  children: React.ReactNode;
  config?: Partial<CommuteConfig>;
  onError?: (error: Error) => void;
}

export interface LocationProviderProps {
  children: React.ReactNode;
  accuracy?: 'high' | 'medium' | 'low';
  trackingInterval?: number;
  onLocationUpdate?: LocationUpdateHandler;
}

// State management types
export interface CommuteState {
  status: CommuteStatus;
  featureFlags: FeatureFlags;
  routes: Route[];
  trips: Trip[];
  currentTrip: Trip | null;
  activeRoute: Route | null;
  currentLocation: CurrentLocation | null;
  isTracking: boolean;
  hasLocationPermission: boolean;
  isInitialized: boolean;
  error: Error | null;
}

export type CommuteAction = 
  | { type: 'SET_FEATURE_FLAGS'; payload: FeatureFlags }
  | { type: 'SET_ROUTES'; payload: Route[] }
  | { type: 'ADD_ROUTE'; payload: Route }
  | { type: 'UPDATE_ROUTE'; payload: { id: string; updates: Partial<Route> } }
  | { type: 'DELETE_ROUTE'; payload: string }
  | { type: 'SET_TRIPS'; payload: Trip[] }
  | { type: 'ADD_TRIP'; payload: Trip }
  | { type: 'UPDATE_TRIP'; payload: { id: string; updates: Partial<Trip> } }
  | { type: 'SET_CURRENT_TRIP'; payload: Trip | null }
  | { type: 'SET_ACTIVE_ROUTE'; payload: Route | null }
  | { type: 'SET_CURRENT_LOCATION'; payload: CurrentLocation | null }
  | { type: 'SET_TRACKING'; payload: boolean }
  | { type: 'SET_LOCATION_PERMISSION'; payload: boolean }
  | { type: 'SET_INITIALIZED'; payload: boolean }
  | { type: 'SET_ERROR'; payload: Error | null }
  | { type: 'SET_STATUS'; payload: CommuteStatus };