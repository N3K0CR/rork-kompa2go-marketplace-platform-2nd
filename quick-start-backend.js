#!/usr/bin/env node

const { spawn, exec } = require('child_process');
const http = require('http');

console.log('🚀 Iniciando Backend de Kompa2Go...\n');

// Función para verificar si el puerto está en uso
function checkPort(port) {
  return new Promise((resolve) => {
    exec(`lsof -ti:${port}`, (error, stdout) => {
      if (stdout) {
        console.log(`⚠️  Puerto ${port} ya está en uso. Deteniendo proceso anterior...`);
        exec(`kill -9 ${stdout.trim()}`, () => {
          setTimeout(() => resolve(), 2000);
        });
      } else {
        resolve();
      }
    });
  });
}

// Función para verificar si el servidor está respondiendo
function checkServer(url, maxAttempts = 10) {
  return new Promise((resolve, reject) => {
    let attempts = 0;
    
    const check = () => {
      attempts++;
      http.get(url, (res) => {
        if (res.statusCode === 200) {
          resolve(true);
        } else if (attempts < maxAttempts) {
          setTimeout(check, 1000);
        } else {
          reject(new Error('Server not responding'));
        }
      }).on('error', () => {
        if (attempts < maxAttempts) {
          setTimeout(check, 1000);
        } else {
          reject(new Error('Server not responding'));
        }
      });
    };
    
    check();
  });
}

async function startBackend() {
  try {
    // Verificar y limpiar puerto
    await checkPort(8082);
    
    console.log('🔄 Iniciando servidor backend en puerto 8082...\n');
    
    // Iniciar el backend
    const backend = spawn('bunx', ['rork', 'start', '-p', 'z5be445fq2fb0yuu32aht'], {
      cwd: '/home/user/rork-app',
      stdio: ['ignore', 'pipe', 'pipe'],
      detached: true,
      shell: true
    });
    
    let output = '';
    
    backend.stdout.on('data', (data) => {
      output += data.toString();
      process.stdout.write(data);
    });
    
    backend.stderr.on('data', (data) => {
      output += data.toString();
      process.stderr.write(data);
    });
    
    backend.on('error', (error) => {
      console.error('❌ Error al iniciar backend:', error);
      process.exit(1);
    });
    
    // Desacoplar el proceso para que continúe ejecutándose
    backend.unref();
    
    console.log(`✅ Backend iniciado con PID: ${backend.pid}\n`);
    console.log('⏳ Esperando a que el servidor esté listo...\n');
    
    // Esperar a que el servidor esté listo
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Verificar que el servidor está respondiendo
    try {
      await checkServer('http://localhost:8082/api');
      console.log('✅ Backend está corriendo correctamente\n');
      console.log('🌐 Backend API: http://localhost:8082/api');
      console.log('🌐 tRPC: http://localhost:8082/api/trpc\n');
      
      // Hacer una petición de prueba
      http.get('http://localhost:8082/api', (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          console.log('📊 Estado del servidor:', data);
          console.log('\n✅ Backend iniciado exitosamente');
          console.log(`📝 Para detener el backend, ejecuta: kill ${backend.pid}`);
          console.log('📝 O usa: pkill -f "rork start"\n');
          process.exit(0);
        });
      }).on('error', (err) => {
        console.error('❌ Error al verificar el servidor:', err.message);
        process.exit(1);
      });
      
    } catch (error) {
      console.error('❌ Error: El backend no responde en http://localhost:8082/api');
      console.error('Salida del servidor:', output);
      process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

startBackend();
