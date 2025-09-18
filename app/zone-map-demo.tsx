import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Colors, Spacing, BorderRadius, Typography } from '@/context-package/design-system';
import { ZoneMapView } from '@/components/commute';
import { Zone, ZoneSaturationStatus, DriverZoneAssignment } from '@/backend/trpc/routes/commute/types';

// Mock data for demonstration
const mockZones: Zone[] = [
  {
    id: 'zone-1',
    name: 'Centro San José',
    description: 'Zona comercial y financiera del centro de la ciudad',
    coordinates: [
      { latitude: 9.9281, longitude: -84.0907 },
      { latitude: 9.9350, longitude: -84.0850 },
      { latitude: 9.9250, longitude: -84.0800 },
      { latitude: 9.9200, longitude: -84.0900 }
    ],
    center: { latitude: 9.9281, longitude: -84.0907 },
    maxDrivers: 50,
    currentDrivers: 35,
    saturationLevel: 70,
    status: 'high_demand',
    priority: 8,
    incentives: {
      bonusMultiplier: 1.5,
      minimumTrips: 3,
      timeBasedBonus: true
    },
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-15')
  },
  {
    id: 'zone-2',
    name: 'Escazú',
    description: 'Zona residencial y comercial de alta demanda',
    coordinates: [
      { latitude: 9.9180, longitude: -84.1400 },
      { latitude: 9.9250, longitude: -84.1350 },
      { latitude: 9.9150, longitude: -84.1300 },
      { latitude: 9.9100, longitude: -84.1380 }
    ],
    center: { latitude: 9.9180, longitude: -84.1400 },
    maxDrivers: 30,
    currentDrivers: 12,
    saturationLevel: 40,
    status: 'active',
    priority: 6,
    incentives: {
      bonusMultiplier: 1.2,
      minimumTrips: 2,
      timeBasedBonus: false
    },
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-15')
  },
  {
    id: 'zone-3',
    name: 'Aeropuerto Juan Santamaría',
    description: 'Zona del aeropuerto internacional',
    coordinates: [
      { latitude: 9.9937, longitude: -84.2088 },
      { latitude: 9.9980, longitude: -84.2000 },
      { latitude: 9.9900, longitude: -84.1950 },
      { latitude: 9.9850, longitude: -84.2050 }
    ],
    center: { latitude: 9.9937, longitude: -84.2088 },
    maxDrivers: 25,
    currentDrivers: 25,
    saturationLevel: 100,
    status: 'saturated',
    priority: 9,
    incentives: {
      bonusMultiplier: 2.0,
      minimumTrips: 1,
      timeBasedBonus: true
    },
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-15')
  },
  {
    id: 'zone-4',
    name: 'Cartago Centro',
    description: 'Centro histórico de Cartago',
    coordinates: [
      { latitude: 9.8644, longitude: -83.9194 },
      { latitude: 9.8700, longitude: -83.9150 },
      { latitude: 9.8600, longitude: -83.9100 },
      { latitude: 9.8550, longitude: -83.9180 }
    ],
    center: { latitude: 9.8644, longitude: -83.9194 },
    maxDrivers: 20,
    currentDrivers: 8,
    saturationLevel: 40,
    status: 'active',
    priority: 4,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-15')
  }
];

