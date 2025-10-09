import React, { createContext, useContext, useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, collection, query, where, getDocs, addDoc, Timestamp } from 'firebase/firestore';

export type KommuterStatus = 'available' | 'busy' | 'offline';
export type TripStatus = 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled';

export interface Trip {
  id: string;
  passengerId: string;
  passengerName: string;
  passengerPhone: string;
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
  distance: number;
  estimatedDuration: number;
  status: TripStatus;
  requestedAt: Date;
  acceptedAt?: Date;
  startedAt?: Date;
  completedAt?: Date;
}

export interface KommuterStats {
  totalTrips: number;
  completedTrips: number;
  totalEarnings: number;
  todayEarnings: number;
  weekEarnings: number;
  monthEarnings: number;
  averageRating: number;
  totalRatings: number;
  acceptanceRate: number;
  cancellationRate: number;
}

export interface WithdrawalRequest {
  id: string;
  kommuterId: string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected' | 'paid';
  requestedAt: Date;
  processedAt?: Date;
  paymentMethod: 'sinpe' | 'bank_transfer';
  accountInfo: string;
}

interface KommuterContextType {
  status: KommuterStatus;
  currentTrip: Trip | null;
  pendingTrips: Trip[];
  stats: KommuterStats;
  withdrawalRequests: WithdrawalRequest[];
  loading: boolean;
  
  setStatus: (status: KommuterStatus) => Promise<void>;
  acceptTrip: (tripId: string) => Promise<void>;
  rejectTrip: (tripId: string) => Promise<void>;
  startTrip: (tripId: string) => Promise<void>;
  completeTrip: (tripId: string) => Promise<void>;
  cancelTrip: (tripId: string, reason: string) => Promise<void>;
  requestWithdrawal: (amount: number, paymentMethod: 'sinpe' | 'bank_transfer', accountInfo: string) => Promise<void>;
  loadPendingTrips: () => Promise<void>;
  loadStats: () => Promise<void>;
  loadWithdrawalRequests: () => Promise<void>;
}

const KommuterContext = createContext<KommuterContextType | undefined>(undefined);

