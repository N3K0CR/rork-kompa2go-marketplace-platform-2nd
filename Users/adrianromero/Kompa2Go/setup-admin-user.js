#!/usr/bin/env node

/**
 * Script para configurar el primer usuario administrador
 * Ejecutar después de desplegar las reglas de Firestore
 */

const { initializeApp } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function main() {
  console.log('\n================================================');
  console.log('🔧 CONFIGURACIÓN DE USUARIO ADMINISTRADOR');
  console.log('================================================\n');

  try {
    // Inicializar Firebase Admin (usa las credenciales del ambiente)
    console.log('Inicializando Firebase Admin...');
    
    // Verificar que las variables de entorno estén configuradas
    if (!process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID) {
      console.error('❌ Error: Variables de entorno de Firebase no configuradas');
      console.error('\nAsegúrate de tener configurado .env.local con:');
      console.error('  EXPO_PUBLIC_FIREBASE_PROJECT_ID');
      console.error('  EXPO_PUBLIC_FIREBASE_API_KEY');
      console.error('  etc.\n');
      process.exit(1);
    }

    // Inicializar con credenciales del proyecto
    const app = initializeApp({
      projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
    });

    const db = getFirestore(app);
    console.log('✅ Firebase Admin inicializado\n');

    // Solicitar información del administrador
    console.log('Ingresa la información del primer administrador:\n');
    
    const userId = await question('User ID (Firebase Auth UID): ');
    if (!userId.trim()) {
      console.error('❌ User ID es requerido');
      process.exit(1);
    }

    const email = await question('Email: ');
    if (!email.trim()) {
      console.error('❌ Email es requerido');
      process.exit(1);
    }

    const name = await question('Nombre completo (opcional): ');

    console.log('\n📋 Resumen:');
    console.log(`  User ID: ${userId}`);
    console.log(`  Email: ${email}`);
    console.log(`  Nombre: ${name || 'N/A'}`);
    console.log(`  Permisos: manage_kommuters, manage_payments, view_alerts`);
    console.log('');

    const confirm = await question('¿Crear este administrador? (s/n): ');
    
    if (!confirm.toLowerCase().startsWith('s')) {
      console.log('Operación cancelada');
      process.exit(0);
    }

    // Crear documento de administrador
    console.log('\nCreando usuario administrador...');
    
    const adminData = {
      email: email.trim(),
      role: 'admin',
      permissions: [
        'manage_kommuters',
        'manage_payments',
        'view_alerts',
        'manage_users',
        'view_transactions'
      ],
      createdAt: FieldValue.serverTimestamp(),
      active: true
    };

    if (name.trim()) {
      adminData.name = name.trim();
    }

    await db.collection('admin_users').doc(userId.trim()).set(adminData);

    console.log('\n================================================');
    console.log('✅ ADMINISTRADOR CREADO EXITOSAMENTE');
    console.log('================================================\n');
    
    console.log('El usuario ahora tiene acceso a:');
    console.log('  ✅ Panel de Kommuter');
    console.log('  ✅ Gestión de Conductores');
    console.log('  ✅ Aprobaciones Pendientes');
    console.log('  ✅ Sistema de Alertas');
    console.log('  ✅ Recargas de Billetera Kommute');
    console.log('  ✅ Ver Todas las Transacciones');
    console.log('');

    console.log('⚠️  IMPORTANTE:');
    console.log('  - El usuario debe iniciar sesión con Firebase Auth');
    console.log('  - El User ID debe coincidir con su UID de Firebase Auth');
    console.log('  - Los permisos son efectivos inmediatamente');
    console.log('');

  } catch (error) {
    console.error('\n❌ Error al crear administrador:');
    console.error(error.message);
    console.error('');
    
    if (error.code === 'permission-denied') {
      console.error('Posibles causas:');
      console.error('  - Las reglas de Firestore no están desplegadas');
      console.error('  - No tienes permisos de administrador en Firebase');
      console.error('  - El proyecto de Firebase no está configurado correctamente');
      console.error('');
      console.error('Ejecuta primero: ./deploy-firestore-rules-now.sh');
    }
    
    process.exit(1);
  } finally {
    rl.close();
  }
}

// Ejecutar
main().catch(error => {
  console.error('Error fatal:', error);
  process.exit(1);
});
