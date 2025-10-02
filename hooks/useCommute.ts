import { useCallback, useMemo } from 'react';
import { useCommute as useCommuteContext } from '@/src/modules/commute/context/CommuteContext';
import type { Route, TransportMode, TrackingPoint } from '@/src/modules/commute/types/core-types';

interface Driver {
  id: string;
  name: string;
  rating: number;
  vehicle: {
    model: string;
    plate: string;
  };
  distance: number;
  estimatedArrival: Date;
}

// ============================================================================
// BASIC COMMUTE HOOKS
// ============================================================================

/**
 * Hook for basic commute operations
 * Provides simplified access to core commute functionality
 */
export const useBasicCommute = () => {
  const {
    isEnabled,
    currentTrip,
    activeRoute,
    transportModes,
    isTracking,
    startTrip,
    endTrip,
    updateLocation,
    currentLocation,
    hasLocationPermission,
    isInitialized,
  } = useCommuteContext();

  const isReady = useMemo(() => {
    return isEnabled && isInitialized && hasLocationPermission;
  }, [isEnabled, isInitialized, hasLocationPermission]);

  const canStartTrip = useMemo(() => {
    return isReady && !currentTrip && !isTracking;
  }, [isReady, currentTrip, isTracking]);

  const canEndTrip = useMemo(() => {
    return isReady && currentTrip && isTracking;
  }, [isReady, currentTrip, isTracking]);

  return {
    // Status
    isEnabled,
    isReady,
    isInitialized,
    hasLocationPermission,
    
    // Current state
    currentTrip,
    activeRoute,
    isTracking,
    currentLocation,
    
    // Available options
    transportModes,
    
    // Actions
    startTrip,
    endTrip,
    updateLocation,
    
    // Capabilities
    canStartTrip,
    canEndTrip,
  };
};

/**
 * Hook for route operations with simplified interface
 */
export const useSimpleRoutes = () => {
  const { routes, createRoute, updateRoute, deleteRoute, isEnabled, isInitialized } = useCommuteContext();
  const isLoading = !isInitialized;

  const createSimpleRoute = useCallback(async (
    name: string,
    points: { latitude: number; longitude: number; address: string }[],
    transportModeIds: string[] = ['walking']
  ): Promise<Route | null> => {
    if (!isEnabled) {
      console.warn('[useSimpleRoutes] Kommute is not enabled');
      return null;
    }

    try {
      const routePoints = points.map((point, index) => ({
        id: `point_${Date.now()}_${index}`,
        latitude: point.latitude,
        longitude: point.longitude,
        address: point.address,
        name: index === 0 ? 'Origen' : index === points.length - 1 ? 'Destino' : `Punto ${index}`,
        type: index === 0 ? 'origin' as const : index === points.length - 1 ? 'destination' as const : 'waypoint' as const,
      }));

      // For now, we'll create a basic route structure
      // In a real implementation, this would calculate actual route data
      const routeData: Omit<Route, 'id' | 'createdAt' | 'updatedAt'> = {
        userId: 'current_user', // Should come from AuthContext
        name,
        points: routePoints,
        transportModes: [], // Would be populated with actual TransportMode objects
        distance: 0, // Would be calculated
        duration: 0, // Would be calculated
        estimatedCost: 0, // Would be calculated
        carbonFootprint: 0, // Would be calculated
        status: 'planned',
        isRecurring: false,
      };

      return await createRoute(routeData);
    } catch (error) {
      console.error('[useSimpleRoutes] Error creating route:', error);
      return null;
    }
  }, [isEnabled, createRoute]);

  const favoriteRoutes = useMemo(() => {
    // In a real implementation, this would filter based on user preferences
    return routes.slice(0, 5);
  }, [routes]);

  const recentRoutes = useMemo(() => {
    return routes
      .sort((a: Route, b: Route) => b.updatedAt.getTime() - a.updatedAt.getTime())
      .slice(0, 10);
  }, [routes]);

  return {
    routes,
    favoriteRoutes,
    recentRoutes,
    isLoading,
    createSimpleRoute,
    updateRoute,
    deleteRoute,
  };
};

/**
 * Hook for trip tracking with simplified interface
 */
