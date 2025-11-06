import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { trpcServer } from '@hono/trpc-server';
import { appRouter } from '@/backend/trpc/app-router';
import { createContext } from '@/backend/trpc/create-context';
import { rateLimitMiddleware } from '@/backend/middleware/security';

const app = new Hono();

app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

app.options('*', (c) => c.body(null, 204));
app.use('*', rateLimitMiddleware);

app.get('/', (c) => c.json({ 
  message: 'Kompa2Go API', 
  version: '1.0.0',
  status: 'healthy',
  timestamp: new Date().toISOString()
}));

app.use('/trpc/*', trpcServer({
  router: appRouter,
  createContext,
}));

export default app;
export type AppType = typeof app;
