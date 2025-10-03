#!/usr/bin/env node

const { spawn, exec } = require('child_process');
const http = require('http');

console.log('🚀 Iniciando Backend de Kompa2Go...\n');

// Función para verificar si el puerto está en uso
function checkPort(port) {
  return new Promise((resolve) => {
    exec(`lsof -i :${port} -t`, (error, stdout) => {
      if (stdout.trim()) {
        resolve(stdout.trim().split('\n'));
      } else {
        resolve([]);
      }
    });
  });
}

// Función para matar procesos en un puerto
function killProcesses(pids) {
  return new Promise((resolve) => {
    if (pids.length === 0) {
      resolve();
      return;
    }
    
    console.log(`🔄 Deteniendo ${pids.length} proceso(s) anterior(es)...`);
    exec(`kill -9 ${pids.join(' ')}`, (error) => {
      setTimeout(resolve, 2000);
    });
  });
}

// Función para hacer health check
function healthCheck(port, maxAttempts = 10) {
  return new Promise((resolve, reject) => {
    let attempts = 0;
    
    const check = () => {
      attempts++;
      
      const req = http.get(`http://localhost:${port}/api/`, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          console.log('✅ Backend respondiendo:', data.substring(0, 100));
          resolve(true);
        });
      });
      
      req.on('error', (err) => {
        if (attempts < maxAttempts) {
          console.log(`⏳ Intento ${attempts}/${maxAttempts} - Esperando backend...`);
          setTimeout(check, 2000);
        } else {
          reject(new Error('Backend no responde después de ' + maxAttempts + ' intentos'));
        }
      });
      
      req.setTimeout(2000, () => {
        req.destroy();
        if (attempts < maxAttempts) {
          setTimeout(check, 2000);
        } else {
          reject(new Error('Timeout'));
        }
      });
    };
    
    check();
  });
}

// Función principal
async function main() {
  try {
    // Verificar puerto 8082
    const pids = await checkPort(8082);
    
    if (pids.length > 0) {
      console.log(`⚠️  Puerto 8082 en uso por proceso(s): ${pids.join(', ')}`);
      await killProcesses(pids);
    }
    
    console.log('🔧 Iniciando backend en puerto 8082...\n');
    
    // Iniciar el backend
    const backend = spawn('bunx', ['rork', 'start', '-p', 'z5be445fq2fb0yuu32aht'], {
      cwd: '/home/user/rork-app',
      stdio: ['ignore', 'pipe', 'pipe'],
      detached: true,
      shell: true
    });
    
    // Capturar salida
    backend.stdout.on('data', (data) => {
      console.log(data.toString());
    });
    
    backend.stderr.on('data', (data) => {
      console.error(data.toString());
    });
    
    backend.on('error', (error) => {
      console.error('❌ Error al iniciar backend:', error);
      process.exit(1);
    });
    
    console.log(`✅ Backend iniciado con PID: ${backend.pid}\n`);
    
    // Desconectar el proceso hijo para que siga corriendo
    backend.unref();
    
    // Esperar y hacer health check
    console.log('⏳ Esperando que el backend inicie...\n');
    
    try {
      await healthCheck(8082);
      console.log('\n✅ Backend está funcionando correctamente');
      console.log('🌐 Backend API: http://localhost:8082/api');
      console.log('🌐 tRPC: http://localhost:8082/api/trpc');
      console.log('\n🎉 Backend iniciado exitosamente');
      console.log(`💡 PID del backend: ${backend.pid}`);
      
      // Guardar el PID para poder detenerlo después
      require('fs').writeFileSync('/tmp/backend.pid', backend.pid.toString());
      console.log('💡 PID guardado en /tmp/backend.pid');
      
      process.exit(0);
    } catch (error) {
      console.error('\n❌ Error en health check:', error.message);
      console.error('📝 Verifica los logs del backend');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

main();
