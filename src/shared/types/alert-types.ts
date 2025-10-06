export type AlertType = 'danger' | 'rating' | 'complaint';
export type AlertStatus = 'active' | 'resolved' | 'investigating' | 'awaiting_verification' | 'verified';
export type AlertPriority = 'low' | 'medium' | 'high' | 'critical';
export type VerificationStep = 'first_question' | 'second_question' | 'completed' | 'failed';

export interface SecurityQuestion {
  id: string;
  question: string;
  answer: string;
  category: 'primary' | 'secondary';
  isCostaRicanContext?: boolean;
}

export interface KommuterSecuritySettings {
  kommuterId: string;
  primaryQuestion: SecurityQuestion;
  secondaryQuestion: SecurityQuestion;
  createdAt: Date;
  updatedAt: Date;
}

export interface AlertVerification {
  alertId: string;
  currentStep: VerificationStep;
  firstQuestionAsked?: Date;
  firstQuestionAnswer?: string;
  firstQuestionCorrect?: boolean;
  secondQuestionAsked?: Date;
  secondQuestionAnswer?: string;
  secondQuestionCorrect?: boolean;
  verificationCompleted?: Date;
  actionTaken?: 'enable_tracking' | 'call_911' | 'dismissed';
  verifiedBy: string;
}

export interface DriverLocation {
  latitude: number;
  longitude: number;
  timestamp: Date;
  accuracy?: number;
  speed?: number;
  heading?: number;
}

export interface DriverAlert {
  id: string;
  driverId: string;
  driverName: string;
  type: AlertType;
  message: string;
  encryptedCode: string;
  location?: {
    lat: number;
    lng: number;
  };
  timestamp: Date;
  status: AlertStatus;
  priority: AlertPriority;
  verification?: AlertVerification;
  tracking?: {
    enabled: boolean;
    lastUpdate?: Date;
    currentLocation?: DriverLocation;
  };
  investigation?: {
    startedAt?: Date;
    notes?: string;
    assignedTo?: string;
  };
  resolution?: {
    resolvedAt?: Date;
    resolvedBy?: string;
    notes?: string;
    action911Called?: boolean;
  };
}

export interface DriverTrackingSession {
  id: string;
  driverId: string;
  alertId: string;
  startedAt: Date;
  endedAt?: Date;
  locations: DriverLocation[];
  isActive: boolean;
}

export interface Alert911Call {
  id: string;
  alertId: string;
  driverId: string;
  calledAt: Date;
  calledBy: string;
  location: {
    lat: number;
    lng: number;
  };
  driverInfo: {
    name: string;
    phone: string;
    vehicleInfo?: string;
  };
  status: 'pending' | 'dispatched' | 'resolved';
  dispatchNumber?: string;
  notes?: string;
}
