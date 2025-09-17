import { Platform } from 'react-native';
import { db } from './index';

// Platform-specific imports to avoid SharedArrayBuffer issues on web
let eq: any, desc: any, and: any, or: any, like: any;

if (Platform.OS !== 'web') {
  try {
    const drizzleORM = require('drizzle-orm');
    eq = drizzleORM.eq;
    desc = drizzleORM.desc;
    and = drizzleORM.and;
    or = drizzleORM.or;
    like = drizzleORM.like;
  } catch (error) {
    console.error('Failed to load Drizzle ORM modules:', error);
  }
} else {
  // Mock functions for web
  eq = () => ({});
  desc = () => ({});
  and = () => ({});
  or = () => ({});
  like = () => ({});
}
import { 
  users, 
  services, 
  providers, 
  appointments, 
  chatMessages, 
  okoinsTransactions, 
  walletTransactions, 
  reviews,

  type User,
  type NewUser,
  type Service,
  type NewService,
  type Provider,
  type NewProvider,
  type Appointment,
  type NewAppointment,
  type ChatMessage,
  type NewChatMessage,
  type OkoinsTransaction,
  type NewOkoinsTransaction,
  type WalletTransaction,
  type NewWalletTransaction,
  type Review,
  type NewReview
} from './schema';

// User operations
export const userQueries = {
  // Create user
  create: async (userData: NewUser): Promise<User> => {
    const [user] = await db.insert(users).values(userData).returning();
    return user;
  },

  // Get user by ID
  getById: async (id: string): Promise<User | undefined> => {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  },

  // Get user by email
  getByEmail: async (email: string): Promise<User | undefined> => {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  },

  // Update user
  update: async (id: string, userData: Partial<NewUser>): Promise<User> => {
    const [user] = await db.update(users)
      .set({ ...userData, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  },

  // Delete user
  delete: async (id: string): Promise<void> => {
    await db.delete(users).where(eq(users.id, id));
  }
};

// Service operations
export const serviceQueries = {
  // Create service
  create: async (serviceData: NewService): Promise<Service> => {
    const [service] = await db.insert(services).values(serviceData).returning();
    return service;
  },

  // Get all services
  getAll: async (): Promise<Service[]> => {
    return await db.select().from(services).where(eq(services.isActive, true));
  },

  // Get services by category
  getByCategory: async (category: string): Promise<Service[]> => {
    return await db.select().from(services)
      .where(and(eq(services.category, category), eq(services.isActive, true)));
  },

  // Search services
  search: async (query: string): Promise<Service[]> => {
    return await db.select().from(services)
      .where(and(
        or(
          like(services.name, `%${query}%`),
          like(services.description, `%${query}%`)
        ),
        eq(services.isActive, true)
      ));
  }
};

// Provider operations
export const providerQueries = {
  // Create provider
  create: async (providerData: NewProvider): Promise<Provider> => {
    const [provider] = await db.insert(providers).values(providerData).returning();
    return provider;
  },

  // Get provider by ID
  getById: async (id: string): Promise<Provider | undefined> => {
    const [provider] = await db.select().from(providers).where(eq(providers.id, id));
    return provider;
  },

  // Get provider by user ID
  getByUserId: async (userId: string): Promise<Provider | undefined> => {
    const [provider] = await db.select().from(providers).where(eq(providers.userId, userId));
    return provider;
  },

  // Get providers by location
  getByLocation: async (location: string): Promise<Provider[]> => {
    return await db.select().from(providers)
      .where(like(providers.location, `%${location}%`));
  },

  // Get top rated providers
  getTopRated: async (limit: number = 10): Promise<Provider[]> => {
    return await db.select().from(providers)
      .orderBy(desc(providers.rating))
      .limit(limit);
  },

  // Update provider
  update: async (id: string, providerData: Partial<NewProvider>): Promise<Provider> => {
    const [provider] = await db.update(providers)
      .set(providerData)
      .where(eq(providers.id, id))
      .returning();
    return provider;
  }
};

// Appointment operations
export const appointmentQueries = {
  // Create appointment
  create: async (appointmentData: NewAppointment): Promise<Appointment> => {
    const [appointment] = await db.insert(appointments).values(appointmentData).returning();
    return appointment;
  },

  // Get appointment by ID
  getById: async (id: string): Promise<Appointment | undefined> => {
    const [appointment] = await db.select().from(appointments).where(eq(appointments.id, id));
    return appointment;
  },

  // Get appointments by client ID
  getByClientId: async (clientId: string): Promise<Appointment[]> => {
    return await db.select().from(appointments)
      .where(eq(appointments.clientId, clientId))
      .orderBy(desc(appointments.scheduledAt));
  },

  // Get appointments by provider ID
  getByProviderId: async (providerId: string): Promise<Appointment[]> => {
    return await db.select().from(appointments)
      .where(eq(appointments.providerId, providerId))
      .orderBy(desc(appointments.scheduledAt));
  },

  // Update appointment status
  updateStatus: async (id: string, status: 'pending' | 'confirmed' | 'completed' | 'cancelled'): Promise<Appointment> => {
    const [appointment] = await db.update(appointments)
      .set({ status, updatedAt: new Date() })
      .where(eq(appointments.id, id))
      .returning();
    return appointment;
  }
};

// Chat operations
export const chatQueries = {
  // Create message
  createMessage: async (messageData: NewChatMessage): Promise<ChatMessage> => {
    const [message] = await db.insert(chatMessages).values(messageData).returning();
    return message;
  },

  // Get messages by chat ID
  getMessagesByChatId: async (chatId: string, limit: number = 50): Promise<ChatMessage[]> => {
    return await db.select().from(chatMessages)
      .where(eq(chatMessages.chatId, chatId))
      .orderBy(desc(chatMessages.createdAt))
      .limit(limit);
  },

  // Get recent chats for user
  getRecentChats: async (userId: string): Promise<{ chatId: string; lastMessage: ChatMessage }[]> => {
    const recentMessages = await db.select().from(chatMessages)
      .where(eq(chatMessages.senderId, userId))
      .orderBy(desc(chatMessages.createdAt));
    
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
    const [transaction] = await db.insert(okoinsTransactions).values(transactionData).returning();
    return transaction;
  },

  // Get user balance
  getUserBalance: async (userId: string): Promise<number> => {
    const transactions = await db.select().from(okoinsTransactions)
      .where(eq(okoinsTransactions.userId, userId));
    
    return transactions.reduce((balance: number, transaction: OkoinsTransaction) => {
      return transaction.type === 'spent' 
        ? balance - transaction.amount 
        : balance + transaction.amount;
    }, 0);
  },

  // Get user transactions
  getUserTransactions: async (userId: string, limit: number = 50): Promise<OkoinsTransaction[]> => {
    return await db.select().from(okoinsTransactions)
      .where(eq(okoinsTransactions.userId, userId))
      .orderBy(desc(okoinsTransactions.createdAt))
      .limit(limit);
  }
};

// Wallet operations
export const walletQueries = {
  // Create transaction
  createTransaction: async (transactionData: NewWalletTransaction): Promise<WalletTransaction> => {
    const [transaction] = await db.insert(walletTransactions).values(transactionData).returning();
    return transaction;
  },

  // Get user balance
  getUserBalance: async (userId: string): Promise<number> => {
    const transactions = await db.select().from(walletTransactions)
      .where(and(
        eq(walletTransactions.userId, userId),
        eq(walletTransactions.status, 'completed')
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
    return await db.select().from(walletTransactions)
      .where(eq(walletTransactions.userId, userId))
      .orderBy(desc(walletTransactions.createdAt))
      .limit(limit);
  }
};

// Review operations
export const reviewQueries = {
  // Create review
  create: async (reviewData: NewReview): Promise<Review> => {
    const [review] = await db.insert(reviews).values(reviewData).returning();
    
    // Update provider rating
    const providerReviews = await db.select().from(reviews)
      .where(eq(reviews.providerId, reviewData.providerId));
    
    const avgRating = providerReviews.reduce((sum: number, r: Review) => sum + r.rating, 0) / providerReviews.length;
    
    await db.update(providers)
      .set({ 
        rating: avgRating, 
        totalReviews: providerReviews.length 
      })
      .where(eq(providers.id, reviewData.providerId));
    
    return review;
  },

  // Get reviews by provider ID
  getByProviderId: async (providerId: string, limit: number = 20): Promise<Review[]> => {
    return await db.select().from(reviews)
      .where(eq(reviews.providerId, providerId))
      .orderBy(desc(reviews.createdAt))
      .limit(limit);
  }
};

// Seed data function
export const seedDatabase = async () => {
  console.log('Seeding database...');
  
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