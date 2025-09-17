import { Platform } from 'react-native';

// Platform-specific imports to avoid SharedArrayBuffer issues on web
let eq: any, desc: any, and: any, or: any, like: any;
let db: any;
let schema: any;

// Initialize database and ORM functions
const initializeDbAndORM = async () => {
  if (Platform.OS === 'web') {
    // Mock functions for web
    eq = () => ({});
    desc = () => ({});
    and = () => ({});
    or = () => ({});
    like = () => ({});
    
    // Mock db for web
    db = {
      select: () => ({ from: () => ({ where: () => Promise.resolve([]) }) }),
      insert: () => ({ values: () => ({ returning: () => Promise.resolve([]) }) }),
      update: () => ({ set: () => ({ where: () => ({ returning: () => Promise.resolve([]) }) }) }),
      delete: () => ({ where: () => Promise.resolve() })
    };
    
    schema = {};
  } else {
    try {
      const [dbModule, drizzleORM, schemaModule] = await Promise.all([
        import('./index'),
        import('drizzle-orm'),
        import('./schema')
      ]);
      
      db = await dbModule.getDb();
      schema = schemaModule;
      eq = drizzleORM.eq;
      desc = drizzleORM.desc;
      and = drizzleORM.and;
      or = drizzleORM.or;
      like = drizzleORM.like;
    } catch (error) {
      console.error('Failed to load database modules:', error);
      throw error;
    }
  }
};

// Ensure database is initialized before using queries
const ensureInitialized = async () => {
  if (!db) {
    await initializeDbAndORM();
  }
};

// Types (will be properly typed on native, any on web)
type User = any;
type NewUser = any;
type Service = any;
type NewService = any;
type Provider = any;
type NewProvider = any;
type Appointment = any;
type NewAppointment = any;
type ChatMessage = any;
type NewChatMessage = any;
type OkoinsTransaction = any;
type NewOkoinsTransaction = any;
type WalletTransaction = any;
type NewWalletTransaction = any;
type Review = any;
type NewReview = any;

// User operations
export const userQueries = {
  // Create user
  create: async (userData: NewUser): Promise<User> => {
    await ensureInitialized();
    if (Platform.OS === 'web') return userData;
    const [user] = await db.insert(schema.users).values(userData).returning();
    return user;
  },

  // Get user by ID
  getById: async (id: string): Promise<User | undefined> => {
    await ensureInitialized();
    if (Platform.OS === 'web') return undefined;
    const [user] = await db.select().from(schema.users).where(eq(schema.users.id, id));
    return user;
  },

  // Get user by email
  getByEmail: async (email: string): Promise<User | undefined> => {
    await ensureInitialized();
    if (Platform.OS === 'web') return undefined;
    const [user] = await db.select().from(schema.users).where(eq(schema.users.email, email));
    return user;
  },

  // Update user
  update: async (id: string, userData: Partial<NewUser>): Promise<User> => {
    await ensureInitialized();
    if (Platform.OS === 'web') return { ...userData, id };
    const [user] = await db.update(schema.users)
      .set({ ...userData, updatedAt: new Date() })
      .where(eq(schema.users.id, id))
      .returning();
    return user;
  },

  // Delete user
  delete: async (id: string): Promise<void> => {
    await ensureInitialized();
    if (Platform.OS === 'web') return;
    await db.delete(schema.users).where(eq(schema.users.id, id));
  }
};

// Service operations
export const serviceQueries = {
  // Create service
  create: async (serviceData: NewService): Promise<Service> => {
    await ensureInitialized();
    if (Platform.OS === 'web') return serviceData;
    const [service] = await db.insert(schema.services).values(serviceData).returning();
    return service;
  },

  // Get all services
  getAll: async (): Promise<Service[]> => {
    await ensureInitialized();
    if (Platform.OS === 'web') return [];
    return await db.select().from(schema.services).where(eq(schema.services.isActive, true));
  },

  // Get services by category
  getByCategory: async (category: string): Promise<Service[]> => {
    await ensureInitialized();
    if (Platform.OS === 'web') return [];
    return await db.select().from(schema.services)
      .where(and(eq(schema.services.category, category), eq(schema.services.isActive, true)));
  },

  // Search services
  search: async (query: string): Promise<Service[]> => {
    await ensureInitialized();
    if (Platform.OS === 'web') return [];
    return await db.select().from(schema.services)
      .where(and(
        or(
          like(schema.services.name, `%${query}%`),
          like(schema.services.description, `%${query}%`)
        ),
        eq(schema.services.isActive, true)
      ));
  }
};

