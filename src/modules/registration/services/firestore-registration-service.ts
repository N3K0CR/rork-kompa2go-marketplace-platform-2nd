import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  query, 
  where,
  Timestamp,
  increment
} from 'firebase/firestore';
import { db, storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import type { 
  ClientProfile,
  ProviderProfile,
  KommuterProfile,
  Vehicle,
  Referral,
  BaseUserProfile
} from '@/src/shared/types/registration-types';

const COLLECTIONS = {
  USERS: 'users',
  CLIENTS: 'clients',
  PROVIDERS: 'providers',
  KOMMUTERS: 'kommuters',
  VEHICLES: 'vehicles',
  REFERRALS: 'referrals',
  REFERRAL_CODES: 'referral_codes',
} as const;

const dateToTimestamp = (date: Date): Timestamp => Timestamp.fromDate(date);
const timestampToDate = (timestamp: any): Date => {
  if (timestamp?.toDate) return timestamp.toDate();
  if (timestamp instanceof Date) return timestamp;
  return new Date(timestamp);
};

export const registrationFirestoreService = {
  users: {
    async create(userId: string, profile: BaseUserProfile): Promise<void> {
      const userRef = doc(db, COLLECTIONS.USERS, userId);
      await setDoc(userRef, {
        ...profile,
        createdAt: dateToTimestamp(profile.createdAt),
        updatedAt: dateToTimestamp(profile.updatedAt),
      });
      console.log('[RegistrationFirestore] User created:', userId);
    },

    async get(userId: string): Promise<BaseUserProfile | null> {
      const userRef = doc(db, COLLECTIONS.USERS, userId);
      const userSnap = await getDoc(userRef);
      
      if (!userSnap.exists()) return null;
      
      const data = userSnap.data();
      return {
        ...data,
        createdAt: timestampToDate(data.createdAt),
        updatedAt: timestampToDate(data.updatedAt),
      } as BaseUserProfile;
    },

    async update(userId: string, updates: Partial<BaseUserProfile>): Promise<void> {
      const userRef = doc(db, COLLECTIONS.USERS, userId);
      const firestoreUpdates: any = { ...updates };
      
      if (updates.updatedAt) {
        firestoreUpdates.updatedAt = dateToTimestamp(updates.updatedAt);
      }
      
      await updateDoc(userRef, firestoreUpdates);
      console.log('[RegistrationFirestore] User updated:', userId);
    },
  },

  clients: {
    async create(profile: ClientProfile): Promise<void> {
      const clientRef = doc(db, COLLECTIONS.CLIENTS, profile.id);
      await setDoc(clientRef, {
        ...profile,
        createdAt: dateToTimestamp(profile.createdAt),
        updatedAt: dateToTimestamp(profile.updatedAt),
        dateOfBirth: profile.dateOfBirth ? dateToTimestamp(profile.dateOfBirth) : null,
      });
      
      await registrationFirestoreService.users.create(profile.id, profile);
      
      await registrationFirestoreService.referralCodes.create(profile.id, profile.referralCode);
      
      console.log('[RegistrationFirestore] Client created:', profile.id);
    },

    async get(clientId: string): Promise<ClientProfile | null> {
      const clientRef = doc(db, COLLECTIONS.CLIENTS, clientId);
      const clientSnap = await getDoc(clientRef);
      
      if (!clientSnap.exists()) return null;
      
      const data = clientSnap.data();
      return {
        ...data,
        createdAt: timestampToDate(data.createdAt),
        updatedAt: timestampToDate(data.updatedAt),
        dateOfBirth: data.dateOfBirth ? timestampToDate(data.dateOfBirth) : undefined,
      } as ClientProfile;
    },

    async update(clientId: string, updates: Partial<ClientProfile>): Promise<void> {
      const clientRef = doc(db, COLLECTIONS.CLIENTS, clientId);
      const firestoreUpdates: any = { ...updates };
      
      if (updates.updatedAt) {
        firestoreUpdates.updatedAt = dateToTimestamp(updates.updatedAt);
      }
      if (updates.dateOfBirth) {
        firestoreUpdates.dateOfBirth = dateToTimestamp(updates.dateOfBirth);
      }
      
      await updateDoc(clientRef, firestoreUpdates);
      await registrationFirestoreService.users.update(clientId, updates);
      console.log('[RegistrationFirestore] Client updated:', clientId);
    },
  },

  providers: {
    async create(profile: ProviderProfile): Promise<void> {
      const providerRef = doc(db, COLLECTIONS.PROVIDERS, profile.id);
      await setDoc(providerRef, {
        ...profile,
        createdAt: dateToTimestamp(profile.createdAt),
        updatedAt: dateToTimestamp(profile.updatedAt),
      });
      
      await registrationFirestoreService.users.create(profile.id, profile);
      
      await registrationFirestoreService.referralCodes.create(profile.id, profile.referralCode);
      
      console.log('[RegistrationFirestore] Provider created:', profile.id);
    },

    async get(providerId: string): Promise<ProviderProfile | null> {
      const providerRef = doc(db, COLLECTIONS.PROVIDERS, providerId);
      const providerSnap = await getDoc(providerRef);
      
      if (!providerSnap.exists()) return null;
      
      const data = providerSnap.data();
      return {
        ...data,
        createdAt: timestampToDate(data.createdAt),
        updatedAt: timestampToDate(data.updatedAt),
      } as ProviderProfile;
    },

    async update(providerId: string, updates: Partial<ProviderProfile>): Promise<void> {
      const providerRef = doc(db, COLLECTIONS.PROVIDERS, providerId);
      const firestoreUpdates: any = { ...updates };
      
      if (updates.updatedAt) {
        firestoreUpdates.updatedAt = dateToTimestamp(updates.updatedAt);
      }
      
      await updateDoc(providerRef, firestoreUpdates);
      await registrationFirestoreService.users.update(providerId, updates);
      console.log('[RegistrationFirestore] Provider updated:', providerId);
    },

    async getByNiche(niche: string): Promise<ProviderProfile[]> {
      const providersRef = collection(db, COLLECTIONS.PROVIDERS);
      const q = query(providersRef, where('niche', '==', niche), where('isActive', '==', true));
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          createdAt: timestampToDate(data.createdAt),
          updatedAt: timestampToDate(data.updatedAt),
        } as ProviderProfile;
      });
    },
  },

  kommuters: {
    async create(profile: KommuterProfile): Promise<void> {
      const kommuterRef = doc(db, COLLECTIONS.KOMMUTERS, profile.id);
      await setDoc(kommuterRef, {
        ...profile,
        createdAt: dateToTimestamp(profile.createdAt),
        updatedAt: dateToTimestamp(profile.updatedAt),
        licenseExpiryDate: dateToTimestamp(profile.licenseExpiryDate),
        backgroundCheckDate: profile.backgroundCheckDate ? dateToTimestamp(profile.backgroundCheckDate) : null,
        documents: profile.documents.map(doc => ({
          ...doc,
          uploadedAt: dateToTimestamp(doc.uploadedAt),
          expiryDate: doc.expiryDate ? dateToTimestamp(doc.expiryDate) : null,
        })),
      });
      
      await registrationFirestoreService.users.create(profile.id, profile);
      
      await registrationFirestoreService.referralCodes.create(profile.id, profile.referralCode);
      
      console.log('[RegistrationFirestore] Kommuter created:', profile.id);
    },

    async get(kommuterId: string): Promise<KommuterProfile | null> {
      const kommuterRef = doc(db, COLLECTIONS.KOMMUTERS, kommuterId);
      const kommuterSnap = await getDoc(kommuterRef);
      
      if (!kommuterSnap.exists()) return null;
      
      const data = kommuterSnap.data();
      return {
        ...data,
        createdAt: timestampToDate(data.createdAt),
        updatedAt: timestampToDate(data.updatedAt),
        licenseExpiryDate: timestampToDate(data.licenseExpiryDate),
        backgroundCheckDate: data.backgroundCheckDate ? timestampToDate(data.backgroundCheckDate) : undefined,
        documents: data.documents.map((doc: any) => ({
          ...doc,
          uploadedAt: timestampToDate(doc.uploadedAt),
          expiryDate: doc.expiryDate ? timestampToDate(doc.expiryDate) : undefined,
        })),
      } as KommuterProfile;
    },

    async update(kommuterId: string, updates: Partial<KommuterProfile>): Promise<void> {
      const kommuterRef = doc(db, COLLECTIONS.KOMMUTERS, kommuterId);
      const firestoreUpdates: any = { ...updates };
      
      if (updates.updatedAt) {
        firestoreUpdates.updatedAt = dateToTimestamp(updates.updatedAt);
      }
      if (updates.licenseExpiryDate) {
        firestoreUpdates.licenseExpiryDate = dateToTimestamp(updates.licenseExpiryDate);
      }
      if (updates.backgroundCheckDate) {
        firestoreUpdates.backgroundCheckDate = dateToTimestamp(updates.backgroundCheckDate);
      }
      if (updates.documents) {
        firestoreUpdates.documents = updates.documents.map(doc => ({
          ...doc,
          uploadedAt: dateToTimestamp(doc.uploadedAt),
          expiryDate: doc.expiryDate ? dateToTimestamp(doc.expiryDate) : null,
        }));
      }
      
      await updateDoc(kommuterRef, firestoreUpdates);
      await registrationFirestoreService.users.update(kommuterId, updates);
      console.log('[RegistrationFirestore] Kommuter updated:', kommuterId);
    },

    async incrementTrips(kommuterId: string, type: 'completed' | 'cancelled'): Promise<void> {
      const kommuterRef = doc(db, COLLECTIONS.KOMMUTERS, kommuterId);
      const updates: any = {
        totalTrips: increment(1),
        updatedAt: Timestamp.now(),
      };
      
      if (type === 'completed') {
        updates.completedTrips = increment(1);
      } else {
        updates.cancelledTrips = increment(1);
      }
      
      await updateDoc(kommuterRef, updates);
      console.log('[RegistrationFirestore] Kommuter trips incremented:', kommuterId, type);
    },

    async checkBackgroundCheckRequired(kommuterId: string): Promise<boolean> {
      const profile = await this.get(kommuterId);
      if (!profile) return false;
      
      return profile.completedTrips >= 20 && !profile.backgroundCheckCompleted;
    },
  },

  vehicles: {
    async create(vehicle: Vehicle): Promise<void> {
      const vehicleRef = doc(db, COLLECTIONS.VEHICLES, vehicle.id);
      await setDoc(vehicleRef, {
        ...vehicle,
        createdAt: dateToTimestamp(vehicle.createdAt),
        updatedAt: dateToTimestamp(vehicle.updatedAt),
        documents: vehicle.documents.map(doc => ({
          ...doc,
          uploadedAt: dateToTimestamp(doc.uploadedAt),
          expiryDate: doc.expiryDate ? dateToTimestamp(doc.expiryDate) : null,
        })),
      });
      console.log('[RegistrationFirestore] Vehicle created:', vehicle.id);
    },

    async get(vehicleId: string): Promise<Vehicle | null> {
      const vehicleRef = doc(db, COLLECTIONS.VEHICLES, vehicleId);
      const vehicleSnap = await getDoc(vehicleRef);
      
      if (!vehicleSnap.exists()) return null;
      
      const data = vehicleSnap.data();
      return {
        ...data,
        createdAt: timestampToDate(data.createdAt),
        updatedAt: timestampToDate(data.updatedAt),
        documents: data.documents.map((doc: any) => ({
          ...doc,
          uploadedAt: timestampToDate(doc.uploadedAt),
          expiryDate: doc.expiryDate ? timestampToDate(doc.expiryDate) : undefined,
        })),
      } as Vehicle;
    },

    async update(vehicleId: string, updates: Partial<Vehicle>): Promise<void> {
      const vehicleRef = doc(db, COLLECTIONS.VEHICLES, vehicleId);
      const firestoreUpdates: any = { ...updates };
      
      if (updates.updatedAt) {
        firestoreUpdates.updatedAt = dateToTimestamp(updates.updatedAt);
      }
      if (updates.documents) {
        firestoreUpdates.documents = updates.documents.map(doc => ({
          ...doc,
          uploadedAt: dateToTimestamp(doc.uploadedAt),
          expiryDate: doc.expiryDate ? dateToTimestamp(doc.expiryDate) : null,
        }));
      }
      
      await updateDoc(vehicleRef, firestoreUpdates);
      console.log('[RegistrationFirestore] Vehicle updated:', vehicleId);
    },

    async getByDriver(driverId: string): Promise<Vehicle[]> {
      const vehiclesRef = collection(db, COLLECTIONS.VEHICLES);
      const q = query(vehiclesRef, where('assignedDriverId', '==', driverId), where('isActive', '==', true));
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          createdAt: timestampToDate(data.createdAt),
          updatedAt: timestampToDate(data.updatedAt),
          documents: data.documents.map((doc: any) => ({
            ...doc,
            uploadedAt: timestampToDate(doc.uploadedAt),
            expiryDate: doc.expiryDate ? timestampToDate(doc.expiryDate) : undefined,
          })),
        } as Vehicle;
      });
    },
  },

  referrals: {
    async create(referral: Referral): Promise<void> {
      const referralRef = doc(db, COLLECTIONS.REFERRALS, referral.id);
      await setDoc(referralRef, {
        ...referral,
        createdAt: dateToTimestamp(referral.createdAt),
        updatedAt: dateToTimestamp(referral.updatedAt),
        referrerRewardPaidAt: referral.referrerRewardPaidAt ? dateToTimestamp(referral.referrerRewardPaidAt) : null,
        referredRewardPaidAt: referral.referredRewardPaidAt ? dateToTimestamp(referral.referredRewardPaidAt) : null,
      });
      console.log('[RegistrationFirestore] Referral created:', referral.id);
    },

    async get(referralId: string): Promise<Referral | null> {
      const referralRef = doc(db, COLLECTIONS.REFERRALS, referralId);
      const referralSnap = await getDoc(referralRef);
      
      if (!referralSnap.exists()) return null;
      
      const data = referralSnap.data();
      return {
        ...data,
        createdAt: timestampToDate(data.createdAt),
        updatedAt: timestampToDate(data.updatedAt),
        referrerRewardPaidAt: data.referrerRewardPaidAt ? timestampToDate(data.referrerRewardPaidAt) : undefined,
        referredRewardPaidAt: data.referredRewardPaidAt ? timestampToDate(data.referredRewardPaidAt) : undefined,
      } as Referral;
    },

    async update(referralId: string, updates: Partial<Referral>): Promise<void> {
      const referralRef = doc(db, COLLECTIONS.REFERRALS, referralId);
      const firestoreUpdates: any = { ...updates };
      
      if (updates.updatedAt) {
        firestoreUpdates.updatedAt = dateToTimestamp(updates.updatedAt);
      }
      if (updates.referrerRewardPaidAt) {
        firestoreUpdates.referrerRewardPaidAt = dateToTimestamp(updates.referrerRewardPaidAt);
      }
      if (updates.referredRewardPaidAt) {
        firestoreUpdates.referredRewardPaidAt = dateToTimestamp(updates.referredRewardPaidAt);
      }
      
      await updateDoc(referralRef, firestoreUpdates);
      console.log('[RegistrationFirestore] Referral updated:', referralId);
    },

    async getByReferrer(referrerId: string): Promise<Referral[]> {
      const referralsRef = collection(db, COLLECTIONS.REFERRALS);
      const q = query(referralsRef, where('referrerId', '==', referrerId));
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          createdAt: timestampToDate(data.createdAt),
          updatedAt: timestampToDate(data.updatedAt),
          referrerRewardPaidAt: data.referrerRewardPaidAt ? timestampToDate(data.referrerRewardPaidAt) : undefined,
          referredRewardPaidAt: data.referredRewardPaidAt ? timestampToDate(data.referredRewardPaidAt) : undefined,
        } as Referral;
      });
    },

    async getByReferred(referredUserId: string): Promise<Referral | null> {
      const referralsRef = collection(db, COLLECTIONS.REFERRALS);
      const q = query(referralsRef, where('referredUserId', '==', referredUserId));
      
      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) return null;
      
      const data = querySnapshot.docs[0].data();
      return {
        ...data,
        createdAt: timestampToDate(data.createdAt),
        updatedAt: timestampToDate(data.updatedAt),
        referrerRewardPaidAt: data.referrerRewardPaidAt ? timestampToDate(data.referrerRewardPaidAt) : undefined,
        referredRewardPaidAt: data.referredRewardPaidAt ? timestampToDate(data.referredRewardPaidAt) : undefined,
      } as Referral;
    },

    async incrementTrips(referralId: string): Promise<void> {
      const referralRef = doc(db, COLLECTIONS.REFERRALS, referralId);
      await updateDoc(referralRef, {
        referredUserTripsCompleted: increment(1),
        updatedAt: Timestamp.now(),
      });
      console.log('[RegistrationFirestore] Referral trips incremented:', referralId);
    },
  },

  referralCodes: {
    async create(userId: string, code: string): Promise<void> {
      const codeRef = doc(db, COLLECTIONS.REFERRAL_CODES, code);
      await setDoc(codeRef, {
        userId,
        code,
        createdAt: Timestamp.now(),
      });
      console.log('[RegistrationFirestore] Referral code created:', code);
    },

    async getUserByCode(code: string): Promise<string | null> {
      const codeRef = doc(db, COLLECTIONS.REFERRAL_CODES, code);
      const codeSnap = await getDoc(codeRef);
      
      if (!codeSnap.exists()) return null;
      
      return codeSnap.data().userId;
    },
  },

  storage: {
    async uploadDocument(
      userId: string,
      documentType: string,
      file: Blob,
      fileName: string
    ): Promise<string> {
      const storageRef = ref(storage, `users/${userId}/documents/${documentType}/${fileName}`);
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);
      console.log('[RegistrationFirestore] Document uploaded:', downloadURL);
      return downloadURL;
    },

    async uploadVehicleDocument(
      vehicleId: string,
      documentType: string,
      file: Blob,
      fileName: string
    ): Promise<string> {
      const storageRef = ref(storage, `vehicles/${vehicleId}/documents/${documentType}/${fileName}`);
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);
      console.log('[RegistrationFirestore] Vehicle document uploaded:', downloadURL);
      return downloadURL;
    },
  },
};

export default registrationFirestoreService;
