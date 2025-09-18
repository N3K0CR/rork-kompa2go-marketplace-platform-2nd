// ============================================================================
// 2KOMMUTE CONTEXT PROVIDER
// ============================================================================
// Modular context implementation for the 2Kommute module

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Platform } from 'react-native';
import createContextHook from '@nkzw/create-context-hook';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import types from the modular structure
import type {
  TransportMode,
  Route,
  Trip,
  TrackingPoint,
  CarbonFootprint,
  FeatureFlags,
  CommuteContextType,
  CommuteStorageData,
} from '../types';

// ============================================================================
// CONFIGURATION
// ============================================================================

const KOMMUTE_STORAGE_KEY = '@kommute_data';
const FEATURE_FLAGS_KEY = '@kommute_feature_flags';

const DEFAULT_FEATURE_FLAGS: FeatureFlags = {
  KOMMUTE_ENABLED: false, // CRITICAL: Disabled by default
  KOMMUTE_TEAM_FEATURES: false,
  KOMMUTE_CARBON_TRACKING: false,
  KOMMUTE_OFFLINE_MAPS: false,
  KOMMUTE_EXTERNAL_APIS: false,
};

const DEFAULT_TRANSPORT_MODES: TransportMode[] = [
  {
    id: 'walking',
    name: 'Caminar',
    icon: 'footprints',
    color: '#10B981',
    carbonFactor: 0,
    costFactor: 0,
    speedFactor: 5,
    available: true,
  },
  {
    id: 'cycling',
    name: 'Bicicleta',
    icon: 'bike',
    color: '#3B82F6',
    carbonFactor: 0,
    costFactor: 0,
    speedFactor: 15,
    available: true,
  },
  {
    id: 'car',
    name: 'Auto',
    icon: 'car',
    color: '#EF4444',
    carbonFactor: 0.21, // kg CO2 per km
    costFactor: 0.5, // cost per km
    speedFactor: 40,
    available: true,
  },
  {
    id: 'public_transport',
    name: 'Transporte Público',
    icon: 'bus',
    color: '#8B5CF6',
    carbonFactor: 0.05,
    costFactor: 0.1,
    speedFactor: 25,
    available: true,
  },
];

// ============================================================================
// STORAGE UTILITIES
// ============================================================================

const getStorageData = async (): Promise<CommuteStorageData | null> => {
  try {
    const data = await AsyncStorage.getItem(KOMMUTE_STORAGE_KEY);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('[CommuteContext] Error reading storage:', error);
    return null;
  }
};

const setStorageData = async (data: CommuteStorageData): Promise<void> => {
  try {
    if (!data || typeof data !== 'object') {
      console.error('[CommuteContext] Invalid data provided to setStorageData');
      return;
    }
    const serializedData = JSON.stringify(data);
    if (serializedData.length > 0) {
      await AsyncStorage.setItem(KOMMUTE_STORAGE_KEY, serializedData);
    }
  } catch (error) {
    console.error('[CommuteContext] Error writing storage:', error);
  }
};

const getFeatureFlags = async (): Promise<FeatureFlags> => {
  try {
    const flags = await AsyncStorage.getItem(FEATURE_FLAGS_KEY);
    return flags ? { ...DEFAULT_FEATURE_FLAGS, ...JSON.parse(flags) } : DEFAULT_FEATURE_FLAGS;
  } catch (error) {
    console.error('[CommuteContext] Error reading feature flags:', error);
    return DEFAULT_FEATURE_FLAGS;
  }
};

const setFeatureFlags = async (flags: Partial<FeatureFlags>): Promise<void> => {
  try {
    if (!flags || typeof flags !== 'object') {
      console.error('[CommuteContext] Invalid flags provided to setFeatureFlags');
      return;
    }
    const currentFlags = await getFeatureFlags();
    const updatedFlags = { ...currentFlags, ...flags };
    const serializedFlags = JSON.stringify(updatedFlags);
    if (serializedFlags.length > 0) {
      await AsyncStorage.setItem(FEATURE_FLAGS_KEY, serializedFlags);
    }
  } catch (error) {
    console.error('[CommuteContext] Error writing feature flags:', error);
  }
};

// ============================================================================
// LOCATION UTILITIES
// ============================================================================

const requestLocationPermissions = async (): Promise<boolean> => {
  try {
    if (Platform.OS === 'web') {
      return new Promise((resolve) => {
        if ('geolocation' in navigator) {
          navigator.geolocation.getCurrentPosition(
            () => resolve(true),
            () => resolve(false)
          );
        } else {
          resolve(false);
        }
      });
    } else {
      const { status } = await Location.requestForegroundPermissionsAsync();
      return status === 'granted';
    }
  } catch (error) {
    console.error('[CommuteContext] Error requesting location permissions:', error);
    return false;
  }
};

