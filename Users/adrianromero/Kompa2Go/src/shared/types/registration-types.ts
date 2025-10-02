export interface ClientRegistrationData {
  personalInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    cedula: string;
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
    cedula: string;
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

export interface ReferralData {
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
