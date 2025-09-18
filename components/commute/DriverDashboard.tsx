// ============================================================================
// DRIVER DASHBOARD COMPONENT
// ============================================================================
// Dashboard component for drivers showing trip chaining status and next trips

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Clock, MapPin, DollarSign, Users, ChevronRight, CheckCircle, AlertCircle } from 'lucide-react-native';
import { trpc } from '@/lib/trpc';

interface TripChain {
  id: string;
  driverId: string;
  trips: Trip[];
  status: 'active' | 'completed' | 'cancelled';
  totalDistance: number;
  totalDuration: number;
  totalEarnings: number;
  createdAt: Date;
  updatedAt: Date;
}

interface Trip {
  id: string;
  routeId: string;
  userId: string;
  startTime: Date;
  endTime?: Date;
  status: 'planned' | 'in_progress' | 'completing' | 'completed' | 'cancelled';
  canAcceptNextTrip: boolean;
  nextTripId?: string;
  previousTripId?: string;
  chainId?: string;
  estimatedCompletionTime?: Date;
  actualCost?: number;
  notes?: string;
}

interface TripQueueEntry {
  id: string;
  tripId: string;
  passengerId: string;
  routeId: string;
  requestedTime: Date;
  pickupLocation: {
    latitude: number;
    longitude: number;
    address: string;
  };
  dropoffLocation: {
    latitude: number;
    longitude: number;
    address: string;
  };
  priority: number;
  maxWaitTime: number;
  proximityRadius: number;
  status: 'queued' | 'matched' | 'expired' | 'cancelled';
  createdAt: Date;
  expiresAt: Date;
}

interface DriverDashboardProps {
  currentTripId?: string;
  currentLocation?: {
    latitude: number;
    longitude: number;
  };
}

