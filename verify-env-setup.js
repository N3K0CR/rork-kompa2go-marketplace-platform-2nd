#!/usr/bin/env node

console.log('\n🔍 VERIFICACIÓN COMPLETA DE CONFIGURACIÓN\n');
console.log('==========================================\n');

const fs = require('fs');
const path = require('path');

let hasErrors = false;

console.log('1️⃣ Verificando archivos .env...\n');

const envFile = path.join(__dirname, '.env');
const envLocalFile = path.join(__dirname, '.env.local');

if (fs.existsSync(envFile)) {
  console.log('   ✅ .env existe');
  const envContent = fs.readFileSync(envFile, 'utf-8');
  
  if (envContent.includes('EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=')) {
    const match = envContent.match(/EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=(.+)/);
    if (match && match[1] && match[1].trim().length > 0) {
      console.log(`   ✅ EXPO_PUBLIC_GOOGLE_MAPS_API_KEY configurada (${match[1].substring(0, 10)}...)`);
    } else {
      console.log('   ❌ EXPO_PUBLIC_GOOGLE_MAPS_API_KEY está vacía');
      hasErrors = true;
    }
  } else {
    console.log('   ❌ EXPO_PUBLIC_GOOGLE_MAPS_API_KEY no encontrada en .env');
    hasErrors = true;
  }
} else {
  console.log('   ❌ .env NO existe');
  hasErrors = true;
}

if (fs.existsSync(envLocalFile)) {
  console.log('   ⚠️  .env.local existe (Expo NO lo lee por defecto)');
  console.log('   💡 Considera eliminar .env.local y usar solo .env');
}

console.log('\n2️⃣ Verificando app.json...\n');

const appJsonFile = path.join(__dirname, 'app.json');
if (fs.existsSync(appJsonFile)) {
  console.log('   ✅ app.json existe');
  const appJson = JSON.parse(fs.readFileSync(appJsonFile, 'utf-8'));
  
  const plugins = appJson.expo?.plugins || [];
  const locationPlugin = plugins.find(p => 
    (Array.isArray(p) && p[0] === 'expo-location') || p === 'expo-location'
  );
  
  if (locationPlugin) {
    console.log('   ✅ expo-location plugin configurado');
  } else {
    console.log('   ❌ expo-location plugin NO configurado');
    hasErrors = true;
  }
  
  const androidPerms = appJson.expo?.android?.permissions || [];
  if (androidPerms.includes('ACCESS_FINE_LOCATION') && androidPerms.includes('ACCESS_COARSE_LOCATION')) {
    console.log('   ✅ Permisos de ubicación Android configurados');
  } else {
    console.log('   ❌ Permisos de ubicación Android incompletos');
    hasErrors = true;
  }
} else {
  console.log('   ❌ app.json NO existe');
  hasErrors = true;
}

console.log('\n3️⃣ Verificando archivos críticos...\n');

const criticalFiles = [
  'lib/google-maps.ts',
  'src/modules/commute/services/places-service.ts',
  'src/modules/commute/hooks/useCurrentLocation.ts'
];

criticalFiles.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    console.log(`   ✅ ${file}`);
  } else {
    console.log(`   ❌ ${file} NO existe`);
    hasErrors = true;
  }
});

console.log('\n==========================================\n');

if (hasErrors) {
  console.log('❌ SE ENCONTRARON ERRORES\n');
  console.log('ACCIONES RECOMENDADAS:');
  console.log('1. Asegúrate de que .env tenga EXPO_PUBLIC_GOOGLE_MAPS_API_KEY');
  console.log('2. Reinicia completamente el servidor con: npm start');
  console.log('3. Si persiste, borra node_modules/.cache y reinicia\n');
  process.exit(1);
} else {
  console.log('✅ CONFIGURACIÓN CORRECTA\n');
  console.log('SIGUIENTE PASO:');
  console.log('1. Ejecuta: npm start');
  console.log('2. Revisa los logs de consola');
  console.log('3. Busca "🔑 DEBUG API KEY" en los logs\n');
  process.exit(0);
}
