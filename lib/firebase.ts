import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import { getAnalytics } from 'firebase/analytics';
import { Platform } from 'react-native';

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
  apiKey: "AIzaSyCCNEVP0CpDKz_anc1SD7t4tfiRr8rf3IE",
  authDomain: "kompa2go.firebaseapp.com",
  projectId: "kompa2go",
  storageBucket: "kompa2go.firebasestorage.app",
  messagingSenderId: "1051491647613",
  appId: "1:1051491647613:web:d94b8f280873a8825ab114",
  measurementId: "G-6PLGHQLNH0"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

export const analytics = Platform.OS === 'web' ? getAnalytics(app) : null;

export default app;
