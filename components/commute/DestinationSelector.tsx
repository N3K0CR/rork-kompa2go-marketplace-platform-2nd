// ============================================================================
// DESTINATION SELECTOR COMPONENT
// ============================================================================
// UI component for selecting destination in driver mode

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, ScrollView } from 'react-native';
import { MapPin, Target, Navigation, Clock, TrendingUp, X } from 'lucide-react-native';
import { trpc } from '@/lib/trpc';

interface Location {
  latitude: number;
  longitude: number;
  address: string;
  name?: string;
}

interface DestinationSelectorProps {
  currentLocation?: Location;
  onDestinationSet?: (destination: Location, settings?: any) => void;
  onClose?: () => void;
}

export const DestinationSelector: React.FC<DestinationSelectorProps> = ({
  currentLocation,
  onDestinationSet,
  onClose,
}) => {
  const [destination, setDestination] = useState<Location | null>(null);
  const [destinationAddress, setDestinationAddress] = useState<string>('');
  const [maxDetourDistance, setMaxDetourDistance] = useState<number>(5000);
  const [maxDetourTime, setMaxDetourTime] = useState<number>(900);
  const [priority, setPriority] = useState<number>(5);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Queries
  const activeDestinationQuery = trpc.commute.getActiveDestinationMode.useQuery();
  const destinationStatsQuery = trpc.commute.getDestinationModeStats.useQuery();

  // Mutations
  const setDestinationModeMutation = trpc.commute.setDestinationMode.useMutation();
  const deactivateDestinationModeMutation = trpc.commute.deactivateDestinationMode.useMutation();

  useEffect(() => {
    if (activeDestinationQuery.data) {
      const activeMode = activeDestinationQuery.data;
      setDestination(activeMode.destination);
      setDestinationAddress(activeMode.destination.address);
      setMaxDetourDistance(activeMode.maxDetourDistance);
      setMaxDetourTime(activeMode.maxDetourTime);
      setPriority(activeMode.priority);
    }
  }, [activeDestinationQuery.data]);

  const handleSetDestination = async () => {
    if (!destination) {
      Alert.alert('Error', 'Por favor selecciona un destino');
      return;
    }

    setIsLoading(true);
    try {
      await setDestinationModeMutation.mutateAsync({
        destination,
        maxDetourDistance,
        maxDetourTime,
        priority,
      });

      Alert.alert('¡Éxito!', 'Modo destino activado');
      onDestinationSet?.(destination, {
        maxDetourDistance,
        maxDetourTime,
        priority,
      });
      
      // Refresh data
      activeDestinationQuery.refetch();
      destinationStatsQuery.refetch();
    } catch (error) {
      console.error('Error setting destination mode:', error);
      Alert.alert('Error', 'No se pudo activar el modo destino');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeactivateDestination = async () => {
    if (!activeDestinationQuery.data) return;

    try {
      await deactivateDestinationModeMutation.mutateAsync({
        destinationModeId: activeDestinationQuery.data.id,
      });

      Alert.alert('Desactivado', 'Modo destino desactivado');
      setDestination(null);
      setDestinationAddress('');
      
      // Refresh data
      activeDestinationQuery.refetch();
      destinationStatsQuery.refetch();
    } catch (error) {
      console.error('Error deactivating destination mode:', error);
      Alert.alert('Error', 'No se pudo desactivar el modo destino');
    }
  };

  const handleAddressSearch = () => {
    // Mock geocoding - in production, use a real geocoding service
    if (destinationAddress.trim()) {
      const mockLocation: Location = {
        latitude: (currentLocation?.latitude || 0) + (Math.random() - 0.5) * 0.1,
        longitude: (currentLocation?.longitude || 0) + (Math.random() - 0.5) * 0.1,
        address: destinationAddress,
        name: destinationAddress,
      };
      setDestination(mockLocation);
    }
  };

  const formatDistance = (meters: number): string => {
    return meters >= 1000 ? `${(meters / 1000).toFixed(1)} km` : `${meters} m`;
  };

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    return minutes >= 60 ? `${Math.floor(minutes / 60)}h ${minutes % 60}m` : `${minutes}m`;
  };

  return (
    <ScrollView style={styles.container} testID="destination-selector">
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Target size={24} color="#2196F3" />
          <Text style={styles.title}>Modo Destino</Text>
        </View>
        {onClose && (
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={20} color="#666" />
          </TouchableOpacity>
        )}
      </View>

      {/* Current Status */}
      {activeDestinationQuery.data && (
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <View style={styles.statusIndicator}>
              <Navigation size={16} color="#4CAF50" />
              <Text style={styles.statusText}>Activo</Text>
            </View>
            <TouchableOpacity
              onPress={handleDeactivateDestination}
              style={styles.deactivateButton}
              testID="deactivate-destination"
            >
              <Text style={styles.deactivateText}>Desactivar</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.destinationInfo}>
            <MapPin size={16} color="#2196F3" />
            <Text style={styles.destinationText} numberOfLines={2}>
              {activeDestinationQuery.data.destination.address}
            </Text>
          </View>
          
          <View style={styles.progressInfo}>
            <Text style={styles.progressLabel}>Progreso hacia destino:</Text>
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
      )}

      {/* Statistics */}
      {destinationStatsQuery.data && (
        <View style={styles.statsCard}>
          <Text style={styles.sectionTitle}>Estadísticas</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <TrendingUp size={16} color="#4CAF50" />
              <Text style={styles.statValue}>{destinationStatsQuery.data.totalDestinationModes}</Text>
              <Text style={styles.statLabel}>Destinos Usados</Text>
            </View>
            <View style={styles.statItem}>
              <Target size={16} color="#FF9800" />
              <Text style={styles.statValue}>{destinationStatsQuery.data.averageProgress.toFixed(1)}%</Text>
              <Text style={styles.statLabel}>Progreso Promedio</Text>
            </View>
            <View style={styles.statItem}>
              <Navigation size={16} color="#2196F3" />
              <Text style={styles.statValue}>{destinationStatsQuery.data.tripsTowardsDestination}</Text>
              <Text style={styles.statLabel}>Viajes al Destino</Text>
            </View>
          </View>
        </View>
      )}

      {/* Destination Input */}
      <View style={styles.inputCard}>
        <Text style={styles.sectionTitle}>Establecer Destino</Text>
        
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Dirección de destino</Text>
          <View style={styles.addressInputContainer}>
            <TextInput
              style={styles.addressInput}
              value={destinationAddress}
              onChangeText={setDestinationAddress}
              placeholder="Ingresa la dirección de destino"
              placeholderTextColor="#999"
              testID="destination-address-input"
            />
            <TouchableOpacity
              onPress={handleAddressSearch}
              style={styles.searchButton}
              testID="search-address"
            >
              <MapPin size={16} color="#2196F3" />
            </TouchableOpacity>
          </View>
        </View>

        {destination && (
          <View style={styles.selectedDestination}>
            <MapPin size={16} color="#4CAF50" />
            <Text style={styles.selectedDestinationText}>
              {destination.address}
            </Text>
          </View>
        )}

        {/* Configuration */}
        <View style={styles.configSection}>
          <Text style={styles.configTitle}>Configuración</Text>
          
          <View style={styles.configItem}>
            <Text style={styles.configLabel}>Máximo desvío permitido</Text>
            <View style={styles.sliderContainer}>
              <Text style={styles.sliderValue}>{formatDistance(maxDetourDistance)}</Text>
              <View style={styles.sliderButtons}>
                <TouchableOpacity
                  onPress={() => setMaxDetourDistance(Math.max(1000, maxDetourDistance - 1000))}
                  style={styles.sliderButton}
                >
                  <Text style={styles.sliderButtonText}>-</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setMaxDetourDistance(Math.min(20000, maxDetourDistance + 1000))}
                  style={styles.sliderButton}
                >
                  <Text style={styles.sliderButtonText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <View style={styles.configItem}>
            <Text style={styles.configLabel}>Tiempo máximo de desvío</Text>
            <View style={styles.sliderContainer}>
              <Text style={styles.sliderValue}>{formatTime(maxDetourTime)}</Text>
              <View style={styles.sliderButtons}>
                <TouchableOpacity
                  onPress={() => setMaxDetourTime(Math.max(300, maxDetourTime - 300))}
                  style={styles.sliderButton}
                >
                  <Text style={styles.sliderButtonText}>-</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setMaxDetourTime(Math.min(3600, maxDetourTime + 300))}
                  style={styles.sliderButton}
                >
                  <Text style={styles.sliderButtonText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <View style={styles.configItem}>
            <Text style={styles.configLabel}>Prioridad (1-10)</Text>
            <View style={styles.sliderContainer}>
              <Text style={styles.sliderValue}>{priority}</Text>
              <View style={styles.sliderButtons}>
                <TouchableOpacity
                  onPress={() => setPriority(Math.max(1, priority - 1))}
                  style={styles.sliderButton}
                >
                  <Text style={styles.sliderButtonText}>-</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setPriority(Math.min(10, priority + 1))}
                  style={styles.sliderButton}
                >
                  <Text style={styles.sliderButtonText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>

        {/* Action Button */}
        <TouchableOpacity
          style={[
            styles.actionButton,
            (!destination || isLoading) && styles.actionButtonDisabled
          ]}
          onPress={handleSetDestination}
          disabled={!destination || isLoading}
          testID="set-destination-button"
        >
          <Target size={20} color="#fff" />
          <Text style={styles.actionButtonText}>
            {isLoading ? 'Configurando...' : 'Activar Modo Destino'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Help Text */}
      <View style={styles.helpCard}>
        <Text style={styles.helpTitle}>¿Cómo funciona?</Text>
        <Text style={styles.helpText}>
          El modo destino prioriza viajes que te acerquen a tu destino final. 
          El algoritmo considera la distancia de desvío y el progreso hacia tu objetivo 
          para sugerir los mejores viajes disponibles.
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
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
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 12,
  },
  closeButton: {
    padding: 8,
  },
  statusCard: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4CAF50',
    marginLeft: 6,
  },
  deactivateButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#FFF3E0',
    borderRadius: 6,
  },
  deactivateText: {
    fontSize: 12,
    color: '#FF9800',
    fontWeight: '500',
  },
  destinationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  destinationText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 8,
    flex: 1,
  },
  progressInfo: {
    marginTop: 8,
  },
  progressLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 6,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#e0e0e0',
    borderRadius: 3,
    marginBottom: 4,
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
    textAlign: 'right',
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
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
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 4,
  },
  statLabel: {
    fontSize: 10,
    color: '#666',
    textAlign: 'center',
    marginTop: 2,
  },
  inputCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  addressInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
  },
  addressInput: {
    flex: 1,
    padding: 12,
    fontSize: 14,
    color: '#333',
  },
  searchButton: {
    padding: 12,
    borderLeftWidth: 1,
    borderLeftColor: '#e0e0e0',
  },
  selectedDestination: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E8',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  selectedDestinationText: {
    fontSize: 14,
    color: '#2E7D32',
    marginLeft: 8,
    flex: 1,
  },
  configSection: {
    marginBottom: 16,
  },
  configTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 12,
  },
  configItem: {
    marginBottom: 12,
  },
  configLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 6,
  },
  sliderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sliderValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  sliderButtons: {
    flexDirection: 'row',
  },
  sliderButton: {
    width: 32,
    height: 32,
    backgroundColor: '#f0f0f0',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  sliderButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2196F3',
    padding: 16,
    borderRadius: 8,
    marginTop: 8,
  },
  actionButtonDisabled: {
    backgroundColor: '#ccc',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 8,
  },
  helpCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 32,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  helpTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  helpText: {
    fontSize: 12,
    color: '#666',
    lineHeight: 18,
  },
});

export default DestinationSelector;