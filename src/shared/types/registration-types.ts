import { z } from 'zod';

export const ClientRegistrationSchema = z.object({
  firstName: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  lastName: z.string().min(2, 'El apellido debe tener al menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  phone: z.string().min(8, 'Teléfono debe tener al menos 8 dígitos'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
  confirmPassword: z.string(),
  address: z.string().min(5, 'La dirección debe tener al menos 5 caracteres'),
  city: z.string().min(2, 'La ciudad es requerida'),
  province: z.string().min(2, 'La provincia es requerida'),
  preferredPaymentMethod: z.enum(['card', 'cash', 'transfer']),
  notificationPreferences: z.object({
    email: z.boolean(),
    sms: z.boolean(),
    push: z.boolean(),
  }),
  accessibilityNeeds: z.object({
    hasVisualImpairment: z.boolean(),
    hasReadingDifficulty: z.boolean(),
    hasHearingImpairment: z.boolean(),
    hasMotorImpairment: z.boolean(),
    other: z.string().optional(),
  }).optional(),
  accessibilityPreferences: z.object({
    enableTTS: z.boolean(),
    ttsSpeed: z.enum(['slow', 'normal', 'fast']),
    preferTextOnly: z.boolean(),
    detailLevel: z.enum(['basic', 'intermediate', 'complete']),
    navigationMode: z.enum(['visual', 'audio', 'combined']),
  }).optional(),
  referralCode: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
});

export const ProviderRegistrationSchema = z.object({
  companyName: z.string().min(3, 'El nombre de la empresa debe tener al menos 3 caracteres'),
  businessId: z.string().min(5, 'RUC/NIT es requerido'),
  email: z.string().email('Email inválido'),
  phone: z.string().min(8, 'Teléfono debe tener al menos 8 dígitos'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
  confirmPassword: z.string(),
  contactPersonName: z.string().min(3, 'Nombre del contacto es requerido'),
  contactPersonEmail: z.string().email('Email del contacto inválido'),
  contactPersonPhone: z.string().min(8, 'Teléfono del contacto es requerido'),
  businessAddress: z.string().min(5, 'La dirección es requerida'),
  city: z.string().min(2, 'La ciudad es requerida'),
  province: z.string().min(2, 'La provincia es requerida'),
  serviceTypes: z.array(z.string()).min(1, 'Seleccione al menos un tipo de servicio'),
  vehicleTypes: z.array(z.string()).min(1, 'Seleccione al menos un tipo de vehículo'),
  coverageAreas: z.array(z.string()).min(1, 'Seleccione al menos un área de cobertura'),
  businessLicense: z.string().optional(),
  taxDocument: z.string().optional(),
  insuranceDocument: z.string().optional(),
  accessibilityNeeds: z.object({
    hasVisualImpairment: z.boolean(),
    hasReadingDifficulty: z.boolean(),
    hasHearingImpairment: z.boolean(),
    hasMotorImpairment: z.boolean(),
    other: z.string().optional(),
  }).optional(),
  accessibilityPreferences: z.object({
    enableTTS: z.boolean(),
    ttsSpeed: z.enum(['slow', 'normal', 'fast']),
    preferTextOnly: z.boolean(),
    detailLevel: z.enum(['basic', 'intermediate', 'complete']),
    navigationMode: z.enum(['visual', 'audio', 'combined']),
  }).optional(),
  referralCode: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
});

export const KommuterRegistrationSchema = z.object({
  firstName: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  lastName: z.string().min(2, 'El apellido debe tener al menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  phone: z.string().min(8, 'Teléfono debe tener al menos 8 dígitos'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
  confirmPassword: z.string(),
  cedula: z.string().min(9, 'Cédula debe tener al menos 9 dígitos'),
  address: z.string().min(5, 'La dirección es requerida'),
  city: z.string().min(2, 'La ciudad es requerida'),
  province: z.string().min(2, 'La provincia es requerida'),
  licenseNumber: z.string().min(5, 'Número de licencia es requerido'),
  licenseExpiry: z.string().min(1, 'Fecha de vencimiento es requerida'),
  licenseDocument: z.string().optional(),
  isFleetManager: z.boolean(),
  vehicles: z.array(z.object({
    brand: z.string().min(2, 'Marca es requerida'),
    model: z.string().min(2, 'Modelo es requerido'),
    year: z.number().min(1990, 'Año debe ser mayor a 1990').max(new Date().getFullYear() + 1),
    plate: z.string().min(5, 'Placa es requerida'),
    color: z.string().min(2, 'Color es requerido'),
    capacity: z.number().min(1, 'Capacidad debe ser al menos 1'),
    vehicleType: z.enum(['sedan', 'suv', 'van', 'truck', 'motorcycle']),
    registrationDocument: z.string().optional(),
    insuranceDocument: z.string().optional(),
    technicalInspection: z.string().optional(),
  })).min(1, 'Debe registrar al menos un vehículo'),
  fleetDrivers: z.array(z.object({
    name: z.string().min(3, 'Nombre del conductor es requerido'),
    cedula: z.string().min(9, 'Cédula es requerida'),
    licenseNumber: z.string().min(5, 'Número de licencia es requerido'),
    phone: z.string().min(8, 'Teléfono es requerido'),
    assignedVehiclePlate: z.string().optional(),
  })).optional(),
  profilePhoto: z.string().optional(),
  accessibilityNeeds: z.object({
    hasVisualImpairment: z.boolean(),
    hasReadingDifficulty: z.boolean(),
    hasHearingImpairment: z.boolean(),
    hasMotorImpairment: z.boolean(),
    other: z.string().optional(),
  }).optional(),
  accessibilityPreferences: z.object({
    enableTTS: z.boolean(),
    ttsSpeed: z.enum(['slow', 'normal', 'fast']),
    preferTextOnly: z.boolean(),
    detailLevel: z.enum(['basic', 'intermediate', 'complete']),
    navigationMode: z.enum(['visual', 'audio', 'combined']),
  }).optional(),
  referralCode: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
}).refine((data) => {
  if (data.isFleetManager && (!data.fleetDrivers || data.fleetDrivers.length === 0)) {
    return false;
  }
  return true;
}, {
  message: 'Los administradores de flotilla deben registrar al menos un conductor',
  path: ['fleetDrivers'],
});

export type ClientRegistrationType = z.infer<typeof ClientRegistrationSchema>;
export type ProviderRegistrationType = z.infer<typeof ProviderRegistrationSchema>;
export type KommuterRegistrationType = z.infer<typeof KommuterRegistrationSchema>;

export interface ReferralSystemType {
  referrerId: string;
  referredId: string;
  referredType: 'client' | 'provider' | 'kommuter';
  completedTrips: number;
  referrerRewardEarned: boolean;
  referredRewardEarned: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AccessibilitySettingsType {
  hasVisualImpairment: boolean;
  hasReadingDifficulty: boolean;
  hasHearingImpairment: boolean;
  hasMotorImpairment: boolean;
  other?: string;
  enableTTS: boolean;
  ttsSpeed: 'slow' | 'normal' | 'fast';
  preferTextOnly: boolean;
  detailLevel: 'basic' | 'intermediate' | 'complete';
  navigationMode: 'visual' | 'audio' | 'combined';
}

export type TTSSpeed = 'slow' | 'normal' | 'fast';
export type DescriptionLevel = 'basic' | 'intermediate' | 'complete';
export type NavigationMode = 'visual' | 'audio' | 'combined';
export type AccessibilityNeed = 'visual' | 'reading' | 'hearing' | 'motor' | 'other';

export interface AccessibilityPreferences {
  hasAccessibilityNeeds: boolean;
  needs: AccessibilityNeed[];
  
  ttsEnabled: boolean;
  ttsAutoPlay: boolean;
  ttsSpeed: TTSSpeed;
  
  chatTTSEnabled: boolean;
  chatAutoPlay: boolean;
  chatOnlyNoCall: boolean;
  
  descriptionLevel: DescriptionLevel;
  navigationMode: NavigationMode;
  
  highContrast: boolean;
  largeText: boolean;
  hapticFeedback: boolean;
}

export interface ClientRegistrationData {
  personalInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    cedula: string;
    dateOfBirth: string;
    howFoundUs: string;
  };
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  preferences: {
    paymentMethod: 'card' | 'cash' | 'transfer';
    notifications: {
      email: boolean;
      sms: boolean;
      push: boolean;
    };
  };
  accessibility?: {
    hasDisability: boolean;
    ttsEnabled: boolean;
    ttsSpeed: TTSSpeed;
    highContrast: boolean;
    largeText: boolean;
    voiceNavigation: boolean;
    autoReadMessages: boolean;
  };
  referralCode?: string;
}

export interface ProviderRegistrationData {
  companyInfo: {
    businessName: string;
    taxId: string;
    address: string;
    city: string;
    state: string;
    country: string;
  };
  contactInfo: {
    contactName: string;
    email: string;
    phone: string;
    howFoundUs: string;
  };
  serviceInfo: {
    vehicleTypes: string[];
    coverageAreas: string[];
    serviceNiche: string;
  };
  documents: Record<string, any>;
  accessibility?: {
    hasDisability: boolean;
    ttsEnabled: boolean;
    ttsSpeed: TTSSpeed;
    highContrast: boolean;
    largeText: boolean;
    voiceNavigation: boolean;
    autoReadMessages: boolean;
  };
  referralCode?: string;
}

export interface VehicleData {
  brand: string;
  model: string;
  year: number;
  plate: string;
  color: string;
  capacity: number;
  vehicleType: 'sedan' | 'suv' | 'van' | 'truck' | 'motorcycle';
  documents: Record<string, any>;
}

export interface FleetDriverData {
  firstName: string;
  lastName: string;
  cedula: string;
  phone: string;
  licenseNumber: string;
}

export interface KommuterRegistrationData {
  personalInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    cedula: string;
    dateOfBirth: string;
    address: string;
  };
  driverLicense: {
    number: string;
    expirationDate: string;
    category: string;
  };
  vehicleInfo: {
    isFleet: boolean;
    vehicles: VehicleData[];
    fleetDrivers?: FleetDriverData[];
  };
  documents: Record<string, any>;
  accessibility?: {
    hasDisability: boolean;
    ttsEnabled: boolean;
    ttsSpeed: TTSSpeed;
    highContrast: boolean;
    largeText: boolean;
    voiceNavigation: boolean;
    autoReadMessages: boolean;
  };
  referralCode?: string;
}

export interface UserProfile {
  id: string;
  type: 'client' | 'provider' | 'kommuter';
  status: 'active' | 'pending' | 'suspended';
  registrationData: ClientRegistrationData | ProviderRegistrationData | KommuterRegistrationData;
  createdAt: Date;
  updatedAt: Date;
  tripsCompleted?: number;
  rating?: number;
  backgroundCheckRequired?: boolean;
  backgroundCheckCompleted?: boolean;
}

export interface ReferralData {
  referrerId: string;
  referredId: string;
  referralCode: string;
  status: 'active' | 'completed' | 'expired';
  referredTripsCompleted: number;
  referrerRewardPaid: boolean;
  referredRewardPaid: boolean;
  createdAt: Date;
  updatedAt: Date;
}
