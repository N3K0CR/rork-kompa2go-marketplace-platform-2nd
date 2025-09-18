// ============================================================================
// 2KOMMUTE UI COMPONENT TYPES
// ============================================================================
// Type definitions for UI components and their props

import type { ViewStyle, TextStyle } from 'react-native';
import React from "react";
import type {
  TransportMode,
  Route,
  Trip,
  TrackingPoint,
  CurrentLocation,
  CommuteStatus,
} from './core-types';

// ============================================================================
// COMMON UI TYPES
// ============================================================================

export interface BaseComponentProps {
  testID?: string;
  style?: ViewStyle;
  disabled?: boolean;
}

export interface BaseTextProps {
  style?: TextStyle;
  numberOfLines?: number;
  ellipsizeMode?: 'head' | 'middle' | 'tail' | 'clip';
}

export interface LoadingState {
  isLoading: boolean;
  loadingText?: string;
}

export interface ErrorState {
  error: Error | null;
  onRetry?: () => void;
}

// ============================================================================
// MAP COMPONENT TYPES
// ============================================================================

export interface MapViewProps extends BaseComponentProps {
  // Location and region
  initialRegion?: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  };
  currentLocation?: CurrentLocation;
  showCurrentLocation?: boolean;
  followUser?: boolean;
  
  // Route and trip data
  route?: Route;
  activeTrip?: Trip;
  trackingPoints?: TrackingPoint[];
  
  // Visual options
  showTraffic?: boolean;
  showCompass?: boolean;
  showScale?: boolean;
  mapType?: 'standard' | 'satellite' | 'hybrid' | 'terrain';
  
  // Interaction
  onRegionChange?: (region: any) => void;
  onMarkerPress?: (markerId: string) => void;
  onMapPress?: (coordinate: { latitude: number; longitude: number }) => void;
  
  // Styling
  height?: number | string;
  borderRadius?: number;
}

// ============================================================================
// TRANSPORT MODE SELECTOR TYPES
// ============================================================================

export interface TransportModeSelectorProps extends BaseComponentProps {
  transportModes: TransportMode[];
  selectedModes: string[];
  onSelectionChange: (selectedModeIds: string[]) => void;
  multiSelect?: boolean;
  showCarbonInfo?: boolean;
  showCostInfo?: boolean;
  layout?: 'horizontal' | 'vertical' | 'grid';
  itemSize?: 'small' | 'medium' | 'large';
}

export interface TransportModeItemProps extends BaseComponentProps {
  mode: TransportMode;
  isSelected: boolean;
  onPress: () => void;
  showDetails?: boolean;
  size?: 'small' | 'medium' | 'large';
}

// ============================================================================
// ROUTE COMPONENT TYPES
// ============================================================================

export interface RouteCardProps extends BaseComponentProps {
  route: Route;
  onPress?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onStartTrip?: () => void;
  showActions?: boolean;
  showStats?: boolean;
  compact?: boolean;
}

export interface RouteListProps extends BaseComponentProps {
  routes: Route[];
  onRoutePress?: (route: Route) => void;
  onRouteEdit?: (route: Route) => void;
  onRouteDelete?: (routeId: string) => void;
  onStartTrip?: (routeId: string) => void;
  showCreateButton?: boolean;
  onCreateRoute?: () => void;
  emptyStateText?: string;
  loading?: boolean;
}

export interface CreateRouteFormProps extends BaseComponentProps {
  onSubmit: (routeData: any) => Promise<void>;
  onCancel: () => void;
  initialData?: Partial<Route>;
  transportModes: TransportMode[];
  loading?: boolean;
}

// ============================================================================
// TRIP COMPONENT TYPES
// ============================================================================

export interface TripStatusProps extends BaseComponentProps {
  trip: Trip;
  route?: Route;
  onEndTrip?: () => void;
  onPauseTrip?: () => void;
  onResumeTrip?: () => void;
  showMap?: boolean;
  showStats?: boolean;
  compact?: boolean;
}

