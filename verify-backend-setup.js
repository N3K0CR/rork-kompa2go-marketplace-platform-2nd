#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const http = require('http');

console.log('🔍 Kompa2Go Backend Setup Verification');
console.log('=========================================\n');

const checks = [];

function addCheck(name, status, message) {
  checks.push({ name, status, message });
}

function checkFileExists(filePath, description) {
  const exists = fs.existsSync(filePath);
  addCheck(
    description,
    exists ? 'PASS' : 'FAIL',
    exists ? `Found: ${filePath}` : `Missing: ${filePath}`
  );
  return exists;
}

function checkEnvVariable(varName) {
  return new Promise((resolve) => {
    const envPath = path.join(process.cwd(), '.env.local');
    
    if (!fs.existsSync(envPath)) {
      addCheck(
        `Environment Variable: ${varName}`,
        'FAIL',
        '.env.local file not found'
      );
      resolve(false);
      return;
    }

    const content = fs.readFileSync(envPath, 'utf8');
    const regex = new RegExp(`^${varName}=(.+)$`, 'm');
    const match = content.match(regex);

    if (match) {
      addCheck(
        `Environment Variable: ${varName}`,
        'PASS',
        `Set to: ${match[1]}`
      );
      resolve(true);
    } else {
      addCheck(
        `Environment Variable: ${varName}`,
        'FAIL',
        `${varName} not found in .env.local`
      );
      resolve(false);
    }
  });
}

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
        addCheck(
          'Backend Process',
          'PASS',
          `Running on port ${port} (PID: ${pid.trim()})`
        );
        resolve(true);
      } else {
        addCheck(
          'Backend Process',
          'WARN',
          `No process found on port ${port} (backend not running)`
        );
        resolve(false);
      }
    });
  });
}

function checkEndpoint(url, name) {
  return new Promise((resolve) => {
    const urlObj = new URL(url);
    
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname,
      method: 'GET',
      timeout: 5000
    };

    const req = http.request(options, (res) => {
      if (res.statusCode === 200) {
        addCheck(
          `Endpoint: ${name}`,
          'PASS',
          `${url} - Status ${res.statusCode}`
        );
        resolve(true);
      } else {
        addCheck(
          `Endpoint: ${name}`,
          'WARN',
          `${url} - Status ${res.statusCode}`
        );
        resolve(false);
      }
    });

    req.on('error', () => {
      addCheck(
        `Endpoint: ${name}`,
        'FAIL',
        `${url} - Not reachable (backend not running?)`
      );
      resolve(false);
    });

    req.on('timeout', () => {
      req.destroy();
      addCheck(
        `Endpoint: ${name}`,
        'FAIL',
        `${url} - Timeout`
      );
      resolve(false);
    });

    req.end();
  });
}

function printResults() {
  console.log('\n📊 Verification Results:\n');
  
  let passCount = 0;
  let warnCount = 0;
  let failCount = 0;

  checks.forEach(check => {
    let icon;
    switch (check.status) {
      case 'PASS':
        icon = '✅';
        passCount++;
        break;
      case 'WARN':
        icon = '⚠️ ';
        warnCount++;
        break;
      case 'FAIL':
        icon = '❌';
        failCount++;
        break;
    }
    
    console.log(`${icon} ${check.name}`);
    console.log(`   ${check.message}\n`);
  });

  console.log('=========================================');
  console.log(`✅ Passed: ${passCount}`);
  console.log(`⚠️  Warnings: ${warnCount}`);
  console.log(`❌ Failed: ${failCount}`);
  console.log('=========================================\n');

  if (failCount === 0 && warnCount === 0) {
    console.log('🎉 Perfect! Everything is set up correctly!\n');
    return true;
  } else if (failCount === 0) {
    console.log('✅ Setup is good! Warnings are usually about backend not running.\n');
    console.log('To start the backend, run:');
    console.log('   node backend-manager.js start\n');
    return true;
  } else {
    console.log('⚠️  Some checks failed. Please review the issues above.\n');
    return false;
  }
}

async function main() {
  console.log('Checking files...\n');

  // Check management scripts
  checkFileExists('./backend-manager.js', 'Backend Manager Script');
  checkFileExists('./start-backend-reliable.js', 'Reliable Start Script');
  checkFileExists('./check-backend-status.js', 'Status Check Script');

  // Check documentation
  checkFileExists('./LEEME_BACKEND.md', 'Quick Reference (Spanish)');
  checkFileExists('./BACKEND_QUICK_START.md', 'Quick Start Guide');
  checkFileExists('./BACKEND_MANAGEMENT.md', 'Complete Management Guide');

  // Check backend files
  checkFileExists('./backend/hono.ts', 'Backend Main File');
  checkFileExists('./backend/server.ts', 'Backend Server File');
  checkFileExists('./backend/trpc/app-router.ts', 'tRPC Router');

  // Check configuration files
  checkFileExists('./.env.local', 'Environment File');
  checkFileExists('./lib/trpc.ts', 'tRPC Client Configuration');

  console.log('\nChecking environment variables...\n');

  // Check environment variables
  await checkEnvVariable('EXPO_PUBLIC_RORK_API_BASE_URL');

  console.log('\nChecking backend process...\n');

  // Check if backend is running
  const backendRunning = await checkPort(8082);

  if (backendRunning) {
    console.log('\nChecking backend endpoints...\n');

    // Check endpoints
    await checkEndpoint('http://localhost:8082/api', 'API Root');
    await checkEndpoint('http://localhost:8082/api/health/db', 'Health Check');
  } else {
    addCheck(
      'Backend Endpoints',
      'SKIP',
      'Skipped (backend not running)'
    );
  }

  // Print results
  const success = printResults();

  // Provide next steps
  if (!backendRunning) {
    console.log('💡 Next Steps:\n');
    console.log('1. Start the backend:');
    console.log('   node backend-manager.js start\n');
    console.log('2. Run this verification again:');
    console.log('   node verify-backend-setup.js\n');
  } else {
    console.log('💡 You\'re ready to develop!\n');
    console.log('Start your app with:');
    console.log('   npm start\n');
  }

  process.exit(success ? 0 : 1);
}

main().catch((error) => {
  console.error('❌ Verification error:', error);
  process.exit(1);
});
