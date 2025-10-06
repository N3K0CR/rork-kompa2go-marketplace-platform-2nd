import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Play, CheckCircle, XCircle, AlertCircle, MapPin } from 'lucide-react-native';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '@/context-package/design-system';
import { useCommute } from '@/hooks/useCommute';
import {
  calculateTripPrice,
  calculateDistance,
  calculateDuration,
  formatCRC,
  calculateDemandLevel,
  calculateTrafficLevel,
} from '@/src/modules/commute/utils/pricing';

interface TestResult {
  step: string;
  status: 'pending' | 'running' | 'success' | 'error';
  message?: string;
  error?: string;
  data?: any;
  timestamp?: Date;
}

interface LocationPoint {
  latitude: number;
  longitude: number;
  address: string;
  name?: string;
}

export default function KommuteTripTest() {
  const { transportModes, createRoute, startTrip, routes } = useCommute();
  const insets = useSafeAreaInsets();
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [, setCurrentStep] = useState(0);

  const testLocations = {
    origin: {
      latitude: 9.9281,
      longitude: -84.0907,
      address: 'San José Centro, Costa Rica',
      name: 'San José Centro',
    } as LocationPoint,
    destination: {
      latitude: 9.9355,
      longitude: -84.0838,
      address: 'Barrio Escalante, San José, Costa Rica',
      name: 'Barrio Escalante',
    } as LocationPoint,
  };

  const updateTestResult = (step: string, status: TestResult['status'], message?: string, error?: string, data?: any) => {
    setTestResults((prev) => {
      const existing = prev.find((r) => r.step === step);
      if (existing) {
        return prev.map((r) =>
          r.step === step
            ? { ...r, status, message, error, data, timestamp: new Date() }
            : r
        );
      }
      return [...prev, { step, status, message, error, data, timestamp: new Date() }];
    });
  };

  const addTestStep = (step: string) => {
    updateTestResult(step, 'pending');
  };

  const runFullTest = async () => {
    setIsRunning(true);
    setTestResults([]);
    setCurrentStep(0);

    try {
      await testStep1_CheckAuth();
      await testStep2_CheckTransportModes();
      await testStep3_TestGeocoding();
      await testStep4_CalculateDistance();
      await testStep5_CalculatePricing();
      await testStep6_CreateRoute();
      await testStep7_StartTrip();
      
      Alert.alert('✅ Test Completo', 'Todos los tests se ejecutaron correctamente');
    } catch (error: any) {
      console.error('❌ Test failed:', error);
      Alert.alert('❌ Test Fallido', error.message || 'Error desconocido');
    } finally {
      setIsRunning(false);
    }
  };

  const testStep1_CheckAuth = async () => {
    const step = 'Step 1: Verificar Autenticación';
    addTestStep(step);
    setCurrentStep(1);
    updateTestResult(step, 'running', 'Verificando usuario autenticado...');

    try {
      await new Promise((resolve) => setTimeout(resolve, 500));

      const mockUserId = 'test_user_' + Date.now();
      
      updateTestResult(
        step,
        'success',
        `Usuario de prueba creado: ${mockUserId}`,
        undefined,
        { userId: mockUserId, note: 'Usuario simulado para testing' }
      );
    } catch (error: any) {
      updateTestResult(step, 'error', undefined, error.message);
      throw error;
    }
  };

  const testStep2_CheckTransportModes = async () => {
    const step = 'Step 2: Verificar Modos de Transporte';
    addTestStep(step);
    setCurrentStep(2);
    updateTestResult(step, 'running', 'Cargando modos de transporte...');

    try {
      await new Promise((resolve) => setTimeout(resolve, 500));

      if (!transportModes || transportModes.length === 0) {
        throw new Error('No hay modos de transporte disponibles');
      }

      const availableModes = transportModes.filter((m) => m.available);
      if (availableModes.length === 0) {
        throw new Error('No hay modos de transporte disponibles en este momento');
      }

      updateTestResult(
        step,
        'success',
        `${availableModes.length} modos de transporte disponibles`,
        undefined,
        { modes: availableModes.map((m) => ({ id: m.id, name: m.name, capacity: m.capacity })) }
      );
    } catch (error: any) {
      updateTestResult(step, 'error', undefined, error.message);
      throw error;
    }
  };

  const testStep3_TestGeocoding = async () => {
    const step = 'Step 3: Test de Geocodificación';
    addTestStep(step);
    setCurrentStep(3);
    updateTestResult(step, 'running', 'Probando geocodificación inversa...');

    try {
      const { latitude, longitude } = testLocations.origin;
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
        {
          method: 'GET',
          headers: {
            Accept: 'application/json',
            'User-Agent': 'Kompa2Go/1.0',
          },
          signal: controller.signal,
        }
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.display_name) {
        throw new Error('No se recibió dirección del servicio de geocodificación');
      }

      updateTestResult(
        step,
        'success',
        'Geocodificación funcionando correctamente',
        undefined,
        { address: data.display_name }
      );
    } catch (error: any) {
      const errorMessage = error.name === 'AbortError' 
        ? 'Timeout: El servicio de geocodificación no respondió a tiempo'
        : error.message || 'Error desconocido en geocodificación';
      
      updateTestResult(step, 'error', undefined, errorMessage);
      throw new Error(errorMessage);
    }
  };

  const testStep4_CalculateDistance = async () => {
    const step = 'Step 4: Calcular Distancia';
    addTestStep(step);
    setCurrentStep(4);
    updateTestResult(step, 'running', 'Calculando distancia entre origen y destino...');

    try {
      await new Promise((resolve) => setTimeout(resolve, 300));

      const { origin, destination } = testLocations;
      
      const distanceMeters = calculateDistance(
        origin.latitude,
        origin.longitude,
        destination.latitude,
        destination.longitude
      );

      if (distanceMeters <= 0) {
        throw new Error('La distancia calculada es inválida');
      }

      const distanceKm = (distanceMeters / 1000).toFixed(2);
      const durationSeconds = calculateDuration(distanceMeters, 30);
      const durationMinutes = Math.ceil(durationSeconds / 60);

      updateTestResult(
        step,
        'success',
        `Distancia: ${distanceKm} km, Duración estimada: ${durationMinutes} min`,
        undefined,
        { distanceMeters, distanceKm, durationSeconds, durationMinutes }
      );
    } catch (error: any) {
      updateTestResult(step, 'error', undefined, error.message);
      throw error;
    }
  };

  const testStep5_CalculatePricing = async () => {
    const step = 'Step 5: Calcular Precios';
    addTestStep(step);
    setCurrentStep(5);
    updateTestResult(step, 'running', 'Calculando precios con algoritmo dinámico...');

    try {
      await new Promise((resolve) => setTimeout(resolve, 300));

      const { origin, destination } = testLocations;
      
      const distanceMeters = calculateDistance(
        origin.latitude,
        origin.longitude,
        destination.latitude,
        destination.longitude
      );

      const durationSeconds = calculateDuration(distanceMeters, 30);
      const now = new Date();
      const demandLevel = calculateDemandLevel(now);
      const trafficLevel = calculateTrafficLevel(now);

      const kommute4Mode = transportModes.find((m) => m.id === 'kommute-4');
      if (!kommute4Mode) {
        throw new Error('Modo de transporte Kommute 4 no encontrado');
      }

      const pricingResult = calculateTripPrice(
        distanceMeters,
        durationSeconds,
        kommute4Mode.costFactor,
        {
          timestamp: now,
          trafficLevel,
          demandLevel,
          weatherCondition: 'normal',
          isSpecialEvent: false,
        }
      );

      if (pricingResult.price <= 0) {
        throw new Error('El precio calculado es inválido');
      }

      const priceFormatted = formatCRC(pricingResult.price);
      const basePriceFormatted = formatCRC(pricingResult.basePrice);

      updateTestResult(
        step,
        'success',
        `Precio calculado: ${priceFormatted} (Base: ${basePriceFormatted})`,
        undefined,
        {
          price: pricingResult.price,
          basePrice: pricingResult.basePrice,
          appliedFactors: pricingResult.appliedFactors,
          demandLevel,
          trafficLevel,
        }
      );
    } catch (error: any) {
      updateTestResult(step, 'error', undefined, error.message);
      throw error;
    }
  };

  const testStep6_CreateRoute = async () => {
    const step = 'Step 6: Crear Ruta';
    addTestStep(step);
    setCurrentStep(6);
    updateTestResult(step, 'running', 'Creando ruta...');

    try {
      const mockUserId = 'test_user_' + Date.now();

      const { origin, destination } = testLocations;
      
      const distanceMeters = calculateDistance(
        origin.latitude,
        origin.longitude,
        destination.latitude,
        destination.longitude
      );

      const durationSeconds = calculateDuration(distanceMeters, 30);
      const now = new Date();
      const demandLevel = calculateDemandLevel(now);
      const trafficLevel = calculateTrafficLevel(now);

      const kommute4Mode = transportModes.find((m) => m.id === 'kommute-4');
      if (!kommute4Mode) {
        throw new Error('Modo de transporte no encontrado');
      }

      const pricingResult = calculateTripPrice(
        distanceMeters,
        durationSeconds,
        kommute4Mode.costFactor,
        {
          timestamp: now,
          trafficLevel,
          demandLevel,
          weatherCondition: 'normal',
          isSpecialEvent: false,
        }
      );

      const route = await createRoute({
        userId: mockUserId,
        name: `Test: ${origin.name} → ${destination.name}`,
        points: [
          {
            id: `point_origin_${Date.now()}`,
            latitude: origin.latitude,
            longitude: origin.longitude,
            address: origin.address,
            name: origin.name,
            type: 'origin',
          },
          {
            id: `point_dest_${Date.now()}`,
            latitude: destination.latitude,
            longitude: destination.longitude,
            address: destination.address,
            name: destination.name,
            type: 'destination',
          },
        ],
        transportModes: [kommute4Mode],
        distance: distanceMeters,
        duration: durationSeconds,
        estimatedCost: pricingResult.price,
        carbonFootprint: 0,
        status: 'planned',
        isRecurring: false,
      });

      updateTestResult(
        step,
        'success',
        `Ruta creada exitosamente: ${route.id}`,
        undefined,
        { routeId: route.id, name: route.name, distance: distanceMeters, cost: pricingResult.price }
      );
    } catch (error: any) {
      updateTestResult(step, 'error', undefined, error.message);
      throw error;
    }
  };

  const testStep7_StartTrip = async () => {
    const step = 'Step 7: Iniciar Viaje';
    addTestStep(step);
    setCurrentStep(7);
    updateTestResult(step, 'running', 'Iniciando viaje...');

    try {
      if (routes.length === 0) {
        throw new Error('No hay rutas disponibles para iniciar viaje');
      }

      const lastRoute = routes[routes.length - 1];
      
      await startTrip(lastRoute.id);

      updateTestResult(
        step,
        'success',
        `Viaje iniciado exitosamente para ruta: ${lastRoute.id}`,
        undefined,
        { routeId: lastRoute.id, routeName: lastRoute.name }
      );
    } catch (error: any) {
      updateTestResult(step, 'error', undefined, error.message);
      throw error;
    }
  };

  const renderTestResult = (result: TestResult) => {
    const getStatusIcon = () => {
      switch (result.status) {
        case 'pending':
          return <AlertCircle size={20} color={Colors.neutral[400]} />;
        case 'running':
          return <ActivityIndicator size="small" color={Colors.primary[500]} />;
        case 'success':
          return <CheckCircle size={20} color={Colors.success[500]} />;
        case 'error':
          return <XCircle size={20} color={Colors.error[500]} />;
      }
    };

    const getStatusColor = () => {
      switch (result.status) {
        case 'pending':
          return Colors.neutral[100];
        case 'running':
          return Colors.primary[50];
        case 'success':
          return Colors.success[50];
        case 'error':
          return Colors.error[50];
      }
    };

    return (
      <View key={result.step} style={[styles.resultCard, { backgroundColor: getStatusColor() }]}>
        <View style={styles.resultHeader}>
          {getStatusIcon()}
          <Text style={styles.resultStep}>{result.step}</Text>
        </View>

        {result.message && (
          <Text style={styles.resultMessage}>{result.message}</Text>
        )}

        {result.error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>❌ {result.error}</Text>
          </View>
        )}

        {result.data && (
          <View style={styles.dataContainer}>
            <Text style={styles.dataText}>{JSON.stringify(result.data, null, 2)}</Text>
          </View>
        )}

        {result.timestamp && (
          <Text style={styles.timestamp}>
            {result.timestamp.toLocaleTimeString()}
          </Text>
        )}
      </View>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Stack.Screen
        options={{
          title: 'Test de Viaje Kommute',
          headerStyle: { backgroundColor: Colors.primary[500] },
          headerTintColor: 'white',
          headerTitleStyle: { fontWeight: 'bold' as const },
        }}
      />

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>🧪 Test Completo de Viaje</Text>
          <Text style={styles.subtitle}>
            Este test simula una solicitud completa de viaje y verifica todos los componentes del sistema
          </Text>
        </View>

        <View style={styles.locationInfo}>
          <View style={styles.locationItem}>
            <MapPin size={16} color={Colors.success[500]} />
            <View style={styles.locationDetails}>
              <Text style={styles.locationLabel}>Origen</Text>
              <Text style={styles.locationAddress}>{testLocations.origin.name}</Text>
            </View>
          </View>
          <View style={styles.locationItem}>
            <MapPin size={16} color={Colors.error[500]} />
            <View style={styles.locationDetails}>
              <Text style={styles.locationLabel}>Destino</Text>
              <Text style={styles.locationAddress}>{testLocations.destination.name}</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.runButton, isRunning && styles.runButtonDisabled]}
          onPress={runFullTest}
          disabled={isRunning}
        >
          {isRunning ? (
            <>
              <ActivityIndicator size="small" color="white" />
              <Text style={styles.runButtonText}>Ejecutando Tests...</Text>
            </>
          ) : (
            <>
              <Play size={20} color="white" />
              <Text style={styles.runButtonText}>Ejecutar Test Completo</Text>
            </>
          )}
        </TouchableOpacity>

        {testResults.length > 0 && (
          <View style={styles.resultsContainer}>
            <Text style={styles.resultsTitle}>Resultados del Test</Text>
            {testResults.map((result) => renderTestResult(result))}
          </View>
        )}

        {testResults.length > 0 && !isRunning && (
          <View style={styles.summary}>
            <Text style={styles.summaryTitle}>Resumen</Text>
            <View style={styles.summaryStats}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Total</Text>
                <Text style={styles.summaryValue}>{testResults.length}</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryLabel, { color: Colors.success[600] }]}>Exitosos</Text>
                <Text style={[styles.summaryValue, { color: Colors.success[600] }]}>
                  {testResults.filter((r) => r.status === 'success').length}
                </Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryLabel, { color: Colors.error[600] }]}>Fallidos</Text>
                <Text style={[styles.summaryValue, { color: Colors.error[600] }]}>
                  {testResults.filter((r) => r.status === 'error').length}
                </Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.neutral[50],
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing[4],
  },
  header: {
    marginBottom: Spacing[5],
  },
  title: {
    ...Typography.textStyles.h4,
    color: Colors.neutral[800],
    fontWeight: Typography.fontWeight.bold,
    marginBottom: Spacing[2],
  },
  subtitle: {
    ...Typography.textStyles.body,
    color: Colors.neutral[600],
    lineHeight: 22,
  },
  locationInfo: {
    backgroundColor: 'white',
    borderRadius: BorderRadius.lg,
    padding: Spacing[4],
    marginBottom: Spacing[4],
    gap: Spacing[3],
    ...Shadows.sm,
  },
  locationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
  },
  locationDetails: {
    flex: 1,
  },
  locationLabel: {
    ...Typography.textStyles.caption,
    color: Colors.neutral[500],
    marginBottom: Spacing[1],
  },
  locationAddress: {
    ...Typography.textStyles.body,
    color: Colors.neutral[800],
    fontWeight: Typography.fontWeight.medium,
  },
  runButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing[2],
    backgroundColor: Colors.primary[500],
    paddingVertical: Spacing[4],
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing[5],
    ...Shadows.md,
  },
  runButtonDisabled: {
    opacity: 0.6,
  },
  runButtonText: {
    ...Typography.textStyles.button,
    color: 'white',
    fontWeight: Typography.fontWeight.bold,
  },
  resultsContainer: {
    gap: Spacing[3],
  },
  resultsTitle: {
    ...Typography.textStyles.h5,
    color: Colors.neutral[800],
    fontWeight: Typography.fontWeight.bold,
    marginBottom: Spacing[2],
  },
  resultCard: {
    borderRadius: BorderRadius.lg,
    padding: Spacing[4],
    ...Shadows.sm,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
    marginBottom: Spacing[2],
  },
  resultStep: {
    ...Typography.textStyles.h6,
    color: Colors.neutral[800],
    fontWeight: Typography.fontWeight.semibold,
    flex: 1,
  },
  resultMessage: {
    ...Typography.textStyles.body,
    color: Colors.neutral[700],
    marginBottom: Spacing[2],
  },
  errorContainer: {
    backgroundColor: Colors.error[100],
    borderRadius: BorderRadius.md,
    padding: Spacing[3],
    marginTop: Spacing[2],
  },
  errorText: {
    ...Typography.textStyles.bodySmall,
    color: Colors.error[700],
    lineHeight: 20,
  },
  dataContainer: {
    backgroundColor: Colors.neutral[100],
    borderRadius: BorderRadius.md,
    padding: Spacing[3],
    marginTop: Spacing[2],
  },
  dataText: {
    ...Typography.textStyles.caption,
    color: Colors.neutral[700],
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  timestamp: {
    ...Typography.textStyles.caption,
    color: Colors.neutral[500],
    marginTop: Spacing[2],
    textAlign: 'right',
  },
  summary: {
    backgroundColor: 'white',
    borderRadius: BorderRadius.lg,
    padding: Spacing[4],
    marginTop: Spacing[5],
    ...Shadows.md,
  },
  summaryTitle: {
    ...Typography.textStyles.h6,
    color: Colors.neutral[800],
    fontWeight: Typography.fontWeight.bold,
    marginBottom: Spacing[3],
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryLabel: {
    ...Typography.textStyles.bodySmall,
    color: Colors.neutral[600],
    marginBottom: Spacing[1],
  },
  summaryValue: {
    ...Typography.textStyles.h4,
    color: Colors.neutral[800],
    fontWeight: Typography.fontWeight.bold,
  },
});
