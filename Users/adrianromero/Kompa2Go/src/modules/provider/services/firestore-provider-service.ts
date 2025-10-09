import { db, storage } from '@/lib/firebase';
import {
  collection,
  doc,
  getDoc,
  getDocs,

  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
  addDoc,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import type { ProviderService, ServiceModificationRequest, ProviderProfile } from '@/src/shared/types/provider-types';

export class ProviderServiceManager {
  async getProviderProfile(providerId: string): Promise<ProviderProfile | null> {
    try {
      console.log('[ProviderService] Getting provider profile:', providerId);
      const providerDoc = await getDoc(doc(db, 'providers', providerId));
      
      if (!providerDoc.exists()) {
        console.log('[ProviderService] Provider not found');
        return null;
      }

      const data = providerDoc.data();
      return {
        id: providerDoc.id,
        userId: data.userId || providerId,
        companyInfo: data.companyInfo || data.registrationData?.companyInfo || {},
        contactInfo: data.contactInfo || data.registrationData?.contactInfo || {},
        serviceInfo: data.serviceInfo || data.registrationData?.serviceInfo || {},
        status: data.status || 'pending',
        rating: data.rating,
        totalServices: data.totalServices || 0,
        completedServices: data.completedServices || 0,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        approvedAt: data.approvedAt?.toDate(),
        hasActiveReservation: data.hasActiveReservation || false,
        profilePhotos: data.profilePhotos || [],
        businessHours: data.businessHours,
      } as ProviderProfile;
    } catch (error) {
      console.error('[ProviderService] Error getting provider profile:', error);
      throw error;
    }
  }

  async updateProviderProfile(providerId: string, updates: Partial<ProviderProfile>): Promise<void> {
    try {
      console.log('[ProviderService] Updating provider profile:', providerId);
      const providerRef = doc(db, 'providers', providerId);
      
      await updateDoc(providerRef, {
        ...updates,
        updatedAt: Timestamp.now(),
      });

      console.log('[ProviderService] Provider profile updated successfully');
    } catch (error) {
      console.error('[ProviderService] Error updating provider profile:', error);
      throw error;
    }
  }

  async getProviderServices(providerId: string): Promise<ProviderService[]> {
    try {
      console.log('[ProviderService] Getting services for provider:', providerId);
      const servicesQuery = query(
        collection(db, 'provider_services'),
        where('providerId', '==', providerId),
        orderBy('createdAt', 'desc')
      );

      const snapshot = await getDocs(servicesQuery);
      const services: ProviderService[] = [];

      snapshot.forEach((doc) => {
        const data = doc.data();
        services.push({
          id: doc.id,
          providerId: data.providerId,
          name: data.name,
          description: data.description,
          category: data.category,
          price: data.price,
          currency: data.currency || 'CRC',
          duration: data.duration,
          isActive: data.isActive !== false,
          photos: data.photos || [],
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          status: data.status || 'active',
          rejectionReason: data.rejectionReason,
        });
      });

      console.log('[ProviderService] Found services:', services.length);
      return services;
    } catch (error) {
      console.error('[ProviderService] Error getting services:', error);
      throw error;
    }
  }

  async addService(providerId: string, service: Omit<ProviderService, 'id' | 'providerId' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      console.log('[ProviderService] Adding new service for provider:', providerId);

      const existingServices = await this.getProviderServices(providerId);
      const duplicate = existingServices.find(
        (s) => s.name.toLowerCase().trim() === service.name.toLowerCase().trim() && s.status !== 'rejected'
      );

      if (duplicate) {
        throw new Error('Ya existe un servicio con este nombre. Si deseas modificar el precio, usa la opción de modificación de precio.');
      }

      const serviceData = {
        providerId,
        name: service.name,
        description: service.description,
        category: service.category,
        price: service.price,
        currency: service.currency || 'CRC',
        duration: service.duration,
        isActive: true,
        photos: service.photos || [],
        status: 'pending_approval',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      const docRef = await addDoc(collection(db, 'provider_services'), serviceData);
      console.log('[ProviderService] Service added successfully:', docRef.id);
      
      return docRef.id;
    } catch (error) {
      console.error('[ProviderService] Error adding service:', error);
      throw error;
    }
  }

  async updateService(serviceId: string, updates: Partial<ProviderService>): Promise<void> {
    try {
      console.log('[ProviderService] Updating service:', serviceId);
      const serviceRef = doc(db, 'provider_services', serviceId);
      
      const { id, providerId, createdAt, ...allowedUpdates } = updates;
      
      await updateDoc(serviceRef, {
        ...allowedUpdates,
        updatedAt: Timestamp.now(),
      });

      console.log('[ProviderService] Service updated successfully');
    } catch (error) {
      console.error('[ProviderService] Error updating service:', error);
      throw error;
    }
  }

  async deleteService(serviceId: string): Promise<void> {
    try {
      console.log('[ProviderService] Deleting service:', serviceId);
      
      const serviceDoc = await getDoc(doc(db, 'provider_services', serviceId));
      if (serviceDoc.exists()) {
        const data = serviceDoc.data();
        if (data.photos && data.photos.length > 0) {
          for (const photoUrl of data.photos) {
            try {
              const photoRef = ref(storage, photoUrl);
              await deleteObject(photoRef);
            } catch (error) {
              console.warn('[ProviderService] Error deleting photo:', error);
            }
          }
        }
      }

      await deleteDoc(doc(db, 'provider_services', serviceId));
      console.log('[ProviderService] Service deleted successfully');
    } catch (error) {
      console.error('[ProviderService] Error deleting service:', error);
      throw error;
    }
  }

  async toggleServiceStatus(serviceId: string, isActive: boolean): Promise<void> {
    try {
      console.log('[ProviderService] Toggling service status:', serviceId, isActive);
      await this.updateService(serviceId, { isActive });
    } catch (error) {
      console.error('[ProviderService] Error toggling service status:', error);
      throw error;
    }
  }

  async requestPriceModification(
    providerId: string,
    serviceId: string,
    serviceName: string,
    oldPrice: number,
    newPrice: number,
    priceUpdateUrl: string
  ): Promise<string> {
    try {
      console.log('[ProviderService] Requesting price modification for service:', serviceId);

      const requestData = {
        providerId,
        serviceId,
        serviceName,
        oldPrice,
        newPrice,
        priceUpdateUrl,
        status: 'pending',
        createdAt: Timestamp.now(),
      };

      const docRef = await addDoc(collection(db, 'service_modification_requests'), requestData);
      console.log('[ProviderService] Price modification request created:', docRef.id);
      
      return docRef.id;
    } catch (error) {
      console.error('[ProviderService] Error requesting price modification:', error);
      throw error;
    }
  }

  async getPriceModificationRequests(providerId: string): Promise<ServiceModificationRequest[]> {
    try {
      console.log('[ProviderService] Getting price modification requests for provider:', providerId);
      const requestsQuery = query(
        collection(db, 'service_modification_requests'),
        where('providerId', '==', providerId),
        orderBy('createdAt', 'desc')
      );

      const snapshot = await getDocs(requestsQuery);
      const requests: ServiceModificationRequest[] = [];

      snapshot.forEach((doc) => {
        const data = doc.data();
        requests.push({
          id: doc.id,
          providerId: data.providerId,
          serviceId: data.serviceId,
          serviceName: data.serviceName,
          oldPrice: data.oldPrice,
          newPrice: data.newPrice,
          priceUpdateUrl: data.priceUpdateUrl,
          status: data.status,
          createdAt: data.createdAt?.toDate() || new Date(),
          processedAt: data.processedAt?.toDate(),
          processedBy: data.processedBy,
          notes: data.notes,
        });
      });

      console.log('[ProviderService] Found modification requests:', requests.length);
      return requests;
    } catch (error) {
      console.error('[ProviderService] Error getting modification requests:', error);
      throw error;
    }
  }

  async uploadServicePhoto(providerId: string, serviceId: string, photoUri: string): Promise<string> {
    try {
      console.log('[ProviderService] Uploading service photo');
      
      const response = await fetch(photoUri);
      const blob = await response.blob();
      
      const filename = `service_${serviceId}_${Date.now()}.jpg`;
      const storageRef = ref(storage, `providers/${providerId}/services/${filename}`);
      
      await uploadBytes(storageRef, blob);
      const downloadUrl = await getDownloadURL(storageRef);
      
      console.log('[ProviderService] Photo uploaded successfully');
      return downloadUrl;
    } catch (error) {
      console.error('[ProviderService] Error uploading photo:', error);
      throw error;
    }
  }

  async deleteServicePhoto(photoUrl: string): Promise<void> {
    try {
      console.log('[ProviderService] Deleting service photo');
      const photoRef = ref(storage, photoUrl);
      await deleteObject(photoRef);
      console.log('[ProviderService] Photo deleted successfully');
    } catch (error) {
      console.error('[ProviderService] Error deleting photo:', error);
      throw error;
    }
  }
}

export const providerServiceManager = new ProviderServiceManager();
