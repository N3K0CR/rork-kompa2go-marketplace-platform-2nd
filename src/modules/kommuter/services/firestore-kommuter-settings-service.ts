import { db } from '@/lib/firebase';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  Timestamp,
  addDoc
} from 'firebase/firestore';

export interface Promotion {
  id: string;
  title: string;
  description: string;
  discount: number;
  validUntil: Date;
  active: boolean;
  type: 'percentage' | 'fixed';
  createdAt: Date;
  updatedAt: Date;
}

export interface BrandCollaboration {
  id: string;
  brandName: string;
  description: string;
  benefit: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const PROMOTIONS_COLLECTION = 'kommuter_promotions';
const COLLABORATIONS_COLLECTION = 'brand_collaborations';

export const firestoreKommuterSettingsService = {
  async getPromotions(): Promise<Promotion[]> {
    try {
      console.log('[KommuterSettings] Loading promotions from Firestore');
      const q = query(
        collection(db, PROMOTIONS_COLLECTION),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      
      const promotions = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          title: data.title,
          description: data.description,
          discount: data.discount,
          validUntil: data.validUntil?.toDate() || new Date(),
          active: data.active,
          type: data.type,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        } as Promotion;
      });
      
      console.log(`[KommuterSettings] Loaded ${promotions.length} promotions`);
      return promotions;
    } catch (error) {
      console.error('[KommuterSettings] Error loading promotions:', error);
      throw error;
    }
  },

  async getPromotion(promotionId: string): Promise<Promotion | null> {
    try {
      const docRef = doc(db, PROMOTIONS_COLLECTION, promotionId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        return null;
      }
      
      const data = docSnap.data();
      return {
        id: docSnap.id,
        title: data.title,
        description: data.description,
        discount: data.discount,
        validUntil: data.validUntil?.toDate() || new Date(),
        active: data.active,
        type: data.type,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as Promotion;
    } catch (error) {
      console.error('[KommuterSettings] Error loading promotion:', error);
      throw error;
    }
  },

  async createPromotion(promotion: Omit<Promotion, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      console.log('[KommuterSettings] Creating promotion:', promotion.title);
      const now = Timestamp.now();
      
      const docRef = await addDoc(collection(db, PROMOTIONS_COLLECTION), {
        ...promotion,
        validUntil: Timestamp.fromDate(promotion.validUntil),
        createdAt: now,
        updatedAt: now,
      });
      
      console.log('[KommuterSettings] Promotion created with ID:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('[KommuterSettings] Error creating promotion:', error);
      throw error;
    }
  },

  async updatePromotion(promotionId: string, updates: Partial<Omit<Promotion, 'id' | 'createdAt' | 'updatedAt'>>): Promise<void> {
    try {
      console.log('[KommuterSettings] Updating promotion:', promotionId);
      const docRef = doc(db, PROMOTIONS_COLLECTION, promotionId);
      
      const updateData: any = {
        ...updates,
        updatedAt: Timestamp.now(),
      };
      
      if (updates.validUntil) {
        updateData.validUntil = Timestamp.fromDate(updates.validUntil);
      }
      
      await updateDoc(docRef, updateData);
      console.log('[KommuterSettings] Promotion updated successfully');
    } catch (error) {
      console.error('[KommuterSettings] Error updating promotion:', error);
      throw error;
    }
  },

  async deletePromotion(promotionId: string): Promise<void> {
    try {
      console.log('[KommuterSettings] Deleting promotion:', promotionId);
      await deleteDoc(doc(db, PROMOTIONS_COLLECTION, promotionId));
      console.log('[KommuterSettings] Promotion deleted successfully');
    } catch (error) {
      console.error('[KommuterSettings] Error deleting promotion:', error);
      throw error;
    }
  },

  async togglePromotionActive(promotionId: string, active: boolean): Promise<void> {
    try {
      console.log('[KommuterSettings] Toggling promotion active:', promotionId, active);
      await this.updatePromotion(promotionId, { active });
    } catch (error) {
      console.error('[KommuterSettings] Error toggling promotion:', error);
      throw error;
    }
  },

  async getCollaborations(): Promise<BrandCollaboration[]> {
    try {
      console.log('[KommuterSettings] Loading collaborations from Firestore');
      const q = query(
        collection(db, COLLABORATIONS_COLLECTION),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      
      const collaborations = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          brandName: data.brandName,
          description: data.description,
          benefit: data.benefit,
          active: data.active,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        } as BrandCollaboration;
      });
      
      console.log(`[KommuterSettings] Loaded ${collaborations.length} collaborations`);
      return collaborations;
    } catch (error) {
      console.error('[KommuterSettings] Error loading collaborations:', error);
      throw error;
    }
  },

  async getCollaboration(collaborationId: string): Promise<BrandCollaboration | null> {
    try {
      const docRef = doc(db, COLLABORATIONS_COLLECTION, collaborationId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        return null;
      }
      
      const data = docSnap.data();
      return {
        id: docSnap.id,
        brandName: data.brandName,
        description: data.description,
        benefit: data.benefit,
        active: data.active,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as BrandCollaboration;
    } catch (error) {
      console.error('[KommuterSettings] Error loading collaboration:', error);
      throw error;
    }
  },

  async createCollaboration(collaboration: Omit<BrandCollaboration, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      console.log('[KommuterSettings] Creating collaboration:', collaboration.brandName);
      const now = Timestamp.now();
      
      const docRef = await addDoc(collection(db, COLLABORATIONS_COLLECTION), {
        ...collaboration,
        createdAt: now,
        updatedAt: now,
      });
      
      console.log('[KommuterSettings] Collaboration created with ID:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('[KommuterSettings] Error creating collaboration:', error);
      throw error;
    }
  },

  async updateCollaboration(collaborationId: string, updates: Partial<Omit<BrandCollaboration, 'id' | 'createdAt' | 'updatedAt'>>): Promise<void> {
    try {
      console.log('[KommuterSettings] Updating collaboration:', collaborationId);
      const docRef = doc(db, COLLABORATIONS_COLLECTION, collaborationId);
      
      await updateDoc(docRef, {
        ...updates,
        updatedAt: Timestamp.now(),
      });
      
      console.log('[KommuterSettings] Collaboration updated successfully');
    } catch (error) {
      console.error('[KommuterSettings] Error updating collaboration:', error);
      throw error;
    }
  },

  async deleteCollaboration(collaborationId: string): Promise<void> {
    try {
      console.log('[KommuterSettings] Deleting collaboration:', collaborationId);
      await deleteDoc(doc(db, COLLABORATIONS_COLLECTION, collaborationId));
      console.log('[KommuterSettings] Collaboration deleted successfully');
    } catch (error) {
      console.error('[KommuterSettings] Error deleting collaboration:', error);
      throw error;
    }
  },

  async toggleCollaborationActive(collaborationId: string, active: boolean): Promise<void> {
    try {
      console.log('[KommuterSettings] Toggling collaboration active:', collaborationId, active);
      await this.updateCollaboration(collaborationId, { active });
    } catch (error) {
      console.error('[KommuterSettings] Error toggling collaboration:', error);
      throw error;
    }
  },
};
