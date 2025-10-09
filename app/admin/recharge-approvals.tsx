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
import { CheckCircle, XCircle, Eye, Clock, DollarSign } from 'lucide-react-native';
import { useAdmin } from '@/contexts/AdminContext';
import type { RechargeApprovalRequest } from '@/Users/adrianromero/Kompa2Go/src/shared/types/kommute-wallet-types';

export default function RechargeApprovalsScreen() {
  const {
    pendingRecharges,
    rechargeStats,
    isLoading,
    error,
    refreshRecharges,
    approveRecharge,
    rejectRecharge
  } = useAdmin();

  const [selectedRecharge, setSelectedRecharge] = useState<RechargeApprovalRequest | null>(null);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [notes, setNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [processing, setProcessing] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshRecharges();
    setRefreshing(false);
  };

  const handleApprove = async () => {
    if (!selectedRecharge) return;

    try {
      setProcessing(true);
      await approveRecharge(selectedRecharge.recharge.id, notes);
      Alert.alert('Éxito', 'Recarga aprobada correctamente');
      setShowApproveModal(false);
      setSelectedRecharge(null);
      setNotes('');
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Error al aprobar recarga');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedRecharge || !rejectionReason.trim()) {
      Alert.alert('Error', 'Debe proporcionar una razón de rechazo');
      return;
    }

    try {
      setProcessing(true);
      await rejectRecharge(selectedRecharge.recharge.id, rejectionReason);
      Alert.alert('Éxito', 'Recarga rechazada correctamente');
      setShowRejectModal(false);
      setSelectedRecharge(null);
      setRejectionReason('');
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Error al rechazar recarga');
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
        <Stack.Screen options={{ title: 'Aprobar Recargas', headerShown: true }} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Cargando recargas...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Aprobar Recargas', headerShown: true }} />
      
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {rechargeStats && (
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Clock size={24} color="#FF9500" />
              <Text style={styles.statValue}>{rechargeStats.totalPending}</Text>
              <Text style={styles.statLabel}>Pendientes</Text>
            </View>
            <View style={styles.statCard}>
              <DollarSign size={24} color="#34C759" />
              <Text style={styles.statValue}>
                {formatCurrency(rechargeStats.totalAmountPending)}
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

        {pendingRecharges.length === 0 ? (
          <View style={styles.emptyContainer}>
            <CheckCircle size={64} color="#34C759" />
            <Text style={styles.emptyTitle}>No hay recargas pendientes</Text>
            <Text style={styles.emptyText}>
              Todas las recargas han sido procesadas
            </Text>
          </View>
        ) : (
          <View style={styles.rechargesContainer}>
            {pendingRecharges.map((request) => (
              <View key={request.recharge.id} style={styles.rechargeCard}>
                <View style={styles.rechargeHeader}>
                  <View style={styles.userInfo}>
                    <Text style={styles.userName}>{request.userInfo.name}</Text>
                    <Text style={styles.userEmail}>{request.userInfo.email}</Text>
                    {request.userInfo.phone && (
                      <Text style={styles.userPhone}>{request.userInfo.phone}</Text>
                    )}
                  </View>
                  <View style={styles.amountBadge}>
                    <Text style={styles.amountText}>
                      {formatCurrency(request.recharge.amount)}
                    </Text>
                  </View>
                </View>

                <View style={styles.rechargeDetails}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Fecha de solicitud:</Text>
                    <Text style={styles.detailValue}>
                      {formatDate(request.recharge.requestedAt)}
                    </Text>
                  </View>
                  {request.recharge.sinpeReference && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Referencia SINPE:</Text>
                      <Text style={styles.detailValue}>
                        {request.recharge.sinpeReference}
                      </Text>
                    </View>
                  )}
                </View>

                {request.recharge.receiptUrl && (
                  <TouchableOpacity
                    style={styles.receiptButton}
                    onPress={() => {
                      setSelectedRecharge(request);
                    }}
                  >
                    <Eye size={20} color="#007AFF" />
                    <Text style={styles.receiptButtonText}>Ver Comprobante</Text>
                  </TouchableOpacity>
                )}

                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.approveButton]}
                    onPress={() => {
                      setSelectedRecharge(request);
                      setShowApproveModal(true);
                    }}
                  >
                    <CheckCircle size={20} color="#FFF" />
                    <Text style={styles.actionButtonText}>Aprobar</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionButton, styles.rejectButton]}
                    onPress={() => {
                      setSelectedRecharge(request);
                      setShowRejectModal(true);
                    }}
                  >
                    <XCircle size={20} color="#FFF" />
                    <Text style={styles.actionButtonText}>Rechazar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <Modal
        visible={showApproveModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowApproveModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Aprobar Recarga</Text>
            <Text style={styles.modalSubtitle}>
              {selectedRecharge && formatCurrency(selectedRecharge.recharge.amount)}
            </Text>
            
            <TextInput
              style={styles.modalInput}
              placeholder="Notas (opcional)"
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={3}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={() => {
                  setShowApproveModal(false);
                  setNotes('');
                }}
                disabled={processing}
              >
                <Text style={styles.modalCancelButtonText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.modalConfirmButton]}
                onPress={handleApprove}
                disabled={processing}
              >
                {processing ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.modalConfirmButtonText}>Aprobar</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showRejectModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowRejectModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Rechazar Recarga</Text>
            <Text style={styles.modalSubtitle}>
              {selectedRecharge && formatCurrency(selectedRecharge.recharge.amount)}
            </Text>
            
            <TextInput
              style={styles.modalInput}
              placeholder="Razón de rechazo *"
              value={rejectionReason}
              onChangeText={setRejectionReason}
              multiline
              numberOfLines={3}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={() => {
                  setShowRejectModal(false);
                  setRejectionReason('');
                }}
                disabled={processing}
              >
                <Text style={styles.modalCancelButtonText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.modalRejectButton]}
                onPress={handleReject}
                disabled={processing}
              >
                {processing ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.modalConfirmButtonText}>Rechazar</Text>
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
  rechargesContainer: {
    padding: 16,
    gap: 16
  },
  rechargeCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  rechargeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16
  },
  userInfo: {
    flex: 1
  },
  userName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000'
  },
  userEmail: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 4
  },
  userPhone: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 2
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
  rechargeDetails: {
    gap: 8,
    marginBottom: 16
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  detailLabel: {
    fontSize: 14,
    color: '#8E8E93'
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000'
  },
  receiptButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    marginBottom: 16,
    gap: 8
  },
  receiptButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF'
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
  approveButton: {
    backgroundColor: '#34C759'
  },
  rejectButton: {
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
    marginBottom: 8
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#8E8E93',
    marginBottom: 16
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    marginBottom: 16,
    minHeight: 80,
    textAlignVertical: 'top'
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
  modalRejectButton: {
    backgroundColor: '#FF3B30'
  },
  modalConfirmButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFF'
  }
});
