#!/usr/bin/env node

const { spawn } = require('child_process');

console.log('🚀 Iniciando Backend de Kompa2Go...\n');

const backend = spawn('bunx', ['rork', 'start', '-p', 'z5be445fq2fb0yuu32aht'], {
  cwd: '/home/user/rork-app',
  stdio: 'inherit',
  detached: false,
  shell: true
});

backend.on('error', (error) => {
  console.error('❌ Error al iniciar backend:', error);
  process.exit(1);
});

backend.on('exit', (code) => {
  if (code !== 0) {
    console.error(`❌ Backend terminó con código ${code}`);
  }
  process.exit(code || 0);
});

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

console.log('✅ Backend iniciado');
console.log('🌐 Backend API: http://localhost:8082/api');
console.log('🌐 tRPC: http://localhost:8082/api/trpc');
console.log('\n📝 Presiona Ctrl+C para detener\n');
