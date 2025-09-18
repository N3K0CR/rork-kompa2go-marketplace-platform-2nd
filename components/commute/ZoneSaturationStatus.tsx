// ============================================================================
// ZONE SATURATION STATUS COMPONENT
// ============================================================================
// Componente para mostrar el estado de saturación de una zona

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
} from 'react-native';
import {
  Users,
  Clock,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  MapPin,
  Zap,
} from 'lucide-react-native';
import type { Zone, ZoneSaturationStatus } from '@/backend/trpc/routes/commute/types';

// ============================================================================
// TYPES
// ============================================================================

interface ZoneSaturationStatusProps {
  zone: Zone;
  saturationStatus?: ZoneSaturationStatus;
  onRefresh?: () => void;
  showRecommendations?: boolean;
  compact?: boolean;
}

interface SaturationIndicatorProps {
  level: number;
  status: 'low' | 'optimal' | 'high' | 'saturated';
  animated?: boolean;
}

interface RecommendationItemProps {
  recommendation: {
    type: 'move_to_zone' | 'wait' | 'try_later' | 'alternative_zone';
    message: string;
    alternativeZoneId?: string;
  };
  onAlternativeZonePress?: (zoneId: string) => void;
}

// ============================================================================
// SATURATION INDICATOR COMPONENT
// ============================================================================

const SaturationIndicator: React.FC<SaturationIndicatorProps> = ({
  level,
  status,
  animated = true,
}) => {
  const [animatedValue] = useState(new Animated.Value(0));

  const getColor = useCallback((status: string): string => {
    switch (status) {
      case 'low': return '#4CAF50';
      case 'optimal': return '#FF9800';
      case 'high': return '#F44336';
      case 'saturated': return '#9C27B0';
      default: return '#757575';
    }
  }, []);

  const getIcon = (status: string) => {
    const color = getColor(status);
    switch (status) {
      case 'low':
        return <TrendingDown size={20} color={color} />;
      case 'optimal':
        return <CheckCircle size={20} color={color} />;
      case 'high':
        return <TrendingUp size={20} color={color} />;
      case 'saturated':
        return <AlertTriangle size={20} color={color} />;
      default:
        return <MapPin size={20} color={color} />;
    }
  };

  const getStatusText = (status: string): string => {
    switch (status) {
      case 'low': return 'Baja Saturación';
      case 'optimal': return 'Saturación Óptima';
      case 'high': return 'Alta Saturación';
      case 'saturated': return 'Zona Saturada';
      default: return 'Estado Desconocido';
    }
  };

  useEffect(() => {
    if (animated) {
      Animated.timing(animatedValue, {
        toValue: level / 100,
        duration: 1000,
        useNativeDriver: false,
      }).start();
    } else {
      animatedValue.setValue(level / 100);
    }
  }, [level, animated, animatedValue]);

  return (
    <View style={styles.saturationIndicator}>
      <View style={styles.indicatorHeader}>
        {getIcon(status)}
        <Text style={[styles.statusText, { color: getColor(status) }]}>
          {getStatusText(status)}
        </Text>
        <Text style={styles.levelText}>{level}%</Text>
      </View>

      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBarBackground]}>
          <Animated.View
            style={[
              styles.progressBarFill,
              {
                backgroundColor: getColor(status),
                width: animatedValue.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%'],
                }),
              },
            ]}
          />
        </View>
      </View>
    </View>
  );
};

// ============================================================================
// RECOMMENDATION ITEM COMPONENT
// ============================================================================

