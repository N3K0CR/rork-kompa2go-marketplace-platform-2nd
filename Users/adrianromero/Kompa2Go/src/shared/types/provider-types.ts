export interface ProviderService {
  id: string;
  providerId: string;
  name: string;
  description: string;
  category: string;
  price: number;
  currency: string;
  duration?: number;
  isActive: boolean;
  photos: string[];
  createdAt: Date;
  updatedAt: Date;
  status: 'active' | 'inactive' | 'pending_approval' | 'rejected';
  rejectionReason?: string;
}

export interface ServiceModificationRequest {
  id: string;
  providerId: string;
  serviceId: string;
  serviceName: string;
  oldPrice: number;
  newPrice: number;
  priceUpdateUrl: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Date;
  processedAt?: Date;
  processedBy?: string;
  notes?: string;
}

export interface ProviderProfile {
  id: string;
  userId: string;
  companyInfo: {
    businessName: string;
    taxId?: string;
    address: string;
    city: string;
    state: string;
    country: string;
  };
  contactInfo: {
    contactName: string;
    email: string;
    phone: string;
  };
  serviceInfo: {
    vehicleTypes: string[];
    coverageAreas: string[];
    serviceNiche: string;
  };
  status: 'pending' | 'active' | 'suspended' | 'rejected';
  rating?: number;
  totalServices?: number;
  completedServices?: number;
  createdAt: Date;
  updatedAt: Date;
  approvedAt?: Date;
  hasActiveReservation: boolean;
  profilePhotos: string[];
  businessHours?: {
    [key: string]: {
      open: string;
      close: string;
      isOpen: boolean;
    };
  };
}

export interface ServiceCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
}

export const SERVICE_CATEGORIES: ServiceCategory[] = [
  { id: 'transport', name: 'Transporte', description: 'Servicios de transporte de personas', icon: 'car' },
  { id: 'moving', name: 'Mudanzas', description: 'Servicios de mudanza y transporte de carga', icon: 'truck' },
  { id: 'delivery', name: 'Entregas', description: 'Servicios de entrega y mensajería', icon: 'package' },
  { id: 'executive', name: 'Ejecutivo', description: 'Transporte ejecutivo y corporativo', icon: 'briefcase' },
  { id: 'tourism', name: 'Turismo', description: 'Tours y transporte turístico', icon: 'map' },
  { id: 'events', name: 'Eventos', description: 'Transporte para eventos especiales', icon: 'calendar' },
  { id: 'other', name: 'Otros', description: 'Otros servicios de transporte', icon: 'more-horizontal' },
];