// Provider operations
export const providerQueries = {
  // Create provider
  create: async (providerData: NewProvider): Promise<Provider> => {
    await ensureInitialized();
    if (Platform.OS === 'web') return providerData;
    const [provider] = await db.insert(schema.providers).values(providerData).returning();
    return provider;
  },

  // Get provider by ID
  getById: async (id: string): Promise<Provider | undefined> => {
    await ensureInitialized();
    if (Platform.OS === 'web') return undefined;
    const [provider] = await db.select().from(schema.providers).where(eq(schema.providers.id, id));
    return provider;
  },

  // Get provider by user ID
  getByUserId: async (userId: string): Promise<Provider | undefined> => {
    await ensureInitialized();
    if (Platform.OS === 'web') return undefined;
    const [provider] = await db.select().from(schema.providers).where(eq(schema.providers.userId, userId));
    return provider;
  },

  // Get providers by location
  getByLocation: async (location: string): Promise<Provider[]> => {
    await ensureInitialized();
    if (Platform.OS === 'web') return [];
    return await db.select().from(schema.providers)
      .where(like(schema.providers.location, `%${location}%`));
  },

  // Get top rated providers
  getTopRated: async (limit: number = 10): Promise<Provider[]> => {
    await ensureInitialized();
    if (Platform.OS === 'web') return [];
    return await db.select().from(schema.providers)
      .orderBy(desc(schema.providers.rating))
      .limit(limit);
  },

  // Update provider
  update: async (id: string, providerData: Partial<NewProvider>): Promise<Provider> => {
    await ensureInitialized();
    if (Platform.OS === 'web') return { ...providerData, id };
    const [provider] = await db.update(schema.providers)
      .set(providerData)
      .where(eq(schema.providers.id, id))
      .returning();
    return provider;
  }
};

// Appointment operations
export const appointmentQueries = {
  // Create appointment
  create: async (appointmentData: NewAppointment): Promise<Appointment> => {
    await ensureInitialized();
    if (Platform.OS === 'web') return appointmentData;
    const [appointment] = await db.insert(schema.appointments).values(appointmentData).returning();
    return appointment;
  },

  // Get appointment by ID
  getById: async (id: string): Promise<Appointment | undefined> => {
    await ensureInitialized();
    if (Platform.OS === 'web') return undefined;
    const [appointment] = await db.select().from(schema.appointments).where(eq(schema.appointments.id, id));
    return appointment;
  },

  // Get appointments by client ID
  getByClientId: async (clientId: string): Promise<Appointment[]> => {
    await ensureInitialized();
    if (Platform.OS === 'web') return [];
    return await db.select().from(schema.appointments)
      .where(eq(schema.appointments.clientId, clientId))
      .orderBy(desc(schema.appointments.scheduledAt));
  },

  // Get appointments by provider ID
  getByProviderId: async (providerId: string): Promise<Appointment[]> => {
    await ensureInitialized();
    if (Platform.OS === 'web') return [];
    return await db.select().from(schema.appointments)
      .where(eq(schema.appointments.providerId, providerId))
      .orderBy(desc(schema.appointments.scheduledAt));
  },

  // Update appointment status
  updateStatus: async (id: string, status: 'pending' | 'confirmed' | 'completed' | 'cancelled'): Promise<Appointment> => {
    await ensureInitialized();
    if (Platform.OS === 'web') return { id, status };
    const [appointment] = await db.update(schema.appointments)
      .set({ status, updatedAt: new Date() })
      .where(eq(schema.appointments.id, id))
      .returning();
    return appointment;
  }
};

// Chat operations
export const chatQueries = {
  // Create message
  createMessage: async (messageData: NewChatMessage): Promise<ChatMessage> => {
    await ensureInitialized();
    if (Platform.OS === 'web') return messageData;
    const [message] = await db.insert(schema.chatMessages).values(messageData).returning();
    return message;
  },

  // Get messages by chat ID
  getMessagesByChatId: async (chatId: string, limit: number = 50): Promise<ChatMessage[]> => {
    await ensureInitialized();
    if (Platform.OS === 'web') return [];
    return await db.select().from(schema.chatMessages)
      .where(eq(schema.chatMessages.chatId, chatId))
      .orderBy(desc(schema.chatMessages.createdAt))
      .limit(limit);
  },

  // Get recent chats for user
  getRecentChats: async (userId: string): Promise<{ chatId: string; lastMessage: ChatMessage }[]> => {
    await ensureInitialized();
    if (Platform.OS === 'web') return [];
    const recentMessages = await db.select().from(schema.chatMessages)
      .where(eq(schema.chatMessages.senderId, userId))
      .orderBy(desc(schema.chatMessages.createdAt));
    
    const chatMap = new Map<string, ChatMessage>();
    recentMessages.forEach((message: ChatMessage) => {
      if (!chatMap.has(message.chatId)) {
        chatMap.set(message.chatId, message);
      }
    });

    return Array.from(chatMap.entries()).map(([chatId, lastMessage]) => ({
      chatId,
      lastMessage
    }));
  }
};

