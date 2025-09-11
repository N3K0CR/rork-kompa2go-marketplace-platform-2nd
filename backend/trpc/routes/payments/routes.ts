import { z } from 'zod';
import { publicProcedure, protectedProcedure } from '@/backend/trpc/create-context';
import { 
  CreatePaymentRequestSchema, 
  UpdatePaymentStatusSchema 
} from './types';
import { PaymentService } from './service';
import { getSupportedCountries, getCountryConfig } from './countries';

// Create a new payment
export const createPayment = protectedProcedure
  .input(CreatePaymentRequestSchema.extend({
    countryCode: z.string().length(2).default('CR')
  }))
  .mutation(async ({ input, ctx }) => {
    console.log('📝 Creating payment for user:', ctx.user?.id);
    
    if (!ctx.user) {
      throw new Error('User not authenticated');
    }

    const payment = await PaymentService.createPayment(
      ctx.user.id,
      input,
      input.countryCode
    );

    return {
      success: true,
      payment,
      message: 'Payment created successfully'
    };
  });

// Get payment by ID
export const getPayment = protectedProcedure
  .input(z.object({ paymentId: z.string() }))
  .query(async ({ input, ctx }) => {
    const payment = await PaymentService.getPayment(input.paymentId);
    
    if (!payment) {
      throw new Error('Payment not found');
    }

    // Users can only see their own payments, admins can see all
    if (payment.userId !== ctx.user?.id && ctx.user?.userType !== 'admin') {
      throw new Error('Access denied');
    }

    return payment;
  });

// Get user's payments
export const getUserPayments = protectedProcedure
  .input(z.object({
    status: z.enum(['pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded', 'disputed']).optional(),
    limit: z.number().min(1).max(50).default(20),
    offset: z.number().min(0).default(0)
  }))
  .query(async ({ input, ctx }) => {
    if (!ctx.user) {
      throw new Error('User not authenticated');
    }

    const payments = await PaymentService.getUserPayments(
      ctx.user.id,
      input.status,
      input.limit,
      input.offset
    );

    return payments;
  });

// Get all payments (admin only)
export const getAllPayments = protectedProcedure
  .input(z.object({
    status: z.enum(['pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded', 'disputed']).optional(),
    countryCode: z.string().length(2).optional(),
    limit: z.number().min(1).max(100).default(50),
    offset: z.number().min(0).default(0)
  }))
  .query(async ({ input, ctx }) => {
    if (ctx.user?.userType !== 'admin') {
      throw new Error('Admin access required');
    }

    const payments = await PaymentService.getAllPayments(
      input.status,
      input.countryCode,
      input.limit,
      input.offset
    );

    return payments;
  });

// Update payment status (admin only)
export const updatePaymentStatus = protectedProcedure
  .input(UpdatePaymentStatusSchema)
  .mutation(async ({ input, ctx }) => {
    if (ctx.user?.userType !== 'admin') {
      throw new Error('Admin access required');
    }

    const payment = await PaymentService.updatePaymentStatus(
      input.paymentId,
      input.status,
      ctx.user.id,
      input.adminNotes,
      input.externalId
    );

    return {
      success: true,
      payment,
      message: `Payment ${input.status} successfully`
    };
  });

// Get payment statistics (admin only)
export const getPaymentStats = protectedProcedure
  .input(z.object({
    countryCode: z.string().length(2).optional()
  }))
  .query(async ({ input, ctx }) => {
    if (ctx.user?.userType !== 'admin') {
      throw new Error('Admin access required');
    }

    const stats = await PaymentService.getPaymentStats(input.countryCode);
    return stats;
  });

// Refund payment (admin only)
export const refundPayment = protectedProcedure
  .input(z.object({
    paymentId: z.string(),
    reason: z.string().optional()
  }))
  .mutation(async ({ input, ctx }) => {
    if (ctx.user?.userType !== 'admin') {
      throw new Error('Admin access required');
    }

    const payment = await PaymentService.refundPayment(
      input.paymentId,
      ctx.user.id,
      input.reason
    );

    return {
      success: true,
      payment,
      message: 'Payment refunded successfully'
    };
  });

// Get supported countries and payment methods
export const getSupportedCountriesRoute = publicProcedure
  .query(async () => {
    const countries = getSupportedCountries();
    return countries;
  });

// Get country configuration
export const getCountryConfigRoute = publicProcedure
  .input(z.object({ countryCode: z.string().length(2) }))
  .query(async ({ input }) => {
    const config = getCountryConfig(input.countryCode);
    if (!config) {
      throw new Error(`Country ${input.countryCode} not supported`);
    }
    return config;
  });

// Process webhook (for external payment processors)
export const processWebhook = publicProcedure
  .input(z.object({
    paymentId: z.string(),
    externalStatus: z.string(),
    externalId: z.string(),
    signature: z.string().optional(), // For webhook verification
    metadata: z.record(z.string(), z.any()).optional()
  }))
  .mutation(async ({ input }) => {
    // TODO: Verify webhook signature in production
    console.log('🔔 Webhook received:', input);
    
    const payment = await PaymentService.processWebhook(
      input.paymentId,
      input.externalStatus,
      input.externalId,
      input.metadata
    );

    return {
      success: true,
      payment,
      message: 'Webhook processed successfully'
    };
  });