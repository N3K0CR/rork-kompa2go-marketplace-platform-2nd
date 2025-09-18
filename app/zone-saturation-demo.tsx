// ============================================================================
// ZONE SATURATION DEMO SCREEN
// ============================================================================
// Pantalla de demostración del sistema de zona con saturación

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  SafeAreaView,
} from 'react-native';
import { Stack } from 'expo-router';
import { MapPin, Users, Settings, RefreshCw } from 'lucide-react-native';
import { ZoneSelector } from '@/components/commute/ZoneSelector';
import { ZoneSaturationStatus } from '@/components/commute/ZoneSaturationStatus';
import type { Zone, ZoneSaturationStatus as ZoneSaturationStatusType } from '@/backend/trpc/routes/commute/types';

// ============================================================================
// TYPES
// ============================================================================

interface DriverLocation {
  latitude: number;
  longitude: number;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function ZoneSaturationDemo() {
  const [selectedZone, setSelectedZone] = useState<Zone | null>(null);
  const [driverLocation, setDriverLocation] = useState<DriverLocation>({
    latitude: -12.0464,
    longitude: -77.0428,
  });
  const [currentDriverId] = useState<string>('driver-demo-123');
  const [joinedZones, setJoinedZones] = useState<Set<string>>(new Set());
  const [refreshKey, setRefreshKey] = useState<number>(0);

  // Mock saturation status for selected zone
  const [mockSaturationStatus, setMockSaturationStatus] = useState<ZoneSaturationStatusType | undefined>();

  const mockSaturationData: Record<string, ZoneSaturationStatusType> = {
    'zone-centro': {
      zoneId: 'zone-centro',
      currentDrivers: 35,
      maxDrivers: 50,
      saturationLevel: 70,
      status: 'high',
      waitingList: 2,
      estimatedWaitTime: 10,
      recommendations: [
        {
          type: 'move_to_zone',
          message: 'Zona con alta demanda. ¡Únete ahora!',
        },
      ],
      lastUpdated: new Date(),
    },
    'zone-miraflores': {
      zoneId: 'zone-miraflores',
      currentDrivers: 28,
      maxDrivers: 30,
      saturationLevel: 93,
      status: 'saturated',
      waitingList: 8,
      estimatedWaitTime: 40,
      recommendations: [
        {
          type: 'wait',
          message: 'Zona saturada. 8 conductores en lista de espera.',
        },
        {
          type: 'alternative_zone',
          message: 'Considera San Isidro (48% ocupado)',
          alternativeZoneId: 'zone-san-isidro',
        },
      ],
      lastUpdated: new Date(),
    },
    'zone-san-isidro': {
      zoneId: 'zone-san-isidro',
      currentDrivers: 12,
      maxDrivers: 25,
      saturationLevel: 48,
      status: 'optimal',
      waitingList: 0,
      recommendations: [
        {
          type: 'move_to_zone',
          message: 'Zona con disponibilidad óptima.',
        },
      ],
      lastUpdated: new Date(),
    },
  };

  const handleZoneSelect = (zone: Zone) => {
    console.log('🎯 Zone selected:', zone.name);
    setSelectedZone(zone);
    setMockSaturationStatus(mockSaturationData[zone.id]);
  };

  const handleJoinZone = async (zoneId: string) => {
    try {
      console.log('🚗 Joining zone:', zoneId);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setJoinedZones(prev => new Set([...prev, zoneId]));
      
      Alert.alert(
        'Éxito',
        'Te has unido a la zona exitosamente',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error joining zone:', error);
      Alert.alert('Error', 'No se pudo unir a la zona');
    }
  };

  const handleRefreshSaturation = async () => {
    console.log('🔄 Refreshing saturation data');
    
    // Simulate data refresh
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (selectedZone) {
      const updatedStatus = {
        ...mockSaturationData[selectedZone.id],
        lastUpdated: new Date(),
        // Simulate slight changes in data
        currentDrivers: mockSaturationData[selectedZone.id].currentDrivers + Math.floor(Math.random() * 3) - 1,
      };
      
      setMockSaturationStatus(updatedStatus);
    }
    
    setRefreshKey(prev => prev + 1);
  };

  const handleLocationChange = () => {
    const locations = [
      { latitude: -12.0464, longitude: -77.0428, name: 'Centro' },
      { latitude: -12.1164, longitude: -77.0364, name: 'Miraflores' },
      { latitude: -12.0964, longitude: -77.0464, name: 'San Isidro' },
    ];
    
    const currentIndex = locations.findIndex(
      loc => loc.latitude === driverLocation.latitude && loc.longitude === driverLocation.longitude
    );
    
    const nextIndex = (currentIndex + 1) % locations.length;
    const nextLocation = locations[nextIndex];
    
    setDriverLocation({
      latitude: nextLocation.latitude,
      longitude: nextLocation.longitude,
    });
    
    Alert.alert(
      'Ubicación Actualizada',
      `Ahora estás en ${nextLocation.name}`,
      [{ text: 'OK' }]
    );
  };

  const getCurrentLocationName = (): string => {
    if (driverLocation.latitude === -12.0464) return 'Centro';
    if (driverLocation.latitude === -12.1164) return 'Miraflores';
    if (driverLocation.latitude === -12.0964) return 'San Isidro';
    return 'Ubicación Desconocida';
  };

  useEffect(() => {
    console.log('🚀 Zone Saturation Demo initialized');
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Sistema de Zona con Saturación',
          headerStyle: { backgroundColor: '#007AFF' },
          headerTintColor: '#FFFFFF',
          headerTitleStyle: { fontWeight: '600' },
        }}
      />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header Info */}
        <View style={styles.headerCard}>
          <View style={styles.headerContent}>
            <MapPin size={24} color="#007AFF" />
            <View style={styles.headerText}>
              <Text style={styles.headerTitle}>Ubicación Actual</Text>
              <Text style={styles.headerSubtitle}>{getCurrentLocationName()}</Text>
            </View>
            <TouchableOpacity
              style={styles.locationButton}
              onPress={handleLocationChange}
              testID="change-location"
            >
              <RefreshCw size={20} color="#007AFF" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.driverInfo}>
            <Users size={16} color="#757575" />
            <Text style={styles.driverText}>Conductor: {currentDriverId}</Text>
          </View>
        </View>

