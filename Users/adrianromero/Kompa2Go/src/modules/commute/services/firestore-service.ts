import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  where,
  onSnapshot,
  Timestamp,
  QueryConstraint,
  Unsubscribe,
} from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';

export interface FirestoreRoute {
  id?: string;
  driverId: string;
  origin: {
    latitude: number;
    longitude: number;
    address: string;
  };
  destination: {
    latitude: number;
    longitude: number;
    address: string;
  };
  departureTime: Date;
  availableSeats: number;
  pricePerSeat: number;
  status: 'active' | 'completed' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
}

export interface FirestoreTrip {
  id?: string;
  routeId: string;
  passengerId: string;
  driverId: string;
  status: 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled';
  pickupLocation: {
    latitude: number;
    longitude: number;
    address: string;
  };
  dropoffLocation: {
    latitude: number;
    longitude: number;
    address: string;
  };
  price: number;
  seatsRequested: number;
  createdAt: Date;
  updatedAt: Date;
}

export class FirestoreService {
  private ensureAuthenticated(): string {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User must be authenticated to perform this action');
    }
    return user.uid;
  }

  async createRoute(route: Omit<FirestoreRoute, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const userId = this.ensureAuthenticated();
      
      if (route.driverId !== userId) {
        throw new Error('Cannot create route for another user');
      }

      const routeData = {
        ...route,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      console.log('[FirestoreService] Creating route:', routeData);
      const docRef = await addDoc(collection(db, 'routes'), routeData);
      console.log('[FirestoreService] Route created with ID:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('[FirestoreService] Error creating route:', error);
      throw error;
    }
  }

  async updateRoute(routeId: string, updates: Partial<FirestoreRoute>): Promise<void> {
    try {
      this.ensureAuthenticated();

      const updateData = {
        ...updates,
        updatedAt: Timestamp.now(),
      };

      console.log('[FirestoreService] Updating route:', routeId);
      await updateDoc(doc(db, 'routes', routeId), updateData);
      console.log('[FirestoreService] Route updated successfully');
    } catch (error) {
      console.error('[FirestoreService] Error updating route:', error);
      throw error;
    }
  }

  async deleteRoute(routeId: string): Promise<void> {
    try {
      this.ensureAuthenticated();

      console.log('[FirestoreService] Deleting route:', routeId);
      await deleteDoc(doc(db, 'routes', routeId));
      console.log('[FirestoreService] Route deleted successfully');
    } catch (error) {
      console.error('[FirestoreService] Error deleting route:', error);
      throw error;
    }
  }

  async getRoute(routeId: string): Promise<FirestoreRoute | null> {
    try {
      this.ensureAuthenticated();

      console.log('[FirestoreService] Getting route:', routeId);
      const docSnap = await getDoc(doc(db, 'routes', routeId));
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          ...data,
          departureTime: data.departureTime.toDate(),
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate(),
        } as FirestoreRoute;
      }
      
      return null;
    } catch (error) {
      console.error('[FirestoreService] Error getting route:', error);
      throw error;
    }
  }

  async getRoutes(constraints: QueryConstraint[] = []): Promise<FirestoreRoute[]> {
    try {
      this.ensureAuthenticated();

      console.log('[FirestoreService] Getting routes with constraints');
      const q = query(collection(db, 'routes'), ...constraints);
      const querySnapshot = await getDocs(q);
      
      const routes: FirestoreRoute[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        routes.push({
          id: doc.id,
          ...data,
          departureTime: data.departureTime.toDate(),
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate(),
        } as FirestoreRoute);
      });
      
      console.log('[FirestoreService] Found', routes.length, 'routes');
      return routes;
    } catch (error) {
      console.error('[FirestoreService] Error getting routes:', error);
      throw error;
    }
  }

  subscribeToRoutes(
    callback: (routes: FirestoreRoute[]) => void,
    constraints: QueryConstraint[] = []
  ): Unsubscribe {
    try {
      this.ensureAuthenticated();

      console.log('[FirestoreService] Subscribing to routes');
      const q = query(collection(db, 'routes'), ...constraints);
      
      return onSnapshot(
        q,
        (querySnapshot) => {
          const routes: FirestoreRoute[] = [];
          querySnapshot.forEach((doc) => {
            const data = doc.data();
            routes.push({
              id: doc.id,
              ...data,
              departureTime: data.departureTime.toDate(),
              createdAt: data.createdAt.toDate(),
              updatedAt: data.updatedAt.toDate(),
            } as FirestoreRoute);
          });
          console.log('[FirestoreService] Routes updated:', routes.length);
          callback(routes);
        },
        (error) => {
          console.error('[FirestoreService] Error in routes subscription:', error);
        }
      );
    } catch (error) {
      console.error('[FirestoreService] Error subscribing to routes:', error);
      throw error;
    }
  }

  async createTrip(trip: Omit<FirestoreTrip, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const userId = this.ensureAuthenticated();
      
      if (trip.passengerId !== userId) {
        throw new Error('Cannot create trip for another user');
      }

      const tripData = {
        ...trip,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      console.log('[FirestoreService] Creating trip:', tripData);
      const docRef = await addDoc(collection(db, 'trips'), tripData);
      console.log('[FirestoreService] Trip created with ID:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('[FirestoreService] Error creating trip:', error);
      throw error;
    }
  }

  async updateTrip(tripId: string, updates: Partial<FirestoreTrip>): Promise<void> {
    try {
      this.ensureAuthenticated();

      const updateData = {
        ...updates,
        updatedAt: Timestamp.now(),
      };

      console.log('[FirestoreService] Updating trip:', tripId);
      await updateDoc(doc(db, 'trips', tripId), updateData);
      console.log('[FirestoreService] Trip updated successfully');
    } catch (error) {
      console.error('[FirestoreService] Error updating trip:', error);
      throw error;
    }
  }

  async deleteTrip(tripId: string): Promise<void> {
    try {
      this.ensureAuthenticated();

      console.log('[FirestoreService] Deleting trip:', tripId);
      await deleteDoc(doc(db, 'trips', tripId));
      console.log('[FirestoreService] Trip deleted successfully');
    } catch (error) {
      console.error('[FirestoreService] Error deleting trip:', error);
      throw error;
    }
  }

  async getTrip(tripId: string): Promise<FirestoreTrip | null> {
    try {
      this.ensureAuthenticated();

      console.log('[FirestoreService] Getting trip:', tripId);
      const docSnap = await getDoc(doc(db, 'trips', tripId));
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          ...data,
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate(),
        } as FirestoreTrip;
      }
      
      return null;
    } catch (error) {
      console.error('[FirestoreService] Error getting trip:', error);
      throw error;
    }
  }

  async getTrips(constraints: QueryConstraint[] = []): Promise<FirestoreTrip[]> {
    try {
      this.ensureAuthenticated();

      console.log('[FirestoreService] Getting trips with constraints');
      const q = query(collection(db, 'trips'), ...constraints);
      const querySnapshot = await getDocs(q);
      
      const trips: FirestoreTrip[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        trips.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate(),
        } as FirestoreTrip);
      });
      
      console.log('[FirestoreService] Found', trips.length, 'trips');
      return trips;
    } catch (error) {
      console.error('[FirestoreService] Error getting trips:', error);
      throw error;
    }
  }

  subscribeToTrips(
    callback: (trips: FirestoreTrip[]) => void,
    constraints: QueryConstraint[] = []
  ): Unsubscribe {
    try {
      this.ensureAuthenticated();

      console.log('[FirestoreService] Subscribing to trips');
      const q = query(collection(db, 'trips'), ...constraints);
      
      return onSnapshot(
        q,
        (querySnapshot) => {
          const trips: FirestoreTrip[] = [];
          querySnapshot.forEach((doc) => {
            const data = doc.data();
            trips.push({
              id: doc.id,
              ...data,
              createdAt: data.createdAt.toDate(),
              updatedAt: data.updatedAt.toDate(),
            } as FirestoreTrip);
          });
          console.log('[FirestoreService] Trips updated:', trips.length);
          callback(trips);
        },
        (error) => {
          console.error('[FirestoreService] Error in trips subscription:', error);
        }
      );
    } catch (error) {
      console.error('[FirestoreService] Error subscribing to trips:', error);
      throw error;
    }
  }

  async getUserTrips(userId: string): Promise<FirestoreTrip[]> {
    try {
      this.ensureAuthenticated();

      return await this.getTrips([
        where('passengerId', '==', userId),
      ]);
    } catch (error) {
      console.error('[FirestoreService] Error getting user trips:', error);
      throw error;
    }
  }

  async getDriverTrips(driverId: string): Promise<FirestoreTrip[]> {
    try {
      this.ensureAuthenticated();

      return await this.getTrips([
        where('driverId', '==', driverId),
      ]);
    } catch (error) {
      console.error('[FirestoreService] Error getting driver trips:', error);
      throw error;
    }
  }
}

export const firestoreService = new FirestoreService();