const getCurrentLocation = async (): Promise<{ latitude: number; longitude: number } | null> => {
  try {
    if (Platform.OS === 'web') {
      return new Promise((resolve) => {
        if ('geolocation' in navigator) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              resolve({
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
              });
            },
            () => resolve(null)
          );
        } else {
          resolve(null);
        }
      });
    } else {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
    }
  } catch (error) {
    console.error('[CommuteContext] Error getting current location:', error);
    return null;
  }
};

// ============================================================================
// MAIN COMMUTE CONTEXT
// ============================================================================

export const [CommuteContext, useCommute] = createContextHook((): CommuteContextType => {
  // State management
  const [featureFlags, setFeatureFlagsState] = useState<FeatureFlags>(DEFAULT_FEATURE_FLAGS);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [currentTrip, setCurrentTrip] = useState<Trip | null>(null);
  const [activeRoute, setActiveRoute] = useState<Route | null>(null);
  const [isTracking, setIsTracking] = useState<boolean>(false);
  const [currentLocation, setCurrentLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [hasLocationPermission, setHasLocationPermission] = useState<boolean>(false);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);

  // Transport modes (static for now, could be dynamic later)
  const transportModes = useMemo(() => DEFAULT_TRANSPORT_MODES, []);

  // ============================================================================
  // UTILITY FUNCTIONS
  // ============================================================================

  const calculateDistance = useCallback((points: TrackingPoint[]): number => {
    if (points.length < 2) return 0;
    
    let totalDistance = 0;
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      
      // Haversine formula for distance calculation
      const R = 6371000; // Earth's radius in meters
      const dLat = (curr.latitude - prev.latitude) * Math.PI / 180;
      const dLon = (curr.longitude - prev.longitude) * Math.PI / 180;
      const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(prev.latitude * Math.PI / 180) * Math.cos(curr.latitude * Math.PI / 180) *
                Math.sin(dLon/2) * Math.sin(dLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      const distance = R * c;
      
      totalDistance += distance;
    }
    
    return totalDistance;
  }, []);

  // ============================================================================
  // INITIALIZATION
  // ============================================================================

  const initializeCommute = useCallback(async () => {
    try {
      console.log('[CommuteContext] Initializing...');
      
      // Load feature flags
      const flags = await getFeatureFlags();
      setFeatureFlagsState(flags);
      
      // Only proceed if Kommute is enabled
      if (!flags.KOMMUTE_ENABLED) {
        console.log('[CommuteContext] Kommute is disabled, skipping initialization');
        setIsInitialized(true);
        return;
      }
      
      // Request location permissions
      const hasPermission = await requestLocationPermissions();
      setHasLocationPermission(hasPermission);
      
      // Load stored data
      const storedData = await getStorageData();
      if (storedData) {
        setRoutes(storedData.routes || []);
        setTrips(storedData.trips || []);
        console.log('[CommuteContext] Loaded stored data:', {
          routes: storedData.routes?.length || 0,
          trips: storedData.trips?.length || 0,
        });
      }
      
      // Get current location if permission granted
      if (hasPermission) {
        const location = await getCurrentLocation();
        setCurrentLocation(location);
      }
      
      setIsInitialized(true);
      console.log('[CommuteContext] Initialization complete');
    } catch (error) {
      console.error('[CommuteContext] Initialization error:', error);
      setIsInitialized(true); // Set to true even on error to prevent infinite loading
    }
  }, []);

  // Initialize on mount
  useEffect(() => {
    initializeCommute();
  }, [initializeCommute]);

  // ============================================================================
  // FEATURE FLAG MANAGEMENT
  // ============================================================================

  const updateFeatureFlags = useCallback(async (flags: Partial<FeatureFlags>) => {
    try {
      if (!flags || typeof flags !== 'object' || Object.keys(flags).length === 0) {
        console.error('[CommuteContext] Invalid flags provided to updateFeatureFlags');
        return;
      }
      await setFeatureFlags(flags);
      const updatedFlags = await getFeatureFlags();
      setFeatureFlagsState(updatedFlags);
      
      // If Kommute was just enabled, initialize
      if (flags.KOMMUTE_ENABLED && !featureFlags.KOMMUTE_ENABLED) {
        await initializeCommute();
      }
      
      console.log('[CommuteContext] Feature flags updated:', updatedFlags);
    } catch (error) {
      console.error('[CommuteContext] Error updating feature flags:', error);
    }
  }, [featureFlags.KOMMUTE_ENABLED, initializeCommute]);

  // ============================================================================
  // DATA PERSISTENCE
  // ============================================================================

  const saveData = useCallback(async (newRoutes?: Route[], newTrips?: Trip[]) => {
    try {
      const dataToSave: CommuteStorageData = {
        routes: newRoutes || routes,
        trips: newTrips || trips,
        preferences: {
          defaultTransportModes: ['walking', 'cycling'],
          carbonTrackingEnabled: featureFlags.KOMMUTE_CARBON_TRACKING,
          teamTransportEnabled: featureFlags.KOMMUTE_TEAM_FEATURES,
        },
        lastSync: new Date(),
      };
      
      await setStorageData(dataToSave);
      console.log('[CommuteContext] Data saved successfully');
    } catch (error) {
      console.error('[CommuteContext] Error saving data:', error);
    }
  }, [routes, trips, featureFlags]);

  // Auto-save when data changes
  useEffect(() => {
    if (isInitialized && featureFlags.KOMMUTE_ENABLED) {
      saveData();
    }
  }, [routes, trips, isInitialized, featureFlags.KOMMUTE_ENABLED, saveData]);

  // ============================================================================
  // ROUTE MANAGEMENT
  // ============================================================================

  const createRoute = useCallback(async (routeData: Omit<Route, 'id' | 'createdAt' | 'updatedAt'>): Promise<Route> => {
    const newRoute: Route = {
      ...routeData,
      id: `route_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    const updatedRoutes = [...routes, newRoute];
    setRoutes(updatedRoutes);
    
    console.log('[CommuteContext] Route created:', newRoute.id);
    return newRoute;
  }, [routes]);

  const updateRoute = useCallback(async (routeId: string, updates: Partial<Route>): Promise<void> => {
    const updatedRoutes = routes.map(route => 
      route.id === routeId 
        ? { ...route, ...updates, updatedAt: new Date() }
        : route
    );
    
    setRoutes(updatedRoutes);
    console.log('[CommuteContext] Route updated:', routeId);
  }, [routes]);

  const deleteRoute = useCallback(async (routeId: string): Promise<void> => {
    const updatedRoutes = routes.filter(route => route.id !== routeId);
    setRoutes(updatedRoutes);
    
    // Also remove any trips associated with this route
    const updatedTrips = trips.filter(trip => trip.routeId !== routeId);
    setTrips(updatedTrips);
    
    console.log('[CommuteContext] Route deleted:', routeId);
  }, [routes, trips]);

  // ============================================================================
  // TRIP MANAGEMENT
  // ============================================================================

  const startTrip = useCallback(async (routeId: string): Promise<void> => {
    try {
      const route = routes.find(r => r.id === routeId);
      if (!route) {
        throw new Error('Route not found');
      }
      
      const newTrip: Trip = {
        id: `trip_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        routeId,
        userId: 'current_user', // This should come from AuthContext
        startTime: new Date(),
        status: 'in_progress',
        trackingPoints: [],
      };
      
      setCurrentTrip(newTrip);
      setActiveRoute(route);
      setIsTracking(true);
      
      const updatedTrips = [...trips, newTrip];
      setTrips(updatedTrips);
      
      console.log('[CommuteContext] Trip started:', newTrip.id);
    } catch (error) {
      console.error('[CommuteContext] Error starting trip:', error);
      throw error;
    }
  }, [routes, trips]);

  const endTrip = useCallback(async (tripId: string): Promise<void> => {
    try {
      const updatedTrips = trips.map(trip => 
        trip.id === tripId 
          ? { 
              ...trip, 
              endTime: new Date(), 
              status: 'completed' as const,
              actualDistance: trip.trackingPoints.length > 0 ? calculateDistance(trip.trackingPoints) : undefined,
              actualDuration: trip.startTime ? Date.now() - trip.startTime.getTime() : undefined,
            }
          : trip
      );
      
      setTrips(updatedTrips);
      setCurrentTrip(null);
      setActiveRoute(null);
      setIsTracking(false);
      
      console.log('[CommuteContext] Trip ended:', tripId);
    } catch (error) {
      console.error('[CommuteContext] Error ending trip:', error);
      throw error;
    }
  }, [trips, calculateDistance]);

  const updateLocation = useCallback((point: Omit<TrackingPoint, 'id' | 'tripId'>) => {
    if (!currentTrip || !isTracking) return;
    
    const trackingPoint: TrackingPoint = {
      ...point,
      id: `point_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      tripId: currentTrip.id,
    };
    
    const updatedTrip = {
      ...currentTrip,
      trackingPoints: [...currentTrip.trackingPoints, trackingPoint],
    };
    
    setCurrentTrip(updatedTrip);
    setCurrentLocation({ latitude: point.latitude, longitude: point.longitude });
    
    // Update trips array
    const updatedTrips = trips.map(trip => 
      trip.id === currentTrip.id ? updatedTrip : trip
    );
    setTrips(updatedTrips);
  }, [currentTrip, isTracking, trips]);

  // ============================================================================
  // CONTEXT VALUE
  // ============================================================================

  return {
    // Core TransportContextType properties
    isEnabled: featureFlags.KOMMUTE_ENABLED,
    currentTrip,
    activeRoute,
    transportModes,
    isTracking,
    startTrip,
    endTrip,
    updateLocation,
    
    // Extended properties
    featureFlags,
    updateFeatureFlags,
    routes,
    trips,
    createRoute,
    updateRoute,
    deleteRoute,
    currentLocation,
    hasLocationPermission,
    isInitialized,
    calculateDistance,
  };
});

export default CommuteContext;