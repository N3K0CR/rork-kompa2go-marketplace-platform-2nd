import { db } from '@/lib/firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  updateDoc, 
  getDoc,
  onSnapshot,
  Timestamp,
  Unsubscribe 
} from 'firebase/firestore';
import type { 
  DriverAlert, 
  DriverLocation, 
  DriverTrackingSession,
  Alert911Call 
} from '@/src/shared/types/alert-types';

export class AlertTrackingService {
  async startTracking(alertId: string, driverId: string): Promise<string> {
    try {
      console.log('[AlertTracking] Starting tracking for alert:', alertId);
      
      const sessionId = `${alertId}_${Date.now()}`;
      const trackingRef = doc(db, 'driver_tracking_sessions', sessionId);
      
      const session: Omit<DriverTrackingSession, 'id'> = {
        driverId,
        alertId,
        startedAt: new Date(),
        locations: [],
        isActive: true
      };
      
      await setDoc(trackingRef, {
        ...session,
        startedAt: Timestamp.now()
      });
      
      const alertRef = doc(db, 'driver_alerts', alertId);
      await updateDoc(alertRef, {
        'tracking.enabled': true,
        'tracking.sessionId': sessionId,
        'tracking.startedAt': Timestamp.now(),
        updatedAt: Timestamp.now()
      });
      
      console.log('[AlertTracking] Tracking started successfully:', sessionId);
      return sessionId;
    } catch (error) {
      console.error('[AlertTracking] Error starting tracking:', error);
      throw error;
    }
  }

  async updateDriverLocation(
    sessionId: string, 
    location: DriverLocation
  ): Promise<void> {
    try {
      const trackingRef = doc(db, 'driver_tracking_sessions', sessionId);
      const trackingDoc = await getDoc(trackingRef);
      
      if (!trackingDoc.exists()) {
        throw new Error('Tracking session not found');
      }
      
      const currentLocations = trackingDoc.data().locations || [];
      
      await updateDoc(trackingRef, {
        locations: [
          ...currentLocations,
          {
            ...location,
            timestamp: Timestamp.fromDate(location.timestamp)
          }
        ],
        lastUpdate: Timestamp.now()
      });
      
      const alertId = trackingDoc.data().alertId;
      const alertRef = doc(db, 'driver_alerts', alertId);
      await updateDoc(alertRef, {
        'tracking.lastUpdate': Timestamp.now(),
        'tracking.currentLocation': {
          ...location,
          timestamp: Timestamp.fromDate(location.timestamp)
        }
      });
      
      console.log('[AlertTracking] Location updated for session:', sessionId);
    } catch (error) {
      console.error('[AlertTracking] Error updating location:', error);
      throw error;
    }
  }

  async stopTracking(sessionId: string): Promise<void> {
    try {
      console.log('[AlertTracking] Stopping tracking for session:', sessionId);
      
      const trackingRef = doc(db, 'driver_tracking_sessions', sessionId);
      const trackingDoc = await getDoc(trackingRef);
      
      if (!trackingDoc.exists()) {
        throw new Error('Tracking session not found');
      }
      
      await updateDoc(trackingRef, {
        endedAt: Timestamp.now(),
        isActive: false
      });
      
      const alertId = trackingDoc.data().alertId;
      const alertRef = doc(db, 'driver_alerts', alertId);
      await updateDoc(alertRef, {
        'tracking.enabled': false,
        'tracking.endedAt': Timestamp.now(),
        updatedAt: Timestamp.now()
      });
      
      console.log('[AlertTracking] Tracking stopped successfully');
    } catch (error) {
      console.error('[AlertTracking] Error stopping tracking:', error);
      throw error;
    }
  }

  subscribeToTracking(
    sessionId: string,
    callback: (session: DriverTrackingSession) => void
  ): Unsubscribe {
    console.log('[AlertTracking] Subscribing to tracking session:', sessionId);
    
    const trackingRef = doc(db, 'driver_tracking_sessions', sessionId);
    
    return onSnapshot(
      trackingRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          const session: DriverTrackingSession = {
            id: snapshot.id,
            driverId: data.driverId,
            alertId: data.alertId,
            startedAt: data.startedAt.toDate(),
            endedAt: data.endedAt?.toDate(),
            locations: data.locations.map((loc: any) => ({
              ...loc,
              timestamp: loc.timestamp.toDate()
            })),
            isActive: data.isActive
          };
          callback(session);
        }
      },
      (error) => {
        console.error('[AlertTracking] Error in tracking subscription:', error);
      }
    );
  }

  async call911(
    alertId: string,
    driverId: string,
    calledBy: string,
    driverInfo: Alert911Call['driverInfo']
  ): Promise<string> {
    try {
      console.log('[AlertTracking] Initiating 911 call for alert:', alertId);
      
      const alertRef = doc(db, 'driver_alerts', alertId);
      const alertDoc = await getDoc(alertRef);
      
      if (!alertDoc.exists()) {
        throw new Error('Alert not found');
      }
      
      const alertData = alertDoc.data();
      const location = alertData.tracking?.currentLocation || alertData.location;
      
      if (!location) {
        throw new Error('No location available for 911 call');
      }
      
      const call911Id = `911_${alertId}_${Date.now()}`;
      const call911Ref = doc(db, 'alert_911_calls', call911Id);
      
      const call911Data: Omit<Alert911Call, 'id'> = {
        alertId,
        driverId,
        calledAt: new Date(),
        calledBy,
        location: {
          lat: location.latitude || location.lat,
          lng: location.longitude || location.lng
        },
        driverInfo,
        status: 'pending'
      };
      
      await setDoc(call911Ref, {
        ...call911Data,
        calledAt: Timestamp.now()
      });
      
      await updateDoc(alertRef, {
        'resolution.action911Called': true,
        'resolution.call911Id': call911Id,
        'resolution.call911At': Timestamp.now(),
        status: 'investigating',
        updatedAt: Timestamp.now()
      });
      
      console.log('[AlertTracking] 911 call initiated successfully:', call911Id);
      return call911Id;
    } catch (error) {
      console.error('[AlertTracking] Error calling 911:', error);
      throw error;
    }
  }

  async update911CallStatus(
    call911Id: string,
    status: Alert911Call['status'],
    dispatchNumber?: string,
    notes?: string
  ): Promise<void> {
    try {
      const call911Ref = doc(db, 'alert_911_calls', call911Id);
      
      await updateDoc(call911Ref, {
        status,
        ...(dispatchNumber && { dispatchNumber }),
        ...(notes && { notes }),
        updatedAt: Timestamp.now()
      });
      
      console.log('[AlertTracking] 911 call status updated:', call911Id, status);
    } catch (error) {
      console.error('[AlertTracking] Error updating 911 call status:', error);
      throw error;
    }
  }
}

export const alertTrackingService = new AlertTrackingService();
