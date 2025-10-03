// ============================================================================
// 2KOMMUTE CONTEXT PROVIDER
// ============================================================================
// Modular context implementation for the 2Kommute module

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Platform } from 'react-native';
import createContextHook from '@nkzw/create-context-hook';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  withErrorRecovery, 
  handleStorageError, 
  globalErrorRecovery 
} from '../utils/error-recovery';
import firestoreService from '../services/firestore-service';
import { auth } from '@/lib/firebase';

// Import types from the modular structure
import type {
  TransportMode,
  Route,
  Trip,
  TrackingPoint,

  FeatureFlags,
} from '../types/core-types';

// Define context types locally to avoid circular dependencies
interface CommuteContextType {
  isEnabled: boolean;
  currentTrip: Trip | null;
  activeRoute: Route | null;
  transportModes: TransportMode[];
  isTracking: boolean;
  startTrip: (routeId: string) => Promise<void>;
  endTrip: (tripId: string) => Promise<void>;
  updateLocation: (point: Omit<TrackingPoint, 'id' | 'tripId'>) => void;
  featureFlags: FeatureFlags;
  updateFeatureFlags: (flags: Partial<FeatureFlags>) => Promise<void>;
  routes: Route[];
  trips: Trip[];
  createRoute: (route: Omit<Route, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Route>;
  updateRoute: (routeId: string, updates: Partial<Route>) => Promise<void>;
  deleteRoute: (routeId: string) => Promise<void>;
  currentLocation: { latitude: number; longitude: number } | null;
  hasLocationPermission: boolean;
  isInitialized: boolean;
  calculateDistance: (points: TrackingPoint[]) => number;
  resetContext: () => Promise<void>;
  getErrorHistory: () => any[];
  clearErrorHistory: () => Promise<void>;
}

interface CommuteStorageData {
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

// ============================================================================
// CONFIGURATION
// ============================================================================

const KOMMUTE_STORAGE_KEY = '@kommute_data';
const FEATURE_FLAGS_KEY = '@kommute_feature_flags';
const USE_FIRESTORE = true;

const DEFAULT_FEATURE_FLAGS: FeatureFlags = {
  KOMMUTE_ENABLED: false, // CRITICAL: Disabled by default
  KOMMUTE_TEAM_FEATURES: false,
  KOMMUTE_CARBON_TRACKING: false,
  KOMMUTE_OFFLINE_MAPS: false,
  KOMMUTE_EXTERNAL_APIS: false,
};

const DEFAULT_TRANSPORT_MODES: TransportMode[] = [
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
];

// ============================================================================
// STORAGE UTILITIES
// ============================================================================

const getStorageData = async (): Promise<CommuteStorageData | null> => {
  return await handleStorageError(
    new Error('Storage operation'),
    { 
      component: 'CommuteContext', 
      operation: 'get_storage',
      additionalData: { storageKey: KOMMUTE_STORAGE_KEY }
    },
    null
  ).catch(async () => {
    try {
      const data = await AsyncStorage.getItem(KOMMUTE_STORAGE_KEY);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('[CommuteContext] Error reading storage:', error);
      return null;
    }
  });
};

const setStorageData = async (data: CommuteStorageData): Promise<void> => {
  await withErrorRecovery(
    async () => {
      if (!data || typeof data !== 'object') {
        console.error('[CommuteContext] Invalid data provided to setStorageData');
        return;
      }
      const serializedData = JSON.stringify(data);
      if (serializedData.length > 0) {
        await AsyncStorage.setItem(KOMMUTE_STORAGE_KEY, serializedData);
      }
      return { success: true };
    },
    { 
      component: 'CommuteContext', 
      operation: 'set_storage',
      additionalData: { storageKey: KOMMUTE_STORAGE_KEY }
    }
  );
};

const getFeatureFlags = async (): Promise<FeatureFlags> => {
  return await withErrorRecovery(
    async () => {
      const flags = await AsyncStorage.getItem(FEATURE_FLAGS_KEY);
      return flags ? { ...DEFAULT_FEATURE_FLAGS, ...JSON.parse(flags) } : DEFAULT_FEATURE_FLAGS;
    },
    { 
      component: 'CommuteContext', 
      operation: 'get_feature_flags',
      additionalData: { storageKey: FEATURE_FLAGS_KEY }
    },
    DEFAULT_FEATURE_FLAGS
  ) || DEFAULT_FEATURE_FLAGS;
};

const setFeatureFlags = async (flags: Partial<FeatureFlags>): Promise<void> => {
  await withErrorRecovery(
    async () => {
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
      return { success: true };
    },
    { 
      component: 'CommuteContext', 
      operation: 'set_feature_flags',
      additionalData: { storageKey: FEATURE_FLAGS_KEY }
    }
  );
};

// ============================================================================
// LOCATION UTILITIES
// ============================================================================

const requestLocationPermissions = async (): Promise<boolean> => {
  return await withErrorRecovery(
    async () => {
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
    },
    { 
      component: 'CommuteContext', 
      operation: 'request_location_permissions'
    },
    false
  ) || false;
};

const getCurrentLocation = async (): Promise<{ latitude: number; longitude: number } | null> => {
  return await withErrorRecovery(
    async () => {
      if (Platform.OS === 'web') {
        return new Promise<{ latitude: number; longitude: number } | null>((resolve) => {
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
    },
    { 
      component: 'CommuteContext', 
      operation: 'get_current_location'
    },
    null
  );
};

// ============================================================================
// MAIN COMMUTE CONTEXT
// ============================================================================

const contextHook = createContextHook((): CommuteContextType => {
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
    await withErrorRecovery(
      async () => {
        console.log('[CommuteContext] Initializing...');
        
        // Load feature flags with error recovery
        const flags = await withErrorRecovery(
          () => getFeatureFlags(),
          { component: 'CommuteContext', operation: 'load_feature_flags' },
          DEFAULT_FEATURE_FLAGS
        );
        
        if (flags) {
          setFeatureFlagsState(flags);
        }
        
        // Only proceed if Kommute is enabled
        if (!flags?.KOMMUTE_ENABLED) {
          console.log('[CommuteContext] Kommute is disabled, skipping initialization');
          setIsInitialized(true);
          return { success: true, disabled: true };
        }
        
        // Request location permissions with error recovery
        const hasPermission = await withErrorRecovery(
          () => requestLocationPermissions(),
          { component: 'CommuteContext', operation: 'location_permissions' },
          false
        );
        
        setHasLocationPermission(hasPermission || false);
        
        if (USE_FIRESTORE) {
          const currentUser = auth.currentUser;
          
          if (!currentUser) {
            console.log('[CommuteContext] No authenticated user, skipping Firestore sync');
            console.log('[CommuteContext] To use Firestore features, please authenticate first');
          } else {
            const userId = currentUser.uid;
            console.log('[CommuteContext] Setting up Firestore subscriptions for user:', userId);
            
            try {
              const unsubscribeRoutes = firestoreService.routes.subscribeToUserRoutes(userId, (firestoreRoutes) => {
                setRoutes(firestoreRoutes);
                console.log('[CommuteContext] Routes synced from Firestore:', firestoreRoutes.length);
              });
              
              const unsubscribeTrips = firestoreService.trips.subscribeToUserTrips(userId, (firestoreTrips) => {
                setTrips(firestoreTrips);
                console.log('[CommuteContext] Trips synced from Firestore:', firestoreTrips.length);
              });
              
              return () => {
                unsubscribeRoutes();
                unsubscribeTrips();
              };
            } catch (error) {
              console.error('[CommuteContext] Error setting up Firestore subscriptions:', error);
            }
          }
        } else {
          const storedData = await withErrorRecovery(
            () => getStorageData(),
            { 
              component: 'CommuteContext', 
              operation: 'load_storage',
              additionalData: { storageKey: KOMMUTE_STORAGE_KEY }
            },
            null
          );
          
          if (storedData) {
            setRoutes(storedData.routes || []);
            setTrips(storedData.trips || []);
            console.log('[CommuteContext] Loaded stored data:', {
              routes: storedData.routes?.length || 0,
              trips: storedData.trips?.length || 0,
            });
          }
        }
        
        // Get current location if permission granted
        if (hasPermission) {
          const location = await withErrorRecovery(
            () => getCurrentLocation(),
            { component: 'CommuteContext', operation: 'get_location' },
            null
          );
          setCurrentLocation(location);
        }
        
        setIsInitialized(true);
        console.log('[CommuteContext] Initialization complete');
        return { success: true };
      },
      { component: 'CommuteContext', operation: 'initialization' },
      { success: false }
    );

    // Ensure initialization is marked complete even if recovery fails
    if (!isInitialized) {
      setIsInitialized(true);
    }
  }, [isInitialized]);

  // Initialize on mount
  useEffect(() => {
    initializeCommute();
  }, [initializeCommute]);

  // ============================================================================
  // FEATURE FLAG MANAGEMENT
  // ============================================================================

  const updateFeatureFlags = useCallback(async (flags: Partial<FeatureFlags>) => {
    await withErrorRecovery(
      async () => {
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
        return updatedFlags;
      },
      { 
        component: 'CommuteContext', 
        operation: 'update_feature_flags',
        additionalData: { flags }
      }
    );
  }, [featureFlags.KOMMUTE_ENABLED, initializeCommute]);

  // ============================================================================
  // DATA PERSISTENCE
  // ============================================================================

  const saveData = useCallback(async (newRoutes?: Route[], newTrips?: Trip[]) => {
    await withErrorRecovery(
      async () => {
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
        return dataToSave;
      },
      { 
        component: 'CommuteContext', 
        operation: 'save_data',
        additionalData: { storageKey: KOMMUTE_STORAGE_KEY }
      }
    );
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
    
    if (USE_FIRESTORE) {
      await firestoreService.routes.create(newRoute);
    }
    
    const updatedRoutes = [...routes, newRoute];
    setRoutes(updatedRoutes);
    
    console.log('[CommuteContext] Route created:', newRoute.id);
    return newRoute;
  }, [routes]);

  const updateRoute = useCallback(async (routeId: string, updates: Partial<Route>): Promise<void> => {
    const updatedData = { ...updates, updatedAt: new Date() };
    
    if (USE_FIRESTORE) {
      await firestoreService.routes.update(routeId, updatedData);
    }
    
    const updatedRoutes = routes.map(route => 
      route.id === routeId 
        ? { ...route, ...updatedData }
        : route
    );
    
    setRoutes(updatedRoutes);
    console.log('[CommuteContext] Route updated:', routeId);
  }, [routes]);

  const deleteRoute = useCallback(async (routeId: string): Promise<void> => {
    if (USE_FIRESTORE) {
      await firestoreService.routes.delete(routeId);
    }
    
    const updatedRoutes = routes.filter(route => route.id !== routeId);
    setRoutes(updatedRoutes);
    
    const updatedTrips = trips.filter(trip => trip.routeId !== routeId);
    setTrips(updatedTrips);
    
    console.log('[CommuteContext] Route deleted:', routeId);
  }, [routes, trips]);

  // ============================================================================
  // TRIP MANAGEMENT
  // ============================================================================

  const startTrip = useCallback(async (routeId: string): Promise<void> => {
    const result = await withErrorRecovery(
      async () => {
        const route = routes.find(r => r.id === routeId);
        if (!route) {
          throw new Error('Route not found');
        }
        
        const currentUser = auth.currentUser;
        const userId = currentUser ? currentUser.uid : 'anonymous_user';
        
        const newTrip: Trip = {
          id: `trip_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          routeId,
          userId,
          startTime: new Date(),
          status: 'in_progress',
          trackingPoints: [],
        };
        
        if (USE_FIRESTORE) {
          await firestoreService.trips.create(newTrip);
        }
        
        setCurrentTrip(newTrip);
        setActiveRoute(route);
        setIsTracking(true);
        
        const updatedTrips = [...trips, newTrip];
        setTrips(updatedTrips);
        
        console.log('[CommuteContext] Trip started:', newTrip.id);
        return newTrip;
      },
      { 
        component: 'CommuteContext', 
        operation: 'start_trip',
        additionalData: { routeId }
      }
    );

    if (!result) {
      throw new Error('Failed to start trip after error recovery');
    }
  }, [routes, trips]);

  const endTrip = useCallback(async (tripId: string): Promise<void> => {
    const result = await withErrorRecovery(
      async () => {
        const trip = trips.find(t => t.id === tripId);
        if (!trip) {
          throw new Error('Trip not found');
        }
        
        const updates = {
          endTime: new Date(),
          status: 'completed' as const,
          actualDistance: trip.trackingPoints.length > 0 ? calculateDistance(trip.trackingPoints) : undefined,
          actualDuration: trip.startTime ? Date.now() - trip.startTime.getTime() : undefined,
        };
        
        if (USE_FIRESTORE) {
          await firestoreService.trips.update(tripId, updates);
        }
        
        const updatedTrips = trips.map(t => 
          t.id === tripId ? { ...t, ...updates } : t
        );
        
        setTrips(updatedTrips);
        setCurrentTrip(null);
        setActiveRoute(null);
        setIsTracking(false);
        
        console.log('[CommuteContext] Trip ended:', tripId);
        return { success: true };
      },
      { 
        component: 'CommuteContext', 
        operation: 'end_trip',
        additionalData: { tripId }
      }
    );

    if (!result) {
      throw new Error('Failed to end trip after error recovery');
    }
  }, [trips, calculateDistance]);

  const updateLocation = useCallback(async (point: Omit<TrackingPoint, 'id' | 'tripId'>) => {
    if (!currentTrip || !isTracking) return;
    
    const trackingPoint: TrackingPoint = {
      ...point,
      id: `point_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      tripId: currentTrip.id,
    };
    
    if (USE_FIRESTORE) {
      await firestoreService.tracking.addPoint(trackingPoint);
    }
    
    const updatedTrip = {
      ...currentTrip,
      trackingPoints: [...currentTrip.trackingPoints, trackingPoint],
    };
    
    if (USE_FIRESTORE) {
      await firestoreService.trips.update(currentTrip.id, {
        trackingPoints: updatedTrip.trackingPoints,
      });
    }
    
    setCurrentTrip(updatedTrip);
    setCurrentLocation({ latitude: point.latitude, longitude: point.longitude });
    
    const updatedTrips = trips.map(trip => 
      trip.id === currentTrip.id ? updatedTrip : trip
    );
    setTrips(updatedTrips);
  }, [currentTrip, isTracking, trips]);

  // ============================================================================
  // ERROR RECOVERY FUNCTIONS
  // ============================================================================

  const resetContext = useCallback(async (): Promise<void> => {
    await withErrorRecovery(
      async () => {
        console.log('[CommuteContext] Resetting context...');
        
        // Clear all state
        setFeatureFlagsState(DEFAULT_FEATURE_FLAGS);
        setRoutes([]);
        setTrips([]);
        setCurrentTrip(null);
        setActiveRoute(null);
        setIsTracking(false);
        setCurrentLocation(null);
        setHasLocationPermission(false);
        setIsInitialized(false);
        
        // Clear storage
        await AsyncStorage.multiRemove([KOMMUTE_STORAGE_KEY, FEATURE_FLAGS_KEY]);
        
        // Re-initialize
        await initializeCommute();
        
        console.log('[CommuteContext] Context reset complete');
        return { success: true };
      },
      { 
        component: 'CommuteContext', 
        operation: 'reset_context'
      }
    );
  }, [initializeCommute]);

  const getErrorHistory = useCallback(() => {
    return globalErrorRecovery.getErrorHistory();
  }, []);

  const clearErrorHistory = useCallback(async (): Promise<void> => {
    await globalErrorRecovery.clearErrorHistory();
  }, []);

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
    
    // Error recovery functions
    resetContext,
    getErrorHistory,
    clearErrorHistory,
  };
});

export const [CommuteContext, useCommute] = contextHook;

export default CommuteContext;