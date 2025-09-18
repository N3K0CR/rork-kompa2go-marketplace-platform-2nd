import React, { useState, useEffect, useCallback, memo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Platform } from 'react-native';
import { MapPin, Navigation, Users, Clock } from 'lucide-react-native';
import { Colors, Spacing, BorderRadius, Shadows, Typography } from '@/context-package/design-system';
import { Route, TransportMode, RoutePoint } from '@/backend/trpc/routes/commute/types';

type CommuteRoute = Route;

// Dimensions will be calculated inside component to support rotation

interface MapViewProps {
  routes: CommuteRoute[];
  selectedRoute?: CommuteRoute | null;
  onRouteSelect?: (route: CommuteRoute) => void;
  onLocationPress?: (location: { latitude: number; longitude: number }) => void;
  userLocation?: { latitude: number; longitude: number } | null;
  transportModes: TransportMode[];
  isLoading?: boolean;
  showUserLocation?: boolean;
}

const MapView = memo<MapViewProps>(function MapView({
  routes,
  selectedRoute,
  onRouteSelect,
  onLocationPress,
  userLocation,
  transportModes,
  isLoading = false,
  showUserLocation = true
}) {
  const [selectedPoint, setSelectedPoint] = useState<RoutePoint | null>(null);
  const { width, height } = Dimensions.get('window');

  // Log user location changes
  useEffect(() => {
    if (userLocation && showUserLocation) {
      console.log('🗺️ MapView: User location updated:', userLocation);
    }
  }, [userLocation, showUserLocation]);

  const getTransportModeIcon = useCallback((modeId: string) => {
    if (!modeId?.trim()) return '📍';
    const mode = transportModes.find(m => m.id === modeId);
    if (!mode) return '📍';
    
    // Since TransportMode doesn't have type, use icon or name
    const iconMap: { [key: string]: string } = {
      'walking': '🚶',
      'cycling': '🚴', 
      'driving': '🚗',
      'public_transport': '🚌',
      'rideshare': '🚕',
      'bus': '🚌',
      'car': '🚗',
      'bike': '🚴',
      'walk': '🚶'
    };
    
    const lowerName = mode.name.toLowerCase();
    return iconMap[lowerName] || mode.icon || '📍';
  }, [transportModes]);

  const getRouteColor = useCallback((route: CommuteRoute) => {
    if (route.id === selectedRoute?.id) return Colors.primary[500];
    switch (route.status) {
      case 'active':
        return Colors.success[500];
      case 'planned':
        return Colors.warning[500];
      case 'completed':
        return Colors.neutral[400];
      default:
        return Colors.primary[300];
    }
  }, [selectedRoute?.id]);

  const handleMapPress = useCallback((event: any) => {
    if (Platform.OS === 'web') {
      // Web implementation would use a different event structure
      const { coordinate } = event.nativeEvent || {};
      if (coordinate && onLocationPress) {
        onLocationPress(coordinate);
      }
    } else {
      // Mobile implementation
      const { coordinate } = event.nativeEvent;
      if (coordinate && onLocationPress) {
        onLocationPress(coordinate);
      }
    }
  }, [onLocationPress]);

  const handleRoutePress = useCallback((route: CommuteRoute) => {
    if (!route?.id?.trim()) return;
    console.log('🗺️ MapView: Route selected:', route.id);
    onRouteSelect?.(route);
  }, [onRouteSelect]);

  const renderRoutePoint = useCallback((point: RoutePoint, index: number, route: CommuteRoute) => {
    if (!point?.id?.trim()) return null;
    const isSelected = selectedPoint?.id === point.id;
    const isOrigin = point.type === 'origin';
    const isDestination = point.type === 'destination';
    
    return (
      <TouchableOpacity
        key={`${route.id}-${point.id}`}
        style={[
          styles.routePoint,
          isOrigin && styles.originPoint,
          isDestination && styles.destinationPoint,
          isSelected && styles.selectedPoint,
          {
            left: (point.longitude + 84.0907) * width * 10, // Simplified positioning
            top: (9.9281 - point.latitude) * height * 10,
          }
        ]}
        onPress={() => setSelectedPoint(point)}
        activeOpacity={0.7}
      >
        <View style={styles.pointInner}>
          <Text style={styles.pointText}>
            {isOrigin ? '🏠' : isDestination ? '🎯' : '📍'}
          </Text>
        </View>
        
        {isSelected && (
          <View style={styles.pointTooltip}>
            <Text style={styles.tooltipText}>{point.name || point.address}</Text>
            {point.estimatedArrival && (
              <Text style={styles.tooltipTime}>
                ETA: {new Date(point.estimatedArrival).toLocaleTimeString('es-ES', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </Text>
            )}
          </View>
        )}
      </TouchableOpacity>
    );
  }, [selectedPoint?.id, setSelectedPoint, width, height]);

  const renderRoute = useCallback((route: CommuteRoute) => {
    const routeColor = getRouteColor(route);
    const isSelected = route.id === selectedRoute?.id;
    
    return (
      <View key={route.id} style={styles.routeContainer}>
        {/* Route line - simplified representation */}
        <View 
          style={[
            styles.routeLine,
            { backgroundColor: routeColor },
            isSelected && styles.selectedRouteLine
          ]} 
        />
        
        {/* Route points */}
        {route.points?.map((point: RoutePoint, index: number) => renderRoutePoint(point, index, route))}
        
        {/* Route info card */}
        <TouchableOpacity
          style={[
            styles.routeCard,
            isSelected && styles.selectedRouteCard,
            { borderLeftColor: routeColor }
          ]}
          onPress={() => handleRoutePress(route)}
          activeOpacity={0.8}
        >
          <View style={styles.routeHeader}>
            <Text style={styles.routeName}>{route.name}</Text>
            <View style={styles.transportModes}>
              {route.transportModes?.slice(0, 3).map((mode: TransportMode, index: number) => (
                <Text key={mode.id} style={styles.transportIcon}>
                  {getTransportModeIcon(mode.id)}
                </Text>
              ))}
            </View>
          </View>
          
          <View style={styles.routeDetails}>
            <View style={styles.routeDetailItem}>
              <Clock size={14} color={Colors.neutral[600]} />
              <Text style={styles.routeDetailText}>
                {route.duration} min
              </Text>
            </View>
            
            <View style={styles.routeDetailItem}>
              <Users size={14} color={Colors.neutral[600]} />
              <Text style={styles.routeDetailText}>
                Compartida
              </Text>
            </View>
            
            <View style={[
              styles.statusBadge,
              route.status === 'active' && styles.statusActive,
              route.status === 'planned' && styles.statusPlanned,
              route.status === 'completed' && styles.statusCompleted
            ]}>
              <Text style={styles.statusText}>
                {route.status === 'active' ? 'Activa' :
                 route.status === 'planned' ? 'Planificada' : 'Completada'}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      </View>
    );
  }, [selectedRoute?.id, getRouteColor, renderRoutePoint, handleRoutePress, getTransportModeIcon]);

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
            <Text style={styles.mapTitle}>Mapa Interactivo</Text>
            <Text style={styles.mapSubtitle}>Toca para agregar ubicación</Text>
            
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
                <Text style={styles.loadingText}>Cargando rutas...</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
        
        {/* Routes overlay */}
        <View style={styles.routesOverlay}>
          {routes.map((route) => (
            <React.Fragment key={route.id}>
              {renderRoute(route)}
            </React.Fragment>
          ))}
        </View>
      </View>
      
      {/* Map controls */}
      <View style={styles.mapControls}>
        <TouchableOpacity 
          style={styles.controlButton}
          onPress={() => {
            if (userLocation) {
              console.log('🗺️ MapView: Centering on user location');
            }
          }}
        >
          <Navigation size={20} color={Colors.primary[500]} />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.controlButton}
          onPress={() => {
            console.log('🗺️ MapView: Toggle map view');
          }}
        >
          <MapPin size={20} color={Colors.primary[500]} />
        </TouchableOpacity>
      </View>
      
      {/* Selected route info */}
      {selectedRoute && (
        <View style={styles.selectedRouteInfo}>
          <View style={styles.selectedRouteHeader}>
            <Text style={styles.selectedRouteName}>{selectedRoute.name}</Text>
            <TouchableOpacity
              onPress={() => onRouteSelect?.(null as any)}
              style={styles.closeSelectedRoute}
            >
              <Text style={styles.closeSelectedRouteText}>✕</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.selectedRouteDetails}>
            <Text style={styles.selectedRouteDescription}>
              Ruta de transporte compartido
            </Text>
            
            <View style={styles.selectedRouteStats}>
              <View style={styles.statItem}>
                <Clock size={16} color={Colors.primary[500]} />
                <Text style={styles.statText}>{selectedRoute.duration} min</Text>
              </View>
              
              {selectedRoute.estimatedCost && (
                <View style={styles.statItem}>
                  <Text style={styles.costText}>₡{selectedRoute.estimatedCost}</Text>
                </View>
              )}
            </View>
          </View>
        </View>
      )}
    </View>
  );
});

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
  routesOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'box-none',
  },
  routeContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  routeLine: {
    position: 'absolute',
    width: 3,
    height: 100,
    borderRadius: 2,
    opacity: 0.7,
  },
  selectedRouteLine: {
    width: 4,
    opacity: 1,
  },
  routePoint: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.sm,
  },
  originPoint: {
    backgroundColor: Colors.success[500],
  },
  destinationPoint: {
    backgroundColor: Colors.error[500],
  },
  selectedPoint: {
    transform: [{ scale: 1.2 }],
    ...Shadows.md,
  },
  pointInner: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pointText: {
    fontSize: 12,
  },
  pointTooltip: {
    position: 'absolute',
    top: -50,
    left: -40,
    backgroundColor: 'white',
    padding: Spacing[2],
    borderRadius: BorderRadius.sm,
    minWidth: 80,
    ...Shadows.md,
  },
  tooltipText: {
    ...Typography.textStyles.caption,
    color: Colors.neutral[700],
    fontWeight: Typography.fontWeight.medium,
  },
  tooltipTime: {
    ...Typography.textStyles.caption,
    color: Colors.neutral[500],
    fontSize: 10,
  },
  routeCard: {
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
  selectedRouteCard: {
    ...Shadows.lg,
    borderLeftWidth: 6,
  },
  routeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing[2],
  },
  routeName: {
    ...Typography.textStyles.h6,
    color: Colors.neutral[800],
    flex: 1,
  },
  transportModes: {
    flexDirection: 'row',
    gap: Spacing[1],
  },
  transportIcon: {
    fontSize: 16,
  },
  routeDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[4],
  },
  routeDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[1],
  },
  routeDetailText: {
    ...Typography.textStyles.caption,
    color: Colors.neutral[600],
    fontWeight: Typography.fontWeight.medium,
  },
  statusBadge: {
    paddingHorizontal: Spacing[2],
    paddingVertical: Spacing[1],
    borderRadius: BorderRadius.sm,
    marginLeft: 'auto',
  },
  statusActive: {
    backgroundColor: Colors.success[100],
  },
  statusPlanned: {
    backgroundColor: Colors.warning[100],
  },
  statusCompleted: {
    backgroundColor: Colors.neutral[100],
  },
  statusText: {
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
  selectedRouteInfo: {
    backgroundColor: 'white',
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing[4],
    ...Shadows.lg,
  },
  selectedRouteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing[3],
  },
  selectedRouteName: {
    ...Typography.textStyles.h5,
    color: Colors.neutral[800],
    flex: 1,
  },
  closeSelectedRoute: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.neutral[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeSelectedRouteText: {
    ...Typography.textStyles.body,
    color: Colors.neutral[600],
    fontWeight: Typography.fontWeight.bold,
  },
  selectedRouteDetails: {
    gap: Spacing[3],
  },
  selectedRouteDescription: {
    ...Typography.textStyles.body,
    color: Colors.neutral[600],
    lineHeight: Typography.lineHeight.relaxed,
  },
  selectedRouteStats: {
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
  costText: {
    ...Typography.textStyles.body,
    color: Colors.success[600],
    fontWeight: Typography.fontWeight.bold,
  },
});

export default MapView;