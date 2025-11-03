#!/usr/bin/env node

/**
 * Script de inicio unificado para Kompa2Go
 * Inicia el backend (Hono/tRPC) y el frontend (Expo) en paralelo
 * Con auto-reload en cambios de código
 */

const { spawn } = require('child_process');

console.log('🚀 Iniciando Kompa2Go Development Environment...\n');
console.log('📦 Backend: Hono/tRPC Server (con auto-reload)');
console.log('📱 Frontend: Expo React Native App\n');

// Colores para los logs
const colors = {
  backend: '\x1b[44m\x1b[1m',
  frontend: '\x1b[45m\x1b[1m',
  reset: '\x1b[0m',
};

// Función para crear un proceso con logs coloreados
function createProcess(name, command, args, color) {
  const proc = spawn(command, args, {
    stdio: 'pipe',
    shell: true,
    cwd: process.cwd(),
  });

  proc.stdout.on('data', (data) => {
    const lines = data.toString().split('\n');
    lines.forEach((line) => {
      if (line.trim()) {
        console.log(`${color}[${name}]${colors.reset} ${line}`);
      }
    });
  });

  proc.stderr.on('data', (data) => {
    const lines = data.toString().split('\n');
    lines.forEach((line) => {
      if (line.trim()) {
        console.error(`${color}[${name}]${colors.reset} ${line}`);
      }
    });
  });

  proc.on('error', (error) => {
    console.error(`${color}[${name}]${colors.reset} ❌ Error: ${error.message}`);
  });

  proc.on('close', (code) => {
    if (code !== 0 && code !== null) {
      console.log(`${color}[${name}]${colors.reset} ⚠️ Proceso terminado con código ${code}`);
    }
  });

  return proc;
}

// Iniciar backend con nodemon (auto-reload)
const backend = createProcess(
  'BACKEND',
  './node_modules/.bin/nodemon',
  ['--watch', 'backend', '--ext', 'ts,js,json', '--exec', './node_modules/.bin/tsx backend/server.ts'],
  colors.backend
);

// Iniciar frontend con Expo
const frontend = createProcess(
  'FRONTEND',
  'bun',
  ['x', 'rork', 'start', '-p', 'z5be445fq2fb0yuu32aht', '--tunnel'],
  colors.frontend
);

// Manejar señales de terminación
process.on('SIGINT', () => {
  console.log('\n\n🛑 Deteniendo servicios...');
  backend.kill('SIGTERM');
  frontend.kill('SIGTERM');
  setTimeout(() => {
    process.exit(0);
  }, 1000);
});

process.on('SIGTERM', () => {
  backend.kill('SIGTERM');
  frontend.kill('SIGTERM');
  setTimeout(() => {
    process.exit(0);
  }, 1000);
});

// Mantener el proceso principal vivo
process.stdin.resume();

console.log('\n✅ Servicios iniciados. Presiona Ctrl+C para detener.\n');