const mockSaturationStatuses: ZoneSaturationStatus[] = [
  {
    zoneId: 'zone-1',
    currentDrivers: 35,
    maxDrivers: 50,
    saturationLevel: 70,
    status: 'high',
    waitingList: 5,
    estimatedWaitTime: 8,
    recommendations: [
      {
        type: 'wait',
        message: 'Zona con alta demanda. Espera recomendada: 8 minutos'
      },
      {
        type: 'alternative_zone',
        message: 'Considera moverte a Escazú (menor saturación)',
        alternativeZoneId: 'zone-2'
      }
    ],
    lastUpdated: new Date()
  },
  {
    zoneId: 'zone-2',
    currentDrivers: 12,
    maxDrivers: 30,
    saturationLevel: 40,
    status: 'optimal',
    waitingList: 0,
    recommendations: [
      {
        type: 'move_to_zone',
        message: 'Zona óptima para trabajar. Buena disponibilidad'
      }
    ],
    lastUpdated: new Date()
  },
  {
    zoneId: 'zone-3',
    currentDrivers: 25,
    maxDrivers: 25,
    saturationLevel: 100,
    status: 'saturated',
    waitingList: 12,
    estimatedWaitTime: 25,
    recommendations: [
      {
        type: 'try_later',
        message: 'Zona saturada. Intenta más tarde o considera otra zona'
      },
      {
        type: 'alternative_zone',
        message: 'Zona alternativa: Centro San José',
        alternativeZoneId: 'zone-1'
      }
    ],
    lastUpdated: new Date()
  },
  {
    zoneId: 'zone-4',
    currentDrivers: 8,
    maxDrivers: 20,
    saturationLevel: 40,
    status: 'low',
    waitingList: 0,
    recommendations: [
      {
        type: 'move_to_zone',
        message: 'Zona con baja saturación. Oportunidad de trabajo'
      }
    ],
    lastUpdated: new Date()
  }
];

const mockDriverAssignments: DriverZoneAssignment[] = [
  {
    id: 'assignment-1',
    driverId: 'driver-123',
    zoneId: 'zone-2',
    status: 'active',
    assignedAt: new Date('2024-01-15T08:00:00'),
    lastActiveAt: new Date(),
    performanceMetrics: {
      tripsCompleted: 15,
      averageRating: 4.8,
      acceptanceRate: 92,
      cancellationRate: 3
    },
    earnings: {
      totalEarnings: 45000,
      bonusEarnings: 8000,
      tripsCount: 15
    }
  }
];

