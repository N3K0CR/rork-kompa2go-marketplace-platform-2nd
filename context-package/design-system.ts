// Design system for Kompa2Go application
import { Platform } from 'react-native';

// Color palette
export const Colors = {
  // Primary colors
  primary: {
    50: '#EBF8FF',
    100: '#BEE3F8',
    200: '#90CDF4',
    300: '#63B3ED',
    400: '#4299E1',
    500: '#3182CE', // Main primary
    600: '#2B77CB',
    700: '#2C5282',
    800: '#2A4365',
    900: '#1A365D',
  },

  // Secondary colors
  secondary: {
    50: '#F7FAFC',
    100: '#EDF2F7',
    200: '#E2E8F0',
    300: '#CBD5E0',
    400: '#A0AEC0',
    500: '#718096',
    600: '#4A5568',
    700: '#2D3748',
    800: '#1A202C',
    900: '#171923',
  },

  // Success colors
  success: {
    50: '#F0FFF4',
    100: '#C6F6D5',
    200: '#9AE6B4',
    300: '#68D391',
    400: '#48BB78',
    500: '#38A169', // Main success
    600: '#2F855A',
    700: '#276749',
    800: '#22543D',
    900: '#1C4532',
  },

  // Warning colors
  warning: {
    50: '#FFFBEB',
    100: '#FEF3C7',
    200: '#FDE68A',
    300: '#FCD34D',
    400: '#FBBF24',
    500: '#F59E0B', // Main warning
    600: '#D97706',
    700: '#B45309',
    800: '#92400E',
    900: '#78350F',
  },

  // Error colors
  error: {
    50: '#FEF2F2',
    100: '#FEE2E2',
    200: '#FECACA',
    300: '#FCA5A5',
    400: '#F87171',
    500: '#EF4444', // Main error
    600: '#DC2626',
    700: '#B91C1C',
    800: '#991B1B',
    900: '#7F1D1D',
  },

  // Neutral colors
  neutral: {
    50: '#FAFAFA',
    100: '#F5F5F5',
    200: '#E5E5E5',
    300: '#D4D4D4',
    400: '#A3A3A3',
    500: '#737373',
    600: '#525252',
    700: '#404040',
    800: '#262626',
    900: '#171717',
  },

  // Platform-specific colors
  ios: {
    blue: '#007AFF',
    green: '#34C759',
    indigo: '#5856D6',
    orange: '#FF9500',
    pink: '#FF2D92',
    purple: '#AF52DE',
    red: '#FF3B30',
    teal: '#5AC8FA',
    yellow: '#FFCC00',
    gray: '#8E8E93',
    gray2: '#AEAEB2',
    gray3: '#C7C7CC',
    gray4: '#D1D1D6',
    gray5: '#E5E5EA',
    gray6: '#F2F2F7',
  },

  android: {
    blue: '#2196F3',
    green: '#4CAF50',
    orange: '#FF9800',
    red: '#F44336',
    purple: '#9C27B0',
    teal: '#009688',
    yellow: '#FFEB3B',
    gray: '#9E9E9E',
  },
};

// Typography
export const Typography = {
  // Font families
  fontFamily: Platform.select({
    ios: {
      regular: 'System',
      medium: 'System',
      semiBold: 'System',
      bold: 'System',
    },
    android: {
      regular: 'Roboto',
      medium: 'Roboto-Medium',
      semiBold: 'Roboto-Medium',
      bold: 'Roboto-Bold',
    },
    web: {
      regular: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      medium: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      semiBold: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      bold: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    },
  }),

  // Font sizes
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
    '5xl': 48,
    '6xl': 60,
  },

  // Font weights
  fontWeight: {
    normal: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },

  // Line heights
  lineHeight: {
    tight: 1.25,
    snug: 1.375,
    normal: 1.5,
    relaxed: 1.625,
    loose: 2,
  },

  // Text styles
  textStyles: {
    h1: {
      fontSize: 36,
      fontWeight: '700' as const,
      lineHeight: 1.25,
    },
    h2: {
      fontSize: 30,
      fontWeight: '700' as const,
      lineHeight: 1.25,
    },
    h3: {
      fontSize: 24,
      fontWeight: '600' as const,
      lineHeight: 1.375,
    },
    h4: {
      fontSize: 20,
      fontWeight: '600' as const,
      lineHeight: 1.375,
    },
    h5: {
      fontSize: 18,
      fontWeight: '600' as const,
      lineHeight: 1.375,
    },
    h6: {
      fontSize: 16,
      fontWeight: '600' as const,
      lineHeight: 1.375,
    },
    body: {
      fontSize: 16,
      fontWeight: '400' as const,
      lineHeight: 1.5,
    },
    bodySmall: {
      fontSize: 14,
      fontWeight: '400' as const,
      lineHeight: 1.5,
    },
    caption: {
      fontSize: 12,
      fontWeight: '400' as const,
      lineHeight: 1.375,
    },
    button: {
      fontSize: 16,
      fontWeight: '600' as const,
      lineHeight: 1.25,
    },
    buttonSmall: {
      fontSize: 14,
      fontWeight: '600' as const,
      lineHeight: 1.25,
    },
  },
};

