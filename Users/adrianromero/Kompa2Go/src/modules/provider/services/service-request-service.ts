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
  onSnapshot,
  serverTimestamp,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface ServiceRequest {
  id?: string;
  providerId: string;
  providerName: string;
  requestType: 'new_service' | 'modify_service' | 'delete_service';
  serviceData: {
    name: string;
    description: string;
    category?: string;
    price?: number;
    currency?: string;
    duration?: number;
    photos?: string[];
  };
  existingServiceId?: string;
  reason?: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewedBy?: string;
  reviewedAt?: Date;
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PriceModificationRequest {
  id?: string;
  providerId: string;
  providerName: string;
  serviceId: string;
  serviceName: string;
  oldPrice: number;
  newPrice: number;
  currency: string;
  reason: string;
  proofUrl?: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewedBy?: string;
  reviewedAt?: Date;
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const SERVICE_REQUESTS_COLLECTION = 'service_requests';
const PRICE_MODIFICATION_REQUESTS_COLLECTION = 'price_modification_requests';

export class ServiceRequestService {
  async createServiceRequest(
    requestData: Omit<ServiceRequest, 'id' | 'status' | 'createdAt' | 'updatedAt'>
  ): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, SERVICE_REQUESTS_COLLECTION), {
        ...requestData,
        status: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      console.log('[ServiceRequestService] Service request created:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('[ServiceRequestService] Error creating service request:', error);
      throw error;
    }
  }

  async getServiceRequest(requestId: string): Promise<ServiceRequest | null> {
    try {
      const docRef = doc(db, SERVICE_REQUESTS_COLLECTION, requestId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return null;
      }

      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        reviewedAt: data.reviewedAt?.toDate(),
      } as ServiceRequest;
    } catch (error) {
      console.error('[ServiceRequestService] Error getting service request:', error);
      throw error;
    }
  }

  async getProviderRequests(providerId: string): Promise<ServiceRequest[]> {
    try {
      const q = query(
        collection(db, SERVICE_REQUESTS_COLLECTION),
        where('providerId', '==', providerId),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          reviewedAt: data.reviewedAt?.toDate(),
        } as ServiceRequest;
      });
    } catch (error) {
      console.error('[ServiceRequestService] Error getting provider requests:', error);
      throw error;
    }
  }

  async getPendingRequests(): Promise<ServiceRequest[]> {
    try {
      const q = query(
        collection(db, SERVICE_REQUESTS_COLLECTION),
        where('status', '==', 'pending'),
        orderBy('createdAt', 'asc')
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          reviewedAt: data.reviewedAt?.toDate(),
        } as ServiceRequest;
      });
    } catch (error) {
      console.error('[ServiceRequestService] Error getting pending requests:', error);
      throw error;
    }
  }

  subscribeToProviderRequests(
    providerId: string,
    callback: (requests: ServiceRequest[]) => void
  ): Unsubscribe {
    const q = query(
      collection(db, SERVICE_REQUESTS_COLLECTION),
      where('providerId', '==', providerId),
      orderBy('createdAt', 'desc')
    );

    return onSnapshot(
      q,
      (snapshot) => {
        const requests = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
            reviewedAt: data.reviewedAt?.toDate(),
          } as ServiceRequest;
        });
        callback(requests);
      },
      (error) => {
        console.error('[ServiceRequestService] Error in requests subscription:', error);
        callback([]);
      }
    );
  }

  async approveRequest(requestId: string, reviewerId: string): Promise<void> {
    try {
      const docRef = doc(db, SERVICE_REQUESTS_COLLECTION, requestId);
      await updateDoc(docRef, {
        status: 'approved',
        reviewedBy: reviewerId,
        reviewedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      console.log('[ServiceRequestService] Request approved:', requestId);
    } catch (error) {
      console.error('[ServiceRequestService] Error approving request:', error);
      throw error;
    }
  }

  async rejectRequest(
    requestId: string,
    reviewerId: string,
    reason: string
  ): Promise<void> {
    try {
      const docRef = doc(db, SERVICE_REQUESTS_COLLECTION, requestId);
      await updateDoc(docRef, {
        status: 'rejected',
        reviewedBy: reviewerId,
        reviewedAt: serverTimestamp(),
        rejectionReason: reason,
        updatedAt: serverTimestamp(),
      });
      console.log('[ServiceRequestService] Request rejected:', requestId);
    } catch (error) {
      console.error('[ServiceRequestService] Error rejecting request:', error);
      throw error;
    }
  }

  async createPriceModificationRequest(
    requestData: Omit<PriceModificationRequest, 'id' | 'status' | 'createdAt' | 'updatedAt'>
  ): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, PRICE_MODIFICATION_REQUESTS_COLLECTION), {
        ...requestData,
        status: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      console.log('[ServiceRequestService] Price modification request created:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('[ServiceRequestService] Error creating price modification request:', error);
      throw error;
    }
  }

  async getPriceModificationRequest(requestId: string): Promise<PriceModificationRequest | null> {
    try {
      const docRef = doc(db, PRICE_MODIFICATION_REQUESTS_COLLECTION, requestId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return null;
      }

      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        reviewedAt: data.reviewedAt?.toDate(),
      } as PriceModificationRequest;
    } catch (error) {
      console.error('[ServiceRequestService] Error getting price modification request:', error);
      throw error;
    }
  }

  async getProviderPriceModificationRequests(
    providerId: string
  ): Promise<PriceModificationRequest[]> {
    try {
      const q = query(
        collection(db, PRICE_MODIFICATION_REQUESTS_COLLECTION),
        where('providerId', '==', providerId),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          reviewedAt: data.reviewedAt?.toDate(),
        } as PriceModificationRequest;
      });
    } catch (error) {
      console.error('[ServiceRequestService] Error getting provider price modification requests:', error);
      throw error;
    }
  }

  subscribeToPriceModificationRequests(
    providerId: string,
    callback: (requests: PriceModificationRequest[]) => void
  ): Unsubscribe {
    const q = query(
      collection(db, PRICE_MODIFICATION_REQUESTS_COLLECTION),
      where('providerId', '==', providerId),
      orderBy('createdAt', 'desc')
    );

    return onSnapshot(
      q,
      (snapshot) => {
        const requests = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
            reviewedAt: data.reviewedAt?.toDate(),
          } as PriceModificationRequest;
        });
        callback(requests);
      },
      (error) => {
        console.error('[ServiceRequestService] Error in price modification requests subscription:', error);
        callback([]);
      }
    );
  }

  async approvePriceModificationRequest(
    requestId: string,
    reviewerId: string
  ): Promise<void> {
    try {
      const docRef = doc(db, PRICE_MODIFICATION_REQUESTS_COLLECTION, requestId);
      await updateDoc(docRef, {
        status: 'approved',
        reviewedBy: reviewerId,
        reviewedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      console.log('[ServiceRequestService] Price modification request approved:', requestId);
    } catch (error) {
      console.error('[ServiceRequestService] Error approving price modification request:', error);
      throw error;
    }
  }

  async rejectPriceModificationRequest(
    requestId: string,
    reviewerId: string,
    reason: string
  ): Promise<void> {
    try {
      const docRef = doc(db, PRICE_MODIFICATION_REQUESTS_COLLECTION, requestId);
      await updateDoc(docRef, {
        status: 'rejected',
        reviewedBy: reviewerId,
        reviewedAt: serverTimestamp(),
        rejectionReason: reason,
        updatedAt: serverTimestamp(),
      });
      console.log('[ServiceRequestService] Price modification request rejected:', requestId);
    } catch (error) {
      console.error('[ServiceRequestService] Error rejecting price modification request:', error);
      throw error;
    }
  }
}

export const serviceRequestService = new ServiceRequestService();
