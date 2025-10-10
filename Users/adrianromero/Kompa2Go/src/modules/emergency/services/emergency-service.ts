import { db } from '@/lib/firebase';
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,

  Timestamp,
  runTransaction,
} from 'firebase/firestore';
import { EmergencyAlert, EmergencyContact, EmergencyEvent, SafetySettings } from '@/src/shared/types';

const EMERGENCY_ALERTS_COLLECTION = 'emergencyAlerts';
const EMERGENCY_CONTACTS_COLLECTION = 'emergencyContacts';
const SAFETY_SETTINGS_COLLECTION = 'safetySettings';

export class EmergencyService {
  async createEmergencyAlert(
    alertData: Omit<EmergencyAlert, 'id' | 'createdAt' | 'updatedAt' | 'timeline'>
  ): Promise<string> {
    try {
      const now = Timestamp.now();
      const initialEvent: EmergencyEvent = {
        id: `evt_${Date.now()}`,
        alertId: '',
        type: 'created',
        description: 'Emergency alert created',
        createdBy: alertData.userId,
        createdAt: new Date(),
      };

      const docRef = await addDoc(collection(db, EMERGENCY_ALERTS_COLLECTION), {
        ...alertData,
        timeline: [{ ...initialEvent, createdAt: now }],
        createdAt: now,
        updatedAt: now,
      });

      await updateDoc(docRef, {
        'timeline.0.alertId': docRef.id,
      });

      await this.notifyEmergencyContacts(alertData.userId, docRef.id, alertData.location);

      return docRef.id;
    } catch (error) {
      console.error('Error creating emergency alert:', error);
      throw error;
    }
  }

  async getEmergencyAlert(alertId: string): Promise<EmergencyAlert | null> {
    try {
      const docRef = doc(db, EMERGENCY_ALERTS_COLLECTION, alertId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return null;
      }

      return {
        id: docSnap.id,
        ...docSnap.data(),
        createdAt: docSnap.data().createdAt?.toDate(),
        updatedAt: docSnap.data().updatedAt?.toDate(),
        resolvedAt: docSnap.data().resolvedAt?.toDate(),
        timeline: docSnap.data().timeline?.map((evt: any) => ({
          ...evt,
          createdAt: evt.createdAt?.toDate(),
        })),
        resolution: docSnap.data().resolution
          ? {
              ...docSnap.data().resolution,
              resolvedAt: docSnap.data().resolution.resolvedAt?.toDate(),
            }
          : undefined,
      } as EmergencyAlert;
    } catch (error) {
      console.error('Error getting emergency alert:', error);
      throw error;
    }
  }

