// ============================================================================
// ZONE SELECTOR COMPONENT
// ============================================================================
// Componente para seleccionar zona geográfica con información de saturación

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { MapPin, Users, TrendingUp, Clock, Star, AlertTriangle } from 'lucide-react-native';
import type { Zone, ZoneSaturationStatus } from '@/backend/trpc/routes/commute/types';

// ============================================================================
// TYPES
// ============================================================================

interface ZoneSelectorProps {
  currentLocation: {
    latitude: number;
    longitude: number;
  };
  onZoneSelect: (zone: Zone) => void;
  onJoinZone?: (zoneId: string) => void;
  selectedZoneId?: string;
  driverId?: string;
}

interface ZoneCardProps {
  zone: Zone;
  saturationStatus?: ZoneSaturationStatus;
  distance?: number;
  isSelected: boolean;
  onSelect: () => void;
  onJoin?: () => void;
  canJoin: boolean;
}

// ============================================================================
// ZONE CARD COMPONENT
// ============================================================================

const ZoneCard: React.FC<ZoneCardProps> = ({
  zone,
  saturationStatus,
  distance,
  isSelected,
  onSelect,
  onJoin,
  canJoin,
}) => {
  const getSaturationColor = (level: number): string => {
    if (level < 30) return '#4CAF50'; // Green - Low
    if (level < 70) return '#FF9800'; // Orange - Optimal
    if (level < 90) return '#F44336'; // Red - High
    return '#9C27B0'; // Purple - Saturated
  };

  const getSaturationText = (status?: string): string => {
    switch (status) {
      case 'low': return 'Baja demanda';
      case 'optimal': return 'Demanda óptima';
      case 'high': return 'Alta demanda';
      case 'saturated': return 'Saturada';
      default: return 'Desconocida';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <TrendingUp size={16} color="#4CAF50" />;
      case 'high_demand': return <AlertTriangle size={16} color="#FF9800" />;
      case 'saturated': return <Users size={16} color="#F44336" />;
      default: return <MapPin size={16} color="#757575" />;
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.zoneCard,
        isSelected && styles.selectedZoneCard,
      ]}
      onPress={onSelect}
      testID={`zone-card-${zone.id}`}
    >
      <View style={styles.zoneHeader}>
        <View style={styles.zoneTitle}>
          {getStatusIcon(zone.status)}
          <Text style={styles.zoneName}>{zone.name}</Text>
          {zone.priority >= 8 && (
            <Star size={14} color="#FFD700" fill="#FFD700" />
          )}
        </View>
        {distance !== undefined && (
          <Text style={styles.distance}>{(distance / 1000).toFixed(1)} km</Text>
        )}
      </View>

      {zone.description && (
        <Text style={styles.zoneDescription}>{zone.description}</Text>
      )}

      <View style={styles.zoneStats}>
        <View style={styles.statItem}>
          <Users size={16} color="#757575" />
          <Text style={styles.statText}>
            {zone.currentDrivers}/{zone.maxDrivers}
          </Text>
        </View>

        <View style={styles.statItem}>
          <View
            style={[
              styles.saturationIndicator,
              { backgroundColor: getSaturationColor(zone.saturationLevel) },
            ]}
          />
          <Text style={styles.statText}>
            {zone.saturationLevel}% - {getSaturationText(saturationStatus?.status)}
          </Text>
        </View>

        {saturationStatus?.waitingList && saturationStatus.waitingList > 0 && (
          <View style={styles.statItem}>
            <Clock size={16} color="#FF9800" />
            <Text style={styles.statText}>
              {saturationStatus.waitingList} en espera
            </Text>
          </View>
        )}
      </View>

      {zone.incentives && (
        <View style={styles.incentives}>
          <Text style={styles.incentiveText}>
            Bonus: {zone.incentives.bonusMultiplier}x
          </Text>
          {zone.incentives.timeBasedBonus && (
            <Text style={styles.incentiveText}>⏰ Bonus por tiempo</Text>
          )}
        </View>
      )}

      {saturationStatus?.recommendations && saturationStatus.recommendations.length > 0 && (
        <View style={styles.recommendations}>
          {saturationStatus.recommendations.slice(0, 2).map((rec, index) => (
            <Text key={index} style={styles.recommendationText}>
              • {rec.message}
            </Text>
          ))}
        </View>
      )}

      {canJoin && onJoin && (
        <TouchableOpacity
          style={[
            styles.joinButton,
            zone.status === 'saturated' && styles.joinButtonDisabled,
          ]}
          onPress={onJoin}
          disabled={zone.status === 'saturated'}
          testID={`join-zone-${zone.id}`}
        >
          <Text style={[
            styles.joinButtonText,
            zone.status === 'saturated' && styles.joinButtonTextDisabled,
          ]}>
            {zone.status === 'saturated' ? 'Zona Saturada' : 'Unirse a Zona'}
          </Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const ZoneSelector: React.FC<ZoneSelectorProps> = ({
  currentLocation,
  onZoneSelect,
  onJoinZone,
  selectedZoneId,
  driverId,
}) => {
  const [zones, setZones] = useState<Zone[]>([]);
  const [saturationData, setSaturationData] = useState<Map<string, ZoneSaturationStatus>>(new Map());
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Mock data - En producción esto vendría del backend
  const mockZones: Zone[] = [
    {
      id: 'zone-centro',
      name: 'Centro Histórico',
      description: 'Zona céntrica con alta demanda',
      coordinates: [
        { latitude: -12.0464, longitude: -77.0428 },
        { latitude: -12.0464, longitude: -77.0328 },
        { latitude: -12.0364, longitude: -77.0328 },
        { latitude: -12.0364, longitude: -77.0428 },
      ],
      center: { latitude: -12.0414, longitude: -77.0378 },
      maxDrivers: 50,
      currentDrivers: 35,
      saturationLevel: 70,
      status: 'active',
      priority: 8,
      incentives: {
        bonusMultiplier: 1.5,
        minimumTrips: 3,
        timeBasedBonus: true,
      },
      restrictions: {
        minRating: 4.0,
        minExperience: 30,
        vehicleTypes: ['sedan', 'suv'],
      },
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date(),
    },
    {
      id: 'zone-miraflores',
      name: 'Miraflores',
      description: 'Distrito turístico premium',
      coordinates: [
        { latitude: -12.1164, longitude: -77.0364 },
        { latitude: -12.1164, longitude: -77.0264 },
        { latitude: -12.1064, longitude: -77.0264 },
        { latitude: -12.1064, longitude: -77.0364 },
      ],
      center: { latitude: -12.1114, longitude: -77.0314 },
      maxDrivers: 30,
      currentDrivers: 28,
      saturationLevel: 93,
      status: 'saturated',
      priority: 9,
      incentives: {
        bonusMultiplier: 2.0,
        minimumTrips: 5,
        timeBasedBonus: true,
      },
      restrictions: {
        minRating: 4.5,
        minExperience: 60,
        vehicleTypes: ['sedan', 'suv', 'premium'],
      },
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date(),
    },
    {
      id: 'zone-san-isidro',
      name: 'San Isidro',
      description: 'Distrito financiero',
      coordinates: [
        { latitude: -12.0964, longitude: -77.0464 },
        { latitude: -12.0964, longitude: -77.0364 },
        { latitude: -12.0864, longitude: -77.0364 },
        { latitude: -12.0864, longitude: -77.0464 },
      ],
      center: { latitude: -12.0914, longitude: -77.0414 },
      maxDrivers: 25,
      currentDrivers: 12,
      saturationLevel: 48,
      status: 'high_demand',
      priority: 7,
      incentives: {
        bonusMultiplier: 1.8,
        minimumTrips: 2,
        timeBasedBonus: false,
      },
      restrictions: {
        minRating: 4.2,
        minExperience: 45,
      },
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date(),
    },
  ];

  const mockSaturationData: ZoneSaturationStatus[] = [
    {
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
    {
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
    {
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
  ];

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
  };

  const loadZones = async () => {
    try {
      setLoading(true);
      
      // Simular carga de datos
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Calcular distancias
      const zonesWithDistance = mockZones.map(zone => ({
        ...zone,
        distance: calculateDistance(
          currentLocation.latitude,
          currentLocation.longitude,
          zone.center.latitude,
          zone.center.longitude
        ),
      }));

      // Ordenar por distancia
      zonesWithDistance.sort((a, b) => a.distance - b.distance);

      setZones(zonesWithDistance);

      // Cargar datos de saturación
      const saturationMap = new Map<string, ZoneSaturationStatus>();
      mockSaturationData.forEach(data => {
        saturationMap.set(data.zoneId, data);
      });
      setSaturationData(saturationMap);

    } catch (error) {
      console.error('Error loading zones:', error);
      Alert.alert('Error', 'No se pudieron cargar las zonas');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleJoinZone = async (zoneId: string) => {
    if (!onJoinZone || !driverId) return;

    try {
      const zone = zones.find(z => z.id === zoneId);
      if (!zone) return;

      if (zone.status === 'saturated') {
        Alert.alert(
          'Zona Saturada',
          'Esta zona está saturada. Serás añadido a la lista de espera.',
          [
            { text: 'Cancelar', style: 'cancel' },
            { 
              text: 'Unirse a Lista de Espera', 
              onPress: () => onJoinZone(zoneId)
            },
          ]
        );
        return;
      }

      Alert.alert(
        'Unirse a Zona',
        `¿Deseas unirte a ${zone.name}?`,
        [
          { text: 'Cancelar', style: 'cancel' },
          { 
            text: 'Unirse', 
            onPress: () => onJoinZone(zoneId)
          },
        ]
      );
    } catch (error) {
      console.error('Error joining zone:', error);
      Alert.alert('Error', 'No se pudo unir a la zona');
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadZones();
  };

  useEffect(() => {
    loadZones();
  }, [currentLocation]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Cargando zonas...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Zonas Disponibles</Text>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={handleRefresh}
          disabled={refreshing}
          testID="refresh-zones"
        >
          {refreshing ? (
            <ActivityIndicator size="small" color="#007AFF" />
          ) : (
            <Text style={styles.refreshText}>Actualizar</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        testID="zones-list"
      >
        {zones.map((zone) => (
          <ZoneCard
            key={zone.id}
            zone={zone}
            saturationStatus={saturationData.get(zone.id)}
            distance={(zone as any).distance}
            isSelected={selectedZoneId === zone.id}
            onSelect={() => onZoneSelect(zone)}
            onJoin={onJoinZone ? () => handleJoinZone(zone.id) : undefined}
            canJoin={!!driverId && !!onJoinZone}
          />
        ))}
      </ScrollView>
    </View>
  );
};

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#757575',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#212121',
  },
  refreshButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#F0F0F0',
  },
  refreshText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  zoneCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  selectedZoneCard: {
    borderColor: '#007AFF',
    borderWidth: 2,
  },
  zoneHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  zoneTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  zoneName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212121',
    marginLeft: 8,
    marginRight: 8,
  },
  distance: {
    fontSize: 14,
    color: '#757575',
    fontWeight: '500',
  },
  zoneDescription: {
    fontSize: 14,
    color: '#757575',
    marginBottom: 12,
    lineHeight: 20,
  },
  zoneStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    marginBottom: 4,
  },
  statText: {
    fontSize: 14,
    color: '#424242',
    marginLeft: 4,
  },
  saturationIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 4,
  },
  incentives: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  incentiveText: {
    fontSize: 12,
    color: '#4CAF50',
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 4,
    fontWeight: '500',
  },
  recommendations: {
    marginBottom: 12,
  },
  recommendationText: {
    fontSize: 12,
    color: '#FF9800',
    lineHeight: 16,
    marginBottom: 2,
  },
  joinButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  joinButtonDisabled: {
    backgroundColor: '#E0E0E0',
  },
  joinButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  joinButtonTextDisabled: {
    color: '#9E9E9E',
  },
});

export default ZoneSelector;