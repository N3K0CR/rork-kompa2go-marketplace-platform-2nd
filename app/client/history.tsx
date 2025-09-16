import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, TextInput, Alert } from 'react-native';
import { Stack, router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAppointments } from '@/contexts/AppointmentsContext';
import { useReportedProblems } from '@/contexts/ReportedProblemsContext';
import { 
  ChevronLeft, 
  Calendar, 
  Star, 
  AlertTriangle, 
  Filter,
  X,
  Eye,
  Clock,
  MapPin,
  User,
  Send,
  CheckCircle
} from 'lucide-react-native';

interface ServiceHistory {
  id: string;
  serviceName: string;
  providerName: string;
  providerId: string;
  date: string;
  time: string;
  cost: number;
  rating: number;
  comments?: string;
  status: 'completed' | 'cancelled';
  canReportProblem: boolean;
  hasReportedProblem: boolean;
}

const mockServiceHistory: ServiceHistory[] = [
  {
    id: '1',
    serviceName: 'Limpieza General',
    providerName: 'Ana Cleaning',
    providerId: 'provider1',
    date: '2024-01-15',
    time: '09:00',
    cost: 15000,
    rating: 4.8,
    comments: 'Excelente trabajo, muy profesional y puntual.',
    status: 'completed',
    canReportProblem: true,
    hasReportedProblem: false
  },
  {
    id: '2',
    serviceName: 'Limpieza Profunda',
    providerName: 'María Pro',
    providerId: 'provider2',
    date: '2024-01-14',
    time: '14:00',
    cost: 25000,
    rating: 5.0,
    comments: 'Perfecto, superó mis expectativas.',
    status: 'completed',
    canReportProblem: true,
    hasReportedProblem: false
  },
  {
    id: '3',
    serviceName: 'Organización',
    providerName: 'Carlos Detailing',
    providerId: 'provider3',
    date: '2024-01-13',
    time: '10:30',
    cost: 12000,
    rating: 4.5,
    comments: 'Buen trabajo en general.',
    status: 'completed',
    canReportProblem: true,
    hasReportedProblem: true
  },
  {
    id: '4',
    serviceName: 'Limpieza de Oficina',
    providerName: 'Sofia Garden',
    providerId: 'provider4',
    date: '2024-01-12',
    time: '16:00',
    cost: 18000,
    rating: 4.9,
    comments: 'Muy satisfecho con el resultado.',
    status: 'completed',
    canReportProblem: false,
    hasReportedProblem: false
  },
  {
    id: '5',
    serviceName: 'Limpieza General',
    providerName: 'Juan Mecánica',
    providerId: 'provider5',
    date: '2024-01-11',
    time: '11:00',
    cost: 15000,
    rating: 4.2,
    comments: 'Bien, pero podría mejorar en algunos detalles.',
    status: 'completed',
    canReportProblem: false,
    hasReportedProblem: false
  }
];

type FilterPeriod = 'day' | 'week' | 'month' | 'all';

