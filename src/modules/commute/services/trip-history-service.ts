import AsyncStorage from '@react-native-async-storage/async-storage';
import { Trip, TrackingPoint } from '../types/core-types';

const TRIP_HISTORY_KEY = '@kommute_trip_history';
const MAX_HISTORY_ITEMS = 100;

export interface TripHistoryEntry extends Trip {
  vehicleType: string;
  vehicleName: string;
  originAddress: string;
  destinationAddress: string;
  driverName?: string;
  driverRating?: number;
  paymentMethod?: string;
  paymentStatus: 'pending' | 'completed' | 'failed';
  rating?: number;
  review?: string;
}

class TripHistoryService {
  async getTripHistory(userId: string): Promise<TripHistoryEntry[]> {
    try {
      const data = await AsyncStorage.getItem(`${TRIP_HISTORY_KEY}_${userId}`);
      if (!data) return [];
      
      const history: TripHistoryEntry[] = JSON.parse(data);
      return history.map(trip => ({
        ...trip,
        startTime: new Date(trip.startTime),
        endTime: trip.endTime ? new Date(trip.endTime) : undefined,
        trackingPoints: trip.trackingPoints.map(point => ({
          ...point,
          timestamp: new Date(point.timestamp),
        })),
      }));
    } catch (error) {
      console.error('[TripHistoryService] Error getting trip history:', error);
      return [];
    }
  }

  async addTripToHistory(userId: string, trip: TripHistoryEntry): Promise<void> {
    try {
      const history = await this.getTripHistory(userId);
      
      const updatedHistory = [trip, ...history].slice(0, MAX_HISTORY_ITEMS);
      
      await AsyncStorage.setItem(
        `${TRIP_HISTORY_KEY}_${userId}`,
        JSON.stringify(updatedHistory)
      );
      
      console.log('[TripHistoryService] Trip added to history:', trip.id);
    } catch (error) {
      console.error('[TripHistoryService] Error adding trip to history:', error);
      throw error;
    }
  }

  async updateTripInHistory(
    userId: string,
    tripId: string,
    updates: Partial<TripHistoryEntry>
  ): Promise<void> {
    try {
      const history = await this.getTripHistory(userId);
      
      const updatedHistory = history.map(trip =>
        trip.id === tripId ? { ...trip, ...updates } : trip
      );
      
      await AsyncStorage.setItem(
        `${TRIP_HISTORY_KEY}_${userId}`,
        JSON.stringify(updatedHistory)
      );
      
      console.log('[TripHistoryService] Trip updated in history:', tripId);
    } catch (error) {
      console.error('[TripHistoryService] Error updating trip in history:', error);
      throw error;
    }
  }

  async getTripById(userId: string, tripId: string): Promise<TripHistoryEntry | null> {
    try {
      const history = await this.getTripHistory(userId);
      return history.find(trip => trip.id === tripId) || null;
    } catch (error) {
      console.error('[TripHistoryService] Error getting trip by ID:', error);
      return null;
    }
  }

  async clearHistory(userId: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(`${TRIP_HISTORY_KEY}_${userId}`);
      console.log('[TripHistoryService] History cleared for user:', userId);
    } catch (error) {
      console.error('[TripHistoryService] Error clearing history:', error);
      throw error;
    }
  }

  async getStatistics(userId: string): Promise<{
    totalTrips: number;
    completedTrips: number;
    cancelledTrips: number;
    totalDistance: number;
    totalCost: number;
    averageRating: number;
  }> {
    try {
      const history = await this.getTripHistory(userId);
      
      const completedTrips = history.filter(trip => trip.status === 'completed');
      const cancelledTrips = history.filter(trip => trip.status === 'cancelled');
      
      const totalDistance = completedTrips.reduce(
        (sum, trip) => sum + (trip.actualDistance || 0),
        0
      );
      
      const totalCost = completedTrips.reduce(
        (sum, trip) => sum + (trip.actualCost || 0),
        0
      );
      
      const ratingsCount = completedTrips.filter(trip => trip.rating).length;
      const averageRating = ratingsCount > 0
        ? completedTrips.reduce((sum, trip) => sum + (trip.rating || 0), 0) / ratingsCount
        : 0;
      
      return {
        totalTrips: history.length,
        completedTrips: completedTrips.length,
        cancelledTrips: cancelledTrips.length,
        totalDistance: totalDistance / 1000,
        totalCost,
        averageRating,
      };
    } catch (error) {
      console.error('[TripHistoryService] Error getting statistics:', error);
      return {
        totalTrips: 0,
        completedTrips: 0,
        cancelledTrips: 0,
        totalDistance: 0,
        totalCost: 0,
        averageRating: 0,
      };
    }
  }
}

export const tripHistoryService = new TripHistoryService();
