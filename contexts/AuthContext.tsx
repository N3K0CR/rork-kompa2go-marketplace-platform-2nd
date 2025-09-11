import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, userData: Partial<User>) => Promise<void>;
  signOut: () => Promise<void>;
  switchRole: (email: string, password: string, targetRole: 'client' | 'provider') => Promise<void>;
  getAvailableRoles: (email: string) => ('client' | 'provider')[];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStoredUser();
  }, []);

  const loadStoredUser = async () => {
    try {
      const storedUser = await AsyncStorage.getItem('user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error('Error loading stored user:', error);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Test users as specified
      const testUsers = [
        // Admin users
        { email: 'agostounonueve@gmail.com', password: 'kompa2go_admin12025', name: 'Neko1', alias: 'Neko1', userType: 'admin' as const },
        { email: 'onlycr@yahoo.com', password: 'kompa2go_admin22025', name: 'Neko2', alias: 'Neko2', userType: 'admin' as const },
        
        // Provider users
        { email: 'agostounonueve@gmail.com', password: 'kompa2go_2kompa12025', name: 'Proveedor Demo 1', alias: '2kompa1', userType: 'provider' as const },
        { email: 'onlycr@yahoo.com', password: 'kompa2go_2kompa22025', name: 'Proveedor Demo 2', alias: '2kompa2', userType: 'provider' as const },
        
        // Client users
        { email: 'agostounonueve@gmail.com', password: 'kompa2go_mikompa12025', name: 'Cliente Demo 1', alias: 'mikompa1', userType: 'client' as const },
        { email: 'onlycr@yahoo.com', password: 'kompa2go_mikompa22025', name: 'Cliente Demo 2', alias: 'mikompa2', userType: 'client' as const },
      ];
      
      // Find matching user
      const testUser = testUsers.find(user => user.email === email && user.password === password);
      
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
          uniqueId: testUser.userType === 'client' ? `MK${String(Math.floor(Math.random() * 100000)).padStart(8, '0')}` : 
                   testUser.userType === 'provider' ? `2K${String(Math.floor(Math.random() * 100000)).padStart(8, '0')}` : undefined,
        };
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
        };
      }

      await AsyncStorage.setItem('user', JSON.stringify(mockUser));
      setUser(mockUser);
    } catch (error) {
      throw new Error('Error al iniciar sesión');
    }
  };

  const signUp = async (email: string, password: string, userData: Partial<User>) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const newUser: User = {
        id: Date.now().toString(),
        email,
        name: userData.name || 'Usuario',
        phone: userData.phone,
        location: userData.location,
        userType: userData.userType || 'client',
      };

      await AsyncStorage.setItem('user', JSON.stringify(newUser));
      setUser(newUser);
    } catch (error) {
      throw new Error('Error al crear cuenta');
    }
  };

  const signOut = async () => {
    try {
      await AsyncStorage.removeItem('user');
      setUser(null);
    } catch (error) {
      console.error('Error signing out:', error);
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
        uniqueId: testUser.userType === 'client' ? `MK${String(Math.floor(Math.random() * 100000)).padStart(8, '0')}` : 
                 testUser.userType === 'provider' ? `2K${String(Math.floor(Math.random() * 100000)).padStart(8, '0')}` : undefined,
      };

      await AsyncStorage.setItem('user', JSON.stringify(mockUser));
      setUser(mockUser);
    } catch (error: any) {
      throw new Error(error.message || 'Error al cambiar de rol');
    }
  };

  const getAvailableRoles = (email: string): ('client' | 'provider')[] => {
    const availableRoles: ('client' | 'provider')[] = [];
    
    // Check if email has provider role available
    if (email === 'agostounonueve@gmail.com' || email === 'onlycr@yahoo.com') {
      availableRoles.push('provider', 'client');
    }
    
    return availableRoles;
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut, switchRole, getAvailableRoles }}>
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