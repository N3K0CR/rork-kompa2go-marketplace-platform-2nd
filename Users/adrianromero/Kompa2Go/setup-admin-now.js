#!/usr/bin/env node

/**
 * Script para crear usuario administrador en Firestore
 * 
 * USO:
 * 1. Asegúrate de tener las variables de entorno configuradas en .env.local
 * 2. Ejecuta: node setup-admin-now.js TU_EMAIL@ejemplo.com
 */

const { initializeApp } = require('firebase/app');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');
const { getFirestore, doc, setDoc, serverTimestamp } = require('firebase/firestore');
require('dotenv').config({ path: '.env.local' });

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

async function setupAdmin() {
  const email = process.argv[2];
  const password = process.argv[3];

  if (!email || !password) {
    console.error('❌ Error: Debes proporcionar email y contraseña');
    console.log('\nUSO: node setup-admin-now.js EMAIL PASSWORD');
    console.log('Ejemplo: node setup-admin-now.js admin@kompa2go.com miPassword123');
    process.exit(1);
  }

  console.log('🔧 Configurando usuario administrador...\n');

  try {
    // Inicializar Firebase
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const db = getFirestore(app);

    console.log('✅ Firebase inicializado');

    // Iniciar sesión con el usuario
    console.log(`🔐 Iniciando sesión con: ${email}`);
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    console.log(`✅ Sesión iniciada. UID: ${user.uid}`);

    // Crear documento de admin
    console.log('📝 Creando documento de administrador...');
    const adminRef = doc(db, 'admin_users', user.uid);
    
    await setDoc(adminRef, {
      email: user.email,
      role: 'admin',
      createdAt: serverTimestamp(),
      displayName: user.displayName || 'Admin',
      permissions: {
        manageKommuters: true,
        managePayments: true,
        manageAlerts: true,
        viewTransactions: true,
        manageUsers: true,
      }
    });

    console.log('✅ Documento de administrador creado exitosamente');
    console.log('\n🎉 ¡Configuración completada!');
    console.log(`\n📋 Detalles del administrador:`);
    console.log(`   Email: ${user.email}`);
    console.log(`   UID: ${user.uid}`);
    console.log(`   Rol: admin`);
    console.log('\n✨ Ahora puedes acceder al panel de administrador');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error durante la configuración:', error.message);
    
    if (error.code === 'auth/user-not-found') {
      console.log('\n💡 El usuario no existe. Primero debes crear una cuenta en la app.');
    } else if (error.code === 'auth/wrong-password') {
      console.log('\n💡 Contraseña incorrecta. Verifica tus credenciales.');
    } else if (error.code === 'auth/invalid-email') {
      console.log('\n💡 Email inválido. Verifica el formato del email.');
    }
    
    process.exit(1);
  }
}

setupAdmin();
