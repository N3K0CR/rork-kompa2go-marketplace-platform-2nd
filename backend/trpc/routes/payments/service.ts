import { PaymentTransaction, PaymentStatus, CreatePaymentRequest } from './types';
import { getCountryConfig, calculateFees } from './countries';

// In-memory storage (replace with database in production)
let payments: PaymentTransaction[] = [];
let paymentCounter = 1;

export class PaymentService {
  // Create a new payment
  static async createPayment(
    userId: string,
    request: CreatePaymentRequest,
    countryCode: string = 'CR'
  ): Promise<PaymentTransaction> {
    console.log('🔄 Creating payment:', { userId, request, countryCode });
    
    const config = getCountryConfig(countryCode);
    if (!config) {
      throw new Error(`Country ${countryCode} not supported`);
    }

    if (!config.supportedMethods.includes(request.paymentMethod)) {
      throw new Error(`Payment method ${request.paymentMethod} not supported in ${config.name}`);
    }

    // Calculate fees and taxes
    const fees = calculateFees(request.amount, request.paymentMethod, countryCode);
    
    // Check transaction limits
    if (config.regulations.maxTransactionAmount && 
        fees.totalAmount > config.regulations.maxTransactionAmount) {
      throw new Error(`Transaction amount exceeds limit of ${config.symbol}${config.regulations.maxTransactionAmount}`);
    }

    const now = new Date();
    const payment: PaymentTransaction = {
      id: `pay_${countryCode.toLowerCase()}_${Date.now()}_${paymentCounter++}`,
      userId,
      amount: request.amount,
      currency: config.currency,
      paymentMethod: request.paymentMethod,
      status: 'pending',
      countryCode,
      description: request.description,
      metadata: request.metadata,
      proofImage: request.proofImage,
      verificationStatus: 'pending',
      createdAt: now,
      updatedAt: now,
      processingFee: fees.processingFee,
      taxAmount: fees.taxAmount,
      totalAmount: fees.totalAmount,
      planId: request.planId,
      bookingId: request.bookingId,
    };

    payments.push(payment);
    console.log('✅ Payment created:', payment.id);
    
    // Auto-process certain payment methods
    if (['sinpe', 'kash'].includes(request.paymentMethod) && request.proofImage) {
      payment.status = 'processing';
      payment.verificationStatus = 'pending';
      console.log('📋 Payment requires manual verification:', payment.id);
    }

    return payment;
  }

  // Get payment by ID
  static async getPayment(paymentId: string): Promise<PaymentTransaction | null> {
    return payments.find(p => p.id === paymentId) || null;
  }

  // Get payments by user
  static async getUserPayments(
    userId: string,
    status?: PaymentStatus,
    limit: number = 20,
    offset: number = 0
  ): Promise<PaymentTransaction[]> {
    let userPayments = payments.filter(p => p.userId === userId);
    
    if (status) {
      userPayments = userPayments.filter(p => p.status === status);
    }
    
    return userPayments
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(offset, offset + limit);
  }

  // Get all payments (admin)
  static async getAllPayments(
    status?: PaymentStatus,
    countryCode?: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<PaymentTransaction[]> {
    let filteredPayments = [...payments];
    
    if (status) {
      filteredPayments = filteredPayments.filter(p => p.status === status);
    }
    
    if (countryCode) {
      filteredPayments = filteredPayments.filter(p => p.countryCode === countryCode);
    }
    
    return filteredPayments
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(offset, offset + limit);
  }

  // Update payment status
  static async updatePaymentStatus(
    paymentId: string,
    status: PaymentStatus,
    adminUserId?: string,
    adminNotes?: string,
    externalId?: string
  ): Promise<PaymentTransaction> {
    console.log('🔄 Updating payment status:', { paymentId, status, adminUserId });
    
    const payment = payments.find(p => p.id === paymentId);
    if (!payment) {
      throw new Error('Payment not found');
    }

    const now = new Date();
    payment.status = status;
    payment.updatedAt = now;
    payment.processedBy = adminUserId;
    payment.adminNotes = adminNotes;
    payment.externalId = externalId;

    if (status === 'completed') {
      payment.completedAt = now;
      payment.verificationStatus = 'verified';
      console.log('✅ Payment completed:', paymentId);
    } else if (status === 'failed' || status === 'cancelled') {
      payment.verificationStatus = 'rejected';
      console.log('❌ Payment rejected:', paymentId);
    }

    return payment;
  }

  // Get payment statistics
  static async getPaymentStats(countryCode?: string): Promise<{
    total: number;
    pending: number;
    completed: number;
    failed: number;
    totalAmount: number;
    completedAmount: number;
  }> {
    let filteredPayments = payments;
    
    if (countryCode) {
      filteredPayments = payments.filter(p => p.countryCode === countryCode);
    }

    const stats = {
      total: filteredPayments.length,
      pending: filteredPayments.filter(p => p.status === 'pending').length,
      completed: filteredPayments.filter(p => p.status === 'completed').length,
      failed: filteredPayments.filter(p => ['failed', 'cancelled'].includes(p.status)).length,
      totalAmount: filteredPayments.reduce((sum, p) => sum + p.totalAmount, 0),
      completedAmount: filteredPayments
        .filter(p => p.status === 'completed')
        .reduce((sum, p) => sum + p.totalAmount, 0),
    };

    return stats;
  }

  // Process webhook (for external payment processors)
  static async processWebhook(
    paymentId: string,
    externalStatus: string,
    externalId: string,
    metadata?: Record<string, any>
  ): Promise<PaymentTransaction> {
    console.log('🔔 Processing webhook:', { paymentId, externalStatus, externalId });
    
    const payment = payments.find(p => p.id === paymentId);
    if (!payment) {
      throw new Error('Payment not found');
    }

    // Map external status to internal status
    let internalStatus: PaymentStatus;
    switch (externalStatus.toLowerCase()) {
      case 'succeeded':
      case 'completed':
      case 'paid':
        internalStatus = 'completed';
        break;
      case 'failed':
      case 'declined':
        internalStatus = 'failed';
        break;
      case 'cancelled':
      case 'canceled':
        internalStatus = 'cancelled';
        break;
      case 'refunded':
        internalStatus = 'refunded';
        break;
      default:
        internalStatus = 'processing';
    }

    return this.updatePaymentStatus(
      paymentId,
      internalStatus,
      'system',
      `Webhook update: ${externalStatus}`,
      externalId
    );
  }

  // Refund payment
  static async refundPayment(
    paymentId: string,
    adminUserId: string,
    reason?: string
  ): Promise<PaymentTransaction> {
    console.log('💰 Processing refund:', { paymentId, adminUserId, reason });
    
    const payment = payments.find(p => p.id === paymentId);
    if (!payment) {
      throw new Error('Payment not found');
    }

    if (payment.status !== 'completed') {
      throw new Error('Can only refund completed payments');
    }

    return this.updatePaymentStatus(
      paymentId,
      'refunded',
      adminUserId,
      reason ? `Refund reason: ${reason}` : 'Payment refunded'
    );
  }
}