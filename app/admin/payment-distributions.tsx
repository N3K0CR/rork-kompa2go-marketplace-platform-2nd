import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { Stack } from 'expo-router';
import { CheckCircle, XCircle, Clock, DollarSign, Calendar } from 'lucide-react-native';
import { useAdmin } from '@/contexts/AdminContext';

export default function PaymentDistributionsScreen() {
  const {
    pendingDistributions,
    distributionStats,
    isLoading,
    error,
    refreshDistributions,
    completeDistribution,
    failDistribution
  } = useAdmin();

  const [selectedDistribution, setSelectedDistribution] = useState<string | null>(null);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [showFailModal, setShowFailModal] = useState(false);
  const [sinpeReference, setSinpeReference] = useState('');
  const [failureReason, setFailureReason] = useState('');
  const [processing, setProcessing] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshDistributions();
    setRefreshing(false);
  };

  const handleComplete = async () => {
    if (!selectedDistribution || !sinpeReference.trim()) {
      Alert.alert('Error', 'Debe proporcionar la referencia SINPE');
      return;
    }

    try {
      setProcessing(true);
      await completeDistribution(selectedDistribution, sinpeReference);
      Alert.alert('Éxito', 'Distribución completada correctamente');
      setShowCompleteModal(false);
      setSelectedDistribution(null);
      setSinpeReference('');
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Error al completar distribución');
    } finally {
      setProcessing(false);
    }
  };

  const handleFail = async () => {
    if (!selectedDistribution || !failureReason.trim()) {
      Alert.alert('Error', 'Debe proporcionar una razón de fallo');
      return;
    }

    try {
      setProcessing(true);
      await failDistribution(selectedDistribution, failureReason);
      Alert.alert('Éxito', 'Distribución marcada como fallida');
      setShowFailModal(false);
      setSelectedDistribution(null);
      setFailureReason('');
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Error al marcar distribución como fallida');
    } finally {
      setProcessing(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return `₡${amount.toLocaleString('es-CR')}`;
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString('es-CR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: 'Distribuciones de Pago', headerShown: true }} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Cargando distribuciones...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Distribuciones de Pago', headerShown: true }} />
      
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {distributionStats && (
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Clock size={24} color="#FF9500" />
              <Text style={styles.statValue}>{distributionStats.totalPending}</Text>
              <Text style={styles.statLabel}>Pendientes</Text>
            </View>
            <View style={styles.statCard}>
              <DollarSign size={24} color="#34C759" />
              <Text style={styles.statValue}>
                {formatCurrency(distributionStats.totalAmountPending)}
              </Text>
              <Text style={styles.statLabel}>Monto Total</Text>
            </View>
          </View>
        )}

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {pendingDistributions.length === 0 ? (
          <View style={styles.emptyContainer}>
            <CheckCircle size={64} color="#34C759" />
            <Text style={styles.emptyTitle}>No hay distribuciones pendientes</Text>
            <Text style={styles.emptyText}>
              Todas las distribuciones han sido procesadas
            </Text>
          </View>
        ) : (
          <View style={styles.distributionsContainer}>
            {pendingDistributions.map((distribution) => (
              <View key={distribution.id} style={styles.distributionCard}>
                <View style={styles.distributionHeader}>
                  <View style={styles.distributionInfo}>
                    <Text style={styles.distributionId}>ID: {distribution.id.slice(0, 8)}</Text>
                    <Text style={styles.kommuterId}>Kommuter: {distribution.kommuterId}</Text>
                  </View>
                  <View style={styles.amountBadge}>
                    <Text style={styles.amountText}>
                      {formatCurrency(distribution.amount)}
                    </Text>
                  </View>
                </View>

                <View style={styles.distributionDetails}>
                  <View style={styles.detailRow}>
                    <Calendar size={16} color="#8E8E93" />
                    <Text style={styles.detailLabel}>Programado para:</Text>
                    <Text style={styles.detailValue}>
                      {formatDate(distribution.scheduledFor)}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Viaje ID:</Text>
                    <Text style={styles.detailValue}>{distribution.tripId.slice(0, 8)}</Text>
                  </View>
                </View>

                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.completeButton]}
                    onPress={() => {
                      setSelectedDistribution(distribution.id);
                      setShowCompleteModal(true);
                    }}
                  >
                    <CheckCircle size={20} color="#FFF" />
                    <Text style={styles.actionButtonText}>Completar</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionButton, styles.failButton]}
                    onPress={() => {
                      setSelectedDistribution(distribution.id);
                      setShowFailModal(true);
                    }}
                  >
                    <XCircle size={20} color="#FFF" />
                    <Text style={styles.actionButtonText}>Marcar Fallida</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <Modal
        visible={showCompleteModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCompleteModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Completar Distribución</Text>
            
            <TextInput
              style={styles.modalInput}
              placeholder="Referencia SINPE *"
              value={sinpeReference}
              onChangeText={setSinpeReference}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={() => {
                  setShowCompleteModal(false);
                  setSinpeReference('');
                }}
                disabled={processing}
              >
                <Text style={styles.modalCancelButtonText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.modalConfirmButton]}
                onPress={handleComplete}
                disabled={processing}
              >
                {processing ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.modalConfirmButtonText}>Completar</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showFailModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowFailModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Marcar como Fallida</Text>
            
            <TextInput
              style={styles.modalInput}
              placeholder="Razón del fallo *"
              value={failureReason}
              onChangeText={setFailureReason}
              multiline
              numberOfLines={3}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={() => {
                  setShowFailModal(false);
                  setFailureReason('');
                }}
                disabled={processing}
              >
                <Text style={styles.modalCancelButtonText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.modalFailButton]}
                onPress={handleFail}
                disabled={processing}
              >
                {processing ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.modalConfirmButtonText}>Marcar Fallida</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7'
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#8E8E93'
  },
  scrollView: {
    flex: 1
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
    marginTop: 8
  },
  statLabel: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 4
  },
  errorContainer: {
    margin: 16,
    padding: 16,
    backgroundColor: '#FFEBEE',
    borderRadius: 12
  },
  errorText: {
    color: '#C62828',
    fontSize: 14
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    marginTop: 64
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
    marginTop: 16
  },
  emptyText: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 8,
    textAlign: 'center'
  },
  distributionsContainer: {
    padding: 16,
    gap: 16
  },
  distributionCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  distributionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16
  },
  distributionInfo: {
    flex: 1
  },
  distributionId: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8E8E93'
  },
  kommuterId: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
    marginTop: 4
  },
  amountBadge: {
    backgroundColor: '#34C759',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6
  },
  amountText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF'
  },
  distributionDetails: {
    gap: 8,
    marginBottom: 16
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  detailLabel: {
    fontSize: 14,
    color: '#8E8E93'
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    flex: 1
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 8
  },
  completeButton: {
    backgroundColor: '#34C759'
  },
  failButton: {
    backgroundColor: '#FF3B30'
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFF'
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
    marginBottom: 16
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    marginBottom: 16,
    minHeight: 44
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center'
  },
  modalCancelButton: {
    backgroundColor: '#F2F2F7'
  },
  modalCancelButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000'
  },
  modalConfirmButton: {
    backgroundColor: '#34C759'
  },
  modalFailButton: {
    backgroundColor: '#FF3B30'
  },
  modalConfirmButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFF'
  }
});
