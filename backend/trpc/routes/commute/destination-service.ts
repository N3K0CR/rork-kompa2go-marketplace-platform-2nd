// ============================================================================
// DESTINATION MODE SERVICE
// ============================================================================
// Service for managing destination mode functionality for drivers

import { 
  DestinationMode, 
  SetDestinationModeInput, 
  UpdateDestinationProgressInput,
  FindTripsToDestinationInput,
  TripQueueEntry 
} from './types';

// Haversine formula to calculate distance between two points
function calculateDistance(
  lat1: number, 
  lon1: number, 
  lat2: number, 
  lon2: number
): number {
  const R = 6371000; // Earth's radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Calculate bearing between two points
function calculateBearing(
  lat1: number, 
  lon1: number, 
  lat2: number, 
  lon2: number
): number {
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const y = Math.sin(dLon) * Math.cos(lat2 * Math.PI / 180);
  const x = Math.cos(lat1 * Math.PI / 180) * Math.sin(lat2 * Math.PI / 180) -
            Math.sin(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.cos(dLon);
  const bearing = Math.atan2(y, x) * 180 / Math.PI;
  return (bearing + 360) % 360;
}

// Calculate if a trip helps progress towards destination
function calculateDestinationScore(
  currentLocation: { latitude: number; longitude: number },
  tripDropoff: { latitude: number; longitude: number },
  destination: { latitude: number; longitude: number },
  maxDetourDistance: number,
  maxDetourTime: number
): {
  score: number;
  progressDistance: number;
  detourDistance: number;
  isViable: boolean;
} {
  // Distance from current location to destination (direct)
  const directDistance = calculateDistance(
    currentLocation.latitude,
    currentLocation.longitude,
    destination.latitude,
    destination.longitude
  );

  // Distance from trip dropoff to destination
  const dropoffToDestination = calculateDistance(
    tripDropoff.latitude,
    tripDropoff.longitude,
    destination.latitude,
    destination.longitude
  );

  // Progress made towards destination
  const progressDistance = directDistance - dropoffToDestination;
  const progressPercentage = progressDistance / directDistance;

  // Distance from current location to trip dropoff
  const currentToDropoff = calculateDistance(
    currentLocation.latitude,
    currentLocation.longitude,
    tripDropoff.latitude,
    tripDropoff.longitude
  );

  // Calculate detour (extra distance compared to direct route)
  const detourDistance = Math.max(0, currentToDropoff - progressDistance);

  // Check if trip is viable (within detour limits)
  const isViable = detourDistance <= maxDetourDistance;

  // Calculate score (higher is better)
  // Factors: progress percentage, detour penalty, distance to destination
  let score = 0;
  
  if (isViable && progressDistance > 0) {
    // Base score from progress percentage (0-100)
    score = progressPercentage * 100;
    
    // Penalty for detour (reduce score based on detour distance)
    const detourPenalty = (detourDistance / maxDetourDistance) * 30;
    score -= detourPenalty;
    
    // Bonus for getting closer to destination
    const proximityBonus = Math.max(0, 20 - (dropoffToDestination / 1000)); // Bonus for being within 20km
    score += proximityBonus;
    
    // Ensure score is not negative
    score = Math.max(0, score);
  }

  return {
    score,
    progressDistance,
    detourDistance,
    isViable
  };
}

// Mock database operations (replace with actual database calls)
const mockDestinationModes = new Map<string, DestinationMode>();
const mockTripQueue: TripQueueEntry[] = [];

export class DestinationModeService {
  // Set destination mode for a driver
  async setDestinationMode(
    driverId: string, 
    input: SetDestinationModeInput
  ): Promise<DestinationMode> {
    const destinationMode: DestinationMode = {
      id: `dest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      driverId,
      destination: input.destination,
      maxDetourDistance: input.maxDetourDistance,
      maxDetourTime: input.maxDetourTime,
      priority: input.priority,
      isActive: true,
      progressToDestination: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Deactivate any existing destination modes for this driver
    for (const [key, mode] of mockDestinationModes.entries()) {
      if (mode.driverId === driverId && mode.isActive) {
        mockDestinationModes.set(key, { ...mode, isActive: false, updatedAt: new Date() });
      }
    }

    mockDestinationModes.set(destinationMode.id, destinationMode);
    
    console.log(`[DestinationService] Set destination mode for driver ${driverId}:`, {
      destination: input.destination.address,
      maxDetour: input.maxDetourDistance,
      priority: input.priority
    });

    return destinationMode;
  }

  // Update progress towards destination
  async updateDestinationProgress(
    input: UpdateDestinationProgressInput
  ): Promise<DestinationMode | null> {
    const destinationMode = mockDestinationModes.get(input.destinationModeId);
    
    if (!destinationMode || !destinationMode.isActive) {
      return null;
    }

    // Calculate actual progress based on current location
    const distanceToDestination = calculateDistance(
      input.currentLocation.latitude,
      input.currentLocation.longitude,
      destinationMode.destination.latitude,
      destinationMode.destination.longitude
    );

    // Update progress
    const updatedMode: DestinationMode = {
      ...destinationMode,
      progressToDestination: input.progressPercentage,
      updatedAt: new Date(),
    };

    mockDestinationModes.set(input.destinationModeId, updatedMode);
    
    console.log(`[DestinationService] Updated progress for ${input.destinationModeId}:`, {
      progress: input.progressPercentage,
      distanceRemaining: distanceToDestination
    });

    return updatedMode;
  }

  // Find trips that help progress towards destination
  async findTripsToDestination(
    input: FindTripsToDestinationInput
  ): Promise<{
    trips: (TripQueueEntry & {
      destinationScore: number;
      progressDistance: number;
      detourDistance: number;
    })[];
    totalAvailable: number;
  }> {
    const destinationMode = mockDestinationModes.get(input.destinationModeId);
    
    if (!destinationMode || !destinationMode.isActive) {
      return { trips: [], totalAvailable: 0 };
    }

    // Get all available trips from queue
    const availableTrips = mockTripQueue.filter(trip => 
      trip.status === 'queued' && 
      trip.expiresAt > new Date()
    );

    // Score each trip based on how well it helps reach destination
    const scoredTrips = availableTrips.map(trip => {
      const analysis = calculateDestinationScore(
        input.currentLocation,
        trip.dropoffLocation,
        destinationMode.destination,
        destinationMode.maxDetourDistance,
        destinationMode.maxDetourTime
      );

      return {
        ...trip,
        destinationScore: analysis.score,
        progressDistance: analysis.progressDistance,
        detourDistance: analysis.detourDistance,
        isViable: analysis.isViable
      };
    })
    .filter(trip => trip.isViable && trip.destinationScore > 0)
    .sort((a, b) => b.destinationScore - a.destinationScore)
    .slice(0, input.maxResults);

    console.log(`[DestinationService] Found ${scoredTrips.length} viable trips for destination mode ${input.destinationModeId}`);

    return {
      trips: scoredTrips,
      totalAvailable: availableTrips.length
    };
  }

  // Get active destination mode for driver
  async getActiveDestinationMode(driverId: string): Promise<DestinationMode | null> {
    for (const mode of mockDestinationModes.values()) {
      if (mode.driverId === driverId && mode.isActive) {
        return mode;
      }
    }
    return null;
  }

  // Deactivate destination mode
  async deactivateDestinationMode(destinationModeId: string): Promise<boolean> {
    const destinationMode = mockDestinationModes.get(destinationModeId);
    
    if (!destinationMode) {
      return false;
    }

    const updatedMode: DestinationMode = {
      ...destinationMode,
      isActive: false,
      updatedAt: new Date(),
    };

    mockDestinationModes.set(destinationModeId, updatedMode);
    
    console.log(`[DestinationService] Deactivated destination mode ${destinationModeId}`);
    
    return true;
  }

  // Get destination mode statistics
  async getDestinationModeStats(driverId: string): Promise<{
    totalDestinationModes: number;
    activeDestinationMode: DestinationMode | null;
    averageProgress: number;
    tripsTowardsDestination: number;
  }> {
    const driverModes = Array.from(mockDestinationModes.values())
      .filter(mode => mode.driverId === driverId);
    
    const activeMode = driverModes.find(mode => mode.isActive) || null;
    const averageProgress = driverModes.length > 0 
      ? driverModes.reduce((sum, mode) => sum + mode.progressToDestination, 0) / driverModes.length
      : 0;

    return {
      totalDestinationModes: driverModes.length,
      activeDestinationMode: activeMode,
      averageProgress,
      tripsTowardsDestination: 0 // This would be calculated from actual trip data
    };
  }

  // Add mock trips to queue for testing
  addMockTripsToQueue(trips: TripQueueEntry[]): void {
    mockTripQueue.push(...trips);
    console.log(`[DestinationService] Added ${trips.length} mock trips to queue`);
  }

  // Clear mock data
  clearMockData(): void {
    mockDestinationModes.clear();
    mockTripQueue.length = 0;
    console.log('[DestinationService] Cleared all mock data');
  }
}

export const destinationModeService = new DestinationModeService();