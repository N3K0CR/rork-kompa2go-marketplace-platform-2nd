import { useEffect, useState, useCallback, useMemo } from 'react';
import { Platform } from 'react-native';
import createContextHook from '@nkzw/create-context-hook';

// Platform-specific imports to avoid SharedArrayBuffer issues on web
let runMigrations: any, seedDatabase: any;
let userQueries: any, serviceQueries: any, providerQueries: any, appointmentQueries: any;
let chatQueries: any, okoinsQueries: any, walletQueries: any, reviewQueries: any;

if (Platform.OS !== 'web') {
  try {
    const dbModule = require('@/lib/db');
    const queriesModule = require('@/lib/db/queries');
    
    runMigrations = dbModule.runMigrations;
    seedDatabase = dbModule.seedDatabase;
    userQueries = queriesModule.userQueries;
    serviceQueries = queriesModule.serviceQueries;
    providerQueries = queriesModule.providerQueries;
    appointmentQueries = queriesModule.appointmentQueries;
    chatQueries = queriesModule.chatQueries;
    okoinsQueries = queriesModule.okoinsQueries;
    walletQueries = queriesModule.walletQueries;
    reviewQueries = queriesModule.reviewQueries;
  } catch (error) {
    console.error('Failed to load database modules:', error);
  }
} else {
  // Mock functions for web
  const mockQuery = () => Promise.resolve([]);
  const mockFunction = () => Promise.resolve();
  
  runMigrations = mockFunction;
  seedDatabase = mockFunction;
  userQueries = {
    create: mockQuery,
    getById: mockQuery,
    getByEmail: mockQuery,
    update: mockQuery
  };
  serviceQueries = {
    getAll: mockQuery,
    getByCategory: mockQuery,
    search: mockQuery
  };
  providerQueries = {
    getById: mockQuery,
    getByLocation: mockQuery,
    getTopRated: mockQuery
  };
  appointmentQueries = {
    create: mockQuery,
    getByClientId: mockQuery,
    getByProviderId: mockQuery,
    updateStatus: mockQuery
  };
  chatQueries = {
    createMessage: mockQuery,
    getMessagesByChatId: mockQuery,
    getRecentChats: mockQuery
  };
  okoinsQueries = {
    createTransaction: mockQuery,
    getUserBalance: () => Promise.resolve(0),
    getUserTransactions: mockQuery
  };
  walletQueries = {
    createTransaction: mockQuery,
    getUserBalance: () => Promise.resolve(0),
    getUserTransactions: mockQuery
  };
  reviewQueries = {
    create: mockQuery,
    getByProviderId: mockQuery
  };
}




export const [DatabaseProvider, useDatabaseContext] = createContextHook(() => {
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const initializeDatabase = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('Initializing database...');
      
      if (Platform.OS === 'web') {
        console.log('Web platform - skipping SQLite migrations');
        setIsInitialized(true);
        console.log('Mock database initialized for web');
      } else {
        await runMigrations();
        setIsInitialized(true);
        console.log('Database initialized successfully');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Database initialization failed';
      console.error('Database initialization error:', errorMessage);
      setError(errorMessage);
      
      // On web, don't fail completely - just use mock data
      if (Platform.OS === 'web') {
        console.log('Falling back to mock database on web');
        setIsInitialized(true);
        setError(null);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const seedData = useCallback(async () => {
    try {
      setError(null);
      console.log('Seeding database...');
      
      if (Platform.OS === 'web') {
        console.log('Web platform - skipping database seeding');
        console.log('Mock data available on web');
      } else {
        await seedDatabase();
        console.log('Database seeded successfully');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Database seeding failed';
      console.error('Database seeding error:', errorMessage);
      
      // On web, don't fail completely
      if (Platform.OS === 'web') {
        console.log('Seeding not required on web - using mock data');
      } else {
        setError(errorMessage);
      }
    }
  }, []);

  useEffect(() => {
    initializeDatabase();
  }, [initializeDatabase]);

  return useMemo(() => ({
    isInitialized,
    isLoading,
    error,
    
    // User operations
    createUser: userQueries.create,
    getUserById: userQueries.getById,
    getUserByEmail: userQueries.getByEmail,
    updateUser: userQueries.update,
    
    // Service operations
    getAllServices: serviceQueries.getAll,
    getServicesByCategory: serviceQueries.getByCategory,
    searchServices: serviceQueries.search,
    
    // Provider operations
    getProviderById: providerQueries.getById,
    getProvidersByLocation: providerQueries.getByLocation,
    getTopRatedProviders: providerQueries.getTopRated,
    
    // Appointment operations
    createAppointment: appointmentQueries.create,
    getAppointmentsByClientId: appointmentQueries.getByClientId,
    getAppointmentsByProviderId: appointmentQueries.getByProviderId,
    updateAppointmentStatus: appointmentQueries.updateStatus,
    
    // Chat operations
    createChatMessage: chatQueries.createMessage,
    getChatMessages: chatQueries.getMessagesByChatId,
    getRecentChats: chatQueries.getRecentChats,
    
    // OKoins operations
    createOkoinsTransaction: okoinsQueries.createTransaction,
    getOkoinsBalance: okoinsQueries.getUserBalance,
    getOkoinsTransactions: okoinsQueries.getUserTransactions,
    
    // Wallet operations
    createWalletTransaction: walletQueries.createTransaction,
    getWalletBalance: walletQueries.getUserBalance,
    getWalletTransactions: walletQueries.getUserTransactions,
    
    // Review operations
    createReview: reviewQueries.create,
    getProviderReviews: reviewQueries.getByProviderId,
    
    // Utility functions
    initializeDatabase,
    seedData
  }), [isInitialized, isLoading, error, initializeDatabase, seedData]);
});