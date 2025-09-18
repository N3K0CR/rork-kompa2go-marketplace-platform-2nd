// tRPC routes structure for Kompa2Go backend
import { z } from 'zod';

// Current tRPC router structure
export const TRPCRoutes = {
  // Example routes (currently implemented)
  example: {
    hi: {
      type: 'query',
      input: z.void(),
      output: z.object({
        message: z.string(),
        timestamp: z.date(),
      }),
      description: 'Simple hello world endpoint',
    },
  },

  // Payment routes (currently implemented)
  payments: {
    getCountries: {
      type: 'query',
      input: z.void(),
      output: z.array(z.object({
        code: z.string(),
        name: z.string(),
        currency: z.string(),
      })),
      description: 'Get list of supported countries',
    },
    
    processPayment: {
      type: 'mutation',
      input: z.object({
        amount: z.number().positive(),
        currency: z.string(),
        paymentMethodId: z.string(),
        userId: z.string(),
        bookingId: z.string().optional(),
        planId: z.string().optional(),
      }),
      output: z.object({
        success: z.boolean(),
        paymentId: z.string(),
        transactionId: z.string().optional(),
        error: z.string().optional(),
      }),
      description: 'Process a payment transaction',
    },

    getPaymentHistory: {
      type: 'query',
      input: z.object({
        userId: z.string(),
        limit: z.number().default(20),
        offset: z.number().default(0),
      }),
      output: z.object({
        payments: z.array(z.object({
          id: z.string(),
          amount: z.number(),
          currency: z.string(),
          status: z.enum(['pending', 'completed', 'failed', 'refunded']),
          createdAt: z.date(),
        })),
        total: z.number(),
        hasMore: z.boolean(),
      }),
      description: 'Get user payment history',
    },
  },
};

