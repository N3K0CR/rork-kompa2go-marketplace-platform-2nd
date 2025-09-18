// ============================================================================
// KOMPA2GO CORE TYPES - MANTENER INTACTO
// ============================================================================
// Estos tipos son la base estable de Kompa2Go y NO deben modificarse
// para mantener compatibilidad con el código existente

// Core User types
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

// ============================================================================
// 2KOMMUTE TYPES - EN DESARROLLO (INACTIVO)
// ============================================================================
// Estos tipos están preparados para el módulo de transporte avanzado
// pero NO están activos hasta que se habilite el feature flag

// Transport-related types
export interface TransportMode {
  id: string;
  name: string;
  icon: string;
  color: string;
  carbonFactor: number; // kg CO2 per km
  costFactor: number; // cost per km
  speedFactor: number; // average speed km/h
  available: boolean;
}

export interface RoutePoint {
  id: string;
  latitude: number;
  longitude: number;
  address: string;
  name?: string;
  type: 'origin' | 'destination' | 'waypoint';
  estimatedArrival?: Date;
  actualArrival?: Date;
}

export interface Route {
  id: string;
  userId: string;
  name: string;
  points: RoutePoint[];
  transportModes: TransportMode[];
  distance: number; // in meters
  duration: number; // in seconds
  estimatedCost: number;
  carbonFootprint: number; // kg CO2
  status: 'planned' | 'active' | 'completed' | 'cancelled';
  isRecurring: boolean;
  recurringPattern?: RecurringPattern;
  createdAt: Date;
  updatedAt: Date;
}

export interface RecurringPattern {
  type: 'daily' | 'weekly' | 'monthly';
  daysOfWeek?: number[]; // 0-6 (Sunday-Saturday)
  startDate: Date;
  endDate?: Date;
  exceptions?: Date[]; // dates to skip
}

export interface Trip {
  id: string;
  routeId: string;
  userId: string;
  startTime: Date;
  endTime?: Date;
  actualDistance?: number;
  actualDuration?: number;
  actualCost?: number;
  actualCarbonFootprint?: number;
  status: 'planned' | 'in_progress' | 'completed' | 'cancelled';
  trackingPoints: TrackingPoint[];
  notes?: string;
}

export interface TrackingPoint {
  id: string;
  tripId: string;
  latitude: number;
  longitude: number;
  timestamp: Date;
  speed?: number; // km/h
  accuracy?: number; // meters
  altitude?: number; // meters
}

export interface CarbonFootprint {
  id: string;
  userId: string;
  period: 'daily' | 'weekly' | 'monthly' | 'yearly';
  startDate: Date;
  endDate: Date;
  totalEmissions: number; // kg CO2
  transportBreakdown: {
    transportModeId: string;
    emissions: number;
    distance: number;
    trips: number;
  }[];
  comparisonData?: {
    previousPeriod: number;
    average: number;
    target?: number;
  };
}

export interface TeamTransport {
  id: string;
  name: string;
  description?: string;
  adminId: string;
  members: TeamMember[];
  routes: Route[];
  settings: TeamTransportSettings;
  createdAt: Date;
  updatedAt: Date;
}

export interface TeamMember {
  userId: string;
  role: 'admin' | 'member';
  joinedAt: Date;
  preferences: {
    canDrive: boolean;
    hasVehicle: boolean;
    vehicleCapacity?: number;
    preferredTransportModes: string[];
  };
}

export interface TeamTransportSettings {
  allowCarpooling: boolean;
  maxDetourDistance: number; // meters
  costSharingEnabled: boolean;
  carbonTrackingEnabled: boolean;
  notificationsEnabled: boolean;
}

export interface TransportAnalytics {
  userId: string;
  period: {
    startDate: Date;
    endDate: Date;
  };
  summary: {
    totalTrips: number;
    totalDistance: number; // meters
    totalDuration: number; // seconds
    totalCost: number;
    totalCarbonFootprint: number; // kg CO2
    averageSpeed: number; // km/h
  };
  transportModeBreakdown: {
    transportModeId: string;
    trips: number;
    distance: number;
    duration: number;
    cost: number;
    carbonFootprint: number;
  }[];
  trends: {
    period: string;
    trips: number;
    distance: number;
    cost: number;
    carbonFootprint: number;
  }[];
  achievements: TransportAchievement[];
}

export interface TransportAchievement {
  id: string;
  userId: string;
  type: 'distance' | 'carbon_saved' | 'cost_saved' | 'consistency' | 'team_participation';
  title: string;
  description: string;
  icon: string;
  progress: number; // 0-100
  target: number;
  current: number;
  unlockedAt?: Date;
  reward?: {
    type: 'badge' | 'okoins' | 'discount';
    value: number;
  };
}

