import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  updateProfile,
  AuthError,
} from 'firebase/auth';
import { auth } from '@/lib/firebase';

interface FirebaseAuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName?: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateUserProfile: (displayName: string, photoURL?: string) => Promise<void>;
  clearError: () => void;
}

const FirebaseAuthContext = createContext<FirebaseAuthContextType | undefined>(undefined);

export function FirebaseAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        setUser(user);
        setLoading(false);
        console.log('[FirebaseAuth] Auth state changed:', user?.uid || 'No user');
      },
      (error) => {
        console.error('[FirebaseAuth] Auth state error:', error);
        setError(error.message);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, []);

  const handleAuthError = (error: AuthError) => {
    console.error('[FirebaseAuth] Auth error:', error.code, error.message);
    
    switch (error.code) {
      case 'auth/invalid-email':
        setError('Correo electrónico inválido');
        break;
      case 'auth/user-disabled':
        setError('Esta cuenta ha sido deshabilitada');
        break;
      case 'auth/user-not-found':
        setError('Usuario no encontrado');
        break;
      case 'auth/wrong-password':
        setError('Contraseña incorrecta');
        break;
      case 'auth/email-already-in-use':
        setError('Este correo ya está registrado');
        break;
      case 'auth/weak-password':
        setError('La contraseña debe tener al menos 6 caracteres');
        break;
      case 'auth/network-request-failed':
        setError('Error de conexión. Verifica tu internet');
        break;
      case 'auth/too-many-requests':
        setError('Demasiados intentos. Intenta más tarde');
        break;
      default:
        setError(error.message);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setError(null);
      setLoading(true);
      console.log('[FirebaseAuth] Signing in user:', email);
      await signInWithEmailAndPassword(auth, email, password);
      console.log('[FirebaseAuth] Sign in successful');
    } catch (error) {
      handleAuthError(error as AuthError);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, displayName?: string) => {
    try {
      setError(null);
      setLoading(true);
      console.log('[FirebaseAuth] Creating user:', email);
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      if (displayName && userCredential.user) {
        await updateProfile(userCredential.user, { displayName });
        console.log('[FirebaseAuth] Profile updated with display name');
      }
      
      console.log('[FirebaseAuth] Sign up successful');
    } catch (error) {
      handleAuthError(error as AuthError);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setError(null);
      console.log('[FirebaseAuth] Signing out user');
      await firebaseSignOut(auth);
      console.log('[FirebaseAuth] Sign out successful');
    } catch (error) {
      handleAuthError(error as AuthError);
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    try {
      setError(null);
      console.log('[FirebaseAuth] Sending password reset email to:', email);
      await sendPasswordResetEmail(auth, email);
      console.log('[FirebaseAuth] Password reset email sent');
    } catch (error) {
      handleAuthError(error as AuthError);
      throw error;
    }
  };

  const updateUserProfile = async (displayName: string, photoURL?: string) => {
    try {
      setError(null);
      if (!user) {
        throw new Error('No user logged in');
      }
      console.log('[FirebaseAuth] Updating user profile');
      await updateProfile(user, { displayName, photoURL });
      console.log('[FirebaseAuth] Profile updated successfully');
    } catch (error) {
      handleAuthError(error as AuthError);
      throw error;
    }
  };

  const clearError = () => {
    setError(null);
  };

  const value: FirebaseAuthContextType = {
    user,
    loading,
    error,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updateUserProfile,
    clearError,
  };

  return (
    <FirebaseAuthContext.Provider value={value}>
      {children}
    </FirebaseAuthContext.Provider>
  );
}

export function useFirebaseAuth(): FirebaseAuthContextType {
  const context = useContext(FirebaseAuthContext);
  if (context === undefined) {
    throw new Error('useFirebaseAuth must be used within a FirebaseAuthProvider');
  }
  return context;
}
