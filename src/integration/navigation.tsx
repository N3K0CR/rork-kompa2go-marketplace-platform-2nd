// ============================================================================
// INTEGRATION - NAVIGATION
// ============================================================================
// Navigation integration between Kompa2Go and 2Kommute

/**
 * Navigation configuration that includes 2Kommute routes when enabled
 * Note: This should be used within a React component context
 */
export const getNavigationConfig = (isKommuteEnabled: boolean = false) => {
  
  const baseConfig = {
    // Existing Kompa2Go navigation
    tabs: [
      { name: 'index', title: 'Home', icon: 'home' },
      { name: 'search', title: 'Buscar', icon: 'search' },
      { name: 'calendar', title: 'Calendario', icon: 'calendar' },
      { name: 'chat', title: 'Chat', icon: 'message-circle' },
      { name: 'analytics', title: 'Analytics', icon: 'bar-chart' },
      { name: 'programas', title: 'Programas', icon: 'gift' },
      { name: 'profile', title: 'Perfil', icon: 'user' },
    ],
    stackRoutes: [
      'onboarding',
      'auth',
      'provider/[id]',
      'booking/[providerId]',
      // ... other existing routes
    ],
  };

  // Add 2Kommute routes if enabled
  if (isKommuteEnabled) {
    baseConfig.stackRoutes.push(
      'commute/index',
      'commute/search',
      'commute/driver',
      'commute/trip/[tripId]'
    );
  }

  return baseConfig;
};

/**
 * Check if a route belongs to 2Kommute module
 */
export const isCommuteRoute = (routeName: string): boolean => {
  if (!routeName?.trim()) return false;
  return routeName.startsWith('commute/');
};

/**
 * Get the appropriate layout for a route
 */
export const getRouteLayout = (routeName: string) => {
  if (!routeName?.trim()) return 'default';
  if (isCommuteRoute(routeName)) {
    return 'commute';
  }
  return 'default';
};

/**
 * Hook to get navigation configuration with Kommute status
 */
export const useNavigationConfig = () => {
  // This would be used in a React component
  // const { useKommuteEnabled } = require('../modules/commute/hooks/useCommute');
  // const isKommuteEnabled = useKommuteEnabled();
  // return getNavigationConfig(isKommuteEnabled);
  
  // For now, return base config
  return getNavigationConfig(false);
};