// Spacing system
export const Spacing = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  7: 28,
  8: 32,
  9: 36,
  10: 40,
  12: 48,
  16: 64,
  20: 80,
  24: 96,
  32: 128,
  40: 160,
  48: 192,
  56: 224,
  64: 256,
};

// Border radius
export const BorderRadius = {
  none: 0,
  sm: 4,
  base: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  full: 9999,
};

// Shadows
export const Shadows = {
  sm: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
    },
    android: {
      elevation: 2,
    },
    web: {
      boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    },
  }),

  base: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 3,
    },
    android: {
      elevation: 3,
    },
    web: {
      boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    },
  }),

  md: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 6,
    },
    android: {
      elevation: 6,
    },
    web: {
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    },
  }),

  lg: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.15,
      shadowRadius: 15,
    },
    android: {
      elevation: 10,
    },
    web: {
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    },
  }),

  xl: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 20 },
      shadowOpacity: 0.25,
      shadowRadius: 25,
    },
    android: {
      elevation: 15,
    },
    web: {
      boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    },
  }),
};

// Component styles
export const ComponentStyles = {
  // Button styles
  button: {
    primary: {
      backgroundColor: Colors.primary[500],
      borderRadius: BorderRadius.md,
      paddingHorizontal: Spacing[6],
      paddingVertical: Spacing[3],
      ...Shadows.sm,
    },
    secondary: {
      backgroundColor: Colors.neutral[100],
      borderRadius: BorderRadius.md,
      paddingHorizontal: Spacing[6],
      paddingVertical: Spacing[3],
      borderWidth: 1,
      borderColor: Colors.neutral[300],
    },
    outline: {
      backgroundColor: 'transparent',
      borderRadius: BorderRadius.md,
      paddingHorizontal: Spacing[6],
      paddingVertical: Spacing[3],
      borderWidth: 1,
      borderColor: Colors.primary[500],
    },
    ghost: {
      backgroundColor: 'transparent',
      borderRadius: BorderRadius.md,
      paddingHorizontal: Spacing[6],
      paddingVertical: Spacing[3],
    },
  },

  // Input styles
  input: {
    base: {
      borderRadius: BorderRadius.md,
      borderWidth: 1,
      borderColor: Colors.neutral[300],
      paddingHorizontal: Spacing[4],
      paddingVertical: Spacing[3],
      fontSize: Typography.fontSize.base,
      backgroundColor: Colors.neutral[50],
    },
    focused: {
      borderColor: Colors.primary[500],
      backgroundColor: '#fff',
      ...Shadows.sm,
    },
    error: {
      borderColor: Colors.error[500],
      backgroundColor: Colors.error[50],
    },
  },

  // Card styles
  card: {
    base: {
      backgroundColor: '#fff',
      borderRadius: BorderRadius.lg,
      padding: Spacing[4],
      ...Shadows.base,
    },
    elevated: {
      backgroundColor: '#fff',
      borderRadius: BorderRadius.lg,
      padding: Spacing[6],
      ...Shadows.lg,
    },
    outlined: {
      backgroundColor: '#fff',
      borderRadius: BorderRadius.lg,
      padding: Spacing[4],
      borderWidth: 1,
      borderColor: Colors.neutral[200],
    },
  },

  // Modal styles
  modal: {
    overlay: {
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: Spacing[4],
    },
    content: {
      backgroundColor: '#fff',
      borderRadius: BorderRadius.xl,
      padding: Spacing[6],
      maxWidth: '90%',
      width: '100%',
      ...Shadows.xl,
    },
  },

  // Tab bar styles
  tabBar: {
    base: Platform.select({
      ios: {
        backgroundColor: Colors.ios.gray6,
        borderTopColor: Colors.ios.gray4,
        borderTopWidth: 0.5,
      },
      android: {
        backgroundColor: '#fff',
        borderTopColor: Colors.neutral[200],
        borderTopWidth: 1,
        elevation: 8,
      },
      web: {
        backgroundColor: '#fff',
        borderTopColor: Colors.neutral[200],
        borderTopWidth: 1,
        boxShadow: '0 -2px 8px rgba(0, 0, 0, 0.1)',
      },
    }),
  },

  // Header styles
  header: {
    base: Platform.select({
      ios: {
        backgroundColor: Colors.ios.gray6,
        borderBottomColor: Colors.ios.gray4,
        borderBottomWidth: 0.5,
      },
      android: {
        backgroundColor: Colors.primary[500],
        elevation: 4,
      },
      web: {
        backgroundColor: '#fff',
        borderBottomColor: Colors.neutral[200],
        borderBottomWidth: 1,
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
      },
    }),
  },
};

