const fs = require('fs');
const path = require('path');

// Ruta al package.json
const packageJsonPath = path.join(process.cwd(), 'package.json');

// Leer el archivo package.json
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

// Nuevos scripts con la corrección (sin bunx en frontend)
const newScripts = {
  "start": "bunx rork start -p z5be445fq2fb0yuu32aht --tunnel",
  "start-web": "bunx rork start -p z5be445fq2fb0yuu32aht --web --tunnel",
  "start-web-dev": "DEBUG=expo* bunx rork start -p z5be445fq2fb0yuu32aht --web --tunnel",
  "lint": "expo lint",
  "backend": "nodemon --watch backend --ext ts,js,json --exec \"tsx backend/server.ts\"",
  "frontend": "rork start -p z5be445fq2fb0yuu32aht --tunnel",
  "dev": "concurrently --kill-others --names \"BACKEND,FRONTEND\" --prefix-colors \"bgBlue.bold,bgMagenta.bold\" \"bun run backend\" \"bun run frontend\""
};

// Reemplazar la sección scripts
packageJson.scripts = newScripts;

// Escribir el archivo actualizado
fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n', 'utf8');

console.log('✅ package.json actualizado con éxito!');
console.log('📝 Script "frontend" corregido (sin bunx)');
