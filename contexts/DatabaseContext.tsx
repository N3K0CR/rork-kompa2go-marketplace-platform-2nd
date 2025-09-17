import { useEffect, useState, useCallback, useMemo } from 'react';
import { Platform } from 'react-native';
import createContextHook from '@nkzw/create-context-hook';

// Mock functions for web
const mockQuery = () => Promise.resolve([]);
const mockFunction = () => Promise.resolve();

const mockQueries = {
  userQueries: {
    create: mockQuery,
    getById: mockQuery,
    getByEmail: mockQuery,
    update: mockQuery
  },
  serviceQueries: {
    getAll: mockQuery,
    getByCategory: mockQuery,
    search: mockQuery
  },
  providerQueries: {
    getById: mockQuery,
    getByLocation: mockQuery,
    getTopRated: mockQuery
  },
  appointmentQueries: {
    create: mockQuery,
    getByClientId: mockQuery,
    getByProviderId: mockQuery,
    updateStatus: mockQuery
  },
  chatQueries: {
    createMessage: mockQuery,
    getMessagesByChatId: mockQuery,
    getRecentChats: mockQuery
  },
  okoinsQueries: {
    createTransaction: mockQuery,
    getUserBalance: () => Promise.resolve(0),
    getUserTransactions: mockQuery
  },
  walletQueries: {
    createTransaction: mockQuery,
    getUserBalance: () => Promise.resolve(0),
    getUserTransactions: mockQuery
  },
  reviewQueries: {
    create: mockQuery,
    getByProviderId: mockQuery
  },
  runMigrations: mockFunction,
  seedDatabase: mockFunction
};

// Dynamic import function for native platforms
const loadDatabaseModules = async () => {
  if (Platform.OS === 'web') {
    return mockQueries;
  }
  
  try {
    const [dbModule, queriesModule] = await Promise.all([
      import('@/lib/db'),
      import('@/lib/db/queries')
    ]);
    
    return {
      runMigrations: dbModule.runMigrations,
      seedDatabase: dbModule.seedDatabase,
      userQueries: queriesModule.userQueries,
      serviceQueries: queriesModule.serviceQueries,
      providerQueries: queriesModule.providerQueries,
      appointmentQueries: queriesModule.appointmentQueries,
      chatQueries: queriesModule.chatQueries,
      okoinsQueries: queriesModule.okoinsQueries,
      walletQueries: queriesModule.walletQueries,
      reviewQueries: queriesModule.reviewQueries
    };
  } catch (error) {
    console.error('Failed to load database modules:', error);
    return mockQueries;
  }
};




export const [DatabaseProvider, useDatabaseContext] = createContextHook(() => {
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [dbModules, setDbModules] = useState<any>(mockQueries);

  const initializeDatabase = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('Initializing database...');
      
      // Load database modules dynamically
      const modules = await loadDatabaseModules();
      setDbModules(modules);
      
      if (Platform.OS === 'web') {
        console.log('Web platform - using mock database');
        setIsInitialized(true);
        console.log('Mock database initialized for web');
      } else {
        await modules.runMigrations();
        setIsInitialized(true);
        console.log('Database initialized successfully');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Database initialization failed';
      console.error('Database initialization error:', errorMessage);
      setError(errorMessage);
      
      // Fallback to mock data
      console.log('Falling back to mock database');
      setDbModules(mockQueries);
      setIsInitialized(true);
      setError(null);
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
        await dbModules.seedDatabase();
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
  }, [dbModules]);

  useEffect(() => {
    initializeDatabase();
  }, [initializeDatabase]);

  return useMemo(() => ({
    isInitialized,
    isLoading,
    error,
    
    // User operations
    createUser: dbModules.userQueries.create,
    getUserById: dbModules.userQueries.getById,
    getUserByEmail: dbModules.userQueries.getByEmail,
    updateUser: dbModules.userQueries.update,
    
    // Service operations
    getAllServices: dbModules.serviceQueries.getAll,
    getServicesByCategory: dbModules.serviceQueries.getByCategory,
    searchServices: dbModules.serviceQueries.search,
    
    // Provider operations
    getProviderById: dbModules.providerQueries.getById,
    getProvidersByLocation: dbModules.providerQueries.getByLocation,
    getTopRatedProviders: dbModules.providerQueries.getTopRated,
    
    // Appointment operations
    createAppointment: dbModules.appointmentQueries.create,
    getAppointmentsByClientId: dbModules.appointmentQueries.getByClientId,
    getAppointmentsByProviderId: dbModules.appointmentQueries.getByProviderId,
    updateAppointmentStatus: dbModules.appointmentQueries.updateStatus,
    
    // Chat operations
    createChatMessage: dbModules.chatQueries.createMessage,
    getChatMessages: dbModules.chatQueries.getMessagesByChatId,
    getRecentChats: dbModules.chatQueries.getRecentChats,
    
    // OKoins operations
    createOkoinsTransaction: dbModules.okoinsQueries.createTransaction,
    getOkoinsBalance: dbModules.okoinsQueries.getUserBalance,
    getOkoinsTransactions: dbModules.okoinsQueries.getUserTransactions,
    
    // Wallet operations
    createWalletTransaction: dbModules.walletQueries.createTransaction,
    getWalletBalance: dbModules.walletQueries.getUserBalance,
    getWalletTransactions: dbModules.walletQueries.getUserTransactions,
    
    // Review operations
    createReview: dbModules.reviewQueries.create,
    getProviderReviews: dbModules.reviewQueries.getByProviderId,
    
    // Utility functions
    initializeDatabase,
    seedData
  }), [isInitialized, isLoading, error, dbModules, initializeDatabase, seedData]);
});