// Proposed additional routes for full functionality
export const ProposedTRPCRoutes = {
  // Authentication routes
  auth: {
    login: {
      type: 'mutation',
      input: z.object({
        email: z.string().email(),
        password: z.string().min(6),
      }),
      output: z.object({
        user: z.object({
          id: z.string(),
          email: z.string(),
          name: z.string(),
          role: z.enum(['client', 'provider', 'admin']),
        }),
        token: z.string(),
      }),
    },

    register: {
      type: 'mutation',
      input: z.object({
        email: z.string().email(),
        password: z.string().min(6),
        name: z.string(),
        role: z.enum(['client', 'provider']),
        phone: z.string().optional(),
      }),
      output: z.object({
        user: z.object({
          id: z.string(),
          email: z.string(),
          name: z.string(),
          role: z.enum(['client', 'provider', 'admin']),
        }),
        token: z.string(),
      }),
    },

    logout: {
      type: 'mutation',
      input: z.void(),
      output: z.object({
        success: z.boolean(),
      }),
    },

    refreshToken: {
      type: 'mutation',
      input: z.object({
        refreshToken: z.string(),
      }),
      output: z.object({
        token: z.string(),
        refreshToken: z.string(),
      }),
    },
  },

  // User management routes
  users: {
    getProfile: {
      type: 'query',
      input: z.object({
        userId: z.string(),
      }),
      output: z.object({
        id: z.string(),
        email: z.string(),
        name: z.string(),
        role: z.enum(['client', 'provider', 'admin']),
        avatar: z.string().optional(),
        phone: z.string().optional(),
        language: z.enum(['es', 'en']),
        createdAt: z.date(),
        updatedAt: z.date(),
      }),
    },

    updateProfile: {
      type: 'mutation',
      input: z.object({
        userId: z.string(),
        name: z.string().optional(),
        phone: z.string().optional(),
        avatar: z.string().optional(),
        language: z.enum(['es', 'en']).optional(),
      }),
      output: z.object({
        success: z.boolean(),
        user: z.object({
          id: z.string(),
          name: z.string(),
          phone: z.string().optional(),
          avatar: z.string().optional(),
          language: z.enum(['es', 'en']),
        }),
      }),
    },
  },

  // Provider routes
  providers: {
    getProviders: {
      type: 'query',
      input: z.object({
        location: z.object({
          latitude: z.number(),
          longitude: z.number(),
          radius: z.number().default(10),
        }).optional(),
        specialties: z.array(z.string()).optional(),
        priceRange: z.object({
          min: z.number(),
          max: z.number(),
        }).optional(),
        availability: z.object({
          date: z.string(),
          time: z.string(),
        }).optional(),
        limit: z.number().default(20),
        offset: z.number().default(0),
      }),
      output: z.object({
        providers: z.array(z.object({
          id: z.string(),
          name: z.string(),
          specialties: z.array(z.string()),
          rating: z.number(),
          reviewCount: z.number(),
          location: z.object({
            address: z.string(),
            city: z.string(),
            latitude: z.number(),
            longitude: z.number(),
          }),
          priceRange: z.object({
            min: z.number(),
            max: z.number(),
            currency: z.string(),
          }),
          avatar: z.string().optional(),
          verified: z.boolean(),
        })),
        total: z.number(),
        hasMore: z.boolean(),
      }),
    },

    getProviderDetails: {
      type: 'query',
      input: z.object({
        providerId: z.string(),
      }),
      output: z.object({
        id: z.string(),
        name: z.string(),
        email: z.string(),
        phone: z.string().optional(),
        specialties: z.array(z.string()),
        rating: z.number(),
        reviewCount: z.number(),
        location: z.object({
          address: z.string(),
          city: z.string(),
          state: z.string(),
          country: z.string(),
          latitude: z.number(),
          longitude: z.number(),
        }),
        availability: z.array(z.object({
          dayOfWeek: z.number(),
          startTime: z.string(),
          endTime: z.string(),
          isAvailable: z.boolean(),
        })),
        services: z.array(z.object({
          id: z.string(),
          name: z.string(),
          description: z.string(),
          duration: z.number(),
          price: z.number(),
          currency: z.string(),
        })),
        description: z.string().optional(),
        experience: z.number().optional(),
        certifications: z.array(z.string()).optional(),
        verified: z.boolean(),
      }),
    },
  },

  // Booking routes
  bookings: {
    createBooking: {
      type: 'mutation',
      input: z.object({
        clientId: z.string(),
        providerId: z.string(),
        serviceId: z.string(),
        date: z.string(),
        startTime: z.string(),
        endTime: z.string(),
        notes: z.string().optional(),
      }),
      output: z.object({
        booking: z.object({
          id: z.string(),
          clientId: z.string(),
          providerId: z.string(),
          serviceId: z.string(),
          date: z.date(),
          startTime: z.string(),
          endTime: z.string(),
          status: z.enum(['pending', 'confirmed', 'completed', 'cancelled']),
          price: z.number(),
          currency: z.string(),
        }),
      }),
    },

    getBookings: {
      type: 'query',
      input: z.object({
        userId: z.string(),
        status: z.enum(['pending', 'confirmed', 'completed', 'cancelled']).optional(),
        limit: z.number().default(20),
        offset: z.number().default(0),
      }),
      output: z.object({
        bookings: z.array(z.object({
          id: z.string(),
          clientId: z.string(),
          providerId: z.string(),
          providerName: z.string(),
          serviceName: z.string(),
          date: z.date(),
          startTime: z.string(),
          endTime: z.string(),
          status: z.enum(['pending', 'confirmed', 'completed', 'cancelled']),
          price: z.number(),
          currency: z.string(),
        })),
        total: z.number(),
        hasMore: z.boolean(),
      }),
    },

    updateBookingStatus: {
      type: 'mutation',
      input: z.object({
        bookingId: z.string(),
        status: z.enum(['confirmed', 'completed', 'cancelled']),
        userId: z.string(),
      }),
      output: z.object({
        success: z.boolean(),
        booking: z.object({
          id: z.string(),
          status: z.enum(['pending', 'confirmed', 'completed', 'cancelled']),
          updatedAt: z.date(),
        }),
      }),
    },
  },

  // Chat routes
  chats: {
    getChats: {
      type: 'query',
      input: z.object({
        userId: z.string(),
      }),
      output: z.array(z.object({
        id: z.string(),
        participants: z.array(z.object({
          id: z.string(),
          name: z.string(),
          avatar: z.string().optional(),
        })),
        lastMessage: z.object({
          content: z.string(),
          senderId: z.string(),
          timestamp: z.date(),
        }).optional(),
        updatedAt: z.date(),
      })),
    },

    getMessages: {
      type: 'query',
      input: z.object({
        chatId: z.string(),
        limit: z.number().default(50),
        offset: z.number().default(0),
      }),
      output: z.object({
        messages: z.array(z.object({
          id: z.string(),
          senderId: z.string(),
          content: z.string(),
          type: z.enum(['text', 'image', 'file']),
          timestamp: z.date(),
          read: z.boolean(),
        })),
        hasMore: z.boolean(),
      }),
    },

    sendMessage: {
      type: 'mutation',
      input: z.object({
        chatId: z.string(),
        senderId: z.string(),
        content: z.string(),
        type: z.enum(['text', 'image', 'file']).default('text'),
      }),
      output: z.object({
        message: z.object({
          id: z.string(),
          senderId: z.string(),
          content: z.string(),
          type: z.enum(['text', 'image', 'file']),
          timestamp: z.date(),
        }),
      }),
    },
  },

  // OKoins routes
  okoins: {
    getBalance: {
      type: 'query',
      input: z.object({
        userId: z.string(),
      }),
      output: z.object({
        balance: z.number(),
        transactions: z.array(z.object({
          id: z.string(),
          type: z.enum(['earned', 'spent', 'bonus']),
          amount: z.number(),
          description: z.string(),
          timestamp: z.date(),
        })),
      }),
    },

    addTransaction: {
      type: 'mutation',
      input: z.object({
        userId: z.string(),
        type: z.enum(['earned', 'spent', 'bonus']),
        amount: z.number(),
        description: z.string(),
        relatedBookingId: z.string().optional(),
      }),
      output: z.object({
        transaction: z.object({
          id: z.string(),
          type: z.enum(['earned', 'spent', 'bonus']),
          amount: z.number(),
          description: z.string(),
          timestamp: z.date(),
        }),
        newBalance: z.number(),
      }),
    },
  },

  // Analytics routes
  analytics: {
    getProviderAnalytics: {
      type: 'query',
      input: z.object({
        providerId: z.string(),
        startDate: z.string(),
        endDate: z.string(),
      }),
      output: z.object({
        totalBookings: z.number(),
        completedBookings: z.number(),
        cancelledBookings: z.number(),
        totalRevenue: z.number(),
        averageRating: z.number(),
        popularServices: z.array(z.object({
          serviceId: z.string(),
          serviceName: z.string(),
          bookingCount: z.number(),
        })),
        monthlyStats: z.array(z.object({
          month: z.string(),
          bookings: z.number(),
          revenue: z.number(),
        })),
      }),
    },

    getClientAnalytics: {
      type: 'query',
      input: z.object({
        clientId: z.string(),
        startDate: z.string(),
        endDate: z.string(),
      }),
      output: z.object({
        totalBookings: z.number(),
        completedBookings: z.number(),
        totalSpent: z.number(),
        okoinsEarned: z.number(),
        favoriteProviders: z.array(z.object({
          providerId: z.string(),
          providerName: z.string(),
          bookingCount: z.number(),
        })),
        serviceCategories: z.array(z.object({
          category: z.string(),
          bookingCount: z.number(),
        })),
      }),
    },
  },

  // Admin routes
  admin: {
    getReportedProblems: {
      type: 'query',
      input: z.object({
        status: z.enum(['open', 'in_progress', 'resolved', 'closed']).optional(),
        priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
        limit: z.number().default(20),
        offset: z.number().default(0),
      }),
      output: z.object({
        problems: z.array(z.object({
          id: z.string(),
          reporterId: z.string(),
          reporterName: z.string(),
          type: z.enum(['technical', 'service', 'payment', 'other']),
          title: z.string(),
          description: z.string(),
          status: z.enum(['open', 'in_progress', 'resolved', 'closed']),
          priority: z.enum(['low', 'medium', 'high', 'critical']),
          createdAt: z.date(),
        })),
        total: z.number(),
        hasMore: z.boolean(),
      }),
    },

    updateProblemStatus: {
      type: 'mutation',
      input: z.object({
        problemId: z.string(),
        status: z.enum(['in_progress', 'resolved', 'closed']),
        assignedTo: z.string().optional(),
      }),
      output: z.object({
        success: z.boolean(),
        problem: z.object({
          id: z.string(),
          status: z.enum(['open', 'in_progress', 'resolved', 'closed']),
          assignedTo: z.string().optional(),
          updatedAt: z.date(),
        }),
      }),
    },

    getPendingPayments: {
      type: 'query',
      input: z.object({
        limit: z.number().default(20),
        offset: z.number().default(0),
      }),
      output: z.object({
        payments: z.array(z.object({
          id: z.string(),
          userId: z.string(),
          userName: z.string(),
          amount: z.number(),
          currency: z.string(),
          status: z.enum(['pending', 'completed', 'failed', 'refunded']),
          createdAt: z.date(),
        })),
        total: z.number(),
        hasMore: z.boolean(),
      }),
    },
  },
};