// Feature flag types
export interface FeatureFlags {
  KOMMUTE_ENABLED: boolean;
  KOMMUTE_TEAM_FEATURES: boolean;
  KOMMUTE_CARBON_TRACKING: boolean;
  KOMMUTE_OFFLINE_MAPS: boolean;
  KOMMUTE_EXTERNAL_APIS: boolean;
}

// Integration types between Kompa2Go and 2Kommute
export interface IntegratedUser extends User {
  transportPreferences?: {
    defaultTransportModes: string[];
    homeLocation?: Location;
    workLocation?: Location;
    carbonTrackingEnabled: boolean;
    teamTransportEnabled: boolean;
  };
  transportStats?: {
    totalTrips: number;
    totalDistance: number;
    carbonFootprintSaved: number;
    okoinsEarned: number;
  };
}

export interface IntegratedAnalytics {
  kompa2go: {
    bookings: number;
    revenue: number;
    okoinsEarned: number;
  };
  kommute: {
    trips: number;
    distance: number;
    carbonSaved: number;
    costSaved: number;
  };
  combined: {
    totalOkoinsEarned: number;
    sustainabilityScore: number;
    efficiencyRating: number;
  };
}

// API Response types for 2Kommute
export interface TransportApiResponse<T> extends ApiResponse<T> {
  metadata?: {
    featureFlags: Partial<FeatureFlags>;
    version: string;
    timestamp: Date;
  };
}

// Navigation types for 2Kommute
export type TransportTabParamList = {
  transport: undefined;
  routes: undefined;
};

export type TransportStackParamList = {
  'transport/route-planner': { routeId?: string };
  'transport/live-tracking': { tripId: string };
  'transport/trip-history': undefined;
  'transport/settings': undefined;
  'transport/team-coordination': { teamId?: string };
  'transport/analytics': { period?: string };
  'transport/carbon-tracker': undefined;
};

// Context types for 2Kommute
export interface TransportContextType {
  isEnabled: boolean;
  currentTrip: Trip | null;
  activeRoute: Route | null;
  transportModes: TransportMode[];
  isTracking: boolean;
  startTrip: (routeId: string) => Promise<void>;
  endTrip: (tripId: string) => Promise<void>;
  updateLocation: (point: Omit<TrackingPoint, 'id' | 'tripId'>) => void;
}

export interface RouteContextType {
  routes: Route[];
  isLoading: boolean;
  createRoute: (route: Omit<Route, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Route>;
  updateRoute: (routeId: string, updates: Partial<Route>) => Promise<void>;
  deleteRoute: (routeId: string) => Promise<void>;
  optimizeRoute: (routeId: string) => Promise<Route>;
}

export interface CarbonFootprintContextType {
  currentFootprint: CarbonFootprint | null;
  isLoading: boolean;
  calculateFootprint: (period: { startDate: Date; endDate: Date }) => Promise<CarbonFootprint>;
  getComparison: (period: string) => Promise<{ current: number; previous: number; average: number }>;
  setTarget: (target: number) => Promise<void>;
}

// Component props types for 2Kommute
export interface RouteMapProps {
  route?: Route;
  currentLocation?: { latitude: number; longitude: number };
  onRouteChange?: (route: Route) => void;
  showTraffic?: boolean;
  interactive?: boolean;
}

export interface TransportModeSelectorProps {
  modes: TransportMode[];
  selectedModes: string[];
  onSelectionChange: (modeIds: string[]) => void;
  maxSelection?: number;
}

export interface LiveTrackingIndicatorProps {
  trip: Trip;
  onStop: () => void;
  showDetails?: boolean;
}

export interface CarbonFootprintDisplayProps {
  footprint: CarbonFootprint;
  showComparison?: boolean;
  showBreakdown?: boolean;
  compact?: boolean;
}

// Extended types that combine both systems
export type ExtendedTabParamList = TabParamList & TransportTabParamList;
export type ExtendedRootStackParamList = RootStackParamList & TransportStackParamList;

// Migration and compatibility types
export interface MigrationStatus {
  kommuteEnabled: boolean;
  dataVersion: string;
  lastMigration: Date;
  pendingMigrations: string[];
  rollbackAvailable: boolean;
}

export interface CompatibilityCheck {
  kompa2goVersion: string;
  kommuteVersion: string;
  compatible: boolean;
  issues: string[];
  recommendations: string[];
}