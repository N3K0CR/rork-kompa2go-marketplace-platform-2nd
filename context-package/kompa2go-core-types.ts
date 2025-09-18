// Core types for Kompa2Go application
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'client' | 'provider' | 'admin';
  avatar?: string;
  phone?: string;
  language: 'es' | 'en';
  createdAt: Date;
  updatedAt: Date;
}

export interface Provider extends User {
  role: 'provider';
  specialties: string[];
  rating: number;
  reviewCount: number;
  location: Location;
  availability: Availability[];
  priceRange: PriceRange;
  verified: boolean;
  description?: string;
  experience?: number;
  certifications?: string[];
}

export interface Client extends User {
  role: 'client';
  preferences: ClientPreferences;
  bookingHistory: Booking[];
  okoinsBalance: number;
}

export interface Location {
  id: string;
  address: string;
  city: string;
  state: string;
  country: string;
  zipCode: string;
  latitude: number;
  longitude: number;
}

export interface Availability {
  id: string;
  dayOfWeek: number; // 0-6 (Sunday-Saturday)
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
  isAvailable: boolean;
}

export interface PriceRange {
  min: number;
  max: number;
  currency: 'USD' | 'EUR' | 'MXN';
}

export interface ClientPreferences {
  preferredLanguage: 'es' | 'en';
  maxDistance: number; // in kilometers
  priceRange: PriceRange;
  preferredSpecialties: string[];
  notifications: NotificationSettings;
}

export interface NotificationSettings {
  email: boolean;
  push: boolean;
  sms: boolean;
  bookingReminders: boolean;
  promotions: boolean;
}

export interface Booking {
  id: string;
  clientId: string;
  providerId: string;
  serviceId: string;
  date: Date;
  startTime: string;
  endTime: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  price: number;
  currency: string;
  notes?: string;
  location: Location;
  createdAt: Date;
  updatedAt: Date;
}

export interface Service {
  id: string;
  providerId: string;
  name: string;
  description: string;
  duration: number; // in minutes
  price: number;
  currency: string;
  category: string;
  isActive: boolean;
}

export interface Chat {
  id: string;
  participants: string[]; // user IDs
  lastMessage?: Message;
  createdAt: Date;
  updatedAt: Date;
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  content: string;
  type: 'text' | 'image' | 'file';
  timestamp: Date;
  read: boolean;
}

export interface OKoins {
  id: string;
  userId: string;
  balance: number;
  transactions: OKoinsTransaction[];
}

export interface OKoinsTransaction {
  id: string;
  userId: string;
  type: 'earned' | 'spent' | 'bonus';
  amount: number;
  description: string;
  relatedBookingId?: string;
  timestamp: Date;
}

export interface ReservationPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  features: string[];
  maxReservations: number;
  validityDays: number;
  isActive: boolean;
}

export interface Payment {
  id: string;
  userId: string;
  bookingId?: string;
  planId?: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  paymentMethod: 'card' | 'okoins' | 'mixed';
  transactionId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TeamCalendarEvent {
  id: string;
  title: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  participants: string[]; // user IDs
  type: 'meeting' | 'appointment' | 'break' | 'unavailable';
  location?: Location;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReportedProblem {
  id: string;
  reporterId: string;
  type: 'technical' | 'service' | 'payment' | 'other';
  title: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  assignedTo?: string;
  relatedBookingId?: string;
  attachments?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Achievement {
  id: string;
  userId: string;
  type: string;
  title: string;
  description: string;
  icon: string;
  okoinsReward: number;
  unlockedAt: Date;
}

export interface K2GProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  category: string;
  images: string[];
  isActive: boolean;
  stock?: number;
  createdAt: Date;
  updatedAt: Date;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// Form types
export interface LoginForm {
  email: string;
  password: string;
}

export interface RegisterForm {
  email: string;
  password: string;
  confirmPassword: string;
  name: string;
  phone?: string;
  role: 'client' | 'provider';
}

export interface BookingForm {
  providerId: string;
  serviceId: string;
  date: string;
  startTime: string;
  notes?: string;
}

export interface SearchFilters {
  query?: string;
  location?: {
    latitude: number;
    longitude: number;
    radius: number;
  };
  priceRange?: PriceRange;
  specialties?: string[];
  availability?: {
    date: string;
    time: string;
  };
  rating?: number;
}

// Navigation types
export type TabParamList = {
  index: undefined;
  search: undefined;
  calendar: undefined;
  chat: undefined;
  analytics: undefined;
  programas: undefined;
  profile: undefined;
};

export type RootStackParamList = {
  '(tabs)': undefined;
  auth: undefined;
  onboarding: undefined;
  'provider/[id]': { id: string };
  'booking/[providerId]': { providerId: string };
  'chat/[chatId]': { chatId: string };
  'payment-demo': undefined;
  'purchase-plan': { planId?: string };
  'payment-success': { paymentId: string };
  achievements: undefined;
  collaborators: undefined;
  'reported-problems': undefined;
  'pending-payments': undefined;
  'admin-products': undefined;
  'database-management': undefined;
  'test-kompi': undefined;
  chats: undefined;
  'client/edit-profile': undefined;
  'client/history': undefined;
  'provider/edit-profile': undefined;
  'provider/history': undefined;
};

// Context types
export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (credentials: LoginForm) => Promise<void>;
  register: (data: RegisterForm) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
}

export interface LanguageContextType {
  language: 'es' | 'en';
  setLanguage: (lang: 'es' | 'en') => void;
  t: (key: string) => string;
}

export interface WalletContextType {
  balance: number;
  transactions: OKoinsTransaction[];
  isLoading: boolean;
  addFunds: (amount: number) => Promise<void>;
  spendFunds: (amount: number, description: string) => Promise<void>;
  refreshBalance: () => Promise<void>;
}

// Component props types
export interface FloatingKompiProps {
  visible?: boolean;
  onPress?: () => void;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
}

export interface ReservationDetailCardProps {
  booking: Booking;
  onCancel?: (bookingId: string) => void;
  onReschedule?: (bookingId: string) => void;
  onRate?: (bookingId: string, rating: number) => void;
}

// Utility types
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;