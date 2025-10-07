import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Modal,
} from 'react-native';
import { Stack } from 'expo-router';

import { db, auth } from '@/lib/firebase';
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import { ProviderRegistrationData, KommuterRegistrationData } from '@/src/shared/types/registration-types';
import { CheckCircle, XCircle, Eye, User, Building2, Car, FileText, Calendar, Phone, Mail } from 'lucide-react-native';

type PendingProvider = {
  id: string;
  type: 'provider' | 'kommuter';
  status: 'pending';
  registrationData: ProviderRegistrationData | KommuterRegistrationData;
  createdAt: Date;
  email?: string;
};

export default function ProviderApprovalsScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pendingProviders, setPendingProviders] = useState<PendingProvider[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<PendingProvider | null>(null);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    loadPendingProviders();
  }, []);

  const loadPendingProviders = async () => {
    try {
      setLoading(true);
      console.log('[ProviderApprovals] Loading pending providers...');

      const providersQuery = query(
        collection(db, 'providers'),
        where('status', '==', 'pending'),
        orderBy('createdAt', 'desc')
      );

      const kommutersQuery = query(
        collection(db, 'kommuters'),
        where('status', '==', 'pending'),
        orderBy('createdAt', 'desc')
      );

      const [providersSnapshot, kommutersSnapshot] = await Promise.all([
        getDocs(providersQuery),
        getDocs(kommutersQuery),
      ]);

      const providers: PendingProvider[] = [];

      providersSnapshot.forEach((doc) => {
        const data = doc.data();
        providers.push({
          id: doc.id,
          type: 'provider',
          status: 'pending',
          registrationData: data.registrationData || data,
          createdAt: data.createdAt?.toDate() || new Date(),
          email: data.contactInfo?.email || data.email,
        });
      });

      kommutersSnapshot.forEach((doc) => {
        const data = doc.data();
        providers.push({
          id: doc.id,
          type: 'kommuter',
          status: 'pending',
          registrationData: data.registrationData || data,
          createdAt: data.createdAt?.toDate() || new Date(),
          email: data.personalInfo?.email || data.email,
        });
      });

      providers.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

      setPendingProviders(providers);
      console.log('[ProviderApprovals] Loaded providers:', providers.length);
    } catch (error) {
      console.error('[ProviderApprovals] Error loading providers:', error);
      Alert.alert('Error', 'No se pudieron cargar las solicitudes pendientes');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleApprove = async (providerId: string, type: 'provider' | 'kommuter') => {
    Alert.alert(
      'Aprobar Proveedor',
      '¿Estás seguro de que deseas aprobar este proveedor?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Aprobar',
          style: 'default',
          onPress: async () => {
            try {
              setProcessingId(providerId);
              console.log(`[ProviderApprovals] Approving ${type}:`, providerId);

              const collectionName = type === 'provider' ? 'providers' : 'kommuters';
              const providerRef = doc(db, collectionName, providerId);

              await updateDoc(providerRef, {
                status: 'active',
                approvedAt: Timestamp.now(),
                approvedBy: auth.currentUser?.uid,
              });

              Alert.alert('Éxito', 'Proveedor aprobado correctamente');
              loadPendingProviders();
            } catch (error) {
              console.error('[ProviderApprovals] Error approving provider:', error);
              Alert.alert('Error', 'No se pudo aprobar el proveedor');
            } finally {
              setProcessingId(null);
            }
          },
        },
      ]
    );
  };

  const handleReject = async (providerId: string, type: 'provider' | 'kommuter') => {
    Alert.alert(
      'Rechazar Proveedor',
      '¿Estás seguro de que deseas rechazar este proveedor?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Rechazar',
          style: 'destructive',
          onPress: async () => {
            try {
              setProcessingId(providerId);
              console.log(`[ProviderApprovals] Rejecting ${type}:`, providerId);

              const collectionName = type === 'provider' ? 'providers' : 'kommuters';
              const providerRef = doc(db, collectionName, providerId);

              await updateDoc(providerRef, {
                status: 'rejected',
                rejectedAt: Timestamp.now(),
                rejectedBy: auth.currentUser?.uid,
              });

              Alert.alert('Éxito', 'Proveedor rechazado');
              loadPendingProviders();
            } catch (error) {
              console.error('[ProviderApprovals] Error rejecting provider:', error);
              Alert.alert('Error', 'No se pudo rechazar el proveedor');
            } finally {
              setProcessingId(null);
            }
          },
        },
      ]
    );
  };

  const showDetails = (provider: PendingProvider) => {
    setSelectedProvider(provider);
    setDetailsModalVisible(true);
  };

  const renderProviderCard = (provider: PendingProvider) => {
    const isProcessing = processingId === provider.id;
    const isKommuter = provider.type === 'kommuter';
    const data = provider.registrationData;

    let name = '';
    let subtitle = '';

    if (isKommuter) {
      const kommuterData = data as KommuterRegistrationData;
      name = `${kommuterData.personalInfo?.firstName || ''} ${kommuterData.personalInfo?.lastName || ''}`.trim();
      subtitle = `Kommuter • ${kommuterData.vehicleInfo?.vehicles?.length || 0} vehículo(s)`;
    } else {
      const providerData = data as ProviderRegistrationData;
      name = providerData.companyInfo?.businessName || 'Sin nombre';
      subtitle = `2Kompa • ${providerData.serviceInfo?.vehicleTypes?.join(', ') || 'Sin vehículos'}`;
    }

    return (
      <View key={provider.id} style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <View style={[styles.iconContainer, isKommuter ? styles.kommuterIcon : styles.providerIcon]}>
              {isKommuter ? (
                <Car size={24} color="#fff" />
              ) : (
                <Building2 size={24} color="#fff" />
              )}
            </View>
            <View style={styles.cardHeaderText}>
              <Text style={styles.cardTitle}>{name || 'Sin nombre'}</Text>
              <Text style={styles.cardSubtitle}>{subtitle}</Text>
              <Text style={styles.cardDate}>
                {provider.createdAt.toLocaleDateString('es-ES', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.detailsButton}
            onPress={() => showDetails(provider)}
          >
            <Eye size={20} color="#007AFF" />
          </TouchableOpacity>
        </View>

        <View style={styles.cardActions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.rejectButton]}
            onPress={() => handleReject(provider.id, provider.type)}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <XCircle size={18} color="#fff" />
                <Text style={styles.actionButtonText}>Rechazar</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.approveButton]}
            onPress={() => handleApprove(provider.id, provider.type)}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <CheckCircle size={18} color="#fff" />
                <Text style={styles.actionButtonText}>Aprobar</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderDetailsModal = () => {
    if (!selectedProvider) return null;

    const isKommuter = selectedProvider.type === 'kommuter';
    const data = selectedProvider.registrationData;

    return (
      <Modal
        visible={detailsModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setDetailsModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Detalles del Proveedor</Text>
            <TouchableOpacity onPress={() => setDetailsModalVisible(false)}>
              <Text style={styles.modalCloseButton}>Cerrar</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {isKommuter ? (
              <KommuterDetails data={data as KommuterRegistrationData} />
            ) : (
              <ProviderDetails data={data as ProviderRegistrationData} />
            )}
          </ScrollView>
        </View>
      </Modal>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: 'Aprobar Proveedores' }} />
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Cargando solicitudes...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Aprobar Proveedores' }} />

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={loadPendingProviders} />
        }
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Solicitudes Pendientes</Text>
          <Text style={styles.headerSubtitle}>
            {pendingProviders.length} {pendingProviders.length === 1 ? 'solicitud' : 'solicitudes'}
          </Text>
        </View>

        {pendingProviders.length === 0 ? (
          <View style={styles.emptyContainer}>
            <CheckCircle size={64} color="#ccc" />
            <Text style={styles.emptyText}>No hay solicitudes pendientes</Text>
            <Text style={styles.emptySubtext}>
              Todas las solicitudes han sido procesadas
            </Text>
          </View>
        ) : (
          <View style={styles.listContainer}>
            {pendingProviders.map(renderProviderCard)}
          </View>
        )}
      </ScrollView>

      {renderDetailsModal()}
    </View>
  );
}

