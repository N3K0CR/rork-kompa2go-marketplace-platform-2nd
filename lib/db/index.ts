import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// Database configuration with production-ready settings
const DATABASE_URL = process.env.DATABASE_URL || process.env.POSTGRES_URL || 'postgresql://localhost:5432/kompa2go';

// Connection pool configuration for production
const connectionConfig = {
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  database: process.env.POSTGRES_DATABASE || 'kompa2go',
  username: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || '',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20, // Maximum number of connections in pool
  idle_timeout: 20, // Close connections after 20 seconds of inactivity
  connect_timeout: 10, // Connection timeout in seconds
  prepare: false, // Disable prepared statements for better compatibility
};

// Create PostgreSQL connection with retry logic
let sql: postgres.Sql | null = null;
let db: ReturnType<typeof drizzle> | null = null;

const createConnection = async (retries = 3): Promise<postgres.Sql> => {
  for (let i = 0; i < retries; i++) {
    try {
      console.log(`Attempting to connect to PostgreSQL (attempt ${i + 1}/${retries})...`);
      
      const connection = postgres(DATABASE_URL, connectionConfig);
      
      // Test the connection
      await connection`SELECT 1`;
      
      console.log('✅ PostgreSQL connection established successfully');
      return connection;
    } catch (error) {
      console.error(`❌ PostgreSQL connection attempt ${i + 1} failed:`, error);
      
      if (i === retries - 1) {
        throw new Error(`Failed to connect to PostgreSQL after ${retries} attempts: ${error}`);
      }
      
      // Wait before retrying (exponential backoff)
      const delay = Math.pow(2, i) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw new Error('Unexpected error in connection retry logic');
};

// Initialize database connection
export const getDb = async () => {
  if (!db) {
    try {
      sql = await createConnection();
      db = drizzle(sql, { schema });
      console.log('✅ Drizzle ORM initialized with PostgreSQL');
    } catch (error) {
      console.error('❌ Failed to initialize database:', error);
      throw error;
    }
  }
  return db;
};

// Get raw SQL connection for advanced queries
export const getSql = async () => {
  if (!sql) {
    await getDb(); // This will initialize sql
  }
  return sql!;
};

// Run database migrations
export const runMigrations = async () => {
  try {
    console.log('🔄 Running database migrations...');
    
    const connection = await getSql();
    
    // Create tables if they don't exist (basic migration)
    await connection`
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
      
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name TEXT NOT NULL,
        email TEXT UNIQUE,
        phone TEXT,
        avatar TEXT,
        user_type TEXT NOT NULL DEFAULT 'client',
        location TEXT,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );
      
      CREATE TABLE IF NOT EXISTS services (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        description TEXT,
        price REAL,
        duration INTEGER,
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );
      
      CREATE TABLE IF NOT EXISTS providers (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL REFERENCES users(id),
        business_name TEXT,
        description TEXT,
        location TEXT,
        rating REAL DEFAULT 0,
        total_reviews INTEGER DEFAULT 0,
        is_verified BOOLEAN DEFAULT false,
        requires_pass BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );
      
      CREATE TABLE IF NOT EXISTS provider_services (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        provider_id UUID NOT NULL REFERENCES providers(id),
        service_id UUID NOT NULL REFERENCES services(id),
        custom_price REAL,
        custom_duration INTEGER,
        is_available BOOLEAN DEFAULT true
      );
      
      CREATE TABLE IF NOT EXISTS appointments (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        client_id UUID NOT NULL REFERENCES users(id),
        provider_id UUID NOT NULL REFERENCES providers(id),
        service_id UUID NOT NULL REFERENCES services(id),
        scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        price REAL NOT NULL,
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );
      
      CREATE TABLE IF NOT EXISTS chat_messages (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        chat_id TEXT NOT NULL,
        sender_id UUID NOT NULL REFERENCES users(id),
        content TEXT NOT NULL,
        message_type TEXT DEFAULT 'text',
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );
      
      CREATE TABLE IF NOT EXISTS okoins_transactions (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL REFERENCES users(id),
        amount INTEGER NOT NULL,
        type TEXT NOT NULL,
        description TEXT NOT NULL,
        related_id TEXT,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );
      
      CREATE TABLE IF NOT EXISTS wallet_transactions (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL REFERENCES users(id),
        amount REAL NOT NULL,
        type TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        description TEXT NOT NULL,
        related_id TEXT,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );
      
      CREATE TABLE IF NOT EXISTS reviews (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        appointment_id UUID NOT NULL REFERENCES appointments(id),
        client_id UUID NOT NULL REFERENCES users(id),
        provider_id UUID NOT NULL REFERENCES providers(id),
        rating INTEGER NOT NULL,
        comment TEXT,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );
      
      -- Create indexes for better performance
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_providers_user_id ON providers(user_id);
      CREATE INDEX IF NOT EXISTS idx_appointments_client_id ON appointments(client_id);
      CREATE INDEX IF NOT EXISTS idx_appointments_provider_id ON appointments(provider_id);
      CREATE INDEX IF NOT EXISTS idx_appointments_scheduled_at ON appointments(scheduled_at);
      CREATE INDEX IF NOT EXISTS idx_chat_messages_chat_id ON chat_messages(chat_id);
      CREATE INDEX IF NOT EXISTS idx_okoins_transactions_user_id ON okoins_transactions(user_id);
      CREATE INDEX IF NOT EXISTS idx_wallet_transactions_user_id ON wallet_transactions(user_id);
    `;
    
    console.log('✅ Database migrations completed successfully');
  } catch (error) {
    console.error('❌ Database migration failed:', error);
    throw error;
  }
};

// Seed database with initial data
export const seedDatabase = async () => {
  try {
    console.log('🌱 Seeding database...');
    
    const database = await getDb();
    
    // Check if data already exists
    const existingServices = await database.select().from(schema.services).limit(1);
    
    if (existingServices.length === 0) {
      // Insert initial services
      await database.insert(schema.services).values([
        {
          name: 'Corte de Cabello',
          category: 'Barbería',
          description: 'Corte de cabello profesional',
          price: 8000,
          duration: 30,
        },
        {
          name: 'Barba',
          category: 'Barbería',
          description: 'Arreglo de barba',
          price: 5000,
          duration: 20,
        },
        {
          name: 'Manicure',
          category: 'Belleza',
          description: 'Manicure completo',
          price: 12000,
          duration: 45,
        },
        {
          name: 'Pedicure',
          category: 'Belleza',
          description: 'Pedicure completo',
          price: 15000,
          duration: 60,
        },
      ]);
      
      console.log('✅ Database seeded successfully');
    } else {
      console.log('ℹ️ Database already contains data, skipping seed');
    }
  } catch (error) {
    console.error('❌ Database seeding failed:', error);
    throw error;
  }
};

// Graceful shutdown
export const closeConnection = async () => {
  if (sql) {
    await sql.end();
    sql = null;
    db = null;
    console.log('✅ Database connection closed');
  }
};

// Health check
export const healthCheck = async () => {
  try {
    const connection = await getSql();
    await connection`SELECT 1`;
    return { status: 'healthy', timestamp: new Date().toISOString() };
  } catch (error) {
    return { status: 'unhealthy', error: error instanceof Error ? error.message : String(error), timestamp: new Date().toISOString() };
  }
};