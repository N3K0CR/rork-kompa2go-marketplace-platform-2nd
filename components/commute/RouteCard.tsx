import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MapPin, Clock, Users, Zap, Calendar, Navigation } from 'lucide-react-native';
import { Colors, Spacing, BorderRadius, Shadows, Typography } from '@/context-package/design-system';
import { Route, TransportMode } from '@/src/modules/commute/types/core-types';

interface RouteCardProps {
  route: Route;
  transportModes: TransportMode[];
  onSelect?: (route: Route) => void;
  onEdit?: (route: Route) => void;
  onDelete?: (route: Route) => void;
  isSelected?: boolean;
  showActions?: boolean;
  compact?: boolean;
}

export default function RouteCard({
  route,
  transportModes,
  onSelect,
  onEdit,
  onDelete,
  isSelected = false,
  showActions = true,
  compact = false
}: RouteCardProps) {

  const handleSelect = () => {
    if (!route?.id?.trim()) return;
    console.log('🛣️ RouteCard: Route selected:', route.id);
    onSelect?.(route);
  };

  const handleEdit = () => {
    if (!route?.id?.trim()) return;
    console.log('✏️ RouteCard: Edit route:', route.id);
    onEdit?.(route);
  };

  const handleDelete = () => {
    if (!route?.id?.trim()) return;
    console.log('🗑️ RouteCard: Delete route:', route.id);
    onDelete?.(route);
  };

  const getTransportModeIcon = (modeId: string) => {
    if (!modeId?.trim()) return '📍';
    const mode = transportModes.find(m => m.id === modeId);
    if (!mode) return '📍';
    
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
  };

  const getStatusColor = () => {
    switch (route.status) {
      case 'active':
        return Colors.success[500];
      case 'planned':
        return Colors.warning[500];
      case 'completed':
        return Colors.neutral[400];
      case 'cancelled':
        return Colors.error[500];
      default:
        return Colors.primary[300];
    }
  };

  const getStatusText = () => {
    switch (route.status) {
      case 'active':
        return 'Activa';
      case 'planned':
        return 'Planificada';
      case 'completed':
        return 'Completada';
      case 'cancelled':
        return 'Cancelada';
      default:
        return 'Desconocida';
    }
  };

  const renderRoutePoints = () => {
    const origin = route.points.find(p => p.type === 'origin');
    const destination = route.points.find(p => p.type === 'destination');
    
    return (
      <View style={styles.routePoints}>
        {origin && (
          <View style={styles.pointItem}>
            <View style={[styles.pointIndicator, styles.originIndicator]}>
              <Text style={styles.pointIcon}>🏠</Text>
            </View>
            <Text style={styles.pointText} numberOfLines={1}>
              {origin.name || origin.address}
            </Text>
          </View>
        )}
        
        <View style={styles.routeArrow}>
          <Navigation size={16} color={Colors.neutral[400]} />
        </View>
        
        {destination && (
          <View style={styles.pointItem}>
            <View style={[styles.pointIndicator, styles.destinationIndicator]}>
              <Text style={styles.pointIcon}>🎯</Text>
            </View>
            <Text style={styles.pointText} numberOfLines={1}>
              {destination.name || destination.address}
            </Text>
          </View>
        )}
      </View>
    );
  };

  const renderTransportModes = () => {
    return (
      <View style={styles.transportModes}>
        {route.transportModes?.slice(0, 4).map((mode: TransportMode) => (
          <View key={mode.id} style={styles.transportModeItem}>
            <Text style={styles.transportIcon}>
              {getTransportModeIcon(mode.id)}
            </Text>
          </View>
        ))}
        {route.transportModes && route.transportModes.length > 4 && (
          <View style={styles.moreModesIndicator}>
            <Text style={styles.moreModesText}>+{route.transportModes.length - 4}</Text>
          </View>
        )}
      </View>
    );
  };

  const renderStats = () => {
    return (
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Clock size={14} color={Colors.primary[500]} />
          <Text style={styles.statText}>{route.duration} min</Text>
        </View>
        
        <View style={styles.statItem}>
          <MapPin size={14} color={Colors.neutral[600]} />
          <Text style={styles.statText}>{(route.distance / 1000).toFixed(1)} km</Text>
        </View>
        
        {route.estimatedCost > 0 && (
          <View style={styles.statItem}>
            <Text style={styles.costText}>₡{route.estimatedCost}</Text>
          </View>
        )}
        
        {route.carbonFootprint > 0 && (
          <View style={styles.statItem}>
            <Zap size={14} color={Colors.success[600]} />
            <Text style={styles.carbonText}>{route.carbonFootprint.toFixed(1)} kg CO₂</Text>
          </View>
        )}
      </View>
    );
  };

  const renderRecurringInfo = () => {
    if (!route.isRecurring || !route.recurringPattern) return null;
    
    return (
      <View style={styles.recurringInfo}>
        <Calendar size={14} color={Colors.primary[500]} />
        <Text style={styles.recurringText}>
          {route.recurringPattern.type === 'daily' ? 'Diario' :
           route.recurringPattern.type === 'weekly' ? 'Semanal' : 'Mensual'}
        </Text>
      </View>
    );
  };

  if (compact) {
    return (
      <TouchableOpacity
        style={[
          styles.compactCard,
          isSelected && styles.selectedCard,
          { borderLeftColor: getStatusColor() }
        ]}
        onPress={handleSelect}
        activeOpacity={0.8}
      >
        <View style={styles.compactHeader}>
          <Text style={styles.routeName}>{route.name}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor() }]}>
            <Text style={styles.statusBadgeText}>{getStatusText()}</Text>
          </View>
        </View>
        
        <View style={styles.compactStats}>
          <Text style={styles.compactStatText}>{route.duration} min</Text>
          <Text style={styles.compactStatText}>•</Text>
          <Text style={styles.compactStatText}>{(route.distance / 1000).toFixed(1)} km</Text>
          {route.estimatedCost > 0 && (
            <>
              <Text style={styles.compactStatText}>•</Text>
              <Text style={styles.compactCostText}>₡{route.estimatedCost}</Text>
            </>
          )}
        </View>
        
        {renderTransportModes()}
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={[
        styles.card,
        isSelected && styles.selectedCard,
        { borderLeftColor: getStatusColor() }
      ]}
      onPress={handleSelect}
      activeOpacity={0.8}
    >
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.routeName}>{route.name}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor() }]}>
            <Text style={styles.statusBadgeText}>{getStatusText()}</Text>
          </View>
        </View>
        
        {renderRecurringInfo()}
      </View>

      {renderRoutePoints()}
      {renderTransportModes()}
      {renderStats()}

      {showActions && (
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleEdit}
            activeOpacity={0.7}
          >
            <Text style={styles.actionButtonText}>Editar</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, styles.primaryAction]}
            onPress={handleSelect}
            activeOpacity={0.7}
          >
            <Text style={styles.primaryActionText}>Usar Ruta</Text>
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'white',
    borderRadius: BorderRadius.lg,
    padding: Spacing[4],
    marginBottom: Spacing[3],
    borderLeftWidth: 4,
    ...Shadows.base,
  },
  selectedCard: {
    borderWidth: 2,
    borderColor: Colors.primary[500],
    ...Shadows.lg,
  },
  compactCard: {
    backgroundColor: 'white',
    borderRadius: BorderRadius.md,
    padding: Spacing[3],
    marginBottom: Spacing[2],
    borderLeftWidth: 3,
    ...Shadows.sm,
  },
  header: {
    marginBottom: Spacing[3],
  },
  compactHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing[2],
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing[2],
  },
  routeName: {
    ...Typography.textStyles.h6,
    color: Colors.neutral[800],
    flex: 1,
    marginRight: Spacing[2],
  },
  statusBadge: {
    paddingHorizontal: Spacing[2],
    paddingVertical: Spacing[1],
    borderRadius: BorderRadius.sm,
  },
  statusBadgeText: {
    ...Typography.textStyles.caption,
    color: 'white',
    fontWeight: Typography.fontWeight.semibold,
    fontSize: 10,
  },
  recurringInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[1],
  },
  recurringText: {
    ...Typography.textStyles.caption,
    color: Colors.primary[600],
    fontWeight: Typography.fontWeight.medium,
  },
  routePoints: {
    marginBottom: Spacing[3],
  },
  pointItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing[2],
    gap: Spacing[2],
  },
  pointIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  originIndicator: {
    backgroundColor: Colors.success[100],
  },
  destinationIndicator: {
    backgroundColor: Colors.error[100],
  },
  pointIcon: {
    fontSize: 12,
  },
  pointText: {
    ...Typography.textStyles.bodySmall,
    color: Colors.neutral[700],
    flex: 1,
  },
  routeArrow: {
    alignItems: 'center',
    marginVertical: Spacing[1],
  },
  transportModes: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
    marginBottom: Spacing[3],
  },
  transportModeItem: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.neutral[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  transportIcon: {
    fontSize: 16,
  },
  moreModesIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreModesText: {
    ...Typography.textStyles.caption,
    color: Colors.primary[600],
    fontWeight: Typography.fontWeight.bold,
    fontSize: 10,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[4],
    marginBottom: Spacing[3],
  },
  compactStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
    marginBottom: Spacing[2],
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[1],
  },
  statText: {
    ...Typography.textStyles.caption,
    color: Colors.neutral[600],
    fontWeight: Typography.fontWeight.medium,
  },
  compactStatText: {
    ...Typography.textStyles.caption,
    color: Colors.neutral[600],
  },
  costText: {
    ...Typography.textStyles.bodySmall,
    color: Colors.success[600],
    fontWeight: Typography.fontWeight.bold,
  },
  compactCostText: {
    ...Typography.textStyles.caption,
    color: Colors.success[600],
    fontWeight: Typography.fontWeight.bold,
  },
  carbonText: {
    ...Typography.textStyles.caption,
    color: Colors.success[600],
    fontWeight: Typography.fontWeight.medium,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing[2],
    paddingTop: Spacing[3],
    borderTopWidth: 1,
    borderTopColor: Colors.neutral[200],
  },
  actionButton: {
    flex: 1,
    paddingVertical: Spacing[2],
    paddingHorizontal: Spacing[3],
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.neutral[300],
    alignItems: 'center',
  },
  actionButtonText: {
    ...Typography.textStyles.bodySmall,
    color: Colors.neutral[600],
    fontWeight: Typography.fontWeight.medium,
  },
  primaryAction: {
    backgroundColor: Colors.primary[500],
    borderColor: Colors.primary[500],
  },
  primaryActionText: {
    ...Typography.textStyles.bodySmall,
    color: 'white',
    fontWeight: Typography.fontWeight.semibold,
  },
});