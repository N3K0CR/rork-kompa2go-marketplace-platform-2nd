import { Platform } from 'react-native';

export const GOOGLE_MAPS_API_KEY = Platform.select({
  ios: process.env.EXPO_PUBLIC_GOOGLE_MAPS_IOS_KEY || process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY,
  android: process.env.EXPO_PUBLIC_GOOGLE_MAPS_ANDROID_KEY || process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY,
  web: process.env.EXPO_PUBLIC_GOOGLE_MAPS_WEB_KEY || process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY,
  default: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY,
});

export function validateGoogleMapsConfig(): boolean {
  if (!GOOGLE_MAPS_API_KEY) {
    console.error('❌ Google Maps API Key no configurada');
    return false;
  }
  
  console.log('✅ Google Maps API Key configurada');
  return true;
}

export const GOOGLE_MAPS_CONFIG = {
  defaultCountry: 'cr',
  defaultLanguage: 'es',
  defaultLocation: {
    latitude: 9.7489,
    longitude: -84.0833,
  },
  defaultRadius: 50000,
};
