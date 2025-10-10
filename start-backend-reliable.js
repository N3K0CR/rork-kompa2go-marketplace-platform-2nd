#!/usr/bin/env node

const { spawn, exec } = require('child_process');
const path = require('path');
const http = require('http');

const PORT = 8082;
const HOST = '0.0.0.0';
const MAX_RETRIES = 3;
const HEALTH_CHECK_TIMEOUT = 10000;

console.log('🚀 Kompa2Go Backend Startup Script');
console.log('=====================================');

function checkPort(port) {
  return new Promise((resolve) => {
    const command = process.platform === 'win32' 
      ? `netstat -ano | findstr :${port}`
      : `lsof -ti:${port}`;
    
    exec(command, (error, stdout) => {
      if (stdout) {
        console.log(`⚠️  Port ${port} is in use`);
        const pid = process.platform === 'win32'
          ? stdout.split(/\s+/).pop()
          : stdout.trim();
        console.log(`   Process ID: ${pid}`);
        resolve(false);
      } else {
        console.log(`✅ Port ${port} is available`);
        resolve(true);
      }
    });
  });
}

function killPort(port) {
  return new Promise((resolve) => {
    const command = process.platform === 'win32'
      ? `FOR /F "tokens=5" %P IN ('netstat -ano ^| findstr :${port}') DO taskkill /F /PID %P`
      : `lsof -ti:${port} | xargs kill -9`;
    
    console.log(`🔄 Attempting to free port ${port}...`);
    exec(command, (error) => {
      if (error) {
        console.log(`   Could not kill process on port ${port}`);
      } else {
        console.log(`   ✅ Port ${port} freed`);
      }
      setTimeout(resolve, 1000);
    });
  });
}

function healthCheck() {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: PORT,
      path: '/api',
      method: 'GET',
      timeout: 5000
    };

    const req = http.request(options, (res) => {
      if (res.statusCode === 200) {
        resolve(true);
      } else {
        resolve(false);
      }
    });

    req.on('error', () => resolve(false));
    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });

    req.end();
  });
}

async function waitForHealthy(maxWaitMs = HEALTH_CHECK_TIMEOUT) {
  const startTime = Date.now();
  const checkInterval = 1000;

  console.log('🔍 Waiting for backend to be healthy...');

  while (Date.now() - startTime < maxWaitMs) {
    const isHealthy = await healthCheck();
    
    if (isHealthy) {
      console.log('✅ Backend is healthy and responding!');
      console.log(`   Health check: http://localhost:${PORT}/api`);
      console.log(`   tRPC endpoint: http://localhost:${PORT}/api/trpc`);
      return true;
    }

    await new Promise(resolve => setTimeout(resolve, checkInterval));
    process.stdout.write('.');
  }

  console.log('\n❌ Backend health check timeout');
  return false;
}

async function startBackend() {
  const __dirname = process.cwd();

  console.log('\n📦 Starting backend process...');
  console.log(`   Directory: ${__dirname}`);
  console.log(`   Port: ${PORT}`);
  console.log(`   Host: ${HOST}`);

  const backendProcess = spawn('node', [
    '--loader', 'tsx',
    path.join(__dirname, 'backend', 'server.ts')
  ], {
    env: {
      ...process.env,
      PORT: PORT.toString(),
      HOST: HOST,
      NODE_ENV: process.env.NODE_ENV || 'development'
    },
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: false,
    detached: false
  });

  backendProcess.stdout.on('data', (data) => {
    process.stdout.write(data);
  });

  backendProcess.stderr.on('data', (data) => {
    process.stderr.write(data);
  });

  backendProcess.on('error', (error) => {
    console.error('❌ Failed to start backend:', error.message);
  });

  backendProcess.on('exit', (code, signal) => {
    if (code !== 0 && code !== null) {
      console.error(`❌ Backend exited with code ${code}`);
    }
    if (signal) {
      console.log(`👋 Backend stopped by signal ${signal}`);
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

  return backendProcess;
}

async function main() {
  let retries = 0;

  while (retries < MAX_RETRIES) {
    if (retries > 0) {
      console.log(`\n🔄 Retry attempt ${retries}/${MAX_RETRIES}`);
    }

    const portAvailable = await checkPort(PORT);

    if (!portAvailable) {
      await killPort(PORT);
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    const backendProcess = await startBackend();

    await new Promise(resolve => setTimeout(resolve, 3000));

    const isHealthy = await waitForHealthy();

    if (isHealthy) {
      console.log('\n✅ Backend started successfully!');
      console.log('=====================================');
      console.log(`🌐 API Base URL: http://localhost:${PORT}/api`);
      console.log(`🔌 tRPC Endpoint: http://localhost:${PORT}/api/trpc`);
      console.log(`💚 Health Check: http://localhost:${PORT}/api/health/db`);
      console.log('=====================================\n');
      return;
    }

    console.log('❌ Backend failed to start properly');
    backendProcess.kill('SIGTERM');
    await new Promise(resolve => setTimeout(resolve, 2000));

    retries++;
  }

  console.error('\n❌ Failed to start backend after multiple attempts');
  console.error('Please check the logs above for errors');
  process.exit(1);
}

main().catch((error) => {
  console.error('❌ Unexpected error:', error);
  process.exit(1);
});
