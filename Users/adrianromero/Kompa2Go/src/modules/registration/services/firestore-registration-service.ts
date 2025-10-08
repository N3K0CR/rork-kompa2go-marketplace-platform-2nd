import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  query, 
  where, 
  getDocs,
  serverTimestamp,
  increment 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type {
  ClientRegistrationData,
  ProviderRegistrationData,
  KommuterRegistrationData,
  UserProfile,
} from '@/src/shared/types/registration-types';

interface SimpleReferralData {
  referrerId: string;
  referredId: string;
  referralCode: string;
  status: 'pending' | 'active' | 'completed';
  referredTripsCompleted: number;
  referrerRewardPaid: boolean;
  referredRewardPaid: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const USERS_COLLECTION = 'users';
const REFERRALS_COLLECTION = 'referrals';

class RegistrationService {
  static async registerClient(data: ClientRegistrationData): Promise<string> {
    try {
      const userId = `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const userProfile: UserProfile = {
        id: userId,
        type: 'client',
        status: 'active',
        registrationData: data,
        createdAt: new Date(),
        updatedAt: new Date(),
        tripsCompleted: 0,
        rating: 0,
      };

      await setDoc(doc(db, USERS_COLLECTION, userId), {
        ...userProfile,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      if (data.referralCode) {
        await this.createReferral(data.referralCode, userId);
      }

      console.log('Client registered successfully:', userId);
      return userId;
    } catch (error) {
      console.error('Error registering client:', error);
      throw new Error('Failed to register client');
    }
  }

  static async registerProvider(data: ProviderRegistrationData): Promise<string> {
    try {
      const userId = `provider_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const userProfile: UserProfile = {
        id: userId,
        type: 'provider',
        status: 'pending',
        registrationData: data,
        createdAt: new Date(),
        updatedAt: new Date(),
        rating: 0,
      };

      await setDoc(doc(db, USERS_COLLECTION, userId), {
        ...userProfile,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      if (data.referralCode) {
        await this.createReferral(data.referralCode, userId);
      }

      console.log('Provider registered successfully:', userId);
      return userId;
    } catch (error) {
      console.error('Error registering provider:', error);
      throw new Error('Failed to register provider');
    }
  }

  static async registerKommuter(data: KommuterRegistrationData): Promise<string> {
    try {
      const userId = `kommuter_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const userProfile: UserProfile = {
        id: userId,
        type: 'kommuter',
        status: 'pending',
        registrationData: data,
        createdAt: new Date(),
        updatedAt: new Date(),
        tripsCompleted: 0,
        rating: 0,
        backgroundCheckRequired: false,
        backgroundCheckCompleted: false,
      };

      await setDoc(doc(db, USERS_COLLECTION, userId), {
        ...userProfile,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      if (data.referralCode) {
        await this.createReferral(data.referralCode, userId);
      }

      console.log('Kommuter registered successfully:', userId);
      return userId;
    } catch (error) {
      console.error('Error registering kommuter:', error);
      throw new Error('Failed to register kommuter');
    }
  }

  static async createReferral(referralCode: string, referredId: string): Promise<void> {
    try {
      const referrerQuery = query(
        collection(db, USERS_COLLECTION),
        where('referralCode', '==', referralCode)
      );
      
      const referrerSnapshot = await getDocs(referrerQuery);
      
      if (referrerSnapshot.empty) {
        console.warn('Invalid referral code:', referralCode);
        return;
      }

      const referrerId = referrerSnapshot.docs[0].id;
      const referralId = `ref_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const referralData: SimpleReferralData = {
        referrerId,
        referredId,
        referralCode,
        status: 'active',
        referredTripsCompleted: 0,
        referrerRewardPaid: false,
        referredRewardPaid: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await setDoc(doc(db, REFERRALS_COLLECTION, referralId), {
        ...referralData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      console.log('Referral created successfully:', referralId);
    } catch (error) {
      console.error('Error creating referral:', error);
    }
  }

  static async updateTripCount(userId: string): Promise<void> {
    try {
      const userRef = doc(db, USERS_COLLECTION, userId);
      await updateDoc(userRef, {
        tripsCompleted: increment(1),
        updatedAt: serverTimestamp(),
      });

      const userDoc = await getDoc(userRef);
      const userData = userDoc.data() as UserProfile;

      if (userData.tripsCompleted === 20 && userData.type === 'kommuter') {
        await updateDoc(userRef, {
          backgroundCheckRequired: true,
        });
      }

      await this.checkReferralRewards(userId, userData.tripsCompleted || 0);
    } catch (error) {
      console.error('Error updating trip count:', error);
    }
  }

  static async checkReferralRewards(userId: string, tripsCompleted: number): Promise<void> {
    try {
      const referralQuery = query(
        collection(db, REFERRALS_COLLECTION),
        where('referredId', '==', userId),
        where('status', '==', 'active')
      );

      const referralSnapshot = await getDocs(referralQuery);

      if (referralSnapshot.empty) return;

      const referralDoc = referralSnapshot.docs[0];
      const referralData = referralDoc.data() as SimpleReferralData;

      if (tripsCompleted >= 20 && !referralData.referrerRewardPaid) {
        await updateDoc(doc(db, REFERRALS_COLLECTION, referralDoc.id), {
          referrerRewardPaid: true,
          updatedAt: serverTimestamp(),
        });
        console.log('Referrer reward unlocked for:', referralData.referrerId);
      }

      if (tripsCompleted >= 25 && !referralData.referredRewardPaid) {
        await updateDoc(doc(db, REFERRALS_COLLECTION, referralDoc.id), {
          referredRewardPaid: true,
          status: 'completed',
          updatedAt: serverTimestamp(),
        });
        console.log('Referred reward unlocked for:', userId);
      }
    } catch (error) {
      console.error('Error checking referral rewards:', error);
    }
  }

  static async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      const userDoc = await getDoc(doc(db, USERS_COLLECTION, userId));
      if (!userDoc.exists()) return null;
      return userDoc.data() as UserProfile;
    } catch (error) {
      console.error('Error getting user profile:', error);
      return null;
    }
  }

  static async generateReferralCode(userId: string): Promise<string> {
    const code = `REF${userId.slice(-6).toUpperCase()}`;
    try {
      await updateDoc(doc(db, USERS_COLLECTION, userId), {
        referralCode: code,
        updatedAt: serverTimestamp(),
      });
      return code;
    } catch (error) {
      console.error('Error generating referral code:', error);
      throw error;
    }
  }

  static async upgradeClientToProvider(userId: string, providerData: ProviderRegistrationData): Promise<void> {
    try {
      const userRef = doc(db, USERS_COLLECTION, userId);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        throw new Error('User not found');
      }

      const userData = userDoc.data() as UserProfile;
      
      if (userData.type !== 'client') {
        throw new Error('Only clients can upgrade to provider');
      }

      const providerUserId = `provider_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const providerProfile: UserProfile = {
        id: providerUserId,
        type: 'provider',
        status: 'pending',
        registrationData: providerData,
        createdAt: new Date(),
        updatedAt: new Date(),
        rating: 0,
      };

      await setDoc(doc(db, USERS_COLLECTION, providerUserId), {
        ...providerProfile,
        originalClientId: userId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      await updateDoc(userRef, {
        providerAccountId: providerUserId,
        updatedAt: serverTimestamp(),
      });

      console.log('Client upgraded to provider successfully:', providerUserId);
    } catch (error) {
      console.error('Error upgrading client to provider:', error);
      throw new Error('Failed to upgrade account to provider');
    }
  }
}

export default RegistrationService;