export default function ClientHistoryScreen() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { reportProblem, loading: reportLoading } = useReportedProblems();
  const [selectedFilter, setSelectedFilter] = useState<FilterPeriod>('all');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [selectedService, setSelectedService] = useState<ServiceHistory | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [problemDescription, setProblemDescription] = useState('');

  const filteredHistory = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    return mockServiceHistory.filter(service => {
      const serviceDate = new Date(service.date);
      
      switch (selectedFilter) {
        case 'day':
          return serviceDate.toDateString() === today.toDateString();
        case 'week':
          const weekAgo = new Date(today);
          weekAgo.setDate(today.getDate() - 7);
          return serviceDate >= weekAgo;
        case 'month':
          const monthAgo = new Date(today);
          monthAgo.setMonth(today.getMonth() - 1);
          return serviceDate >= monthAgo;
        default:
          return true;
      }
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [selectedFilter]);

  const getFilterLabel = (filter: FilterPeriod) => {
    switch (filter) {
      case 'day': return 'Hoy';
      case 'week': return 'Esta Semana';
      case 'month': return 'Este Mes';
      default: return 'Todos';
    }
  };

  const handleViewDetails = (service: ServiceHistory) => {
    setSelectedService(service);
    setShowDetailModal(true);
  };

  const handleReportProblem = (service: ServiceHistory) => {
    setSelectedService(service);
    setShowReportModal(true);
  };

  const handleSubmitReport = async () => {
    if (!selectedService || !problemDescription.trim()) {
      Alert.alert('Error', 'Por favor describe el problema que experimentaste.');
      return;
    }

    try {
      await reportProblem({
        appointmentId: selectedService.id,
        clientId: user?.id || 'client1',
        clientName: user?.name || 'Cliente',
        providerId: selectedService.providerId,
        providerName: selectedService.providerName,
        serviceName: selectedService.serviceName,
        serviceDate: selectedService.date,
        serviceTime: selectedService.time,
        problemDescription: problemDescription.trim()
      });

      Alert.alert(
        'Problema Reportado',
        'Tu reporte ha sido enviado exitosamente. Nuestro equipo de administración lo revisará en un tiempo prudencial de 48 a 72 horas para la debida investigación.\n\nAgradecemos tu paciencia y confianza en nuestra aplicación.',
        [
          {
            text: 'OK',
            onPress: () => {
              setShowReportModal(false);
              setProblemDescription('');
              setSelectedService(null);
            }
          }
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'No se pudo enviar el reporte. Inténtalo de nuevo.');
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
          title: 'Historial de Servicios',
          headerStyle: { backgroundColor: '#D81B60' },
          headerTintColor: 'white',
          headerTitleStyle: { fontWeight: 'bold' },
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <ChevronLeft size={24} color="white" />
            </TouchableOpacity>
          )
        }}
      />

      <View style={styles.content}>
        {/* Filter Section */}
        <View style={styles.filterSection}>
          <TouchableOpacity 
            style={styles.filterButton}
            onPress={() => setShowFilterModal(true)}
          >
            <Filter size={20} color="#D81B60" />
            <Text style={styles.filterButtonText}>
              Filtrar: {getFilterLabel(selectedFilter)}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Statistics Summary */}
        <View style={styles.statsSection}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{filteredHistory.length}</Text>
            <Text style={styles.statLabel}>Servicios</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>
              {filteredHistory.length > 0 
                ? (filteredHistory.reduce((sum, service) => sum + service.rating, 0) / filteredHistory.length).toFixed(1)
                : '0.0'
              }
            </Text>
            <Text style={styles.statLabel}>Promedio</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>
              ₡{filteredHistory.reduce((sum, service) => sum + service.cost, 0).toLocaleString()}
            </Text>
            <Text style={styles.statLabel}>Total Gastado</Text>
          </View>
        </View>

        {/* Services List */}
        <ScrollView style={styles.servicesList} showsVerticalScrollIndicator={false}>
          {filteredHistory.map((service) => (
            <TouchableOpacity 
              key={service.id} 
              style={[
                styles.serviceCard,
                service.hasReportedProblem && styles.serviceCardWithReport
              ]}
              onPress={() => handleViewDetails(service)}
            >
              <View style={styles.serviceHeader}>
                <View style={styles.serviceInfo}>
                  <Text style={styles.serviceName}>{service.serviceName}</Text>
                  <View style={styles.providerInfo}>
                    <User size={14} color="#666" />
                    <Text style={styles.providerName}>{service.providerName}</Text>
                  </View>
                  <View style={styles.serviceDateTime}>
                    <Calendar size={14} color="#666" />
                    <Text style={styles.serviceDate}>
                      {new Date(service.date).toLocaleDateString('es-ES')}
                    </Text>
                    <Clock size={14} color="#666" />
                    <Text style={styles.serviceTime}>{service.time}</Text>
                  </View>
                </View>
                <View style={styles.serviceRating}>
                  <Star size={16} color="#FFD700" fill="#FFD700" />
                  <Text style={styles.ratingText}>{service.rating}</Text>
                </View>
              </View>
              
              <View style={styles.serviceFooter}>
                <Text style={styles.serviceCost}>₡{service.cost.toLocaleString()}</Text>
                <View style={styles.serviceActions}>
                  {service.hasReportedProblem && (
                    <View style={styles.reportedIndicator}>
                      <CheckCircle size={16} color="#4CAF50" />
                      <Text style={styles.reportedText}>Reportado</Text>
                    </View>
                  )}
                  {service.canReportProblem && !service.hasReportedProblem && (
                    <TouchableOpacity 
                      style={styles.reportButton}
                      onPress={() => handleReportProblem(service)}
                    >
                      <AlertTriangle size={16} color="#FF5722" />
                      <Text style={styles.reportButtonText}>Reportar</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity style={styles.viewButton}>
                    <Eye size={16} color="#2196F3" />
                    <Text style={styles.viewButtonText}>Ver</Text>
                  </TouchableOpacity>
                </View>
              </View>
              
              {service.comments && (
                <Text style={styles.serviceComments} numberOfLines={2}>
                  "{service.comments}"
                </Text>
              )}
            </TouchableOpacity>
          ))}
          
          {filteredHistory.length === 0 && (
            <View style={styles.emptyState}>
              <Calendar size={48} color="#666" />
              <Text style={styles.emptyStateText}>
                No hay servicios para el período seleccionado
              </Text>
            </View>
          )}
        </ScrollView>
      </View>

      {/* Filter Modal */}
      <Modal
        visible={showFilterModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowFilterModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filtrar por Período</Text>
              <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                <X size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.filterOptions}>
              {(['all', 'month', 'week', 'day'] as FilterPeriod[]).map((filter) => (
                <TouchableOpacity
                  key={filter}
                  style={[
                    styles.filterOption,
                    selectedFilter === filter && styles.filterOptionSelected
                  ]}
                  onPress={() => {
                    setSelectedFilter(filter);
                    setShowFilterModal(false);
                  }}
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
          </View>
        </View>
      </Modal>

      {/* Service Detail Modal */}
      <Modal
        visible={showDetailModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDetailModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.detailModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Detalles del Servicio</Text>
              <TouchableOpacity onPress={() => setShowDetailModal(false)}>
                <X size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            {selectedService && (
              <ScrollView style={styles.detailContent}>
                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Servicio:</Text>
                  <Text style={styles.detailValue}>{selectedService.serviceName}</Text>
                </View>
                
                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Proveedor:</Text>
                  <Text style={styles.detailValue}>{selectedService.providerName}</Text>
                </View>
                
                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Fecha y Hora:</Text>
                  <Text style={styles.detailValue}>
                    {new Date(selectedService.date).toLocaleDateString('es-ES')} - {selectedService.time}
                  </Text>
                </View>
                
                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Costo:</Text>
                  <Text style={styles.detailValue}>₡{selectedService.cost.toLocaleString()}</Text>
                </View>
                
                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Calificación:</Text>
                  <View style={styles.ratingContainer}>
                    <Star size={20} color="#FFD700" fill="#FFD700" />
                    <Text style={styles.detailValue}>{selectedService.rating}/5.0</Text>
                  </View>
                </View>
                
                {selectedService.comments && (
                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>Tus Comentarios:</Text>
                    <Text style={styles.detailValue}>{selectedService.comments}</Text>
                  </View>
                )}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Report Problem Modal */}
      <Modal
        visible={showReportModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowReportModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.reportModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Reportar Problema</Text>
              <TouchableOpacity onPress={() => setShowReportModal(false)}>
                <X size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            {selectedService && (
              <View>
                <View style={styles.serviceInfoCard}>
                  <Text style={styles.serviceInfoTitle}>{selectedService.serviceName}</Text>
                  <Text style={styles.serviceInfoSubtitle}>
                    {selectedService.providerName} • {new Date(selectedService.date).toLocaleDateString('es-ES')}
                  </Text>
                </View>

                <Text style={styles.reportDescription}>
                  Describe el problema que experimentaste con este servicio. Tu reporte será revisado por nuestro equipo de administración.
                </Text>

                <View style={styles.textAreaContainer}>
                  <TextInput
                    style={styles.textArea}
                    placeholder="Describe el problema en detalle..."
                    value={problemDescription}
                    onChangeText={setProblemDescription}
                    multiline
                    numberOfLines={6}
                    textAlignVertical="top"
                    placeholderTextColor="#999"
                  />
                </View>

                <View style={styles.reportNotice}>
                  <AlertTriangle size={20} color="#FF9800" />
                  <Text style={styles.reportNoticeText}>
                    Tu reporte será investigado en 48-72 horas. Agradecemos tu paciencia.
                  </Text>
                </View>

                <TouchableOpacity
                  style={[styles.submitButton, reportLoading && styles.submitButtonDisabled]}
                  onPress={handleSubmitReport}
                  disabled={reportLoading || !problemDescription.trim()}
                >
                  <Send size={20} color="white" />
                  <Text style={styles.submitButtonText}>
                    {reportLoading ? 'Enviando...' : 'Enviar Problema'}
                  </Text>
                </TouchableOpacity>
              </View>
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
    backgroundColor: '#F8F9FA',
  },
  backButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  filterSection: {
    marginBottom: 20,
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
    fontWeight: '600',
    color: '#333',
  },
  statsSection: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
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
    fontSize: 20,
    fontWeight: 'bold',
    color: '#D81B60',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  servicesList: {
    flex: 1,
  },
  serviceCard: {
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
  serviceCardWithReport: {
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  serviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 6,
  },
  providerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  providerName: {
    fontSize: 14,
    color: '#666',
  },
  serviceDateTime: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  serviceDate: {
    fontSize: 12,
    color: '#999',
  },
  serviceTime: {
    fontSize: 12,
    color: '#999',
  },
  serviceRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  serviceFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  serviceCost: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  serviceActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  reportedIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  reportedText: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '600',
  },
  reportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFEBEE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  reportButtonText: {
    fontSize: 12,
    color: '#FF5722',
    fontWeight: '600',
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewButtonText: {
    fontSize: 12,
    color: '#2196F3',
    fontWeight: '600',
  },
  serviceComments: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    marginTop: 8,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 18,
    color: '#666',
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
  reportModalContent: {
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
    fontWeight: 'bold',
    color: '#333',
  },
  filterOptions: {
    gap: 12,
  },
  filterOption: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
  },
  filterOptionSelected: {
    backgroundColor: '#D81B60',
  },
  filterOptionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  filterOptionTextSelected: {
    color: 'white',
  },
  detailContent: {
    maxHeight: 400,
  },
  detailSection: {
    marginBottom: 16,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    color: '#333',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  serviceInfoCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  serviceInfoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  serviceInfoSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  reportDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    lineHeight: 20,
  },
  textAreaContainer: {
    marginBottom: 16,
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#333',
    minHeight: 120,
    backgroundColor: '#FAFAFA',
  },
  reportNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: '#FFF8E1',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  reportNoticeText: {
    flex: 1,
    fontSize: 14,
    color: '#F57C00',
    lineHeight: 20,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#D81B60',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  submitButtonDisabled: {
    backgroundColor: '#CCC',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});