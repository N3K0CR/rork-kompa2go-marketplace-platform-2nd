import { db } from '@/lib/firebase';
import { 
  doc, 
  setDoc, 
  updateDoc, 
  getDoc,
  onSnapshot,
  Timestamp,
  Unsubscribe 
} from 'firebase/firestore';
import type { 
  DriverLocation, 
  DriverTrackingSession,
  Alert911Call 
} from '@/src/shared/types/alert-types';

export class AlertTrackingService {
  async startTracking(alertId: string, driverId: string): Promise<string> {
    try {
      console.log('[AlertTracking] Starting tracking for alert:', alertId);
      console.log('[AlertTracking] Driver ID:', driverId);
      console.log('[AlertTracking] Firebase initialized:', !!db);
      
      const sessionId = `${alertId}_${Date.now()}`;
      const trackingRef = doc(db, 'driver_tracking_sessions', sessionId);
      
      const session: Omit<DriverTrackingSession, 'id'> = {
        driverId,
        alertId,
        startedAt: new Date(),
        locations: [],
        isActive: true
      };
      
      console.log('[AlertTracking] Creating tracking session document...');
      await setDoc(trackingRef, {
        ...session,
        startedAt: Timestamp.now()
      });
      console.log('[AlertTracking] ✅ Tracking session created');
      
      console.log('[AlertTracking] Creating alert document if not exists...');
      const alertRef = doc(db, 'driver_alerts', alertId);
      
      try {
        await setDoc(alertRef, {
          id: alertId,
          driverId,
          status: 'active',
          tracking: {
            enabled: true,
            sessionId: sessionId,
            startedAt: Timestamp.now()
          },
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now()
        }, { merge: true });
        console.log('[AlertTracking] ✅ Alert document updated');
      } catch (alertError) {
        console.warn('[AlertTracking] ⚠️ Could not update alert document:', alertError);
      }
      
      console.log('[AlertTracking] ✅ Tracking started successfully:', sessionId);
      return sessionId;
    } catch (error: any) {
      console.error('[AlertTracking] ❌ Error starting tracking:', error);
      console.error('[AlertTracking] Error code:', error?.code);
      console.error('[AlertTracking] Error message:', error?.message);
      console.error('[AlertTracking] Error details:', JSON.stringify(error, null, 2));
      throw new Error(`Failed to start tracking: ${error?.message || 'Unknown error'}`);
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
      console.log('[AlertTracking] Driver ID:', driverId);
      console.log('[AlertTracking] Called by:', calledBy);
      
      const alertRef = doc(db, 'driver_alerts', alertId);
      let alertData: any = null;
      let location: any = null;
      
      try {
        const alertDoc = await getDoc(alertRef);
        if (alertDoc.exists()) {
          alertData = alertDoc.data();
          location = alertData.tracking?.currentLocation || alertData.location;
          console.log('[AlertTracking] Alert found with location:', !!location);
        } else {
          console.warn('[AlertTracking] ⚠️ Alert document not found, using default location');
        }
      } catch (alertError) {
        console.warn('[AlertTracking] ⚠️ Could not fetch alert document:', alertError);
      }
      
      if (!location) {
        console.warn('[AlertTracking] ⚠️ No location in alert, using default coordinates');
        location = { lat: 9.9281, lng: -84.0907 };
      }
      
      const call911Id = `911_${alertId}_${Date.now()}`;
      const call911Ref = doc(db, 'alert_911_calls', call911Id);
      
      const call911Data: Omit<Alert911Call, 'id'> = {
        alertId,
        driverId,
        calledAt: new Date(),
        calledBy,
        location: {
          lat: location.latitude || location.lat || 9.9281,
          lng: location.longitude || location.lng || -84.0907
        },
        driverInfo,
        status: 'pending'
      };
      
      console.log('[AlertTracking] Creating 911 call document...');
      await setDoc(call911Ref, {
        ...call911Data,
        calledAt: Timestamp.now()
      });
      console.log('[AlertTracking] ✅ 911 call document created');
      
      try {
        await setDoc(alertRef, {
          id: alertId,
          driverId,
          status: 'investigating',
          resolution: {
            action911Called: true,
            call911Id: call911Id,
            call911At: Timestamp.now()
          },
          updatedAt: Timestamp.now()
        }, { merge: true });
        console.log('[AlertTracking] ✅ Alert document updated with 911 call info');
      } catch (updateError) {
        console.warn('[AlertTracking] ⚠️ Could not update alert document:', updateError);
      }
      
      console.log('[AlertTracking] ✅ 911 call initiated successfully:', call911Id);
      return call911Id;
    } catch (error: any) {
      console.error('[AlertTracking] ❌ Error calling 911:', error);
      console.error('[AlertTracking] Error code:', error?.code);
      console.error('[AlertTracking] Error message:', error?.message);
      throw new Error(`Failed to call 911: ${error?.message || 'Unknown error'}`);
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
