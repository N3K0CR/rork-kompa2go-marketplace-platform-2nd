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
  c.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  c.header('Access-Control-Max-Age', '86400');
  c.header('Access-Control-Allow-Credentials', 'true');
  
  if (c.req.method === 'OPTIONS') {
    return c.body(null, 204);
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