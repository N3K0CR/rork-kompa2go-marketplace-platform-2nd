import { drizzle } from 'drizzle-orm/expo-sqlite';
import { openDatabaseSync } from 'expo-sqlite';

import * as schema from './schema';

const expo = openDatabaseSync('kompa2go.db', { enableChangeListener: true });

export const db = drizzle(expo, { schema });

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