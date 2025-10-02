import { z } from 'zod';
import { publicProcedure, protectedProcedure, createTRPCRouter } from '../../create-context';
import { registrationFirestoreService } from '@/src/modules/registration/services/firestore-registration-service';
import type { 
  ClientProfile,
  ProviderProfile,
  KommuterProfile,
  Referral,
  AccessibilityPreferences
} from '@/src/shared/types/registration-types';

const accessibilityPreferencesSchema = z.object({
  hasAccessibilityNeeds: z.boolean(),
  needs: z.array(z.enum(['blind', 'low_vision', 'reading_difficulty', 'hearing_impaired', 'motor_disability', 'other'])),
  otherNeedDescription: z.string().optional(),
  ttsEnabled: z.boolean(),
  ttsAutoPlay: z.boolean(),
  ttsSpeed: z.enum(['slow', 'normal', 'fast']),
  chatTTSEnabled: z.boolean(),
  chatAutoPlay: z.boolean(),
  chatOnlyNoCall: z.boolean(),
  descriptionLevel: z.enum(['basic', 'intermediate', 'complete']),
  navigationMode: z.enum(['visual', 'audible', 'combined']),
  highContrast: z.boolean(),
  largeText: z.boolean(),
  hapticFeedback: z.boolean(),
});

export const registrationRouter = createTRPCRouter({
  registerClient: publicProcedure
    .input(z.object({
      email: z.string().email(),
      password: z.string().min(6),
      phoneNumber: z.string(),
      fullName: z.string(),
      dateOfBirth: z.date().optional(),
      address: z.string().optional(),
      emergencyContact: z.object({
        name: z.string(),
        phoneNumber: z.string(),
        relationship: z.string(),
      }).optional(),
      accessibilityPreferences: accessibilityPreferencesSchema.optional(),
      referralCode: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const userId = `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const referralCode = `REF${userId.substr(-8).toUpperCase()}`;
      
      const defaultAccessibility: AccessibilityPreferences = {
        hasAccessibilityNeeds: false,
        needs: [],
        ttsEnabled: false,
        ttsAutoPlay: false,
        ttsSpeed: 'normal',
        chatTTSEnabled: false,
        chatAutoPlay: false,
        chatOnlyNoCall: false,
        descriptionLevel: 'intermediate',
        navigationMode: 'visual',
        highContrast: false,
        largeText: false,
        hapticFeedback: true,
      };

      const profile: ClientProfile = {
        id: userId,
        email: input.email,
        phoneNumber: input.phoneNumber,
        fullName: input.fullName,
        role: 'client',
        dateOfBirth: input.dateOfBirth,
        address: input.address,
        emergencyContact: input.emergencyContact,
        accessibilityPreferences: input.accessibilityPreferences || defaultAccessibility,
        referralCode,
        referredBy: input.referralCode,
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true,
        isVerified: false,
      };

      await registrationFirestoreService.clients.create(profile);

      if (input.referralCode) {
        const referrerId = await registrationFirestoreService.referralCodes.getUserByCode(input.referralCode);
        if (referrerId) {
          const referral: Referral = {
            id: `ref_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            referrerId,
            referredUserId: userId,
            referredUserRole: 'client',
            status: 'active',
            referredUserTripsCompleted: 0,
            referrerRewardAmount: 20000,
            referrerRewardPaid: false,
            referredRewardAmount: 10000,
            referredRewardPaid: false,
            createdAt: new Date(),
            updatedAt: new Date(),
            fraudCheckPassed: true,
          };
          await registrationFirestoreService.referrals.create(referral);
        }
      }

      return { success: true, userId, referralCode };
    }),

  registerProvider: publicProcedure
    .input(z.object({
      email: z.string().email(),
      password: z.string().min(6),
      phoneNumber: z.string(),
      fullName: z.string(),
      businessName: z.string(),
      niche: z.enum(['health', 'beauty', 'fitness', 'education', 'professional', 'home_services', 'automotive', 'pet_care', 'events', 'other']),
      nicheSpecificData: z.record(z.string(), z.any()),
      businessAddress: z.string(),
      businessPhone: z.string(),
      businessEmail: z.string(),
      serviceDescription: z.string(),
      serviceAreas: z.array(z.string()),
      accessibilityPreferences: accessibilityPreferencesSchema.optional(),
      referralCode: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const userId = `provider_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const referralCode = `REF${userId.substr(-8).toUpperCase()}`;
      
      const defaultAccessibility: AccessibilityPreferences = {
        hasAccessibilityNeeds: false,
        needs: [],
        ttsEnabled: false,
        ttsAutoPlay: false,
        ttsSpeed: 'normal',
        chatTTSEnabled: false,
        chatAutoPlay: false,
        chatOnlyNoCall: false,
        descriptionLevel: 'intermediate',
        navigationMode: 'visual',
        highContrast: false,
        largeText: false,
        hapticFeedback: true,
      };

      const profile: ProviderProfile = {
        id: userId,
        email: input.email,
        phoneNumber: input.phoneNumber,
        fullName: input.fullName,
        role: 'provider',
        businessName: input.businessName,
        niche: input.niche,
        nicheSpecificData: input.nicheSpecificData,
        businessAddress: input.businessAddress,
        businessPhone: input.businessPhone,
        businessEmail: input.businessEmail,
        serviceDescription: input.serviceDescription,
        serviceAreas: input.serviceAreas,
        rating: 0,
        totalReviews: 0,
        isKommuterEnabled: false,
        accessibilityPreferences: input.accessibilityPreferences || defaultAccessibility,
        referralCode,
        referredBy: input.referralCode,
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true,
        isVerified: false,
      };

      await registrationFirestoreService.providers.create(profile);

      if (input.referralCode) {
        const referrerId = await registrationFirestoreService.referralCodes.getUserByCode(input.referralCode);
        if (referrerId) {
          const referral: Referral = {
            id: `ref_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            referrerId,
            referredUserId: userId,
            referredUserRole: 'provider',
            status: 'active',
            referredUserTripsCompleted: 0,
            referrerRewardAmount: 20000,
            referrerRewardPaid: false,
            referredRewardAmount: 10000,
            referredRewardPaid: false,
            createdAt: new Date(),
            updatedAt: new Date(),
            fraudCheckPassed: true,
          };
          await registrationFirestoreService.referrals.create(referral);
        }
      }

      return { success: true, userId, referralCode };
    }),

  registerKommuter: publicProcedure
    .input(z.object({
      email: z.string().email(),
      password: z.string().min(6),
      phoneNumber: z.string(),
      fullName: z.string(),
      providerId: z.string(),
      licenseNumber: z.string(),
      licenseExpiryDate: z.date(),
      isFleetManager: z.boolean(),
      vehicle: z.object({
        make: z.string(),
        model: z.string(),
        year: z.number(),
        color: z.string(),
        licensePlate: z.string(),
        vehicleType: z.enum(['car', 'suv', 'van', 'motorcycle', 'bicycle', 'other']),
        capacity: z.number(),
        hasAirConditioning: z.boolean(),
        hasWheelchairAccess: z.boolean(),
      }),
      documents: z.object({
        licensePhoto: z.string(),
        idPhoto: z.string(),
        vehicleRegistration: z.string(),
        vehicleInsurance: z.string(),
      }),
      accessibilityPreferences: accessibilityPreferencesSchema.optional(),
      referralCode: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const userId = `kommuter_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const vehicleId = `vehicle_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const referralCode = `REF${userId.substr(-8).toUpperCase()}`;
      
      const defaultAccessibility: AccessibilityPreferences = {
        hasAccessibilityNeeds: false,
        needs: [],
        ttsEnabled: false,
        ttsAutoPlay: false,
        ttsSpeed: 'normal',
        chatTTSEnabled: false,
        chatAutoPlay: false,
        chatOnlyNoCall: false,
        descriptionLevel: 'intermediate',
        navigationMode: 'visual',
        highContrast: false,
        largeText: false,
        hapticFeedback: true,
      };

      const profile: KommuterProfile = {
        id: userId,
        email: input.email,
        phoneNumber: input.phoneNumber,
        fullName: input.fullName,
        role: 'kommuter',
        providerId: input.providerId,
        licenseNumber: input.licenseNumber,
        licenseExpiryDate: input.licenseExpiryDate,
        documents: [
          {
            id: `doc_${Date.now()}_1`,
            type: 'license',
            documentUrl: input.documents.licensePhoto,
            uploadedAt: new Date(),
            isVerified: false,
          },
          {
            id: `doc_${Date.now()}_2`,
            type: 'id',
            documentUrl: input.documents.idPhoto,
            uploadedAt: new Date(),
            isVerified: false,
          },
        ],
        isFleetManager: input.isFleetManager,
        managedVehicles: input.isFleetManager ? [vehicleId] : [],
        assignedDrivers: [],
        primaryVehicleId: vehicleId,
        totalTrips: 0,
        completedTrips: 0,
        cancelledTrips: 0,
        rating: 0,
        totalReviews: 0,
        backgroundCheckRequired: false,
        backgroundCheckCompleted: false,
        isAvailable: true,
        earnings: {
          total: 0,
          pending: 0,
          paid: 0,
        },
        accessibilityPreferences: input.accessibilityPreferences || defaultAccessibility,
        referralCode,
        referredBy: input.referralCode,
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true,
        isVerified: false,
      };

      await registrationFirestoreService.kommuters.create(profile);

      const vehicle = {
        id: vehicleId,
        ...input.vehicle,
        documents: [
          {
            id: `vdoc_${Date.now()}_1`,
            type: 'registration' as const,
            documentUrl: input.documents.vehicleRegistration,
            uploadedAt: new Date(),
          },
          {
            id: `vdoc_${Date.now()}_2`,
            type: 'insurance' as const,
            documentUrl: input.documents.vehicleInsurance,
            uploadedAt: new Date(),
          },
        ],
        assignedDriverId: userId,
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true,
      };

      await registrationFirestoreService.vehicles.create(vehicle);

      if (input.referralCode) {
        const referrerId = await registrationFirestoreService.referralCodes.getUserByCode(input.referralCode);
        if (referrerId) {
          const referral: Referral = {
            id: `ref_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            referrerId,
            referredUserId: userId,
            referredUserRole: 'kommuter',
            status: 'active',
            referredUserTripsCompleted: 0,
            referrerRewardAmount: 20000,
            referrerRewardPaid: false,
            referredRewardAmount: 10000,
            referredRewardPaid: false,
            createdAt: new Date(),
            updatedAt: new Date(),
            fraudCheckPassed: true,
          };
          await registrationFirestoreService.referrals.create(referral);
        }
      }

      return { success: true, userId, vehicleId, referralCode };
    }),

  checkReferralCode: publicProcedure
    .input(z.object({ code: z.string() }))
    .query(async ({ input }) => {
      const userId = await registrationFirestoreService.referralCodes.getUserByCode(input.code);
      return { valid: !!userId, userId };
    }),

  getReferralStats: protectedProcedure
    .query(async ({ ctx }) => {
      const userId = ctx.user?.id;
      if (!userId) throw new Error('Not authenticated');

      const referrals = await registrationFirestoreService.referrals.getByReferrer(userId);
      
      const stats = {
        totalReferrals: referrals.length,
        activeReferrals: referrals.filter(r => r.status === 'active').length,
        completedReferrals: referrals.filter(r => r.status === 'completed').length,
        totalEarned: referrals.reduce((sum, r) => sum + (r.referrerRewardPaid ? r.referrerRewardAmount : 0), 0),
        pendingEarnings: referrals.reduce((sum, r) => sum + (!r.referrerRewardPaid ? r.referrerRewardAmount : 0), 0),
      };

      return stats;
    }),

  processReferralRewards: protectedProcedure
    .input(z.object({ referralId: z.string() }))
    .mutation(async ({ input }) => {
      const referral = await registrationFirestoreService.referrals.get(input.referralId);
      if (!referral) throw new Error('Referral not found');

      const updates: Partial<Referral> = { updatedAt: new Date() };

      if (referral.referredUserTripsCompleted >= 20 && !referral.referrerRewardPaid) {
        updates.referrerRewardPaid = true;
        updates.referrerRewardPaidAt = new Date();
      }

      if (referral.referredUserTripsCompleted >= 25 && !referral.referredRewardPaid) {
        updates.referredRewardPaid = true;
        updates.referredRewardPaidAt = new Date();
      }

      if (referral.referredUserTripsCompleted >= 25 && referral.referrerRewardPaid && referral.referredRewardPaid) {
        updates.status = 'completed';
      }

      await registrationFirestoreService.referrals.update(input.referralId, updates);

      return { success: true, updates };
    }),
});
