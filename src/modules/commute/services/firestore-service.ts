// ============================================================================
// FIRESTORE SERVICE FOR 2KOMMUTE
// ============================================================================
// Handles all Firebase Firestore operations for routes, trips, and tracking

import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  onSnapshot,
  Timestamp,
  writeBatch,
  QueryConstraint
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { 
  Route, 
  Trip, 
  TrackingPoint,
  TripChain,
  TripQueueEntry,
  DriverAvailability 
} from '../types/core-types';

// ============================================================================
// COLLECTION NAMES
// ============================================================================

const COLLECTIONS = {
  ROUTES: 'kommute_routes',
  TRIPS: 'kommute_trips',
  TRACKING_POINTS: 'kommute_tracking_points',
  TRIP_CHAINS: 'kommute_trip_chains',
  TRIP_QUEUE: 'kommute_trip_queue',
  DRIVER_AVAILABILITY: 'kommute_driver_availability',
  ANALYTICS: 'kommute_analytics',
} as const;

// ============================================================================
// TYPE CONVERTERS
// ============================================================================

const dateToTimestamp = (date: Date): Timestamp => {
  return Timestamp.fromDate(date);
};

const timestampToDate = (timestamp: any): Date => {
  if (timestamp?.toDate) {
    return timestamp.toDate();
  }
  if (timestamp instanceof Date) {
    return timestamp;
  }
  return new Date(timestamp);
};

const convertRouteToFirestore = (route: Route): any => {
  return {
    ...route,
    createdAt: dateToTimestamp(route.createdAt),
    updatedAt: dateToTimestamp(route.updatedAt),
    points: route.points.map(point => ({
      ...point,
      estimatedArrival: point.estimatedArrival ? dateToTimestamp(point.estimatedArrival) : null,
      actualArrival: point.actualArrival ? dateToTimestamp(point.actualArrival) : null,
    })),
    recurringPattern: route.recurringPattern ? {
      ...route.recurringPattern,
      startDate: dateToTimestamp(route.recurringPattern.startDate),
      endDate: route.recurringPattern.endDate ? dateToTimestamp(route.recurringPattern.endDate) : null,
      exceptions: route.recurringPattern.exceptions?.map(dateToTimestamp) || [],
    } : null,
  };
};

const convertRouteFromFirestore = (data: any): Route => {
  return {
    ...data,
    createdAt: timestampToDate(data.createdAt),
    updatedAt: timestampToDate(data.updatedAt),
    points: data.points.map((point: any) => ({
      ...point,
      estimatedArrival: point.estimatedArrival ? timestampToDate(point.estimatedArrival) : undefined,
      actualArrival: point.actualArrival ? timestampToDate(point.actualArrival) : undefined,
    })),
    recurringPattern: data.recurringPattern ? {
      ...data.recurringPattern,
      startDate: timestampToDate(data.recurringPattern.startDate),
      endDate: data.recurringPattern.endDate ? timestampToDate(data.recurringPattern.endDate) : undefined,
      exceptions: data.recurringPattern.exceptions?.map(timestampToDate) || [],
    } : undefined,
  };
};

const convertTripToFirestore = (trip: Trip): any => {
  return {
    ...trip,
    startTime: dateToTimestamp(trip.startTime),
    endTime: trip.endTime ? dateToTimestamp(trip.endTime) : null,
    trackingPoints: trip.trackingPoints.map(point => ({
      ...point,
      timestamp: dateToTimestamp(point.timestamp),
    })),
  };
};

const convertTripFromFirestore = (data: any): Trip => {
  return {
    ...data,
    startTime: timestampToDate(data.startTime),
    endTime: data.endTime ? timestampToDate(data.endTime) : undefined,
    trackingPoints: data.trackingPoints.map((point: any) => ({
      ...point,
      timestamp: timestampToDate(point.timestamp),
    })),
  };
};

// ============================================================================
// ROUTE OPERATIONS
// ============================================================================

