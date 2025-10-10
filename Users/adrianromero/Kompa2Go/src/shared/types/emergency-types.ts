export interface EmergencyAlert {
  id: string;
  userId: string;
  userName: string;
  userRole: 'client' | 'kommuter' | 'provider';
  type: 'panic' | 'accident' | 'medical' | 'security' | 'other';
  location: {
    latitude: number;
    longitude: number;
    address?: string;
    accuracy?: number;
  };
  relatedTo?: {
    type: 'trip' | 'service';
    id: string;
  };
  description?: string;
  photos?: string[];
  audio?: string;
  contacts: EmergencyContact[];
  status: 'active' | 'responding' | 'resolved' | 'false-alarm';
  priority: 'critical' | 'high' | 'medium';
  responders?: {
    id: string;
    name: string;
    role: 'police' | 'medical' | 'support' | 'admin';
    status: 'notified' | 'acknowledged' | 'en-route' | 'on-scene';
    eta?: number;
  }[];
  timeline: EmergencyEvent[];
  resolution?: {
    outcome: string;
    notes: string;
    resolvedBy: string;
    resolvedAt: Date;
  };
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
}

export interface EmergencyContact {
  id: string;
  userId: string;
  name: string;
  relationship: string;
  phone: string;
  email?: string;
  priority: number;
  notifyOnEmergency: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface EmergencyEvent {
  id: string;
  alertId: string;
  type: 'created' | 'location-update' | 'contact-notified' | 'responder-assigned' | 'status-change' | 'resolved';
  description: string;
  data?: any;
  createdBy: string;
  createdAt: Date;
}

export interface SafetySettings {
  userId: string;
  panicButtonEnabled: boolean;
  autoShareLocation: boolean;
  emergencyContacts: string[];
  shareTripsWithContacts: boolean;
  requireCheckIn: boolean;
  checkInInterval?: number;
  trustedContacts: string[];
  updatedAt: Date;
}
