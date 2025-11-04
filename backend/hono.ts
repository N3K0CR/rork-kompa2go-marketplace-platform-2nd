import { Hono } from "hono";
import { trpcServer } from "@hono/trpc-server";
import { appRouter } from "@/backend/trpc/app-router";
import { createContext } from "@/backend/trpc/create-context";
import { healthCheck } from "@/lib/db/index";
import { rateLimitMiddleware, securityHeadersMiddleware } from "@/backend/middleware/security";

// app will be mounted at /api
const app = new Hono();

// Enable CORS FIRST - must be before other middleware
app.use("*", async (c, next) => {
  c.header('Access-Control-Allow-Origin', '*');
  c.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  c.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, content-type');
  c.header('Access-Control-Max-Age', '86400');
  
  if (c.req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, content-type',
        'Access-Control-Max-Age': '86400'
      }
    });
  }
  
  await next();
});

// Security middleware - DDoS protection (after CORS)
app.use("*", rateLimitMiddleware);
app.use("*", securityHeadersMiddleware);

// Mount tRPC router at /trpc
app.use(
  "/trpc/*",
  trpcServer({
    endpoint: "/api/trpc",
    router: appRouter,
    createContext,
  })
);

// Simple health check endpoint
app.get("/", (c) => {
  return c.json({ status: "ok", message: "API is running" });
});

// Debug endpoint to check environment
app.get("/debug/env", (c) => {
  return c.json({
    googleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ? 'Configured' : 'Missing',
    firebaseProject: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || 'Missing',
    nodeEnv: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  });
});

// Database health check endpoint
app.get("/health/db", async (c) => {
  try {
    const dbHealth = await healthCheck();
    return c.json(dbHealth);
  } catch (error) {
    console.warn('⚠️ Database unavailable, running without PostgreSQL');
    return c.json({ 
      status: "degraded", 
      note: "Running without PostgreSQL - using Firebase",
      timestamp: new Date().toISOString() 
    }, 200);
  }
});

// Security monitoring endpoint
app.get("/security/stats", (c) => {
  // Solo permitir en desarrollo o con token de admin
  const adminToken = c.req.header('x-admin-token');
  if (process.env.NODE_ENV === 'production' && adminToken !== process.env.ADMIN_TOKEN) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  return c.json({
    status: "DDoS protection active",
    activeConnections: 0, // Placeholder
    rateLimitConfig: {
      windowMs: 60000,
      maxRequests: 100,
      blockDuration: 900000
    },
    timestamp: new Date().toISOString()
  });
});

export default app;