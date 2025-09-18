// ============================================================================
// TRIP CHAINING STATUS COMPONENT
// ============================================================================
// Visual indicator component for trip chaining status and next trip availability

import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Clock, CheckCircle, AlertCircle, ArrowRight, Users, Zap } from 'lucide-react-native';

interface TripChainingStatusProps {
  status: 'planned' | 'in_progress' | 'completing' | 'completed' | 'cancelled';
  canAcceptNextTrip?: boolean;
  nextTripId?: string;
  estimatedCompletionTime?: Date;
  chainPosition?: number;
  totalTripsInChain?: number;
  nearbyTripsCount?: number;
  testID?: string;
}

export const TripChainingStatus: React.FC<TripChainingStatusProps> = ({
  status,
  canAcceptNextTrip = false,
  nextTripId,
  estimatedCompletionTime,
  chainPosition,
  totalTripsInChain,
  nearbyTripsCount = 0,
  testID = 'trip-chaining-status',
}) => {
  const pulseAnim = React.useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    if (status === 'completing' && canAcceptNextTrip) {
      // Create pulsing animation for completing status
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();

      return () => pulse.stop();
    }
  }, [status, canAcceptNextTrip, pulseAnim]);

  const getStatusConfig = () => {
    switch (status) {
      case 'planned':
        return {
          color: '#757575',
          backgroundColor: '#f5f5f5',
          icon: Clock,
          text: 'Planificado',
          description: 'Viaje programado',
        };
      case 'in_progress':
        return {
          color: '#4CAF50',
          backgroundColor: '#E8F5E8',
          icon: CheckCircle,
          text: 'En Progreso',
          description: 'Viaje activo',
        };
      case 'completing':
        return {
          color: '#FF9800',
          backgroundColor: '#FFF3E0',
          icon: AlertCircle,
          text: 'Finalizando',
          description: canAcceptNextTrip ? 'Próximo en cola' : 'Completando viaje',
        };
      case 'completed':
        return {
          color: '#2196F3',
          backgroundColor: '#E3F2FD',
          icon: CheckCircle,
          text: 'Completado',
          description: 'Viaje finalizado',
        };
      case 'cancelled':
        return {
          color: '#F44336',
          backgroundColor: '#FFEBEE',
          icon: AlertCircle,
          text: 'Cancelado',
          description: 'Viaje cancelado',
        };
      default:
        return {
          color: '#757575',
          backgroundColor: '#f5f5f5',
          icon: Clock,
          text: 'Desconocido',
          description: 'Estado desconocido',
        };
    }
  };

  const config = getStatusConfig();
  const StatusIcon = config.icon;

  const formatTimeRemaining = (date: Date): string => {
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    const minutes = Math.round(diff / 60000);
    
    if (minutes <= 0) return 'Ahora';
    if (minutes < 60) return `${minutes}m`;
    
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  };

  return (
    <View style={[styles.container, { backgroundColor: config.backgroundColor }]} testID={testID}>
      {/* Main Status */}
      <View style={styles.statusRow}>
        <Animated.View 
          style={[
            styles.iconContainer,
            { backgroundColor: config.color },
            status === 'completing' && canAcceptNextTrip && {
              transform: [{ scale: pulseAnim }],
            },
          ]}
        >
          <StatusIcon size={16} color="#fff" />
        </Animated.View>
        
        <View style={styles.statusInfo}>
          <Text style={[styles.statusText, { color: config.color }]}>
            {config.text}
          </Text>
          <Text style={styles.statusDescription}>
            {config.description}
          </Text>
        </View>

        {/* Chain Position Indicator */}
        {chainPosition !== undefined && totalTripsInChain !== undefined && (
          <View style={styles.chainIndicator}>
            <Users size={14} color={config.color} />
            <Text style={[styles.chainText, { color: config.color }]}>
              {chainPosition}/{totalTripsInChain}
            </Text>
          </View>
        )}
      </View>

      {/* Completion Time */}
      {estimatedCompletionTime && status === 'completing' && (
        <View style={styles.completionInfo}>
          <Clock size={12} color={config.color} />
          <Text style={[styles.completionText, { color: config.color }]}>
            Finaliza en {formatTimeRemaining(estimatedCompletionTime)}
          </Text>
        </View>
      )}

      {/* Next Trip Indicator */}
      {canAcceptNextTrip && status === 'completing' && (
        <View style={styles.nextTripIndicator}>
          <View style={styles.nextTripRow}>
            <Zap size={14} color="#4CAF50" />
            <Text style={styles.nextTripText}>
              {nextTripId ? 'Próximo viaje aceptado' : 'Puede aceptar próximo viaje'}
            </Text>
          </View>
          {nextTripId ? (
            <Text style={styles.nextTripId}>
              #{nextTripId.slice(-6)}
            </Text>
          ) : nearbyTripsCount > 0 && (
            <Text style={styles.nearbyTripsText}>
              {nearbyTripsCount} viajes disponibles cerca
            </Text>
          )}
        </View>
      )}

      {/* Trip Chain Connection */}
      {nextTripId && status !== 'completing' && (
        <View style={styles.chainConnection}>
          <View style={styles.connectionLine} />
          <ArrowRight size={12} color="#666" />
          <Text style={styles.connectionText}>
            Conectado a #{nextTripId.slice(-6)}
          </Text>
        </View>
      )}

      {/* Chain Completion Indicator */}
      {status === 'completed' && chainPosition === totalTripsInChain && totalTripsInChain && totalTripsInChain > 1 && (
        <View style={styles.chainCompletedIndicator}>
          <CheckCircle size={14} color="#4CAF50" />
          <Text style={styles.chainCompletedText}>
            Cadena de {totalTripsInChain} viajes completada
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    padding: 16,
    marginVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  statusInfo: {
    flex: 1,
  },
  statusText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  statusDescription: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  chainIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  chainText: {
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  completionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  completionText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 6,
  },
  nextTripIndicator: {
    marginTop: 12,
    padding: 12,
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  nextTripRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  nextTripText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2E7D32',
    marginLeft: 6,
  },
  nextTripId: {
    fontSize: 12,
    color: '#4CAF50',
    marginTop: 4,
    fontFamily: 'monospace',
    fontWeight: 'bold',
  },
  nearbyTripsText: {
    fontSize: 12,
    color: '#4CAF50',
    marginTop: 4,
    fontWeight: '500',
  },
  chainConnection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  connectionLine: {
    width: 20,
    height: 1,
    backgroundColor: '#666',
    marginRight: 6,
  },
  connectionText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 6,
    fontFamily: 'monospace',
  },
  chainCompletedIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(76, 175, 80, 0.3)',
  },
  chainCompletedText: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '500',
    marginLeft: 6,
  },
});

export default TripChainingStatus;