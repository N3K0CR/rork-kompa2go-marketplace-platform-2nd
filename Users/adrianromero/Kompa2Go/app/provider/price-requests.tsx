import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { Stack } from 'expo-router';
import { useProvider } from '@/contexts/ProviderContext';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  DollarSign,
  ExternalLink,
  Plus,
} from 'lucide-react-native';

export default function PriceRequestsScreen() {
  const { 
    modificationRequests, 
    services,
    profile,
    requestPriceModification,
    loading 
  } = useProvider();

  const [showNewRequestModal, setShowNewRequestModal] = useState(false);
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [priceUpdateUrl, setPriceUpdateUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleCreateRequest = async () => {
    if (!selectedServiceId) {
      Alert.alert('Error', 'Selecciona un servicio');
      return;
    }

    if (!newPrice || parseFloat(newPrice) <= 0) {
      Alert.alert('Error', 'Ingresa un precio válido');
      return;
    }

    if (!priceUpdateUrl.trim()) {
      Alert.alert('Error', 'Proporciona el enlace a tu página con el precio actualizado');
      return;
    }

    if (!profile) {
      Alert.alert('Error', 'No se encontró el perfil del proveedor');
      return;
    }

    const service = services.find(s => s.id === selectedServiceId);
    if (!service) {
      Alert.alert('Error', 'Servicio no encontrado');
      return;
    }

    try {
      setSubmitting(true);
      await requestPriceModification(
        profile.userId,
        service.id,
        service.name,
        service.price,
        parseFloat(newPrice),
        priceUpdateUrl.trim()
      );

      Alert.alert(
        'Solicitud Enviada',
        'Tu solicitud de modificación de precio ha sido enviada. Puede tomar hasta 2 días hábiles para procesarse.'
      );

      setShowNewRequestModal(false);
      setSelectedServiceId('');
      setNewPrice('');
      setPriceUpdateUrl('');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'No se pudo enviar la solicitud');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return '#10B981';
      case 'pending':
        return '#F59E0B';
      case 'rejected':
        return '#EF4444';
      default:
        return '#6B7280';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved':
        return 'Aprobada';
      case 'pending':
        return 'Pendiente';
      case 'rejected':
        return 'Rechazada';
      default:
        return status;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle size={20} color="#10B981" />;
      case 'pending':
        return <Clock size={20} color="#F59E0B" />;
      case 'rejected':
        return <XCircle size={20} color="#EF4444" />;
      default:
        return <AlertCircle size={20} color="#6B7280" />;
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading && modificationRequests.length === 0) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: 'Solicitudes de Precio' }} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Cargando solicitudes...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: 'Solicitudes de Precio',
          headerRight: () => (
            <TouchableOpacity
              onPress={() => setShowNewRequestModal(true)}
              style={styles.addButton}
            >
              <Plus size={24} color="#007AFF" />
            </TouchableOpacity>
          ),
        }} 
      />
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {modificationRequests.length === 0 ? (
          <View style={styles.emptyContainer}>
            <DollarSign size={64} color="#999" />
            <Text style={styles.emptyTitle}>No hay solicitudes</Text>
            <Text style={styles.emptyText}>
              Crea una solicitud para modificar el precio de un servicio
            </Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => setShowNewRequestModal(true)}
            >
              <Plus size={20} color="#FFFFFF" />
              <Text style={styles.emptyButtonText}>Nueva Solicitud</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.requestsContainer}>
            <View style={styles.infoBox}>
              <AlertCircle size={20} color="#3B82F6" />
              <Text style={styles.infoText}>
                Las modificaciones de precio pueden tomar hasta 2 días hábiles para procesarse.
              </Text>
            </View>

            {modificationRequests.map((request: any) => (
              <View key={request.id} style={styles.requestCard}>
                <View style={styles.requestHeader}>
                  <Text style={styles.serviceName}>{request.serviceName}</Text>
                  <View style={styles.statusBadge}>
                    {getStatusIcon(request.status)}
                    <Text style={[styles.statusText, { color: getStatusColor(request.status) }]}>
                      {getStatusText(request.status)}
                    </Text>
                  </View>
                </View>

                <View style={styles.priceComparison}>
                  <View style={styles.priceBox}>
                    <Text style={styles.priceLabel}>Precio Anterior</Text>
                    <Text style={styles.oldPrice}>
                      ${request.oldPrice.toFixed(2)}
                    </Text>
                  </View>

                  <View style={styles.arrow}>
                    <Text style={styles.arrowText}>→</Text>
                  </View>

                  <View style={styles.priceBox}>
                    <Text style={styles.priceLabel}>Precio Nuevo</Text>
                    <Text style={styles.newPrice}>
                      ${request.newPrice.toFixed(2)}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.urlButton}
                  onPress={() => {
                    Alert.alert(
                      'Enlace de Actualización',
                      request.priceUpdateUrl,
                      [{ text: 'Cerrar' }]
                    );
                  }}
                >
                  <ExternalLink size={16} color="#007AFF" />
                  <Text style={styles.urlButtonText}>Ver enlace de actualización</Text>
                </TouchableOpacity>

                <View style={styles.requestFooter}>
                  <Text style={styles.dateText}>
                    Solicitado: {formatDate(request.createdAt)}
                  </Text>
                  {request.processedAt && (
                    <Text style={styles.dateText}>
                      Procesado: {formatDate(request.processedAt)}
                    </Text>
                  )}
                </View>

                {request.notes && (
                  <View style={styles.notesBox}>
                    <Text style={styles.notesLabel}>Notas del Administrador:</Text>
                    <Text style={styles.notesText}>{request.notes}</Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <Modal
        visible={showNewRequestModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowNewRequestModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Nueva Solicitud de Precio</Text>

            <View style={styles.modalForm}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Servicio *</Text>
                <ScrollView style={styles.servicesList}>
                  {services.filter((s: any) => s.status === 'active').map((service: any) => (
                    <TouchableOpacity
                      key={service.id}
                      style={[
                        styles.serviceOption,
                        selectedServiceId === service.id && styles.serviceOptionSelected,
                      ]}
                      onPress={() => setSelectedServiceId(service.id)}
                    >
                      <View style={styles.serviceOptionContent}>
                        <Text style={styles.serviceOptionName}>{service.name}</Text>
                        <Text style={styles.serviceOptionPrice}>
                          Precio actual: ${service.price.toFixed(2)}
                        </Text>
                      </View>
                      {selectedServiceId === service.id && (
                        <CheckCircle size={20} color="#007AFF" />
                      )}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Nuevo Precio *</Text>
                <TextInput
                  style={styles.input}
                  value={newPrice}
                  onChangeText={setNewPrice}
                  placeholder="0.00"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="decimal-pad"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Enlace a Página con Precio Actualizado *</Text>
                <TextInput
                  style={styles.input}
                  value={priceUpdateUrl}
                  onChangeText={setPriceUpdateUrl}
                  placeholder="https://..."
                  placeholderTextColor="#9CA3AF"
                  autoCapitalize="none"
                  keyboardType="url"
                />
                <Text style={styles.helperText}>
                  Proporciona el enlace a tu página pública donde se muestra el precio actualizado
                </Text>
              </View>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowNewRequestModal(false)}
                disabled={submitting}
              >
                <Text style={styles.modalCancelButtonText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalSubmitButton, submitting && styles.modalSubmitButtonDisabled]}
                onPress={handleCreateRequest}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalSubmitButtonText}>Enviar Solicitud</Text>
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
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  scrollView: {
    flex: 1,
  },
  addButton: {
    padding: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    marginTop: 100,
  },
  emptyTitle: {
    marginTop: 16,
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
  },
  emptyText: {
    marginTop: 8,
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 24,
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  requestsContainer: {
    padding: 16,
  },
  infoBox: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    marginBottom: 16,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#1E40AF',
  },
  requestCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  serviceName: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginRight: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#F3F4F6',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  priceComparison: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  priceBox: {
    flex: 1,
    alignItems: 'center',
  },
  priceLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  oldPrice: {
    fontSize: 20,
    fontWeight: '600',
    color: '#6B7280',
    textDecorationLine: 'line-through',
  },
  newPrice: {
    fontSize: 20,
    fontWeight: '700',
    color: '#10B981',
  },
  arrow: {
    paddingHorizontal: 12,
  },
  arrowText: {
    fontSize: 24,
    color: '#6B7280',
  },
  urlButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    marginBottom: 12,
  },
  urlButtonText: {
    fontSize: 14,
    color: '#007AFF',
  },
  requestFooter: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  dateText: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  notesBox: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
  },
  notesLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#92400E',
    marginBottom: 4,
  },
  notesText: {
    fontSize: 14,
    color: '#78350F',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    maxHeight: '90%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 20,
  },
  modalForm: {
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#111827',
  },
  helperText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  servicesList: {
    maxHeight: 200,
  },
  serviceOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    marginBottom: 8,
  },
  serviceOptionSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#EFF6FF',
  },
  serviceOptionContent: {
    flex: 1,
  },
  serviceOptionName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  serviceOptionPrice: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  modalCancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  modalSubmitButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#007AFF',
    alignItems: 'center',
  },
  modalSubmitButtonDisabled: {
    opacity: 0.5,
  },
  modalSubmitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
