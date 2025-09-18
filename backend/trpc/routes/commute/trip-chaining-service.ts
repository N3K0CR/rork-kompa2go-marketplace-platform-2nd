// ============================================================================
// TRIP CHAINING SERVICE
// ============================================================================
// Service for managing consecutive trips and driver queues

import { 
  Trip, 
  TripChain, 
  TripQueueEntry, 
  FindNextTripsInput,
  AcceptNextTripInput,
  CreateTripChainInput,
  RealTimeEvent 
} from './types';

class TripChainingServiceClass {
  private tripChains = new Map<string, TripChain>();
  private tripQueue = new Map<string, TripQueueEntry>();
  private driverLocations = new Map<string, { latitude: number; longitude: number; timestamp: Date }>();
  private proximityIndex = new Map<string, string[]>(); // Grid-based spatial index

  // ============================================================================
  // TRIP CHAIN MANAGEMENT
  // ============================================================================

  /**
   * Creates a new trip chain for a driver
   */
  createTripChain(input: CreateTripChainInput): TripChain {
    console.log('🔗 Creating trip chain for driver:', input.driverId);
    
    const chainId = `chain_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const tripChain: TripChain = {
      id: chainId,
      driverId: input.driverId,
      trips: [],
      status: 'active',
      totalDistance: 0,
      totalDuration: 0,
      totalEarnings: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    this.tripChains.set(chainId, tripChain);
    
    // Emit chain started event
    this.emitEvent({
      id: `event_${Date.now()}`,
      type: 'trip_chain_started',
      userId: input.driverId,
      chainId,
      data: { chainId, driverId: input.driverId },
      timestamp: new Date(),
      priority: 'medium',
    });
    
    return tripChain;
  }

  /**
   * Adds a trip to an existing chain
   */
  addTripToChain(chainId: string, trip: Trip): boolean {
    console.log('➕ Adding trip to chain:', chainId, trip.id);
    
    const chain = this.tripChains.get(chainId);
    if (!chain) {
      console.error('❌ Chain not found:', chainId);
      return false;
    }
    
    // Update trip with chain information
    const updatedTrip = {
      ...trip,
      chainId,
      previousTripId: chain.trips.length > 0 ? chain.trips[chain.trips.length - 1].id : undefined,
    };
    
    // Update previous trip's nextTripId
    if (chain.trips.length > 0) {
      const lastTrip = chain.trips[chain.trips.length - 1];
      lastTrip.nextTripId = trip.id;
    }
    
    chain.trips.push(updatedTrip);
    chain.updatedAt = new Date();
    
    // Update chain metrics
    this.updateChainMetrics(chainId);
    
    return true;
  }

  /**
   * Completes a trip chain
   */
  completeTripChain(chainId: string): boolean {
    console.log('✅ Completing trip chain:', chainId);
    
    const chain = this.tripChains.get(chainId);
    if (!chain) {
      console.error('❌ Chain not found:', chainId);
      return false;
    }
    
    chain.status = 'completed';
    chain.updatedAt = new Date();
    
    // Emit chain completed event
    this.emitEvent({
      id: `event_${Date.now()}`,
      type: 'trip_chain_completed',
      userId: chain.driverId,
      chainId,
      data: {
        chainId,
        totalTrips: chain.trips.length,
        totalDistance: chain.totalDistance,
        totalDuration: chain.totalDuration,
        totalEarnings: chain.totalEarnings,
      },
      timestamp: new Date(),
      priority: 'medium',
    });
    
    return true;
  }

  // ============================================================================
  // TRIP QUEUE MANAGEMENT
  // ============================================================================

  /**
   * Adds a trip request to the queue
   */
  addTripToQueue(entry: Omit<TripQueueEntry, 'id' | 'createdAt' | 'expiresAt'>): TripQueueEntry {
    console.log('📋 Adding trip to queue:', entry.tripId);
    
    const queueId = `queue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date();
    const expiresAt = new Date(now.getTime() + entry.maxWaitTime * 1000);
    
    const queueEntry: TripQueueEntry = {
      ...entry,
      id: queueId,
      createdAt: now,
      expiresAt,
    };
    
    this.tripQueue.set(queueId, queueEntry);
    
    // Add to spatial index for proximity matching
    this.addToProximityIndex(queueEntry);
    
    // Set expiration timer
    setTimeout(() => {
      this.expireQueueEntry(queueId);
    }, entry.maxWaitTime * 1000);
    
    return queueEntry;
  }

