import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Platform } from 'react-native';
import { MapPin, Navigation, Users, Clock, AlertTriangle, CheckCircle, TrendingUp } from 'lucide-react-native';
import { Colors, Spacing, BorderRadius, Shadows, Typography } from '@/context-package/design-system';
import { Zone, ZoneSaturationStatus, DriverZoneAssignment } from '@/backend/trpc/routes/commute/types';

type ZoneMapViewProps = {
  zones: Zone[];
  selectedZone?: Zone | null;
  onZoneSelect?: (zone: Zone) => void;
  onLocationPress?: (location: { latitude: number; longitude: number }) => void;
  userLocation?: { latitude: number; longitude: number } | null;
  saturationStatuses: ZoneSaturationStatus[];
  driverAssignments: DriverZoneAssignment[];
  isLoading?: boolean;
  showUserLocation?: boolean;
  currentDriverId?: string;
};

export default function ZoneMapView({
  zones,
  selectedZone,
  onZoneSelect,
  onLocationPress,
  userLocation,
  saturationStatuses,
  driverAssignments,
  isLoading = false,
  showUserLocation = true,
  currentDriverId
}: ZoneMapViewProps) {
  const [selectedPoint, setSelectedPoint] = useState<{ latitude: number; longitude: number } | null>(null);
  const { width, height } = Dimensions.get('window');

  // Log user location changes
  useEffect(() => {
    if (userLocation && showUserLocation) {
      console.log('🗺️ ZoneMapView: User location updated:', userLocation);
    }
  }, [userLocation, showUserLocation]);

  const getSaturationStatus = (zoneId: string) => {
    return saturationStatuses.find(status => status.zoneId === zoneId);
  };

  const getDriverAssignment = (zoneId: string) => {
    return driverAssignments.find(assignment => 
      assignment.zoneId === zoneId && assignment.driverId === currentDriverId
    );
  };

  const getZoneColor = (zone: Zone) => {
    if (zone.id === selectedZone?.id) return Colors.primary[500];
    
    const saturation = getSaturationStatus(zone.id);
    if (!saturation) return Colors.neutral[400];
    
    switch (saturation.status) {
      case 'low':
        return Colors.success[500];
      case 'optimal':
        return Colors.primary[500];
      case 'high':
        return Colors.warning[500];
      case 'saturated':
        return Colors.error[500];
      default:
        return Colors.neutral[400];
    }
  };

  const getZoneStatusIcon = (zone: Zone) => {
    const saturation = getSaturationStatus(zone.id);
    if (!saturation) return '❓';
    
    switch (saturation.status) {
      case 'low':
        return '🟢';
      case 'optimal':
        return '🔵';
      case 'high':
        return '🟡';
      case 'saturated':
        return '🔴';
      default:
        return '⚪';
    }
  };

  const getZoneStatusText = (zone: Zone) => {
    const saturation = getSaturationStatus(zone.id);
    if (!saturation) return 'Desconocido';
    
    switch (saturation.status) {
      case 'low':
        return 'Baja demanda';
      case 'optimal':
        return 'Óptima';
      case 'high':
        return 'Alta demanda';
      case 'saturated':
        return 'Saturada';
      default:
        return 'Desconocido';
    }
  };

  const handleMapPress = (event: any) => {
    if (Platform.OS === 'web') {
      const { coordinate } = event.nativeEvent || {};
      if (coordinate && onLocationPress) {
        onLocationPress(coordinate);
      }
    } else {
      const { coordinate } = event.nativeEvent;
      if (coordinate && onLocationPress) {
        onLocationPress(coordinate);
      }
    }
  };

  const handleZonePress = (zone: Zone) => {
    if (!zone?.id?.trim()) return;
    console.log('🗺️ ZoneMapView: Zone selected:', zone.id);
    onZoneSelect?.(zone);
  };

  const renderZonePoint = (zone: Zone, index: number) => {
    if (!zone?.id?.trim()) return null;
    const isSelected = selectedZone?.id === zone.id;
    const zoneColor = getZoneColor(zone);
    const assignment = getDriverAssignment(zone.id);
    const isAssigned = assignment?.status === 'active';
    
    return (
      <TouchableOpacity
        key={zone.id}
        style={[
          styles.zonePoint,
          isSelected && styles.selectedZonePoint,
          isAssigned && styles.assignedZonePoint,
          {
            left: (zone.center.longitude + 84.0907) * width * 10,
            top: (9.9281 - zone.center.latitude) * height * 10,
            borderColor: zoneColor,
          }
        ]}
        onPress={() => handleZonePress(zone)}
        activeOpacity={0.7}
      >
        <View style={[styles.pointInner, { backgroundColor: zoneColor }]}>
          <Text style={styles.pointText}>
            {getZoneStatusIcon(zone)}
          </Text>
        </View>
        
        {isSelected && (
          <View style={styles.zoneTooltip}>
            <Text style={styles.tooltipTitle}>{zone.name}</Text>
            <Text style={styles.tooltipStatus}>
              {getZoneStatusText(zone)}
            </Text>
            {getSaturationStatus(zone.id) && (
              <Text style={styles.tooltipSaturation}>
                {getSaturationStatus(zone.id)!.currentDrivers}/{getSaturationStatus(zone.id)!.maxDrivers} conductores
              </Text>
            )}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderZone = (zone: Zone) => {
    const zoneColor = getZoneColor(zone);
    const isSelected = zone.id === selectedZone?.id;
    const saturation = getSaturationStatus(zone.id);
    const assignment = getDriverAssignment(zone.id);
    
    return (
      <View key={zone.id} style={styles.zoneContainer}>
        {/* Zone boundary - simplified representation */}
        <View 
          style={[
            styles.zoneBoundary,
            { borderColor: zoneColor },
            isSelected && styles.selectedZoneBoundary
          ]} 
        />
        
        {/* Zone center point */}
        {renderZonePoint(zone, 0)}
        
        {/* Zone info card */}
        <TouchableOpacity
          style={[
            styles.zoneCard,
            isSelected && styles.selectedZoneCard,
            { borderLeftColor: zoneColor }
          ]}
          onPress={() => handleZonePress(zone)}
          activeOpacity={0.8}
        >
          <View style={styles.zoneHeader}>
            <Text style={styles.zoneName}>{zone.name}</Text>
            <View style={styles.zoneStatus}>
              <Text style={styles.statusIcon}>{getZoneStatusIcon(zone)}</Text>
              <Text style={styles.statusText}>{getZoneStatusText(zone)}</Text>
            </View>
          </View>
          
          <View style={styles.zoneDetails}>
            {saturation && (
              <View style={styles.zoneDetailItem}>
                <Users size={14} color={Colors.neutral[600]} />
                <Text style={styles.zoneDetailText}>
                  {saturation.currentDrivers}/{saturation.maxDrivers}
                </Text>
              </View>
            )}
            
            <View style={styles.zoneDetailItem}>
              <TrendingUp size={14} color={Colors.neutral[600]} />
              <Text style={styles.zoneDetailText}>
                {saturation?.saturationLevel || 0}% saturación
              </Text>
            </View>
            
            {assignment && (
              <View style={[
                styles.assignmentBadge,
                assignment.status === 'active' && styles.assignmentActive,
                assignment.status === 'pending' && styles.assignmentPending,
                assignment.status === 'inactive' && styles.assignmentInactive
              ]}>
                <Text style={styles.assignmentText}>
                  {assignment.status === 'active' ? 'Asignado' :
                   assignment.status === 'pending' ? 'Pendiente' : 'Inactivo'}
                </Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Map Container - Simplified for demo */}
      <View style={styles.mapContainer}>
        <TouchableOpacity
          style={styles.mapPlaceholder}
          onPress={handleMapPress}
          activeOpacity={0.9}
        >
          <View style={styles.mapBackground}>
            <Text style={styles.mapTitle}>Mapa de Zonas</Text>
            <Text style={styles.mapSubtitle}>Gestión de saturación por zonas</Text>
            
            {/* User location indicator */}
            {userLocation && showUserLocation && (
              <View style={styles.userLocationIndicator}>
                <Navigation size={20} color={Colors.primary[500]} />
                <Text style={styles.userLocationText}>Tu ubicación</Text>
              </View>
            )}
            
            {/* Loading overlay */}
            {isLoading && (
              <View style={styles.loadingOverlay}>
                <Text style={styles.loadingText}>Cargando zonas...</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
        
        {/* Zones overlay */}
        <View style={styles.zonesOverlay}>
          {zones.map(renderZone)}
        </View>
      </View>
      
      {/* Map controls */}
      <View style={styles.mapControls}>
        <TouchableOpacity 
          style={styles.controlButton}
          onPress={() => {
            if (userLocation) {
              console.log('🗺️ ZoneMapView: Centering on user location');
            }
          }}
        >
          <Navigation size={20} color={Colors.primary[500]} />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.controlButton}
          onPress={() => {
            console.log('🗺️ ZoneMapView: Toggle zone view');
          }}
        >
          <MapPin size={20} color={Colors.primary[500]} />
        </TouchableOpacity>
      </View>
      
      {/* Zone legend */}
      <View style={styles.zoneLegend}>
        <Text style={styles.legendTitle}>Estado de Zonas</Text>
        <View style={styles.legendItems}>
          <View style={styles.legendItem}>
            <Text style={styles.legendIcon}>🟢</Text>
            <Text style={styles.legendText}>Baja demanda</Text>
          </View>
          <View style={styles.legendItem}>
            <Text style={styles.legendIcon}>🔵</Text>
            <Text style={styles.legendText}>Óptima</Text>
          </View>
          <View style={styles.legendItem}>
            <Text style={styles.legendIcon}>🟡</Text>
            <Text style={styles.legendText}>Alta demanda</Text>
          </View>
          <View style={styles.legendItem}>
            <Text style={styles.legendIcon}>🔴</Text>
            <Text style={styles.legendText}>Saturada</Text>
          </View>
        </View>
      </View>
      
      {/* Selected zone info */}
      {selectedZone && (
        <View style={styles.selectedZoneInfo}>
          <View style={styles.selectedZoneHeader}>
            <Text style={styles.selectedZoneName}>{selectedZone.name}</Text>
            <TouchableOpacity
              onPress={() => onZoneSelect?.(null as any)}
              style={styles.closeSelectedZone}
            >
              <Text style={styles.closeSelectedZoneText}>✕</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.selectedZoneDetails}>
            <Text style={styles.selectedZoneDescription}>
              {selectedZone.description || 'Zona de transporte compartido'}
            </Text>
            
            <View style={styles.selectedZoneStats}>
              <View style={styles.statItem}>
                <Users size={16} color={Colors.primary[500]} />
                <Text style={styles.statText}>
                  {getSaturationStatus(selectedZone.id)?.currentDrivers || 0} conductores
                </Text>
              </View>
              
              <View style={styles.statItem}>
                <TrendingUp size={16} color={Colors.primary[500]} />
                <Text style={styles.statText}>
                  {getSaturationStatus(selectedZone.id)?.saturationLevel || 0}% saturación
                </Text>
              </View>
              
              {selectedZone.incentives && (
                <View style={styles.statItem}>
                  <Text style={styles.bonusText}>
                    {selectedZone.incentives.bonusMultiplier}x bonus
                  </Text>
                </View>
              )}
            </View>
            
            {getSaturationStatus(selectedZone.id)?.recommendations && (
              <View style={styles.recommendations}>
                <Text style={styles.recommendationsTitle}>Recomendaciones:</Text>
                {getSaturationStatus(selectedZone.id)!.recommendations.map((rec, index) => (
                  <Text key={index} style={styles.recommendationText}>
                    • {rec.message}
                  </Text>
                ))}
              </View>
            )}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.neutral[50],
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  mapPlaceholder: {
    flex: 1,
    backgroundColor: Colors.neutral[100],
    borderRadius: BorderRadius.lg,
    margin: Spacing[4],
    overflow: 'hidden',
    ...Shadows.base,
  },
  mapBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: `linear-gradient(135deg, ${Colors.primary[50]} 0%, ${Colors.secondary[50]} 100%)`,
    padding: Spacing[6],
  },
  mapTitle: {
    ...Typography.textStyles.h3,
    color: Colors.neutral[700],
    marginBottom: Spacing[2],
    textAlign: 'center',
  },
  mapSubtitle: {
    ...Typography.textStyles.body,
    color: Colors.neutral[500],
    textAlign: 'center',
  },
  userLocationIndicator: {
    position: 'absolute',
    top: Spacing[4],
    right: Spacing[4],
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[2],
    borderRadius: BorderRadius.full,
    gap: Spacing[2],
    ...Shadows.sm,
  },
  userLocationText: {
    ...Typography.textStyles.caption,
    color: Colors.primary[500],
    fontWeight: Typography.fontWeight.medium,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...Typography.textStyles.body,
    color: Colors.primary[500],
    fontWeight: Typography.fontWeight.medium,
  },
  zonesOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'box-none',
  },
  zoneContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  zoneBoundary: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderStyle: 'dashed',
    opacity: 0.6,
  },
  selectedZoneBoundary: {
    borderWidth: 3,
    opacity: 1,
  },
  zonePoint: {
    position: 'absolute',
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    ...Shadows.sm,
  },
  selectedZonePoint: {
    transform: [{ scale: 1.2 }],
    ...Shadows.md,
  },
  assignedZonePoint: {
    borderWidth: 3,
    borderColor: Colors.success[500],
  },
  pointInner: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pointText: {
    fontSize: 14,
  },
  zoneTooltip: {
    position: 'absolute',
    top: -70,
    left: -60,
    backgroundColor: 'white',
    padding: Spacing[3],
    borderRadius: BorderRadius.md,
    minWidth: 120,
    ...Shadows.lg,
  },
  tooltipTitle: {
    ...Typography.textStyles.caption,
    color: Colors.neutral[800],
    fontWeight: Typography.fontWeight.bold,
    marginBottom: Spacing[1],
  },
  tooltipStatus: {
    ...Typography.textStyles.caption,
    color: Colors.neutral[600],
    fontSize: 10,
  },
  tooltipSaturation: {
    ...Typography.textStyles.caption,
    color: Colors.primary[600],
    fontSize: 10,
    fontWeight: Typography.fontWeight.medium,
  },
  zoneCard: {
    position: 'absolute',
    bottom: Spacing[4],
    left: Spacing[4],
    right: Spacing[4],
    backgroundColor: 'white',
    borderRadius: BorderRadius.lg,
    padding: Spacing[4],
    borderLeftWidth: 4,
    ...Shadows.base,
  },
  selectedZoneCard: {
    ...Shadows.lg,
    borderLeftWidth: 6,
  },
  zoneHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing[2],
  },
  zoneName: {
    ...Typography.textStyles.h6,
    color: Colors.neutral[800],
    flex: 1,
  },
  zoneStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[1],
  },
  statusIcon: {
    fontSize: 16,
  },
  statusText: {
    ...Typography.textStyles.caption,
    color: Colors.neutral[600],
    fontWeight: Typography.fontWeight.medium,
  },
  zoneDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[4],
  },
  zoneDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[1],
  },
  zoneDetailText: {
    ...Typography.textStyles.caption,
    color: Colors.neutral[600],
    fontWeight: Typography.fontWeight.medium,
  },
  assignmentBadge: {
    paddingHorizontal: Spacing[2],
    paddingVertical: Spacing[1],
    borderRadius: BorderRadius.sm,
    marginLeft: 'auto',
  },
  assignmentActive: {
    backgroundColor: Colors.success[100],
  },
  assignmentPending: {
    backgroundColor: Colors.warning[100],
  },
  assignmentInactive: {
    backgroundColor: Colors.neutral[100],
  },
  assignmentText: {
    ...Typography.textStyles.caption,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.neutral[700],
    fontSize: 10,
  },
  mapControls: {
    position: 'absolute',
    top: Spacing[16],
    right: Spacing[4],
    gap: Spacing[2],
  },
  controlButton: {
    width: 44,
    height: 44,
    backgroundColor: 'white',
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.base,
  },
  zoneLegend: {
    position: 'absolute',
    top: Spacing[16],
    left: Spacing[4],
    backgroundColor: 'white',
    borderRadius: BorderRadius.lg,
    padding: Spacing[3],
    ...Shadows.base,
  },
  legendTitle: {
    ...Typography.textStyles.caption,
    color: Colors.neutral[700],
    fontWeight: Typography.fontWeight.bold,
    marginBottom: Spacing[2],
  },
  legendItems: {
    gap: Spacing[1],
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
  },
  legendIcon: {
    fontSize: 12,
  },
  legendText: {
    ...Typography.textStyles.caption,
    color: Colors.neutral[600],
    fontSize: 10,
  },
  selectedZoneInfo: {
    backgroundColor: 'white',
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing[4],
    ...Shadows.lg,
  },
  selectedZoneHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing[3],
  },
  selectedZoneName: {
    ...Typography.textStyles.h5,
    color: Colors.neutral[800],
    flex: 1,
  },
  closeSelectedZone: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.neutral[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeSelectedZoneText: {
    ...Typography.textStyles.body,
    color: Colors.neutral[600],
    fontWeight: Typography.fontWeight.bold,
  },
  selectedZoneDetails: {
    gap: Spacing[3],
  },
  selectedZoneDescription: {
    ...Typography.textStyles.body,
    color: Colors.neutral[600],
    lineHeight: Typography.lineHeight.relaxed,
  },
  selectedZoneStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[4],
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[1],
  },
  statText: {
    ...Typography.textStyles.bodySmall,
    color: Colors.neutral[700],
    fontWeight: Typography.fontWeight.medium,
  },
  bonusText: {
    ...Typography.textStyles.body,
    color: Colors.warning[600],
    fontWeight: Typography.fontWeight.bold,
  },
  recommendations: {
    marginTop: Spacing[2],
    padding: Spacing[3],
    backgroundColor: Colors.primary[50],
    borderRadius: BorderRadius.md,
  },
  recommendationsTitle: {
    ...Typography.textStyles.caption,
    color: Colors.primary[700],
    fontWeight: Typography.fontWeight.bold,
    marginBottom: Spacing[2],
  },
  recommendationText: {
    ...Typography.textStyles.caption,
    color: Colors.primary[600],
    lineHeight: Typography.lineHeight.relaxed,
    marginBottom: Spacing[1],
  },
});