import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { Stack, router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { 
  ChevronLeft, 
  Calendar, 
  Star, 
  AlertTriangle, 
  Filter,
  X,
  Eye,
  ThumbsUp,
  ThumbsDown
} from 'lucide-react-native';

interface ServiceHistory {
  id: string;
  serviceName: string;
  clientName: string;
  date: string;
  time: string;
  cost: number;
  rating: number;
  comments?: string;
  hasComplaint: boolean;
  complaintDetails?: string;
  photos?: string[];
  status: 'completed' | 'cancelled';
}

interface ClientReview {
  id: string;
  serviceHistoryId: string;
  rating: number;
  comments: string;
  photos: string[];
  date: string;
  reactions: {
    thumbsUp: number;
    thumbsDown: number;
  };
}

const mockServiceHistory: ServiceHistory[] = [
  {
    id: '1',
    serviceName: 'Limpieza General',
    clientName: 'María G.',
    date: '2024-01-15',
    time: '09:00',
    cost: 15000,
    rating: 4.8,
    comments: 'Excelente trabajo, muy profesional y puntual.',
    hasComplaint: false,
    status: 'completed'
  },
  {
    id: '2',
    serviceName: 'Limpieza Profunda',
    clientName: 'Carlos M.',
    date: '2024-01-14',
    time: '14:00',
    cost: 25000,
    rating: 5.0,
    comments: 'Perfecto, superó mis expectativas.',
    hasComplaint: false,
    status: 'completed'
  },
  {
    id: '3',
    serviceName: 'Organización',
    clientName: 'Ana L.',
    date: '2024-01-13',
    time: '10:30',
    cost: 12000,
    rating: 4.5,
    comments: 'Buen trabajo en general.',
    hasComplaint: true,
    complaintDetails: 'Llegó 15 minutos tarde sin avisar previamente.',
    status: 'completed'
  },
  {
    id: '4',
    serviceName: 'Limpieza de Oficina',
    clientName: 'Roberto S.',
    date: '2024-01-12',
    time: '16:00',
    cost: 18000,
    rating: 4.9,
    comments: 'Muy satisfecho con el resultado.',
    hasComplaint: false,
    status: 'completed'
  },
  {
    id: '5',
    serviceName: 'Limpieza General',
    clientName: 'Patricia J.',
    date: '2024-01-11',
    time: '11:00',
    cost: 15000,
    rating: 4.2,
    comments: 'Bien, pero podría mejorar en algunos detalles.',
    hasComplaint: true,
    complaintDetails: 'No limpió completamente los vidrios de las ventanas como se acordó.',
    status: 'completed'
  },
  {
    id: '6',
    serviceName: 'Mantenimiento General',
    clientName: 'Diego H.',
    date: '2024-01-10',
    time: '08:00',
    cost: 20000,
    rating: 5.0,
    comments: 'Excelente servicio, muy recomendado.',
    hasComplaint: false,
    status: 'completed'
  }
];

const mockClientReviews: ClientReview[] = [
  {
    id: '1',
    serviceHistoryId: '1',
    rating: 4.8,
    comments: 'Excelente trabajo, muy profesional y puntual.',
    photos: [
      'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=300&h=200&fit=crop',
      'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=300&h=200&fit=crop'
    ],
    date: '2024-01-15',
    reactions: { thumbsUp: 12, thumbsDown: 1 }
  },
  {
    id: '2',
    serviceHistoryId: '2',
    rating: 5.0,
    comments: 'Perfecto, superó mis expectativas.',
    photos: [
      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&h=200&fit=crop'
    ],
    date: '2024-01-14',
    reactions: { thumbsUp: 8, thumbsDown: 0 }
  }
];

type FilterPeriod = 'day' | 'week' | 'month' | 'all';

export default function HistoryScreen() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [selectedFilter, setSelectedFilter] = useState<FilterPeriod>('all');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [selectedService, setSelectedService] = useState<ServiceHistory | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

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

  const getImprovementPlan = (complaintDetails: string) => {
    if (complaintDetails.toLowerCase().includes('tarde') || complaintDetails.toLowerCase().includes('puntual')) {
      return 'Plan de Mejora:\n• Configurar alarmas 30 minutos antes de cada cita\n• Salir con 15 minutos de anticipación\n• Contactar al cliente si hay retrasos inevitables\n• Revisar rutas la noche anterior';
    }
    if (complaintDetails.toLowerCase().includes('limpieza') || complaintDetails.toLowerCase().includes('vidrios')) {
      return 'Plan de Mejora:\n• Crear checklist detallado de tareas\n• Revisar cada área antes de finalizar\n• Tomar fotos del trabajo completado\n• Confirmar con el cliente antes de irse';
    }
    return 'Plan de Mejora:\n• Revisar los detalles del servicio con el cliente\n• Mejorar la comunicación durante el trabajo\n• Solicitar feedback específico\n• Implementar controles de calidad';
  };

  const handleViewDetails = (service: ServiceHistory) => {
    setSelectedService(service);
    setShowDetailModal(true);
  };

  const getClientReview = (serviceId: string) => {
    return mockClientReviews.find(review => review.serviceHistoryId === serviceId);
  };

  if (user?.userType !== 'provider') {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: 'Acceso Denegado' }} />
        <Text style={styles.errorText}>Esta función es solo para proveedores</Text>
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
              {filteredHistory.filter(service => service.hasComplaint).length}
            </Text>
            <Text style={styles.statLabel}>Quejas</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>
              ₡{filteredHistory.reduce((sum, service) => sum + service.cost, 0).toLocaleString()}
            </Text>
            <Text style={styles.statLabel}>Ingresos</Text>
          </View>
        </View>

        {/* Services List */}
        <ScrollView style={styles.servicesList} showsVerticalScrollIndicator={false}>
          {filteredHistory.map((service) => (
            <TouchableOpacity 
              key={service.id} 
              style={[
                styles.serviceCard,
                service.hasComplaint && styles.serviceCardWithComplaint
              ]}
              onPress={() => handleViewDetails(service)}
            >
              <View style={styles.serviceHeader}>
                <View style={styles.serviceInfo}>
                  <Text style={styles.serviceName}>{service.serviceName}</Text>
                  <Text style={styles.clientName}>{service.clientName}</Text>
                  <Text style={styles.serviceDate}>
                    {new Date(service.date).toLocaleDateString('es-ES')} - {service.time}
                  </Text>
                </View>
                <View style={styles.serviceRating}>
                  <Star size={16} color="#FFD700" fill="#FFD700" />
                  <Text style={styles.ratingText}>{service.rating}</Text>
                </View>
              </View>
              
              <View style={styles.serviceFooter}>
                <Text style={styles.serviceCost}>₡{service.cost.toLocaleString()}</Text>
                {service.hasComplaint && (
                  <View style={styles.complaintIndicator}>
                    <AlertTriangle size={16} color="#FF5722" />
                    <Text style={styles.complaintText}>Queja</Text>
                  </View>
                )}
                <TouchableOpacity style={styles.viewButton}>
                  <Eye size={16} color="#2196F3" />
                  <Text style={styles.viewButtonText}>Ver Detalles</Text>
                </TouchableOpacity>
              </View>
              
              {service.comments && (
                <Text style={styles.serviceComments} numberOfLines={2}>
                  &quot;{service.comments}&quot;
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
                  <Text style={styles.detailLabel}>Cliente:</Text>
                  <Text style={styles.detailValue}>{selectedService.clientName}</Text>
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
                    <Text style={styles.detailLabel}>Comentarios del Cliente:</Text>
                    <Text style={styles.detailValue}>{selectedService.comments}</Text>
                  </View>
                )}
                
                {selectedService.hasComplaint && (
                  <View style={styles.complaintSection}>
                    <View style={styles.complaintHeader}>
                      <AlertTriangle size={20} color="#FF5722" />
                      <Text style={styles.complaintTitle}>Queja Reportada</Text>
                    </View>
                    <Text style={styles.complaintDetail}>
                      {selectedService.complaintDetails}
                    </Text>
                    <View style={styles.improvementPlan}>
                      <Text style={styles.improvementTitle}>Plan de Mejora Sugerido:</Text>
                      <Text style={styles.improvementText}>
                        {getImprovementPlan(selectedService.complaintDetails || '')}
                      </Text>
                    </View>
                  </View>
                )}
                
                {/* Client Review Section */}
                {(() => {
                  const review = getClientReview(selectedService.id);
                  if (review) {
                    return (
                      <View style={styles.reviewSection}>
                        <Text style={styles.reviewTitle}>Reseña del Cliente</Text>
                        <View style={styles.reviewRating}>
                          <Star size={16} color="#FFD700" fill="#FFD700" />
                          <Text style={styles.reviewRatingText}>{review.rating}/5.0</Text>
                        </View>
                        <Text style={styles.reviewComments}>{review.comments}</Text>
                        
                        {review.photos.length > 0 && (
                          <View style={styles.reviewPhotos}>
                            <Text style={styles.reviewPhotosTitle}>Fotos del trabajo:</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                              {review.photos.map((photo, index) => (
                                <View key={index} style={styles.reviewPhoto}>
                                  <Text style={styles.photoPlaceholder}>📷</Text>
                                </View>
                              ))}
                            </ScrollView>
                          </View>
                        )}
                        
                        <View style={styles.reviewReactions}>
                          <View style={styles.reactionItem}>
                            <ThumbsUp size={16} color="#4CAF50" />
                            <Text style={styles.reactionCount}>{review.reactions.thumbsUp}</Text>
                          </View>
                          <View style={styles.reactionItem}>
                            <ThumbsDown size={16} color="#FF5722" />
                            <Text style={styles.reactionCount}>{review.reactions.thumbsDown}</Text>
                          </View>
                        </View>
                      </View>
                    );
                  }
                  return null;
                })()}
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
  serviceCardWithComplaint: {
    borderLeftWidth: 4,
    borderLeftColor: '#FF5722',
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
    marginBottom: 4,
  },
  clientName: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  serviceDate: {
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
  complaintIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFEBEE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  complaintText: {
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
  complaintSection: {
    backgroundColor: '#FFEBEE',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  complaintHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  complaintTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF5722',
  },
  complaintDetail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    lineHeight: 20,
  },
  improvementPlan: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
  },
  improvementTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  improvementText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  reviewSection: {
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  reviewTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1976D2',
    marginBottom: 8,
  },
  reviewRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  reviewRatingText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  reviewComments: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  reviewPhotos: {
    marginBottom: 12,
  },
  reviewPhotosTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  reviewPhoto: {
    width: 60,
    height: 60,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoPlaceholder: {
    fontSize: 24,
  },
  reviewReactions: {
    flexDirection: 'row',
    gap: 16,
  },
  reactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  reactionCount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
});