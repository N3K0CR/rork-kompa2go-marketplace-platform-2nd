import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  onSnapshot,
  serverTimestamp,
  Unsubscribe,
  deleteDoc,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface TripLocation {
  tripId: string;
  kommuterId: string;
  location: {
    latitude: number;
    longitude: number;
    accuracy?: number;
    heading?: number;
    speed?: number;
  };
  timestamp: Date;
  status: 'active' | 'inactive';
}

const TRIP_LOCATIONS_COLLECTION = 'trip_locations';

export class TripLocationService {
  async updateLocation(
    tripId: string,
    kommuterId: string,
    location: TripLocation['location']
  ): Promise<void> {
    try {
      const docRef = doc(db, TRIP_LOCATIONS_COLLECTION, tripId);
      await setDoc(
        docRef,
        {
          tripId,
          kommuterId,
          location,
          timestamp: serverTimestamp(),
          status: 'active',
        },
        { merge: true }
      );
      console.log('[TripLocationService] Location updated for trip:', tripId);
    } catch (error) {
      console.error('[TripLocationService] Error updating location:', error);
      throw error;
    }
  }

  async getLocation(tripId: string): Promise<TripLocation | null> {
    try {
      const docRef = doc(db, TRIP_LOCATIONS_COLLECTION, tripId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return null;
      }

      const data = docSnap.data();
      return {
        ...data,
        timestamp: data.timestamp?.toDate() || new Date(),
      } as TripLocation;
    } catch (error) {
      console.error('[TripLocationService] Error getting location:', error);
      throw error;
    }
  }

  subscribeToLocation(
    tripId: string,
    callback: (location: TripLocation | null) => void
  ): Unsubscribe {
    const docRef = doc(db, TRIP_LOCATIONS_COLLECTION, tripId);

    return onSnapshot(
      docRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          callback({
            ...data,
            timestamp: data.timestamp?.toDate() || new Date(),
          } as TripLocation);
        } else {
          callback(null);
        }
      },
      (error) => {
        console.error('[TripLocationService] Error in location subscription:', error);
        callback(null);
      }
    );
  }

  async deactivateLocation(tripId: string): Promise<void> {
    try {
      const docRef = doc(db, TRIP_LOCATIONS_COLLECTION, tripId);
      await setDoc(
        docRef,
        {
          status: 'inactive',
          timestamp: serverTimestamp(),
        },
        { merge: true }
      );
      console.log('[TripLocationService] Location deactivated for trip:', tripId);
    } catch (error) {
      console.error('[TripLocationService] Error deactivating location:', error);
      throw error;
    }
  }

  async deleteLocation(tripId: string): Promise<void> {
    try {
      const docRef = doc(db, TRIP_LOCATIONS_COLLECTION, tripId);
      await deleteDoc(docRef);
      console.log('[TripLocationService] Location deleted for trip:', tripId);
    } catch (error) {
      console.error('[TripLocationService] Error deleting location:', error);
      throw error;
    }
  }

  async getActiveLocations(kommuterId: string): Promise<TripLocation[]> {
    try {
      const q = query(
        collection(db, TRIP_LOCATIONS_COLLECTION),
        where('kommuterId', '==', kommuterId),
        where('status', '==', 'active')
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          ...data,
          timestamp: data.timestamp?.toDate() || new Date(),
        } as TripLocation;
      });
    } catch (error) {
      console.error('[TripLocationService] Error getting active locations:', error);
      throw error;
    }
  }
}

export const tripLocationService = new TripLocationService();
