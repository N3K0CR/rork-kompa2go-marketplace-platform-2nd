export interface DocumentType {
  id: string;
  label: string;
  placeholder: string;
  validation?: RegExp;
}

export interface CountryConfig {
  code: string;
  name: string;
  documentTypes: DocumentType[];
  taxIdLabel: string;
  taxIdPlaceholder: string;
}

export const COUNTRIES: CountryConfig[] = [
  {
    code: 'CR',
    name: 'Costa Rica',
    documentTypes: [
      { id: 'cedula', label: 'Cédula Nacional', placeholder: '1-2345-6789' },
      { id: 'cedula_residencia', label: 'Cédula de Residencia', placeholder: '123456789012' },
      { id: 'dimex', label: 'DIMEX', placeholder: '123456789012' },
    ],
    taxIdLabel: 'Cédula Jurídica',
    taxIdPlaceholder: '3-101-123456',
  },
  {
    code: 'PA',
    name: 'Panamá',
    documentTypes: [
      { id: 'cedula', label: 'Cédula Panameña', placeholder: '8-123-4567' },
      { id: 'pasaporte', label: 'Pasaporte', placeholder: 'N1234567' },
    ],
    taxIdLabel: 'RUC',
    taxIdPlaceholder: '1234567-1-123456',
  },
  {
    code: 'NI',
    name: 'Nicaragua',
    documentTypes: [
      { id: 'cedula', label: 'Cédula de Identidad', placeholder: '001-123456-0001A' },
      { id: 'residencia', label: 'Carnet de Residencia', placeholder: 'R-123456' },
    ],
    taxIdLabel: 'RUC',
    taxIdPlaceholder: 'J0310000000000',
  },
  {
    code: 'SV',
    name: 'El Salvador',
    documentTypes: [
      { id: 'dui', label: 'DUI', placeholder: '12345678-9' },
      { id: 'pasaporte', label: 'Pasaporte', placeholder: 'A1234567' },
    ],
    taxIdLabel: 'NIT',
    taxIdPlaceholder: '0614-123456-001-1',
  },
  {
    code: 'GT',
    name: 'Guatemala',
    documentTypes: [
      { id: 'dpi', label: 'DPI', placeholder: '1234 12345 0101' },
      { id: 'pasaporte', label: 'Pasaporte', placeholder: 'A1234567' },
    ],
    taxIdLabel: 'NIT',
    taxIdPlaceholder: '12345678-9',
  },
  {
    code: 'HN',
    name: 'Honduras',
    documentTypes: [
      { id: 'identidad', label: 'Tarjeta de Identidad', placeholder: '0801-1990-12345' },
      { id: 'pasaporte', label: 'Pasaporte', placeholder: 'A123456' },
    ],
    taxIdLabel: 'RTN',
    taxIdPlaceholder: '08011990123456',
  },
];

export interface ClientRegistrationData {
  personalInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    country: string;
    documentType: string;
    documentNumber: string;
    dateOfBirth?: string;
    howFoundUs?: string;
  };
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  preferences: {
    paymentMethod: 'card' | 'cash' | 'wallet';
    notifications: {
      email: boolean;
      sms: boolean;
      push: boolean;
    };
  };
  accessibility?: {
    hasDisability: boolean;
    disabilityType?: 'visual' | 'reading' | 'hearing' | 'motor' | 'other';
    ttsEnabled: boolean;
    ttsSpeed: 'slow' | 'normal' | 'fast';
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
    country: string;
    taxId: string;
    address: string;
    city: string;
    state: string;
  };
  contactInfo: {
    contactName: string;
    email: string;
    phone: string;
    howFoundUs?: string;
  };
  serviceInfo: {
    vehicleTypes: string[];
    coverageAreas: string[];
    serviceNiche: string;
  };
  documents: {
    businessLicense?: string;
    taxCertificate?: string;
    insurance?: string;
  };
  accessibility?: {
    hasDisability: boolean;
    disabilityType?: 'visual' | 'reading' | 'hearing' | 'motor' | 'other';
    ttsEnabled: boolean;
    ttsSpeed: 'slow' | 'normal' | 'fast';
    highContrast: boolean;
    largeText: boolean;
    voiceNavigation: boolean;
    autoReadMessages: boolean;
  };
  referralCode?: string;
}

export interface KommuterRegistrationData {
  personalInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    country: string;
    documentType: string;
    documentNumber: string;
    dateOfBirth: string;
    address: string;
  };
  driverLicense: {
    number: string;
    expirationDate: string;
    category: string;
    documentUrl?: string;
  };
  vehicleInfo: {
    isFleet: boolean;
    vehicles: VehicleData[];
  };
  documents: {
    profilePhoto?: string;
    cedulaFront?: string;
    cedulaBack?: string;
    licensePhoto?: string;
  };
  accessibility?: {
    hasDisability: boolean;
    disabilityType?: 'visual' | 'reading' | 'hearing' | 'motor' | 'other';
    ttsEnabled: boolean;
    ttsSpeed: 'slow' | 'normal' | 'fast';
    highContrast: boolean;
    largeText: boolean;
    voiceNavigation: boolean;
    autoReadMessages: boolean;
  };
  referralCode?: string;
}

export interface VehicleData {
  id?: string;
  brand: string;
  model: string;
  year: number;
  plate: string;
  color: string;
  capacity: number;
  vehicleType: 'sedan' | 'suv' | 'van' | 'truck' | 'motorcycle';
  documents: {
    registration?: string;
    insurance?: string;
    technicalInspection?: string;
  };
  assignedDriver?: string;
}

export interface FleetDriverData {
  id?: string;
  firstName: string;
  lastName: string;
  cedula: string;
  phone: string;
  licenseNumber: string;
  assignedVehicleId?: string;
}

export interface RegistrationReferralData {
  referrerId: string;
  referredId: string;
  referralCode: string;
  status: 'pending' | 'active' | 'completed';
  referredTripsCompleted: number;
  referrerRewardPaid: boolean;
  referredRewardPaid: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserProfile {
  id: string;
  type: 'client' | 'provider' | 'kommuter';
  status: 'pending' | 'active' | 'suspended' | 'banned';
  registrationData: ClientRegistrationData | ProviderRegistrationData | KommuterRegistrationData;
  createdAt: Date;
  updatedAt: Date;
  tripsCompleted?: number;
  rating?: number;
  backgroundCheckRequired?: boolean;
  backgroundCheckCompleted?: boolean;
}