  /**
   * Finds next available trips for a driver
   */
  findNextTrips(input: FindNextTripsInput): TripQueueEntry[] {
    console.log('🔍 Finding next trips for:', input.currentTripId);
    
    const currentTime = new Date();
    const availableEntries: TripQueueEntry[] = [];
    
    // Get all queued entries
    for (const entry of this.tripQueue.values()) {
      if (entry.status !== 'queued') continue;
      if (entry.expiresAt <= currentTime) continue;
      
      // Check proximity
      const distance = this.calculateDistance(
        input.currentLocation,
        entry.pickupLocation
      );
      
      if (distance <= input.maxProximityRadius) {
        // Check timing - trip should be available before current trip completion
        const timeToPickup = this.estimateTimeToLocation(
          input.currentLocation,
          entry.pickupLocation
        );
        
        if (timeToPickup <= input.maxWaitTime) {
          availableEntries.push(entry);
        }
      }
    }
    
    // Sort by priority and proximity
    return availableEntries.sort((a, b) => {
      const distanceA = this.calculateDistance(input.currentLocation, a.pickupLocation);
      const distanceB = this.calculateDistance(input.currentLocation, b.pickupLocation);
      
      // Higher priority first, then closer distance
      if (a.priority !== b.priority) {
        return b.priority - a.priority;
      }
      return distanceA - distanceB;
    });
  }

  /**
   * Accepts a next trip and creates the chain link
   */
  acceptNextTrip(input: AcceptNextTripInput): boolean {
    console.log('✅ Accepting next trip:', input.nextTripId);
    
    // Find the queue entry
    const queueEntry = Array.from(this.tripQueue.values())
      .find(entry => entry.tripId === input.nextTripId);
    
    if (!queueEntry || queueEntry.status !== 'queued') {
      console.error('❌ Queue entry not found or not available:', input.nextTripId);
      return false;
    }
    
    // Mark as matched
    queueEntry.status = 'matched';
    
    // Emit events
    this.emitEvent({
      id: `event_${Date.now()}`,
      type: 'next_trip_accepted',
      userId: queueEntry.passengerId,
      tripId: input.nextTripId,
      data: {
        currentTripId: input.currentTripId,
        nextTripId: input.nextTripId,
        estimatedTransitionTime: input.estimatedTransitionTime,
      },
      timestamp: new Date(),
      priority: 'high',
    });
    
    return true;
  }

  // ============================================================================
  // PROXIMITY AND MATCHING ALGORITHMS
  // ============================================================================

  /**
   * Updates driver location for proximity matching
   */
  updateDriverLocation(driverId: string, location: { latitude: number; longitude: number }) {
    this.driverLocations.set(driverId, {
      ...location,
      timestamp: new Date(),
    });
  }

  /**
   * Checks if a driver is approaching trip completion (5 minutes before)
   */
  checkTripCompletion(tripId: string, currentLocation: { latitude: number; longitude: number }): boolean {
    // This would integrate with the actual trip tracking
    // For now, we'll simulate based on location and estimated completion time
    
    // In a real implementation, this would:
    // 1. Get the trip's destination
    // 2. Calculate remaining distance
    // 3. Estimate time to completion
    // 4. Return true if within 5 minutes of completion
    
    return Math.random() > 0.7; // Simulate 30% chance of being near completion
  }

  /**
   * Finds nearby trips for a completing trip
   */
  findNearbyTripsForCompletion(tripId: string, location: { latitude: number; longitude: number }): TripQueueEntry[] {
    console.log('🎯 Finding nearby trips for completing trip:', tripId);
    
    const nearbyTrips: TripQueueEntry[] = [];
    const maxDistance = 5000; // 5km radius
    
    for (const entry of this.tripQueue.values()) {
      if (entry.status !== 'queued') continue;
      
      const distance = this.calculateDistance(location, entry.pickupLocation);
      if (distance <= maxDistance) {
        nearbyTrips.push(entry);
      }
    }
    
    return nearbyTrips.sort((a, b) => {
      const distanceA = this.calculateDistance(location, a.pickupLocation);
      const distanceB = this.calculateDistance(location, b.pickupLocation);
      return distanceA - distanceB;
    });
  }

  // ============================================================================
  // EVENT HANDLING
  // ============================================================================

