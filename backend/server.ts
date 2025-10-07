import { serve } from "@hono/node-server";
import app from "./hono";

const PORT = parseInt(process.env.PORT || "8082", 10);
const HOST = process.env.HOST || "0.0.0.0";

console.log("🚀 Starting Kompa2Go Backend...");
console.log(`📍 Port: ${PORT}`);
console.log(`📍 Host: ${HOST}`);
console.log(`📍 Environment: ${process.env.NODE_ENV || "development"}`);

const server = serve({
  fetch: app.fetch,
  port: PORT,
  hostname: HOST,
});

console.log(`✅ Backend running at http://${HOST}:${PORT}`);
console.log(`✅ tRPC endpoint: http://${HOST}:${PORT}/api/trpc`);
console.log(`✅ Health check: http://${HOST}:${PORT}/api/health/db`);

process.on("SIGINT", () => {
  console.log("\n👋 Shutting down backend...");
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("\n👋 Shutting down backend...");
  process.exit(0);
});