export default function ZoneMapViewDemo() {
  const [selectedZone, setSelectedZone] = useState<Zone | null>(null);
  const [userLocation] = useState({ latitude: 9.9281, longitude: -84.0907 });

  const handleZoneSelect = (zone: Zone | null) => {
    console.log('🎯 Zone selected:', zone?.name || 'None');
    setSelectedZone(zone);
  };

  const handleLocationPress = (location: { latitude: number; longitude: number }) => {
    console.log('📍 Location pressed:', location);
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>ZoneMapView Demo</Text>
          <Text style={styles.subtitle}>
            Componente de mapa para gestión de zonas con saturación
          </Text>
        </View>

        <View style={styles.mapSection}>
          <Text style={styles.sectionTitle}>Mapa Interactivo de Zonas</Text>
          <View style={styles.mapContainer}>
            <ZoneMapView
              zones={mockZones}
              selectedZone={selectedZone}
              onZoneSelect={handleZoneSelect}
              onLocationPress={handleLocationPress}
              userLocation={userLocation}
              saturationStatuses={mockSaturationStatuses}
              driverAssignments={mockDriverAssignments}
              currentDriverId="driver-123"
              isLoading={false}
              showUserLocation={true}
            />
          </View>
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>Características del Componente</Text>
          <View style={styles.featureList}>
            <Text style={styles.featureItem}>
              • Visualización de zonas geográficas con estados de saturación
            </Text>
            <Text style={styles.featureItem}>
              • Indicadores visuales por color según demanda (🟢🔵🟡🔴)
            </Text>
            <Text style={styles.featureItem}>
              • Información detallada de cada zona al seleccionar
            </Text>
            <Text style={styles.featureItem}>
              • Recomendaciones inteligentes basadas en saturación
            </Text>
            <Text style={styles.featureItem}>
              • Estado de asignación del conductor actual
            </Text>
            <Text style={styles.featureItem}>
              • Leyenda interactiva y controles de mapa
            </Text>
            <Text style={styles.featureItem}>
              • Tooltips informativos y métricas en tiempo real
            </Text>
          </View>
        </View>

        <View style={styles.statusSection}>
          <Text style={styles.sectionTitle}>Estados de Saturación</Text>
          <View style={styles.statusGrid}>
            <View style={[styles.statusCard, { borderLeftColor: Colors.success[500] }]}>
              <Text style={styles.statusIcon}>🟢</Text>
              <Text style={styles.statusName}>Baja Demanda</Text>
              <Text style={styles.statusDescription}>
                Pocos conductores, buenas oportunidades
              </Text>
            </View>
            
            <View style={[styles.statusCard, { borderLeftColor: Colors.primary[500] }]}>
              <Text style={styles.statusIcon}>🔵</Text>
              <Text style={styles.statusName}>Óptima</Text>
              <Text style={styles.statusDescription}>
                Balance ideal entre oferta y demanda
              </Text>
            </View>
            
            <View style={[styles.statusCard, { borderLeftColor: Colors.warning[500] }]}>
              <Text style={styles.statusIcon}>🟡</Text>
              <Text style={styles.statusName}>Alta Demanda</Text>
              <Text style={styles.statusDescription}>
                Muchos conductores, competencia alta
              </Text>
            </View>
            
            <View style={[styles.statusCard, { borderLeftColor: Colors.error[500] }]}>
              <Text style={styles.statusIcon}>🔴</Text>
              <Text style={styles.statusName}>Saturada</Text>
              <Text style={styles.statusDescription}>
                Zona llena, buscar alternativas
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.dataSection}>
          <Text style={styles.sectionTitle}>Datos de Prueba</Text>
          <Text style={styles.dataText}>
            • {mockZones.length} zonas configuradas
          </Text>
          <Text style={styles.dataText}>
            • {mockSaturationStatuses.length} estados de saturación
          </Text>
          <Text style={styles.dataText}>
            • {mockDriverAssignments.length} asignación de conductor activa
          </Text>
          <Text style={styles.dataText}>
            • Ubicación del usuario: San José Centro
          </Text>
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
  header: {
    padding: Spacing[6],
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[200],
  },
  title: {
    ...Typography.textStyles.h2,
    color: Colors.neutral[800],
    marginBottom: Spacing[2],
  },
  subtitle: {
    ...Typography.textStyles.body,
    color: Colors.neutral[600],
    lineHeight: Typography.lineHeight.relaxed,
  },
  mapSection: {
    padding: Spacing[4],
  },
  sectionTitle: {
    ...Typography.textStyles.h5,
    color: Colors.neutral[800],
    marginBottom: Spacing[4],
  },
  mapContainer: {
    height: 400,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  infoSection: {
    padding: Spacing[4],
    backgroundColor: 'white',
    marginHorizontal: Spacing[4],
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing[4],
  },
  featureList: {
    gap: Spacing[2],
  },
  featureItem: {
    ...Typography.textStyles.body,
    color: Colors.neutral[700],
    lineHeight: Typography.lineHeight.relaxed,
  },
  statusSection: {
    padding: Spacing[4],
  },
  statusGrid: {
    gap: Spacing[3],
  },
  statusCard: {
    backgroundColor: 'white',
    padding: Spacing[4],
    borderRadius: BorderRadius.lg,
    borderLeftWidth: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
  },
  statusIcon: {
    fontSize: 24,
  },
  statusName: {
    ...Typography.textStyles.h6,
    color: Colors.neutral[800],
    flex: 1,
  },
  statusDescription: {
    ...Typography.textStyles.bodySmall,
    color: Colors.neutral[600],
    flex: 2,
  },
  dataSection: {
    padding: Spacing[4],
    backgroundColor: Colors.primary[50],
    marginHorizontal: Spacing[4],
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing[6],
  },
  dataText: {
    ...Typography.textStyles.body,
    color: Colors.primary[700],
    marginBottom: Spacing[1],
  },
});