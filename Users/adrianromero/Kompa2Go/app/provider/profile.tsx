import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { Stack } from 'expo-router';
import { router } from 'expo-router';
import { useProvider } from '@/contexts/ProviderContext';
import { 
  Building2, 
  Mail, 
  Phone, 
  MapPin, 
  Edit, 
  Star,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
} from 'lucide-react-native';

export default function ProviderProfileScreen() {
  const { profile, loading } = useProvider();

  if (loading && !profile) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: 'Perfil del Proveedor' }} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Cargando perfil...</Text>
        </View>
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: 'Perfil del Proveedor' }} />
        <View style={styles.emptyContainer}>
          <AlertCircle size={64} color="#999" />
          <Text style={styles.emptyText}>No se encontró el perfil</Text>
        </View>
      </View>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return '#10B981';
      case 'pending':
        return '#F59E0B';
      case 'suspended':
        return '#EF4444';
      case 'rejected':
        return '#DC2626';
      default:
        return '#6B7280';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Activo';
      case 'pending':
        return 'Pendiente';
      case 'suspended':
        return 'Suspendido';
      case 'rejected':
        return 'Rechazado';
      default:
        return status;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle size={20} color="#10B981" />;
      case 'pending':
        return <Clock size={20} color="#F59E0B" />;
      case 'suspended':
      case 'rejected':
        return <XCircle size={20} color="#EF4444" />;
      default:
        return <AlertCircle size={20} color="#6B7280" />;
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: 'Perfil del Proveedor',
          headerRight: () => (
            <TouchableOpacity
              onPress={() => router.push('/provider/edit-profile')}
              style={styles.editButton}
            >
              <Edit size={20} color="#007AFF" />
            </TouchableOpacity>
          ),
        }} 
      />
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            {getStatusIcon(profile.status)}
            <Text style={[styles.statusText, { color: getStatusColor(profile.status) }]}>
              {getStatusText(profile.status)}
            </Text>
          </View>
          {!profile.hasActiveReservation && profile.status === 'active' && (
            <View style={styles.warningBanner}>
              <AlertCircle size={16} color="#F59E0B" />
              <Text style={styles.warningText}>
                Perfil visible solo con reserva activa
              </Text>
            </View>
          )}
        </View>

        {profile.profilePhotos && profile.profilePhotos.length > 0 && (
          <View style={styles.photosSection}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {profile.profilePhotos.map((photo, index) => (
                <Image
                  key={index}
                  source={{ uri: photo }}
                  style={styles.profilePhoto}
                />
              ))}
            </ScrollView>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Información de la Empresa</Text>
          
          <View style={styles.infoRow}>
            <Building2 size={20} color="#6B7280" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Nombre del Negocio</Text>
              <Text style={styles.infoValue}>{profile.companyInfo.businessName}</Text>
            </View>
          </View>

          {profile.companyInfo.taxId && (
            <View style={styles.infoRow}>
              <Building2 size={20} color="#6B7280" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>RIF/NIT</Text>
                <Text style={styles.infoValue}>{profile.companyInfo.taxId}</Text>
              </View>
            </View>
          )}

          <View style={styles.infoRow}>
            <MapPin size={20} color="#6B7280" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Dirección</Text>
              <Text style={styles.infoValue}>
                {profile.companyInfo.address}, {profile.companyInfo.city}
              </Text>
              <Text style={styles.infoValue}>
                {profile.companyInfo.state}, {profile.companyInfo.country}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Información de Contacto</Text>
          
          <View style={styles.infoRow}>
            <Mail size={20} color="#6B7280" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>{profile.contactInfo.email}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Phone size={20} color="#6B7280" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Teléfono</Text>
              <Text style={styles.infoValue}>{profile.contactInfo.phone}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Información del Servicio</Text>
          
          <View style={styles.infoRow}>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Nicho de Servicio</Text>
              <Text style={styles.infoValue}>{profile.serviceInfo.serviceNiche}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Tipos de Vehículos</Text>
              {profile.serviceInfo.vehicleTypes.map((type, index) => (
                <Text key={index} style={styles.listItem}>• {type}</Text>
              ))}
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Áreas de Cobertura</Text>
              {profile.serviceInfo.coverageAreas.map((area, index) => (
                <Text key={index} style={styles.listItem}>• {area}</Text>
              ))}
            </View>
          </View>
        </View>

        {profile.rating !== undefined && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Estadísticas</Text>
            
            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <Star size={24} color="#F59E0B" />
                <Text style={styles.statValue}>{profile.rating.toFixed(1)}</Text>
                <Text style={styles.statLabel}>Calificación</Text>
              </View>

              <View style={styles.statCard}>
                <Text style={styles.statValue}>{profile.totalServices || 0}</Text>
                <Text style={styles.statLabel}>Servicios Totales</Text>
              </View>

              <View style={styles.statCard}>
                <Text style={styles.statValue}>{profile.completedServices || 0}</Text>
                <Text style={styles.statLabel}>Completados</Text>
              </View>
            </View>
          </View>
        )}

        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => router.push('/provider/services')}
          >
            <Text style={styles.primaryButtonText}>Gestionar Servicios</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => router.push('/provider/price-requests')}
          >
            <Text style={styles.secondaryButtonText}>Solicitudes de Precio</Text>
          </TouchableOpacity>
        </View>
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 18,
    color: '#6B7280',
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  editButton: {
    padding: 8,
  },
  statusCard: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusText: {
    fontSize: 18,
    fontWeight: '600',
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    padding: 12,
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
  },
  warningText: {
    flex: 1,
    fontSize: 14,
    color: '#92400E',
  },
  photosSection: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  profilePhoto: {
    width: 200,
    height: 150,
    borderRadius: 12,
    marginRight: 12,
  },
  section: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    color: '#111827',
  },
  listItem: {
    fontSize: 16,
    color: '#111827',
    marginTop: 4,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
    textAlign: 'center',
  },
  actionButtons: {
    padding: 16,
    gap: 12,
    marginBottom: 24,
  },
  primaryButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  secondaryButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