export interface TripHistoryProps extends BaseComponentProps {
  trips: Trip[];
  onTripPress?: (trip: Trip) => void;
  groupBy?: 'date' | 'route' | 'none';
  showStats?: boolean;
  loading?: boolean;
  emptyStateText?: string;
}

export interface TripStatsProps extends BaseComponentProps {
  trip: Trip;
  showComparison?: boolean;
  showCarbonFootprint?: boolean;
  showCost?: boolean;
  layout?: 'horizontal' | 'vertical';
}

// ============================================================================
// DRIVER AND PASSENGER COMPONENT TYPES
// ============================================================================

export interface DriverCardProps extends BaseComponentProps {
  driver: {
    id: string;
    name: string;
    avatar?: string;
    rating?: number;
    vehicle?: {
      make: string;
      model: string;
      color: string;
      licensePlate: string;
    };
    location?: CurrentLocation;
    estimatedArrival?: Date;
  };
  onPress?: () => void;
  onCall?: () => void;
  onMessage?: () => void;
  showActions?: boolean;
  showLocation?: boolean;
}

export interface PassengerListProps extends BaseComponentProps {
  passengers: Array<{
    id: string;
    name: string;
    avatar?: string;
    pickupLocation: { latitude: number; longitude: number; address: string };
    dropoffLocation: { latitude: number; longitude: number; address: string };
    status: 'waiting' | 'picked_up' | 'dropped_off';
  }>;
  onPassengerPress?: (passengerId: string) => void;
  showStatus?: boolean;
}

// ============================================================================
// MODAL AND DIALOG TYPES
// ============================================================================

export interface CommuteModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  showCloseButton?: boolean;
  animationType?: 'slide' | 'fade' | 'none';
  presentationStyle?: 'fullScreen' | 'pageSheet' | 'formSheet' | 'overFullScreen';
}

export interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  destructive?: boolean;
}

export interface RouteOptionsModalProps extends CommuteModalProps {
  route: Route;
  onEdit: () => void;
  onDelete: () => void;
  onStartTrip: () => void;
  onDuplicate?: () => void;
  onShare?: () => void;
}

// ============================================================================
// BUTTON AND INPUT TYPES
// ============================================================================

export interface CommuteButtonProps extends BaseComponentProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  icon?: string;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
  fullWidth?: boolean;
}

export interface LocationInputProps extends BaseComponentProps {
  value?: string;
  onLocationSelect: (location: { latitude: number; longitude: number; address: string }) => void;
  placeholder?: string;
  showCurrentLocation?: boolean;
  showFavorites?: boolean;
  autoFocus?: boolean;
}

export interface TimePickerProps extends BaseComponentProps {
  value?: Date;
  onChange: (time: Date) => void;
  mode?: '12h' | '24h';
  minimumTime?: Date;
  maximumTime?: Date;
}

// ============================================================================
// ANALYTICS AND STATS TYPES
// ============================================================================

export interface AnalyticsDashboardProps extends BaseComponentProps {
  userId: string;
  period: 'week' | 'month' | 'year';
  showCarbonFootprint?: boolean;
  showCostAnalysis?: boolean;
  showTimeAnalysis?: boolean;
  onPeriodChange?: (period: string) => void;
}

export interface CarbonFootprintDisplayProps extends BaseComponentProps {
  footprint: {
    current: number;
    target?: number;
    previousPeriod?: number;
    average?: number;
  };
  period: 'daily' | 'weekly' | 'monthly';
  showComparison?: boolean;
  showTarget?: boolean;
  onSetTarget?: (target: number) => void;
}

export interface StatsCardProps extends BaseComponentProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: string;
  trend?: {
    value: number;
    direction: 'up' | 'down' | 'neutral';
    isGood: boolean;
  };
  color?: string;
  onPress?: () => void;
}

