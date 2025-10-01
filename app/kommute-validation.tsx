import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CheckCircle, XCircle, AlertCircle, Play, Settings, RefreshCw, Shield, Zap } from 'lucide-react-native';
import { useCommute } from '@/src/modules/commute/context/CommuteContext';
import { useKommuteAdmin } from '@/src/modules/commute/hooks/useCommute';
import { Colors, Spacing, BorderRadius, Typography } from '@/context-package/design-system';

// Import error recovery system
import { 
  useErrorRecovery, 
  globalErrorRecovery,
  defaultInputTruncator,
  createInputTruncator,
  handleSmartError 
} from '@/src/modules/commute/utils/error-recovery';
import { 
  safeTRPCCall, 
  chunkedTRPCCall, 
  trpcWrapper 
} from '@/lib/trpc-wrapper';

interface ValidationResult {
  name: string;
  status: 'success' | 'error' | 'warning' | 'pending';
  message: string;
  details?: string;
  errorRecoveryApplied?: boolean;
  inputTruncated?: boolean;
  retryCount?: number;
  timestamp?: Date;
}

// Error recovery validation function
const validateErrorRecoverySystem = async (): Promise<ValidationResult> => {
  const details: string[] = [];
  let hasErrors = false;
  let errorRecoveryApplied = false;

  try {
    // Test 1: Input too long error simulation
    const largeInput = 'x'.repeat(20000); // 20KB string
    const truncator = createInputTruncator(8000);
    const truncatedInput = truncator(largeInput);
    
    if (truncatedInput.length < largeInput.length) {
      details.push('✅ Input truncation working correctly');
    } else {
      details.push('❌ Input truncation failed');
      hasErrors = true;
    }

    // Test 2: Network error simulation
    try {
      await handleSmartError(
        new Error('Network connection lost'),
        { component: 'test', operation: 'network_test' },
        {
          retryOperation: async () => {
            throw new Error('Still failing');
          },
          fallbackValue: 'fallback_used'
        }
      );
      details.push('✅ Network error handling working');
      errorRecoveryApplied = true;
    } catch (error) {
      details.push('❌ Network error handling failed');
      hasErrors = true;
    }

    // Test 3: Error history management
    const errorHistory = globalErrorRecovery.getErrorHistory();
    details.push(`✅ Error history contains ${errorHistory.length} entries`);

    // Test 4: tRPC wrapper functionality
    try {
      const testResult = await safeTRPCCall(
        async () => ({ test: 'success' }),
        { testData: 'small input' },
        { maxRetries: 1, enableSmartErrorHandling: true }
      );
      
      if (testResult?.test === 'success') {
        details.push('✅ tRPC wrapper working correctly');
      } else {
        details.push('❌ tRPC wrapper failed');
        hasErrors = true;
      }
    } catch (error) {
      details.push('❌ tRPC wrapper test failed');
      hasErrors = true;
    }

    return {
      name: 'Sistema de Recuperación de Errores',
      status: hasErrors ? 'warning' : 'success',
      message: hasErrors 
        ? 'Sistema de recuperación de errores parcialmente funcional'
        : 'Sistema de recuperación de errores completamente funcional',
      details: details.join('\n'),
      timestamp: new Date(),
      errorRecoveryApplied,
    };
  } catch (error) {
    return {
      name: 'Sistema de Recuperación de Errores',
      status: 'error',
      message: `Error en validación del sistema de recuperación: ${error instanceof Error ? error.message : 'Error desconocido'}`,
      details: '❌ Validación del sistema de recuperación falló',
      timestamp: new Date(),
    };
  }
};

