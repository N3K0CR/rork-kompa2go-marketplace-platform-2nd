#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

const __dirname = process.cwd();

console.log('🚀 Iniciando Backend de Kompa2Go...\n');

// Iniciar el backend con bunx rork start
const backend = spawn('bunx', ['rork', 'start', '-p', 'z5be445fq2fb0yuu32aht'], {
  cwd: path.join(__dirname),
  stdio: 'inherit',
  shell: true
});

backend.on('error', (error) => {
  console.error('❌ Error al iniciar backend:', error);
  process.exit(1);
});

backend.on('exit', (code) => {
  if (code !== 0) {
    console.error(`❌ Backend terminó con código ${code}`);
    process.exit(code);
  }
});

// Manejar señales de terminación
process.on('SIGINT', () => {
  console.log('\n🛑 Deteniendo backend...');
  backend.kill('SIGINT');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Deteniendo backend...');
  backend.kill('SIGTERM');
  process.exit(0);
});

console.log('✅ Backend iniciado en segundo plano');
console.log('🌐 Backend API: http://localhost:8081/api');
console.log('🌐 tRPC: http://localhost:8081/api/trpc');
console.log('\n📝 Presiona Ctrl+C para detener\n');
