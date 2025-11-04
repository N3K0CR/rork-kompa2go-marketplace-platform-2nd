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
    // Intentar con localhost primero
    const req = http.get(`http://localhost:${PORT}/api/`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(res.statusCode === 200 && json.status === 'ok');
        } catch {
          // Si no es JSON válido, revisar si al menos responde
          resolve(res.statusCode === 200);
        }
      });
    });
    
    req.on('error', (err) => {
      // Si falla con localhost, intentar con 127.0.0.1
      const req2 = http.get(`http://127.0.0.1:${PORT}/api/`, (res) => {
        resolve(res.statusCode === 200);
      });
      req2.on('error', () => resolve(false));
      req2.setTimeout(2000, () => {
        req2.destroy();
        resolve(false);
      });
    });
    
    req.setTimeout(2000, () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function waitForBackend(maxTime = MAX_WAIT) {
  const startTime = Date.now();
  const checkInterval = 1000;
  
  log('BACKEND', 'Verificando si el backend está listo...', colors.backend);
  
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

    let backendReady = false;
    let healthCheckStarted = false;

    backendProcess.stdout.on('data', (data) => {
      data.toString().split('\n').forEach(line => {
        if (line.trim()) {
          log('BACKEND', line, colors.backend);
          
          // Cuando vemos que el backend reporta que está corriendo, iniciamos health checks
          if ((line.includes('Backend running') || line.includes('Health check')) && !healthCheckStarted) {
            healthCheckStarted = true;
            setTimeout(async () => {
              log('BACKEND', 'Backend reporta estar listo, verificando conectividad...', colors.backend);
              const isReady = await waitForBackend(15000); // Reducido a 15 segundos
              
              if (isReady) {
                backendReady = true;
                log('BACKEND', `✅ Backend respondiendo en http://localhost:${PORT}/api/`, colors.success);
                resolve(backendProcess);
              } else {
                // No rechazar inmediatamente, dar más tiempo
                log('BACKEND', '⚠️ Backend no responde al health check, pero continúa corriendo...', colors.system);
                log('BACKEND', '⚠️ Intentando iniciar frontend de todas formas...', colors.system);
                backendReady = true; // Marcarlo como listo de todas formas
                resolve(backendProcess);
              }
            }, 2000); // Esperar 2 segundos después de ver el mensaje
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
      if (!backendReady) {
        reject(error);
      }
    });

    backendProcess.on('exit', (code) => {
      if (code !== 0 && code !== null && !backendReady) {
        log('BACKEND', `❌ Salió con código ${code}`, colors.error);
        reject(new Error(`Backend exited with code ${code}`));
      }
    });

    // Timeout de 40 segundos para todo el proceso
    setTimeout(() => {
      if (!backendReady) {
        log('BACKEND', '⚠️ Timeout esperando backend, pero intentando continuar...', colors.system);
        resolve(backendProcess);
      }
    }, 40000);
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
    
    log('SYSTEM', '\n✅ Backend iniciado\n');
    log('SYSTEM', 'Esperando 3 segundos antes de iniciar frontend...\n');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    frontendProcess = startFrontend();
    
    log('SYSTEM', '\n=====================================', colors.success);
    log('SYSTEM', '✅ Kompa2Go está corriendo', colors.success);
    log('SYSTEM', '=====================================', colors.success);
    log('SYSTEM', `📱 Backend:  http://localhost:${PORT}`, colors.success);
    log('SYSTEM', `📱 tRPC:     http://localhost:${PORT}/api/trpc`, colors.success);
    log('SYSTEM', '📱 Frontend: Expo Developer Tools', colors.success);
    log('SYSTEM', '\n💡 Presiona Ctrl+C para detener todo\n', colors.success);
    log('SYSTEM', '\n⚠️  Si ves errores de conexión, verifica:', colors.system);
    log('SYSTEM', `   1. Backend accesible: curl http://localhost:${PORT}/api/`, colors.system);
    log('SYSTEM', `   2. Firewall no bloquea puerto ${PORT}`, colors.system);
    log('SYSTEM', '   3. Variables de entorno en .env.local\n', colors.system);

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
