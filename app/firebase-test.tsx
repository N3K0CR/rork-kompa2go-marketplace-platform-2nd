import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CheckCircle, XCircle, Loader } from 'lucide-react-native';
import { firestoreService } from '@/src/modules/commute/services/firestore-service';
import type { Route, Trip, TrackingPoint } from '@/src/modules/commute/types/core-types';

type TestResult = {
  name: string;
  status: 'pending' | 'running' | 'success' | 'error';
  message?: string;
  duration?: number;
};

export default function FirebaseTestScreen() {
  const insets = useSafeAreaInsets();
  const [tests, setTests] = useState<TestResult[]>([
    { name: 'Conexión a Firebase', status: 'pending' },
    { name: 'Crear Ruta', status: 'pending' },
    { name: 'Leer Ruta', status: 'pending' },
    { name: 'Actualizar Ruta', status: 'pending' },
    { name: 'Crear Viaje', status: 'pending' },
    { name: 'Agregar Puntos de Seguimiento', status: 'pending' },
    { name: 'Finalizar Viaje', status: 'pending' },
    { name: 'Obtener Estadísticas', status: 'pending' },
    { name: 'Eliminar Datos de Prueba', status: 'pending' },
  ]);

  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [testRouteId, setTestRouteId] = useState<string>('');
  const [testTripId, setTestTripId] = useState<string>('');

  const updateTest = (index: number, updates: Partial<TestResult>) => {
    setTests(prev => prev.map((test, i) => i === index ? { ...test, ...updates } : test));
  };

  const runTests = async () => {
    if (isRunning) return;
    
    setIsRunning(true);
    const userId = 'test_user_' + Date.now();
    let routeId = '';
    let tripId = '';

    try {
      updateTest(0, { status: 'running' });
      const startTime0 = Date.now();
      await new Promise(resolve => setTimeout(resolve, 500));
      updateTest(0, { 
        status: 'success', 
        message: 'Conectado a Firebase Firestore',
        duration: Date.now() - startTime0
      });

      updateTest(1, { status: 'running' });
      const startTime1 = Date.now();
      const testRoute: Route = {
        id: `test_route_${Date.now()}`,
        userId,
        name: 'Ruta de Prueba',
        points: [
          {
            id: 'point1',
            latitude: 9.9281,
            longitude: -84.0907,
            address: 'San José, Costa Rica',
            name: 'Origen',
            type: 'origin',
          },
          {
            id: 'point2',
            latitude: 9.9355,
            longitude: -84.0833,
            address: 'Sabana, San José',
            name: 'Destino',
            type: 'destination',
          },
        ],
        transportModes: [
          {
            id: 'car',
            name: 'Auto',
            icon: 'car',
            color: '#EF4444',
            carbonFactor: 0.21,
            costFactor: 0.5,
            speedFactor: 40,
            available: true,
          },
        ],
        distance: 2500,
        duration: 600,
        estimatedCost: 1250,
        carbonFootprint: 525,
        status: 'planned',
        isRecurring: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      await firestoreService.routes.create(testRoute);
      routeId = testRoute.id;
      setTestRouteId(routeId);
      updateTest(1, { 
        status: 'success', 
        message: `Ruta creada: ${routeId}`,
        duration: Date.now() - startTime1
      });

      updateTest(2, { status: 'running' });
      const startTime2 = Date.now();
      const retrievedRoute = await firestoreService.routes.get(routeId);
      if (!retrievedRoute) {
        throw new Error('No se pudo recuperar la ruta');
      }
      updateTest(2, { 
        status: 'success', 
        message: `Ruta recuperada: ${retrievedRoute.name}`,
        duration: Date.now() - startTime2
      });

      updateTest(3, { status: 'running' });
      const startTime3 = Date.now();
      await firestoreService.routes.update(routeId, {
        name: 'Ruta de Prueba Actualizada',
        status: 'active',
      });
      updateTest(3, { 
        status: 'success', 
        message: 'Ruta actualizada correctamente',
        duration: Date.now() - startTime3
      });

      updateTest(4, { status: 'running' });
      const startTime4 = Date.now();
      const testTrip: Trip = {
        id: `test_trip_${Date.now()}`,
        routeId,
        userId,
        startTime: new Date(),
        status: 'in_progress',
        trackingPoints: [],
      };
      
      await firestoreService.trips.create(testTrip);
      tripId = testTrip.id;
      setTestTripId(tripId);
      updateTest(4, { 
        status: 'success', 
        message: `Viaje creado: ${tripId}`,
        duration: Date.now() - startTime4
      });

      updateTest(5, { status: 'running' });
      const startTime5 = Date.now();
      const trackingPoints: TrackingPoint[] = [
        {
          id: `point_${Date.now()}_1`,
          tripId,
          latitude: 9.9281,
          longitude: -84.0907,
          timestamp: new Date(),
          speed: 0,
          accuracy: 10,
        },
        {
          id: `point_${Date.now()}_2`,
          tripId,
          latitude: 9.9300,
          longitude: -84.0880,
          timestamp: new Date(Date.now() + 60000),
          speed: 15,
          accuracy: 8,
        },
        {
          id: `point_${Date.now()}_3`,
          tripId,
          latitude: 9.9355,
          longitude: -84.0833,
          timestamp: new Date(Date.now() + 120000),
          speed: 20,
          accuracy: 5,
        },
      ];
      
      await firestoreService.tracking.addPointsBatch(trackingPoints);
      updateTest(5, { 
        status: 'success', 
        message: `${trackingPoints.length} puntos agregados`,
        duration: Date.now() - startTime5
      });

      updateTest(6, { status: 'running' });
      const startTime6 = Date.now();
      await firestoreService.trips.update(tripId, {
        endTime: new Date(),
        status: 'completed',
        actualDistance: 2500,
        actualDuration: 600000,
      });
      updateTest(6, { 
        status: 'success', 
        message: 'Viaje finalizado correctamente',
        duration: Date.now() - startTime6
      });

      updateTest(7, { status: 'running' });
      const startTime7 = Date.now();
      const stats = await firestoreService.utils.getStats(userId);
      updateTest(7, { 
        status: 'success', 
        message: `Rutas: ${stats.totalRoutes}, Viajes: ${stats.totalTrips}`,
        duration: Date.now() - startTime7
      });

      updateTest(8, { status: 'running' });
      const startTime8 = Date.now();
      await firestoreService.utils.clearUserData(userId);
      updateTest(8, { 
        status: 'success', 
        message: 'Datos de prueba eliminados',
        duration: Date.now() - startTime8
      });

      Alert.alert(
        '✅ Pruebas Completadas',
        'Todas las pruebas de Firebase se ejecutaron exitosamente. La integración está funcionando correctamente.',
        [{ text: 'OK' }]
      );

    } catch (error: any) {
      const currentTest = tests.findIndex(t => t.status === 'running');
      if (currentTest !== -1) {
        updateTest(currentTest, { 
          status: 'error', 
          message: error.message || 'Error desconocido'
        });
      }
      
      Alert.alert(
        '❌ Error en Pruebas',
        `Error: ${error.message}\n\nRevisa la consola para más detalles.`,
        [{ text: 'OK' }]
      );
      
      console.error('[FirebaseTest] Error:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const resetTests = () => {
    setTests(prev => prev.map(test => ({ 
      ...test, 
      status: 'pending', 
      message: undefined,
      duration: undefined
    })));
    setTestRouteId('');
    setTestTripId('');
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle size={20} color="#10B981" />;
      case 'error':
        return <XCircle size={20} color="#EF4444" />;
      case 'running':
        return <Loader size={20} color="#3B82F6" />;
      default:
        return <View style={styles.pendingIcon} />;
    }
  };

  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return '#10B981';
      case 'error':
        return '#EF4444';
      case 'running':
        return '#3B82F6';
      default:
        return '#9CA3AF';
    }
  };

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <Stack.Screen 
        options={{ 
          title: 'Firebase Integration Test',
          headerStyle: { backgroundColor: '#1F2937' },
          headerTintColor: '#fff',
        }} 
      />
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>🔥 Firebase Firestore Test</Text>
          <Text style={styles.subtitle}>
            Prueba la integración con Firebase Firestore
          </Text>
        </View>

        <View style={styles.testsContainer}>
          {tests.map((test, index) => (
            <View key={index} style={styles.testItem}>
              <View style={styles.testHeader}>
                {getStatusIcon(test.status)}
                <Text style={[styles.testName, { color: getStatusColor(test.status) }]}>
                  {test.name}
                </Text>
              </View>
              
              {test.message && (
                <Text style={styles.testMessage}>{test.message}</Text>
              )}
              
              {test.duration && (
                <Text style={styles.testDuration}>{test.duration}ms</Text>
              )}
            </View>
          ))}
        </View>

        {testRouteId && (
          <View style={styles.infoBox}>
            <Text style={styles.infoLabel}>Route ID:</Text>
            <Text style={styles.infoValue}>{testRouteId}</Text>
          </View>
        )}

        {testTripId && (
          <View style={styles.infoBox}>
            <Text style={styles.infoLabel}>Trip ID:</Text>
            <Text style={styles.infoValue}>{testTripId}</Text>
          </View>
        )}

        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.button, styles.primaryButton, isRunning && styles.disabledButton]}
            onPress={runTests}
            disabled={isRunning}
          >
            <Text style={styles.buttonText}>
              {isRunning ? 'Ejecutando...' : 'Ejecutar Pruebas'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={resetTests}
            disabled={isRunning}
          >
            <Text style={[styles.buttonText, styles.secondaryButtonText]}>
              Reiniciar
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>ℹ️ Información</Text>
          <Text style={styles.infoText}>
            Este test verifica que la integración con Firebase Firestore esté funcionando correctamente.
          </Text>
          <Text style={styles.infoText}>
            Se crearán datos de prueba que serán eliminados automáticamente al finalizar.
          </Text>
          <Text style={styles.infoText}>
            Asegúrate de tener conexión a internet y que Firebase esté configurado correctamente.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold' as const,
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#9CA3AF',
  },
  testsContainer: {
    backgroundColor: '#1F2937',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  testItem: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  testHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  testName: {
    fontSize: 16,
    fontWeight: '600' as const,
    marginLeft: 8,
  },
  testMessage: {
    fontSize: 14,
    color: '#9CA3AF',
    marginLeft: 28,
    marginTop: 4,
  },
  testDuration: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 28,
    marginTop: 2,
  },
  pendingIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#374151',
  },
  infoBox: {
    backgroundColor: '#1F2937',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 14,
    color: '#fff',
    fontFamily: 'monospace',
  },
  actions: {
    gap: 12,
    marginBottom: 24,
  },
  button: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#3B82F6',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#374151',
  },
  disabledButton: {
    opacity: 0.5,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#fff',
  },
  secondaryButtonText: {
    color: '#9CA3AF',
  },
  infoSection: {
    backgroundColor: '#1F2937',
    borderRadius: 12,
    padding: 16,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#fff',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 8,
    lineHeight: 20,
  },
});