  async getUserActiveAlerts(userId: string): Promise<EmergencyAlert[]> {
    try {
      const q = query(
        collection(db, EMERGENCY_ALERTS_COLLECTION),
        where('userId', '==', userId),
        where('status', 'in', ['active', 'responding']),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
        resolvedAt: doc.data().resolvedAt?.toDate(),
        timeline: doc.data().timeline?.map((evt: any) => ({
          ...evt,
          createdAt: evt.createdAt?.toDate(),
        })),
        resolution: doc.data().resolution
          ? {
              ...doc.data().resolution,
              resolvedAt: doc.data().resolution.resolvedAt?.toDate(),
            }
          : undefined,
      })) as EmergencyAlert[];
    } catch (error) {
      console.error('Error getting user active alerts:', error);
      throw error;
    }
  }

  async updateAlertLocation(
    alertId: string,
    location: EmergencyAlert['location']
  ): Promise<void> {
    try {
      const docRef = doc(db, EMERGENCY_ALERTS_COLLECTION, alertId);
      await runTransaction(db, async (transaction) => {
        const alertDoc = await transaction.get(docRef);
        if (!alertDoc.exists()) {
          throw new Error('Alert not found');
        }

        const timeline = alertDoc.data().timeline || [];
        const newEvent: EmergencyEvent = {
          id: `evt_${Date.now()}`,
          alertId,
          type: 'location-update',
          description: 'Location updated',
          data: location,
          createdBy: alertDoc.data().userId,
          createdAt: new Date(),
        };

        transaction.update(docRef, {
          location,
          timeline: [...timeline, { ...newEvent, createdAt: Timestamp.now() }],
          updatedAt: Timestamp.now(),
        });
      });
    } catch (error) {
      console.error('Error updating alert location:', error);
      throw error;
    }
  }

  async updateAlertStatus(
    alertId: string,
    status: EmergencyAlert['status'],
    resolution?: EmergencyAlert['resolution']
  ): Promise<void> {
    try {
      const docRef = doc(db, EMERGENCY_ALERTS_COLLECTION, alertId);
      await runTransaction(db, async (transaction) => {
        const alertDoc = await transaction.get(docRef);
        if (!alertDoc.exists()) {
          throw new Error('Alert not found');
        }

        const timeline = alertDoc.data().timeline || [];
        const newEvent: EmergencyEvent = {
          id: `evt_${Date.now()}`,
          alertId,
          type: 'status-change',
          description: `Status changed to ${status}`,
          data: { status },
          createdBy: alertDoc.data().userId,
          createdAt: new Date(),
        };

        const updateData: any = {
          status,
          timeline: [...timeline, { ...newEvent, createdAt: Timestamp.now() }],
          updatedAt: Timestamp.now(),
        };

        if (status === 'resolved' && resolution) {
          updateData.resolution = {
            ...resolution,
            resolvedAt: Timestamp.now(),
          };
          updateData.resolvedAt = Timestamp.now();
        }

        transaction.update(docRef, updateData);
      });
    } catch (error) {
      console.error('Error updating alert status:', error);
      throw error;
    }
  }

  async addEmergencyContact(
    contactData: Omit<EmergencyContact, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<string> {
    try {
      const now = Timestamp.now();
      const docRef = await addDoc(collection(db, EMERGENCY_CONTACTS_COLLECTION), {
        ...contactData,
        createdAt: now,
        updatedAt: now,
      });

      return docRef.id;
    } catch (error) {
      console.error('Error adding emergency contact:', error);
      throw error;
    }
  }

  async getUserEmergencyContacts(userId: string): Promise<EmergencyContact[]> {
    try {
      const q = query(
        collection(db, EMERGENCY_CONTACTS_COLLECTION),
        where('userId', '==', userId),
        orderBy('priority', 'asc')
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
      })) as EmergencyContact[];
    } catch (error) {
      console.error('Error getting user emergency contacts:', error);
      throw error;
    }
  }

  async updateEmergencyContact(
    contactId: string,
    updates: Partial<Omit<EmergencyContact, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>
  ): Promise<void> {
    try {
      const docRef = doc(db, EMERGENCY_CONTACTS_COLLECTION, contactId);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error('Error updating emergency contact:', error);
      throw error;
    }
  }

  async deleteEmergencyContact(contactId: string): Promise<void> {
    try {
      const docRef = doc(db, EMERGENCY_CONTACTS_COLLECTION, contactId);
      await updateDoc(docRef, {
        notifyOnEmergency: false,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error('Error deleting emergency contact:', error);
      throw error;
    }
  }

  async getSafetySettings(userId: string): Promise<SafetySettings | null> {
    try {
      const docRef = doc(db, SAFETY_SETTINGS_COLLECTION, userId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return null;
      }

      return {
        ...docSnap.data(),
        updatedAt: docSnap.data().updatedAt?.toDate(),
      } as SafetySettings;
    } catch (error) {
      console.error('Error getting safety settings:', error);
      throw error;
    }
  }

  async updateSafetySettings(
    userId: string,
    settings: Partial<Omit<SafetySettings, 'userId' | 'updatedAt'>>
  ): Promise<void> {
    try {
      const docRef = doc(db, SAFETY_SETTINGS_COLLECTION, userId);
      await updateDoc(docRef, {
        ...settings,
        updatedAt: Timestamp.now(),
      }).catch(async () => {
        await addDoc(collection(db, SAFETY_SETTINGS_COLLECTION), {
          userId,
          panicButtonEnabled: true,
          autoShareLocation: true,
          emergencyContacts: [],
          shareTripsWithContacts: false,
          requireCheckIn: false,
          trustedContacts: [],
          ...settings,
          updatedAt: Timestamp.now(),
        });
      });
    } catch (error) {
      console.error('Error updating safety settings:', error);
      throw error;
    }
  }

  private async notifyEmergencyContacts(
    userId: string,
    alertId: string,
    location: EmergencyAlert['location']
  ): Promise<void> {
    try {
      const contacts = await this.getUserEmergencyContacts(userId);
      const activeContacts = contacts.filter((c) => c.notifyOnEmergency);

      console.log(`Notifying ${activeContacts.length} emergency contacts for alert ${alertId}`);
      console.log('Location:', location);
    } catch (error) {
      console.error('Error notifying emergency contacts:', error);
    }
  }
}

export const emergencyService = new EmergencyService();
