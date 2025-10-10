import { useState, useEffect, useCallback, useMemo } from 'react';
import createContextHook from '@nkzw/create-context-hook';
import { ratingService } from '@/src/modules/ratings/services/rating-service';
import { Rating, RatingStats, RatingPrompt } from '@/src/shared/types';
import { useFirebaseAuth } from './FirebaseAuthContext';

export const [RatingContext, useRating] = createContextHook(() => {
  const { user } = useFirebaseAuth();
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [stats, setStats] = useState<RatingStats | null>(null);
  const [pendingPrompts, setPendingPrompts] = useState<RatingPrompt[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const loadUserRatings = useCallback(async () => {
    if (!user?.uid) return;
    try {
      setLoading(true);
      const received = await ratingService.getUserRatings(user.uid, 'received');
      setRatings(received);
    } catch (error) {
      console.error('Error loading user ratings:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.uid]);

  const loadRatingStats = useCallback(async () => {
    if (!user?.uid) return;
    try {
      const userStats = await ratingService.getRatingStats(user.uid);
      setStats(userStats);
    } catch (error) {
      console.error('Error loading rating stats:', error);
    }
  }, [user?.uid]);

  const loadPendingPrompts = useCallback(async () => {
    if (!user?.uid) return;
    try {
      const prompts = await ratingService.getPendingRatingPrompts(user.uid);
      setPendingPrompts(prompts);
    } catch (error) {
      console.error('Error loading pending prompts:', error);
    }
  }, [user?.uid]);

  useEffect(() => {
    if (user?.uid) {
      loadUserRatings();
      loadRatingStats();
      loadPendingPrompts();
    }
  }, [user?.uid, loadUserRatings, loadRatingStats, loadPendingPrompts]);

  const createRating = useCallback(async (
    ratingData: Omit<Rating, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<string> => {
    try {
      setLoading(true);
      const ratingId = await ratingService.createRating(ratingData);
      await loadUserRatings();
      await loadRatingStats();
      return ratingId;
    } catch (error) {
      console.error('Error creating rating:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [loadUserRatings, loadRatingStats]);

  const respondToRating = useCallback(async (ratingId: string, response: string): Promise<void> => {
    try {
      setLoading(true);
      await ratingService.respondToRating(ratingId, response);
      await loadUserRatings();
    } catch (error) {
      console.error('Error responding to rating:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [loadUserRatings]);

  const markHelpful = useCallback(async (ratingId: string): Promise<void> => {
    try {
      await ratingService.markHelpful(ratingId);
      await loadUserRatings();
    } catch (error) {
      console.error('Error marking rating helpful:', error);
      throw error;
    }
  }, [loadUserRatings]);

  const reportRating = useCallback(async (ratingId: string): Promise<void> => {
    try {
      await ratingService.reportRating(ratingId);
      await loadUserRatings();
    } catch (error) {
      console.error('Error reporting rating:', error);
      throw error;
    }
  }, [loadUserRatings]);

  const completePrompt = useCallback(async (promptId: string): Promise<void> => {
    try {
      await ratingService.completeRatingPrompt(promptId);
      await loadPendingPrompts();
    } catch (error) {
      console.error('Error completing prompt:', error);
      throw error;
    }
  }, [loadPendingPrompts]);

  const dismissPrompt = useCallback(async (promptId: string): Promise<void> => {
    try {
      await ratingService.dismissRatingPrompt(promptId);
      await loadPendingPrompts();
    } catch (error) {
      console.error('Error dismissing prompt:', error);
      throw error;
    }
  }, [loadPendingPrompts]);

  return useMemo(() => ({
    ratings,
    stats,
    pendingPrompts,
    loading,
    createRating,
    respondToRating,
    markHelpful,
    reportRating,
    completePrompt,
    dismissPrompt,
    refreshRatings: loadUserRatings,
    refreshStats: loadRatingStats,
  }), [ratings, stats, pendingPrompts, loading, createRating, respondToRating, markHelpful, reportRating, completePrompt, dismissPrompt, loadUserRatings, loadRatingStats]);
});
