import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { trpcServer } from '@hono/trpc-server';
import { appRouter } from '@/backend/trpc/app-router';
import { createContext } from '@/backend/trpc/create-context';

const app = new Hono();

app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

app.options('*', (c) => c.body(null, 204));

app.get('/api/', (c) => c.json({ message: 'Kompa2Go API', version: '1.0.0' }));

app.use('/api/trpc/*', trpcServer({
  router: appRouter,
  createContext,
}));

export default app;
export type AppType = typeof app;