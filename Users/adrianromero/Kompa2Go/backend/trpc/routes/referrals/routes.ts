import { z } from 'zod';
import { publicProcedure, protectedProcedure, router } from '../../create-context';
import { ReferralService } from './referral-service';

export const referralRouter = router({
  generateCode: protectedProcedure
    .mutation(async ({ ctx }) => {
      const userId = ctx.user?.id;
      if (!userId) throw new Error('User not authenticated');

      const code = await ReferralService.generateReferralCode(userId);
      return { code };
    }),

  createReferral: protectedProcedure
    .input(
      z.object({
        referralCode: z.string(),
        deviceId: z.string().optional(),
        ipAddress: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const referredId = ctx.user?.id;
      if (!referredId) throw new Error('User not authenticated');

      const referrer = await ctx.db.query.users.findFirst({
        where: (users, { eq }) => eq(users.referralCode, input.referralCode),
      });

      if (!referrer) {
        throw new Error('Invalid referral code');
      }

      const referral = await ReferralService.createReferral(
        referrer.id,
        referredId,
        input.referralCode,
        {
          referredDeviceId: input.deviceId,
          referredIpAddress: input.ipAddress,
        }
      );

      return referral;
    }),

  validateReferral: protectedProcedure
    .input(
      z.object({
        referralCode: z.string(),
        deviceId: z.string().optional(),
        ipAddress: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const referredId = ctx.user?.id;
      if (!referredId) throw new Error('User not authenticated');

      const referrer = await ctx.db.query.users.findFirst({
        where: (users, { eq }) => eq(users.referralCode, input.referralCode),
      });

      if (!referrer) {
        return {
          isValid: false,
          reason: 'Invalid referral code',
          fraudScore: 0,
          checks: {
            uniqueDevice: false,
            uniqueIp: false,
            validTrips: false,
            accountAge: false,
            suspiciousActivity: false,
          },
        };
      }

      const validation = await ReferralService.validateReferral(
        referrer.id,
        referredId,
        {
          referredDeviceId: input.deviceId,
          referredIpAddress: input.ipAddress,
        }
      );

      return validation;
    }),

  updateProgress: protectedProcedure
    .input(
      z.object({
        tripId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user?.id;
      if (!userId) throw new Error('User not authenticated');

      await ReferralService.updateReferralProgress(userId, input.tripId);

      return { success: true };
    }),

  getStats: protectedProcedure
    .query(async ({ ctx }) => {
      const userId = ctx.user?.id;
      if (!userId) throw new Error('User not authenticated');

      const stats = await ReferralService.getReferralStats(userId);
      return stats;
    }),

  getReferralDetails: protectedProcedure
    .input(
      z.object({
        referralId: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.user?.id;
      if (!userId) throw new Error('User not authenticated');

      const referral = await ctx.db.query.referrals.findFirst({
        where: (referrals, { eq, or }) =>
          or(
            eq(referrals.referrerId, userId),
            eq(referrals.referredId, userId)
          ),
      });

      if (!referral) {
        throw new Error('Referral not found');
      }

      return referral;
    }),
});
