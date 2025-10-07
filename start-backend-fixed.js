#!/usr/bin/env node

/**
 * Backend Starter Script
 * Soluciona el problema de Bun con React Native
 */

const { spawn } = require('child_process');

const PORT = process.env.PORT || 8082;
const HOST = process.env.HOST || '0.0.0.0';

console.log('🚀 Iniciando backend en Node.js...');
console.log(`📍 Puerto: ${PORT}`);
console.log(`📍 Host: ${HOST}`);

// Usar tsx para ejecutar TypeScript directamente
const backend = spawn('npx', ['tsx', 'backend/server.ts'], {
  stdio: 'inherit',
  env: {
    ...process.env,
    PORT,
    HOST,
    NODE_ENV: process.env.NODE_ENV || 'development'
  }
});

backend.on('error', (error) => {
  console.error('❌ Error al iniciar backend:', error);
  process.exit(1);
});

backend.on('exit', (code) => {
  if (code !== 0) {
    console.error(`❌ Backend terminó con código: ${code}`);
    process.exit(code);
  }
});

// Manejar señales de terminación
process.on('SIGINT', () => {
  console.log('\n⏹️  Deteniendo backend...');
  backend.kill('SIGINT');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n⏹️  Deteniendo backend...');
  backend.kill('SIGTERM');
  process.exit(0);
});