// OKoins operations
export const okoinsQueries = {
  // Create transaction
  createTransaction: async (transactionData: NewOkoinsTransaction): Promise<OkoinsTransaction> => {
    await ensureInitialized();
    if (Platform.OS === 'web') return transactionData;
    const [transaction] = await db.insert(schema.okoinsTransactions).values(transactionData).returning();
    return transaction;
  },

  // Get user balance
  getUserBalance: async (userId: string): Promise<number> => {
    await ensureInitialized();
    if (Platform.OS === 'web') return 0;
    const transactions = await db.select().from(schema.okoinsTransactions)
      .where(eq(schema.okoinsTransactions.userId, userId));
    
    return transactions.reduce((balance: number, transaction: OkoinsTransaction) => {
      return transaction.type === 'spent' 
        ? balance - transaction.amount 
        : balance + transaction.amount;
    }, 0);
  },

  // Get user transactions
  getUserTransactions: async (userId: string, limit: number = 50): Promise<OkoinsTransaction[]> => {
    await ensureInitialized();
    if (Platform.OS === 'web') return [];
    return await db.select().from(schema.okoinsTransactions)
      .where(eq(schema.okoinsTransactions.userId, userId))
      .orderBy(desc(schema.okoinsTransactions.createdAt))
      .limit(limit);
  }
};

// Wallet operations
export const walletQueries = {
  // Create transaction
  createTransaction: async (transactionData: NewWalletTransaction): Promise<WalletTransaction> => {
    await ensureInitialized();
    if (Platform.OS === 'web') return transactionData;
    const [transaction] = await db.insert(schema.walletTransactions).values(transactionData).returning();
    return transaction;
  },

  // Get user balance
  getUserBalance: async (userId: string): Promise<number> => {
    await ensureInitialized();
    if (Platform.OS === 'web') return 0;
    const transactions = await db.select().from(schema.walletTransactions)
      .where(and(
        eq(schema.walletTransactions.userId, userId),
        eq(schema.walletTransactions.status, 'completed')
      ));
    
    return transactions.reduce((balance: number, transaction: WalletTransaction) => {
      switch (transaction.type) {
        case 'deposit':
        case 'refund':
          return balance + transaction.amount;
        case 'withdrawal':
        case 'payment':
          return balance - transaction.amount;
        default:
          return balance;
      }
    }, 0);
  },

  // Get user transactions
  getUserTransactions: async (userId: string, limit: number = 50): Promise<WalletTransaction[]> => {
    await ensureInitialized();
    if (Platform.OS === 'web') return [];
    return await db.select().from(schema.walletTransactions)
      .where(eq(schema.walletTransactions.userId, userId))
      .orderBy(desc(schema.walletTransactions.createdAt))
      .limit(limit);
  }
};

// Review operations
export const reviewQueries = {
  // Create review
  create: async (reviewData: NewReview): Promise<Review> => {
    await ensureInitialized();
    if (Platform.OS === 'web') return reviewData;
    const [review] = await db.insert(schema.reviews).values(reviewData).returning();
    
    // Update provider rating
    const providerReviews = await db.select().from(schema.reviews)
      .where(eq(schema.reviews.providerId, reviewData.providerId));
    
    const avgRating = providerReviews.reduce((sum: number, r: Review) => sum + r.rating, 0) / providerReviews.length;
    
    await db.update(schema.providers)
      .set({ 
        rating: avgRating, 
        totalReviews: providerReviews.length 
      })
      .where(eq(schema.providers.id, reviewData.providerId));
    
    return review;
  },

  // Get reviews by provider ID
  getByProviderId: async (providerId: string, limit: number = 20): Promise<Review[]> => {
    await ensureInitialized();
    if (Platform.OS === 'web') return [];
    return await db.select().from(schema.reviews)
      .where(eq(schema.reviews.providerId, providerId))
      .orderBy(desc(schema.reviews.createdAt))
      .limit(limit);
  }
};

// Seed data function
export const seedDatabase = async () => {
  console.log('Seeding database...');
  
  if (Platform.OS === 'web') {
    console.log('Web platform - skipping database seeding');
    return;
  }
  
  // Seed services
  const serviceCategories = [
    { name: 'Limpieza Residencial', category: 'limpieza', description: 'Limpieza completa de hogares', price: 15000, duration: 120 },
    { name: 'Limpieza Comercial', category: 'limpieza', description: 'Limpieza de oficinas y comercios', price: 25000, duration: 180 },
    { name: 'Plomería Básica', category: 'plomería', description: 'Reparaciones básicas de plomería', price: 12000, duration: 90 },
    { name: 'Instalación Eléctrica', category: 'electricidad', description: 'Instalaciones eléctricas residenciales', price: 20000, duration: 150 },
    { name: 'Mantenimiento de Jardín', category: 'jardinería', description: 'Cuidado y mantenimiento de jardines', price: 10000, duration: 120 },
    { name: 'Pintura Interior', category: 'pintura', description: 'Pintura de interiores', price: 18000, duration: 240 },
    { name: 'Carpintería General', category: 'carpintería', description: 'Trabajos de carpintería y muebles', price: 22000, duration: 180 },
    { name: 'Mecánica Automotriz', category: 'mecánica', description: 'Reparación y mantenimiento de vehículos', price: 30000, duration: 120 },
    { name: 'Corte de Cabello', category: 'belleza', description: 'Servicios de barbería y peluquería', price: 8000, duration: 45 },
    { name: 'Clases Particulares', category: 'educación', description: 'Tutorías y clases personalizadas', price: 15000, duration: 60 }
  ];

  for (const service of serviceCategories) {
    await serviceQueries.create({
      id: `service_${service.category}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...service
    });
  }

  console.log('Database seeded successfully');
};