import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { trpcServer } from '@hono/trpc-server';
import { appRouter } from '@/backend/trpc/app-router';
import { createContext } from '@/backend/trpc/create-context';
import { rateLimitMiddleware } from '@/backend/middleware/security';

// Main application instance
const app = new Hono();

// Apply CORS middleware FIRST to handle preflight requests
app.use('*', cors({
  origin: '*', // Allow all origins for development
  allowMethods: ['GET', 'POST', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

// Handle OPTIONS requests explicitly for safety
app.options('*', (c) => c.body(null, 204));

// Apply other middlewares
app.use('*', rateLimitMiddleware);

// Health check endpoint
app.get('/api/', (c) => c.json({ status: 'ok', timestamp: new Date().toISOString() }));

// tRPC server middleware
app.use('/api/trpc/*', trpcServer({
  router: appRouter,
  createContext,
}));

export default app;
export type AppType = typeof app;
