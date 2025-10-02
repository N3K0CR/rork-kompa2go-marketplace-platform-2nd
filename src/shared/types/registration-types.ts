export type UserRole = 'client' | 'provider' | 'kommuter' | 'admin';

export type ProviderNiche = 
  | 'health'
  | 'beauty'
  | 'fitness'
  | 'education'
  | 'professional'
  | 'home_services'
  | 'automotive'
  | 'pet_care'
  | 'events'
  | 'other';

export type AccessibilityNeed = 
  | 'blind'
  | 'low_vision'
  | 'reading_difficulty'
  | 'hearing_impaired'
  | 'motor_disability'
  | 'other';

export type TTSSpeed = 'slow' | 'normal' | 'fast';
export type DescriptionLevel = 'basic' | 'intermediate' | 'complete';
export type NavigationMode = 'visual' | 'audible' | 'combined';

export interface AccessibilityPreferences {
  hasAccessibilityNeeds: boolean;
  needs: AccessibilityNeed[];
  otherNeedDescription?: string;
  
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

export interface BaseUserProfile {
  id: string;
  email: string;
  phoneNumber: string;
  fullName: string;
  role: UserRole;
  profilePhotoUrl?: string;
  
  accessibilityPreferences: AccessibilityPreferences;
  
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  isVerified: boolean;
}

export interface ClientProfile extends BaseUserProfile {
  role: 'client';
  dateOfBirth?: Date;
  address?: string;
  emergencyContact?: {
    name: string;
    phoneNumber: string;
    relationship: string;
  };
  
  referredBy?: string;
  referralCode: string;
}

export interface ProviderProfile extends BaseUserProfile {
  role: 'provider';
  businessName: string;
  niche: ProviderNiche;
  nicheSpecificData: Record<string, any>;
  
  businessAddress: string;
  businessPhone: string;
  businessEmail: string;
  
  taxId?: string;
  businessLicense?: string;
  
  serviceDescription: string;
  serviceAreas: string[];
  
  rating: number;
  totalReviews: number;
  
  isKommuterEnabled: boolean;
  
  referredBy?: string;
  referralCode: string;
}

export type VehicleType = 'car' | 'suv' | 'van' | 'motorcycle' | 'bicycle' | 'other';

export interface VehicleDocument {
  id: string;
  type: 'registration' | 'insurance' | 'inspection' | 'other';
  documentUrl: string;
  expiryDate?: Date;
  uploadedAt: Date;
}

export interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  color: string;
  licensePlate: string;
  vehicleType: VehicleType;
  
  capacity: number;
  hasAirConditioning: boolean;
  hasWheelchairAccess: boolean;
  
  documents: VehicleDocument[];
  
  assignedDriverId?: string;
  
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

export interface DriverDocument {
  id: string;
  type: 'license' | 'id' | 'background_check' | 'other';
  documentUrl: string;
  expiryDate?: Date;
  uploadedAt: Date;
  isVerified: boolean;
}

export interface KommuterProfile extends BaseUserProfile {
  role: 'kommuter';
  providerId: string;
  
  licenseNumber: string;
  licenseExpiryDate: Date;
  
  documents: DriverDocument[];
  
  isFleetManager: boolean;
  managedVehicles: string[];
  assignedDrivers: string[];
  
  primaryVehicleId?: string;
  
  totalTrips: number;
  completedTrips: number;
  cancelledTrips: number;
  rating: number;
  totalReviews: number;
  
  backgroundCheckRequired: boolean;
  backgroundCheckCompleted: boolean;
  backgroundCheckDate?: Date;
  
  isAvailable: boolean;
  currentTripId?: string;
  
  referredBy?: string;
  referralCode: string;
  
  earnings: {
    total: number;
    pending: number;
    paid: number;
  };
}

export type ReferralStatus = 'pending' | 'active' | 'completed' | 'cancelled';

export interface Referral {
  id: string;
  referrerId: string;
  referredUserId: string;
  referredUserRole: UserRole;
  
  status: ReferralStatus;
  
  referredUserTripsCompleted: number;
  
  referrerRewardAmount: number;
  referrerRewardPaid: boolean;
  referrerRewardPaidAt?: Date;
  
  referredRewardAmount: number;
  referredRewardPaid: boolean;
  referredRewardPaidAt?: Date;
  
  createdAt: Date;
  updatedAt: Date;
  
  fraudCheckPassed: boolean;
  fraudCheckNotes?: string;
}

export interface RegistrationFormData {
  email: string;
  password: string;
  confirmPassword: string;
  phoneNumber: string;
  fullName: string;
  
  role: UserRole;
  
  accessibilityPreferences?: Partial<AccessibilityPreferences>;
  
  referralCode?: string;
}

export interface ClientRegistrationData extends RegistrationFormData {
  role: 'client';
  dateOfBirth?: Date;
  address?: string;
  emergencyContact?: {
    name: string;
    phoneNumber: string;
    relationship: string;
  };
}

export interface ProviderRegistrationData extends RegistrationFormData {
  role: 'provider';
  businessName: string;
  niche: ProviderNiche;
  nicheSpecificData: Record<string, any>;
  businessAddress: string;
  businessPhone: string;
  businessEmail: string;
  serviceDescription: string;
  serviceAreas: string[];
}

export interface KommuterRegistrationData extends RegistrationFormData {
  role: 'kommuter';
  providerId: string;
  licenseNumber: string;
  licenseExpiryDate: Date;
  
  isFleetManager: boolean;
  
  vehicle: {
    make: string;
    model: string;
    year: number;
    color: string;
    licensePlate: string;
    vehicleType: VehicleType;
    capacity: number;
    hasAirConditioning: boolean;
    hasWheelchairAccess: boolean;
  };
  
  documents: {
    licensePhoto: string;
    idPhoto: string;
    vehicleRegistration: string;
    vehicleInsurance: string;
  };
}
