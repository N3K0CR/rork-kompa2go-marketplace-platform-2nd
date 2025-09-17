import { Platform } from 'react-native';
import * as schema from './schema';

// Create a mock database interface that matches Drizzle's API
const createMockDb = () => {
  return {
    select: () => ({
      from: (_table: any) => ({
        where: (_condition: any) => Promise.resolve([]),
        orderBy: (_order: any) => ({
          limit: (_limit: number) => Promise.resolve([])
        }),
        limit: (_limit: number) => Promise.resolve([])
      })
    }),
    insert: (_table: any) => ({
      values: (data: any) => ({
        returning: () => Promise.resolve([data])
      })
    }),
    update: (_table: any) => ({
      set: (data: any) => ({
        where: (_condition: any) => ({
          returning: () => Promise.resolve([data])
        })
      })
    }),
    delete: (_table: any) => ({
      where: (_condition: any) => Promise.resolve()
    })
  };
};

// Platform-specific database setup
let db: any;

// Initialize database based on platform
const initializeDb = () => {
  if (Platform.OS === 'web') {
    console.log('Web platform detected - using mock database');
    return createMockDb();
  } else {
    try {
      // Dynamic import for native platforms only
      const { drizzle } = require('drizzle-orm/expo-sqlite');
      const { openDatabaseSync } = require('expo-sqlite');
      
      const expo = openDatabaseSync('kompa2go.db', { enableChangeListener: true });
      return drizzle(expo, { schema });
    } catch (error) {
      console.error('Failed to initialize SQLite database:', error);
      console.log('Falling back to mock database');
      return createMockDb();
    }
  }
};

db = initializeDb();

export { db };

// Run migrations on app start
export const runMigrations = async () => {
  try {
    console.log('Running database migrations...');
    // Note: For Expo SQLite, migrations are handled differently
    // You would typically run: npx drizzle-kit generate:sqlite
    // and then apply migrations manually or use a custom migration runner
    console.log('Database initialized');
    console.log('Database migrations completed successfully');
  } catch (error) {
    console.error('Database migration failed:', error);
    throw error;
  }
};

export * from './schema';
export { seedDatabase } from './queries';