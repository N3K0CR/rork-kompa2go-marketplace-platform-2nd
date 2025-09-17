import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert, Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { usePendingPayments } from '@/contexts/PendingPaymentsContext';
import { ArrowLeft, CheckCircle, XCircle, Eye, Clock, DollarSign, User, Calendar } from 'lucide-react-native';
import { router } from 'expo-router';
import { Stack } from 'expo-router';
import FloatingKompi from '@/components/FloatingKompi';

interface PendingPayment {
  id: string;
  userId?: string;
  userName?: string;
  userEmail?: string;
  amount: number;
  paymentMethod: 'sinpe' | 'kash';
  proofImage: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  type: 'booking_pass' | 'reservation_plan';
  planId?: string;
  planName?: string;
}

export default function PendingPaymentsScreen() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { 
    pendingPayments: payments, 
    loading, 
    updatePaymentStatus: updateStatus,
    markAsChecked,
    getPendingCount,
    getProcessedCount
  } = usePendingPayments();
  const [selectedPayment, setSelectedPayment] = useState<PendingPayment | null>(null);
  const [showImageModal, setShowImageModal] = useState(false);

  useEffect(() => {
    // Mark payments as checked when admin visits the page
    if (user?.userType === 'admin') {
      markAsChecked();
    }
  }, [user, markAsChecked]);

  const updatePaymentStatus = async (paymentId: string, status: 'approved' | 'rejected') => {
    try {
      const success = await updateStatus(paymentId, status);
      if (success) {
        Alert.alert(
          'Estado Actualizado',
          `El pago ha sido ${status === 'approved' ? 'aprobado' : 'rechazado'} exitosamente.`,
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('Error', 'No se pudo actualizar el estado del pago.');
      }
    } catch (error) {
      console.error('Error updating payment status:', error);
      Alert.alert('Error', 'No se pudo actualizar el estado del pago.');
    }
  };

  const handleApprove = (payment: PendingPayment) => {
    Alert.alert(
      'Aprobar Pago',
      `¿Estás seguro de que quieres aprobar el pago de ₡${payment.amount} de ${payment.userName}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Aprobar', 
          style: 'default',
          onPress: () => updatePaymentStatus(payment.id, 'approved')
        }
      ]
    );
  };

  const handleReject = (payment: PendingPayment) => {
    Alert.alert(
      'Rechazar Pago',
      `¿Estás seguro de que quieres rechazar el pago de ₡${payment.amount} de ${payment.userName}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Rechazar', 
          style: 'destructive',
          onPress: () => updatePaymentStatus(payment.id, 'rejected')
        }
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#FF9800';
      case 'approved': return '#4CAF50';
      case 'rejected': return '#F44336';
      default: return '#666';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Pendiente';
      case 'approved': return 'Aprobado';
      case 'rejected': return 'Rechazado';
      default: return status;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const pendingPayments = payments.filter(p => p.status === 'pending');
  const processedPayments = payments.filter(p => p.status !== 'pending');

  if (user?.userType !== 'admin') {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Acceso denegado. Solo administradores pueden ver esta página.</Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen 
        options={{
          title: 'Pagos Pendientes',
          headerStyle: { backgroundColor: '#D81B60' },
          headerTintColor: 'white',
          headerTitleStyle: { fontWeight: 'bold' },
        }} 
      />
      
      <View style={styles.container}>
        <LinearGradient
          colors={['#D81B60', '#E91E63']}
          style={styles.header}
        >
          <Text style={styles.headerTitle}>Pagos Pendientes</Text>
          <Text style={styles.headerSubtitle}>
            {pendingPayments.length} pago(s) requieren atención urgente
          </Text>
        </LinearGradient>

        <ScrollView style={styles.scrollView}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Cargando pagos...</Text>
            </View>
          ) : (
            <View style={styles.content}>
              {/* Pending Payments Section */}
              {pendingPayments.length > 0 && (
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <Clock size={20} color="#FF9800" />
                    <Text style={styles.sectionTitle}>Pagos Pendientes ({pendingPayments.length})</Text>
                  </View>
                  
                  {pendingPayments.map((payment) => (
                    <View key={payment.id} style={[styles.paymentCard, styles.urgentCard]}>
                      <View style={styles.paymentHeader}>
                        <View style={styles.paymentInfo}>
                          <Text style={styles.paymentAmount}>₡{payment.amount.toLocaleString()}</Text>
                          <Text style={styles.paymentMethod}>
                            {payment.paymentMethod.toUpperCase()}
                          </Text>
                        </View>
                        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(payment.status) }]}>
                          <Text style={styles.statusText}>{getStatusText(payment.status)}</Text>
                        </View>
                      </View>
                      
                      <View style={styles.paymentDetails}>
                        <View style={styles.detailRow}>
                          <User size={16} color="#666" />
                          <Text style={styles.detailText}>{payment.userName}</Text>
                        </View>
                        <View style={styles.detailRow}>
                          <Calendar size={16} color="#666" />
                          <Text style={styles.detailText}>{formatDate(payment.createdAt)}</Text>
                        </View>
                        <View style={styles.detailRow}>
                          <Text style={styles.detailText}>
                            {payment.type === 'booking_pass' ? 'Pase de Reserva' : 'Plan de Reservas'}
                            {payment.planName && ` - ${payment.planName}`}
                          </Text>
                        </View>
                      </View>
                      
                      <View style={styles.paymentActions}>
                        <TouchableOpacity
                          style={styles.viewImageButton}
                          onPress={() => {
                            setSelectedPayment(payment);
                            setShowImageModal(true);
                          }}
                        >
                          <Eye size={16} color="#2196F3" />
                          <Text style={styles.viewImageText}>Ver Comprobante</Text>
                        </TouchableOpacity>
                        
                        <View style={styles.actionButtons}>
                          <TouchableOpacity
                            style={styles.rejectButton}
                            onPress={() => handleReject(payment)}
                          >
                            <XCircle size={16} color="white" />
                            <Text style={styles.rejectButtonText}>Rechazar</Text>
                          </TouchableOpacity>
                          
                          <TouchableOpacity
                            style={styles.approveButton}
                            onPress={() => handleApprove(payment)}
                          >
                            <CheckCircle size={16} color="white" />
                            <Text style={styles.approveButtonText}>Aprobar</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              )}

              {/* Processed Payments Section */}
              {processedPayments.length > 0 && (
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <CheckCircle size={20} color="#4CAF50" />
                    <Text style={styles.sectionTitle}>Pagos Procesados ({processedPayments.length})</Text>
                  </View>
                  
                  {processedPayments.map((payment) => (
                    <View key={payment.id} style={styles.paymentCard}>
                      <View style={styles.paymentHeader}>
                        <View style={styles.paymentInfo}>
                          <Text style={styles.paymentAmount}>₡{payment.amount.toLocaleString()}</Text>
                          <Text style={styles.paymentMethod}>
                            {payment.paymentMethod.toUpperCase()}
                          </Text>
                        </View>
                        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(payment.status) }]}>
                          <Text style={styles.statusText}>{getStatusText(payment.status)}</Text>
                        </View>
                      </View>
                      
                      <View style={styles.paymentDetails}>
                        <View style={styles.detailRow}>
                          <User size={16} color="#666" />
                          <Text style={styles.detailText}>{payment.userName}</Text>
                        </View>
                        <View style={styles.detailRow}>
                          <Calendar size={16} color="#666" />
                          <Text style={styles.detailText}>{formatDate(payment.createdAt)}</Text>
                        </View>
                        <View style={styles.detailRow}>
                          <Text style={styles.detailText}>
                            {payment.type === 'booking_pass' ? 'Pase de Reserva' : 'Plan de Reservas'}
                            {payment.planName && ` - ${payment.planName}`}
                          </Text>
                        </View>
                      </View>
                      
                      <TouchableOpacity
                        style={styles.viewImageButton}
                        onPress={() => {
                          setSelectedPayment(payment);
                          setShowImageModal(true);
                        }}
                      >
                        <Eye size={16} color="#2196F3" />
                        <Text style={styles.viewImageText}>Ver Comprobante</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}

              {payments.length === 0 && (
                <View style={styles.emptyState}>
                  <DollarSign size={48} color="#CCC" />
                  <Text style={styles.emptyText}>No hay pagos registrados</Text>
                  <Text style={styles.emptySubtext}>
                    Los comprobantes de pago aparecerán aquí cuando los clientes los envíen.
                  </Text>
                </View>
              )}
            </View>
          )}
        </ScrollView>

        {/* Image Modal */}
        <Modal
          visible={showImageModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowImageModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.imageModalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Comprobante de Pago</Text>
                <TouchableOpacity
                  onPress={() => setShowImageModal(false)}
                  style={styles.closeButton}
                >
                  <Text style={styles.closeButtonText}>✕</Text>
                </TouchableOpacity>
              </View>
              
              {selectedPayment && (
                <>
                  <View style={styles.paymentSummary}>
                    <Text style={styles.summaryText}>Cliente: {selectedPayment.userName}</Text>
                    <Text style={styles.summaryText}>Monto: ₡{selectedPayment.amount.toLocaleString()}</Text>
                    <Text style={styles.summaryText}>Método: {selectedPayment.paymentMethod.toUpperCase()}</Text>
                    <Text style={styles.summaryText}>Tipo: {selectedPayment.type === 'booking_pass' ? 'Pase de Reserva' : 'Plan de Reservas'}</Text>
                    {selectedPayment.planName && (
                      <Text style={styles.summaryText}>Plan: {selectedPayment.planName}</Text>
                    )}
                    <Text style={styles.summaryText}>Fecha: {formatDate(selectedPayment.createdAt)}</Text>
                  </View>
                  
                  <Image 
                    source={{ uri: selectedPayment.proofImage }} 
                    style={styles.proofImage}
                    resizeMode="contain"
                  />
                  
                  {selectedPayment.status === 'pending' && (
                    <View style={styles.modalActions}>
                      <TouchableOpacity
                        style={styles.modalRejectButton}
                        onPress={() => {
                          setShowImageModal(false);
                          setTimeout(() => handleReject(selectedPayment), 300);
                        }}
                      >
                        <Text style={styles.modalRejectText}>Rechazar</Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity
                        style={styles.modalApproveButton}
                        onPress={() => {
                          setShowImageModal(false);
                          setTimeout(() => handleApprove(selectedPayment), 300);
                        }}
                      >
                        <Text style={styles.modalApproveText}>Aprobar</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </>
              )}
            </View>
          </View>
        </Modal>
        <FloatingKompi isVisible={true} />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    paddingTop: 20,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
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
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  paymentCard: {
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
  urgentCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  paymentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  paymentInfo: {
    flex: 1,
  },
  paymentAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  paymentMethod: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  paymentDetails: {
    marginBottom: 16,
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
  },
  paymentActions: {
    gap: 12,
  },
  viewImageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2196F3',
    gap: 8,
  },
  viewImageText: {
    color: '#2196F3',
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  rejectButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#F44336',
    gap: 6,
  },
  rejectButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  approveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#4CAF50',
    gap: 6,
  },
  approveButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: 'white',
    borderRadius: 16,
    marginTop: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#F44336',
    textAlign: 'center',
    margin: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  imageModalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 400,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: 18,
    color: '#666',
  },
  paymentSummary: {
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    gap: 4,
  },
  summaryText: {
    fontSize: 14,
    color: '#333',
  },
  proofImage: {
    width: '100%',
    height: 300,
    borderRadius: 8,
    marginBottom: 16,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalRejectButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    backgroundColor: '#F44336',
    alignItems: 'center',
  },
  modalRejectText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  modalApproveButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    backgroundColor: '#4CAF50',
    alignItems: 'center',
  },
  modalApproveText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
});