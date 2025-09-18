import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CheckCircle, XCircle, AlertCircle, Play, Settings, RefreshCw } from 'lucide-react-native';
import { useCommute } from '@/src/modules/commute/context/CommuteContext';
import { useKommuteAdmin } from '@/contexts/CommuteContext';
import { Colors, Spacing, BorderRadius, Typography } from '@/context-package/design-system';

interface ValidationResult {
  name: string;
  status: 'success' | 'error' | 'warning' | 'pending';
  message: string;
  details?: string;
}

export default function KommuteValidation() {
  const [validationResults, setValidationResults] = useState<ValidationResult[]>([]);
  const [isValidating, setIsValidating] = useState(false);
  const [overallStatus, setOverallStatus] = useState<'success' | 'error' | 'warning' | 'pending'>('pending');
  const insets = useSafeAreaInsets();
  
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

  const runValidation = useCallback(async () => {
    setIsValidating(true);
    const results: ValidationResult[] = [];

    try {
      // 1. Validar contexto base
      results.push({
        name: 'Contexto Base',
        status: isInitialized ? 'success' : 'error',
        message: isInitialized ? 'Contexto inicializado correctamente' : 'Error en inicialización del contexto',
        details: `Estado: ${isInitialized ? 'Inicializado' : 'No inicializado'}`
      });

      // 2. Validar feature flags
      results.push({
        name: 'Feature Flags',
        status: featureFlags ? 'success' : 'error',
        message: featureFlags ? 'Feature flags cargados' : 'Error cargando feature flags',
        details: `KOMMUTE_ENABLED: ${featureFlags?.KOMMUTE_ENABLED || false}`
      });

      // 3. Validar permisos de ubicación
      results.push({
        name: 'Permisos de Ubicación',
        status: hasLocationPermission ? 'success' : 'warning',
        message: hasLocationPermission ? 'Permisos concedidos' : 'Permisos no concedidos',
        details: `Ubicación actual: ${currentLocation ? 'Disponible' : 'No disponible'}`
      });

      // 4. Validar modos de transporte
      results.push({
        name: 'Modos de Transporte',
        status: transportModes.length > 0 ? 'success' : 'error',
        message: `${transportModes.length} modos disponibles`,
        details: transportModes.map(m => m.name).join(', ')
      });

      // 5. Validar datos locales
      results.push({
        name: 'Datos Locales',
        status: 'success',
        message: `${routes.length} rutas, ${trips.length} viajes`,
        details: `Rutas: ${routes.length}, Viajes: ${trips.length}`
      });

      // 6. Validar backend (simplificado)
      results.push({
        name: 'Backend tRPC',
        status: 'warning',
        message: 'Backend disponible (no validado en tiempo real)',
        details: 'La validación completa requiere conexión activa'
      });

    } catch (error) {
      results.push({
        name: 'Validación General',
        status: 'error',
        message: 'Error durante la validación',
        details: error instanceof Error ? error.message : 'Error desconocido'
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
  }, [isInitialized, featureFlags, hasLocationPermission, currentLocation, transportModes, routes, trips]);

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
    runValidation();
  }, [runValidation]);

  const getStatusIcon = (status: ValidationResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle size={20} color={Colors.success[500]} />;
      case 'error':
        return <XCircle size={20} color={Colors.error[500]} />;
      case 'warning':
        return <AlertCircle size={20} color={Colors.warning[500]} />;
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
            onPress={runValidation}
            disabled={isValidating}
          >
            <RefreshCw size={16} color="white" />
            <Text style={styles.controlButtonText}>
              {isValidating ? 'Validando...' : 'Revalidar'}
            </Text>
          </TouchableOpacity>
          
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
                {getStatusIcon(result.status)}
                <Text style={styles.resultName}>{result.name}</Text>
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
    alignItems: 'center',
    gap: Spacing[2],
    marginBottom: Spacing[1],
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