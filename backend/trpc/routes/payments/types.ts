import { z } from 'zod';

// Payment Method Types
export const PaymentMethodSchema = z.enum(['sinpe', 'kash', 'card', 'bank_transfer', 'paypal', 'stripe']);

// Country Configuration
export const CountryConfigSchema = z.object({
  code: z.string().length(2), // ISO 3166-1 alpha-2
  name: z.string(),
  currency: z.string().length(3), // ISO 4217
  symbol: z.string(),
  supportedMethods: z.array(PaymentMethodSchema),
  taxRate: z.number().min(0).max(1),
  processingFees: z.record(PaymentMethodSchema, z.number()),
  regulations: z.object({
    requiresKYC: z.boolean(),
    maxTransactionAmount: z.number().optional(),
    requiresTaxId: z.boolean(),
  })
});

// Payment Status
export const PaymentStatusSchema = z.enum([
  'pending',
  'processing', 
  'completed',
  'failed',
  'cancelled',
  'refunded',
  'disputed'
]);

// Payment Transaction
export const PaymentTransactionSchema = z.object({
  id: z.string(),
  userId: z.string(),
  amount: z.number().positive(),
  currency: z.string().length(3),
  paymentMethod: PaymentMethodSchema,
  status: PaymentStatusSchema,
  countryCode: z.string().length(2),
  
  // Transaction details
  description: z.string(),
  reference: z.string().optional(),
  externalId: z.string().optional(), // Payment processor ID
  
  // Metadata
  metadata: z.record(z.string(), z.any()).optional(),
  
  // Proof and verification
  proofImage: z.string().optional(),
  verificationStatus: z.enum(['pending', 'verified', 'rejected']).optional().default('pending'),
  
  // Timestamps
  createdAt: z.date(),
  updatedAt: z.date(),
  completedAt: z.date().optional(),
  
  // Fees and taxes
  processingFee: z.number().optional().default(0),
  taxAmount: z.number().optional().default(0),
  totalAmount: z.number(), // amount + fees + taxes
  
  // Related entities
  planId: z.string().optional(),
  bookingId: z.string().optional(),
  
  // Admin notes
  adminNotes: z.string().optional(),
  processedBy: z.string().optional(),
});

// Payment Request
export const CreatePaymentRequestSchema = z.object({
  amount: z.number().positive(),
  paymentMethod: PaymentMethodSchema,
  description: z.string().min(1).max(500),
  planId: z.string().optional(),
  bookingId: z.string().optional(),
  proofImage: z.string().optional(),
  metadata: z.record(z.string(), z.any()).optional(),
});

// Payment Update
export const UpdatePaymentStatusSchema = z.object({
  paymentId: z.string(),
  status: PaymentStatusSchema,
  adminNotes: z.string().optional(),
  externalId: z.string().optional(),
});

// Payment Query
export const PaymentQuerySchema = z.object({
  userId: z.string().optional(),
  status: PaymentStatusSchema.optional(),
  paymentMethod: PaymentMethodSchema.optional(),
  countryCode: z.string().length(2).optional(),
  dateFrom: z.date().optional(),
  dateTo: z.date().optional(),
  limit: z.number().min(1).max(100).default(20),
  offset: z.number().min(0).default(0),
});

export type PaymentMethod = z.infer<typeof PaymentMethodSchema>;
export type CountryConfig = z.infer<typeof CountryConfigSchema>;
export type PaymentStatus = z.infer<typeof PaymentStatusSchema>;
export type PaymentTransaction = z.infer<typeof PaymentTransactionSchema>;
export type CreatePaymentRequest = z.infer<typeof CreatePaymentRequestSchema>;
export type UpdatePaymentStatus = z.infer<typeof UpdatePaymentStatusSchema>;
export type PaymentQuery = z.infer<typeof PaymentQuerySchema>;