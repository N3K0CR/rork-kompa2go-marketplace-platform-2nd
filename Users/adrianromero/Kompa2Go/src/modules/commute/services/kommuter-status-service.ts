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
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface KommuterStatus {
  kommuterId: string;
  status: 'available' | 'busy' | 'offline';
  currentLocation?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  currentTripId?: string;
  vehicleInfo?: {
    type: 'car' | 'motorcycle' | 'bicycle';
    model?: string;
    color?: string;
    licensePlate?: string;
  };
  availableSeats?: number;
  lastUpdated: Date;
  metadata?: {
    acceptingTrips: boolean;
    preferredZones?: string[];
    maxDistance?: number;
  };
}

const KOMMUTER_STATUS_COLLECTION = 'kommuter_status';

export class KommuterStatusService {
  async updateStatus(
    kommuterId: string,
    status: KommuterStatus['status'],
    additionalData?: Partial<Omit<KommuterStatus, 'kommuterId' | 'status' | 'lastUpdated'>>
  ): Promise<void> {
    try {
      const docRef = doc(db, KOMMUTER_STATUS_COLLECTION, kommuterId);
      await setDoc(
        docRef,
        {
          kommuterId,
          status,
          ...additionalData,
          lastUpdated: serverTimestamp(),
        },
        { merge: true }
      );
      console.log('[KommuterStatusService] Status updated for kommuter:', kommuterId);
    } catch (error) {
      console.error('[KommuterStatusService] Error updating status:', error);
      throw error;
    }
  }

  async setAvailable(
    kommuterId: string,
    location: KommuterStatus['currentLocation'],
    vehicleInfo?: KommuterStatus['vehicleInfo'],
    availableSeats?: number
  ): Promise<void> {
    return this.updateStatus(kommuterId, 'available', {
      currentLocation: location,
      vehicleInfo,
      availableSeats,
      metadata: {
        acceptingTrips: true,
      },
    });
  }

  async setBusy(kommuterId: string, tripId: string): Promise<void> {
    return this.updateStatus(kommuterId, 'busy', {
      currentTripId: tripId,
      metadata: {
        acceptingTrips: false,
      },
    });
  }

  async setOffline(kommuterId: string): Promise<void> {
    return this.updateStatus(kommuterId, 'offline', {
      currentTripId: undefined,
      metadata: {
        acceptingTrips: false,
      },
    });
  }

  async getStatus(kommuterId: string): Promise<KommuterStatus | null> {
    try {
      const docRef = doc(db, KOMMUTER_STATUS_COLLECTION, kommuterId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return null;
      }

      const data = docSnap.data();
      return {
        ...data,
        lastUpdated: data.lastUpdated?.toDate() || new Date(),
      } as KommuterStatus;
    } catch (error) {
      console.error('[KommuterStatusService] Error getting status:', error);
      throw error;
    }
  }

  subscribeToStatus(
    kommuterId: string,
    callback: (status: KommuterStatus | null) => void
  ): Unsubscribe {
    const docRef = doc(db, KOMMUTER_STATUS_COLLECTION, kommuterId);

    return onSnapshot(
      docRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          callback({
            ...data,
            lastUpdated: data.lastUpdated?.toDate() || new Date(),
          } as KommuterStatus);
        } else {
          callback(null);
        }
      },
      (error) => {
        console.error('[KommuterStatusService] Error in status subscription:', error);
        callback(null);
      }
    );
  }

  async getAvailableKommuters(
    nearLocation?: { latitude: number; longitude: number },
    maxDistance?: number
  ): Promise<KommuterStatus[]> {
    try {
      const q = query(
        collection(db, KOMMUTER_STATUS_COLLECTION),
        where('status', '==', 'available'),
        where('metadata.acceptingTrips', '==', true)
      );

      const querySnapshot = await getDocs(q);
      let kommuters = querySnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          ...data,
          lastUpdated: data.lastUpdated?.toDate() || new Date(),
        } as KommuterStatus;
      });

      if (nearLocation && maxDistance) {
        kommuters = kommuters.filter((k) => {
          if (!k.currentLocation) return false;
          const distance = this.calculateDistance(
            nearLocation.latitude,
            nearLocation.longitude,
            k.currentLocation.latitude,
            k.currentLocation.longitude
          );
          return distance <= maxDistance;
        });
      }

      return kommuters;
    } catch (error) {
      console.error('[KommuterStatusService] Error getting available kommuters:', error);
      throw error;
    }
  }

  subscribeToAvailableKommuters(
    callback: (kommuters: KommuterStatus[]) => void
  ): Unsubscribe {
    const q = query(
      collection(db, KOMMUTER_STATUS_COLLECTION),
      where('status', '==', 'available'),
      where('metadata.acceptingTrips', '==', true)
    );

    return onSnapshot(
      q,
      (snapshot) => {
        const kommuters = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            ...data,
            lastUpdated: data.lastUpdated?.toDate() || new Date(),
          } as KommuterStatus;
        });
        callback(kommuters);
      },
      (error) => {
        console.error('[KommuterStatusService] Error in available kommuters subscription:', error);
        callback([]);
      }
    );
  }

  async updateLocation(
    kommuterId: string,
    location: KommuterStatus['currentLocation']
  ): Promise<void> {
    try {
      const docRef = doc(db, KOMMUTER_STATUS_COLLECTION, kommuterId);
      await setDoc(
        docRef,
        {
          currentLocation: location,
          lastUpdated: serverTimestamp(),
        },
        { merge: true }
      );
    } catch (error) {
      console.error('[KommuterStatusService] Error updating location:', error);
      throw error;
    }
  }

  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371;
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) *
        Math.cos(this.deg2rad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }
}

export const kommuterStatusService = new KommuterStatusService();
