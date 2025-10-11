#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 Actualizando package.json...\n');

const packageJsonPath = path.join(process.cwd(), 'package.json');

try {
  // Leer el archivo package.json
  const packageJsonContent = fs.readFileSync(packageJsonPath, 'utf8');
  const packageJson = JSON.parse(packageJsonContent);

  // Definir los nuevos scripts
  const newScripts = {
    "start": "bunx rork start -p z5be445fq2fb0yuu32aht --tunnel",
    "start-web": "bunx rork start -p z5be445fq2fb0yuu32aht --web --tunnel",
    "start-web-dev": "DEBUG=expo* bunx rork start -p z5be445fq2fb0yuu32aht --web --tunnel",
    "lint": "expo lint",
    "backend": "nodemon --watch backend --ext ts,js,json --exec \"tsx backend/server.ts\"",
    "frontend": "bunx rork start -p z5be445fq2fb0yuu32aht --tunnel",
    "dev": "concurrently --kill-others --names \"BACKEND,FRONTEND\" --prefix-colors \"bgBlue.bold,bgMagenta.bold\" \"bun run backend\" \"bun run frontend\""
  };

  // Reemplazar la sección de scripts
  packageJson.scripts = newScripts;

  // Escribir el archivo actualizado con formato legible
  fs.writeFileSync(
    packageJsonPath,
    JSON.stringify(packageJson, null, 2) + '\n',
    'utf8'
  );

  console.log('✅ package.json actualizado con éxito!\n');
  console.log('📋 Scripts añadidos:');
  console.log('   • backend    - Inicia el servidor backend con auto-reload');
  console.log('   • frontend   - Inicia el servidor de desarrollo de Expo');
  console.log('   • dev        - Inicia AMBOS servidores en paralelo (¡USA ESTE!)\n');
  console.log('🚀 Ahora puedes ejecutar: bun run dev\n');

} catch (error) {
  console.error('❌ Error al actualizar package.json:', error.message);
  process.exit(1);
}
