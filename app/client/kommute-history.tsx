import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, ActivityIndicator, Alert } from 'react-native';
import { Stack, router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useFirebaseAuth } from '@/contexts/FirebaseAuthContext';
import { tripHistoryService, TripHistoryEntry } from '@/src/modules/commute/services/trip-history-service';
import { 
  ChevronLeft, 
  Calendar, 
  MapPin, 
  Clock, 
  DollarSign,
  Star,
  Filter,
  X,
  TrendingUp,
  Navigation,
  CheckCircle,
  XCircle,
  AlertCircle,
} from 'lucide-react-native';

type FilterPeriod = 'day' | 'week' | 'month' | 'all';
type FilterStatus = 'all' | 'completed' | 'cancelled';

export default function KommuteHistoryScreen() {
  const { user } = useAuth();
  const { firebaseUser } = useFirebaseAuth();
  const [trips, setTrips] = useState<TripHistoryEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedFilter, setSelectedFilter] = useState<FilterPeriod>('all');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
  const [showFilterModal, setShowFilterModal] = useState<boolean>(false);
  const [selectedTrip, setSelectedTrip] = useState<TripHistoryEntry | null>(null);
  const [showDetailModal, setShowDetailModal] = useState<boolean>(false);
  const [statistics, setStatistics] = useState({
    totalTrips: 0,
    completedTrips: 0,
    cancelledTrips: 0,
    totalDistance: 0,
    totalCost: 0,
    averageRating: 0,
  });

  useEffect(() => {
    loadTripHistory();
  }, [firebaseUser]);

  const loadTripHistory = async () => {
    if (!firebaseUser?.uid) return;
    
    try {
      setLoading(true);
      const history = await tripHistoryService.getTripHistory(firebaseUser.uid);
      setTrips(history);
      
      const stats = await tripHistoryService.getStatistics(firebaseUser.uid);
      setStatistics(stats);
    } catch (error) {
      console.error('Error loading trip history:', error);
      Alert.alert('Error', 'No se pudo cargar el historial de viajes');
    } finally {
      setLoading(false);
    }
  };

  const filteredTrips = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    return trips.filter(trip => {
      const tripDate = new Date(trip.startTime);
      
      let periodMatch = true;
      switch (selectedFilter) {
        case 'day':
          periodMatch = tripDate.toDateString() === today.toDateString();
          break;
        case 'week':
          const weekAgo = new Date(today);
          weekAgo.setDate(today.getDate() - 7);
          periodMatch = tripDate >= weekAgo;
          break;
        case 'month':
          const monthAgo = new Date(today);
          monthAgo.setMonth(today.getMonth() - 1);
          periodMatch = tripDate >= monthAgo;
          break;
        default:
          periodMatch = true;
      }
      
      const statusMatch = statusFilter === 'all' || trip.status === statusFilter;
      
      return periodMatch && statusMatch;
    }).sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
  }, [trips, selectedFilter, statusFilter]);

  const getFilterLabel = (filter: FilterPeriod) => {
    switch (filter) {
      case 'day': return 'Hoy';
      case 'week': return 'Esta Semana';
      case 'month': return 'Este Mes';
      default: return 'Todos';
    }
  };

  const getStatusLabel = (status: FilterStatus) => {
    switch (status) {
      case 'completed': return 'Completados';
      case 'cancelled': return 'Cancelados';
      default: return 'Todos';
    }
  };

  const handleViewDetails = (trip: TripHistoryEntry) => {
    setSelectedTrip(trip);
    setShowDetailModal(true);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle size={20} color="#4CAF50" />;
      case 'cancelled':
        return <XCircle size={20} color="#F44336" />;
      case 'in_progress':
        return <AlertCircle size={20} color="#FF9800" />;
      default:
        return <Clock size={20} color="#9CA3AF" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return '#4CAF50';
      case 'cancelled':
        return '#F44336';
      case 'in_progress':
        return '#FF9800';
      default:
        return '#9CA3AF';
    }
  };

  if (user?.userType !== 'client') {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: 'Acceso Denegado' }} />
        <Text style={styles.errorText}>Esta función es solo para clientes</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{
          title: 'Historial Kommute',
          headerStyle: { backgroundColor: '#65ea06' },
          headerTintColor: '#131c0d',
          headerTitleStyle: { fontWeight: 'bold' as const },
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <ChevronLeft size={24} color="#131c0d" />
            </TouchableOpacity>
          ),
        }}
      />

      <View style={styles.content}>
        <View style={styles.filterSection}>
          <TouchableOpacity 
            style={styles.filterButton}
            onPress={() => setShowFilterModal(true)}
          >
            <Filter size={20} color="#6b9e47" />
            <Text style={styles.filterButtonText}>
              {getFilterLabel(selectedFilter)} • {getStatusLabel(statusFilter)}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.statsSection}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{statistics.totalTrips}</Text>
            <Text style={styles.statLabel}>Viajes</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{statistics.totalDistance.toFixed(1)} km</Text>
            <Text style={styles.statLabel}>Distancia</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>₡{statistics.totalCost.toLocaleString('es-CR')}</Text>
            <Text style={styles.statLabel}>Gastado</Text>
          </View>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#65ea06" />
            <Text style={styles.loadingText}>Cargando historial...</Text>
          </View>
        ) : (
          <ScrollView style={styles.tripsList} showsVerticalScrollIndicator={false}>
            {filteredTrips.map((trip) => (
              <TouchableOpacity 
                key={trip.id} 
                style={styles.tripCard}
                onPress={() => handleViewDetails(trip)}
              >
                <View style={styles.tripHeader}>
                  <View style={styles.tripStatus}>
                    {getStatusIcon(trip.status)}
                    <Text style={[styles.tripStatusText, { color: getStatusColor(trip.status) }]}>
                      {trip.status === 'completed' ? 'Completado' : 
                       trip.status === 'cancelled' ? 'Cancelado' : 'En progreso'}
                    </Text>
                  </View>
                  <Text style={styles.tripDate}>
                    {new Date(trip.startTime).toLocaleDateString('es-ES', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </Text>
                </View>

                <View style={styles.tripRoute}>
                  <View style={styles.routePoint}>
                    <Navigation size={16} color="#6b9e47" />
                    <Text style={styles.routeAddress} numberOfLines={1}>
                      {trip.originAddress}
                    </Text>
                  </View>
                  <View style={styles.routeDivider} />
                  <View style={styles.routePoint}>
                    <MapPin size={16} color="#65ea06" />
                    <Text style={styles.routeAddress} numberOfLines={1}>
                      {trip.destinationAddress}
                    </Text>
                  </View>
                </View>

                <View style={styles.tripFooter}>
                  <View style={styles.tripInfo}>
                    <Clock size={14} color="#6b9e47" />
                    <Text style={styles.tripInfoText}>
                      {new Date(trip.startTime).toLocaleTimeString('es-ES', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>
                  </View>
                  <View style={styles.tripInfo}>
                    <DollarSign size={14} color="#6b9e47" />
                    <Text style={styles.tripInfoText}>
                      ₡{(trip.actualCost || 0).toLocaleString('es-CR')}
                    </Text>
                  </View>
                  {trip.rating && (
                    <View style={styles.tripInfo}>
                      <Star size={14} color="#FFD700" fill="#FFD700" />
                      <Text style={styles.tripInfoText}>{trip.rating.toFixed(1)}</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            ))}
            
            {filteredTrips.length === 0 && (
              <View style={styles.emptyState}>
                <Calendar size={48} color="#9CA3AF" />
                <Text style={styles.emptyStateText}>
                  No hay viajes para el período seleccionado
                </Text>
                <TouchableOpacity 
                  style={styles.newTripButton}
                  onPress={() => router.push('/commute')}
                >
                  <Text style={styles.newTripButtonText}>Solicitar viaje</Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        )}
      </View>

      <Modal
        visible={showFilterModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowFilterModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filtrar viajes</Text>
              <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                <X size={24} color="#131c0d" />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.filterSectionTitle}>Período</Text>
            <View style={styles.filterOptions}>
              {(['all', 'month', 'week', 'day'] as FilterPeriod[]).map((filter) => (
                <TouchableOpacity
                  key={filter}
                  style={[
                    styles.filterOption,
                    selectedFilter === filter && styles.filterOptionSelected
                  ]}
                  onPress={() => setSelectedFilter(filter)}
                >
                  <Text style={[
                    styles.filterOptionText,
                    selectedFilter === filter && styles.filterOptionTextSelected
                  ]}>
                    {getFilterLabel(filter)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.filterSectionTitle}>Estado</Text>
            <View style={styles.filterOptions}>
              {(['all', 'completed', 'cancelled'] as FilterStatus[]).map((status) => (
                <TouchableOpacity
                  key={status}
                  style={[
                    styles.filterOption,
                    statusFilter === status && styles.filterOptionSelected
                  ]}
                  onPress={() => setStatusFilter(status)}
                >
                  <Text style={[
                    styles.filterOptionText,
                    statusFilter === status && styles.filterOptionTextSelected
                  ]}>
                    {getStatusLabel(status)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={styles.applyButton}
              onPress={() => setShowFilterModal(false)}
            >
              <Text style={styles.applyButtonText}>Aplicar filtros</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showDetailModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDetailModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.detailModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Detalles del viaje</Text>
              <TouchableOpacity onPress={() => setShowDetailModal(false)}>
                <X size={24} color="#131c0d" />
              </TouchableOpacity>
            </View>
            
            {selectedTrip && (
              <ScrollView style={styles.detailContent}>
                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Estado:</Text>
                  <View style={styles.detailStatusRow}>
                    {getStatusIcon(selectedTrip.status)}
                    <Text style={[styles.detailValue, { color: getStatusColor(selectedTrip.status) }]}>
                      {selectedTrip.status === 'completed' ? 'Completado' : 
                       selectedTrip.status === 'cancelled' ? 'Cancelado' : 'En progreso'}
                    </Text>
                  </View>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Vehículo:</Text>
                  <Text style={styles.detailValue}>{selectedTrip.vehicleName}</Text>
                </View>
                
                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Origen:</Text>
                  <Text style={styles.detailValue}>{selectedTrip.originAddress}</Text>
                </View>
                
                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Destino:</Text>
                  <Text style={styles.detailValue}>{selectedTrip.destinationAddress}</Text>
                </View>
                
                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Fecha y Hora:</Text>
                  <Text style={styles.detailValue}>
                    {new Date(selectedTrip.startTime).toLocaleString('es-ES')}
                  </Text>
                </View>

                {selectedTrip.actualDistance && (
                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>Distancia:</Text>
                    <Text style={styles.detailValue}>
                      {(selectedTrip.actualDistance / 1000).toFixed(2)} km
                    </Text>
                  </View>
                )}

                {selectedTrip.actualDuration && (
                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>Duración:</Text>
                    <Text style={styles.detailValue}>
                      {Math.round(selectedTrip.actualDuration / 60)} minutos
                    </Text>
                  </View>
                )}
                
                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Costo:</Text>
                  <Text style={styles.detailValue}>
                    ₡{(selectedTrip.actualCost || 0).toLocaleString('es-CR')}
                  </Text>
                </View>

                {selectedTrip.paymentMethod && (
                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>Método de pago:</Text>
                    <Text style={styles.detailValue}>{selectedTrip.paymentMethod}</Text>
                  </View>
                )}

                {selectedTrip.rating && (
                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>Tu calificación:</Text>
                    <View style={styles.ratingContainer}>
                      <Star size={20} color="#FFD700" fill="#FFD700" />
                      <Text style={styles.detailValue}>{selectedTrip.rating.toFixed(1)}/5.0</Text>
                    </View>
                  </View>
                )}

                {selectedTrip.review && (
                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>Tu reseña:</Text>
                    <Text style={styles.detailValue}>{selectedTrip.review}</Text>
                  </View>
                )}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fafcf8',
  },
  backButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  filterSection: {
    marginBottom: 16,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  filterButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#131c0d',
  },
  statsSection: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold' as const,
    color: '#65ea06',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b9e47',
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#6b9e47',
  },
  tripsList: {
    flex: 1,
  },
  tripCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tripHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  tripStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tripStatusText: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  tripDate: {
    fontSize: 12,
    color: '#6b9e47',
  },
  tripRoute: {
    gap: 8,
    marginBottom: 12,
  },
  routePoint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  routeAddress: {
    flex: 1,
    fontSize: 14,
    color: '#131c0d',
  },
  routeDivider: {
    width: 2,
    height: 16,
    backgroundColor: '#ecf4e6',
    marginLeft: 7,
  },
  tripFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  tripInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  tripInfoText: {
    fontSize: 13,
    color: '#6b9e47',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 16,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#6b9e47',
    textAlign: 'center',
  },
  newTripButton: {
    backgroundColor: '#65ea06',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  newTripButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#131c0d',
  },
  errorText: {
    fontSize: 18,
    color: '#6b9e47',
    textAlign: 'center',
    marginTop: 100,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  detailModalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold' as const,
    color: '#131c0d',
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#131c0d',
    marginTop: 16,
    marginBottom: 12,
  },
  filterOptions: {
    gap: 12,
  },
  filterOption: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#fafcf8',
    alignItems: 'center',
  },
  filterOptionSelected: {
    backgroundColor: '#65ea06',
  },
  filterOptionText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#6b9e47',
  },
  filterOptionTextSelected: {
    color: '#131c0d',
  },
  applyButton: {
    backgroundColor: '#65ea06',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 24,
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#131c0d',
  },
  detailContent: {
    maxHeight: 500,
  },
  detailSection: {
    marginBottom: 16,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#6b9e47',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    color: '#131c0d',
  },
  detailStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});
