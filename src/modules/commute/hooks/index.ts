// ============================================================================
// COMMUTE HOOKS INDEX
// ============================================================================
// Central export point for all commute-related hooks

// Core commute hooks
export {
  useCommute,
  useRoutes,
  useCarbonFootprint,
  useKommuteEnabled,
  useKommuteAdmin,
  useTripAnalytics,
  useLocationTracking,
} from './useCommute';

// Location hooks
export { useCurrentLocation } from './useCurrentLocation';

// Trip chaining specialized hooks
export {
  useTripChaining,
  useDestinationMode,
  useZoneSaturation,
} from './useTripChaining';

// Re-export types for convenience
export type {
  CreateTripChainInput,
  AddTripToQueueInput,
  FindNextTripsInput,
  AcceptNextTripInput,
  DriverChainState,
  ChainEfficiencyMetrics,
} from '../types/trip-chaining-types';