// tRPC client configuration
export const TRPCClientConfig = {
  // Base URL configuration
  baseUrl: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000',
  
  // Headers configuration
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer {token}', // Dynamic token injection
  },

  // Error handling
  errorHandling: {
    onError: (error: any) => {
      console.error('tRPC Error:', error);
      // Handle specific error types
      if (error.code === 'UNAUTHORIZED') {
        // Redirect to login
      }
    },
  },

  // Query configuration
  queryConfig: {
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    retry: 3,
    retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
  },

  // Mutation configuration
  mutationConfig: {
    retry: 1,
    onSuccess: (data: any) => {
      console.log('Mutation success:', data);
    },
    onError: (error: any) => {
      console.error('Mutation error:', error);
    },
  },
};

// Route organization by feature
export const RoutesByFeature = {
  authentication: ['auth.login', 'auth.register', 'auth.logout', 'auth.refreshToken'],
  userManagement: ['users.getProfile', 'users.updateProfile'],
  providerDiscovery: ['providers.getProviders', 'providers.getProviderDetails'],
  bookingManagement: ['bookings.createBooking', 'bookings.getBookings', 'bookings.updateBookingStatus'],
  messaging: ['chats.getChats', 'chats.getMessages', 'chats.sendMessage'],
  rewards: ['okoins.getBalance', 'okoins.addTransaction'],
  payments: ['payments.getCountries', 'payments.processPayment', 'payments.getPaymentHistory'],
  analytics: ['analytics.getProviderAnalytics', 'analytics.getClientAnalytics'],
  administration: ['admin.getReportedProblems', 'admin.updateProblemStatus', 'admin.getPendingPayments'],
};

export default {
  TRPCRoutes,
  ProposedTRPCRoutes,
  TRPCClientConfig,
  RoutesByFeature,
};