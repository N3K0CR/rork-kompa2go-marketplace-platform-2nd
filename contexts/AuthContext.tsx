import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setAuthToken } from '@/lib/trpc';
import { useFirebaseAuth } from './FirebaseAuthContext';

interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  location?: string;
  userType: 'client' | 'provider' | 'admin';
  okoins?: number;
  walletBalance?: number;
  uniqueId?: string;
  alias?: string;
  isSpecialProvider?: boolean;
  isAmbulante?: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, userData: Partial<User>) => Promise<void>;
  signOut: () => Promise<void>;
  switchRole: (email: string, password: string, targetRole: 'client' | 'provider') => Promise<void>;
  getAvailableRoles: (email: string) => ('client' | 'provider')[];
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { firebaseUser } = useFirebaseAuth();

  useEffect(() => {
    loadStoredUser();
  }, []);

  useEffect(() => {
    if (!firebaseUser && user) {
      console.log('[AuthContext] Firebase user signed out, clearing app user');
      setUser(null);
      AsyncStorage.removeItem('user');
      setAuthToken(null);
    }
  }, [firebaseUser]);

  const loadStoredUser = async () => {
    try {
      const storedUser = await AsyncStorage.getItem('user');
      if (storedUser) {
        const user = JSON.parse(storedUser);
        setUser(user);
        
        // Set auth token for tRPC client
        const token = user.userType === 'admin' ? 'admin-token' : 'client-token';
        setAuthToken(token);
      }
    } catch (error) {
      console.error('Error loading stored user:', error);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to generate unique IDs
  const generateUniqueId = (userType: 'client' | 'provider', existingIds: string[] = []): string => {
    let newId: string;
    let attempts = 0;
    const maxAttempts = 100;
    
    do {
      if (userType === 'client') {
        // MKP + 5 alphanumeric characters
        const alphanumeric = Math.random().toString(36).substring(2, 7).toUpperCase();
        newId = `MKP${alphanumeric}`;
      } else {
        // 2KP + 5 alphanumeric characters
        const alphanumeric = Math.random().toString(36).substring(2, 7).toUpperCase();
        newId = `2KP${alphanumeric}`;
      }
      attempts++;
    } while (existingIds.includes(newId) && attempts < maxAttempts);
    
    return newId;
  };

  const signIn = async (email: string, password: string) => {
    try {
      if (!firebaseUser) {
        throw new Error('Debe autenticarse con Firebase primero');
      }
      
      // Test users as specified
      const testUsers = [
        // Admin users
        { email: 'agostounonueve@gmail.com', password: 'kompa2go_admin12025', name: 'Neko1', alias: 'Neko1', userType: 'admin' as const },
        { email: 'onlycr@yahoo.com', password: 'kompa2go_admin22025', name: 'Neko2', alias: 'Neko2', userType: 'admin' as const },
        
        // Provider users
        { email: 'agostounonueve@gmail.com', password: 'kompa2go_2kompa12025', name: 'Proveedor Demo 1', alias: '2kompa1', userType: 'provider' as const, uniqueId: '2KPAB123' },
        { email: 'onlycr@yahoo.com', password: 'kompa2go_2kompa22025', name: 'Proveedor Demo 2', alias: '2kompa2', userType: 'provider' as const, uniqueId: '2KPCD456' },
        
        // Sakura Beauty Salon - Special provider with unrestricted access
        { email: 'Marfanar@', password: 'lov3myJob25', name: 'Sakura Beauty Salon', alias: 'sakura', userType: 'provider' as const, isSpecialProvider: true, uniqueId: '2KPSK789' },
        
        // Client users
        { email: 'agostounonueve@gmail.com', password: 'kompa2go_mikompa12025', name: 'Cliente Demo 1', alias: 'mikompa1', userType: 'client' as const, uniqueId: 'MKPXY123' },
        { email: 'onlycr@yahoo.com', password: 'kompa2go_mikompa22025', name: 'Cliente Demo 2', alias: 'mikompa2', userType: 'client' as const, uniqueId: 'MKPZW456' },
      ];
      
      console.log('🔍 SignIn attempt:', { email, password });
      console.log('🔍 Available test users:', testUsers.map(u => ({ email: u.email, password: u.password, userType: u.userType, name: u.name })));
      
      // Find matching user
      const testUser = testUsers.find(user => user.email === email && user.password === password);
      
      console.log('🔍 Found test user:', testUser);
      
      let mockUser: User;
      if (testUser) {
        mockUser = {
          id: `${testUser.userType}_${testUser.alias}`,
          email,
          name: testUser.name,
          alias: testUser.alias,
          userType: testUser.userType,
          phone: testUser.userType === 'provider' ? '+506 8888-8888' : '+506 7777-7777',
          location: 'San José',
          okoins: testUser.userType === 'client' ? 100 : 0,
          walletBalance: testUser.userType === 'client' ? 0 : undefined,
          uniqueId: (testUser as any).uniqueId || (testUser.userType === 'client' || testUser.userType === 'provider' ? generateUniqueId(testUser.userType) : undefined),
          isSpecialProvider: (testUser as any).isSpecialProvider || false,
        };
        console.log('✅ Created mock user:', mockUser);
      } else if (email.includes('admin')) {
        mockUser = {
          id: '1',
          email,
          name: 'Administrador',
          userType: 'admin',
        };
      } else if (email.includes('provider') || email.includes('2kompa')) {
        mockUser = {
          id: '2',
          email,
          name: 'Proveedor Demo',
          phone: '+506 8888-8888',
          location: 'San José',
          userType: 'provider',
          uniqueId: generateUniqueId('provider'),
        };
      } else {
        mockUser = {
          id: '3',
          email,
          name: 'Cliente Demo',
          phone: '+506 7777-7777',
          location: 'San José',
          userType: 'client',
          okoins: 100,
          walletBalance: 0,
          uniqueId: generateUniqueId('client'),
        };
      }

      await AsyncStorage.setItem('user', JSON.stringify(mockUser));
      console.log('✅ User saved to storage and state:', mockUser);
      
      // Set auth token for tRPC client
      const token = mockUser.userType === 'admin' ? 'admin-token' : 'client-token';
      setAuthToken(token);
      
      setUser(mockUser);
    } catch (error) {
      throw new Error('Error al iniciar sesión');
    }
  };

  const signUp = async (email: string, password: string, userData: Partial<User>) => {
    try {
      if (!firebaseUser) {
        throw new Error('Debe autenticarse con Firebase primero');
      }
      
      const userType = userData.userType || 'client';
      const uniqueId = userType !== 'admin' ? generateUniqueId(userType) : undefined;
      
      const newUser: User = {
        id: Date.now().toString(),
        email,
        name: userData.name || 'Usuario',
        phone: userData.phone,
        location: userData.location,
        userType,
        uniqueId,
        okoins: userType === 'client' ? 100 : 0,
        walletBalance: userType === 'client' ? 0 : undefined,
      };

      await AsyncStorage.setItem('user', JSON.stringify(newUser));
      console.log('✅ New user created with ID:', uniqueId);
      
      // Set auth token for tRPC client
      const token = newUser.userType === 'admin' ? 'admin-token' : 'client-token';
      setAuthToken(token);
      
      setUser(newUser);
    } catch (error) {
      throw new Error('Error al crear cuenta');
    }
  };

  const signOut = async () => {
    try {
      console.log('🔄 Starting signOut process...');
      
      // Clear user state first to prevent UI issues
      setUser(null);
      console.log('✅ User state cleared');
      
      // Clear auth token
      setAuthToken(null);
      console.log('✅ Auth token cleared');
      
      // Remove from storage
      await AsyncStorage.removeItem('user');
      console.log('✅ User removed from AsyncStorage');
      
      // Force a small delay to ensure all state updates are processed
      await new Promise(resolve => setTimeout(resolve, 50));
      console.log('✅ SignOut process completed successfully');
      
    } catch (error) {
      console.error('❌ Error signing out:', error);
      // Even if there's an error, clear the user state
      setUser(null);
      setAuthToken(null);
      throw error; // Re-throw to let the caller handle it
    }
  };

  const switchRole = async (email: string, password: string, targetRole: 'client' | 'provider') => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Test users for role switching
      const testUsers = [
        // Provider users
        { email: 'agostounonueve@gmail.com', password: 'kompa2go_2kompa12025', name: 'Proveedor Demo 1', alias: '2kompa1', userType: 'provider' as const },
        { email: 'onlycr@yahoo.com', password: 'kompa2go_2kompa22025', name: 'Proveedor Demo 2', alias: '2kompa2', userType: 'provider' as const },
        { email: 'Marfanar@', password: 'lov3myJob25', name: 'Sakura Beauty Salon', alias: 'sakura', userType: 'provider' as const, isSpecialProvider: true },
        
        // Client users
        { email: 'agostounonueve@gmail.com', password: 'kompa2go_mikompa12025', name: 'Cliente Demo 1', alias: 'mikompa1', userType: 'client' as const },
        { email: 'onlycr@yahoo.com', password: 'kompa2go_mikompa22025', name: 'Cliente Demo 2', alias: 'mikompa2', userType: 'client' as const },
      ];
      
      // Find matching user with target role
      const testUser = testUsers.find(user => user.email === email && user.password === password && user.userType === targetRole);
      
      if (!testUser) {
        throw new Error('Credenciales incorrectas para el rol seleccionado');
      }
      
      const mockUser: User = {
        id: `${testUser.userType}_${testUser.alias}`,
        email,
        name: testUser.name,
        alias: testUser.alias,
        userType: testUser.userType,
        phone: testUser.userType === 'provider' ? '+506 8888-8888' : '+506 7777-7777',
        location: 'San José',
        okoins: testUser.userType === 'client' ? 100 : 0,
        walletBalance: testUser.userType === 'client' ? 0 : undefined,
        uniqueId: (testUser as any).uniqueId || (testUser.userType === 'client' || testUser.userType === 'provider' ? generateUniqueId(testUser.userType) : undefined),
        isSpecialProvider: (testUser as any).isSpecialProvider || false,
      };

      await AsyncStorage.setItem('user', JSON.stringify(mockUser));
      
      // Set auth token for tRPC client
      const token = mockUser.userType === 'admin' ? 'admin-token' : 'client-token';
      setAuthToken(token);
      
      setUser(mockUser);
    } catch (error: any) {
      throw new Error(error.message || 'Error al cambiar de rol');
    }
  };

  const getAvailableRoles = (email: string): ('client' | 'provider')[] => {
    const availableRoles: ('client' | 'provider')[] = [];
    
    // Check if email has provider role available
    if (email === 'agostounonueve@gmail.com' || email === 'onlycr@yahoo.com' || email === 'Marfanar@') {
      availableRoles.push('provider', 'client');
    }
    
    return availableRoles;
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (!user) {
        throw new Error('Usuario no autenticado');
      }
      
      // In a real app, you would verify the current password with the server
      // For demo purposes, we'll just simulate success
      console.log('Password changed successfully for user:', user.email);
      
      // In a real implementation, you might want to force re-login after password change
      // await signOut();
    } catch (error: any) {
      throw new Error(error.message || 'Error al cambiar la contraseña');
    }
  };

  const resetPassword = async (email: string) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // In a real app, this would send a password reset email
      console.log('Password reset email sent to:', email);
    } catch (error: any) {
      throw new Error(error.message || 'Error al enviar el correo de recuperación');
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut, switchRole, getAvailableRoles, changePassword, resetPassword }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}