export const DriverDashboard: React.FC<DriverDashboardProps> = ({
  currentTripId,
  currentLocation,
}) => {
  const [selectedChain, setSelectedChain] = useState<TripChain | null>(null);
  const [nearbyTrips, setNearbyTrips] = useState<TripQueueEntry[]>([]);
  const [isNearCompletion, setIsNearCompletion] = useState(false);

  // Queries
  const driverChainsQuery = trpc.commute.getDriverChains.useQuery();
  const tripChainingStatsQuery = trpc.commute.getTripChainingStats.useQuery();
  
  // Mutations
  const acceptNextTripMutation = trpc.commute.acceptNextTrip.useMutation();
  const updateDriverLocationMutation = trpc.commute.updateDriverLocation.useMutation();
  const checkTripCompletionQuery = trpc.commute.checkTripCompletionAndFindNearby.useQuery(
    {
      tripId: currentTripId!,
      currentLocation: currentLocation!,
    },
    {
      enabled: !!currentTripId && !!currentLocation,
      refetchInterval: 30000, // Check every 30 seconds
    }
  );

  // Update location periodically
  useEffect(() => {
    if (currentLocation) {
      updateDriverLocationMutation.mutate(currentLocation);
    }
  }, [currentLocation]);

  // Check for trip completion and nearby trips
  useEffect(() => {
    if (checkTripCompletionQuery.data) {
      setIsNearCompletion(checkTripCompletionQuery.data.isNearCompletion);
      setNearbyTrips(checkTripCompletionQuery.data.nearbyTrips);
    }
  }, [checkTripCompletionQuery.data]);

  const handleAcceptNextTrip = async (nextTripId: string) => {
    if (!currentTripId) {
      Alert.alert('Error', 'No hay viaje activo');
      return;
    }

    try {
      await acceptNextTripMutation.mutateAsync({
        currentTripId,
        nextTripId,
        estimatedTransitionTime: 300, // 5 minutes
      });

      Alert.alert('¡Éxito!', 'Próximo viaje aceptado');
      
      // Refresh data
      driverChainsQuery.refetch();
      tripChainingStatsQuery.refetch();
    } catch (error) {
      console.error('Error accepting next trip:', error);
      Alert.alert('Error', 'No se pudo aceptar el próximo viaje');
    }
  };

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };

  const formatDistance = (meters: number): string => {
    return meters >= 1000 ? `${(meters / 1000).toFixed(1)} km` : `${meters} m`;
  };

  const formatCurrency = (amount: number): string => {
    return `$${amount.toFixed(2)}`;
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'active':
      case 'in_progress':
        return '#4CAF50';
      case 'completing':
        return '#FF9800';
      case 'completed':
        return '#2196F3';
      case 'cancelled':
        return '#F44336';
      default:
        return '#757575';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
      case 'in_progress':
        return <CheckCircle size={16} color="#4CAF50" />;
      case 'completing':
        return <AlertCircle size={16} color="#FF9800" />;
      case 'completed':
        return <CheckCircle size={16} color="#2196F3" />;
      default:
        return <AlertCircle size={16} color="#757575" />;
    }
  };

  return (
    <ScrollView style={styles.container} testID="driver-dashboard">
      {/* Header Stats */}
      <View style={styles.statsContainer}>
        <Text style={styles.title}>Dashboard del Conductor</Text>
        
        {tripChainingStatsQuery.data && (
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{tripChainingStatsQuery.data.activeChains}</Text>
              <Text style={styles.statLabel}>Cadenas Activas</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{tripChainingStatsQuery.data.totalQueued}</Text>
              <Text style={styles.statLabel}>Viajes en Cola</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{tripChainingStatsQuery.data.totalMatched}</Text>
              <Text style={styles.statLabel}>Emparejados</Text>
            </View>
          </View>
        )}
      </View>

      {/* Trip Completion Status */}
      {isNearCompletion && (
        <View style={styles.completionAlert}>
          <View style={styles.alertHeader}>
            <AlertCircle size={20} color="#FF9800" />
            <Text style={styles.alertTitle}>Finalizando viaje - Próximo en cola</Text>
          </View>
          <Text style={styles.alertText}>
            Tu viaje está por finalizar. Hay {nearbyTrips.length} viajes disponibles cerca.
          </Text>
        </View>
      )}

      {/* Nearby Trips (when completing) */}
      {nearbyTrips.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Próximos Viajes Disponibles</Text>
          {nearbyTrips.map((trip) => (
            <TouchableOpacity
              key={trip.id}
              style={styles.tripCard}
              onPress={() => handleAcceptNextTrip(trip.tripId)}
              testID={`nearby-trip-${trip.id}`}
            >
              <View style={styles.tripHeader}>
                <View style={styles.tripInfo}>
                  <Text style={styles.tripTitle}>Viaje #{trip.tripId.slice(-6)}</Text>
                  <Text style={styles.tripPriority}>Prioridad: {trip.priority}/10</Text>
                </View>
                <ChevronRight size={20} color="#666" />
              </View>
              
              <View style={styles.locationInfo}>
                <View style={styles.locationRow}>
                  <MapPin size={14} color="#4CAF50" />
                  <Text style={styles.locationText} numberOfLines={1}>
                    {trip.pickupLocation.address}
                  </Text>
                </View>
                <View style={styles.locationRow}>
                  <MapPin size={14} color="#F44336" />
                  <Text style={styles.locationText} numberOfLines={1}>
                    {trip.dropoffLocation.address}
                  </Text>
                </View>
              </View>

              <View style={styles.tripMeta}>
                <View style={styles.metaItem}>
                  <Clock size={12} color="#666" />
                  <Text style={styles.metaText}>
                    Expira en {Math.round((trip.expiresAt.getTime() - Date.now()) / 60000)}m
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Active Trip Chains */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Cadenas de Viajes Activas</Text>
        
        {driverChainsQuery.data?.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No hay cadenas de viajes activas</Text>
          </View>
        ) : (
          driverChainsQuery.data?.map((chain) => (
            <TouchableOpacity
              key={chain.id}
              style={styles.chainCard}
              onPress={() => setSelectedChain(selectedChain?.id === chain.id ? null : chain)}
              testID={`trip-chain-${chain.id}`}
            >
              <View style={styles.chainHeader}>
                <View style={styles.chainInfo}>
                  <Text style={styles.chainTitle}>Cadena #{chain.id.slice(-6)}</Text>
                  <View style={styles.chainStatus}>
                    {getStatusIcon(chain.status)}
                    <Text style={[styles.statusText, { color: getStatusColor(chain.status) }]}>
                      {chain.status}
                    </Text>
                  </View>
                </View>
                <ChevronRight 
                  size={20} 
                  color="#666" 
                  style={selectedChain?.id === chain.id ? styles.rotated : undefined}
                />
              </View>

              <View style={styles.chainStats}>
                <View style={styles.chainStat}>
                  <Users size={14} color="#666" />
                  <Text style={styles.chainStatText}>{chain.trips.length} viajes</Text>
                </View>
                <View style={styles.chainStat}>
                  <MapPin size={14} color="#666" />
                  <Text style={styles.chainStatText}>{formatDistance(chain.totalDistance)}</Text>
                </View>
                <View style={styles.chainStat}>
                  <Clock size={14} color="#666" />
                  <Text style={styles.chainStatText}>{formatDuration(chain.totalDuration)}</Text>
                </View>
                <View style={styles.chainStat}>
                  <DollarSign size={14} color="#4CAF50" />
                  <Text style={styles.chainStatText}>{formatCurrency(chain.totalEarnings)}</Text>
                </View>
              </View>

              {/* Expanded Chain Details */}
              {selectedChain?.id === chain.id && (
                <View style={styles.chainDetails}>
                  <Text style={styles.detailsTitle}>Viajes en la Cadena:</Text>
                  {chain.trips.map((trip, index) => (
                    <View key={trip.id} style={styles.tripInChain}>
                      <View style={styles.tripNumber}>
                        <Text style={styles.tripNumberText}>{index + 1}</Text>
                      </View>
                      <View style={styles.tripDetails}>
                        <Text style={styles.tripId}>#{trip.id.slice(-6)}</Text>
                        <View style={styles.tripStatus}>
                          {getStatusIcon(trip.status)}
                          <Text style={[styles.statusText, { color: getStatusColor(trip.status) }]}>
                            {trip.status}
                          </Text>
                        </View>
                        {trip.canAcceptNextTrip && (
                          <Text style={styles.canAcceptText}>✓ Puede aceptar siguiente</Text>
                        )}
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </TouchableOpacity>
          ))
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  statsContainer: {
    backgroundColor: '#fff',
    padding: 20,
    marginBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginHorizontal: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 4,
  },
  completionAlert: {
    backgroundColor: '#FFF3E0',
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 10,
    borderRadius: 8,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#E65100',
    marginLeft: 8,
  },
  alertText: {
    fontSize: 14,
    color: '#BF360C',
  },
  section: {
    backgroundColor: '#fff',
    marginBottom: 10,
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  tripCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  tripHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  tripInfo: {
    flex: 1,
  },
  tripTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  tripPriority: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  locationInfo: {
    marginBottom: 12,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  locationText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 8,
    flex: 1,
  },
  tripMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  chainCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  chainHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  chainInfo: {
    flex: 1,
  },
  chainTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  chainStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
    textTransform: 'capitalize',
  },
  rotated: {
    transform: [{ rotate: '90deg' }],
  },
  chainStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  chainStat: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  chainStatText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  chainDetails: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  detailsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  tripInChain: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
  },
  tripNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#2196F3',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  tripNumberText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
  },
  tripDetails: {
    flex: 1,
  },
  tripId: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 2,
  },
  tripStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  canAcceptText: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});

export default DriverDashboard;