function KommuterDetails({ data }: { data: KommuterRegistrationData }) {
  return (
    <View style={styles.detailsContainer}>
      <View style={styles.detailSection}>
        <Text style={styles.detailSectionTitle}>Información Personal</Text>
        <DetailRow icon={<User size={18} color="#666" />} label="Nombre" value={`${data.personalInfo?.firstName} ${data.personalInfo?.lastName}`} />
        <DetailRow icon={<Mail size={18} color="#666" />} label="Email" value={data.personalInfo?.email} />
        <DetailRow icon={<Phone size={18} color="#666" />} label="Teléfono" value={data.personalInfo?.phone} />
        <DetailRow icon={<FileText size={18} color="#666" />} label="Cédula" value={data.personalInfo?.cedula} />
        <DetailRow icon={<Calendar size={18} color="#666" />} label="Fecha de Nacimiento" value={data.personalInfo?.dateOfBirth} />
      </View>

      <View style={styles.detailSection}>
        <Text style={styles.detailSectionTitle}>Licencia de Conducir</Text>
        <DetailRow label="Número" value={data.driverLicense?.number} />
        <DetailRow label="Categoría" value={data.driverLicense?.category} />
        <DetailRow label="Vencimiento" value={data.driverLicense?.expirationDate} />
      </View>

      <View style={styles.detailSection}>
        <Text style={styles.detailSectionTitle}>Vehículos</Text>
        <DetailRow label="Tipo" value={data.vehicleInfo?.isFleet ? 'Flota' : 'Individual'} />
        <DetailRow label="Cantidad" value={`${data.vehicleInfo?.vehicles?.length || 0} vehículo(s)`} />
        {data.vehicleInfo?.vehicles?.map((vehicle, index) => (
          <View key={index} style={styles.vehicleCard}>
            <Text style={styles.vehicleTitle}>Vehículo {index + 1}</Text>
            <DetailRow label="Marca/Modelo" value={`${vehicle.brand} ${vehicle.model}`} />
            <DetailRow label="Año" value={vehicle.year?.toString()} />
            <DetailRow label="Placa" value={vehicle.plate} />
            <DetailRow label="Color" value={vehicle.color} />
            <DetailRow label="Capacidad" value={`${vehicle.capacity} pasajeros`} />
            <DetailRow label="Tipo" value={vehicle.vehicleType} />
          </View>
        ))}
      </View>
    </View>
  );
}

