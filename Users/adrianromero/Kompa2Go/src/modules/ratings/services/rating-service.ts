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
  limit,
  Timestamp,
  runTransaction,
} from 'firebase/firestore';
import { Rating, RatingStats, RatingPrompt } from '@/src/shared/types';

const RATINGS_COLLECTION = 'ratings';
const RATING_STATS_COLLECTION = 'ratingStats';
const RATING_PROMPTS_COLLECTION = 'ratingPrompts';

export class RatingService {
  async createRating(ratingData: Omit<Rating, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const now = Timestamp.now();
      const docRef = await addDoc(collection(db, RATINGS_COLLECTION), {
        ...ratingData,
        createdAt: now,
        updatedAt: now,
      });

      await this.updateRatingStats(ratingData.toUserId, ratingData.toUserRole);

      return docRef.id;
    } catch (error) {
      console.error('Error creating rating:', error);
      throw error;
    }
  }

  async getRating(ratingId: string): Promise<Rating | null> {
    try {
      const docRef = doc(db, RATINGS_COLLECTION, ratingId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return null;
      }

      return {
        id: docSnap.id,
        ...docSnap.data(),
        createdAt: docSnap.data().createdAt?.toDate(),
        updatedAt: docSnap.data().updatedAt?.toDate(),
        response: docSnap.data().response
          ? {
              ...docSnap.data().response,
              createdAt: docSnap.data().response.createdAt?.toDate(),
            }
          : undefined,
      } as Rating;
    } catch (error) {
      console.error('Error getting rating:', error);
      throw error;
    }
  }

  async getUserRatings(userId: string, role: 'received' | 'given'): Promise<Rating[]> {
    try {
      const field = role === 'received' ? 'toUserId' : 'fromUserId';
      const q = query(
        collection(db, RATINGS_COLLECTION),
        where(field, '==', userId),
        where('status', '==', 'published'),
        orderBy('createdAt', 'desc'),
        limit(50)
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
        response: doc.data().response
          ? {
              ...doc.data().response,
              createdAt: doc.data().response.createdAt?.toDate(),
            }
          : undefined,
      })) as Rating[];
    } catch (error) {
      console.error('Error getting user ratings:', error);
      throw error;
    }
  }

  async getRatingStats(userId: string): Promise<RatingStats | null> {
    try {
      const docRef = doc(db, RATING_STATS_COLLECTION, userId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return null;
      }

      return {
        ...docSnap.data(),
        lastUpdated: docSnap.data().lastUpdated?.toDate(),
      } as RatingStats;
    } catch (error) {
      console.error('Error getting rating stats:', error);
      throw error;
    }
  }

  async updateRatingStats(userId: string, userRole: 'kommuter' | 'provider'): Promise<void> {
    try {
      const ratings = await this.getUserRatings(userId, 'received');

      if (ratings.length === 0) {
        return;
      }

      const totalRatings = ratings.length;
      const sumRatings = ratings.reduce((sum, r) => sum + r.rating, 0);
      const averageRating = sumRatings / totalRatings;

      const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      ratings.forEach((r) => {
        distribution[r.rating as keyof typeof distribution]++;
      });

      const categoryAverages: any = {};
      const categoryKeys = ['punctuality', 'communication', 'cleanliness', 'professionalism', 'quality'];

      categoryKeys.forEach((key) => {
        const ratingsWithCategory = ratings.filter((r) => r.categories?.[key as keyof typeof r.categories]);
        if (ratingsWithCategory.length > 0) {
          const sum = ratingsWithCategory.reduce(
            (s, r) => s + (r.categories?.[key as keyof typeof r.categories] || 0),
            0
          );
          categoryAverages[key] = sum / ratingsWithCategory.length;
        }
      });

      const statsData: Omit<RatingStats, 'lastUpdated'> = {
        userId,
        userRole,
        averageRating,
        totalRatings,
        ratingDistribution: distribution,
        categoryAverages: Object.keys(categoryAverages).length > 0 ? categoryAverages : undefined,
      };

      const docRef = doc(db, RATING_STATS_COLLECTION, userId);
      await updateDoc(docRef, {
        ...statsData,
        lastUpdated: Timestamp.now(),
      }).catch(async () => {
        await addDoc(collection(db, RATING_STATS_COLLECTION), {
          ...statsData,
          lastUpdated: Timestamp.now(),
        });
      });
    } catch (error) {
      console.error('Error updating rating stats:', error);
      throw error;
    }
  }

  async respondToRating(ratingId: string, response: string): Promise<void> {
    try {
      const docRef = doc(db, RATINGS_COLLECTION, ratingId);
      await updateDoc(docRef, {
        response: {
          comment: response,
          createdAt: Timestamp.now(),
        },
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error('Error responding to rating:', error);
      throw error;
    }
  }

  async markHelpful(ratingId: string): Promise<void> {
    try {
      const docRef = doc(db, RATINGS_COLLECTION, ratingId);
      await runTransaction(db, async (transaction) => {
        const ratingDoc = await transaction.get(docRef);
        if (!ratingDoc.exists()) {
          throw new Error('Rating not found');
        }

        const currentHelpful = ratingDoc.data().helpful || 0;
        transaction.update(docRef, {
          helpful: currentHelpful + 1,
          updatedAt: Timestamp.now(),
        });
      });
    } catch (error) {
      console.error('Error marking rating as helpful:', error);
      throw error;
    }
  }

  async reportRating(ratingId: string): Promise<void> {
    try {
      const docRef = doc(db, RATINGS_COLLECTION, ratingId);
      await updateDoc(docRef, {
        reported: true,
        status: 'flagged',
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error('Error reporting rating:', error);
      throw error;
    }
  }

  async createRatingPrompt(
    promptData: Omit<RatingPrompt, 'id' | 'createdAt' | 'expiresAt'>
  ): Promise<string> {
    try {
      const now = Timestamp.now();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      const docRef = await addDoc(collection(db, RATING_PROMPTS_COLLECTION), {
        ...promptData,
        createdAt: now,
        expiresAt: Timestamp.fromDate(expiresAt),
      });

      return docRef.id;
    } catch (error) {
      console.error('Error creating rating prompt:', error);
      throw error;
    }
  }

  async getPendingRatingPrompts(userId: string): Promise<RatingPrompt[]> {
    try {
      const q = query(
        collection(db, RATING_PROMPTS_COLLECTION),
        where('userId', '==', userId),
        where('status', '==', 'pending'),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        expiresAt: doc.data().expiresAt?.toDate(),
        completedAt: doc.data().completedAt?.toDate(),
      })) as RatingPrompt[];
    } catch (error) {
      console.error('Error getting pending rating prompts:', error);
      throw error;
    }
  }

  async completeRatingPrompt(promptId: string): Promise<void> {
    try {
      const docRef = doc(db, RATING_PROMPTS_COLLECTION, promptId);
      await updateDoc(docRef, {
        status: 'completed',
        completedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error('Error completing rating prompt:', error);
      throw error;
    }
  }

  async dismissRatingPrompt(promptId: string): Promise<void> {
    try {
      const docRef = doc(db, RATING_PROMPTS_COLLECTION, promptId);
      await updateDoc(docRef, {
        status: 'dismissed',
      });
    } catch (error) {
      console.error('Error dismissing rating prompt:', error);
      throw error;
    }
  }
}

export const ratingService = new RatingService();
