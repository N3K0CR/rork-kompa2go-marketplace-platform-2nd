import { useEffect, useState, useCallback, useMemo } from 'react';
import { Platform } from 'react-native';
import createContextHook from '@nkzw/create-context-hook';
import { runMigrations, seedDatabase } from '@/lib/db';
import { 
  userQueries, 
  serviceQueries, 
  providerQueries, 
  appointmentQueries,
  chatQueries,
  okoinsQueries,
  walletQueries,
  reviewQueries
} from '@/lib/db/queries';




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