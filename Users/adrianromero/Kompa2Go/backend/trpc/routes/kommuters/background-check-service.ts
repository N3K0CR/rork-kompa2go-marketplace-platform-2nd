import { collection, doc, getDoc, setDoc, updateDoc, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface BackgroundCheckData {
  id: string;
  kommuterId: string;
  status: 'pending' | 'in_progress' | 'approved' | 'rejected';
  requestedAt: Date;
  completedAt?: Date;
  documents: {
    criminalRecordUrl?: string;
    identityVerificationUrl?: string;
    additionalDocumentsUrls?: string[];
  };
  results?: {
    hasCriminalRecord: boolean;
    details?: string;
    verifiedBy?: string;
    notes?: string;
  };
  tripsCompletedAtRequest: number;
}

export interface KommuterStatus {
  id: string;
  tripsCompleted: number;
  backgroundCheckRequired: boolean;
  backgroundCheckCompleted: boolean;
  backgroundCheckStatus?: 'pending' | 'in_progress' | 'approved' | 'rejected';
  canAcceptTrips: boolean;
  suspensionReason?: string;
}

const TRIPS_REQUIRED_FOR_BACKGROUND_CHECK = 20;

export class BackgroundCheckService {
  static async checkKommuterStatus(kommuterId: string): Promise<KommuterStatus> {
    const kommuterDoc = await getDoc(doc(db, 'kommuters', kommuterId));

    if (!kommuterDoc.exists()) {
      throw new Error('Kommuter not found');
    }

    const kommuter = kommuterDoc.data();
    const tripsCompleted = kommuter.tripsCompleted || 0;
    const backgroundCheckRequired = tripsCompleted >= TRIPS_REQUIRED_FOR_BACKGROUND_CHECK;
    const backgroundCheckCompleted = kommuter.backgroundCheckCompleted || false;
    const backgroundCheckStatus = kommuter.backgroundCheckStatus;

    const canAcceptTrips = !backgroundCheckRequired || 
      (backgroundCheckRequired && backgroundCheckCompleted && backgroundCheckStatus === 'approved');

    return {
      id: kommuterId,
      tripsCompleted,
      backgroundCheckRequired,
      backgroundCheckCompleted,
      backgroundCheckStatus,
      canAcceptTrips,
      suspensionReason: !canAcceptTrips 
        ? 'Se requiere verificación de antecedentes penales después de 20 viajes'
        : undefined,
    };
  }

  static async updateTripCount(kommuterId: string): Promise<void> {
    const kommuterDoc = await getDoc(doc(db, 'kommuters', kommuterId));

    if (!kommuterDoc.exists()) {
      throw new Error('Kommuter not found');
    }

    const kommuter = kommuterDoc.data();
    const currentTrips = kommuter.tripsCompleted || 0;
    const newTripsCount = currentTrips + 1;

    await updateDoc(doc(db, 'kommuters', kommuterId), {
      tripsCompleted: newTripsCount,
      updatedAt: Timestamp.now(),
    });

    if (newTripsCount === TRIPS_REQUIRED_FOR_BACKGROUND_CHECK) {
      await this.triggerBackgroundCheckRequest(kommuterId, newTripsCount);
    }
  }

  static async triggerBackgroundCheckRequest(
    kommuterId: string,
    tripsCompleted: number
  ): Promise<void> {
    const checkId = `bgcheck_${kommuterId}_${Date.now()}`;
    const backgroundCheckData: BackgroundCheckData = {
      id: checkId,
      kommuterId,
      status: 'pending',
      requestedAt: new Date(),
      documents: {},
      tripsCompletedAtRequest: tripsCompleted,
    };

    await setDoc(doc(db, 'backgroundChecks', checkId), backgroundCheckData);

    await updateDoc(doc(db, 'kommuters', kommuterId), {
      backgroundCheckRequired: true,
      backgroundCheckStatus: 'pending',
      canAcceptTrips: false,
      updatedAt: Timestamp.now(),
    });

    await this.sendNotificationToKommuter(kommuterId);

    console.log(`[BACKGROUND CHECK] Triggered for kommuter ${kommuterId} after ${tripsCompleted} trips`);
  }

  static async submitBackgroundCheckDocuments(
    kommuterId: string,
    documents: {
      criminalRecordUrl: string;
      identityVerificationUrl?: string;
      additionalDocumentsUrls?: string[];
    }
  ): Promise<void> {
    const q = query(
      collection(db, 'backgroundChecks'),
      where('kommuterId', '==', kommuterId),
      where('status', '==', 'pending')
    );
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      throw new Error('No pending background check found');
    }

    const checkDoc = snapshot.docs[0];
    await updateDoc(doc(db, 'backgroundChecks', checkDoc.id), {
      documents,
      status: 'in_progress',
      updatedAt: Timestamp.now(),
    });

    await updateDoc(doc(db, 'kommuters', kommuterId), {
      backgroundCheckStatus: 'in_progress',
      updatedAt: Timestamp.now(),
    });

    console.log(`[BACKGROUND CHECK] Documents submitted for kommuter ${kommuterId}`);
  }

  static async approveBackgroundCheck(
    checkId: string,
    verifiedBy: string,
    notes?: string
  ): Promise<void> {
    const checkDoc = await getDoc(doc(db, 'backgroundChecks', checkId));

    if (!checkDoc.exists()) {
      throw new Error('Background check not found');
    }

    const check = checkDoc.data() as BackgroundCheckData;

    await updateDoc(doc(db, 'backgroundChecks', checkId), {
      status: 'approved',
      completedAt: Timestamp.now(),
      results: {
        hasCriminalRecord: false,
        verifiedBy,
        notes,
      },
      updatedAt: Timestamp.now(),
    });

    await updateDoc(doc(db, 'kommuters', check.kommuterId), {
      backgroundCheckCompleted: true,
      backgroundCheckStatus: 'approved',
      canAcceptTrips: true,
      updatedAt: Timestamp.now(),
    });

    await this.sendApprovalNotification(check.kommuterId);

    console.log(`[BACKGROUND CHECK] Approved for kommuter ${check.kommuterId}`);
  }

  static async rejectBackgroundCheck(
    checkId: string,
    verifiedBy: string,
    reason: string
  ): Promise<void> {
    const checkDoc = await getDoc(doc(db, 'backgroundChecks', checkId));

    if (!checkDoc.exists()) {
      throw new Error('Background check not found');
    }

    const check = checkDoc.data() as BackgroundCheckData;

    await updateDoc(doc(db, 'backgroundChecks', checkId), {
      status: 'rejected',
      completedAt: Timestamp.now(),
      results: {
        hasCriminalRecord: true,
        verifiedBy,
        details: reason,
      },
      updatedAt: Timestamp.now(),
    });

    await updateDoc(doc(db, 'kommuters', check.kommuterId), {
      backgroundCheckCompleted: true,
      backgroundCheckStatus: 'rejected',
      canAcceptTrips: false,
      accountStatus: 'suspended',
      suspensionReason: 'Verificación de antecedentes penales rechazada',
      updatedAt: Timestamp.now(),
    });

    await this.sendRejectionNotification(check.kommuterId, reason);

    console.log(`[BACKGROUND CHECK] Rejected for kommuter ${check.kommuterId}`);
  }

  static async getBackgroundCheckDetails(kommuterId: string): Promise<BackgroundCheckData | null> {
    const q = query(
      collection(db, 'backgroundChecks'),
      where('kommuterId', '==', kommuterId)
    );
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return null;
    }

    const latestCheck = snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() } as BackgroundCheckData))
      .sort((a, b) => b.requestedAt.getTime() - a.requestedAt.getTime())[0];

    return latestCheck;
  }

  static async getPendingBackgroundChecks(): Promise<BackgroundCheckData[]> {
    const q = query(
      collection(db, 'backgroundChecks'),
      where('status', 'in', ['pending', 'in_progress'])
    );
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BackgroundCheckData));
  }

  private static async sendNotificationToKommuter(kommuterId: string): Promise<void> {
    console.log(`[NOTIFICATION] Sending background check request to kommuter ${kommuterId}`);
  }

  private static async sendApprovalNotification(kommuterId: string): Promise<void> {
    console.log(`[NOTIFICATION] Sending approval notification to kommuter ${kommuterId}`);
  }

  private static async sendRejectionNotification(kommuterId: string, reason: string): Promise<void> {
    console.log(`[NOTIFICATION] Sending rejection notification to kommuter ${kommuterId}: ${reason}`);
  }
}
