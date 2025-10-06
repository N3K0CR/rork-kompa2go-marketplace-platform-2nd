import { useEffect, useState, useCallback, useMemo } from 'react';
import createContextHook from '@nkzw/create-context-hook';
import { db } from '@/lib/firebase';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  query, 
  where,
  orderBy,
  limit as firestoreLimit
} from 'firebase/firestore';



const createFirestoreQueries = () => ({
  userQueries: {
    create: async (userData: any) => {
      const userRef = doc(collection(db, 'users'));
      await setDoc(userRef, { ...userData, createdAt: new Date(), updatedAt: new Date() });
      return { id: userRef.id, ...userData };
    },
    getById: async (id: string) => {
      const userDoc = await getDoc(doc(db, 'users', id));
      return userDoc.exists() ? { id: userDoc.id, ...userDoc.data() } : null;
    },
    getByEmail: async (email: string) => {
      const q = query(collection(db, 'users'), where('email', '==', email));
      const snapshot = await getDocs(q);
      return snapshot.empty ? null : { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
    },
    update: async (id: string, data: any) => {
      await updateDoc(doc(db, 'users', id), { ...data, updatedAt: new Date() });
      return { id, ...data };
    }
  },
  serviceQueries: {
    getAll: async () => {
      const snapshot = await getDocs(collection(db, 'services'));
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },
    getByCategory: async (category: string) => {
      const q = query(collection(db, 'services'), where('category', '==', category));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },
    search: async (searchTerm: string) => {
      const snapshot = await getDocs(collection(db, 'services'));
      return snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter((service: any) => 
          service.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          service.description?.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }
  },
  providerQueries: {
    getById: async (id: string) => {
      const providerDoc = await getDoc(doc(db, 'providers', id));
      return providerDoc.exists() ? { id: providerDoc.id, ...providerDoc.data() } : null;
    },
    getByLocation: async (location: string) => {
      const q = query(collection(db, 'providers'), where('location', '==', location));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },
    getTopRated: async (limitCount: number) => {
      const q = query(
        collection(db, 'providers'), 
        orderBy('rating', 'desc'), 
        firestoreLimit(limitCount)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }
  },
  appointmentQueries: {
    create: async (appointmentData: any) => {
      const appointmentRef = doc(collection(db, 'appointments'));
      await setDoc(appointmentRef, { ...appointmentData, createdAt: new Date(), updatedAt: new Date() });
      return { id: appointmentRef.id, ...appointmentData };
    },
    getByClientId: async (clientId: string) => {
      const q = query(collection(db, 'appointments'), where('clientId', '==', clientId));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },
    getByProviderId: async (providerId: string) => {
      const q = query(collection(db, 'appointments'), where('providerId', '==', providerId));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },
    updateStatus: async (id: string, status: string) => {
      await updateDoc(doc(db, 'appointments', id), { status, updatedAt: new Date() });
      return { id, status };
    }
  },
  chatQueries: {
    createMessage: async (messageData: any) => {
      const messageRef = doc(collection(db, 'chatMessages'));
      await setDoc(messageRef, { ...messageData, createdAt: new Date() });
      return { id: messageRef.id, ...messageData };
    },
    getMessagesByChatId: async (chatId: string) => {
      const q = query(
        collection(db, 'chatMessages'), 
        where('chatId', '==', chatId),
        orderBy('createdAt', 'asc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },
    getRecentChats: async (userId: string) => {
      const q = query(
        collection(db, 'chatMessages'),
        orderBy('createdAt', 'desc'),
        firestoreLimit(50)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }
  },
  okoinsQueries: {
    createTransaction: async (transactionData: any) => {
      const transactionRef = doc(collection(db, 'okoinsTransactions'));
      await setDoc(transactionRef, { ...transactionData, createdAt: new Date() });
      return { id: transactionRef.id, ...transactionData };
    },
    getUserBalance: async (userId: string) => {
      const q = query(collection(db, 'okoinsTransactions'), where('userId', '==', userId));
      const snapshot = await getDocs(q);
      return snapshot.docs.reduce((balance, doc) => {
        const data = doc.data();
        return balance + (data.amount || 0);
      }, 0);
    },
    getUserTransactions: async (userId: string) => {
      const q = query(
        collection(db, 'okoinsTransactions'), 
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }
  },
  walletQueries: {
    createTransaction: async (transactionData: any) => {
      const transactionRef = doc(collection(db, 'walletTransactions'));
      await setDoc(transactionRef, { ...transactionData, createdAt: new Date() });
      return { id: transactionRef.id, ...transactionData };
    },
    getUserBalance: async (userId: string) => {
      const q = query(collection(db, 'walletTransactions'), where('userId', '==', userId));
      const snapshot = await getDocs(q);
      return snapshot.docs.reduce((balance, doc) => {
        const data = doc.data();
        return balance + (data.amount || 0);
      }, 0);
    },
    getUserTransactions: async (userId: string) => {
      const q = query(
        collection(db, 'walletTransactions'), 
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }
  },
  reviewQueries: {
    create: async (reviewData: any) => {
      const reviewRef = doc(collection(db, 'reviews'));
      await setDoc(reviewRef, { ...reviewData, createdAt: new Date() });
      return { id: reviewRef.id, ...reviewData };
    },
    getByProviderId: async (providerId: string) => {
      const q = query(
        collection(db, 'reviews'), 
        where('providerId', '==', providerId),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }
  },
  runMigrations: async () => {
    console.log('✅ Firebase Firestore - No migrations needed');
  },
  seedDatabase: async () => {
    console.log('🌱 Seeding Firestore database...');
    const servicesSnapshot = await getDocs(collection(db, 'services'));
    
    if (servicesSnapshot.empty) {
      const services = [
        {
          name: 'Corte de Cabello',
          category: 'Barbería',
          description: 'Corte de cabello profesional',
          price: 8000,
          duration: 30,
          isActive: true
        },
        {
          name: 'Barba',
          category: 'Barbería',
          description: 'Arreglo de barba',
          price: 5000,
          duration: 20,
          isActive: true
        },
        {
          name: 'Manicure',
          category: 'Belleza',
          description: 'Manicure completo',
          price: 12000,
          duration: 45,
          isActive: true
        },
        {
          name: 'Pedicure',
          category: 'Belleza',
          description: 'Pedicure completo',
          price: 15000,
          duration: 60,
          isActive: true
        }
      ];
      
      for (const service of services) {
        const serviceRef = doc(collection(db, 'services'));
        await setDoc(serviceRef, { ...service, createdAt: new Date() });
      }
      
      console.log('✅ Firestore database seeded successfully');
    } else {
      console.log('ℹ️ Firestore already contains data, skipping seed');
    }
  }
});




export const [DatabaseProvider, useDatabaseContext] = createContextHook(() => {
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [dbModules, setDbModules] = useState<any>(null);

  const initializeDatabase = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('🔄 Initializing Firebase Firestore database...');
      
      if (!db) {
        throw new Error('Firebase Firestore is not initialized. Check Firebase configuration.');
      }
      
      const modules = createFirestoreQueries();
      setDbModules(modules);
      
      await modules.runMigrations();
      
      setIsInitialized(true);
      console.log('✅ Firebase Firestore database initialized successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Database initialization failed';
      console.error('❌ Database initialization error:', errorMessage);
      console.error('Full error:', err);
      setError(errorMessage);
      setIsInitialized(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const seedData = useCallback(async () => {
    try {
      setError(null);
      console.log('🌱 Seeding database...');
      
      if (dbModules) {
        await dbModules.seedDatabase();
        console.log('✅ Database seeded successfully');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Database seeding failed';
      console.error('Database seeding error:', errorMessage);
      setError(errorMessage);
    }
  }, [dbModules]);

  useEffect(() => {
    initializeDatabase();
  }, [initializeDatabase]);

  const contextValue = useMemo(() => ({
    isInitialized,
    isLoading,
    error,
    
    createUser: dbModules?.userQueries?.create,
    getUserById: dbModules?.userQueries?.getById,
    getUserByEmail: dbModules?.userQueries?.getByEmail,
    updateUser: dbModules?.userQueries?.update,
    
    getAllServices: dbModules?.serviceQueries?.getAll,
    getServicesByCategory: dbModules?.serviceQueries?.getByCategory,
    searchServices: dbModules?.serviceQueries?.search,
    
    getProviderById: dbModules?.providerQueries?.getById,
    getProvidersByLocation: dbModules?.providerQueries?.getByLocation,
    getTopRatedProviders: dbModules?.providerQueries?.getTopRated,
    
    createAppointment: dbModules?.appointmentQueries?.create,
    getAppointmentsByClientId: dbModules?.appointmentQueries?.getByClientId,
    getAppointmentsByProviderId: dbModules?.appointmentQueries?.getByProviderId,
    updateAppointmentStatus: dbModules?.appointmentQueries?.updateStatus,
    
    createChatMessage: dbModules?.chatQueries?.createMessage,
    getChatMessages: dbModules?.chatQueries?.getMessagesByChatId,
    getRecentChats: dbModules?.chatQueries?.getRecentChats,
    
    createOkoinsTransaction: dbModules?.okoinsQueries?.createTransaction,
    getOkoinsBalance: dbModules?.okoinsQueries?.getUserBalance,
    getOkoinsTransactions: dbModules?.okoinsQueries?.getUserTransactions,
    
    createWalletTransaction: dbModules?.walletQueries?.createTransaction,
    getWalletBalance: dbModules?.walletQueries?.getUserBalance,
    getWalletTransactions: dbModules?.walletQueries?.getUserTransactions,
    
    createReview: dbModules?.reviewQueries?.create,
    getProviderReviews: dbModules?.reviewQueries?.getByProviderId,
    
    initializeDatabase,
    seedData
  }), [isInitialized, isLoading, error, dbModules, initializeDatabase, seedData]);
  
  return contextValue;
});