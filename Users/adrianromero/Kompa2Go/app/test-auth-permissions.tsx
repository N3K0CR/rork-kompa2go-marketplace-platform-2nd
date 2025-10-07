import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useFirebaseAuth } from '@/contexts/FirebaseAuthContext';
import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, query, where } from 'firebase/firestore';
import { Stack } from 'expo-router';

export default function TestAuthPermissions() {
  const { user, signIn, signOut } = useFirebaseAuth();
  const [testResults, setTestResults] = useState<string[]>([]);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (user) {
      checkAdminStatus();
    } else {
      setIsAdmin(null);
    }
  }, [user]);

  const addResult = (result: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${result}`]);
  };

  const checkAdminStatus = async () => {
    if (!user) {
      addResult('❌ No hay usuario autenticado');
      return;
    }

    try {
      addResult(`🔍 Verificando admin para UID: ${user.uid}`);
      const adminDoc = await getDocs(
        query(collection(db, 'admin_users'), where('__name__', '==', user.uid))
      );
      
      if (!adminDoc.empty) {
        setIsAdmin(true);
        addResult('✅ Usuario es ADMIN');
      } else {
        setIsAdmin(false);
        addResult('⚠️ Usuario NO es admin');
      }
    } catch (error: any) {
      addResult(`❌ Error verificando admin: ${error.message}`);
      setIsAdmin(false);
    }
  };

  const testAlertTracking = async () => {
    if (!user) {
      Alert.alert('Error', 'Debes iniciar sesión primero');
      return;
    }

    addResult('🧪 Iniciando prueba de Alert Tracking...');

    try {
      const alertData = {
        userId: user.uid,
        kommuterId: 'test-kommuter-id',
        status: 'pending',
        type: 'security',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      addResult('📝 Intentando crear alerta...');
      const docRef = await addDoc(collection(db, 'alert_tracking'), alertData);
      addResult(`✅ Alerta creada exitosamente: ${docRef.id}`);
    } catch (error: any) {
      addResult(`❌ Error creando alerta: ${error.code} - ${error.message}`);
    }
  };

  const testAlertLocationTracking = async () => {
    if (!user) {
      Alert.alert('Error', 'Debes iniciar sesión primero');
      return;
    }

    addResult('🧪 Iniciando prueba de Alert Location Tracking...');

    try {
      const locationData = {
        alertId: 'test-alert-id',
        userId: user.uid,
        latitude: 9.9281,
        longitude: -84.0907,
        timestamp: new Date().toISOString(),
      };

      addResult('📍 Intentando crear ubicación...');
      const docRef = await addDoc(collection(db, 'alert_location_tracking'), locationData);
      addResult(`✅ Ubicación creada exitosamente: ${docRef.id}`);
    } catch (error: any) {
      addResult(`❌ Error creando ubicación: ${error.code} - ${error.message}`);
    }
  };

  const handleSignIn = async () => {
    try {
      addResult('🔐 Intentando iniciar sesión...');
      await signIn(email, password);
      addResult('✅ Sesión iniciada exitosamente');
    } catch (error: any) {
      addResult(`❌ Error iniciando sesión: ${error.message}`);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      addResult('👋 Sesión cerrada');
      setTestResults([]);
    } catch (error: any) {
      addResult(`❌ Error cerrando sesión: ${error.message}`);
    }
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Test Auth & Permissions' }} />
      <ScrollView style={styles.container}>
        <View style={styles.section}>
          <Text style={styles.title}>Estado de Autenticación</Text>
          
          {user ? (
            <View style={styles.userInfo}>
              <Text style={styles.label}>✅ Usuario autenticado</Text>
              <Text style={styles.value}>Email: {user.email}</Text>
              <Text style={styles.value}>UID: {user.uid}</Text>
              <Text style={[styles.value, isAdmin ? styles.admin : styles.notAdmin]}>
                {isAdmin === null ? '⏳ Verificando...' : isAdmin ? '👑 ADMIN' : '👤 Usuario Regular'}
              </Text>
              
              <TouchableOpacity style={styles.button} onPress={handleSignOut}>
                <Text style={styles.buttonText}>Cerrar Sesión</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.loginForm}>
              <Text style={styles.label}>❌ No autenticado</Text>
              <Text style={styles.hint}>
                Usa el email que agregaste a admin_users en Firestore
              </Text>
              
              <TouchableOpacity style={styles.button} onPress={handleSignIn}>
                <Text style={styles.buttonText}>Iniciar Sesión (Usa tu email/password)</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.title}>Pruebas de Permisos</Text>
          
          <TouchableOpacity 
            style={[styles.button, !user && styles.buttonDisabled]} 
            onPress={testAlertTracking}
            disabled={!user}
          >
            <Text style={styles.buttonText}>Test: Crear Alert Tracking</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.button, !user && styles.buttonDisabled]} 
            onPress={testAlertLocationTracking}
            disabled={!user}
          >
            <Text style={styles.buttonText}>Test: Crear Alert Location</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.button, !user && styles.buttonDisabled]} 
            onPress={checkAdminStatus}
            disabled={!user}
          >
            <Text style={styles.buttonText}>Verificar Status Admin</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.clearButton} 
            onPress={() => setTestResults([])}
          >
            <Text style={styles.buttonText}>Limpiar Resultados</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.title}>Resultados de Pruebas</Text>
          {testResults.length === 0 ? (
            <Text style={styles.noResults}>No hay resultados aún</Text>
          ) : (
            testResults.map((result, index) => (
              <Text key={index} style={styles.result}>{result}</Text>
            ))
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.title}>Instrucciones</Text>
          <Text style={styles.instruction}>
            1. Inicia sesión con el email que agregaste a admin_users{'\n'}
            2. Verifica que aparezca "👑 ADMIN"{'\n'}
            3. Ejecuta las pruebas de permisos{'\n'}
            4. Si ves errores de permisos, verifica:{'\n'}
               • El UID en Authentication coincide con el ID del documento en admin_users{'\n'}
               • Las reglas de Firestore están desplegadas{'\n'}
               • Estás usando el mismo proyecto de Firebase
          </Text>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  section: {
    backgroundColor: 'white',
    margin: 16,
    padding: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  userInfo: {
    gap: 8,
  },
  loginForm: {
    gap: 12,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  value: {
    fontSize: 14,
    color: '#333',
    marginLeft: 8,
  },
  admin: {
    color: '#10b981',
    fontWeight: 'bold',
  },
  notAdmin: {
    color: '#f59e0b',
  },
  hint: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
  button: {
    backgroundColor: '#3b82f6',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    backgroundColor: '#cbd5e1',
  },
  clearButton: {
    backgroundColor: '#ef4444',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  result: {
    fontSize: 12,
    color: '#333',
    marginBottom: 4,
    fontFamily: 'monospace',
  },
  noResults: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
  },
  instruction: {
    fontSize: 13,
    color: '#666',
    lineHeight: 20,
  },
});