  /**
   * Emits a real-time event (simplified version)
   */
  private emitEvent(event: Omit<RealTimeEvent, 'id'> & { id?: string }) {
    const fullEvent: RealTimeEvent = {
      id: event.id || `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: event.type,
      userId: event.userId,
      tripId: event.tripId,
      teamId: event.teamId,
      chainId: event.chainId,
      data: event.data,
      timestamp: event.timestamp,
      priority: event.priority,
    };
    
    console.log('📡 Emitting event:', fullEvent.type, 'for user:', fullEvent.userId);
    // In a real implementation, this would broadcast to connected clients
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  private updateChainMetrics(chainId: string) {
    const chain = this.tripChains.get(chainId);
    if (!chain) return;
    
    chain.totalDistance = chain.trips.reduce((sum, trip) => sum + (trip.actualDistance || 0), 0);
    chain.totalDuration = chain.trips.reduce((sum, trip) => sum + (trip.actualDuration || 0), 0);
    chain.totalEarnings = chain.trips.reduce((sum, trip) => sum + (trip.actualCost || 0), 0);
  }

  private addToProximityIndex(entry: TripQueueEntry) {
    // Simple grid-based spatial indexing
    const gridSize = 0.01; // ~1km grid cells
    const gridX = Math.floor(entry.pickupLocation.latitude / gridSize);
    const gridY = Math.floor(entry.pickupLocation.longitude / gridSize);
    const gridKey = `${gridX},${gridY}`;
    
    if (!this.proximityIndex.has(gridKey)) {
      this.proximityIndex.set(gridKey, []);
    }
    this.proximityIndex.get(gridKey)!.push(entry.id);
  }

  private expireQueueEntry(queueId: string) {
    const entry = this.tripQueue.get(queueId);
    if (entry && entry.status === 'queued') {
      entry.status = 'expired';
      console.log('⏰ Queue entry expired:', queueId);
    }
  }

  private calculateDistance(
    point1: { latitude: number; longitude: number },
    point2: { latitude: number; longitude: number }
  ): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = point1.latitude * Math.PI / 180;
    const φ2 = point2.latitude * Math.PI / 180;
    const Δφ = (point2.latitude - point1.latitude) * Math.PI / 180;
    const Δλ = (point2.longitude - point1.longitude) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
  }

  private estimateTimeToLocation(
    from: { latitude: number; longitude: number },
    to: { latitude: number; longitude: number }
  ): number {
    const distance = this.calculateDistance(from, to);
    const averageSpeed = 30; // km/h in urban areas
    return (distance / 1000) / averageSpeed * 3600; // seconds
  }

  // ============================================================================
  // PUBLIC API METHODS
  // ============================================================================

  /**
   * Gets active trip chains for a driver
   */
  getDriverChains(driverId: string): TripChain[] {
    return Array.from(this.tripChains.values())
      .filter(chain => chain.driverId === driverId && chain.status === 'active');
  }

  /**
   * Gets queue statistics
   */
  getQueueStats() {
    const totalQueued = Array.from(this.tripQueue.values())
      .filter(entry => entry.status === 'queued').length;
    
    const totalMatched = Array.from(this.tripQueue.values())
      .filter(entry => entry.status === 'matched').length;
    
    const totalExpired = Array.from(this.tripQueue.values())
      .filter(entry => entry.status === 'expired').length;
    
    return {
      totalQueued,
      totalMatched,
      totalExpired,
      activeChains: this.tripChains.size,
      lastUpdate: new Date(),
    };
  }

  /**
   * Cleans up expired entries and completed chains
   */
  cleanup() {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 3600000);
    
    // Remove expired queue entries
    for (const [id, entry] of this.tripQueue.entries()) {
      if (entry.expiresAt <= now || entry.createdAt <= oneHourAgo) {
        this.tripQueue.delete(id);
      }
    }
    
    // Remove old completed chains
    for (const [id, chain] of this.tripChains.entries()) {
      if (chain.status === 'completed' && chain.updatedAt <= oneHourAgo) {
        this.tripChains.delete(id);
      }
    }
    
    console.log('🧹 Cleanup completed. Queue size:', this.tripQueue.size, 'Chains:', this.tripChains.size);
  }
}

// Export singleton instance
export const TripChainingService = new TripChainingServiceClass();

// Run cleanup every 10 minutes
setInterval(() => {
  TripChainingService.cleanup();
}, 600000);