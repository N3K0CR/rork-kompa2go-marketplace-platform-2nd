import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import { getAnalytics } from 'firebase/analytics';

// Check if we're running in Node.js (backend) or React Native
const isNodeBackend = typeof process !== 'undefined' && process.versions && process.versions.node && typeof window === 'undefined';

// Use mock Platform for backend, real Platform for React Native
let Platform: { OS: 'web' | 'ios' | 'android'; select: (obj: any) => any };
if (isNodeBackend) {
  Platform = { 
    OS: 'web' as const, 
    select: (obj: any) => obj.default || obj.web 
  };
} else {
  Platform = require('react-native').Platform;
}

if (Platform.OS === 'web' && typeof window !== 'undefined') {
  if (!(window as any).Buffer) {
    (window as any).Buffer = {
      isBuffer: () => false,
    };
  }
  if (!(window as any).process) {
    (window as any).process = {
      env: {},
      version: '',
      nextTick: (fn: Function) => setTimeout(fn, 0),
    };
  }
}

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || "AIzaSyCCNEVP0CpDKz_anc1SD7t4tfiRr8rf3IE",
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || "kompa2go.firebaseapp.com",
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "kompa2go",
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || "kompa2go.firebasestorage.app",
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "1051491647613",
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || "1:1051491647613:web:d94b8f280873a8825ab114",
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-6PLGHQLNH0"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

export const analytics = Platform.OS === 'web' ? getAnalytics(app) : null;

export default app;
