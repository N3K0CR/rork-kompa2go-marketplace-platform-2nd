import { CountryConfig } from './types';

// Costa Rica Configuration
export const COSTA_RICA_CONFIG: CountryConfig = {
  code: 'CR',
  name: 'Costa Rica',
  currency: 'CRC',
  symbol: '₡',
  supportedMethods: ['sinpe', 'kash', 'bank_transfer', 'card'],
  taxRate: 0, // No tax charge
  processingFees: {
    sinpe: 0, // No fee for SINPE
    kash: 0, // No fee for Kash
    bank_transfer: 500, // ₡500 fee
    card: 0.035, // 3.5% fee
    paypal: 0.049, // 4.9% fee
    stripe: 0.029, // 2.9% fee
  },
  regulations: {
    requiresKYC: false,
    maxTransactionAmount: 1000000, // ₡1,000,000
    requiresTaxId: false,
  }
};

// Panama Configuration (for future expansion)
export const PANAMA_CONFIG: CountryConfig = {
  code: 'PA',
  name: 'Panama',
  currency: 'USD',
  symbol: '$',
  supportedMethods: ['card', 'bank_transfer', 'paypal', 'stripe'],
  taxRate: 0.07, // 7% ITBMS
  processingFees: {
    sinpe: 0,
    kash: 0,
    bank_transfer: 2.50, // $2.50 fee
    card: 0.035, // 3.5% fee
    paypal: 0.049, // 4.9% fee
    stripe: 0.029, // 2.9% fee
  },
  regulations: {
    requiresKYC: true,
    maxTransactionAmount: 10000, // $10,000
    requiresTaxId: true,
  }
};

// Guatemala Configuration (for future expansion)
export const GUATEMALA_CONFIG: CountryConfig = {
  code: 'GT',
  name: 'Guatemala',
  currency: 'GTQ',
  symbol: 'Q',
  supportedMethods: ['card', 'bank_transfer', 'paypal', 'stripe'],
  taxRate: 0.12, // 12% IVA
  processingFees: {
    sinpe: 0,
    kash: 0,
    bank_transfer: 15, // Q15 fee
    card: 0.035, // 3.5% fee
    paypal: 0.049, // 4.9% fee
    stripe: 0.029, // 2.9% fee
  },
  regulations: {
    requiresKYC: false,
    maxTransactionAmount: 50000, // Q50,000
    requiresTaxId: false,
  }
};

// Mexico Configuration (for future expansion)
export const MEXICO_CONFIG: CountryConfig = {
  code: 'MX',
  name: 'Mexico',
  currency: 'MXN',
  symbol: '$',
  supportedMethods: ['card', 'bank_transfer', 'paypal', 'stripe'],
  taxRate: 0.16, // 16% IVA
  processingFees: {
    sinpe: 0,
    kash: 0,
    bank_transfer: 25, // $25 MXN fee
    card: 0.035, // 3.5% fee
    paypal: 0.049, // 4.9% fee
    stripe: 0.029, // 2.9% fee
  },
  regulations: {
    requiresKYC: true,
    maxTransactionAmount: 100000, // $100,000 MXN
    requiresTaxId: true,
  }
};

// Country Registry
export const COUNTRY_CONFIGS: Record<string, CountryConfig> = {
  CR: COSTA_RICA_CONFIG,
  PA: PANAMA_CONFIG,
  GT: GUATEMALA_CONFIG,
  MX: MEXICO_CONFIG,
};

// Helper functions
export function getCountryConfig(countryCode: string): CountryConfig | null {
  return COUNTRY_CONFIGS[countryCode.toUpperCase()] || null;
}

export function getSupportedCountries(): CountryConfig[] {
  return Object.values(COUNTRY_CONFIGS);
}

export function isPaymentMethodSupported(countryCode: string, method: string): boolean {
  const config = getCountryConfig(countryCode);
  return config ? config.supportedMethods.includes(method as any) : false;
}

export function calculateFees(
  amount: number, 
  paymentMethod: string, 
  countryCode: string
): { processingFee: number; taxAmount: number; totalAmount: number } {
  const config = getCountryConfig(countryCode);
  if (!config) {
    throw new Error(`Country ${countryCode} not supported`);
  }

  const feeRate = config.processingFees[paymentMethod as keyof typeof config.processingFees] || 0;
  const processingFee = typeof feeRate === 'number' && feeRate < 1 
    ? amount * feeRate  // Percentage fee
    : feeRate;          // Fixed fee

  const taxAmount = amount * config.taxRate;
  const totalAmount = amount + processingFee + taxAmount;

  return {
    processingFee: Math.round(processingFee * 100) / 100,
    taxAmount: Math.round(taxAmount * 100) / 100,
    totalAmount: Math.round(totalAmount * 100) / 100,
  };
}