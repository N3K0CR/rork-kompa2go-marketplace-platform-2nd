// ============================================================================
// PRICE NEGOTIATION TYPES
// ============================================================================
// Sistema de negociación de tarifas competitivo con Uber

export interface UberPriceComparison {
  id: string;
  userId: string;
  tripId?: string;
  origin: {
    latitude: number;
    longitude: number;
    address: string;
  };
  destination: {
    latitude: number;
    longitude: number;
    address: string;
  };
  distance: number;
  
  // Precios
  kommuteOriginalPrice: number;
  uberReportedPrice: number;
  kommuteNegotiatedPrice: number;
  discountPercentage: number;
  
  // Verificación
  tripNumber: number;
  requiresScreenshot: boolean;
  screenshotUrl?: string;
  screenshotVerified?: boolean;
  screenshotVerifiedAt?: Date;
  
  // Estado
  status: 'pending' | 'active' | 'completed' | 'rejected' | 'fraud_detected';
  fraudReason?: string;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

export interface UserNegotiationProfile {
  userId: string;
  
  // Contadores
  totalNegotiations: number;
  successfulNegotiations: number;
  fraudAttempts: number;
  
  // Estado
  isBlocked: boolean;
  blockReason?: string;
  blockedAt?: Date;
  
  // Límites
  freeNegotiationsRemaining: number;
  requiresScreenshotAfterTrip: number;
  
  // Estadísticas
  averageDiscount: number;
  totalSavings: number;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

export interface PriceNegotiationSettings {
  // Límites generales
  maxDiscountPercentage: number;
  minDiscountPercentage: number;
  freeNegotiationsLimit: number;
  
  // Verificación
  screenshotRequiredAfterTrip: number;
  screenshotVerificationSampleRate: number;
  
  // Detección de fraude
  maxPriceDifferencePercentage: number;
  suspiciousPatternThreshold: number;
  
  // Penalizaciones
  fraudPenalty: 'warning' | 'temporary_block' | 'permanent_block';
  temporaryBlockDurationDays: number;
}

export interface PriceNegotiationAnalytics {
  period: {
    startDate: Date;
    endDate: Date;
  };
  
  // Métricas generales
  totalNegotiations: number;
  successfulNegotiations: number;
  averageDiscount: number;
  totalDiscountAmount: number;
  
  // Conversión
  conversionRate: number;
  averageUberPrice: number;
  averageKommutePrice: number;
  
  // Fraude
  fraudDetections: number;
  fraudRate: number;
  blockedUsers: number;
  
  // Tendencias
  priceComparisonTrend: {
    date: Date;
    averageUberPrice: number;
    averageKommutePrice: number;
    negotiationCount: number;
  }[];
}

export interface ScreenshotVerificationRequest {
  id: string;
  negotiationId: string;
  userId: string;
  screenshotUrl: string;
  
  // Análisis automático
  autoVerificationStatus: 'pending' | 'passed' | 'failed' | 'needs_manual_review';
  autoVerificationConfidence: number;
  detectedPrice?: number;
  detectedApp?: 'uber' | 'didi' | 'other' | 'unknown';
  
  // Revisión manual
  manualReviewRequired: boolean;
  manualReviewStatus?: 'pending' | 'approved' | 'rejected';
  reviewedBy?: string;
  reviewedAt?: Date;
  reviewNotes?: string;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

export const DEFAULT_NEGOTIATION_SETTINGS: PriceNegotiationSettings = {
  maxDiscountPercentage: 3,
  minDiscountPercentage: 2,
  freeNegotiationsLimit: 10,
  screenshotRequiredAfterTrip: 11,
  screenshotVerificationSampleRate: 0.15,
  maxPriceDifferencePercentage: 50,
  suspiciousPatternThreshold: 3,
  fraudPenalty: 'permanent_block',
  temporaryBlockDurationDays: 30,
};