// Animation configurations
export const Animations = {
  // Timing configurations
  timing: {
    fast: 200,
    normal: 300,
    slow: 500,
  },

  // Easing functions
  easing: {
    linear: 'linear',
    ease: 'ease',
    easeIn: 'ease-in',
    easeOut: 'ease-out',
    easeInOut: 'ease-in-out',
  },

  // Common animation presets
  presets: {
    fadeIn: {
      from: { opacity: 0 },
      to: { opacity: 1 },
      duration: 300,
    },
    slideInUp: {
      from: { transform: [{ translateY: 50 }], opacity: 0 },
      to: { transform: [{ translateY: 0 }], opacity: 1 },
      duration: 300,
    },
    slideInDown: {
      from: { transform: [{ translateY: -50 }], opacity: 0 },
      to: { transform: [{ translateY: 0 }], opacity: 1 },
      duration: 300,
    },
    scaleIn: {
      from: { transform: [{ scale: 0.8 }], opacity: 0 },
      to: { transform: [{ scale: 1 }], opacity: 1 },
      duration: 300,
    },
  },
};

// Layout configurations
export const Layout = {
  // Container widths
  container: {
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
  },

  // Screen breakpoints
  breakpoints: {
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
  },

  // Safe area configurations
  safeArea: {
    paddingTop: Platform.select({
      ios: 44, // Status bar height
      android: 24,
      web: 0,
    }),
    paddingBottom: Platform.select({
      ios: 34, // Home indicator height
      android: 0,
      web: 0,
    }),
  },
};

// Icon configurations
export const Icons = {
  // Icon sizes
  sizes: {
    xs: 12,
    sm: 16,
    base: 20,
    lg: 24,
    xl: 32,
    '2xl': 40,
    '3xl': 48,
  },

  // Common icon mappings
  mapping: {
    home: 'Home',
    search: 'Search',
    calendar: 'Calendar',
    chat: 'MessageCircle',
    analytics: 'BarChart',
    programs: 'Gift',
    profile: 'User',
    back: 'ArrowLeft',
    close: 'X',
    menu: 'Menu',
    settings: 'Settings',
    notification: 'Bell',
    heart: 'Heart',
    star: 'Star',
    location: 'MapPin',
    phone: 'Phone',
    email: 'Mail',
    camera: 'Camera',
    gallery: 'Image',
    edit: 'Edit',
    delete: 'Trash2',
    add: 'Plus',
    check: 'Check',
    warning: 'AlertTriangle',
    error: 'AlertCircle',
    info: 'Info',
    success: 'CheckCircle',
  },
};

// Theme configuration
export const Theme = {
  light: {
    colors: {
      primary: Colors.primary[500],
      background: '#fff',
      surface: Colors.neutral[50],
      text: Colors.neutral[900],
      textSecondary: Colors.neutral[600],
      border: Colors.neutral[200],
      error: Colors.error[500],
      success: Colors.success[500],
      warning: Colors.warning[500],
    },
  },
  dark: {
    colors: {
      primary: Colors.primary[400],
      background: Colors.neutral[900],
      surface: Colors.neutral[800],
      text: Colors.neutral[100],
      textSecondary: Colors.neutral[400],
      border: Colors.neutral[700],
      error: Colors.error[400],
      success: Colors.success[400],
      warning: Colors.warning[400],
    },
  },
};

export default {
  Colors,
  Typography,
  Spacing,
  BorderRadius,
  Shadows,
  ComponentStyles,
  Animations,
  Layout,
  Icons,
  Theme,
};