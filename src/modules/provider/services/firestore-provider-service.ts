import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface Service {
  id: string;
  name: string;
  price: number;
  duration: number;
  description: string;
  isActive: boolean;
}

export interface GalleryMedia {
  id: string;
  uri: string;
  description: string;
  type: 'image' | 'video';
  fileName?: string;
  size?: number;
}

export interface BusinessBranding {
  logo?: string;
  logoFileName?: string;
  logoSize?: number;
  hasCustomLogo: boolean;
}

export interface ContactInfo {
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
}

export interface BusinessHours {
  monday: { isOpen: boolean; openTime: string; closeTime: string; };
  tuesday: { isOpen: boolean; openTime: string; closeTime: string; };
  wednesday: { isOpen: boolean; openTime: string; closeTime: string; };
  thursday: { isOpen: boolean; openTime: string; closeTime: string; };
  friday: { isOpen: boolean; openTime: string; closeTime: string; };
  saturday: { isOpen: boolean; openTime: string; closeTime: string; };
  sunday: { isOpen: boolean; openTime: string; closeTime: string; };
}

export interface ServiceArea {
  id: string;
  name: string;
  isActive: boolean;
}

export interface ProviderProfile {
  bio: string;
  experience: string;
  certifications: string[];
  languages: string[];
  rating: number;
  totalReviews: number;
}

export interface SupportTicket {
  id: string;
  type: 'price_change' | 'block_service';
  serviceId?: string;
  serviceName?: string;
  newPriceListUrl?: string;
  justification?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

export interface ProviderData {
  businessName: string;
  services: Service[];
  gallery: GalleryMedia[];
  maxGallerySize: number;
  supportTickets: SupportTicket[];
  businessBranding: BusinessBranding;
  contactInfo: ContactInfo;
  businessHours: BusinessHours;
  serviceAreas: ServiceArea[];
  profile: ProviderProfile;
  isAmbulante: boolean;
  lastSyncTimestamp?: number;
  version?: number;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

const PROVIDERS_COLLECTION = 'providers';

export class FirestoreProviderService {
  static async getProviderData(userId: string): Promise<ProviderData | null> {
    try {
      console.log('📖 Fetching provider data from Firestore for user:', userId);
      
      const providerRef = doc(db, PROVIDERS_COLLECTION, userId);
      const providerSnap = await getDoc(providerRef);
      
      if (providerSnap.exists()) {
        const data = providerSnap.data() as ProviderData;
        console.log('✅ Provider data fetched successfully');
        return data;
      } else {
        console.log('ℹ️ No provider data found for user:', userId);
        return null;
      }
    } catch (error) {
      console.error('❌ Error fetching provider data:', error);
      throw error;
    }
  }

  static async createProviderData(userId: string, data: ProviderData): Promise<void> {
    try {
      console.log('📝 Creating provider data in Firestore for user:', userId);
      
      const providerRef = doc(db, PROVIDERS_COLLECTION, userId);
      
      const dataWithTimestamps = {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastSyncTimestamp: Date.now(),
        version: 1
      };
      
      await setDoc(providerRef, dataWithTimestamps);
      console.log('✅ Provider data created successfully');
    } catch (error) {
      console.error('❌ Error creating provider data:', error);
      throw error;
    }
  }

  static async updateProviderData(userId: string, updates: Partial<ProviderData>): Promise<void> {
    try {
      console.log('🔄 Updating provider data in Firestore for user:', userId);
      
      const providerRef = doc(db, PROVIDERS_COLLECTION, userId);
      
      const updatesWithTimestamp = {
        ...updates,
        updatedAt: serverTimestamp(),
        lastSyncTimestamp: Date.now(),
        version: (updates.version || 0) + 1
      };
      
      await updateDoc(providerRef, updatesWithTimestamp);
      console.log('✅ Provider data updated successfully');
    } catch (error) {
      console.error('❌ Error updating provider data:', error);
      throw error;
    }
  }

  static async updateBusinessName(userId: string, businessName: string): Promise<void> {
    return this.updateProviderData(userId, { businessName });
  }

  static async updateServices(userId: string, services: Service[]): Promise<void> {
    return this.updateProviderData(userId, { services });
  }

  static async toggleServiceStatus(userId: string, serviceId: string, currentServices: Service[]): Promise<void> {
    const updatedServices = currentServices.map(service => 
      service.id === serviceId 
        ? { ...service, isActive: !service.isActive }
        : service
    );
    return this.updateServices(userId, updatedServices);
  }

  static async addService(userId: string, service: Service, currentServices: Service[]): Promise<void> {
    const updatedServices = [...currentServices, service];
    return this.updateServices(userId, updatedServices);
  }

  static async removeService(userId: string, serviceId: string, currentServices: Service[]): Promise<void> {
    const updatedServices = currentServices.filter(s => s.id !== serviceId);
    return this.updateServices(userId, updatedServices);
  }

  static async updateGallery(userId: string, gallery: GalleryMedia[]): Promise<void> {
    return this.updateProviderData(userId, { gallery });
  }

  static async addGalleryMedia(userId: string, media: GalleryMedia, currentGallery: GalleryMedia[]): Promise<void> {
    const updatedGallery = [...currentGallery, media];
    return this.updateGallery(userId, updatedGallery);
  }

  static async removeGalleryMedia(userId: string, mediaId: string, currentGallery: GalleryMedia[]): Promise<void> {
    const updatedGallery = currentGallery.filter(item => item.id !== mediaId);
    return this.updateGallery(userId, updatedGallery);
  }

  static async updateBusinessBranding(userId: string, branding: BusinessBranding): Promise<void> {
    return this.updateProviderData(userId, { businessBranding: branding });
  }

  static async updateContactInfo(userId: string, contactInfo: ContactInfo): Promise<void> {
    return this.updateProviderData(userId, { contactInfo });
  }

  static async updateBusinessHours(userId: string, businessHours: BusinessHours): Promise<void> {
    return this.updateProviderData(userId, { businessHours });
  }

  static async updateServiceAreas(userId: string, serviceAreas: ServiceArea[]): Promise<void> {
    return this.updateProviderData(userId, { serviceAreas });
  }

  static async updateProfile(userId: string, profile: ProviderProfile): Promise<void> {
    return this.updateProviderData(userId, { profile });
  }

  static async updateAmbulanteStatus(userId: string, isAmbulante: boolean): Promise<void> {
    return this.updateProviderData(userId, { isAmbulante });
  }

  static async addSupportTicket(userId: string, ticket: SupportTicket, currentTickets: SupportTicket[]): Promise<void> {
    const updatedTickets = [...currentTickets, ticket];
    return this.updateProviderData(userId, { supportTickets: updatedTickets });
  }
}
