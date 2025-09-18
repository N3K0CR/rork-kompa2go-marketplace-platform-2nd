// ============================================================================
// 2KOMMUTE SPECIALIZED HOOKS
// ============================================================================
// Custom hooks for specific 2Kommute functionality

import { useCallback, useMemo } from 'react';
import { useCommute } from '../context/CommuteContext';
import { withErrorRecovery, useErrorRecovery } from '../utils/error-recovery';
import type {
  UseRoutesReturn,
  UseCarbonFootprintReturn,
  UseKommuteAdminReturn,
  Route,
  CarbonFootprint,
  FeatureFlags,
  TrackingPoint,
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
  const { handleError } = useErrorRecovery();

  const optimizeRoute = useCallback(async (routeId: string): Promise<Route> => {
    return await withErrorRecovery(
      async () => {
        // This would integrate with external APIs when KOMMUTE_EXTERNAL_APIS is enabled
        const route = routes.find(r => r.id === routeId);
        if (!route) {
          throw new Error('Route not found');
        }
        
        // For now, return the route as-is
        // TODO: Implement actual route optimization
        console.log('[useRoutes] Route optimization requested for:', routeId);
        return route;
      },
      {
        component: 'useRoutes',
        operation: 'optimizeRoute',
        additionalData: { routeId }
      }
    ) || routes.find(r => r.id === routeId) || routes[0];
  }, [routes]);

  const safeCreateRoute = useCallback(async (routeData: Omit<Route, 'id' | 'createdAt' | 'updatedAt'>): Promise<Route> => {
    const result = await withErrorRecovery(
      () => createRoute(routeData),
      {
        component: 'useRoutes',
        operation: 'createRoute'
      }
    );
    
    if (!result) {
      throw new Error('Failed to create route');
    }
    
    return result;
  }, [createRoute]);

  const safeUpdateRoute = useCallback(async (routeId: string, updates: Partial<Route>): Promise<void> => {
    await withErrorRecovery(
      () => updateRoute(routeId, updates),
      {
        component: 'useRoutes',
        operation: 'updateRoute',
        additionalData: { routeId }
      }
    );
  }, [updateRoute]);

  const safeDeleteRoute = useCallback(async (routeId: string): Promise<void> => {
    await withErrorRecovery(
      () => deleteRoute(routeId),
      {
        component: 'useRoutes',
        operation: 'deleteRoute',
        additionalData: { routeId }
      }
    );
  }, [deleteRoute]);

  return {
    routes: routes || [],
    isLoading: !isInitialized || !featureFlags.KOMMUTE_ENABLED,
    createRoute: safeCreateRoute,
    updateRoute: safeUpdateRoute,
    deleteRoute: safeDeleteRoute,
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
    return await withErrorRecovery(
      async () => {
        const relevantTrips = (trips || []).filter(trip => 
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
          const carMode = (transportModes || []).find(mode => mode.id === 'car');
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
      },
      {
        component: 'useCarbonFootprint',
        operation: 'calculateFootprint'
      },
      {
        id: `fallback_footprint_${Date.now()}`,
        userId: 'current_user',
        period: 'daily' as const,
        startDate: period.startDate,
        endDate: period.endDate,
        totalEmissions: 0,
        transportBreakdown: [],
      }
    ) as CarbonFootprint;
  }, [trips, transportModes]);

  const getComparison = useCallback(async (period: string): Promise<{ current: number; previous: number; average: number }> => {
    return await withErrorRecovery(
      async () => {
        // This would implement actual comparison logic
        return {
          current: 0,
          previous: 0,
          average: 0,
        };
      },
      {
        component: 'useCarbonFootprint',
        operation: 'getComparison',
        additionalData: { period }
      },
      { current: 0, previous: 0, average: 0 }
    ) || { current: 0, previous: 0, average: 0 };
  }, []);

  const setTarget = useCallback(async (target: number): Promise<void> => {
    await withErrorRecovery(
      async () => {
        if (typeof target !== 'number' || target < 0 || !Number.isFinite(target)) {
          console.error('[useCarbonFootprint] Invalid target value provided');
          return;
        }
        // This would save the target to storage
        console.log('[useCarbonFootprint] Carbon target set:', target);
      },
      {
        component: 'useCarbonFootprint',
        operation: 'setTarget',
        additionalData: { target }
      }
    );
  }, []);

  return {
    currentFootprint: null, // Would be calculated based on current period
    isLoading: !featureFlags?.KOMMUTE_CARBON_TRACKING,
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
  return featureFlags?.KOMMUTE_ENABLED || false;
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
    await withErrorRecovery(
      () => updateFeatureFlags({ KOMMUTE_ENABLED: true }),
      {
        component: 'useKommuteAdmin',
        operation: 'enableKommute'
      }
    );
  }, [updateFeatureFlags]);
  
  const disableKommute = useCallback(async () => {
    await withErrorRecovery(
      () => updateFeatureFlags({ KOMMUTE_ENABLED: false }),
      {
        component: 'useKommuteAdmin',
        operation: 'disableKommute'
      }
    );
  }, [updateFeatureFlags]);
  
  const toggleFeature = useCallback(async (feature: keyof FeatureFlags) => {
    await withErrorRecovery(
      () => updateFeatureFlags({ [feature]: !(featureFlags?.[feature] || false) }),
      {
        component: 'useKommuteAdmin',
        operation: 'toggleFeature',
        additionalData: { feature }
      }
    );
  }, [featureFlags, updateFeatureFlags]);
  
  const safeUpdateFeatureFlags = useCallback(async (flags: Partial<FeatureFlags>) => {
    await withErrorRecovery(
      () => updateFeatureFlags(flags),
      {
        component: 'useKommuteAdmin',
        operation: 'updateFeatureFlags',
        additionalData: { flags }
      }
    );
  }, [updateFeatureFlags]);
  
  return {
    featureFlags: featureFlags || {},
    enableKommute,
    disableKommute,
    toggleFeature,
    updateFeatureFlags: safeUpdateFeatureFlags,
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
    try {
      const safeTrips = trips || [];
      const completedTrips = safeTrips.filter(trip => trip?.status === 'completed');
      
      const totalTrips = completedTrips.length;
      const totalDistance = completedTrips.reduce((sum, trip) => sum + (trip?.actualDistance || 0), 0);
      const totalDuration = completedTrips.reduce((sum, trip) => sum + (trip?.actualDuration || 0), 0);
      const totalCost = completedTrips.reduce((sum, trip) => sum + (trip?.actualCost || 0), 0);
      const totalCarbonFootprint = completedTrips.reduce((sum, trip) => sum + (trip?.actualCarbonFootprint || 0), 0);

      return {
        totalTrips,
        totalDistance: Math.round(totalDistance / 1000 * 100) / 100, // Convert to km with 2 decimals
        totalDuration: Math.round(totalDuration / 60000), // Convert to minutes
        totalCost: Math.round(totalCost * 100) / 100, // Round to 2 decimals
        totalCarbonFootprint: Math.round(totalCarbonFootprint * 100) / 100, // Round to 2 decimals
        averageSpeed: totalDuration > 0 ? Math.round((totalDistance / 1000) / (totalDuration / 3600000) * 100) / 100 : 0, // km/h
      };
    } catch (error) {
      console.error('[useTripAnalytics] Error calculating analytics:', error);
      return {
        totalTrips: 0,
        totalDistance: 0,
        totalDuration: 0,
        totalCost: 0,
        totalCarbonFootprint: 0,
        averageSpeed: 0,
      };
    }
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

  const startLocationTracking = useCallback(async () => {
    await withErrorRecovery(
      async () => {
        if (!hasLocationPermission) {
          console.warn('[useLocationTracking] Location permission not granted');
          return;
        }

        // This would start continuous location tracking
        console.log('[useLocationTracking] Starting location tracking');
      },
      {
        component: 'useLocationTracking',
        operation: 'startLocationTracking'
      }
    );
  }, [hasLocationPermission]);

  const stopLocationTracking = useCallback(async () => {
    await withErrorRecovery(
      async () => {
        console.log('[useLocationTracking] Stopping location tracking');
      },
      {
        component: 'useLocationTracking',
        operation: 'stopLocationTracking'
      }
    );
  }, []);

  const safeUpdateLocation = useCallback((point: Omit<TrackingPoint, 'id' | 'tripId'>) => {
    try {
      if (updateLocation && typeof updateLocation === 'function') {
        updateLocation(point);
      }
    } catch (error) {
      console.error('[useLocationTracking] Error updating location:', error);
    }
  }, [updateLocation]);

  return {
    currentLocation: currentLocation || null,
    hasLocationPermission: hasLocationPermission || false,
    isTracking: isTracking || false,
    startLocationTracking,
    stopLocationTracking,
    updateLocation: safeUpdateLocation,
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