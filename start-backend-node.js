#!/usr/bin/env node

const { spawn, exec } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

const __dirname = process.cwd();

console.log('🚀 Iniciando Backend de Kompa2Go...\n');

// Crear directorio de logs si no existe
const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
  console.log('📁 Directorio de logs creado\n');
}

// Verificar si el puerto 8082 está en uso
exec('lsof -Pi :8082 -sTCP:LISTEN -t', (error, stdout) => {
  if (stdout.trim()) {
    console.log('⚠️  Puerto 8082 ya está en uso. Deteniendo proceso...');
    exec(`kill -9 ${stdout.trim()}`, () => {
      setTimeout(startBackend, 2000);
    });
  } else {
    startBackend();
  }
});

function startBackend() {
  console.log('📦 Iniciando servidor backend en puerto 8082...\n');
  
  const logFile = fs.createWriteStream(path.join(logsDir, 'backend.log'), { flags: 'a' });
  
  const backend = spawn('bunx', ['rork', 'start', '-p', 'z5be445fq2fb0yuu32aht'], {
    detached: true,
    stdio: ['ignore', logFile, logFile]
  });
  
  backend.unref();
  
  console.log(`✅ Backend iniciado con PID: ${backend.pid}\n`);
  
  // Esperar a que el backend esté listo
  console.log('⏳ Esperando a que el backend esté listo...');
  
  let attempts = 0;
  const maxAttempts = 30;
  
  const checkBackend = setInterval(() => {
    attempts++;
    
    const req = http.get('http://localhost:8082/api', (res) => {
      clearInterval(checkBackend);
      console.log('✅ Backend está listo y respondiendo\n');
      console.log('🌐 Backend API: http://localhost:8082/api');
      console.log('🔌 tRPC Endpoint: http://localhost:8082/api/trpc\n');
      console.log(`📝 Ver logs: tail -f logs/backend.log`);
      console.log(`🛑 Detener: kill ${backend.pid}\n`);
      process.exit(0);
    });
    
    req.on('error', () => {
      if (attempts >= maxAttempts) {
        clearInterval(checkBackend);
        console.log('❌ El backend no respondió después de 30 segundos');
        console.log('📝 Revisa los logs: tail -f logs/backend.log');
        process.exit(1);
      }
    });
    
    req.end();
  }, 1000);
}
