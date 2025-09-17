import { Hono } from "hono";
import { trpcServer } from "@hono/trpc-server";
import { cors } from "hono/cors";
import { appRouter } from "@/backend/trpc/app-router";
import { createContext } from "@/backend/trpc/create-context";
import { healthCheck } from "@/lib/db/index";
import { rateLimitMiddleware, securityHeadersMiddleware } from "@/backend/middleware/security";

// app will be mounted at /api
const app = new Hono();

// Security middleware - DDoS protection
app.use("*", rateLimitMiddleware);
app.use("*", securityHeadersMiddleware);

// Enable CORS for all routes
app.use("*", cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://yourdomain.com'] // Reemplaza con tu dominio
    : '*',
  credentials: true,
  maxAge: 86400
}));

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

// Database health check endpoint
app.get("/health/db", async (c) => {
  try {
    const dbHealth = await healthCheck();
    return c.json(dbHealth);
  } catch (error) {
    return c.json({ 
      status: "unhealthy", 
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString() 
    }, 500);
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