export const useTripTracking = () => {
  const { currentTrip, isTracking, updateLocation } = useCommuteContext();

  const addTrackingPoint = useCallback((
    latitude: number,
    longitude: number,
    options?: {
      speed?: number;
      accuracy?: number;
      altitude?: number;
    }
  ) => {
    if (!currentTrip || !isTracking) {
      console.warn('[useTripTracking] No active trip to track');
      return;
    }

    const point: Omit<TrackingPoint, 'id' | 'tripId'> = {
      latitude,
      longitude,
      timestamp: new Date(),
      speed: options?.speed,
      accuracy: options?.accuracy,
      altitude: options?.altitude,
    };

    updateLocation(point);
  }, [currentTrip, isTracking, updateLocation]);

  const tripStats = useMemo(() => {
    if (!currentTrip) return null;

    const points = currentTrip.trackingPoints;
    if (points.length === 0) return null;

    const startTime = currentTrip.startTime;
    const currentTime = new Date();
    const duration = currentTime.getTime() - startTime.getTime();

    return {
      duration: Math.floor(duration / 1000), // seconds
      pointsRecorded: points.length,
      lastUpdate: points[points.length - 1]?.timestamp || startTime,
    };
  }, [currentTrip]);

  return {
    currentTrip,
    isTracking,
    tripStats,
    addTrackingPoint,
  };
};

/**
 * Hook for transport mode selection and management
 */
export const useTransportModes = () => {
  const { transportModes } = useCommuteContext();

  const getTransportMode = useCallback((id: string): TransportMode | undefined => {
    return transportModes.find(mode => mode.id === id);
  }, [transportModes]);

  const getAvailableModes = useCallback((): TransportMode[] => {
    return transportModes.filter(mode => mode.available);
  }, [transportModes]);

  const getEcoFriendlyModes = useCallback((): TransportMode[] => {
    return transportModes
      .filter(mode => mode.available && mode.carbonFactor <= 0.1)
      .sort((a, b) => a.carbonFactor - b.carbonFactor);
  }, [transportModes]);

  const getFastestModes = useCallback((): TransportMode[] => {
    return transportModes
      .filter(mode => mode.available)
      .sort((a, b) => b.speedFactor - a.speedFactor);
  }, [transportModes]);

  const getCheapestModes = useCallback((): TransportMode[] => {
    return transportModes
      .filter(mode => mode.available)
      .sort((a, b) => a.costFactor - b.costFactor);
  }, [transportModes]);

  return {
    transportModes,
    getTransportMode,
    getAvailableModes,
    getEcoFriendlyModes,
    getFastestModes,
    getCheapestModes,
  };
};

/**
 * Hook for carbon footprint with simplified calculations
 */
export const useSimpleCarbonFootprint = () => {
  const { trips, transportModes } = useCommuteContext();
  
  const calculateFootprint = useCallback(async (period: { startDate: Date; endDate: Date }) => {
    const relevantTrips = trips.filter(trip => 
      trip.startTime >= period.startDate && 
      trip.startTime <= period.endDate &&
      trip.status === 'completed'
    );

    let totalEmissions = 0;
    relevantTrips.forEach(trip => {
      const distance = trip.actualDistance || 0;
      const carMode = transportModes.find(mode => mode.id === 'car');
      if (carMode && distance > 0) {
        const emissions = (distance / 1000) * carMode.carbonFactor;
        totalEmissions += emissions;
      }
    });

    return {
      id: `footprint_${Date.now()}`,
      userId: 'current_user',
      period: 'daily' as const,
      startDate: period.startDate,
      endDate: period.endDate,
      totalEmissions,
      transportBreakdown: [],
    };
  }, [trips, transportModes]);
  
  const setTarget = useCallback(async (target: number): Promise<void> => {
    if (typeof target !== 'number' || target < 0 || !Number.isFinite(target)) {
      console.error('[useCarbonFootprint] Invalid target value provided');
      return;
    }
    console.log('[useCarbonFootprint] Carbon target set:', target);
  }, []);

  const getTodaysFootprint = useCallback(async () => {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);

    return await calculateFootprint({ startDate: startOfDay, endDate: endOfDay });
  }, [calculateFootprint]);

  const getWeeklyFootprint = useCallback(async () => {
    const today = new Date();
    const startOfWeek = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay());
    const endOfWeek = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay() + 6, 23, 59, 59);

    return await calculateFootprint({ startDate: startOfWeek, endDate: endOfWeek });
  }, [calculateFootprint]);

  const getMonthlyFootprint = useCallback(async () => {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59);

    return await calculateFootprint({ startDate: startOfMonth, endDate: endOfMonth });
  }, [calculateFootprint]);

  const completedTripsCount = useMemo(() => {
    return trips.filter(trip => trip.status === 'completed').length;
  }, [trips]);

  const totalDistanceTraveled = useMemo(() => {
    return trips
      .filter(trip => trip.status === 'completed')
      .reduce((total, trip) => total + (trip.actualDistance || 0), 0);
  }, [trips]);

  return {
    getTodaysFootprint,
    getWeeklyFootprint,
    getMonthlyFootprint,
    setTarget,
    completedTripsCount,
    totalDistanceTraveled,
  };
};

