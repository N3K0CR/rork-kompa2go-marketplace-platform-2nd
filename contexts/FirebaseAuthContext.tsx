import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
  updateProfile,
  sendPasswordResetEmail,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential
} from 'firebase/auth';
import { auth } from '@/lib/firebase';

interface FirebaseAuthContextType {
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  signInWithEmail: (email: string, password: string) => Promise<FirebaseUser>;
  signUpWithEmail: (email: string, password: string, displayName?: string) => Promise<FirebaseUser>;
  signOut: () => Promise<void>;
  updateUserProfile: (displayName?: string, photoURL?: string) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const FirebaseAuthContext = createContext<FirebaseAuthContextType | undefined>(undefined);

export function FirebaseAuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log('[FirebaseAuth] Auth state changed:', user?.uid);
      setFirebaseUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithEmail = async (email: string, password: string): Promise<FirebaseUser> => {
    try {
      console.log('[FirebaseAuth] Signing in with email:', email);
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log('[FirebaseAuth] Sign in successful:', userCredential.user.uid);
      return userCredential.user;
    } catch (error: any) {
      console.error('[FirebaseAuth] Sign in error:', error);
      throw new Error(getAuthErrorMessage(error.code));
    }
  };

  const signUpWithEmail = async (
    email: string, 
    password: string, 
    displayName?: string
  ): Promise<FirebaseUser> => {
    try {
      console.log('[FirebaseAuth] Creating user with email:', email);
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      if (displayName && userCredential.user) {
        await updateProfile(userCredential.user, { displayName });
        console.log('[FirebaseAuth] Profile updated with display name:', displayName);
      }
      
      console.log('[FirebaseAuth] Sign up successful:', userCredential.user.uid);
      return userCredential.user;
    } catch (error: any) {
      console.error('[FirebaseAuth] Sign up error:', error);
      throw new Error(getAuthErrorMessage(error.code));
    }
  };

  const signOut = async (): Promise<void> => {
    try {
      console.log('[FirebaseAuth] Signing out...');
      await firebaseSignOut(auth);
      console.log('[FirebaseAuth] Sign out successful');
    } catch (error: any) {
      console.error('[FirebaseAuth] Sign out error:', error);
      throw new Error('Error al cerrar sesión');
    }
  };

  const updateUserProfile = async (displayName?: string, photoURL?: string): Promise<void> => {
    try {
      if (!firebaseUser) {
        throw new Error('No hay usuario autenticado');
      }

      console.log('[FirebaseAuth] Updating profile...');
      await updateProfile(firebaseUser, {
        displayName: displayName || firebaseUser.displayName,
        photoURL: photoURL || firebaseUser.photoURL,
      });
      console.log('[FirebaseAuth] Profile updated successfully');
    } catch (error: any) {
      console.error('[FirebaseAuth] Update profile error:', error);
      throw new Error('Error al actualizar el perfil');
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string): Promise<void> => {
    try {
      if (!firebaseUser || !firebaseUser.email) {
        throw new Error('No hay usuario autenticado');
      }

      console.log('[FirebaseAuth] Changing password...');
      
      const credential = EmailAuthProvider.credential(firebaseUser.email, currentPassword);
      await reauthenticateWithCredential(firebaseUser, credential);
      
      await updatePassword(firebaseUser, newPassword);
      console.log('[FirebaseAuth] Password changed successfully');
    } catch (error: any) {
      console.error('[FirebaseAuth] Change password error:', error);
      throw new Error(getAuthErrorMessage(error.code));
    }
  };

  const resetPassword = async (email: string): Promise<void> => {
    try {
      console.log('[FirebaseAuth] Sending password reset email to:', email);
      await sendPasswordResetEmail(auth, email);
      console.log('[FirebaseAuth] Password reset email sent');
    } catch (error: any) {
      console.error('[FirebaseAuth] Reset password error:', error);
      throw new Error(getAuthErrorMessage(error.code));
    }
  };

  const value: FirebaseAuthContextType = {
    firebaseUser,
    loading,
    signInWithEmail,
    signUpWithEmail,
    signOut,
    updateUserProfile,
    changePassword,
    resetPassword,
  };

  return (
    <FirebaseAuthContext.Provider value={value}>
      {children}
    </FirebaseAuthContext.Provider>
  );
}

export function useFirebaseAuth() {
  const context = useContext(FirebaseAuthContext);
  if (context === undefined) {
    throw new Error('useFirebaseAuth must be used within a FirebaseAuthProvider');
  }
  return context;
}

function getAuthErrorMessage(errorCode: string): string {
  switch (errorCode) {
    case 'auth/email-already-in-use':
      return 'Este correo electrónico ya está en uso';
    case 'auth/invalid-email':
      return 'Correo electrónico inválido';
    case 'auth/operation-not-allowed':
      return 'Operación no permitida';
    case 'auth/weak-password':
      return 'La contraseña es muy débil (mínimo 6 caracteres)';
    case 'auth/user-disabled':
      return 'Esta cuenta ha sido deshabilitada';
    case 'auth/user-not-found':
      return 'Usuario no encontrado. Por favor regístrate primero';
    case 'auth/wrong-password':
      return 'Contraseña incorrecta';
    case 'auth/invalid-credential':
      return 'Credenciales inválidas. Si no tienes cuenta, regístrate primero';
    case 'auth/too-many-requests':
      return 'Demasiados intentos. Intenta más tarde';
    case 'auth/network-request-failed':
      return 'Error de conexión. Verifica tu internet';
    case 'auth/requires-recent-login':
      return 'Por seguridad, debes iniciar sesión nuevamente';
    default:
      return 'Error de autenticación';
  }
}

export default FirebaseAuthContext;
