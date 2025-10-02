import { collection, doc, setDoc, getDoc, updateDoc, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface KommuterStatus {
  kommuterId: string;
  tripsCompleted: number;
  backgroundCheckRequired: boolean;
  backgroundCheckStatus: 'not_required' | 'pending' | 'in_progress' | 'approved' | 'rejected';
  canAcceptTrips: boolean;
}

export interface BackgroundCheckData {
  id: string;
  kommuterId: string;
  status: 'pending' | 'in_progress' | 'approved' | 'rejected';
  requestedAt: Date;
  completedAt?: Date;
  tripsCompletedAtRequest: number;
  documents: {
    criminalRecordUrl?: string;
    identityVerificationUrl?: string;
  };
  results?: {
    approved: boolean;
    notes?: string;
    reviewedBy?: string;
    reviewedAt?: Date;
  };
}

const BACKGROUND_CHECK_COLLECTION = 'backgroundChecks';
const USERS_COLLECTION = 'users';
const TRIPS_REQUIRED = 20;

export class BackgroundCheckService {
  static async checkKommuterStatus(kommuterId: string): Promise<KommuterStatus> {
    try {
      const userDoc = await getDoc(doc(db, USERS_COLLECTION, kommuterId));
      
      if (!userDoc.exists()) {
        throw new Error('Kommuter not found');
      }

      const userData = userDoc.data();
      const tripsCompleted = userData.tripsCompleted || 0;
      const backgroundCheckRequired = tripsCompleted >= TRIPS_REQUIRED;

      let backgroundCheckStatus: KommuterStatus['backgroundCheckStatus'] = 'not_required';
      let canAcceptTrips = true;

      if (backgroundCheckRequired) {
        const checkDoc = await this.getBackgroundCheck(kommuterId);
        
        if (!checkDoc) {
          backgroundCheckStatus = 'pending';
          canAcceptTrips = false;
        } else {
          backgroundCheckStatus = checkDoc.status as KommuterStatus['backgroundCheckStatus'];
          canAcceptTrips = checkDoc.status === 'approved';
        }
      }

      return {
        kommuterId,
        tripsCompleted,
        backgroundCheckRequired,
        backgroundCheckStatus,
        canAcceptTrips,
      };
    } catch (error) {
      console.error('Error checking kommuter status:', error);
      throw error;
    }
  }

  static async getBackgroundCheck(kommuterId: string): Promise<BackgroundCheckData | null> {
    try {
      const q = query(
        collection(db, BACKGROUND_CHECK_COLLECTION),
        where('kommuterId', '==', kommuterId)
      );
      
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        return null;
      }

      const doc = snapshot.docs[0];
      const data = doc.data();
      
      return {
        id: doc.id,
        kommuterId: data.kommuterId,
        status: data.status,
        requestedAt: data.requestedAt?.toDate() || new Date(),
        completedAt: data.completedAt?.toDate(),
        tripsCompletedAtRequest: data.tripsCompletedAtRequest,
        documents: data.documents || {},
        results: data.results,
      };
    } catch (error) {
      console.error('Error getting background check:', error);
      return null;
    }
  }

  static async getBackgroundCheckDetails(kommuterId: string): Promise<BackgroundCheckData | null> {
    return this.getBackgroundCheck(kommuterId);
  }

  static async submitBackgroundCheckDocuments(
    kommuterId: string,
    documents: {
      criminalRecordUrl: string;
      identityVerificationUrl: string;
    }
  ): Promise<void> {
    try {
      const userDoc = await getDoc(doc(db, USERS_COLLECTION, kommuterId));
      
      if (!userDoc.exists()) {
        throw new Error('Kommuter not found');
      }

      const userData = userDoc.data();
      const tripsCompleted = userData.tripsCompleted || 0;

      const existingCheck = await this.getBackgroundCheck(kommuterId);

      if (existingCheck) {
        await updateDoc(doc(db, BACKGROUND_CHECK_COLLECTION, existingCheck.id), {
          status: 'in_progress',
          documents,
          updatedAt: Timestamp.now(),
        });
      } else {
        const checkId = `bgcheck_${kommuterId}_${Date.now()}`;
        const checkData: Partial<BackgroundCheckData> = {
          id: checkId,
          kommuterId,
          status: 'in_progress',
          requestedAt: new Date(),
          tripsCompletedAtRequest: tripsCompleted,
          documents,
        };

        await setDoc(doc(db, BACKGROUND_CHECK_COLLECTION, checkId), {
          ...checkData,
          requestedAt: Timestamp.now(),
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        });
      }

      console.log('Background check documents submitted:', kommuterId);
    } catch (error) {
      console.error('Error submitting background check documents:', error);
      throw error;
    }
  }

  static async approveBackgroundCheck(
    checkId: string,
    reviewedBy: string,
    notes?: string
  ): Promise<void> {
    try {
      await updateDoc(doc(db, BACKGROUND_CHECK_COLLECTION, checkId), {
        status: 'approved',
        completedAt: Timestamp.now(),
        results: {
          approved: true,
          notes,
          reviewedBy,
          reviewedAt: Timestamp.now(),
        },
        updatedAt: Timestamp.now(),
      });

      console.log('Background check approved:', checkId);
    } catch (error) {
      console.error('Error approving background check:', error);
      throw error;
    }
  }

  static async rejectBackgroundCheck(
    checkId: string,
    reviewedBy: string,
    notes: string
  ): Promise<void> {
    try {
      await updateDoc(doc(db, BACKGROUND_CHECK_COLLECTION, checkId), {
        status: 'rejected',
        completedAt: Timestamp.now(),
        results: {
          approved: false,
          notes,
          reviewedBy,
          reviewedAt: Timestamp.now(),
        },
        updatedAt: Timestamp.now(),
      });

      console.log('Background check rejected:', checkId);
    } catch (error) {
      console.error('Error rejecting background check:', error);
      throw error;
    }
  }

  static async getPendingBackgroundChecks(): Promise<BackgroundCheckData[]> {
    try {
      const q = query(
        collection(db, BACKGROUND_CHECK_COLLECTION),
        where('status', 'in', ['pending', 'in_progress'])
      );
      
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          kommuterId: data.kommuterId,
          status: data.status,
          requestedAt: data.requestedAt?.toDate() || new Date(),
          completedAt: data.completedAt?.toDate(),
          tripsCompletedAtRequest: data.tripsCompletedAtRequest,
          documents: data.documents || {},
          results: data.results,
        };
      });
    } catch (error) {
      console.error('Error getting pending background checks:', error);
      return [];
    }
  }
}
