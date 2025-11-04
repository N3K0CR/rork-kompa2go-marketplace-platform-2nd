#!/usr/bin/env node

const { spawn, exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const http = require('http');

const PORT = 8082;
const HOST = '0.0.0.0';
const MAX_WAIT = 30000;

const colors = {
  backend: '\x1b[36m',
  frontend: '\x1b[35m',
  system: '\x1b[33m',
  success: '\x1b[32m',
  error: '\x1b[31m',
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
    
    exec(command, () => {
      setTimeout(resolve, 1000);
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
        const value = match[2].trim().replace(/^["']|["']$/g, '');
        envVars[key] = value;
      }
    });
    return envVars;
  }
  return {};
}

function checkBackendHealth() {
  return new Promise((resolve) => {
    const req = http.get(`http://localhost:${PORT}/api/`, (res) => {
      resolve(res.statusCode === 200);
    });
    
    req.on('error', () => {
      resolve(false);
    });
    
    req.setTimeout(1000, () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function waitForBackend(maxTime = MAX_WAIT) {
  const startTime = Date.now();
  const checkInterval = 1000;
  
  while (Date.now() - startTime < maxTime) {
    const isHealthy = await checkBackendHealth();
    if (isHealthy) {
      return true;
    }
    process.stdout.write('.');
    await new Promise(resolve => setTimeout(resolve, checkInterval));
  }
  
  return false;
}

function startBackend() {
  return new Promise(async (resolve, reject) => {
    log('SYSTEM', 'Limpiando puerto del backend...');
    await killPort(PORT);
    
    const envVars = loadEnv();
    log('BACKEND', 'Iniciando servidor backend...', colors.backend);

    const backendProcess = spawn('bun', [
      'run',
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

    let started = false;

    backendProcess.stdout.on('data', (data) => {
      data.toString().split('\n').forEach(line => {
        if (line.trim()) {
          log('BACKEND', line, colors.backend);
          if (line.includes('Backend running') || line.includes('tRPC endpoint')) {
            started = true;
          }
        }
      });
    });

    backendProcess.stderr.on('data', (data) => {
      const output = data.toString();
      if (!output.includes('ExperimentalWarning')) {
        output.split('\n').forEach(line => {
          if (line.trim()) {
            log('BACKEND', line, colors.error);
          }
        });
      }
    });

    backendProcess.on('error', (error) => {
      log('BACKEND', `❌ Error: ${error.message}`, colors.error);
      reject(error);
    });

    backendProcess.on('exit', (code) => {
      if (code !== 0 && code !== null) {
        log('BACKEND', `❌ Salió con código ${code}`, colors.error);
        reject(new Error(`Backend exited with code ${code}`));
      }
    });

    log('BACKEND', 'Esperando que el backend esté listo...', colors.backend);
    const isReady = await waitForBackend();
    
    if (isReady) {
      log('BACKEND', `✅ Backend respondiendo en http://localhost:${PORT}`, colors.success);
      resolve(backendProcess);
    } else {
      log('BACKEND', '❌ Backend no respondió a tiempo', colors.error);
      backendProcess.kill('SIGTERM');
      reject(new Error('Backend timeout'));
    }
  });
}

function startFrontend() {
  log('FRONTEND', 'Iniciando Expo...', colors.frontend);

  const frontendProcess = spawn('bun', [
    'x', 'rork', 'start', '-p', 'z5be445fq2fb0yuu32aht', '--tunnel'
  ], {
    stdio: 'inherit',
    shell: false,
    cwd: process.cwd(),
  });

  frontendProcess.on('error', (error) => {
    log('FRONTEND', `❌ Error: ${error.message}`, colors.error);
  });

  return frontendProcess;
}

async function main() {
  console.log('\n🚀 Kompa2Go - Inicio Automático');
  console.log('=====================================\n');

  let backendProcess;
  let frontendProcess;

  try {
    backendProcess = await startBackend();
    
    log('SYSTEM', '\n✅ Backend iniciado correctamente\n');
    log('SYSTEM', 'Esperando 2 segundos antes de iniciar frontend...\n');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    frontendProcess = startFrontend();
    
    log('SYSTEM', '\n=====================================', colors.success);
    log('SYSTEM', '✅ Kompa2Go está corriendo', colors.success);
    log('SYSTEM', '=====================================', colors.success);
    log('SYSTEM', `📱 Backend:  http://localhost:${PORT}`, colors.success);
    log('SYSTEM', `📱 tRPC:     http://localhost:${PORT}/api/trpc`, colors.success);
    log('SYSTEM', '📱 Frontend: Expo Developer Tools', colors.success);
    log('SYSTEM', '\n💡 Presiona Ctrl+C para detener todo\n', colors.success);

  } catch (error) {
    console.error('\n❌ Error fatal al iniciar:', error.message);
    if (backendProcess) backendProcess.kill('SIGTERM');
    process.exit(1);
  }

  process.on('SIGINT', () => {
    log('SYSTEM', '\n\n🛑 Deteniendo servicios...', colors.system);
    if (backendProcess) backendProcess.kill('SIGTERM');
    if (frontendProcess) frontendProcess.kill('SIGTERM');
    setTimeout(async () => {
      await killPort(PORT);
      log('SYSTEM', '👋 Servicios detenidos!', colors.success);
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

main().catch(error => {
  console.error('❌ Error fatal:', error);
  process.exit(1);
});