// ============================================================================
// NOTIFICATION AND ALERT TYPES
// ============================================================================

export interface NotificationProps {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message?: string;
  duration?: number;
  onPress?: () => void;
  onDismiss?: () => void;
  showCloseButton?: boolean;
}

export interface AlertBannerProps extends BaseComponentProps {
  type: 'info' | 'warning' | 'error' | 'success';
  message: string;
  action?: {
    text: string;
    onPress: () => void;
  };
  onDismiss?: () => void;
  persistent?: boolean;
}

// ============================================================================
// SEARCH AND FILTER TYPES
// ============================================================================

export interface SearchBarProps extends BaseComponentProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  showFilter?: boolean;
  onFilterPress?: () => void;
  autoFocus?: boolean;
  onSubmit?: () => void;
}

export interface FilterModalProps extends CommuteModalProps {
  filters: {
    transportModes?: string[];
    dateRange?: { start: Date; end: Date };
    status?: string[];
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  };
  onFiltersChange: (filters: any) => void;
  onReset: () => void;
  transportModes: TransportMode[];
}

// ============================================================================
// LOADING AND EMPTY STATE TYPES
// ============================================================================

export interface LoadingSpinnerProps extends BaseComponentProps {
  size?: 'small' | 'medium' | 'large';
  color?: string;
  text?: string;
}

export interface EmptyStateProps extends BaseComponentProps {
  icon?: string;
  title: string;
  message?: string;
  actionText?: string;
  onActionPress?: () => void;
}

export interface ErrorStateProps extends BaseComponentProps {
  error: Error;
  onRetry?: () => void;
  showDetails?: boolean;
}

// ============================================================================
// ANIMATION AND TRANSITION TYPES
// ============================================================================

export interface AnimatedViewProps extends BaseComponentProps {
  children: React.ReactNode;
  animationType?: 'fadeIn' | 'slideIn' | 'scaleIn' | 'bounceIn';
  duration?: number;
  delay?: number;
  onAnimationComplete?: () => void;
}

export interface TransitionProps {
  show: boolean;
  children: React.ReactNode;
  type?: 'fade' | 'slide' | 'scale';
  duration?: number;
  onTransitionComplete?: () => void;
}

// ============================================================================
// THEME AND STYLING TYPES
// ============================================================================

export interface ThemeColors {
  primary: string;
  secondary: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  border: string;
  error: string;
  warning: string;
  success: string;
  info: string;
}

export interface ComponentTheme {
  colors: ThemeColors;
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
  borderRadius: {
    sm: number;
    md: number;
    lg: number;
  };
  typography: {
    h1: TextStyle;
    h2: TextStyle;
    h3: TextStyle;
    body: TextStyle;
    caption: TextStyle;
  };
}

// ============================================================================
// ACCESSIBILITY TYPES
// ============================================================================

export interface AccessibilityProps {
  accessibilityLabel?: string;
  accessibilityHint?: string;
  accessibilityRole?: string;
  accessibilityState?: {
    disabled?: boolean;
    selected?: boolean;
    checked?: boolean;
    busy?: boolean;
    expanded?: boolean;
  };
  accessibilityValue?: {
    min?: number;
    max?: number;
    now?: number;
    text?: string;
  };
}

// ============================================================================
// GESTURE AND INTERACTION TYPES
// ============================================================================

export interface GestureHandlers {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  onLongPress?: () => void;
  onDoubleTap?: () => void;
}

export interface DragDropProps {
  draggable?: boolean;
  onDragStart?: () => void;
  onDragEnd?: () => void;
  onDrop?: (data: any) => void;
  dragData?: any;
}

// ============================================================================
// EXPORT ALL TYPES
// ============================================================================

// Re-export for convenience
export type {
  BaseComponentProps,
  BaseTextProps,
  LoadingState,
  ErrorState,
  AccessibilityProps,
  GestureHandlers,
  ComponentTheme,
  ThemeColors,
};