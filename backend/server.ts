/**
 * Backend Server Entry Point
 * Servidor HTTP que monta la aplicación Hono
 */

import { serve } from '@hono/node-server';
import app from './hono';

const PORT = parseInt(process.env.PORT || '8082', 10);
const HOST = process.env.HOST || '0.0.0.0';

console.log('🔧 Configurando servidor...');

serve({
  fetch: app.fetch,
  port: PORT,
  hostname: HOST,
}, (info) => {
  console.log('✅ Backend iniciado correctamente');
  console.log(`📍 Servidor escuchando en: http://${info.address}:${info.port}`);
  console.log(`📍 API disponible en: http://${info.address}:${info.port}/api`);
  console.log(`📍 tRPC endpoint: http://${info.address}:${info.port}/api/trpc`);
  console.log(`📍 Health check: http://${info.address}:${info.port}/api/health/db`);
});

// Manejo de señales de terminación
process.on('SIGINT', () => {
  console.log('\n⏹️  Deteniendo servidor...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n⏹️  Deteniendo servidor...');
  process.exit(0);
});
