#!/usr/bin/env node

const http = require('http');
const { exec } = require('child_process');

const PORT = 8082;
const ENDPOINTS = [
  { path: '/api', name: 'API Root' },
  { path: '/api/health/db', name: 'Database Health' },
  { path: '/api/trpc', name: 'tRPC Endpoint' }
];

console.log('🔍 Checking Kompa2Go Backend Status');
console.log('=====================================\n');

function checkPort(port) {
  return new Promise((resolve) => {
    const command = process.platform === 'win32' 
      ? `netstat -ano | findstr :${port}`
      : `lsof -ti:${port}`;
    
    exec(command, (error, stdout) => {
      if (stdout) {
        const pid = process.platform === 'win32'
          ? stdout.split(/\s+/).pop()
          : stdout.trim();
        resolve({ running: true, pid: pid.trim() });
      } else {
        resolve({ running: false, pid: null });
      }
    });
  });
}

function checkEndpoint(path, name) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: PORT,
      path: path,
      method: 'GET',
      timeout: 5000
    };

    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        resolve({
          name,
          path,
          status: res.statusCode,
          ok: res.statusCode === 200,
          data: data.substring(0, 200)
        });
      });
    });

    req.on('error', (error) => {
      resolve({
        name,
        path,
        status: 'ERROR',
        ok: false,
        error: error.message
      });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({
        name,
        path,
        status: 'TIMEOUT',
        ok: false,
        error: 'Request timeout'
      });
    });

    req.end();
  });
}

async function main() {
  const portStatus = await checkPort(PORT);

  console.log('📊 Port Status:');
  if (portStatus.running) {
    console.log(`   ✅ Port ${PORT} is in use`);
    console.log(`   📍 Process ID: ${portStatus.pid}`);
  } else {
    console.log(`   ❌ Port ${PORT} is not in use`);
    console.log(`   ⚠️  Backend is not running\n`);
    console.log('To start the backend, run:');
    console.log('   node start-backend-reliable.js\n');
    process.exit(1);
  }

  console.log('\n🔍 Checking Endpoints:\n');

  const results = await Promise.all(
    ENDPOINTS.map(endpoint => checkEndpoint(endpoint.path, endpoint.name))
  );

  let allOk = true;

  results.forEach(result => {
    const icon = result.ok ? '✅' : '❌';
    console.log(`${icon} ${result.name}`);
    console.log(`   Path: ${result.path}`);
    console.log(`   Status: ${result.status}`);
    
    if (result.ok && result.data) {
      try {
        const json = JSON.parse(result.data);
        console.log(`   Response: ${JSON.stringify(json, null, 2).substring(0, 100)}...`);
      } catch {
        console.log(`   Response: ${result.data.substring(0, 50)}...`);
      }
    } else if (result.error) {
      console.log(`   Error: ${result.error}`);
      allOk = false;
    }
    console.log('');
  });

  console.log('=====================================');
  if (allOk) {
    console.log('✅ Backend is running and healthy!');
    console.log(`\n🌐 Base URL: http://localhost:${PORT}/api`);
    console.log(`🔌 tRPC: http://localhost:${PORT}/api/trpc`);
  } else {
    console.log('⚠️  Backend has issues');
    console.log('\nTry restarting with:');
    console.log('   node start-backend-reliable.js');
  }
  console.log('=====================================\n');

  process.exit(allOk ? 0 : 1);
}

main().catch((error) => {
  console.error('❌ Unexpected error:', error);
  process.exit(1);
});