export const firestoreService = {
  routes: {
    async create(route: Route): Promise<void> {
      const routeRef = doc(db, COLLECTIONS.ROUTES, route.id);
      await setDoc(routeRef, convertRouteToFirestore(route));
      console.log('[FirestoreService] Route created:', route.id);
    },

    async update(routeId: string, updates: Partial<Route>): Promise<void> {
      const routeRef = doc(db, COLLECTIONS.ROUTES, routeId);
      const firestoreUpdates: any = { ...updates };
      
      if (updates.updatedAt) {
        firestoreUpdates.updatedAt = dateToTimestamp(updates.updatedAt);
      }
      
      if (updates.points) {
        firestoreUpdates.points = updates.points.map(point => ({
          ...point,
          estimatedArrival: point.estimatedArrival ? dateToTimestamp(point.estimatedArrival) : null,
          actualArrival: point.actualArrival ? dateToTimestamp(point.actualArrival) : null,
        }));
      }
      
      await updateDoc(routeRef, firestoreUpdates);
      console.log('[FirestoreService] Route updated:', routeId);
    },

    async delete(routeId: string): Promise<void> {
      const routeRef = doc(db, COLLECTIONS.ROUTES, routeId);
      await deleteDoc(routeRef);
      console.log('[FirestoreService] Route deleted:', routeId);
    },

    async get(routeId: string): Promise<Route | null> {
      const routeRef = doc(db, COLLECTIONS.ROUTES, routeId);
      const routeSnap = await getDoc(routeRef);
      
      if (!routeSnap.exists()) {
        return null;
      }
      
      return convertRouteFromFirestore(routeSnap.data());
    },

    async getByUser(userId: string): Promise<Route[]> {
      const routesRef = collection(db, COLLECTIONS.ROUTES);
      const q = query(
        routesRef, 
        where('userId', '==', userId)
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => convertRouteFromFirestore(doc.data()));
    },

    subscribeToUserRoutes(userId: string, callback: (routes: Route[]) => void): () => void {
      const routesRef = collection(db, COLLECTIONS.ROUTES);
      const q = query(
        routesRef, 
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      
      return onSnapshot(q, (snapshot) => {
        const routes = snapshot.docs.map(doc => convertRouteFromFirestore(doc.data()));
        callback(routes);
      });
    },
  },

  // ============================================================================
  // TRIP OPERATIONS
  // ============================================================================

  trips: {
    async create(trip: Trip): Promise<void> {
      const tripRef = doc(db, COLLECTIONS.TRIPS, trip.id);
      await setDoc(tripRef, convertTripToFirestore(trip));
      console.log('[FirestoreService] Trip created:', trip.id);
    },

    async update(tripId: string, updates: Partial<Trip>): Promise<void> {
      const tripRef = doc(db, COLLECTIONS.TRIPS, tripId);
      const firestoreUpdates: any = { ...updates };
      
      if (updates.startTime) {
        firestoreUpdates.startTime = dateToTimestamp(updates.startTime);
      }
      
      if (updates.endTime) {
        firestoreUpdates.endTime = dateToTimestamp(updates.endTime);
      }
      
      if (updates.trackingPoints) {
        firestoreUpdates.trackingPoints = updates.trackingPoints.map(point => ({
          ...point,
          timestamp: dateToTimestamp(point.timestamp),
        }));
      }
      
      await updateDoc(tripRef, firestoreUpdates);
      console.log('[FirestoreService] Trip updated:', tripId);
    },

    async delete(tripId: string): Promise<void> {
      const tripRef = doc(db, COLLECTIONS.TRIPS, tripId);
      await deleteDoc(tripRef);
      console.log('[FirestoreService] Trip deleted:', tripId);
    },

    async get(tripId: string): Promise<Trip | null> {
      const tripRef = doc(db, COLLECTIONS.TRIPS, tripId);
      const tripSnap = await getDoc(tripRef);
      
      if (!tripSnap.exists()) {
        return null;
      }
      
      return convertTripFromFirestore(tripSnap.data());
    },

    async getByUser(userId: string, limitCount?: number): Promise<Trip[]> {
      const tripsRef = collection(db, COLLECTIONS.TRIPS);
      const constraints: QueryConstraint[] = [
        where('userId', '==', userId)
      ];
      
      if (limitCount) {
        constraints.push(limit(limitCount));
      }
      
      const q = query(tripsRef, ...constraints);
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => convertTripFromFirestore(doc.data()));
    },

    async getByRoute(routeId: string): Promise<Trip[]> {
      const tripsRef = collection(db, COLLECTIONS.TRIPS);
      const q = query(
        tripsRef, 
        where('routeId', '==', routeId),
        orderBy('startTime', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => convertTripFromFirestore(doc.data()));
    },

    subscribeToUserTrips(userId: string, callback: (trips: Trip[]) => void): () => void {
      const tripsRef = collection(db, COLLECTIONS.TRIPS);
      const q = query(
        tripsRef, 
        where('userId', '==', userId),
        orderBy('startTime', 'desc')
      );
      
      return onSnapshot(q, (snapshot) => {
        const trips = snapshot.docs.map(doc => convertTripFromFirestore(doc.data()));
        callback(trips);
      });
    },

    subscribeToTrip(tripId: string, callback: (trip: Trip | null) => void): () => void {
      const tripRef = doc(db, COLLECTIONS.TRIPS, tripId);
      
      return onSnapshot(tripRef, (snapshot) => {
        if (!snapshot.exists()) {
          callback(null);
          return;
        }
        callback(convertTripFromFirestore(snapshot.data()));
      });
    },
  },

  // ============================================================================
  // TRACKING POINTS OPERATIONS
  // ============================================================================

  tracking: {
    async addPoint(point: TrackingPoint): Promise<void> {
      const pointRef = doc(db, COLLECTIONS.TRACKING_POINTS, point.id);
      await setDoc(pointRef, {
        ...point,
        timestamp: dateToTimestamp(point.timestamp),
      });
    },

    async addPointsBatch(points: TrackingPoint[]): Promise<void> {
      const batch = writeBatch(db);
      
      points.forEach(point => {
        const pointRef = doc(db, COLLECTIONS.TRACKING_POINTS, point.id);
        batch.set(pointRef, {
          ...point,
          timestamp: dateToTimestamp(point.timestamp),
        });
      });
      
      await batch.commit();
      console.log('[FirestoreService] Batch tracking points added:', points.length);
    },

    async getByTrip(tripId: string): Promise<TrackingPoint[]> {
      const pointsRef = collection(db, COLLECTIONS.TRACKING_POINTS);
      const q = query(
        pointsRef, 
        where('tripId', '==', tripId),
        orderBy('timestamp', 'asc')
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          timestamp: timestampToDate(data.timestamp),
        } as TrackingPoint;
      });
    },

    subscribeToTripTracking(tripId: string, callback: (points: TrackingPoint[]) => void): () => void {
      const pointsRef = collection(db, COLLECTIONS.TRACKING_POINTS);
      const q = query(
        pointsRef, 
        where('tripId', '==', tripId),
        orderBy('timestamp', 'asc')
      );
      
      return onSnapshot(q, (snapshot) => {
        const points = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            ...data,
            timestamp: timestampToDate(data.timestamp),
          } as TrackingPoint;
        });
        callback(points);
      });
    },
  },

  // ============================================================================
  // TRIP CHAINING OPERATIONS
  // ============================================================================

  tripChains: {
    async create(chain: TripChain): Promise<void> {
      const chainRef = doc(db, COLLECTIONS.TRIP_CHAINS, chain.id);
      await setDoc(chainRef, {
        ...chain,
        createdAt: dateToTimestamp(chain.createdAt),
        updatedAt: dateToTimestamp(chain.updatedAt),
        trips: chain.trips.map(convertTripToFirestore),
      });
      console.log('[FirestoreService] Trip chain created:', chain.id);
    },

    async update(chainId: string, updates: Partial<TripChain>): Promise<void> {
      const chainRef = doc(db, COLLECTIONS.TRIP_CHAINS, chainId);
      const firestoreUpdates: any = { ...updates };
      
      if (updates.updatedAt) {
        firestoreUpdates.updatedAt = dateToTimestamp(updates.updatedAt);
      }
      
      if (updates.trips) {
        firestoreUpdates.trips = updates.trips.map(convertTripToFirestore);
      }
      
      await updateDoc(chainRef, firestoreUpdates);
      console.log('[FirestoreService] Trip chain updated:', chainId);
    },

    async getByDriver(driverId: string): Promise<TripChain[]> {
      const chainsRef = collection(db, COLLECTIONS.TRIP_CHAINS);
      const q = query(
        chainsRef, 
        where('driverId', '==', driverId),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          createdAt: timestampToDate(data.createdAt),
          updatedAt: timestampToDate(data.updatedAt),
          trips: data.trips.map(convertTripFromFirestore),
        } as TripChain;
      });
    },

    subscribeToDriverChains(driverId: string, callback: (chains: TripChain[]) => void): () => void {
      const chainsRef = collection(db, COLLECTIONS.TRIP_CHAINS);
      const q = query(
        chainsRef, 
        where('driverId', '==', driverId),
        orderBy('createdAt', 'desc')
      );
      
      return onSnapshot(q, (snapshot) => {
        const chains = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            ...data,
            createdAt: timestampToDate(data.createdAt),
            updatedAt: timestampToDate(data.updatedAt),
            trips: data.trips.map(convertTripFromFirestore),
          } as TripChain;
        });
        callback(chains);
      });
    },
  },

  // ============================================================================
  // TRIP QUEUE OPERATIONS
  // ============================================================================

  tripQueue: {
    async add(entry: TripQueueEntry): Promise<void> {
      const entryRef = doc(db, COLLECTIONS.TRIP_QUEUE, entry.id);
      await setDoc(entryRef, {
        ...entry,
        requestedTime: dateToTimestamp(entry.requestedTime),
        createdAt: dateToTimestamp(entry.createdAt),
        expiresAt: dateToTimestamp(entry.expiresAt),
      });
      console.log('[FirestoreService] Trip queue entry added:', entry.id);
    },

    async update(entryId: string, updates: Partial<TripQueueEntry>): Promise<void> {
      const entryRef = doc(db, COLLECTIONS.TRIP_QUEUE, entryId);
      await updateDoc(entryRef, updates);
    },

    async getActive(): Promise<TripQueueEntry[]> {
      const queueRef = collection(db, COLLECTIONS.TRIP_QUEUE);
      const q = query(
        queueRef, 
        where('status', '==', 'queued'),
        where('expiresAt', '>', Timestamp.now()),
        orderBy('expiresAt', 'asc'),
        orderBy('priority', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          requestedTime: timestampToDate(data.requestedTime),
          createdAt: timestampToDate(data.createdAt),
          expiresAt: timestampToDate(data.expiresAt),
        } as TripQueueEntry;
      });
    },

    subscribeToActiveQueue(callback: (entries: TripQueueEntry[]) => void): () => void {
      const queueRef = collection(db, COLLECTIONS.TRIP_QUEUE);
      const q = query(
        queueRef, 
        where('status', '==', 'queued'),
        where('expiresAt', '>', Timestamp.now()),
        orderBy('expiresAt', 'asc'),
        orderBy('priority', 'desc')
      );
      
      return onSnapshot(q, (snapshot) => {
        const entries = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            ...data,
            requestedTime: timestampToDate(data.requestedTime),
            createdAt: timestampToDate(data.createdAt),
            expiresAt: timestampToDate(data.expiresAt),
          } as TripQueueEntry;
        });
        callback(entries);
      });
    },
  },

  // ============================================================================
  // DRIVER AVAILABILITY OPERATIONS
  // ============================================================================

  driverAvailability: {
    async update(availability: DriverAvailability): Promise<void> {
      const availRef = doc(db, COLLECTIONS.DRIVER_AVAILABILITY, availability.driverId);
      await setDoc(availRef, {
        ...availability,
        currentLocation: {
          ...availability.currentLocation,
          timestamp: dateToTimestamp(availability.currentLocation.timestamp),
        },
        estimatedCompletionTime: availability.estimatedCompletionTime 
          ? dateToTimestamp(availability.estimatedCompletionTime) 
          : null,
        targetDestination: availability.targetDestination ? {
          ...availability.targetDestination,
          arrivalBy: availability.targetDestination.arrivalBy 
            ? dateToTimestamp(availability.targetDestination.arrivalBy) 
            : null,
        } : null,
      });
    },

    async get(driverId: string): Promise<DriverAvailability | null> {
      const availRef = doc(db, COLLECTIONS.DRIVER_AVAILABILITY, driverId);
      const availSnap = await getDoc(availRef);
      
      if (!availSnap.exists()) {
        return null;
      }
      
      const data = availSnap.data();
      return {
        ...data,
        currentLocation: {
          ...data.currentLocation,
          timestamp: timestampToDate(data.currentLocation.timestamp),
        },
        estimatedCompletionTime: data.estimatedCompletionTime 
          ? timestampToDate(data.estimatedCompletionTime) 
          : undefined,
        targetDestination: data.targetDestination ? {
          ...data.targetDestination,
          arrivalBy: data.targetDestination.arrivalBy 
            ? timestampToDate(data.targetDestination.arrivalBy) 
            : undefined,
        } : undefined,
      } as DriverAvailability;
    },

    async getAvailableDrivers(): Promise<DriverAvailability[]> {
      const availRef = collection(db, COLLECTIONS.DRIVER_AVAILABILITY);
      const q = query(
        availRef, 
        where('isAcceptingChainedTrips', '==', true)
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          currentLocation: {
            ...data.currentLocation,
            timestamp: timestampToDate(data.currentLocation.timestamp),
          },
          estimatedCompletionTime: data.estimatedCompletionTime 
            ? timestampToDate(data.estimatedCompletionTime) 
            : undefined,
          targetDestination: data.targetDestination ? {
            ...data.targetDestination,
            arrivalBy: data.targetDestination.arrivalBy 
              ? timestampToDate(data.targetDestination.arrivalBy) 
              : undefined,
          } : undefined,
        } as DriverAvailability;
      });
    },

    subscribeToDriver(driverId: string, callback: (availability: DriverAvailability | null) => void): () => void {
      const availRef = doc(db, COLLECTIONS.DRIVER_AVAILABILITY, driverId);
      
      return onSnapshot(availRef, (snapshot) => {
        if (!snapshot.exists()) {
          callback(null);
          return;
        }
        
        const data = snapshot.data();
        callback({
          ...data,
          currentLocation: {
            ...data.currentLocation,
            timestamp: timestampToDate(data.currentLocation.timestamp),
          },
          estimatedCompletionTime: data.estimatedCompletionTime 
            ? timestampToDate(data.estimatedCompletionTime) 
            : undefined,
          targetDestination: data.targetDestination ? {
            ...data.targetDestination,
            arrivalBy: data.targetDestination.arrivalBy 
              ? timestampToDate(data.targetDestination.arrivalBy) 
              : undefined,
          } : undefined,
        } as DriverAvailability);
      });
    },
  },

  // ============================================================================
  // UTILITY OPERATIONS
  // ============================================================================

  utils: {
    async clearUserData(userId: string): Promise<void> {
      const batch = writeBatch(db);
      
      const routesRef = collection(db, COLLECTIONS.ROUTES);
      const routesQuery = query(routesRef, where('userId', '==', userId));
      const routesSnapshot = await getDocs(routesQuery);
      routesSnapshot.docs.forEach(doc => batch.delete(doc.ref));
      
      const tripsRef = collection(db, COLLECTIONS.TRIPS);
      const tripsQuery = query(tripsRef, where('userId', '==', userId));
      const tripsSnapshot = await getDocs(tripsQuery);
      tripsSnapshot.docs.forEach(doc => batch.delete(doc.ref));
      
      await batch.commit();
      console.log('[FirestoreService] User data cleared:', userId);
    },

    async getStats(userId: string): Promise<{
      totalRoutes: number;
      totalTrips: number;
      completedTrips: number;
      totalDistance: number;
      totalDuration: number;
    }> {
      const [routes, trips] = await Promise.all([
        firestoreService.routes.getByUser(userId),
        firestoreService.trips.getByUser(userId),
      ]);
      
      const completedTrips = trips.filter(t => t.status === 'completed');
      const totalDistance = completedTrips.reduce((sum, t) => sum + (t.actualDistance || 0), 0);
      const totalDuration = completedTrips.reduce((sum, t) => sum + (t.actualDuration || 0), 0);
      
      return {
        totalRoutes: routes.length,
        totalTrips: trips.length,
        completedTrips: completedTrips.length,
        totalDistance,
        totalDuration,
      };
    },
  },
};

export default firestoreService;
