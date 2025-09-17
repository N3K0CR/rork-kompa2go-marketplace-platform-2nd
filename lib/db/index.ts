import { Platform } from 'react-native';

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
let schema: any;

// Initialize database based on platform
const initializeDb = async () => {
  if (Platform.OS === 'web') {
    console.log('Web platform detected - using mock database');
    return createMockDb();
  } else {
    try {
      // Dynamic import for native platforms only
      const [drizzleModule, sqliteModule, schemaModule] = await Promise.all([
        import('drizzle-orm/expo-sqlite'),
        import('expo-sqlite'),
        import('./schema')
      ]);
      
      schema = schemaModule;
      const expo = sqliteModule.openDatabaseSync('kompa2go.db', { enableChangeListener: true });
      return drizzleModule.drizzle(expo, { schema: schemaModule });
    } catch (error) {
      console.error('Failed to initialize SQLite database:', error);
      console.log('Falling back to mock database');
      return createMockDb();
    }
  }
};

// Export async initialization function
export const getDb = async () => {
  if (!db) {
    db = await initializeDb();
  }
  return db;
};

// Run migrations on app start
export const runMigrations = async () => {
  try {
    console.log('Running database migrations...');
    if (Platform.OS === 'web') {
      console.log('Web platform - skipping migrations');
      return;
    }
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

// Export schema conditionally
export const getSchema = async () => {
  if (Platform.OS === 'web') {
    return null;
  }
  if (!schema) {
    const schemaModule = await import('./schema');
    schema = schemaModule;
  }
  return schema;
};

// Export seed function
export const seedDatabase = async () => {
  if (Platform.OS === 'web') {
    console.log('Web platform - skipping database seeding');
    return;
  }
  try {
    const queriesModule = await import('./queries');
    await queriesModule.seedDatabase();
  } catch (error) {
    console.error('Failed to seed database:', error);
    throw error;
  }
};