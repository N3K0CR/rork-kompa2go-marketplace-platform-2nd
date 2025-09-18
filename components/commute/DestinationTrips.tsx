// ============================================================================
// DESTINATION TRIPS COMPONENT
// ============================================================================
// Component to display available trips that help progress towards destination

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { MapPin, Navigation, Clock, TrendingUp, Target, AlertCircle } from 'lucide-react-native';
import { trpc } from '@/lib/trpc';

interface Location {
  latitude: number;
  longitude: number;
  address: string;
  name?: string;
}

interface DestinationTripsProps {
  currentLocation?: Location;
  destinationModeId?: string;
  onTripSelect?: (tripId: string) => void;
}

interface TripWithScore {
  id: string;
  tripId: string;
  passengerId: string;
  routeId: string;
  requestedTime: Date;
  pickupLocation: Location;
  dropoffLocation: Location;
  priority: number;
  maxWaitTime: number;
  proximityRadius: number;
  status: 'queued' | 'matched' | 'expired' | 'cancelled';
  createdAt: Date;
  expiresAt: Date;
  destinationScore: number;
  progressDistance: number;
  detourDistance: number;
}

export const DestinationTrips: React.FC<DestinationTripsProps> = ({
  currentLocation,
  destinationModeId,
  onTripSelect,
}) => {
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Query for trips to destination
  const tripsQuery = trpc.commute.findTripsToDestination.useQuery(
    {
      destinationModeId: destinationModeId!,
      currentLocation: currentLocation!,
      maxResults: 20,
    },
    {
      enabled: !!destinationModeId && !!currentLocation,
      refetchInterval: 30000, // Refresh every 30 seconds
    }
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await tripsQuery.refetch();
    setRefreshing(false);
  };

  const formatDistance = (meters: number): string => {
    return meters >= 1000 ? `${(meters / 1000).toFixed(1)} km` : `${meters} m`;
  };

  const formatTime = (date: Date): string => {
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 0) return 'Expirado';
    if (diffMins < 60) return `${diffMins}m`;
    
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return `${hours}h ${mins}m`;
  };

  const getScoreColor = (score: number): string => {
    if (score >= 80) return '#4CAF50';
    if (score >= 60) return '#8BC34A';
    if (score >= 40) return '#FF9800';
    if (score >= 20) return '#FF5722';
    return '#F44336';
  };

  const getScoreLabel = (score: number): string => {
    if (score >= 80) return 'Excelente';
    if (score >= 60) return 'Muy bueno';
    if (score >= 40) return 'Bueno';
    if (score >= 20) return 'Regular';
    return 'Bajo';
  };

  const getPriorityColor = (priority: number): string => {
    if (priority >= 8) return '#F44336';
    if (priority >= 6) return '#FF9800';
    if (priority >= 4) return '#2196F3';
    return '#4CAF50';
  };

  if (!destinationModeId || !currentLocation) {
    return (
      <View style={styles.emptyContainer}>
        <Target size={48} color="#ccc" />
        <Text style={styles.emptyTitle}>Modo Destino Inactivo</Text>
        <Text style={styles.emptyText}>
          Activa el modo destino para ver viajes que te acerquen a tu objetivo
        </Text>
      </View>
    );
  }

  if (tripsQuery.isLoading && !tripsQuery.data) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Buscando viajes hacia tu destino...</Text>
      </View>
    );
  }

  if (tripsQuery.error) {
    return (
      <View style={styles.errorContainer}>
        <AlertCircle size={48} color="#F44336" />
        <Text style={styles.errorTitle}>Error al cargar viajes</Text>
        <Text style={styles.errorText}>{tripsQuery.error.message}</Text>
        <TouchableOpacity onPress={handleRefresh} style={styles.retryButton}>
          <Text style={styles.retryText}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const trips = tripsQuery.data?.trips || [];

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
      testID="destination-trips"
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Navigation size={20} color="#2196F3" />
          <Text style={styles.title}>Viajes hacia Destino</Text>
        </View>
        <View style={styles.statsContainer}>
          <Text style={styles.statsText}>
            {trips.length} de {tripsQuery.data?.totalAvailable || 0} disponibles
          </Text>
        </View>
      </View>

      {trips.length === 0 ? (
        <View style={styles.emptyState}>
          <MapPin size={48} color="#ccc" />
          <Text style={styles.emptyStateTitle}>No hay viajes disponibles</Text>
          <Text style={styles.emptyStateText}>
            No se encontraron viajes que te acerquen a tu destino en este momento
          </Text>
        </View>
      ) : (
        trips.map((trip: TripWithScore) => (
          <TouchableOpacity
            key={trip.id}
            style={styles.tripCard}
            onPress={() => onTripSelect?.(trip.tripId)}
            testID={`trip-${trip.id}`}
          >
            {/* Trip Header */}
            <View style={styles.tripHeader}>
              <View style={styles.tripInfo}>
                <Text style={styles.tripId}>Viaje #{trip.tripId.slice(-6)}</Text>
                <View style={styles.priorityBadge}>
                  <View 
                    style={[
                      styles.priorityIndicator, 
                      { backgroundColor: getPriorityColor(trip.priority) }
                    ]} 
                  />
                  <Text style={styles.priorityText}>Prioridad {trip.priority}</Text>
                </View>
              </View>
              
              <View style={styles.scoreContainer}>
                <Text 
                  style={[
                    styles.scoreValue, 
                    { color: getScoreColor(trip.destinationScore) }
                  ]}
                >
                  {trip.destinationScore.toFixed(0)}
                </Text>
                <Text style={styles.scoreLabel}>{getScoreLabel(trip.destinationScore)}</Text>
              </View>
            </View>

            {/* Locations */}
            <View style={styles.locationsContainer}>
              <View style={styles.locationRow}>
                <MapPin size={14} color="#4CAF50" />
                <Text style={styles.locationText} numberOfLines={1}>
                  Origen: {trip.pickupLocation.address}
                </Text>
              </View>
              <View style={styles.locationRow}>
                <MapPin size={14} color="#F44336" />
                <Text style={styles.locationText} numberOfLines={1}>
                  Destino: {trip.dropoffLocation.address}
                </Text>
              </View>
            </View>

            {/* Progress Info */}
            <View style={styles.progressContainer}>
              <View style={styles.progressItem}>
                <TrendingUp size={12} color="#4CAF50" />
                <Text style={styles.progressText}>
                  Progreso: {formatDistance(trip.progressDistance)}
                </Text>
              </View>
              <View style={styles.progressItem}>
                <Navigation size={12} color="#FF9800" />
                <Text style={styles.progressText}>
                  Desvío: {formatDistance(trip.detourDistance)}
                </Text>
              </View>
            </View>

            {/* Trip Meta */}
            <View style={styles.tripMeta}>
              <View style={styles.metaItem}>
                <Clock size={12} color="#666" />
                <Text style={styles.metaText}>
                  Expira en {formatTime(trip.expiresAt)}
                </Text>
              </View>
              <View style={styles.metaItem}>
                <Target size={12} color="#2196F3" />
                <Text style={styles.metaText}>
                  Radio: {formatDistance(trip.proximityRadius)}
                </Text>
              </View>
            </View>

            {/* Action Indicator */}
            <View style={styles.actionIndicator}>
              <Text style={styles.actionText}>Toca para aceptar viaje</Text>
            </View>
          </TouchableOpacity>
        ))
      )}

      {/* Footer Info */}
      {trips.length > 0 && (
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Los viajes se ordenan por puntuación de destino. 
            Mayor puntuación = mejor progreso hacia tu objetivo.
          </Text>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 8,
  },
  statsContainer: {
    alignItems: 'flex-end',
  },
  statsText: {
    fontSize: 12,
    color: '#666',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#F44336',
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 6,
  },
  retryText: {
    color: '#fff',
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  tripCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  tripHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  tripInfo: {
    flex: 1,
  },
  tripId: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  priorityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priorityIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  priorityText: {
    fontSize: 12,
    color: '#666',
  },
  scoreContainer: {
    alignItems: 'center',
    minWidth: 60,
  },
  scoreValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  scoreLabel: {
    fontSize: 10,
    color: '#666',
    textAlign: 'center',
  },
  locationsContainer: {
    marginBottom: 12,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  locationText: {
    fontSize: 13,
    color: '#333',
    marginLeft: 8,
    flex: 1,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  progressItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  progressText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  tripMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontSize: 11,
    color: '#666',
    marginLeft: 4,
  },
  actionIndicator: {
    backgroundColor: '#E3F2FD',
    padding: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  actionText: {
    fontSize: 12,
    color: '#1976D2',
    fontWeight: '500',
  },
  footer: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  footerText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    lineHeight: 16,
  },
});

export default DestinationTrips;