export default function KommuteValidation() {
  const [validationResults, setValidationResults] = useState<ValidationResult[]>([]);
  const [isValidating, setIsValidating] = useState(false);
  const [overallStatus, setOverallStatus] = useState<'success' | 'error' | 'warning' | 'pending'>('pending');
  const insets = useSafeAreaInsets();
  // No usar el hook aquí para evitar problemas de hooks en callbacks
  
  const { featureFlags, enableKommute, disableKommute } = useKommuteAdmin();
  const {
    isEnabled,
    isInitialized,
    hasLocationPermission,
    currentLocation,
    routes,
    trips,
    transportModes
  } = useCommute();

  const runValidationWithErrorRecovery = useCallback(async (validationFn: () => Promise<ValidationResult>, requiresErrorRecovery: boolean = false): Promise<ValidationResult> => {
    if (!requiresErrorRecovery) {
      return await validationFn();
    }

    try {
      const result = await validationFn();
      return result;
    } catch (error) {
      console.log(`🔄 Applying error recovery for validation:`, error);
      
      const recoveredResult = await handleSmartError(
        error as Error,
        {
          component: 'KommuteValidation',
          operation: 'validation',
        },
        {
          fallbackValue: {
            name: 'Validación con Recuperación',
            status: 'warning' as const,
            message: `Validación completada con recuperación de errores: ${error instanceof Error ? error.message : 'Error desconocido'}`,
            timestamp: new Date(),
            errorRecoveryApplied: true,
          },
        }
      );

      return recoveredResult || {
        name: 'Validación Fallida',
        status: 'error' as const,
        message: `Error durante la validación (sin recuperación): ${error instanceof Error ? error.message : 'Error desconocido'}`,
        timestamp: new Date(),
      };
    }
  }, []);

  const runValidation = useCallback(async (testErrorRecovery: boolean = false) => {
    setIsValidating(true);
    const results: ValidationResult[] = [];

    try {
      // 1. Validar contexto base
      const contextValidation = await runValidationWithErrorRecovery(async () => ({
        name: 'Contexto Base',
        status: isInitialized ? 'success' as const : 'error' as const,
        message: isInitialized ? 'Contexto inicializado correctamente' : 'Error en inicialización del contexto',
        details: `Estado: ${isInitialized ? 'Inicializado' : 'No inicializado'}`,
        timestamp: new Date(),
      }), true);
      results.push(contextValidation);

      // 2. Validar feature flags
      const flagsValidation = await runValidationWithErrorRecovery(async () => ({
        name: 'Feature Flags',
        status: featureFlags ? 'success' as const : 'error' as const,
        message: featureFlags ? 'Feature flags cargados' : 'Error cargando feature flags',
        details: `KOMMUTE_ENABLED: ${featureFlags?.KOMMUTE_ENABLED || false}`,
        timestamp: new Date(),
      }), true);
      results.push(flagsValidation);

      // 3. Validar permisos de ubicación
      results.push({
        name: 'Permisos de Ubicación',
        status: hasLocationPermission ? 'success' : 'warning',
        message: hasLocationPermission ? 'Permisos concedidos' : 'Permisos no concedidos',
        details: `Ubicación actual: ${currentLocation ? 'Disponible' : 'No disponible'}`,
        timestamp: new Date(),
      });

      // 4. Validar modos de transporte
      results.push({
        name: 'Modos de Transporte',
        status: transportModes.length > 0 ? 'success' : 'error',
        message: `${transportModes.length} modos disponibles`,
        details: transportModes.map(m => m.name).join(', '),
        timestamp: new Date(),
      });

      // 5. Validar datos locales
      results.push({
        name: 'Datos Locales',
        status: 'success',
        message: `${routes.length} rutas, ${trips.length} viajes`,
        details: `Rutas: ${routes.length}, Viajes: ${trips.length}`,
        timestamp: new Date(),
      });

      // 6. Validar backend (simplificado)
      const backendValidation = await runValidationWithErrorRecovery(async () => ({
        name: 'Backend tRPC',
        status: 'warning' as const,
        message: 'Backend disponible (no validado en tiempo real)',
        details: 'La validación completa requiere conexión activa',
        timestamp: new Date(),
      }), true);
      results.push(backendValidation);

      // 7. Validar sistema de recuperación de errores (si se solicita)
      if (testErrorRecovery) {
        const errorRecoveryValidation = await validateErrorRecoverySystem();
        results.push(errorRecoveryValidation);
      }

    } catch (error) {
      results.push({
        name: 'Validación General',
        status: 'error',
        message: 'Error crítico durante la validación',
        details: error instanceof Error ? error.message : 'Error desconocido',
        timestamp: new Date(),
      });
    }

    setValidationResults(results);
    
    // Determinar estado general
    const hasErrors = results.some(r => r.status === 'error');
    const hasWarnings = results.some(r => r.status === 'warning');
    
    if (hasErrors) {
      setOverallStatus('error');
    } else if (hasWarnings) {
      setOverallStatus('warning');
    } else {
      setOverallStatus('success');
    }
    
    setIsValidating(false);
  }, [isInitialized, featureFlags, hasLocationPermission, currentLocation, transportModes, routes, trips, runValidationWithErrorRecovery]);

  const handleEnableKommute = async () => {
    try {
      await enableKommute();
      console.log('✅ 2Kommute habilitado exitosamente');
      setTimeout(() => runValidation(), 1000);
    } catch (error) {
      console.error('❌ Error habilitando 2Kommute:', error);
    }
  };

  const handleDisableKommute = async () => {
    try {
      await disableKommute();
      console.log('⚠️ 2Kommute deshabilitado');
      setTimeout(() => runValidation(), 1000);
    } catch (error) {
      console.error('❌ Error deshabilitando 2Kommute:', error);
    }
  };

  useEffect(() => {
    runValidation(false);
  }, [runValidation]);

  const getStatusIcon = (status: ValidationResult['status'], result?: ValidationResult) => {
    const hasErrorRecovery = result?.errorRecoveryApplied;
    
    switch (status) {
      case 'success':
        return hasErrorRecovery ? 
          <Shield size={20} color={Colors.success[500]} /> : 
          <CheckCircle size={20} color={Colors.success[500]} />;
      case 'error':
        return <XCircle size={20} color={Colors.error[500]} />;
      case 'warning':
        return hasErrorRecovery ? 
          <Zap size={20} color={Colors.warning[500]} /> : 
          <AlertCircle size={20} color={Colors.warning[500]} />;
      default:
        return <AlertCircle size={20} color={Colors.neutral[400]} />;
    }
  };

  const getStatusColor = (status: ValidationResult['status']) => {
    switch (status) {
      case 'success':
        return Colors.success[50];
      case 'error':
        return Colors.error[50];
      case 'warning':
        return Colors.warning[50];
      default:
        return Colors.neutral[50];
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Stack.Screen 
        options={{ 
          title: '2Kommute - Validación',
          headerStyle: { backgroundColor: Colors.primary[500] },
          headerTintColor: 'white',
          headerTitleStyle: { fontWeight: 'bold' }
        }} 
      />
      
      <ScrollView style={styles.scrollView}>
        {/* Estado General */}
        <View style={[styles.overallStatus, { backgroundColor: getStatusColor(overallStatus) }]}>
          <View style={styles.overallStatusHeader}>
            {getStatusIcon(overallStatus)}
            <Text style={styles.overallStatusTitle}>
              {overallStatus === 'success' ? '✅ 2Kommute está listo' :
               overallStatus === 'warning' ? '⚠️ 2Kommute funcional con advertencias' :
               '❌ 2Kommute tiene errores'}
            </Text>
          </View>
          <Text style={styles.overallStatusSubtitle}>
            {isEnabled ? 'Estado: HABILITADO' : 'Estado: DESHABILITADO'}
          </Text>
        </View>

        {/* Controles */}
        <View style={styles.controls}>
          <TouchableOpacity
            style={[styles.controlButton, styles.primaryButton]}
            onPress={() => runValidation(false)}
            disabled={isValidating}
          >
            <RefreshCw size={16} color="white" />
            <Text style={styles.controlButtonText}>
              {isValidating ? 'Validando...' : 'Revalidar'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.controlButton, styles.errorRecoveryButton]}
            onPress={() => runValidation(true)}
            disabled={isValidating}
          >
            <Shield size={16} color="white" />
            <Text style={styles.controlButtonText}>
              Test Recuperación
            </Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.controls}>
          {!isEnabled ? (
            <TouchableOpacity
              style={[styles.controlButton, styles.successButton]}
              onPress={handleEnableKommute}
            >
              <Play size={16} color="white" />
              <Text style={styles.controlButtonText}>Habilitar 2Kommute</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.controlButton, styles.warningButton]}
              onPress={handleDisableKommute}
            >
              <Settings size={16} color="white" />
              <Text style={styles.controlButtonText}>Deshabilitar 2Kommute</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Resultados de Validación */}
        <View style={styles.results}>
          <Text style={styles.sectionTitle}>Resultados de Validación</Text>
          
          {validationResults.map((result, index) => (
            <View key={`${result.name}-${index}`} style={[styles.resultItem, { backgroundColor: getStatusColor(result.status) }]}>
              <View style={styles.resultHeader}>
                <View style={styles.resultTitleRow}>
                  {getStatusIcon(result.status, result)}
                  <Text style={styles.resultName}>{result.name}</Text>
                  {result.errorRecoveryApplied && (
                    <View style={styles.recoveryBadge}>
                      <Shield size={12} color={Colors.success[500]} />
                      <Text style={styles.recoveryText}>Recuperado</Text>
                    </View>
                  )}
                  {result.inputTruncated && (
                    <View style={styles.truncatedBadge}>
                      <Text style={styles.truncatedText}>Truncado</Text>
                    </View>
                  )}
                </View>
                {result.timestamp && (
                  <Text style={styles.resultTimestamp}>
                    {result.timestamp.toLocaleTimeString()}
                    {result.retryCount && ` (${result.retryCount} reintentos)`}
                  </Text>
                )}
              </View>
              <Text style={styles.resultMessage}>{result.message}</Text>
              {result.details && (
                <Text style={styles.resultDetails}>{result.details}</Text>
              )}
            </View>
          ))}
        </View>

        {/* Información del Sistema */}
        <View style={styles.systemInfo}>
          <Text style={styles.sectionTitle}>Información del Sistema</Text>
          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Rutas Locales:</Text>
              <Text style={styles.infoValue}>{routes.length}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Viajes Locales:</Text>
              <Text style={styles.infoValue}>{trips.length}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Modos de Transporte:</Text>
              <Text style={styles.infoValue}>{transportModes.length}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Ubicación:</Text>
              <Text style={styles.infoValue}>{currentLocation ? 'Disponible' : 'No disponible'}</Text>
            </View>
          </View>
        </View>
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
  overallStatus: {
    margin: Spacing[4],
    padding: Spacing[4],
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.neutral[200],
  },
  overallStatusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
    marginBottom: Spacing[2],
  },
  overallStatusTitle: {
    ...Typography.textStyles.h6,
    color: Colors.neutral[800],
    flex: 1,
  },
  overallStatusSubtitle: {
    ...Typography.textStyles.body,
    color: Colors.neutral[600],
  },
  controls: {
    flexDirection: 'row',
    gap: Spacing[3],
    paddingHorizontal: Spacing[4],
    marginBottom: Spacing[4],
  },
  controlButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing[2],
    paddingVertical: Spacing[3],
    borderRadius: BorderRadius.md,
  },
  primaryButton: {
    backgroundColor: Colors.primary[500],
  },
  successButton: {
    backgroundColor: Colors.success[500],
  },
  warningButton: {
    backgroundColor: Colors.warning[500],
  },
  errorRecoveryButton: {
    backgroundColor: Colors.success[600],
  },
  controlButtonText: {
    ...Typography.textStyles.button,
    color: 'white',
  },
  results: {
    paddingHorizontal: Spacing[4],
    marginBottom: Spacing[4],
  },
  sectionTitle: {
    ...Typography.textStyles.h6,
    color: Colors.neutral[800],
    marginBottom: Spacing[3],
  },
  resultItem: {
    padding: Spacing[3],
    borderRadius: BorderRadius.md,
    marginBottom: Spacing[2],
    borderWidth: 1,
    borderColor: Colors.neutral[200],
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: Spacing[1],
  },
  resultTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
    flex: 1,
    flexWrap: 'wrap',
  },
  resultTimestamp: {
    ...Typography.textStyles.caption,
    color: Colors.neutral[500],
  },
  recoveryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.success[50],
    paddingHorizontal: Spacing[1],
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    gap: 2,
  },
  recoveryText: {
    color: Colors.success[600],
    fontSize: 10,
    fontWeight: Typography.fontWeight.medium,
  },
  truncatedBadge: {
    backgroundColor: Colors.warning[50],
    paddingHorizontal: Spacing[1],
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  truncatedText: {
    color: Colors.warning[600],
    fontSize: 10,
    fontWeight: Typography.fontWeight.medium,
  },
  resultName: {
    ...Typography.textStyles.body,
    color: Colors.neutral[800],
    fontWeight: Typography.fontWeight.medium,
  },
  resultMessage: {
    ...Typography.textStyles.body,
    color: Colors.neutral[700],
    marginBottom: Spacing[1],
  },
  resultDetails: {
    ...Typography.textStyles.caption,
    color: Colors.neutral[500],
  },
  systemInfo: {
    paddingHorizontal: Spacing[4],
    marginBottom: Spacing[4],
  },
  infoGrid: {
    gap: Spacing[2],
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing[2],
    paddingHorizontal: Spacing[3],
    backgroundColor: 'white',
    borderRadius: BorderRadius.sm,
  },
  infoLabel: {
    ...Typography.textStyles.body,
    color: Colors.neutral[600],
  },
  infoValue: {
    ...Typography.textStyles.body,
    color: Colors.neutral[800],
    fontWeight: Typography.fontWeight.medium,
  },
});