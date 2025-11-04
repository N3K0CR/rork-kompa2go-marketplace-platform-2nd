#!/usr/bin/env node

const { spawn, exec } = require('child_process');
const path = require('path');

const PORT = 8082;
const HOST = '0.0.0.0';

console.log('🚀 Starting Kompa2Go Backend...');
console.log(`📍 Port: ${PORT}`);
console.log(`📍 Host: ${HOST}`);
console.log('=====================================\n');

function killPort(port) {
  return new Promise((resolve) => {
    const command = process.platform === 'win32'
      ? `FOR /F "tokens=5" %P IN ('netstat -ano ^| findstr :${port}') DO taskkill /F /PID %P`
      : `lsof -ti:${port} | xargs kill -9 2>/dev/null || true`;
    
    console.log(`🔄 Freeing port ${port}...`);
    exec(command, () => {
      setTimeout(resolve, 1000);
    });
  });
}

async function main() {
  await killPort(PORT);

  console.log('📦 Starting backend process...\n');

  const backendProcess = spawn('node', [
    '--import', 'tsx',
    path.join(process.cwd(), 'backend', 'server.ts')
  ], {
    env: {
      ...process.env,
      PORT: PORT.toString(),
      HOST: HOST,
      NODE_ENV: process.env.NODE_ENV || 'development'
    },
    stdio: 'inherit',
    shell: false
  });

  backendProcess.on('error', (error) => {
    console.error('❌ Failed to start backend:', error.message);
    process.exit(1);
  });

  backendProcess.on('exit', (code) => {
    if (code !== 0 && code !== null) {
      console.error(`❌ Backend exited with code ${code}`);
      process.exit(code);
    }
  });

  process.on('SIGINT', () => {
    console.log('\n👋 Shutting down backend...');
    backendProcess.kill('SIGINT');
    setTimeout(() => process.exit(0), 1000);
  });

  process.on('SIGTERM', () => {
    console.log('\n👋 Shutting down backend...');
    backendProcess.kill('SIGTERM');
    setTimeout(() => process.exit(0), 1000);
  });
}

main().catch((error) => {
  console.error('❌ Unexpected error:', error);
  process.exit(1);
});
