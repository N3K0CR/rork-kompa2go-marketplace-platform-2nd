import { Platform } from 'react-native';

// Platform-specific imports to avoid SharedArrayBuffer issues on web
let sqliteTable: any, text: any, integer: any, real: any;
let createInsertSchema: any, createSelectSchema: any;

if (Platform.OS !== 'web') {
  try {
    const sqliteCore = require('drizzle-orm/sqlite-core');
    const drizzleZod = require('drizzle-zod');
    
    sqliteTable = sqliteCore.sqliteTable;
    text = sqliteCore.text;
    integer = sqliteCore.integer;
    real = sqliteCore.real;
    createInsertSchema = drizzleZod.createInsertSchema;
    createSelectSchema = drizzleZod.createSelectSchema;
  } catch (error) {
    console.error('Failed to load SQLite schema modules:', error);
  }
} else {
  // Mock functions for web to prevent errors
  const mockTable = (name: string, columns: any) => ({ name, columns });
  const mockColumn = (name: string) => ({ name });
  const mockSchema = (table: any) => ({ table });
  
  sqliteTable = mockTable;
  text = () => mockColumn('text');
  integer = () => mockColumn('integer');
  real = () => mockColumn('real');
  createInsertSchema = mockSchema;
  createSelectSchema = mockSchema;
}


// Users table
export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').unique(),
  phone: text('phone'),
  avatar: text('avatar'),
  userType: text('user_type', { enum: ['client', 'provider'] }).notNull().default('client'),
  location: text('location'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

// Services table
export const services = sqliteTable('services', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  category: text('category').notNull(),
  description: text('description'),
  price: real('price'),
  duration: integer('duration'), // in minutes
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

// Providers table
export const providers = sqliteTable('providers', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  businessName: text('business_name'),
  description: text('description'),
  location: text('location'),
  rating: real('rating').default(0),
  totalReviews: integer('total_reviews').default(0),
  isVerified: integer('is_verified', { mode: 'boolean' }).default(false),
  requiresPass: integer('requires_pass', { mode: 'boolean' }).default(true),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

// Provider Services junction table
export const providerServices = sqliteTable('provider_services', {
  id: text('id').primaryKey(),
  providerId: text('provider_id').notNull().references(() => providers.id),
  serviceId: text('service_id').notNull().references(() => services.id),
  customPrice: real('custom_price'),
  customDuration: integer('custom_duration'),
  isAvailable: integer('is_available', { mode: 'boolean' }).default(true),
});

// Appointments table
export const appointments = sqliteTable('appointments', {
  id: text('id').primaryKey(),
  clientId: text('client_id').notNull().references(() => users.id),
  providerId: text('provider_id').notNull().references(() => providers.id),
  serviceId: text('service_id').notNull().references(() => services.id),
  scheduledAt: integer('scheduled_at', { mode: 'timestamp' }).notNull(),
  status: text('status', { enum: ['pending', 'confirmed', 'completed', 'cancelled'] }).notNull().default('pending'),
  price: real('price').notNull(),
  notes: text('notes'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

// Chat messages table
export const chatMessages = sqliteTable('chat_messages', {
  id: text('id').primaryKey(),
  chatId: text('chat_id').notNull(),
  senderId: text('sender_id').notNull().references(() => users.id),
  content: text('content').notNull(),
  messageType: text('message_type', { enum: ['text', 'image', 'location'] }).default('text'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

// OKoins transactions table
export const okoinsTransactions = sqliteTable('okoins_transactions', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  amount: integer('amount').notNull(),
  type: text('type', { enum: ['earned', 'spent', 'bonus'] }).notNull(),
  description: text('description').notNull(),
  relatedId: text('related_id'), // appointment_id, purchase_id, etc.
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

// Wallet transactions table
export const walletTransactions = sqliteTable('wallet_transactions', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  amount: real('amount').notNull(),
  type: text('type', { enum: ['deposit', 'withdrawal', 'payment', 'refund'] }).notNull(),
  status: text('status', { enum: ['pending', 'completed', 'failed'] }).notNull().default('pending'),
  description: text('description').notNull(),
  relatedId: text('related_id'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

// Reviews table
export const reviews = sqliteTable('reviews', {
  id: text('id').primaryKey(),
  appointmentId: text('appointment_id').notNull().references(() => appointments.id),
  clientId: text('client_id').notNull().references(() => users.id),
  providerId: text('provider_id').notNull().references(() => providers.id),
  rating: integer('rating').notNull(),
  comment: text('comment'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

// Zod schemas for validation (only create on native platforms)
export const insertUserSchema = Platform.OS !== 'web' ? createInsertSchema(users) : null;
export const selectUserSchema = Platform.OS !== 'web' ? createSelectSchema(users) : null;
export const insertServiceSchema = Platform.OS !== 'web' ? createInsertSchema(services) : null;
export const selectServiceSchema = Platform.OS !== 'web' ? createSelectSchema(services) : null;
export const insertProviderSchema = Platform.OS !== 'web' ? createInsertSchema(providers) : null;
export const selectProviderSchema = Platform.OS !== 'web' ? createSelectSchema(providers) : null;
export const insertAppointmentSchema = Platform.OS !== 'web' ? createInsertSchema(appointments) : null;
export const selectAppointmentSchema = Platform.OS !== 'web' ? createSelectSchema(appointments) : null;
export const insertChatMessageSchema = Platform.OS !== 'web' ? createInsertSchema(chatMessages) : null;
export const selectChatMessageSchema = Platform.OS !== 'web' ? createSelectSchema(chatMessages) : null;
export const insertOkoinsTransactionSchema = Platform.OS !== 'web' ? createInsertSchema(okoinsTransactions) : null;
export const selectOkoinsTransactionSchema = Platform.OS !== 'web' ? createSelectSchema(okoinsTransactions) : null;
export const insertWalletTransactionSchema = Platform.OS !== 'web' ? createInsertSchema(walletTransactions) : null;
export const selectWalletTransactionSchema = Platform.OS !== 'web' ? createSelectSchema(walletTransactions) : null;
export const insertReviewSchema = Platform.OS !== 'web' ? createInsertSchema(reviews) : null;
export const selectReviewSchema = Platform.OS !== 'web' ? createSelectSchema(reviews) : null;

// Types
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Service = typeof services.$inferSelect;
export type NewService = typeof services.$inferInsert;
export type Provider = typeof providers.$inferSelect;
export type NewProvider = typeof providers.$inferInsert;
export type Appointment = typeof appointments.$inferSelect;
export type NewAppointment = typeof appointments.$inferInsert;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type NewChatMessage = typeof chatMessages.$inferInsert;
export type OkoinsTransaction = typeof okoinsTransactions.$inferSelect;
export type NewOkoinsTransaction = typeof okoinsTransactions.$inferInsert;
export type WalletTransaction = typeof walletTransactions.$inferSelect;
export type NewWalletTransaction = typeof walletTransactions.$inferInsert;
export type Review = typeof reviews.$inferSelect;
export type NewReview = typeof reviews.$inferInsert;