#!/usr/bin/env node

const { spawn, exec } = require('child_process');
const path = require('path');
const http = require('http');
const readline = require('readline');

const PORT = 8082;
const HOST = '0.0.0.0';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
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
        resolve({ running: true, pid: pid.trim() });
      } else {
        resolve({ running: false, pid: null });
      }
    });
  });
}

function killPort(port) {
  return new Promise((resolve) => {
    const command = process.platform === 'win32'
      ? `FOR /F "tokens=5" %P IN ('netstat -ano ^| findstr :${port}') DO taskkill /F /PID %P`
      : `lsof -ti:${port} | xargs kill -9`;
    
    console.log(`🔄 Killing process on port ${port}...`);
    exec(command, (error) => {
      if (error) {
        console.log(`   ⚠️  Could not kill process`);
      } else {
        console.log(`   ✅ Process killed`);
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
      resolve(res.statusCode === 200);
    });

    req.on('error', () => resolve(false));
    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });

    req.end();
  });
}

async function checkStatus() {
  console.log('\n🔍 Checking Backend Status...\n');
  
  const portStatus = await checkPort(PORT);
  
  if (!portStatus.running) {
    console.log(`❌ Backend is NOT running`);
    console.log(`   Port ${PORT} is free\n`);
    return false;
  }
  
  console.log(`✅ Process found on port ${PORT}`);
  console.log(`   PID: ${portStatus.pid}`);
  
  const isHealthy = await healthCheck();
  
  if (isHealthy) {
    console.log(`✅ Backend is responding\n`);
    console.log(`🌐 Endpoints:`);
    console.log(`   - http://localhost:${PORT}/api`);
    console.log(`   - http://localhost:${PORT}/api/trpc`);
    console.log(`   - http://localhost:${PORT}/api/health/db\n`);
    return true;
  } else {
    console.log(`⚠️  Backend is not responding\n`);
    return false;
  }
}

async function startBackend() {
  console.log('\n🚀 Starting Backend...\n');
  
  const portStatus = await checkPort(PORT);
  
  if (portStatus.running) {
    console.log(`⚠️  Port ${PORT} is already in use (PID: ${portStatus.pid})`);
    const answer = await question('Kill existing process and restart? (y/n): ');
    
    if (answer.toLowerCase() !== 'y') {
      console.log('Cancelled.\n');
      return;
    }
    
    await killPort(PORT);
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  const __dirname = process.cwd();
  
  console.log('📦 Starting backend process...');
  
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
    stdio: 'inherit',
    shell: false,
    detached: false
  });

  backendProcess.on('error', (error) => {
    console.error('❌ Failed to start:', error.message);
  });

  process.on('SIGINT', () => {
    console.log('\n👋 Shutting down...');
    backendProcess.kill('SIGINT');
    setTimeout(() => process.exit(0), 1000);
  });

  process.on('SIGTERM', () => {
    console.log('\n👋 Shutting down...');
    backendProcess.kill('SIGTERM');
    setTimeout(() => process.exit(0), 1000);
  });

  console.log('\n✅ Backend started!');
  console.log('Press Ctrl+C to stop\n');
}

async function stopBackend() {
  console.log('\n🛑 Stopping Backend...\n');
  
  const portStatus = await checkPort(PORT);
  
  if (!portStatus.running) {
    console.log('❌ Backend is not running\n');
    return;
  }
  
  await killPort(PORT);
  console.log('✅ Backend stopped\n');
}

async function restartBackend() {
  console.log('\n🔄 Restarting Backend...\n');
  await stopBackend();
  await new Promise(resolve => setTimeout(resolve, 2000));
  await startBackend();
}

async function showMenu() {
  console.log('\n╔════════════════════════════════════════╗');
  console.log('║   Kompa2Go Backend Manager             ║');
  console.log('╚════════════════════════════════════════╝\n');
  console.log('1. Check Status');
  console.log('2. Start Backend');
  console.log('3. Stop Backend');
  console.log('4. Restart Backend');
  console.log('5. View Logs (start with logs)');
  console.log('6. Exit\n');
  
  const choice = await question('Select option (1-6): ');
  
  switch (choice.trim()) {
    case '1':
      await checkStatus();
      await question('\nPress Enter to continue...');
      await showMenu();
      break;
      
    case '2':
      await startBackend();
      break;
      
    case '3':
      await stopBackend();
      await question('\nPress Enter to continue...');
      await showMenu();
      break;
      
    case '4':
      await restartBackend();
      break;
      
    case '5':
      console.log('\n📋 Starting backend with logs...\n');
      await startBackend();
      break;
      
    case '6':
      console.log('\n👋 Goodbye!\n');
      rl.close();
      process.exit(0);
      break;
      
    default:
      console.log('\n❌ Invalid option\n');
      await showMenu();
  }
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    await showMenu();
    return;
  }
  
  const command = args[0].toLowerCase();
  
  switch (command) {
    case 'status':
    case 'check':
      await checkStatus();
      rl.close();
      break;
      
    case 'start':
      await startBackend();
      break;
      
    case 'stop':
      await stopBackend();
      rl.close();
      break;
      
    case 'restart':
      await restartBackend();
      break;
      
    default:
      console.log('\n❌ Unknown command:', command);
      console.log('\nAvailable commands:');
      console.log('  node backend-manager.js status   - Check backend status');
      console.log('  node backend-manager.js start    - Start backend');
      console.log('  node backend-manager.js stop     - Stop backend');
      console.log('  node backend-manager.js restart  - Restart backend');
      console.log('  node backend-manager.js          - Interactive menu\n');
      rl.close();
  }
}

main().catch((error) => {
  console.error('❌ Error:', error);
  rl.close();
  process.exit(1);
});
