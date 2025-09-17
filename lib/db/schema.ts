
import { pgTable, text, integer, real, timestamp, boolean, uuid } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';

// Use PostgreSQL for all platforms - more robust for production
const table = pgTable;
const textCol = text;
const integerCol = integer;
const realCol = real;
const timestampCol = timestamp;
const booleanCol = boolean;
const uuidCol = uuid;


// Users table
export const users = table('users', {
  id: uuidCol('id').primaryKey().defaultRandom(),
  name: textCol('name').notNull(),
  email: textCol('email').unique(),
  phone: textCol('phone'),
  avatar: textCol('avatar'),
  userType: textCol('user_type').$type<'client' | 'provider'>().notNull().default('client'),
  location: textCol('location'),
  createdAt: timestampCol('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestampCol('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// Services table
export const services = table('services', {
  id: uuidCol('id').primaryKey().defaultRandom(),
  name: textCol('name').notNull(),
  category: textCol('category').notNull(),
  description: textCol('description'),
  price: realCol('price'),
  duration: integerCol('duration'), // in minutes
  isActive: booleanCol('is_active').notNull().default(true),
  createdAt: timestampCol('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// Providers table
export const providers = table('providers', {
  id: uuidCol('id').primaryKey().defaultRandom(),
  userId: uuidCol('user_id').notNull().references(() => users.id),
  businessName: textCol('business_name'),
  description: textCol('description'),
  location: textCol('location'),
  rating: realCol('rating').default(0),
  totalReviews: integerCol('total_reviews').default(0),
  isVerified: booleanCol('is_verified').default(false),
  requiresPass: booleanCol('requires_pass').default(true),
  createdAt: timestampCol('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// Provider Services junction table
export const providerServices = table('provider_services', {
  id: uuidCol('id').primaryKey().defaultRandom(),
  providerId: uuidCol('provider_id').notNull().references(() => providers.id),
  serviceId: uuidCol('service_id').notNull().references(() => services.id),
  customPrice: realCol('custom_price'),
  customDuration: integerCol('custom_duration'),
  isAvailable: booleanCol('is_available').default(true),
});

// Appointments table
export const appointments = table('appointments', {
  id: uuidCol('id').primaryKey().defaultRandom(),
  clientId: uuidCol('client_id').notNull().references(() => users.id),
  providerId: uuidCol('provider_id').notNull().references(() => providers.id),
  serviceId: uuidCol('service_id').notNull().references(() => services.id),
  scheduledAt: timestampCol('scheduled_at', { withTimezone: true }).notNull(),
  status: textCol('status').$type<'pending' | 'confirmed' | 'completed' | 'cancelled'>().notNull().default('pending'),
  price: realCol('price').notNull(),
  notes: textCol('notes'),
  createdAt: timestampCol('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestampCol('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// Chat messages table
export const chatMessages = table('chat_messages', {
  id: uuidCol('id').primaryKey().defaultRandom(),
  chatId: textCol('chat_id').notNull(),
  senderId: uuidCol('sender_id').notNull().references(() => users.id),
  content: textCol('content').notNull(),
  messageType: textCol('message_type').$type<'text' | 'image' | 'location'>().default('text'),
  createdAt: timestampCol('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// OKoins transactions table
export const okoinsTransactions = table('okoins_transactions', {
  id: uuidCol('id').primaryKey().defaultRandom(),
  userId: uuidCol('user_id').notNull().references(() => users.id),
  amount: integerCol('amount').notNull(),
  type: textCol('type').$type<'earned' | 'spent' | 'bonus'>().notNull(),
  description: textCol('description').notNull(),
  relatedId: textCol('related_id'), // appointment_id, purchase_id, etc.
  createdAt: timestampCol('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// Wallet transactions table
export const walletTransactions = table('wallet_transactions', {
  id: uuidCol('id').primaryKey().defaultRandom(),
  userId: uuidCol('user_id').notNull().references(() => users.id),
  amount: realCol('amount').notNull(),
  type: textCol('type').$type<'deposit' | 'withdrawal' | 'payment' | 'refund'>().notNull(),
  status: textCol('status').$type<'pending' | 'completed' | 'failed'>().notNull().default('pending'),
  description: textCol('description').notNull(),
  relatedId: textCol('related_id'),
  createdAt: timestampCol('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// Reviews table
export const reviews = table('reviews', {
  id: uuidCol('id').primaryKey().defaultRandom(),
  appointmentId: uuidCol('appointment_id').notNull().references(() => appointments.id),
  clientId: uuidCol('client_id').notNull().references(() => users.id),
  providerId: uuidCol('provider_id').notNull().references(() => providers.id),
  rating: integerCol('rating').notNull(),
  comment: textCol('comment'),
  createdAt: timestampCol('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// Zod schemas for validation
export const insertUserSchema = createInsertSchema(users);
export const selectUserSchema = createSelectSchema(users);
export const insertServiceSchema = createInsertSchema(services);
export const selectServiceSchema = createSelectSchema(services);
export const insertProviderSchema = createInsertSchema(providers);
export const selectProviderSchema = createSelectSchema(providers);
export const insertAppointmentSchema = createInsertSchema(appointments);
export const selectAppointmentSchema = createSelectSchema(appointments);
export const insertChatMessageSchema = createInsertSchema(chatMessages);
export const selectChatMessageSchema = createSelectSchema(chatMessages);
export const insertOkoinsTransactionSchema = createInsertSchema(okoinsTransactions);
export const selectOkoinsTransactionSchema = createSelectSchema(okoinsTransactions);
export const insertWalletTransactionSchema = createInsertSchema(walletTransactions);
export const selectWalletTransactionSchema = createSelectSchema(walletTransactions);
export const insertReviewSchema = createInsertSchema(reviews);
export const selectReviewSchema = createSelectSchema(reviews);

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