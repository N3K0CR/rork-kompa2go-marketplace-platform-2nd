import { useState, useEffect, useCallback, useMemo } from 'react';
import { Platform } from 'react-native';
import createContextHook from '@nkzw/create-context-hook';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { firestoreService } from '@/src/modules/commute/services/firestore-service';

// Import types from the modular structure
import type {
  TransportMode,
  Route,
  Trip,
  TrackingPoint,
  CarbonFootprint,
  FeatureFlags,
} from '@/src/modules/commute/types/core-types';

// Define context types locally to avoid circular dependencies
interface TransportContextType {
  isEnabled: boolean;
  currentTrip: Trip | null;
  activeRoute: Route | null;
  transportModes: TransportMode[];
  isTracking: boolean;
  startTrip: (routeId: string) => Promise<void>;
  endTrip: (tripId: string) => Promise<void>;
  updateLocation: (point: Omit<TrackingPoint, 'id' | 'tripId'>) => void;
}

interface RouteContextType {
  createRoute: (route: Omit<Route, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Route>;
  updateRoute: (routeId: string, updates: Partial<Route>) => Promise<void>;
  deleteRoute: (routeId: string) => Promise<void>;
  optimizeRoute: (routeId: string) => Promise<Route>;
}

interface CarbonFootprintContextType {
  currentFootprint: CarbonFootprint | null;
  isLoading: boolean;
  calculateFootprint: (period: { startDate: Date; endDate: Date }) => Promise<CarbonFootprint>;
  getComparison: (period: string) => Promise<{ current: number; previous: number; average: number }>;
  setTarget: (target: number) => Promise<void>;
}

// ============================================================================
// FEATURE FLAGS & CONFIGURATION
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
      // Web geolocation API
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
      // Native location permissions
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

export const [CommuteContext, useCommute] = createContextHook(() => {
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
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);

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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log('[CommuteContext] Firebase auth state changed:', user?.uid);
      setFirebaseUser(user);
    });
    
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    initializeCommute();
  }, [initializeCommute]);

  useEffect(() => {
    if (!firebaseUser?.uid || !featureFlags.KOMMUTE_ENABLED) return;
    
    console.log('[CommuteContext] Setting up Firestore subscriptions for user:', firebaseUser.uid);
    
    const unsubscribeRoutes = firestoreService.routes.subscribeToUserRoutes(
      firebaseUser.uid,
      (firestoreRoutes) => {
        console.log('[CommuteContext] Routes updated from Firestore:', firestoreRoutes.length);
        setRoutes(firestoreRoutes);
      }
    );
    
    const unsubscribeTrips = firestoreService.trips.subscribeToUserTrips(
      firebaseUser.uid,
      (firestoreTrips) => {
        console.log('[CommuteContext] Trips updated from Firestore:', firestoreTrips.length);
        setTrips(firestoreTrips);
      }
    );
    
    return () => {
      console.log('[CommuteContext] Cleaning up Firestore subscriptions');
      unsubscribeRoutes();
      unsubscribeTrips();
    };
  }, [firebaseUser?.uid, featureFlags.KOMMUTE_ENABLED]);

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
    if (!firebaseUser?.uid) {
      throw new Error('Usuario no autenticado');
    }
    
    const newRoute: Route = {
      ...routeData,
      id: `route_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: firebaseUser.uid,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    await firestoreService.routes.create(newRoute);
    console.log('[CommuteContext] Route created in Firestore:', newRoute.id);
    
    return newRoute;
  }, [firebaseUser?.uid]);

  const updateRoute = useCallback(async (routeId: string, updates: Partial<Route>): Promise<void> => {
    await firestoreService.routes.update(routeId, {
      ...updates,
      updatedAt: new Date(),
    });
    console.log('[CommuteContext] Route updated in Firestore:', routeId);
  }, []);

  const deleteRoute = useCallback(async (routeId: string): Promise<void> => {
    await firestoreService.routes.delete(routeId);
    console.log('[CommuteContext] Route deleted from Firestore:', routeId);
  }, []);

  // ============================================================================
  // TRIP MANAGEMENT
  // ============================================================================

  const startTrip = useCallback(async (routeId: string): Promise<void> => {
    try {
      if (!firebaseUser?.uid) {
        throw new Error('Usuario no autenticado');
      }
      
      const route = routes.find(r => r.id === routeId);
      if (!route) {
        throw new Error('Route not found');
      }
      
      const newTrip: Trip = {
        id: `trip_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        routeId,
        userId: firebaseUser.uid,
        startTime: new Date(),
        status: 'in_progress',
        trackingPoints: [],
      };
      
      await firestoreService.trips.create(newTrip);
      
      setCurrentTrip(newTrip);
      setActiveRoute(route);
      setIsTracking(true);
      
      console.log('[CommuteContext] Trip started in Firestore:', newTrip.id);
    } catch (error) {
      console.error('[CommuteContext] Error starting trip:', error);
      throw error;
    }
  }, [firebaseUser?.uid, routes]);

  const endTrip = useCallback(async (tripId: string): Promise<void> => {
    try {
      const trip = trips.find(t => t.id === tripId);
      if (!trip) {
        throw new Error('Trip not found');
      }
      
      await firestoreService.trips.update(tripId, {
        endTime: new Date(),
        status: 'completed',
        actualDistance: trip.trackingPoints.length > 0 ? calculateDistance(trip.trackingPoints) : undefined,
        actualDuration: trip.startTime ? Date.now() - trip.startTime.getTime() : undefined,
      });
      
      setCurrentTrip(null);
      setActiveRoute(null);
      setIsTracking(false);
      
      console.log('[CommuteContext] Trip ended in Firestore:', tripId);
    } catch (error) {
      console.error('[CommuteContext] Error ending trip:', error);
      throw error;
    }
  }, [trips, calculateDistance]);

  const updateLocation = useCallback(async (point: Omit<TrackingPoint, 'id' | 'tripId'>) => {
    if (!currentTrip || !isTracking) return;
    
    const trackingPoint: TrackingPoint = {
      ...point,
      id: `point_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      tripId: currentTrip.id,
    };
    
    await firestoreService.tracking.addPoint(trackingPoint);
    
    const updatedTrip = {
      ...currentTrip,
      trackingPoints: [...currentTrip.trackingPoints, trackingPoint],
    };
    
    setCurrentTrip(updatedTrip);
    setCurrentLocation({ latitude: point.latitude, longitude: point.longitude });
    
    console.log('[CommuteContext] Tracking point added to Firestore');
  }, [currentTrip, isTracking]);



  // ============================================================================
  // CONTEXT VALUE
  // ============================================================================

  const contextValue: TransportContextType & {
    // Extended properties for internal use
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
    firebaseUser: FirebaseUser | null;
  } = {
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
    firebaseUser,
  };

  return contextValue;
});

// ============================================================================
// SPECIALIZED HOOKS
// ============================================================================

/**
 * Hook for route management operations
 */
export const useRoutes = (): RouteContextType & {
  routes: Route[];
  isLoading: boolean;
} => {
  const { 
    routes, 
    createRoute, 
    updateRoute, 
    deleteRoute, 
    isInitialized,
    featureFlags 
  } = useCommute();

  const optimizeRoute = useCallback(async (routeId: string): Promise<Route> => {
    // This would integrate with external APIs when KOMMUTE_EXTERNAL_APIS is enabled
    const route = routes.find(r => r.id === routeId);
    if (!route) {
      throw new Error('Route not found');
    }
    
    // For now, return the route as-is
    // TODO: Implement actual route optimization
    console.log('[useRoutes] Route optimization requested for:', routeId);
    return route;
  }, [routes]);

  return {
    routes,
    isLoading: !isInitialized || !featureFlags.KOMMUTE_ENABLED,
    createRoute,
    updateRoute,
    deleteRoute,
    optimizeRoute,
  };
};

/**
 * Hook for carbon footprint tracking
 */
export const useCarbonFootprint = (): CarbonFootprintContextType => {
  const { trips, featureFlags, transportModes } = useCommute();

  const calculateFootprint = useCallback(async (period: { startDate: Date; endDate: Date }): Promise<CarbonFootprint> => {
    const relevantTrips = trips.filter(trip => 
      trip.startTime >= period.startDate && 
      trip.startTime <= period.endDate &&
      trip.status === 'completed'
    );

    let totalEmissions = 0;
    const transportBreakdown: CarbonFootprint['transportBreakdown'] = [];

    // Calculate emissions for each trip
    relevantTrips.forEach(trip => {
      const distance = trip.actualDistance || 0;
      
      // For now, assume car transport if no specific mode is set
      const carMode = transportModes.find(mode => mode.id === 'car');
      if (carMode && distance > 0) {
        const emissions = (distance / 1000) * carMode.carbonFactor; // Convert to km
        totalEmissions += emissions;
      }
    });

    const footprint: CarbonFootprint = {
      id: `footprint_${Date.now()}`,
      userId: 'current_user', // Should come from AuthContext
      period: 'daily', // Using valid period type
      startDate: period.startDate,
      endDate: period.endDate,
      totalEmissions,
      transportBreakdown,
    };

    return footprint;
  }, [trips, transportModes]);

  const getComparison = useCallback(async (period: string): Promise<{ current: number; previous: number; average: number }> => {
    // This would implement actual comparison logic
    return {
      current: 0,
      previous: 0,
      average: 0,
    };
  }, []);

  const setTarget = useCallback(async (target: number): Promise<void> => {
    if (typeof target !== 'number' || target < 0 || !Number.isFinite(target)) {
      console.error('[useCarbonFootprint] Invalid target value provided');
      return;
    }
    // This would save the target to storage
    console.log('[useCarbonFootprint] Carbon target set:', target);
  }, []);

  return {
    currentFootprint: null, // Would be calculated based on current period
    isLoading: !featureFlags.KOMMUTE_CARBON_TRACKING,
    calculateFootprint,
    getComparison,
    setTarget,
  };
};

/**
 * Hook to check if Kommute features are enabled
 */
export const useKommuteEnabled = (): boolean => {
  const { featureFlags } = useCommute();
  return featureFlags.KOMMUTE_ENABLED;
};

/**
 * Hook for development/admin purposes to manage feature flags
 */
export const useKommuteAdmin = () => {
  const { featureFlags, updateFeatureFlags } = useCommute();
  
  const enableKommute = useCallback(async () => {
    await updateFeatureFlags({ KOMMUTE_ENABLED: true });
  }, [updateFeatureFlags]);
  
  const disableKommute = useCallback(async () => {
    await updateFeatureFlags({ KOMMUTE_ENABLED: false });
  }, [updateFeatureFlags]);
  
  const toggleFeature = useCallback(async (feature: keyof FeatureFlags) => {
    await updateFeatureFlags({ [feature]: !featureFlags[feature] });
  }, [featureFlags, updateFeatureFlags]);
  
  return {
    featureFlags,
    enableKommute,
    disableKommute,
    toggleFeature,
    updateFeatureFlags,
  };
};

// ============================================================================
// EXPORT DEFAULT
// ============================================================================

export default CommuteContext;

// Debug logging for development
if (process.env.NODE_ENV === 'development') {
  console.log('[CommuteContext] Module loaded - 2Kommute context ready (disabled by default)');
}