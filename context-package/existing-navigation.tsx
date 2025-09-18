import React from 'react';
import { Tabs } from 'expo-router';
import { Platform } from 'react-native';
import { 
  Home, 
  Search, 
  Calendar, 
  MessageCircle, 
  BarChart, 
  Gift, 
  User 
} from 'lucide-react-native';

// Current navigation structure for Kompa2Go
export const ExistingTabsLayout = () => {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#8E8E93',
        tabBarStyle: Platform.select({
          ios: {
            backgroundColor: '#F2F2F7',
            borderTopColor: '#C6C6C8',
          },
          android: {
            backgroundColor: '#FFFFFF',
            borderTopColor: '#E1E1E1',
          },
          web: {
            backgroundColor: '#FFFFFF',
            borderTopColor: '#E1E1E1',
          },
        }),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inicio',
          tabBarIcon: ({ color, size }) => (
            <Home size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Buscar',
          tabBarIcon: ({ color, size }) => (
            <Search size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: 'Calendario',
          tabBarIcon: ({ color, size }) => (
            <Calendar size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: 'Chat',
          tabBarIcon: ({ color, size }) => (
            <MessageCircle size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="analytics"
        options={{
          title: 'Analytics',
          tabBarIcon: ({ color, size }) => (
            <BarChart size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="programas"
        options={{
          title: 'Programas',
          tabBarIcon: ({ color, size }) => (
            <Gift size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color, size }) => (
            <User size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
};

// Current root layout structure
export const ExistingRootLayout = () => {
  return (
    <>
      {/* All existing providers are wrapped here */}
      {/* QueryClient Provider (React Query) */}
      {/* AuthContext Provider */}
      {/* LanguageContext Provider */}
      {/* WalletContext Provider */}
      {/* OKoinsContext Provider */}
      {/* AppointmentsContext Provider */}
      {/* TeamCalendarContext Provider */}
      {/* ReservationAlertContext Provider */}
      {/* ProviderContext Provider */}
      {/* ReservationPlansContext Provider */}
      {/* PendingPaymentsContext Provider */}
      {/* LocationSearchContext Provider */}
      {/* PaymentBackendContext Provider */}
      {/* ChatContext Provider */}
      {/* K2GProductsContext Provider */}
      {/* ReportedProblemsContext Provider */}
      {/* LemonSqueezyContext Provider */}
      {/* KompiBrainContext Provider */}
      {/* DatabaseContext Provider */}
      
      {/* Stack Navigator with all routes */}
    </>
  );
};

// Integration points for 2Kommute
export const KommuteIntegration = {
  // Entry points from existing app
  entryPoints: {
    homeScreen: {
      location: 'app/(tabs)/index.tsx',
      integration: 'Card button in client dashboard',
      route: '/commute',
      userTypes: ['client', 'provider'], // Available for both
    },
    floatingButton: {
      location: 'components/FloatingKompi.tsx',
      integration: 'Optional quick access (future)',
      route: '/commute',
      conditional: true,
    },
  },
  
  // Navigation flow
  flow: {
    entry: '/commute (Home)',
    search: '/commute/search (Find rides)',
    driver: '/commute/driver (Offer rides)',
    trip: '/commute/trip/[tripId] (Active trip)',
  },
  
  // Context integration
  contextIntegration: {
    provider: 'CommuteProvider',
    location: 'app/_layout.tsx',
    position: 'After ReportedProblemsProvider',
    dependencies: ['AuthContext', 'LocationSearchContext'],
  },
};

// Navigation patterns used in Kompa2Go
export const NavigationPatterns = {
  // Tab-based navigation for main features
  tabs: {
    structure: 'app/(tabs)/_layout.tsx',
    screens: [
      'index', 'search', 'calendar', 'chat', 
      'analytics', 'programas', 'profile'
    ],
    hasInnerStacks: true,
    headerShown: false, // Headers managed by inner stacks
  },

  // Stack navigation for detailed flows
  stacks: {
    auth: {
      screens: ['auth', 'onboarding'],
      modal: false,
    },
    provider: {
      screens: ['[id]', 'edit-profile', 'history'],
      modal: false,
    },
    client: {
      screens: ['edit-profile', 'history'],
      modal: false,
    },
    booking: {
      screens: ['[providerId]'],
      modal: true, // Booking flow as modal
    },
    chat: {
      screens: ['chats', '[chatId]'],
      modal: false,
    },
    payments: {
      screens: ['payment-demo', 'purchase-plan', 'payment-success'],
      modal: true,
    },
    admin: {
      screens: [
        'admin-products', 'collaborators', 'reported-problems',
        'pending-payments', 'database-management'
      ],
      modal: false,
    },
    // NEW: 2Kommute navigation stack
    commute: {
      screens: ['index', 'search', 'driver', 'trip/[tripId]'],
      modal: false,
      hasInnerStack: true,
      description: 'Smart transportation module with carpooling features',
    },
  },

  // Dynamic routes
  dynamicRoutes: [
    'provider/[id]',
    'booking/[providerId]',
    'chat/[chatId]',
    // NEW: 2Kommute dynamic routes
    'commute/trip/[tripId]',
  ],

  // Modal presentations
  modals: [
    'booking/[providerId]',
    'payment-demo',
    'purchase-plan',
    'payment-success',
  ],
};

// Current routing configuration
export const RoutingConfig = {
  // Root layout configuration
  rootLayout: {
    initialRouteName: '(tabs)',
    screenOptions: {
      headerShown: true,
      gestureEnabled: true,
    },
    modalScreens: [
      'booking/[providerId]',
      'payment-demo',
      'purchase-plan',
      'payment-success',
    ],
  },

  // Tab layout configuration
  tabLayout: {
    screenOptions: {
      headerShown: false, // Managed by inner stacks
      tabBarActiveTintColor: '#007AFF',
      tabBarInactiveTintColor: '#8E8E93',
    },
    tabs: [
      { name: 'index', title: 'Inicio', icon: 'Home' },
      { name: 'search', title: 'Buscar', icon: 'Search' },
      { name: 'calendar', title: 'Calendario', icon: 'Calendar' },
      { name: 'chat', title: 'Chat', icon: 'MessageCircle' },
      { name: 'analytics', title: 'Analytics', icon: 'BarChart' },
      { name: 'programas', title: 'Programas', icon: 'Gift' },
      { name: 'profile', title: 'Perfil', icon: 'User' },
    ],
  },

  // Deep linking configuration
  deepLinking: {
    prefixes: ['kompa2go://', 'https://kompa2go.com'],
    config: {
      screens: {
        '(tabs)': {
          screens: {
            index: '',
            search: 'search',
            calendar: 'calendar',
            chat: 'chat',
            analytics: 'analytics',
            programas: 'programas',
            profile: 'profile',
          },
        },
        auth: 'auth',
        onboarding: 'onboarding',
        'provider/[id]': 'provider/:id',
        'booking/[providerId]': 'booking/:providerId',
        'chat/[chatId]': 'chat/:chatId',
        'payment-success': 'payment-success',
        // NEW: 2Kommute deep linking
        'commute': 'commute',
        'commute/search': 'commute/search',
        'commute/driver': 'commute/driver',
        'commute/trip/[tripId]': 'commute/trip/:tripId',
      },
    },
  },
};

// Component patterns used in navigation
export const NavigationComponents = {
  // Custom header components
  headers: {
    default: 'Standard header with back button',
    search: 'Header with search input',
    profile: 'Header with avatar and settings',
    chat: 'Header with participant info and actions',
  },

  // Tab bar customizations
  tabBar: {
    style: 'iOS/Android adaptive styling',
    badges: 'Notification badges on chat/notifications',
    animations: 'Smooth transitions between tabs',
  },

  // Navigation helpers
  helpers: {
    goBack: 'router.back()',
    navigate: 'router.push()',
    replace: 'router.replace()',
    modal: 'router.push() with modal presentation',
  },
};

export default {
  ExistingTabsLayout,
  ExistingRootLayout,
  NavigationPatterns,
  RoutingConfig,
  NavigationComponents,
  KommuteIntegration,
};