function ProviderDetails({ data }: { data: ProviderRegistrationData }) {
  return (
    <View style={styles.detailsContainer}>
      <View style={styles.detailSection}>
        <Text style={styles.detailSectionTitle}>Información de la Empresa</Text>
        <DetailRow icon={<Building2 size={18} color="#666" />} label="Nombre" value={data.companyInfo?.businessName} />
        <DetailRow icon={<FileText size={18} color="#666" />} label="RNC/Tax ID" value={data.companyInfo?.taxId} />
        <DetailRow label="Dirección" value={data.companyInfo?.address} />
        <DetailRow label="Ciudad" value={data.companyInfo?.city} />
        <DetailRow label="Estado" value={data.companyInfo?.state} />
        <DetailRow label="País" value={data.companyInfo?.country} />
      </View>

      <View style={styles.detailSection}>
        <Text style={styles.detailSectionTitle}>Contacto</Text>
        <DetailRow icon={<User size={18} color="#666" />} label="Nombre" value={data.contactInfo?.contactName} />
        <DetailRow icon={<Mail size={18} color="#666" />} label="Email" value={data.contactInfo?.email} />
        <DetailRow icon={<Phone size={18} color="#666" />} label="Teléfono" value={data.contactInfo?.phone} />
      </View>

      <View style={styles.detailSection}>
        <Text style={styles.detailSectionTitle}>Servicios</Text>
        <DetailRow label="Tipos de Vehículos" value={data.serviceInfo?.vehicleTypes?.join(', ')} />
        <DetailRow label="Áreas de Cobertura" value={data.serviceInfo?.coverageAreas?.join(', ')} />
        <DetailRow label="Nicho de Servicio" value={data.serviceInfo?.serviceNiche} />
      </View>
    </View>
  );
}

function DetailRow({ icon, label, value }: { icon?: React.ReactNode; label: string; value?: string }) {
  if (!value) return null;

  return (
    <View style={styles.detailRow}>
      {icon && <View style={styles.detailIcon}>{icon}</View>}
      <View style={styles.detailContent}>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={styles.detailValue}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  safeArea: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  listContainer: {
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    flex: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  kommuterIcon: {
    backgroundColor: '#007AFF',
  },
  providerIcon: {
    backgroundColor: '#34C759',
  },
  cardHeaderText: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  cardDate: {
    fontSize: 12,
    color: '#999',
  },
  detailsButton: {
    padding: 8,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  approveButton: {
    backgroundColor: '#34C759',
  },
  rejectButton: {
    backgroundColor: '#FF3B30',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
  },
  modalCloseButton: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
  },
  detailsContainer: {
    padding: 16,
  },
  detailSection: {
    marginBottom: 24,
  },
  detailSectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  detailIcon: {
    marginRight: 12,
    paddingTop: 2,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 16,
    color: '#000',
  },
  vehicleCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  vehicleTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
});
