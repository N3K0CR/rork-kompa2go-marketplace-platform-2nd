import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Stack } from 'expo-router';
import { initializeApp, getApps } from 'firebase/app';
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  query,
  where,
  Timestamp,
} from 'firebase/firestore';
import { getAuth, signInAnonymously } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);
const auth = getAuth(app);

type TestStatus = 'idle' | 'running' | 'success' | 'error';

interface TestResult {
  name: string;
  status: TestStatus;
  message: string;
  data?: any;
}

export default function FirebaseTest() {
  const [results, setResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [userId, setUserId] = useState<string>('');

  const addResult = (result: TestResult) => {
    setResults((prev) => [...prev, result]);
  };

  const runTests = async () => {
    setResults([]);
    setIsRunning(true);

    try {
      addResult({
        name: 'Autenticación',
        status: 'running',
        message: 'Iniciando sesión anónima...',
      });

      const userCredential = await signInAnonymously(auth);
      const uid = userCredential.user.uid;
      setUserId(uid);

      addResult({
        name: 'Autenticación',
        status: 'success',
        message: `Usuario autenticado: ${uid}`,
        data: { userId: uid },
      });

      addResult({
        name: 'Crear Ruta',
        status: 'running',
        message: 'Creando ruta de prueba...',
      });

      const routeId = `test_route_${Date.now()}`;
      const routeData = {
        id: routeId,
        driverId: uid,
        origin: { lat: 19.4326, lng: -99.1332 },
        destination: { lat: 19.4978, lng: -99.1269 },
        departureTime: Timestamp.now(),
        availableSeats: 3,
        status: 'active',
        createdAt: Timestamp.now(),
      };

      await addDoc(collection(db, 'routes'), routeData);

      addResult({
        name: 'Crear Ruta',
        status: 'success',
        message: `Ruta creada: ${routeId}`,
        data: { routeId },
      });

      addResult({
        name: 'Crear Viaje',
        status: 'running',
        message: 'Creando viaje de prueba...',
      });

      const tripId = `test_trip_${Date.now()}`;
      const tripData = {
        id: tripId,
        routeId: routeId,
        passengerId: uid,
        status: 'pending',
        requestedAt: Timestamp.now(),
        createdAt: Timestamp.now(),
      };

      await addDoc(collection(db, 'trips'), tripData);

      addResult({
        name: 'Crear Viaje',
        status: 'success',
        message: `Viaje creado: ${tripId}`,
        data: { tripId },
      });

      addResult({
        name: 'Obtener Estadísticas',
        status: 'running',
        message: 'Consultando estadísticas...',
      });

      const routesQuery = query(
        collection(db, 'routes'),
        where('driverId', '==', uid)
      );
      const routesSnapshot = await getDocs(routesQuery);

      const tripsQuery = query(
        collection(db, 'trips'),
        where('passengerId', '==', uid)
      );
      const tripsSnapshot = await getDocs(tripsQuery);

      addResult({
        name: 'Obtener Estadísticas',
        status: 'success',
        message: `Rutas: ${routesSnapshot.size}, Viajes: ${tripsSnapshot.size}`,
        data: {
          routesCount: routesSnapshot.size,
          tripsCount: tripsSnapshot.size,
        },
      });

      addResult({
        name: 'Pruebas Completadas',
        status: 'success',
        message: 'Todas las pruebas se ejecutaron correctamente',
      });
    } catch (error: any) {
      console.error('[FirebaseTest] Error:', error);
      addResult({
        name: 'Error',
        status: 'error',
        message: error.message || 'Error desconocido',
        data: { error: error.code || 'unknown' },
      });
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusColor = (status: TestStatus) => {
    switch (status) {
      case 'running':
        return '#FFA500';
      case 'success':
        return '#4CAF50';
      case 'error':
        return '#F44336';
      default:
        return '#999';
    }
  };

  const getStatusIcon = (status: TestStatus) => {
    switch (status) {
      case 'running':
        return '⏳';
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      default:
        return '⚪';
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Pruebas de Firebase',
          headerStyle: { backgroundColor: '#6200EE' },
          headerTintColor: '#fff',
        }}
      />

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Pruebas de Firebase</Text>
          <Text style={styles.subtitle}>
            Verifica la integración con Firestore
          </Text>
        </View>

        {userId ? (
          <View style={styles.userInfo}>
            <Text style={styles.userLabel}>Auth User ID:</Text>
            <Text style={styles.userId}>{userId}</Text>
          </View>
        ) : null}

        <TouchableOpacity
          style={[styles.button, isRunning && styles.buttonDisabled]}
          onPress={runTests}
          disabled={isRunning}
        >
          {isRunning ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Ejecutar Pruebas</Text>
          )}
        </TouchableOpacity>

        <View style={styles.resultsContainer}>
          {results.map((result, index) => (
            <View key={index} style={[styles.resultCard, index > 0 && styles.resultCardSpacing]}>
              <View style={styles.resultHeader}>
                <Text style={styles.resultIcon}>{getStatusIcon(result.status)}</Text>
                <Text style={styles.resultName}>{result.name}</Text>
              </View>
              <Text
                style={[
                  styles.resultMessage,
                  { color: getStatusColor(result.status) },
                ]}
              >
                {result.message}
              </Text>
              {result.data ? (
                <View style={styles.resultData}>
                  <Text style={styles.resultDataText}>
                    {JSON.stringify(result.data, null, 2)}
                  </Text>
                </View>
              ) : null}
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  userInfo: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  userLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  userId: {
    fontSize: 12,
    color: '#333',
  },
  button: {
    backgroundColor: '#6200EE',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 24,
  },
  buttonDisabled: {
    backgroundColor: '#9E9E9E',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  resultsContainer: {
  },
  resultCardSpacing: {
    marginTop: 12,
  },
  resultCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  resultIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  resultName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  resultMessage: {
    fontSize: 14,
    marginBottom: 8,
  },
  resultData: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 4,
    marginTop: 8,
  },
  resultDataText: {
    fontSize: 12,
    color: '#666',
  },
});
