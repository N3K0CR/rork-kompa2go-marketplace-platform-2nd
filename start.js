#!/usr/bin/env node

const { spawn, exec } = require('child_process');
const path = require('path');
const fs = require('fs');

const PORT = 8082;
const HOST = '0.0.0.0';

console.log('🚀 Kompa2Go - Inicio Automático');
console.log('================================\n');

const colors = {
  backend: '\x1b[36m',
  frontend: '\x1b[35m',
  system: '\x1b[33m',
  reset: '\x1b[0m',
};

function log(prefix, message, color = colors.system) {
  console.log(`${color}[${prefix}]${colors.reset} ${message}`);
}

function killPort(port) {
  return new Promise((resolve) => {
    const command = process.platform === 'win32'
      ? `FOR /F "tokens=5" %P IN ('netstat -ano ^| findstr :${port}') DO taskkill /F /PID %P`
      : `lsof -ti:${port} | xargs kill -9 2>/dev/null || true`;
    
    log('SYSTEM', `Liberando puerto ${port}...`);
    exec(command, () => {
      setTimeout(resolve, 500);
    });
  });
}

function loadEnv() {
  const envPath = path.join(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const envVars = {};
    envContent.split('\n').forEach(line => {
      const match = line.match(/^([^=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        const value = match[2].trim();
        envVars[key] = value;
      }
    });
    return envVars;
  }
  return {};
}

function startBackend() {
  return new Promise(async (resolve, reject) => {
    await killPort(PORT);
    
    const envVars = loadEnv();
    log('BACKEND', 'Iniciando servidor...', colors.backend);

    const backendProcess = spawn('node', [
      '--import=tsx/esm',
      path.join(process.cwd(), 'backend', 'server.ts')
    ], {
      env: {
        ...process.env,
        ...envVars,
        PORT: PORT.toString(),
        HOST: HOST,
        NODE_ENV: 'development'
      },
      stdio: 'pipe',
      shell: false
    });

    backendProcess.stdout.on('data', (data) => {
      data.toString().split('\n').forEach(line => {
        if (line.trim()) {
          log('BACKEND', line, colors.backend);
        }
      });
    });

    backendProcess.stderr.on('data', (data) => {
      data.toString().split('\n').forEach(line => {
        if (line.trim()) {
          log('BACKEND', line, colors.backend);
        }
      });
    });

    backendProcess.on('error', (error) => {
      log('BACKEND', `❌ Error: ${error.message}`, colors.backend);
      reject(error);
    });

    backendProcess.on('exit', (code) => {
      if (code !== 0 && code !== null) {
        log('BACKEND', `⚠️ Salió con código ${code}`, colors.backend);
        log('BACKEND', '🔄 Reiniciando en 3 segundos...', colors.backend);
        setTimeout(() => {
          startBackend().then(resolve).catch(reject);
        }, 3000);
      }
    });

    setTimeout(() => {
      log('BACKEND', `✅ Corriendo en http://localhost:${PORT}`, colors.backend);
      resolve(backendProcess);
    }, 2000);

    return backendProcess;
  });
}

function startFrontend() {
  log('FRONTEND', 'Iniciando Expo...', colors.frontend);

  const frontendProcess = spawn('bun', [
    'x', 'rork', 'start', '-p', 'z5be445fq2fb0yuu32aht', '--tunnel'
  ], {
    stdio: 'pipe',
    shell: true,
    cwd: process.cwd(),
  });

  frontendProcess.stdout.on('data', (data) => {
    data.toString().split('\n').forEach(line => {
      if (line.trim()) {
        log('FRONTEND', line, colors.frontend);
      }
    });
  });

  frontendProcess.stderr.on('data', (data) => {
    data.toString().split('\n').forEach(line => {
      if (line.trim()) {
        log('FRONTEND', line, colors.frontend);
      }
    });
  });

  frontendProcess.on('error', (error) => {
    log('FRONTEND', `❌ Error: ${error.message}`, colors.frontend);
  });

  return frontendProcess;
}

async function main() {
  let backendProcess;
  let frontendProcess;

  try {
    backendProcess = await startBackend();
    
    log('SYSTEM', 'Esperando 2 segundos antes de iniciar frontend...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    frontendProcess = startFrontend();
    
    log('SYSTEM', '\n✅ Todo iniciado correctamente');
    log('SYSTEM', '📱 Frontend: Expo Developer Tools');
    log('SYSTEM', `🔧 Backend: http://localhost:${PORT}`);
    log('SYSTEM', '\n💡 Presiona Ctrl+C para detener todo\n');

  } catch (error) {
    console.error('❌ Error fatal:', error);
    process.exit(1);
  }

  process.on('SIGINT', () => {
    log('SYSTEM', '\n\n🛑 Deteniendo servicios...');
    if (backendProcess) backendProcess.kill('SIGTERM');
    if (frontendProcess) frontendProcess.kill('SIGTERM');
    setTimeout(() => {
      log('SYSTEM', '👋 Adiós!');
      process.exit(0);
    }, 1000);
  });

  process.on('SIGTERM', () => {
    if (backendProcess) backendProcess.kill('SIGTERM');
    if (frontendProcess) frontendProcess.kill('SIGTERM');
    setTimeout(() => process.exit(0), 1000);
  });

  process.stdin.resume();
}

main();
