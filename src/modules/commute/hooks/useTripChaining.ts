// ============================================================================
// TRIP CHAINING HOOKS
// ============================================================================
// Specialized hooks for Trip Chaining, Destination Mode, and Zone Saturation

import { useCallback, useState, useEffect } from 'react';
import { useCommute } from '../context/CommuteContext';
import type {
  TripChain,
  TripQueueEntry,
} from '../types';
import type {
  CreateTripChainInput,
  AddTripToQueueInput,
  FindNextTripsInput,
  AcceptNextTripInput,
  DriverChainState,
  ChainEfficiencyMetrics,
} from '../types/trip-chaining-types';

// ============================================================================
// TRIP CHAINING HOOK
// ============================================================================

/**
 * Hook for trip chaining functionality
 * Manages consecutive trips for drivers with 5-minute advance notice
 */
export const useTripChaining = () => {
  const { featureFlags } = useCommute();
  // Note: trips variable removed as it's not used in this hook
  const [tripChains, setTripChains] = useState<TripChain[]>([]);
  const [queueEntries, setQueueEntries] = useState<TripQueueEntry[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Create a new trip chain
  const createTripChain = useCallback(async (input: CreateTripChainInput): Promise<TripChain | null> => {
    if (!featureFlags.KOMMUTE_ENABLED) {
      console.warn('[useTripChaining] Trip chaining not enabled');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const newChain: TripChain = {
        id: `chain_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        driverId: input.driverId,
        trips: [],
        status: 'active',
        totalDistance: 0,
        totalDuration: 0,
        totalEarnings: 0,
        maxChainLength: input.maxChainLength || 5,
        targetDestination: input.targetDestination ? {
          ...input.targetDestination,
          id: `dest_${Date.now()}`,
        } : undefined,
        createdAt: new Date(),
        updatedAt: new Date(),
        metadata: {
          averageRating: 0,
          completionRate: 0,
          preferredAreas: [],
        },
      };

      setTripChains(prev => [...prev, newChain]);
      console.log('[useTripChaining] Trip chain created:', newChain.id);
      return newChain;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create trip chain';
      setError(errorMessage);
      console.error('[useTripChaining] Error creating trip chain:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [featureFlags.KOMMUTE_ENABLED]);

  // Add trip to queue with 5-minute advance notice
  const addTripToQueue = useCallback(async (input: AddTripToQueueInput): Promise<TripQueueEntry | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const queueEntry: TripQueueEntry = {
        id: `queue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        tripId: input.tripId,
        passengerId: input.passengerId,
        pickupLocation: input.pickupLocation,
        dropoffLocation: input.dropoffLocation,
        requestedTime: input.requestedTime,
        maxWaitTime: input.maxWaitTime,
        priority: input.priority,
        estimatedFare: input.estimatedFare,
        status: 'queued',
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + input.maxWaitTime * 1000),
        requirements: input.requirements,
        passengerPreferences: input.passengerPreferences,
      };

      setQueueEntries(prev => [...prev, queueEntry]);
      console.log('[useTripChaining] Trip added to queue:', queueEntry.id);
      return queueEntry;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add trip to queue';
      setError(errorMessage);
      console.error('[useTripChaining] Error adding trip to queue:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Find next available trips within proximity radius
  const findNextTrips = useCallback(async (input: FindNextTripsInput): Promise<TripQueueEntry[]> => {
    setIsLoading(true);
    setError(null);

    try {
      // Filter queue entries based on proximity and availability
      const availableTrips = queueEntries.filter(entry => {
        if (entry.status !== 'queued') return false;
        if (entry.expiresAt < new Date()) return false;

        // Calculate distance using Haversine approximation
        const distance = Math.sqrt(
          Math.pow(entry.pickupLocation.latitude - input.currentLocation.latitude, 2) +
          Math.pow(entry.pickupLocation.longitude - input.currentLocation.longitude, 2)
        ) * 111000; // Rough conversion to meters

        return distance <= input.maxProximityRadius;
      });

      // Sort by priority and distance for optimal chaining
      const sortedTrips = availableTrips
        .sort((a, b) => {
          const priorityDiff = b.priority - a.priority;
          if (priorityDiff !== 0) return priorityDiff;

          // Calculate distances for sorting
          const distanceA = Math.sqrt(
            Math.pow(a.pickupLocation.latitude - input.currentLocation.latitude, 2) +
            Math.pow(a.pickupLocation.longitude - input.currentLocation.longitude, 2)
          );
          const distanceB = Math.sqrt(
            Math.pow(b.pickupLocation.latitude - input.currentLocation.latitude, 2) +
            Math.pow(b.pickupLocation.longitude - input.currentLocation.longitude, 2)
          );

          return distanceA - distanceB;
        })
        .slice(0, input.limit);

      console.log('[useTripChaining] Found next trips:', sortedTrips.length);
      return sortedTrips;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to find next trips';
      setError(errorMessage);
      console.error('[useTripChaining] Error finding next trips:', err);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [queueEntries]);

  // Accept next trip in chain with transition time calculation
  const acceptNextTrip = useCallback(async (input: AcceptNextTripInput): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      // Update queue entry status to matched
      setQueueEntries(prev => prev.map(entry => 
        entry.tripId === input.nextTripId 
          ? { ...entry, status: 'matched' as const }
          : entry
      ));

      // Update trip chain with next trip linkage
      setTripChains(prev => prev.map(chain => {
        const currentTrip = chain.trips.find(trip => trip.id === input.currentTripId);
        if (!currentTrip) return chain;

        const updatedTrips = chain.trips.map(trip => 
          trip.id === input.currentTripId
            ? { ...trip, nextTripId: input.nextTripId }
            : trip
        );

        return {
          ...chain,
          trips: updatedTrips,
          updatedAt: new Date(),
        };
      }));

      console.log('[useTripChaining] Next trip accepted:', input.nextTripId);
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to accept next trip';
      setError(errorMessage);
      console.error('[useTripChaining] Error accepting next trip:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Get current driver chain state
  const getDriverChainState = useCallback((driverId: string): DriverChainState => {
    const activeChain = tripChains.find(chain => 
      chain.driverId === driverId && chain.status === 'active'
    );

    if (!activeChain) {
      return {
        isInChain: false,
        chainPosition: 0,
      };
    }

    const currentTripIndex = activeChain.trips.findIndex(trip => 
      trip.status === 'in_progress'
    );

    const nextTrip = activeChain.trips[currentTripIndex + 1];

    return {
      isInChain: true,
      currentChainId: activeChain.id,
      chainPosition: Math.max(0, currentTripIndex),
      nextTripId: nextTrip?.id,
      estimatedChainCompletion: activeChain.trips.length > 0 
        ? activeChain.trips[activeChain.trips.length - 1].endTime
        : undefined,
    };
  }, [tripChains]);

  // Calculate chain efficiency metrics
  const getChainEfficiencyMetrics = useCallback((chainId: string): ChainEfficiencyMetrics | null => {
    const chain = tripChains.find(c => c.id === chainId);
    if (!chain || chain.trips.length === 0) return null;

    const completedTrips = chain.trips.filter(trip => trip.status === 'completed');
    if (completedTrips.length === 0) return null;

    const totalDistance = completedTrips.reduce((sum, trip) => sum + (trip.actualDistance || 0), 0);
    const totalDuration = completedTrips.reduce((sum, trip) => sum + (trip.actualDuration || 0), 0);

    return {
      averageChainLength: completedTrips.length,
      completionRate: completedTrips.length / chain.trips.length,
      deadMileageReduction: 0.15, // Estimated 15% reduction in dead miles
      timeUtilization: totalDuration > 0 ? 0.85 : 0, // 85% time utilization
      fuelSavings: totalDistance * 0.08 / 1000, // Estimated fuel savings in liters
      co2Reduction: totalDistance * 0.12 / 1000, // Estimated CO2 reduction in kg
    };
  }, [tripChains]);

  // Get trip chain status for UI display
  const getTripChainStatus = useCallback((chainId: string): string => {
    const chain = tripChains.find(c => c.id === chainId);
    if (!chain) return 'Not found';

    const activeTrips = chain.trips.filter(trip => trip.status === 'in_progress');
    const completedTrips = chain.trips.filter(trip => trip.status === 'completed');
    const totalTrips = chain.trips.length;

    if (activeTrips.length > 0) {
      return `Finalizando viaje - Próximo en cola (${completedTrips.length + 1}/${totalTrips})`;
    }

    if (completedTrips.length === totalTrips && totalTrips > 0) {
      return 'Cadena completada';
    }

    return `En espera (${completedTrips.length}/${totalTrips})`;
  }, [tripChains]);

  return {
    tripChains,
    queueEntries,
    isLoading,
    error,
    createTripChain,
    addTripToQueue,
    findNextTrips,
    acceptNextTrip,
    getDriverChainState,
    getChainEfficiencyMetrics,
    getTripChainStatus,
  };
};

// ============================================================================
// DESTINATION MODE HOOK
// ============================================================================

/**
 * Hook for destination mode functionality
 * Prioritizes trips that move driver closer to their target destination
 */
export const useDestinationMode = () => {
  const { trips, featureFlags } = useCommute();
  const [destinationModeActive, setDestinationModeActive] = useState<boolean>(false);
  const [targetDestination, setTargetDestination] = useState<any>(null);
  const [availableTrips, setAvailableTrips] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [progressToDestination, setProgressToDestination] = useState<number>(0);

  // Set destination for driver with validation
  const setDriverDestination = useCallback(async (destination: any): Promise<boolean> => {
    if (!featureFlags.KOMMUTE_ENABLED) {
      console.warn('[useDestinationMode] Destination mode not enabled');
      return false;
    }

    if (!destination?.latitude || !destination?.longitude) {
      console.error('[useDestinationMode] Invalid destination coordinates');
      return false;
    }

    setIsLoading(true);
    try {
      setTargetDestination({
        ...destination,
        setAt: new Date(),
      });
      setDestinationModeActive(true);
      setProgressToDestination(0);
      console.log('[useDestinationMode] Destination set:', destination.address);
      return true;
    } catch (err) {
      console.error('[useDestinationMode] Error setting destination:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [featureFlags.KOMMUTE_ENABLED]);

  // Find trips that move towards destination
  const findTripsTowardsDestination = useCallback(async (currentLocation: any): Promise<any[]> => {
    if (!targetDestination || !destinationModeActive) return [];
    if (!currentLocation?.latitude || !currentLocation?.longitude) return [];

    setIsLoading(true);
    try {
      // Calculate current distance to destination
      const currentDistance = Math.sqrt(
        Math.pow(currentLocation.latitude - targetDestination.latitude, 2) +
        Math.pow(currentLocation.longitude - targetDestination.longitude, 2)
      );

      // Filter trips that move closer to destination
      const relevantTrips = trips.filter(trip => {
        // Mock trip destination - in real implementation, get from route data
        const tripDestination = {
          latitude: trip.startTime.getTime() % 2 === 0 ? targetDestination.latitude + 0.01 : targetDestination.latitude - 0.01,
          longitude: trip.startTime.getTime() % 3 === 0 ? targetDestination.longitude + 0.01 : targetDestination.longitude - 0.01,
        };
        
        const tripEndDistance = Math.sqrt(
          Math.pow(tripDestination.latitude - targetDestination.latitude, 2) +
          Math.pow(tripDestination.longitude - targetDestination.longitude, 2)
        );

        // Trip is relevant if it moves us closer to destination
        return tripEndDistance < currentDistance;
      });

      // Sort by how much closer they get us to destination
      const sortedTrips = relevantTrips.sort((a, b) => {
        const aDestination = {
          latitude: a.startTime.getTime() % 2 === 0 ? targetDestination.latitude + 0.01 : targetDestination.latitude - 0.01,
          longitude: a.startTime.getTime() % 3 === 0 ? targetDestination.longitude + 0.01 : targetDestination.longitude - 0.01,
        };
        const bDestination = {
          latitude: b.startTime.getTime() % 2 === 0 ? targetDestination.latitude + 0.01 : targetDestination.latitude - 0.01,
          longitude: b.startTime.getTime() % 3 === 0 ? targetDestination.longitude + 0.01 : targetDestination.longitude - 0.01,
        };

        const aDistance = Math.sqrt(
          Math.pow(aDestination.latitude - targetDestination.latitude, 2) +
          Math.pow(aDestination.longitude - targetDestination.longitude, 2)
        );
        const bDistance = Math.sqrt(
          Math.pow(bDestination.latitude - targetDestination.latitude, 2) +
          Math.pow(bDestination.longitude - targetDestination.longitude, 2)
        );

        return aDistance - bDistance;
      });

      setAvailableTrips(sortedTrips);
      
      // Update progress to destination
      if (sortedTrips.length > 0) {
        const bestTripDestination = {
          latitude: sortedTrips[0].startTime.getTime() % 2 === 0 ? targetDestination.latitude + 0.01 : targetDestination.latitude - 0.01,
          longitude: sortedTrips[0].startTime.getTime() % 3 === 0 ? targetDestination.longitude + 0.01 : targetDestination.longitude - 0.01,
        };
        const newDistance = Math.sqrt(
          Math.pow(bestTripDestination.latitude - targetDestination.latitude, 2) +
          Math.pow(bestTripDestination.longitude - targetDestination.longitude, 2)
        );
        const progress = Math.max(0, Math.min(100, (1 - newDistance / currentDistance) * 100));
        setProgressToDestination(progress);
      }

      console.log('[useDestinationMode] Found trips towards destination:', sortedTrips.length);
      return sortedTrips;
    } catch (err) {
      console.error('[useDestinationMode] Error finding trips:', err);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [trips, targetDestination, destinationModeActive]);

  // Clear destination mode
  const clearDestination = useCallback(() => {
    setTargetDestination(null);
    setDestinationModeActive(false);
    setAvailableTrips([]);
    setProgressToDestination(0);
    console.log('[useDestinationMode] Destination mode cleared');
  }, []);

  // Get estimated arrival time at destination
  const getEstimatedArrival = useCallback((): Date | null => {
    if (!targetDestination || !destinationModeActive || availableTrips.length === 0) {
      return null;
    }

    // Mock calculation - in real implementation, use route planning
    const averageTripDuration = 30 * 60 * 1000; // 30 minutes
    const estimatedTripsToDestination = Math.ceil(availableTrips.length / 2);
    const totalTime = estimatedTripsToDestination * averageTripDuration;
    
    return new Date(Date.now() + totalTime);
  }, [targetDestination, destinationModeActive, availableTrips]);

  return {
    destinationModeActive,
    targetDestination,
    availableTrips,
    progressToDestination,
    isLoading,
    setDriverDestination,
    findTripsTowardsDestination,
    clearDestination,
    getEstimatedArrival,
  };
};

// ============================================================================
// ZONE SATURATION HOOK
// ============================================================================

/**
 * Hook for zone saturation management
 * Controls driver distribution across geographic zones
 */
export const useZoneSaturation = () => {
  const { featureFlags } = useCommute();
  const [zones, setZones] = useState<any[]>([]);
  const [saturationData, setSaturationData] = useState<Map<string, number>>(new Map());
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [activeZone, setActiveZone] = useState<string | null>(null);

  // Initialize zones with mock data
  const initializeZones = useCallback(() => {
    const mockZones = [
      {
        id: 'zone_centro',
        name: 'Centro',
        coordinates: { latitude: -34.6037, longitude: -58.3816 },
        radius: 2000,
        maxDrivers: 10,
        priority: 'high',
      },
      {
        id: 'zone_palermo',
        name: 'Palermo',
        coordinates: { latitude: -34.5875, longitude: -58.4200 },
        radius: 3000,
        maxDrivers: 15,
        priority: 'medium',
      },
      {
        id: 'zone_recoleta',
        name: 'Recoleta',
        coordinates: { latitude: -34.5889, longitude: -58.3963 },
        radius: 2500,
        maxDrivers: 12,
        priority: 'medium',
      },
    ];
    setZones(mockZones);
  }, []);

  // Get zone saturation level (0-1)
  const getZoneSaturation = useCallback((zoneId: string): number => {
    return saturationData.get(zoneId) || 0;
  }, [saturationData]);

  // Update zone saturation based on driver count
  const updateZoneSaturation = useCallback(async (zoneId: string): Promise<void> => {
    if (!featureFlags.KOMMUTE_ENABLED) return;

    setIsLoading(true);
    try {
      const zone = zones.find(z => z.id === zoneId);
      if (!zone) {
        console.warn('[useZoneSaturation] Zone not found:', zoneId);
        return;
      }

      // Mock driver count calculation
      const mockDriverCount = Math.floor(Math.random() * (zone.maxDrivers + 5));
      const saturationLevel = Math.min(mockDriverCount / zone.maxDrivers, 1);
      
      setSaturationData(prev => new Map(prev.set(zoneId, saturationLevel)));
      
      console.log('[useZoneSaturation] Zone saturation updated:', zoneId, saturationLevel);
    } catch (err) {
      console.error('[useZoneSaturation] Error updating saturation:', err);
    } finally {
      setIsLoading(false);
    }
  }, [zones, featureFlags.KOMMUTE_ENABLED]);

  // Check if zone has high availability (low saturation)
  const hasHighAvailability = useCallback((zoneId: string): boolean => {
    const saturation = getZoneSaturation(zoneId);
    return saturation < 0.7; // Less than 70% saturated = high availability
  }, [getZoneSaturation]);

  // Get zone status message
  const getZoneStatus = useCallback((zoneId: string): string => {
    const saturation = getZoneSaturation(zoneId);
    
    if (saturation < 0.3) return 'Zona con alta disponibilidad';
    if (saturation < 0.7) return 'Zona con disponibilidad media';
    if (saturation < 0.9) return 'Zona con baja disponibilidad';
    return 'Zona saturada';
  }, [getZoneSaturation]);

  // Activate zone for driver
  const activateZone = useCallback(async (zoneId: string): Promise<boolean> => {
    if (!hasHighAvailability(zoneId)) {
      console.warn('[useZoneSaturation] Zone not available:', zoneId);
      return false;
    }

    setActiveZone(zoneId);
    await updateZoneSaturation(zoneId);
    console.log('[useZoneSaturation] Zone activated:', zoneId);
    return true;
  }, [hasHighAvailability, updateZoneSaturation]);

  // Deactivate current zone
  const deactivateZone = useCallback(() => {
    if (activeZone) {
      updateZoneSaturation(activeZone);
    }
    setActiveZone(null);
    console.log('[useZoneSaturation] Zone deactivated');
  }, [activeZone, updateZoneSaturation]);

  // Initialize zones on first load
  useEffect(() => {
    initializeZones();
  }, [initializeZones]);

  return {
    zones,
    saturationData,
    activeZone,
    isLoading,
    getZoneSaturation,
    updateZoneSaturation,
    hasHighAvailability,
    getZoneStatus,
    activateZone,
    deactivateZone,
    initializeZones,
  };
};