/**
 * Hook to check feature availability
 */
export const useKommuteFeatures = () => {
  const { featureFlags, isEnabled } = useCommuteContext();

  return {
    isEnabled,
    hasTeamFeatures: featureFlags.KOMMUTE_TEAM_FEATURES,
    hasCarbonTracking: featureFlags.KOMMUTE_CARBON_TRACKING,
    hasOfflineMaps: featureFlags.KOMMUTE_OFFLINE_MAPS,
    hasExternalAPIs: featureFlags.KOMMUTE_EXTERNAL_APIS,
  };
};

// ============================================================================
// UTILITY HOOKS
// ============================================================================

/**
 * Hook for location utilities
 */
export const useLocationUtils = () => {
  const { currentLocation, hasLocationPermission } = useCommuteContext();

  const formatCoordinates = useCallback((lat: number, lng: number): string => {
    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  }, []);

  const calculateDistanceBetween = useCallback((
    point1: { latitude: number; longitude: number },
    point2: { latitude: number; longitude: number }
  ): number => {
    // Haversine formula
    const R = 6371000; // Earth's radius in meters
    const dLat = (point2.latitude - point1.latitude) * Math.PI / 180;
    const dLon = (point2.longitude - point1.longitude) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(point1.latitude * Math.PI / 180) * Math.cos(point2.latitude * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }, []);

  return {
    currentLocation,
    hasLocationPermission,
    formatCoordinates,
    calculateDistanceBetween,
  };
};

/**
 * Hook for time and duration utilities
 */
export const useTimeUtils = () => {
  const formatDuration = useCallback((seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    } else {
      return `${remainingSeconds}s`;
    }
  }, []);

  const formatDistance = useCallback((meters: number): string => {
    if (typeof meters !== 'number' || meters < 0 || !Number.isFinite(meters)) {
      return '0 m';
    }
    if (meters >= 1000) {
      return `${(meters / 1000).toFixed(1)} km`;
    } else {
      return `${Math.round(meters)} m`;
    }
  }, []);

  const formatSpeed = useCallback((metersPerSecond: number): string => {
    const kmh = (metersPerSecond * 3.6);
    return `${kmh.toFixed(1)} km/h`;
  }, []);

  return {
    formatDuration,
    formatDistance,
    formatSpeed,
  };
};

// ============================================================================
// EXPORT ALL HOOKS
// ============================================================================

// Re-export main context hook
export { useCommute as useCommuteContext } from '@/src/modules/commute/context/CommuteContext';

// Main useCommute hook with extended functionality for search and ride requests
export const useCommute = () => {
  const context = useCommuteContext();

  const searchDrivers = useCallback(async (params: {
    routeId: string;
    transportModeIds: string[];
    maxDistance: number;
    departureTime: Date;
  }): Promise<Driver[]> => {
    console.log('[useCommute] Searching drivers with params:', params);
    
    // Mock implementation - in production this would call the backend
    // For now, return empty array
    return [];
  }, []);

  const requestRide = useCallback(async (params: {
    routeId: string;
    driverId: string;
    pickupPoint: any;
    dropoffPoint: any;
  }) => {
    console.log('[useCommute] Requesting ride with params:', params);
    
    // Mock implementation - in production this would call the backend
    // For now, create a mock trip
    const mockTrip = {
      id: `trip_${Date.now()}`,
      routeId: params.routeId,
      driverId: params.driverId,
      status: 'pending' as const,
      pickupPoint: params.pickupPoint,
      dropoffPoint: params.dropoffPoint,
    };
    
    return mockTrip;
  }, []);

  return {
    ...context,
    searchDrivers,
    requestRide,
  };
};