        {/* Zone Selector */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Selector de Zona</Text>
            <Text style={styles.sectionSubtitle}>
              Selecciona una zona para ver su estado de saturación
            </Text>
          </View>
          
          <ZoneSelector
            currentLocation={driverLocation}
            onZoneSelect={handleZoneSelect}
            onJoinZone={handleJoinZone}
            selectedZoneId={selectedZone?.id}
            driverId={currentDriverId}
          />
        </View>

        {/* Zone Saturation Status */}
        {selectedZone && (
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Estado de Saturación</Text>
              <Text style={styles.sectionSubtitle}>
                Información detallada de la zona seleccionada
              </Text>
            </View>
            
            <ZoneSaturationStatus
              zone={selectedZone}
              saturationStatus={mockSaturationStatus}
              onRefresh={handleRefreshSaturation}
              showRecommendations={true}
              compact={false}
            />
          </View>
        )}

        {/* Compact View Example */}
        {selectedZone && (
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Vista Compacta</Text>
              <Text style={styles.sectionSubtitle}>
                Versión compacta para listas o dashboards
              </Text>
            </View>
            
            <ZoneSaturationStatus
              zone={selectedZone}
              saturationStatus={mockSaturationStatus}
              showRecommendations={false}
              compact={true}
            />
          </View>
        )}

        {/* Demo Controls */}
        <View style={styles.controlsCard}>
          <Text style={styles.controlsTitle}>Controles de Demo</Text>
          
          <TouchableOpacity
            style={styles.controlButton}
            onPress={handleLocationChange}
            testID="demo-change-location"
          >
            <MapPin size={20} color="#FFFFFF" />
            <Text style={styles.controlButtonText}>Cambiar Ubicación</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.controlButton, styles.controlButtonSecondary]}
            onPress={handleRefreshSaturation}
            testID="demo-refresh-data"
          >
            <RefreshCw size={20} color="#007AFF" />
            <Text style={[styles.controlButtonText, styles.controlButtonTextSecondary]}>
              Actualizar Datos
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.controlButton, styles.controlButtonSecondary]}
            onPress={() => {
              setSelectedZone(null);
              setMockSaturationStatus(undefined);
              setJoinedZones(new Set());
            }}
            testID="demo-reset"
          >
            <Settings size={20} color="#007AFF" />
            <Text style={[styles.controlButtonText, styles.controlButtonTextSecondary]}>
              Reiniciar Demo
            </Text>
          </TouchableOpacity>
        </View>

        {/* Status Info */}
        <View style={styles.statusCard}>
          <Text style={styles.statusTitle}>Estado del Sistema</Text>
          <View style={styles.statusItem}>
            <Text style={styles.statusLabel}>Zonas Unidas:</Text>
            <Text style={styles.statusValue}>{joinedZones.size}</Text>
          </View>
          <View style={styles.statusItem}>
            <Text style={styles.statusLabel}>Zona Seleccionada:</Text>
            <Text style={styles.statusValue}>{selectedZone?.name || 'Ninguna'}</Text>
          </View>
          <View style={styles.statusItem}>
            <Text style={styles.statusLabel}>Última Actualización:</Text>
            <Text style={styles.statusValue}>
              {mockSaturationStatus?.lastUpdated?.toLocaleTimeString() || 'N/A'}
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollView: {
    flex: 1,
  },
  headerCard: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    marginBottom: 8,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerText: {
    flex: 1,
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#757575',
    marginTop: 2,
  },
  locationButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F0F0F0',
  },
  driverInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  driverText: {
    fontSize: 14,
    color: '#757575',
    marginLeft: 8,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    marginVertical: 8,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionHeader: {
    padding: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#757575',
    lineHeight: 20,
  },
  controlsCard: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    marginVertical: 8,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  controlsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 16,
  },
  controlButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  controlButtonSecondary: {
    backgroundColor: '#F0F0F0',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  controlButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  controlButtonTextSecondary: {
    color: '#007AFF',
  },
  statusCard: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    marginVertical: 8,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 16,
  },
  statusItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  statusLabel: {
    fontSize: 14,
    color: '#757575',
  },
  statusValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#212121',
  },
});