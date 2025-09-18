// ============================================================================
// 2KOMMUTE SPECIALIZED HOOKS
// ============================================================================
// Custom hooks for specific 2Kommute functionality

import { useCallback, useMemo } from 'react';
import { useCommute } from '../context/CommuteContext';
import type {
  UseRoutesReturn,
  UseCarbonFootprintReturn,
  UseKommuteAdminReturn,
  Route,
  CarbonFootprint,
  FeatureFlags,
} from '../types';

// ============================================================================
// ROUTE MANAGEMENT HOOK
// ============================================================================

/**
 * Hook for route management operations
 */
const useRoutes = (): UseRoutesReturn => {
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

// ============================================================================
// CARBON FOOTPRINT HOOK
// ============================================================================

/**
 * Hook for carbon footprint tracking
 */
const useCarbonFootprint = (): UseCarbonFootprintReturn => {
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

// ============================================================================
// KOMMUTE ENABLED CHECK HOOK
// ============================================================================

/**
 * Hook to check if Kommute features are enabled
 */
const useKommuteEnabled = (): boolean => {
  const { featureFlags } = useCommute();
  return featureFlags.KOMMUTE_ENABLED;
};

// ============================================================================
// KOMMUTE ADMIN HOOK
// ============================================================================

/**
 * Hook for development/admin purposes to manage feature flags
 */
const useKommuteAdmin = (): UseKommuteAdminReturn => {
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
// TRIP ANALYTICS HOOK
// ============================================================================

/**
 * Hook for trip analytics and insights
 */
const useTripAnalytics = () => {
  const { trips } = useCommute();

  const analytics = useMemo(() => {
    const completedTrips = trips.filter(trip => trip.status === 'completed');
    
    const totalTrips = completedTrips.length;
    const totalDistance = completedTrips.reduce((sum, trip) => sum + (trip.actualDistance || 0), 0);
    const totalDuration = completedTrips.reduce((sum, trip) => sum + (trip.actualDuration || 0), 0);
    const totalCost = completedTrips.reduce((sum, trip) => sum + (trip.actualCost || 0), 0);
    const totalCarbonFootprint = completedTrips.reduce((sum, trip) => sum + (trip.actualCarbonFootprint || 0), 0);

    return {
      totalTrips,
      totalDistance: Math.round(totalDistance / 1000 * 100) / 100, // Convert to km with 2 decimals
      totalDuration: Math.round(totalDuration / 60000), // Convert to minutes
      totalCost: Math.round(totalCost * 100) / 100, // Round to 2 decimals
      totalCarbonFootprint: Math.round(totalCarbonFootprint * 100) / 100, // Round to 2 decimals
      averageSpeed: totalDuration > 0 ? Math.round((totalDistance / 1000) / (totalDuration / 3600000) * 100) / 100 : 0, // km/h
    };
  }, [trips]);

  return {
    analytics,
    isLoading: false,
  };
};

// ============================================================================
// LOCATION TRACKING HOOK
// ============================================================================

/**
 * Hook for location tracking functionality
 */
const useLocationTracking = () => {
  const { currentLocation, hasLocationPermission, isTracking, updateLocation } = useCommute();

  const startLocationTracking = useCallback(() => {
    if (!hasLocationPermission) {
      console.warn('[useLocationTracking] Location permission not granted');
      return;
    }

    // This would start continuous location tracking
    console.log('[useLocationTracking] Starting location tracking');
  }, [hasLocationPermission]);

  const stopLocationTracking = useCallback(() => {
    console.log('[useLocationTracking] Stopping location tracking');
  }, []);

  return {
    currentLocation,
    hasLocationPermission,
    isTracking,
    startLocationTracking,
    stopLocationTracking,
    updateLocation,
  };
};

// ============================================================================
// EXPORT ALL HOOKS
// ============================================================================

// Import and re-export trip chaining hooks (when available)
// export {
//   useTripChaining,
//   useDestinationMode,
//   useZoneSaturation,
// } from './useTripChaining';

export {
  useCommute,
  useRoutes,
  useCarbonFootprint,
  useKommuteEnabled,
  useKommuteAdmin,
  useTripAnalytics,
  useLocationTracking,
};