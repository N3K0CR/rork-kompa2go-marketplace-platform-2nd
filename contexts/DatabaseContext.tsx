import { useEffect, useState, useCallback, useMemo } from 'react';
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
      await runMigrations();
      
      setIsInitialized(true);
      console.log('Database initialized successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Database initialization failed';
      console.error('Database initialization error:', errorMessage);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const seedData = useCallback(async () => {
    try {
      setError(null);
      console.log('Seeding database...');
      await seedDatabase();
      console.log('Database seeded successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Database seeding failed';
      console.error('Database seeding error:', errorMessage);
      setError(errorMessage);
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