const RecommendationItem: React.FC<RecommendationItemProps> = ({
  recommendation,
  onAlternativeZonePress,
}) => {
  const getIcon = (type: string) => {
    switch (type) {
      case 'move_to_zone':
        return <MapPin size={16} color="#4CAF50" />;
      case 'wait':
        return <Clock size={16} color="#FF9800" />;
      case 'try_later':
        return <Clock size={16} color="#F44336" />;
      case 'alternative_zone':
        return <TrendingUp size={16} color="#2196F3" />;
      default:
        return <AlertTriangle size={16} color="#757575" />;
    }
  };

  const getBackgroundColor = (type: string): string => {
    switch (type) {
      case 'move_to_zone': return '#E8F5E8';
      case 'wait': return '#FFF3E0';
      case 'try_later': return '#FFEBEE';
      case 'alternative_zone': return '#E3F2FD';
      default: return '#F5F5F5';
    }
  };

  const handlePress = () => {
    if (recommendation.type === 'alternative_zone' && 
        recommendation.alternativeZoneId && 
        onAlternativeZonePress) {
      onAlternativeZonePress(recommendation.alternativeZoneId);
    }
  };

  const isClickable = recommendation.type === 'alternative_zone' && 
                     recommendation.alternativeZoneId && 
                     onAlternativeZonePress;

  return (
    <TouchableOpacity
      style={[
        styles.recommendationItem,
        { backgroundColor: getBackgroundColor(recommendation.type) },
        !isClickable && styles.recommendationItemDisabled,
      ]}
      onPress={isClickable ? handlePress : undefined}
      disabled={!isClickable}
      testID={`recommendation-${recommendation.type}`}
    >
      <View style={styles.recommendationContent}>
        {getIcon(recommendation.type)}
        <Text style={styles.recommendationText}>
          {recommendation.message}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const ZoneSaturationStatusComponent: React.FC<ZoneSaturationStatusProps> = ({
  zone,
  saturationStatus,
  onRefresh,
  showRecommendations = true,
  compact = false,
}) => {
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const handleRefresh = async () => {
    if (!onRefresh) return;
    
    setRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setRefreshing(false);
    }
  };

  const formatLastUpdated = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Ahora mismo';
    if (diffMins < 60) return `Hace ${diffMins} min`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `Hace ${diffHours}h`;
    
    return date.toLocaleDateString();
  };

  if (compact) {
    return (
      <View style={styles.compactContainer}>
        <View style={styles.compactHeader}>
          <Text style={styles.compactZoneName}>{zone.name}</Text>
          <View style={styles.compactStats}>
            <Users size={14} color="#757575" />
            <Text style={styles.compactStatText}>
              {zone.currentDrivers}/{zone.maxDrivers}
            </Text>
            <View
              style={[
                styles.compactSaturationDot,
                { 
                  backgroundColor: saturationStatus?.status === 'low' ? '#4CAF50' :
                                  saturationStatus?.status === 'optimal' ? '#FF9800' :
                                  saturationStatus?.status === 'high' ? '#F44336' : '#9C27B0'
                },
              ]}
            />
            <Text style={styles.compactStatText}>{zone.saturationLevel}%</Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleSection}>
          <Text style={styles.zoneName}>{zone.name}</Text>
          {zone.description && (
            <Text style={styles.zoneDescription}>{zone.description}</Text>
          )}
        </View>
        
        {onRefresh && (
          <TouchableOpacity
            style={styles.refreshButton}
            onPress={handleRefresh}
            disabled={refreshing}
            testID="refresh-saturation"
          >
            {refreshing ? (
              <ActivityIndicator size="small" color="#007AFF" />
            ) : (
              <Zap size={20} color="#007AFF" />
            )}
          </TouchableOpacity>
        )}
      </View>

      <SaturationIndicator
        level={zone.saturationLevel}
        status={saturationStatus?.status || 'low'}
        animated={true}
      />

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Users size={24} color="#007AFF" />
          <Text style={styles.statValue}>
            {zone.currentDrivers}/{zone.maxDrivers}
          </Text>
          <Text style={styles.statLabel}>Conductores</Text>
        </View>

        {saturationStatus?.waitingList !== undefined && saturationStatus.waitingList > 0 && (
          <View style={styles.statCard}>
            <Clock size={24} color="#FF9800" />
            <Text style={styles.statValue}>{saturationStatus.waitingList}</Text>
            <Text style={styles.statLabel}>En Espera</Text>
          </View>
        )}

        {saturationStatus?.estimatedWaitTime && (
          <View style={styles.statCard}>
            <Clock size={24} color="#F44336" />
            <Text style={styles.statValue}>{saturationStatus.estimatedWaitTime} min</Text>
            <Text style={styles.statLabel}>Tiempo Espera</Text>
          </View>
        )}

        {zone.incentives && (
          <View style={styles.statCard}>
            <TrendingUp size={24} color="#4CAF50" />
            <Text style={styles.statValue}>{zone.incentives.bonusMultiplier}x</Text>
            <Text style={styles.statLabel}>Bonus</Text>
          </View>
        )}
      </View>

      {showRecommendations && saturationStatus?.recommendations && saturationStatus.recommendations.length > 0 && (
        <View style={styles.recommendationsContainer}>
          <Text style={styles.recommendationsTitle}>Recomendaciones</Text>
          {saturationStatus.recommendations.map((recommendation, index) => (
            <RecommendationItem
              key={`${recommendation.type}-${index}`}
              recommendation={recommendation}
              onAlternativeZonePress={(zoneId) => {
                console.log('Navigate to alternative zone:', zoneId);
              }}
            />
          ))}
        </View>
      )}

      {saturationStatus?.lastUpdated && (
        <View style={styles.footer}>
          <Text style={styles.lastUpdated}>
            Actualizado: {formatLastUpdated(saturationStatus.lastUpdated)}
          </Text>
        </View>
      )}
    </View>
  );
};

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  compactContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    marginVertical: 4,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  titleSection: {
    flex: 1,
  },
  zoneName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 4,
  },
  zoneDescription: {
    fontSize: 14,
    color: '#757575',
    lineHeight: 20,
  },
  refreshButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F0F0F0',
  },
  saturationIndicator: {
    marginBottom: 20,
  },
  indicatorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
    flex: 1,
  },
  levelText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#212121',
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#F0F0F0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarBackground: {
    flex: 1,
    backgroundColor: '#E0E0E0',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  statCard: {
    alignItems: 'center',
    flex: 1,
    paddingVertical: 12,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#212121',
    marginTop: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#757575',
    marginTop: 2,
    textAlign: 'center',
  },
  recommendationsContainer: {
    marginBottom: 16,
  },
  recommendationsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 12,
  },
  recommendationItem: {
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  recommendationItemDisabled: {
    opacity: 1,
  },
  recommendationContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  recommendationText: {
    fontSize: 14,
    color: '#424242',
    marginLeft: 8,
    flex: 1,
    lineHeight: 20,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    paddingTop: 12,
    alignItems: 'center',
  },
  lastUpdated: {
    fontSize: 12,
    color: '#9E9E9E',
  },
  compactHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  compactZoneName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
    flex: 1,
  },
  compactStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  compactStatText: {
    fontSize: 14,
    color: '#757575',
    marginLeft: 4,
    marginRight: 8,
  },
  compactSaturationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 4,
  },
});

export { ZoneSaturationStatusComponent as ZoneSaturationStatus };
export default ZoneSaturationStatusComponent;