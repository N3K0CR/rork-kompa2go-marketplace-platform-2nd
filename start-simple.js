#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const PORT = 8082;

function loadEnv() {
  const envPath = path.join(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const envVars = {};
    envContent.split('\n').forEach(line => {
      const match = line.match(/^([^=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        const value = match[2].trim().replace(/^["']|["']$/g, '');
        envVars[key] = value;
      }
    });
    return envVars;
  }
  return {};
}

console.log('\n🚀 Iniciando Kompa2Go (Modo Simple)');
console.log('=====================================\n');

const envVars = loadEnv();

// Iniciar backend
console.log('📦 Iniciando backend en puerto', PORT, '...');
const backendProcess = spawn('bun', ['run', 'backend/server.ts'], {
  env: {
    ...process.env,
    ...envVars,
    PORT: PORT.toString(),
    HOST: '0.0.0.0',
    NODE_ENV: 'development'
  },
  stdio: 'inherit'
});

// Esperar 5 segundos y luego iniciar frontend
setTimeout(() => {
  console.log('\n📱 Iniciando frontend...\n');
  const frontendProcess = spawn('bun', ['x', 'rork', 'start', '-p', 'z5be445fq2fb0yuu32aht', '--tunnel'], {
    stdio: 'inherit'
  });

  frontendProcess.on('error', (err) => {
    console.error('❌ Error en frontend:', err);
  });

  // Manejar Ctrl+C
  process.on('SIGINT', () => {
    console.log('\n\n🛑 Deteniendo servicios...');
    backendProcess.kill('SIGTERM');
    frontendProcess.kill('SIGTERM');
    setTimeout(() => {
      console.log('👋 Servicios detenidos!');
      process.exit(0);
    }, 1000);
  });

}, 5000);

backendProcess.on('error', (err) => {
  console.error('❌ Error en backend:', err);
  process.exit(1);
});

backendProcess.on('exit', (code) => {
  if (code !== 0) {
    console.error(`❌ Backend terminó con código ${code}`);
    process.exit(code);
  }
});
