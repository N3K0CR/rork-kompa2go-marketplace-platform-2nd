import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Modal,

  Alert,
  ActivityIndicator,
  Linking,
  Platform,
} from 'react-native';
import { Stack, router } from 'expo-router';
import {
  Car,
  DollarSign,
  TrendingUp,
  Star,

  MapPin,
  Navigation,
  Phone,
  X,
  CheckCircle,
  XCircle,
  AlertCircle,
  Wallet,

} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useKommuter } from '@/contexts/KommuterContext';
import type { Trip } from '@/contexts/KommuterContext';

export default function KommuterDashboard() {
  const insets = useSafeAreaInsets();
  const {
    status,
    currentTrip,
    pendingTrips,
    stats,
    loading,
    setStatus,
    acceptTrip,
    rejectTrip,
    startTrip,
    completeTrip,
    cancelTrip,
    loadPendingTrips,
  } = useKommuter();

  const [showTripModal, setShowTripModal] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);

  const [processingAction, setProcessingAction] = useState(false);

  useEffect(() => {
    if (status === 'available') {
      const interval = setInterval(() => {
        loadPendingTrips();
      }, 10000);
      return () => clearInterval(interval);
    }
  }, [status]);

  const handleStatusToggle = async (newStatus: boolean) => {
    try {
      await setStatus(newStatus ? 'available' : 'offline');
    } catch (error) {
      Alert.alert('Error', 'No se pudo cambiar el estado');
    }
  };

  const handleAcceptTrip = async (tripId: string) => {
    try {
      setProcessingAction(true);
      await acceptTrip(tripId);
      setShowTripModal(false);
      Alert.alert('✅ Viaje Aceptado', 'El viaje ha sido asignado a ti');
    } catch (error) {
      Alert.alert('Error', 'No se pudo aceptar el viaje');
    } finally {
      setProcessingAction(false);
    }
  };

  const handleRejectTrip = async (tripId: string) => {
    try {
      setProcessingAction(true);
      await rejectTrip(tripId);
      setShowTripModal(false);
      Alert.alert('Viaje Rechazado', 'El viaje ha sido rechazado');
    } catch (error) {
      Alert.alert('Error', 'No se pudo rechazar el viaje');
    } finally {
      setProcessingAction(false);
    }
  };

  const handleStartTrip = async () => {
    if (!currentTrip) return;
    
    try {
      setProcessingAction(true);
      await startTrip(currentTrip.id);
      Alert.alert('🚗 Viaje Iniciado', 'El viaje ha comenzado');
    } catch (error) {
      Alert.alert('Error', 'No se pudo iniciar el viaje');
    } finally {
      setProcessingAction(false);
    }
  };

  const handleCompleteTrip = async () => {
    if (!currentTrip) return;
    
    Alert.alert(
      '✅ Completar Viaje',
      '¿Confirmas que el viaje ha sido completado?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Completar',
          onPress: async () => {
            try {
              setProcessingAction(true);
              await completeTrip(currentTrip.id);
              Alert.alert('✅ Viaje Completado', 'El viaje ha sido completado exitosamente');
            } catch (error) {
              Alert.alert('Error', 'No se pudo completar el viaje');
            } finally {
              setProcessingAction(false);
            }
          },
        },
      ]
    );
  };

  const handleCancelTrip = async () => {
    if (!currentTrip) return;
    
    Alert.prompt(
      '❌ Cancelar Viaje',
      'Por favor indica el motivo de la cancelación:',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: async (reason) => {
            if (!reason) {
              Alert.alert('Error', 'Debes proporcionar un motivo');
              return;
            }
            try {
              setProcessingAction(true);
              await cancelTrip(currentTrip.id, reason);
              Alert.alert('Viaje Cancelado', 'El viaje ha sido cancelado');
            } catch (error) {
              Alert.alert('Error', 'No se pudo cancelar el viaje');
            } finally {
              setProcessingAction(false);
            }
          },
        },
      ],
      'plain-text'
    );
  };

  const handleNavigate = () => {
    if (!currentTrip) return;
    
    const destination = currentTrip.status === 'accepted' 
      ? currentTrip.pickupLocation 
      : currentTrip.dropoffLocation;
    
    const url = Platform.select({
      ios: `maps:0,0?q=${destination.latitude},${destination.longitude}`,
      android: `geo:0,0?q=${destination.latitude},${destination.longitude}`,
      default: `https://www.google.com/maps/search/?api=1&query=${destination.latitude},${destination.longitude}`,
    });
    
    Linking.openURL(url);
  };

  const handleCallPassenger = () => {
    if (!currentTrip) return;
    Linking.openURL(`tel:${currentTrip.passengerPhone}`);
  };

  const formatCurrency = (amount: number) => {
    return `₡${amount.toLocaleString('es-CR')}`;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#65ea06" />
        <Text style={styles.loadingText}>Cargando...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Panel de Kommuter',
          headerStyle: { backgroundColor: '#65ea06' },
          headerTintColor: '#131c0d',
          headerTitleStyle: { fontWeight: '700' as const },
        }}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.statusSection}>
          <View style={styles.statusHeader}>
            <View>
              <Text style={styles.statusTitle}>Estado</Text>
              <Text style={[styles.statusText, status === 'available' && styles.statusAvailable]}>
                {status === 'available' ? '🟢 Disponible' : '⚫ Desconectado'}
              </Text>
            </View>
            <Switch
              value={status === 'available'}
              onValueChange={handleStatusToggle}
              trackColor={{ false: '#ccc', true: '#65ea06' }}
              thumbColor={status === 'available' ? '#fff' : '#f4f3f4'}
            />
          </View>
          {status === 'available' && (
            <Text style={styles.statusDescription}>
              Estás recibiendo solicitudes de viaje
            </Text>
          )}
        </View>

        {currentTrip && (
          <View style={styles.currentTripSection}>
            <View style={styles.sectionHeader}>
              <Car size={24} color="#65ea06" />
              <Text style={styles.sectionTitle}>Viaje Actual</Text>
            </View>

            <View style={styles.tripCard}>
              <View style={styles.tripHeader}>
                <Text style={styles.passengerName}>{currentTrip.passengerName}</Text>
                <View style={[styles.statusBadge, styles[`status${currentTrip.status}`]]}>
                  <Text style={styles.statusBadgeText}>
                    {currentTrip.status === 'accepted' ? 'Aceptado' : 'En Progreso'}
                  </Text>
                </View>
              </View>

              <View style={styles.tripDetails}>
                <View style={styles.tripDetailRow}>
                  <MapPin size={16} color="#6b9e47" />
                  <View style={styles.tripDetailText}>
                    <Text style={styles.tripDetailLabel}>Recogida:</Text>
                    <Text style={styles.tripDetailValue}>{currentTrip.pickupLocation.address}</Text>
                  </View>
                </View>

                <View style={styles.tripDetailRow}>
                  <MapPin size={16} color="#FF3B30" />
                  <View style={styles.tripDetailText}>
                    <Text style={styles.tripDetailLabel}>Destino:</Text>
                    <Text style={styles.tripDetailValue}>{currentTrip.dropoffLocation.address}</Text>
                  </View>
                </View>

                <View style={styles.tripMetrics}>
                  <View style={styles.tripMetric}>
                    <Text style={styles.tripMetricLabel}>Distancia</Text>
                    <Text style={styles.tripMetricValue}>{currentTrip.distance.toFixed(1)} km</Text>
                  </View>
                  <View style={styles.tripMetric}>
                    <Text style={styles.tripMetricLabel}>Duración</Text>
                    <Text style={styles.tripMetricValue}>{Math.round(currentTrip.estimatedDuration)} min</Text>
                  </View>
                  <View style={styles.tripMetric}>
                    <Text style={styles.tripMetricLabel}>Tarifa</Text>
                    <Text style={styles.tripMetricValue}>{formatCurrency(currentTrip.price)}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.tripActions}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={handleNavigate}
                >
                  <Navigation size={20} color="#007AFF" />
                  <Text style={styles.actionButtonText}>Navegar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={handleCallPassenger}
                >
                  <Phone size={20} color="#34C759" />
                  <Text style={styles.actionButtonText}>Llamar</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.tripMainActions}>
                {currentTrip.status === 'accepted' && (
                  <TouchableOpacity
                    style={styles.startTripButton}
                    onPress={handleStartTrip}
                    disabled={processingAction}
                  >
                    <Text style={styles.startTripButtonText}>
                      {processingAction ? 'Procesando...' : 'Iniciar Viaje'}
                    </Text>
                  </TouchableOpacity>
                )}

                {currentTrip.status === 'in_progress' && (
                  <TouchableOpacity
                    style={styles.completeTripButton}
                    onPress={handleCompleteTrip}
                    disabled={processingAction}
                  >
                    <CheckCircle size={20} color="#fff" />
                    <Text style={styles.completeTripButtonText}>
                      {processingAction ? 'Procesando...' : 'Completar Viaje'}
                    </Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={styles.cancelTripButton}
                  onPress={handleCancelTrip}
                  disabled={processingAction}
                >
                  <XCircle size={20} color="#fff" />
                  <Text style={styles.cancelTripButtonText}>Cancelar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        <View style={styles.statsSection}>
          <View style={styles.sectionHeader}>
            <TrendingUp size={24} color="#65ea06" />
            <Text style={styles.sectionTitle}>Estadísticas</Text>
          </View>

          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <DollarSign size={24} color="#34C759" />
              <Text style={styles.statValue}>{formatCurrency(stats.todayEarnings)}</Text>
              <Text style={styles.statLabel}>Hoy</Text>
            </View>

            <View style={styles.statCard}>
              <DollarSign size={24} color="#007AFF" />
              <Text style={styles.statValue}>{formatCurrency(stats.weekEarnings)}</Text>
              <Text style={styles.statLabel}>Esta Semana</Text>
            </View>

            <View style={styles.statCard}>
              <DollarSign size={24} color="#FF9500" />
              <Text style={styles.statValue}>{formatCurrency(stats.monthEarnings)}</Text>
              <Text style={styles.statLabel}>Este Mes</Text>
            </View>

            <View style={styles.statCard}>
              <Car size={24} color="#65ea06" />
              <Text style={styles.statValue}>{stats.completedTrips}</Text>
              <Text style={styles.statLabel}>Viajes Completados</Text>
            </View>

            <View style={styles.statCard}>
              <Star size={24} color="#FFD700" />
              <Text style={styles.statValue}>{stats.averageRating.toFixed(1)}</Text>
              <Text style={styles.statLabel}>Calificación</Text>
            </View>

            <View style={styles.statCard}>
              <CheckCircle size={24} color="#34C759" />
              <Text style={styles.statValue}>{(stats.acceptanceRate * 100).toFixed(0)}%</Text>
              <Text style={styles.statLabel}>Aceptación</Text>
            </View>
          </View>
        </View>

        <View style={styles.earningsSection}>
          <View style={styles.sectionHeader}>
            <Wallet size={24} color="#34C759" />
            <Text style={styles.sectionTitle}>Ganancias Disponibles</Text>
          </View>

          <View style={styles.earningsCard}>
            <Text style={styles.earningsAmount}>{formatCurrency(stats.totalEarnings)}</Text>
            <Text style={styles.earningsDescription}>
              Los retiros se procesan automáticamente todos los días a la 1:00 PM
            </Text>
            <TouchableOpacity
              style={styles.withdrawButton}
              onPress={() => Alert.alert('Retiro de Ganancias', 'Funcionalidad en desarrollo. Los retiros se procesarán automáticamente a la 1:00 PM.')}
            >
              <Wallet size={20} color="#fff" />
              <Text style={styles.withdrawButtonText}>Solicitar Retiro</Text>
            </TouchableOpacity>
          </View>
        </View>

        {status === 'available' && pendingTrips.length > 0 && (
          <View style={styles.pendingTripsSection}>
            <View style={styles.sectionHeader}>
              <AlertCircle size={24} color="#FF9500" />
              <Text style={styles.sectionTitle}>Viajes Disponibles</Text>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{pendingTrips.length}</Text>
              </View>
            </View>

            {pendingTrips.slice(0, 3).map((trip) => (
              <TouchableOpacity
                key={trip.id}
                style={styles.pendingTripCard}
                onPress={() => {
                  setSelectedTrip(trip);
                  setShowTripModal(true);
                }}
              >
                <View style={styles.pendingTripHeader}>
                  <Text style={styles.pendingTripPrice}>{formatCurrency(trip.price)}</Text>
                  <Text style={styles.pendingTripDistance}>{trip.distance.toFixed(1)} km</Text>
                </View>
                <Text style={styles.pendingTripAddress} numberOfLines={1}>
                  📍 {trip.pickupLocation.address}
                </Text>
                <Text style={styles.pendingTripAddress} numberOfLines={1}>
                  🎯 {trip.dropoffLocation.address}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      <Modal
        visible={showTripModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowTripModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Solicitud de Viaje</Text>
              <TouchableOpacity onPress={() => setShowTripModal(false)}>
                <X size={24} color="#666" />
              </TouchableOpacity>
            </View>

            {selectedTrip && (
              <>
                <View style={styles.modalTripDetails}>
                  <View style={styles.modalTripRow}>
                    <Text style={styles.modalTripLabel}>Pasajero:</Text>
                    <Text style={styles.modalTripValue}>{selectedTrip.passengerName}</Text>
                  </View>

                  <View style={styles.modalTripRow}>
                    <Text style={styles.modalTripLabel}>Recogida:</Text>
                    <Text style={styles.modalTripValue}>{selectedTrip.pickupLocation.address}</Text>
                  </View>

                  <View style={styles.modalTripRow}>
                    <Text style={styles.modalTripLabel}>Destino:</Text>
                    <Text style={styles.modalTripValue}>{selectedTrip.dropoffLocation.address}</Text>
                  </View>

                  <View style={styles.modalTripMetrics}>
                    <View style={styles.modalTripMetric}>
                      <Text style={styles.modalTripMetricLabel}>Distancia</Text>
                      <Text style={styles.modalTripMetricValue}>{selectedTrip.distance.toFixed(1)} km</Text>
                    </View>
                    <View style={styles.modalTripMetric}>
                      <Text style={styles.modalTripMetricLabel}>Duración</Text>
                      <Text style={styles.modalTripMetricValue}>{Math.round(selectedTrip.estimatedDuration)} min</Text>
                    </View>
                    <View style={styles.modalTripMetric}>
                      <Text style={styles.modalTripMetricLabel}>Tarifa</Text>
                      <Text style={styles.modalTripMetricValue}>{formatCurrency(selectedTrip.price)}</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={styles.rejectButton}
                    onPress={() => handleRejectTrip(selectedTrip.id)}
                    disabled={processingAction}
                  >
                    <XCircle size={20} color="#fff" />
                    <Text style={styles.rejectButtonText}>
                      {processingAction ? 'Procesando...' : 'Rechazar'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.acceptButton}
                    onPress={() => handleAcceptTrip(selectedTrip.id)}
                    disabled={processingAction}
                  >
                    <CheckCircle size={20} color="#fff" />
                    <Text style={styles.acceptButtonText}>
                      {processingAction ? 'Procesando...' : 'Aceptar'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fafcf8',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6b9e47',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 20,
  },
  statusSection: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#6b9e47',
    marginBottom: 4,
  },
  statusText: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#999',
  },
  statusAvailable: {
    color: '#34C759',
  },
  statusDescription: {
    fontSize: 14,
    color: '#6b9e47',
  },
  currentTripSection: {
    gap: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#131c0d',
    flex: 1,
  },
  tripCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: '#65ea06',
  },
  tripHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  passengerName: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#131c0d',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusaccepted: {
    backgroundColor: '#007AFF',
  },
  statusin_progress: {
    backgroundColor: '#34C759',
  },
  statuspending: {
    backgroundColor: '#FF9500',
  },
  statuscompleted: {
    backgroundColor: '#34C759',
  },
  statuscancelled: {
    backgroundColor: '#FF3B30',
  },
  statusBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700' as const,
  },
  tripDetails: {
    gap: 12,
    marginBottom: 16,
  },
  tripDetailRow: {
    flexDirection: 'row',
    gap: 12,
  },
  tripDetailText: {
    flex: 1,
  },
  tripDetailLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#6b9e47',
    marginBottom: 2,
  },
  tripDetailValue: {
    fontSize: 14,
    color: '#131c0d',
  },
  tripMetrics: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  tripMetric: {
    flex: 1,
    backgroundColor: '#f8fff4',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  tripMetricLabel: {
    fontSize: 12,
    color: '#6b9e47',
    marginBottom: 4,
  },
  tripMetricValue: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#131c0d',
  },
  tripActions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#f8fff4',
    padding: 12,
    borderRadius: 12,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#131c0d',
  },
  tripMainActions: {
    gap: 12,
  },
  startTripButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  startTripButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700' as const,
  },
  completeTripButton: {
    backgroundColor: '#34C759',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    borderRadius: 12,
  },
  completeTripButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700' as const,
  },
  cancelTripButton: {
    backgroundColor: '#FF3B30',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 12,
  },
  cancelTripButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600' as const,
  },
  statsSection: {
    gap: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '30%',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#131c0d',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b9e47',
    textAlign: 'center',
  },
  earningsSection: {
    gap: 12,
  },
  earningsCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  earningsAmount: {
    fontSize: 36,
    fontWeight: '700' as const,
    color: '#34C759',
    marginBottom: 8,
  },
  earningsDescription: {
    fontSize: 14,
    color: '#6b9e47',
    textAlign: 'center',
    marginBottom: 16,
  },
  withdrawButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#34C759',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  withdrawButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700' as const,
  },
  pendingTripsSection: {
    gap: 12,
  },
  badge: {
    backgroundColor: '#FF9500',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 24,
    alignItems: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700' as const,
  },
  pendingTripCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9500',
  },
  pendingTripHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  pendingTripPrice: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#34C759',
  },
  pendingTripDistance: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#6b9e47',
  },
  pendingTripAddress: {
    fontSize: 14,
    color: '#131c0d',
    marginBottom: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#131c0d',
  },
  modalTripDetails: {
    gap: 16,
    marginBottom: 24,
  },
  modalTripRow: {
    gap: 4,
  },
  modalTripLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#6b9e47',
  },
  modalTripValue: {
    fontSize: 15,
    color: '#131c0d',
  },
  modalTripMetrics: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  modalTripMetric: {
    flex: 1,
    backgroundColor: '#f8fff4',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalTripMetricLabel: {
    fontSize: 12,
    color: '#6b9e47',
    marginBottom: 4,
  },
  modalTripMetricValue: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#131c0d',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  rejectButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FF3B30',
    padding: 16,
    borderRadius: 12,
  },
  rejectButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700' as const,
  },
  acceptButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#34C759',
    padding: 16,
    borderRadius: 12,
  },
  acceptButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700' as const,
  },
});
