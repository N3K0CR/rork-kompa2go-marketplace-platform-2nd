// ============================================================================
// DESTINATION MODE DEMO SCREEN
// ============================================================================
// Demo screen to showcase destination mode functionality

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Target, MapPin, Settings, RefreshCw, Trash2 } from 'lucide-react-native';
import { trpc } from '@/lib/trpc';
import DestinationSelector from '@/components/commute/DestinationSelector';
import DestinationTrips from '@/components/commute/DestinationTrips';

interface Location {
  latitude: number;
  longitude: number;
  address: string;
  name?: string;
}

export default function DestinationModeDemo() {
  const [currentLocation, setCurrentLocation] = useState<Location>({
    latitude: 19.4326,
    longitude: -99.1332,
    address: 'Ciudad de México, CDMX',
    name: 'CDMX Centro',
  });
  const [showSelector, setShowSelector] = useState<boolean>(false);
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);

  // Queries
  const activeDestinationQuery = trpc.commute.getActiveDestinationMode.useQuery();
  const destinationStatsQuery = trpc.commute.getDestinationModeStats.useQuery();

  // Mutations
  const addMockTripsMutation = trpc.commute.addMockTripsForDestination.useMutation();
  const clearMockDataMutation = trpc.commute.clearDestinationMockData.useMutation();

  useEffect(() => {
    // Simulate location updates
    const interval = setInterval(() => {
      setCurrentLocation(prev => ({
        ...prev,
        latitude: prev.latitude + (Math.random() - 0.5) * 0.001,
        longitude: prev.longitude + (Math.random() - 0.5) * 0.001,
      }));
    }, 10000); // Update every 10 seconds

    return () => clearInterval(interval);
  }, []);

  const handleAddMockTrips = async () => {
    try {
      const result = await addMockTripsMutation.mutateAsync({
        count: 15,
        centerLocation: currentLocation,
        radiusKm: 20,
      });

      Alert.alert(
        '¡Éxito!', 
        `Se agregaron ${result.tripsAdded} viajes de prueba`
      );
    } catch (error) {
      console.error('Error adding mock trips:', error);
      Alert.alert('Error', 'No se pudieron agregar los viajes de prueba');
    }
  };

  const handleClearMockData = async () => {
    try {
      await clearMockDataMutation.mutateAsync();
      Alert.alert('Limpiado', 'Se eliminaron todos los datos de prueba');
    } catch (error) {
      console.error('Error clearing mock data:', error);
      Alert.alert('Error', 'No se pudieron limpiar los datos');
    }
  };

  const handleDestinationSet = (destination: Location) => {
    console.log('Destination set:', destination);
    setShowSelector(false);
    activeDestinationQuery.refetch();
  };

  const handleTripSelect = (tripId: string) => {
    setSelectedTripId(tripId);
    Alert.alert(
      'Viaje Seleccionado',
      `¿Deseas aceptar el viaje #${tripId.slice(-6)}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Aceptar', 
          onPress: () => {
            Alert.alert('¡Viaje Aceptado!', 'El viaje ha sido aceptado exitosamente');
            setSelectedTripId(null);
          }
        },
      ]
    );
  };

  if (showSelector) {
    return (
      <SafeAreaView style={styles.container}>
        <DestinationSelector
          currentLocation={currentLocation}
          onDestinationSet={handleDestinationSet}
          onClose={() => setShowSelector(false)}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollContainer}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Target size={28} color="#2196F3" />
            <View style={styles.headerText}>
              <Text style={styles.title}>Modo Destino</Text>
              <Text style={styles.subtitle}>Demo de funcionalidad</Text>
            </View>
          </View>
          
          <TouchableOpacity
            onPress={() => setShowSelector(true)}
            style={styles.settingsButton}
            testID="open-destination-selector"
          >
            <Settings size={20} color="#666" />
          </TouchableOpacity>
        </View>

        {/* Current Location */}
        <View style={styles.locationCard}>
          <View style={styles.locationHeader}>
            <MapPin size={16} color="#4CAF50" />
            <Text style={styles.locationTitle}>Ubicación Actual</Text>
          </View>
          <Text style={styles.locationText}>{currentLocation.address}</Text>
          <Text style={styles.coordinatesText}>
            {currentLocation.latitude.toFixed(4)}, {currentLocation.longitude.toFixed(4)}
          </Text>
        </View>

        {/* Active Destination Status */}
        {activeDestinationQuery.data ? (
          <View style={styles.statusCard}>
            <View style={styles.statusHeader}>
              <Target size={20} color="#4CAF50" />
              <Text style={styles.statusTitle}>Destino Activo</Text>
            </View>
            
            <View style={styles.destinationInfo}>
              <Text style={styles.destinationAddress}>
                {activeDestinationQuery.data.destination.address}
              </Text>
              <View style={styles.progressContainer}>
                <Text style={styles.progressLabel}>Progreso:</Text>
                <View style={styles.progressBar}>
                  <View 
                    style={[
                      styles.progressFill, 
                      { width: `${activeDestinationQuery.data.progressToDestination}%` }
                    ]} 
                  />
                </View>
                <Text style={styles.progressText}>
                  {activeDestinationQuery.data.progressToDestination.toFixed(1)}%
                </Text>
              </View>
            </View>

            <View style={styles.configInfo}>
              <Text style={styles.configText}>
                Desvío máx: {(activeDestinationQuery.data.maxDetourDistance / 1000).toFixed(1)} km
              </Text>
              <Text style={styles.configText}>
                Tiempo máx: {Math.floor(activeDestinationQuery.data.maxDetourTime / 60)} min
              </Text>
              <Text style={styles.configText}>
                Prioridad: {activeDestinationQuery.data.priority}/10
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.inactiveCard}>
            <Target size={48} color="#ccc" />
            <Text style={styles.inactiveTitle}>Modo Destino Inactivo</Text>
            <Text style={styles.inactiveText}>
              Configura un destino para comenzar a recibir viajes optimizados
            </Text>
            <TouchableOpacity
              onPress={() => setShowSelector(true)}
              style={styles.activateButton}
              testID="activate-destination-mode"
            >
              <Text style={styles.activateButtonText}>Configurar Destino</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Statistics */}
        {destinationStatsQuery.data && (
          <View style={styles.statsCard}>
            <Text style={styles.statsTitle}>Estadísticas</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {destinationStatsQuery.data.totalDestinationModes}
                </Text>
                <Text style={styles.statLabel}>Destinos Configurados</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {destinationStatsQuery.data.averageProgress.toFixed(1)}%
                </Text>
                <Text style={styles.statLabel}>Progreso Promedio</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {destinationStatsQuery.data.tripsTowardsDestination}
                </Text>
                <Text style={styles.statLabel}>Viajes al Destino</Text>
              </View>
            </View>
          </View>
        )}

        {/* Available Trips */}
        <View style={styles.tripsSection}>
          <DestinationTrips
            currentLocation={currentLocation}
            destinationModeId={activeDestinationQuery.data?.id}
            onTripSelect={handleTripSelect}
          />
        </View>

        {/* Demo Controls */}
        <View style={styles.demoControls}>
          <Text style={styles.demoTitle}>Controles de Demo</Text>
          
          <TouchableOpacity
            onPress={handleAddMockTrips}
            style={styles.demoButton}
            disabled={addMockTripsMutation.isPending}
            testID="add-mock-trips"
          >
            <RefreshCw size={16} color="#2196F3" />
            <Text style={styles.demoButtonText}>
              {addMockTripsMutation.isPending ? 'Agregando...' : 'Agregar Viajes de Prueba'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleClearMockData}
            style={[styles.demoButton, styles.clearButton]}
            disabled={clearMockDataMutation.isPending}
            testID="clear-mock-data"
          >
            <Trash2 size={16} color="#F44336" />
            <Text style={[styles.demoButtonText, styles.clearButtonText]}>
              {clearMockDataMutation.isPending ? 'Limpiando...' : 'Limpiar Datos de Prueba'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContainer: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerText: {
    marginLeft: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  settingsButton: {
    padding: 8,
  },
  locationCard: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginLeft: 6,
  },
  locationText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 4,
  },
  coordinatesText: {
    fontSize: 12,
    color: '#666',
  },
  statusCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 8,
  },
  destinationInfo: {
    marginBottom: 12,
  },
  destinationAddress: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressLabel: {
    fontSize: 12,
    color: '#666',
    marginRight: 8,
    minWidth: 60,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: '#e0e0e0',
    borderRadius: 3,
    marginRight: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '500',
    minWidth: 40,
  },
  configInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  configText: {
    fontSize: 12,
    color: '#666',
  },
  inactiveCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 32,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    alignItems: 'center',
  },
  inactiveTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  inactiveText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  activateButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  activateButtonText: {
    color: '#fff',
    fontWeight: '500',
    fontSize: 14,
  },
  statsCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  statLabel: {
    fontSize: 10,
    color: '#666',
    textAlign: 'center',
    marginTop: 4,
  },
  tripsSection: {
    flex: 1,
    minHeight: 400,
  },
  demoControls: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  demoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  demoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E3F2FD',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  demoButtonText: {
    fontSize: 14,
    color: '#2196F3',
    fontWeight: '500',
    marginLeft: 8,
  },
  clearButton: {
    backgroundColor: '#FFEBEE',
  },
  clearButtonText: {
    color: '#F44336',
  },
});