export function KommuterProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatusState] = useState<KommuterStatus>('offline');
  const [currentTrip, setCurrentTrip] = useState<Trip | null>(null);
  const [pendingTrips, setPendingTrips] = useState<Trip[]>([]);
  const [stats, setStats] = useState<KommuterStats>({
    totalTrips: 0,
    completedTrips: 0,
    totalEarnings: 0,
    todayEarnings: 0,
    weekEarnings: 0,
    monthEarnings: 0,
    averageRating: 0,
    totalRatings: 0,
    acceptanceRate: 0,
    cancellationRate: 0,
  });
  const [withdrawalRequests, setWithdrawalRequests] = useState<WithdrawalRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (auth.currentUser) {
      loadKommuterData();
    }
  }, [auth.currentUser]);

  const loadKommuterData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadKommuterStatus(),
        loadCurrentTrip(),
        loadPendingTrips(),
        loadStats(),
        loadWithdrawalRequests(),
      ]);
    } catch (error) {
      console.error('[KommuterContext] Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadKommuterStatus = async () => {
    try {
      if (!auth.currentUser) return;
      
      const kommuterDoc = await getDoc(doc(db, 'kommuters', auth.currentUser.uid));
      if (kommuterDoc.exists()) {
        const data = kommuterDoc.data();
        setStatusState(data.status || 'offline');
      }
    } catch (error) {
      console.error('[KommuterContext] Error loading status:', error);
    }
  };

  const loadCurrentTrip = async () => {
    try {
      if (!auth.currentUser) return;
      
      const tripsQuery = query(
        collection(db, 'trips'),
        where('driverId', '==', auth.currentUser.uid),
        where('status', 'in', ['accepted', 'in_progress'])
      );
      
      const snapshot = await getDocs(tripsQuery);
      if (!snapshot.empty) {
        const tripData = snapshot.docs[0].data();
        setCurrentTrip({
          id: snapshot.docs[0].id,
          ...tripData,
          requestedAt: tripData.requestedAt?.toDate(),
          acceptedAt: tripData.acceptedAt?.toDate(),
          startedAt: tripData.startedAt?.toDate(),
          completedAt: tripData.completedAt?.toDate(),
        } as Trip);
      } else {
        setCurrentTrip(null);
      }
    } catch (error) {
      console.error('[KommuterContext] Error loading current trip:', error);
    }
  };

  const loadPendingTrips = async () => {
    try {
      if (!auth.currentUser) return;
      
      const tripsQuery = query(
        collection(db, 'trips'),
        where('status', '==', 'pending')
      );
      
      const snapshot = await getDocs(tripsQuery);
      const trips = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        requestedAt: doc.data().requestedAt?.toDate(),
      })) as Trip[];
      
      setPendingTrips(trips);
    } catch (error) {
      console.error('[KommuterContext] Error loading pending trips:', error);
    }
  };

  const loadStats = async () => {
    try {
      if (!auth.currentUser) return;
      
      const statsDoc = await getDoc(doc(db, 'kommuterStats', auth.currentUser.uid));
      if (statsDoc.exists()) {
        setStats(statsDoc.data() as KommuterStats);
      }
    } catch (error) {
      console.error('[KommuterContext] Error loading stats:', error);
    }
  };

  const loadWithdrawalRequests = async () => {
    try {
      if (!auth.currentUser) return;
      
      const withdrawalsQuery = query(
        collection(db, 'withdrawalRequests'),
        where('kommuterId', '==', auth.currentUser.uid)
      );
      
      const snapshot = await getDocs(withdrawalsQuery);
      const requests = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        requestedAt: doc.data().requestedAt?.toDate(),
        processedAt: doc.data().processedAt?.toDate(),
      })) as WithdrawalRequest[];
      
      setWithdrawalRequests(requests);
    } catch (error) {
      console.error('[KommuterContext] Error loading withdrawal requests:', error);
    }
  };

  const setStatus = async (newStatus: KommuterStatus) => {
    try {
      if (!auth.currentUser) {
        throw new Error('Usuario no autenticado');
      }
      
      await updateDoc(doc(db, 'kommuters', auth.currentUser.uid), {
        status: newStatus,
        lastStatusUpdate: Timestamp.now(),
      });
      
      setStatusState(newStatus);
      console.log('[KommuterContext] Status updated to:', newStatus);
    } catch (error) {
      console.error('[KommuterContext] Error updating status:', error);
      throw error;
    }
  };

  const acceptTrip = async (tripId: string) => {
    try {
      if (!auth.currentUser) {
        throw new Error('Usuario no autenticado');
      }
      
      await updateDoc(doc(db, 'trips', tripId), {
        status: 'accepted',
        driverId: auth.currentUser.uid,
        acceptedAt: Timestamp.now(),
      });
      
      await loadCurrentTrip();
      await loadPendingTrips();
      
      console.log('[KommuterContext] Trip accepted:', tripId);
    } catch (error) {
      console.error('[KommuterContext] Error accepting trip:', error);
      throw error;
    }
  };

  const rejectTrip = async (tripId: string) => {
    try {
      await updateDoc(doc(db, 'trips', tripId), {
        status: 'cancelled',
        cancelledBy: 'driver',
        cancelledAt: Timestamp.now(),
      });
      
      await loadPendingTrips();
      
      console.log('[KommuterContext] Trip rejected:', tripId);
    } catch (error) {
      console.error('[KommuterContext] Error rejecting trip:', error);
      throw error;
    }
  };

  const startTrip = async (tripId: string) => {
    try {
      await updateDoc(doc(db, 'trips', tripId), {
        status: 'in_progress',
        startedAt: Timestamp.now(),
      });
      
      await loadCurrentTrip();
      
      console.log('[KommuterContext] Trip started:', tripId);
    } catch (error) {
      console.error('[KommuterContext] Error starting trip:', error);
      throw error;
    }
  };

  const completeTrip = async (tripId: string) => {
    try {
      await updateDoc(doc(db, 'trips', tripId), {
        status: 'completed',
        completedAt: Timestamp.now(),
      });
      
      await loadCurrentTrip();
      await loadStats();
      
      console.log('[KommuterContext] Trip completed:', tripId);
    } catch (error) {
      console.error('[KommuterContext] Error completing trip:', error);
      throw error;
    }
  };

  const cancelTrip = async (tripId: string, reason: string) => {
    try {
      await updateDoc(doc(db, 'trips', tripId), {
        status: 'cancelled',
        cancelledBy: 'driver',
        cancelReason: reason,
        cancelledAt: Timestamp.now(),
      });
      
      await loadCurrentTrip();
      
      console.log('[KommuterContext] Trip cancelled:', tripId);
    } catch (error) {
      console.error('[KommuterContext] Error cancelling trip:', error);
      throw error;
    }
  };

  const requestWithdrawal = async (
    amount: number,
    paymentMethod: 'sinpe' | 'bank_transfer',
    accountInfo: string
  ) => {
    try {
      if (!auth.currentUser) {
        throw new Error('Usuario no autenticado');
      }
      
      if (amount > stats.totalEarnings) {
        throw new Error('Monto solicitado excede las ganancias disponibles');
      }
      
      await addDoc(collection(db, 'withdrawalRequests'), {
        kommuterId: auth.currentUser.uid,
        amount,
        paymentMethod,
        accountInfo,
        status: 'pending',
        requestedAt: Timestamp.now(),
      });
      
      await loadWithdrawalRequests();
      
      Alert.alert(
        '✅ Solicitud Enviada',
        'Tu solicitud de retiro ha sido enviada. Se procesará automáticamente a la 1:00 PM.'
      );
      
      console.log('[KommuterContext] Withdrawal requested:', amount);
    } catch (error) {
      console.error('[KommuterContext] Error requesting withdrawal:', error);
      throw error;
    }
  };

  const value: KommuterContextType = {
    status,
    currentTrip,
    pendingTrips,
    stats,
    withdrawalRequests,
    loading,
    setStatus,
    acceptTrip,
    rejectTrip,
    startTrip,
    completeTrip,
    cancelTrip,
    requestWithdrawal,
    loadPendingTrips,
    loadStats,
    loadWithdrawalRequests,
  };

  return (
    <KommuterContext.Provider value={value}>
      {children}
    </KommuterContext.Provider>
  );
}

export function useKommuter(): KommuterContextType {
  const context = useContext(KommuterContext);
  if (context === undefined) {
    throw new Error('useKommuter must be used within a KommuterProvider');
  }
  return context;
}
