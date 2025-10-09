import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { useProvider } from '@/contexts/ProviderContext';
import { 
  Plus, 
  Edit, 
  Trash2, 
  EyeOff,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
} from 'lucide-react-native';
import type { ProviderService } from '@/src/shared/types';

export default function ProviderServicesScreen() {
  const { services, loading, deleteService, toggleServiceStatus } = useProvider();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const handleDeleteService = (service: ProviderService) => {
    Alert.alert(
      'Eliminar Servicio',
      `¿Estás seguro de que deseas eliminar "${service.name}"? Esta acción no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              setDeletingId(service.id);
              await deleteService(service.id);
              Alert.alert('Éxito', 'Servicio eliminado correctamente');
            } catch (error: any) {
              Alert.alert('Error', error.message || 'No se pudo eliminar el servicio');
            } finally {
              setDeletingId(null);
            }
          },
        },
      ]
    );
  };

  const handleToggleStatus = async (service: ProviderService) => {
    try {
      setTogglingId(service.id);
      await toggleServiceStatus(service.id, !service.isActive);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'No se pudo cambiar el estado del servicio');
    } finally {
      setTogglingId(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return '#10B981';
      case 'pending_approval':
        return '#F59E0B';
      case 'rejected':
        return '#EF4444';
      case 'inactive':
        return '#6B7280';
      default:
        return '#6B7280';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Activo';
      case 'pending_approval':
        return 'Pendiente';
      case 'rejected':
        return 'Rechazado';
      case 'inactive':
        return 'Inactivo';
      default:
        return status;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle size={16} color="#10B981" />;
      case 'pending_approval':
        return <Clock size={16} color="#F59E0B" />;
      case 'rejected':
        return <XCircle size={16} color="#EF4444" />;
      case 'inactive':
        return <EyeOff size={16} color="#6B7280" />;
      default:
        return <AlertCircle size={16} color="#6B7280" />;
    }
  };

  if (loading && services.length === 0) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: 'Mis Servicios' }} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Cargando servicios...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: 'Mis Servicios',
          headerRight: () => (
            <TouchableOpacity
              onPress={() => router.push('/provider/service-form')}
              style={styles.addButton}
            >
              <Plus size={24} color="#007AFF" />
            </TouchableOpacity>
          ),
        }} 
      />
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {services.length === 0 ? (
          <View style={styles.emptyContainer}>
            <AlertCircle size={64} color="#999" />
            <Text style={styles.emptyTitle}>No tienes servicios</Text>
            <Text style={styles.emptyText}>
              Agrega tu primer servicio para comenzar a recibir clientes
            </Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => router.push('/provider/service-form')}
            >
              <Plus size={20} color="#FFFFFF" />
              <Text style={styles.emptyButtonText}>Agregar Servicio</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.servicesContainer}>
            <View style={styles.header}>
              <Text style={styles.headerTitle}>
                {services.length} {services.length === 1 ? 'Servicio' : 'Servicios'}
              </Text>
              <Text style={styles.headerSubtitle}>
                {services.filter(s => s.isActive && s.status === 'active').length} activos
              </Text>
            </View>

            {services.map((service) => (
              <View key={service.id} style={styles.serviceCard}>
                {service.photos && service.photos.length > 0 && (
                  <Image
                    source={{ uri: service.photos[0] }}
                    style={styles.serviceImage}
                  />
                )}

                <View style={styles.serviceContent}>
                  <View style={styles.serviceHeader}>
                    <Text style={styles.serviceName}>{service.name}</Text>
                    <View style={styles.statusBadge}>
                      {getStatusIcon(service.status)}
                      <Text style={[styles.statusText, { color: getStatusColor(service.status) }]}>
                        {getStatusText(service.status)}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.serviceCategory}>{service.category}</Text>
                  <Text style={styles.serviceDescription} numberOfLines={2}>
                    {service.description}
                  </Text>

                  <View style={styles.priceRow}>
                    <Text style={styles.priceLabel}>Precio:</Text>
                    <Text style={styles.priceValue}>
                      {service.currency} {service.price.toFixed(2)}
                    </Text>
                    {service.duration && (
                      <Text style={styles.duration}>• {service.duration} min</Text>
                    )}
                  </View>

                  {service.status === 'rejected' && service.rejectionReason && (
                    <View style={styles.rejectionBanner}>
                      <XCircle size={16} color="#DC2626" />
                      <Text style={styles.rejectionText}>{service.rejectionReason}</Text>
                    </View>
                  )}

                  <View style={styles.serviceActions}>
                    <View style={styles.toggleRow}>
                      <Text style={styles.toggleLabel}>
                        {service.isActive ? 'Visible' : 'Oculto'}
                      </Text>
                      <Switch
                        value={service.isActive}
                        onValueChange={() => handleToggleStatus(service)}
                        disabled={togglingId === service.id || service.status !== 'active'}
                        trackColor={{ false: '#D1D5DB', true: '#10B981' }}
                        thumbColor="#FFFFFF"
                      />
                    </View>

                    <View style={styles.actionButtons}>
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => router.push({
                          pathname: '/provider/service-form',
                          params: { serviceId: service.id }
                        })}
                      >
                        <Edit size={20} color="#007AFF" />
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.actionButton, styles.deleteButton]}
                        onPress={() => handleDeleteService(service)}
                        disabled={deletingId === service.id}
                      >
                        {deletingId === service.id ? (
                          <ActivityIndicator size="small" color="#EF4444" />
                        ) : (
                          <Trash2 size={20} color="#EF4444" />
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
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
  servicesContainer: {
    padding: 16,
  },
  header: {
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  serviceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  serviceImage: {
    width: '100%',
    height: 200,
  },
  serviceContent: {
    padding: 16,
  },
  serviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
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
  serviceCategory: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  serviceDescription: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 12,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  priceLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginRight: 8,
  },
  priceValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  duration: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
  },
  rejectionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
    marginBottom: 12,
  },
  rejectionText: {
    flex: 1,
    fontSize: 14,
    color: '#991B1B',
  },
  serviceActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  toggleLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  deleteButton: {
    backgroundColor: '#FEE2E2',
  },
});
