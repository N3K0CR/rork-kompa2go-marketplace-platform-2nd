import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, TextInput, Alert } from 'react-native';
import { Stack, router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useReportedProblems, ReportedProblem } from '@/contexts/ReportedProblemsContext';
import { 
  ChevronLeft, 
  AlertTriangle, 
  Filter,
  X,
  Eye,
  Clock,
  User,
  Calendar,
  MessageSquare,
  CheckCircle,
  XCircle,
  Search,
  FileText
} from 'lucide-react-native';

type StatusFilter = 'all' | 'pending' | 'investigating' | 'resolved' | 'dismissed';

export default function ReportedProblemsScreen() {
  const { user } = useAuth();
  const { getProblemsForAdmin, updateProblemStatus, loading } = useReportedProblems();
  const [selectedFilter, setSelectedFilter] = useState<StatusFilter>('all');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [selectedProblem, setSelectedProblem] = useState<ReportedProblem | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [actionType, setActionType] = useState<'investigating' | 'resolved' | 'dismissed'>('investigating');

  const allProblems = getProblemsForAdmin();

  const filteredProblems = useMemo(() => {
    if (selectedFilter === 'all') return allProblems;
    return allProblems.filter(problem => problem.status === selectedFilter);
  }, [allProblems, selectedFilter]);

  const getFilterLabel = (filter: StatusFilter) => {
    switch (filter) {
      case 'pending': return 'Pendientes';
      case 'investigating': return 'En Investigación';
      case 'resolved': return 'Resueltos';
      case 'dismissed': return 'Desestimados';
      default: return 'Todos';
    }
  };

  const getStatusColor = (status: ReportedProblem['status']) => {
    switch (status) {
      case 'pending': return '#FF9800';
      case 'investigating': return '#2196F3';
      case 'resolved': return '#4CAF50';
      case 'dismissed': return '#757575';
      default: return '#666';
    }
  };

  const getStatusText = (status: ReportedProblem['status']) => {
    switch (status) {
      case 'pending': return 'Pendiente';
      case 'investigating': return 'Investigando';
      case 'resolved': return 'Resuelto';
      case 'dismissed': return 'Desestimado';
      default: return status;
    }
  };

  const handleViewDetails = (problem: ReportedProblem) => {
    setSelectedProblem(problem);
    setShowDetailModal(true);
  };

  const handleTakeAction = (problem: ReportedProblem, action: 'investigating' | 'resolved' | 'dismissed') => {
    setSelectedProblem(problem);
    setActionType(action);
    setAdminNotes(problem.adminNotes || '');
    setShowActionModal(true);
  };

  const handleSubmitAction = async () => {
    if (!selectedProblem) return;

    try {
      await updateProblemStatus(selectedProblem.id, actionType, adminNotes.trim() || undefined);
      
      Alert.alert(
        'Acción Completada',
        `El problema ha sido marcado como ${getStatusText(actionType).toLowerCase()}.`,
        [
          {
            text: 'OK',
            onPress: () => {
              setShowActionModal(false);
              setShowDetailModal(false);
              setSelectedProblem(null);
              setAdminNotes('');
            }
          }
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'No se pudo actualizar el estado del problema.');
    }
  };

  const getStatsByStatus = () => {
    const stats = {
      pending: allProblems.filter(p => p.status === 'pending').length,
      investigating: allProblems.filter(p => p.status === 'investigating').length,
      resolved: allProblems.filter(p => p.status === 'resolved').length,
      dismissed: allProblems.filter(p => p.status === 'dismissed').length,
    };
    return stats;
  };

  if (user?.userType !== 'admin') {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: 'Acceso Denegado' }} />
        <Text style={styles.errorText}>Esta función es solo para administradores</Text>
      </View>
    );
  }

  const stats = getStatsByStatus();

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{
          title: 'Problemas Reportados',
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
            <Text style={[styles.statNumber, { color: '#FF9800' }]}>{stats.pending}</Text>
            <Text style={styles.statLabel}>Pendientes</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statNumber, { color: '#2196F3' }]}>{stats.investigating}</Text>
            <Text style={styles.statLabel}>Investigando</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statNumber, { color: '#4CAF50' }]}>{stats.resolved}</Text>
            <Text style={styles.statLabel}>Resueltos</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statNumber, { color: '#757575' }]}>{stats.dismissed}</Text>
            <Text style={styles.statLabel}>Desestimados</Text>
          </View>
        </View>

        {/* Problems List */}
        <ScrollView style={styles.problemsList} showsVerticalScrollIndicator={false}>
          {filteredProblems.map((problem) => (
            <TouchableOpacity 
              key={problem.id} 
              style={[
                styles.problemCard,
                { borderLeftColor: getStatusColor(problem.status) }
              ]}
              onPress={() => handleViewDetails(problem)}
            >
              <View style={styles.problemHeader}>
                <View style={styles.problemInfo}>
                  <Text style={styles.serviceName}>{problem.serviceName}</Text>
                  <View style={styles.clientInfo}>
                    <User size={14} color="#666" />
                    <Text style={styles.clientName}>{problem.clientName}</Text>
                  </View>
                  <View style={styles.providerInfo}>
                    <Text style={styles.providerLabel}>Proveedor:</Text>
                    <Text style={styles.providerName}>{problem.providerName}</Text>
                  </View>
                  <View style={styles.dateInfo}>
                    <Calendar size={14} color="#666" />
                    <Text style={styles.serviceDate}>
                      {new Date(problem.serviceDate).toLocaleDateString('es-ES')} - {problem.serviceTime}
                    </Text>
                  </View>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(problem.status) }]}>
                  <Text style={styles.statusText}>{getStatusText(problem.status)}</Text>
                </View>
              </View>
              
              <Text style={styles.problemDescription} numberOfLines={2}>
                {problem.problemDescription}
              </Text>

              <View style={styles.problemFooter}>
                <View style={styles.reportDate}>
                  <Clock size={14} color="#999" />
                  <Text style={styles.reportDateText}>
                    Reportado: {new Date(problem.reportDate).toLocaleDateString('es-ES')}
                  </Text>
                </View>
                <TouchableOpacity style={styles.viewButton}>
                  <Eye size={16} color="#2196F3" />
                  <Text style={styles.viewButtonText}>Ver Detalles</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))}
          
          {filteredProblems.length === 0 && (
            <View style={styles.emptyState}>
              <Search size={48} color="#666" />
              <Text style={styles.emptyStateText}>
                No hay problemas para el filtro seleccionado
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
              <Text style={styles.modalTitle}>Filtrar por Estado</Text>
              <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                <X size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.filterOptions}>
              {(['all', 'pending', 'investigating', 'resolved', 'dismissed'] as StatusFilter[]).map((filter) => (
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

      {/* Problem Detail Modal */}
      <Modal
        visible={showDetailModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDetailModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.detailModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Detalles del Problema</Text>
              <TouchableOpacity onPress={() => setShowDetailModal(false)}>
                <X size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            {selectedProblem && (
              <ScrollView style={styles.detailContent}>
                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Estado:</Text>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(selectedProblem.status) }]}>
                    <Text style={styles.statusText}>{getStatusText(selectedProblem.status)}</Text>
                  </View>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Servicio:</Text>
                  <Text style={styles.detailValue}>{selectedProblem.serviceName}</Text>
                </View>
                
                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Cliente:</Text>
                  <Text style={styles.detailValue}>{selectedProblem.clientName}</Text>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Proveedor:</Text>
                  <Text style={styles.detailValue}>{selectedProblem.providerName}</Text>
                </View>
                
                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Fecha del Servicio:</Text>
                  <Text style={styles.detailValue}>
                    {new Date(selectedProblem.serviceDate).toLocaleDateString('es-ES')} - {selectedProblem.serviceTime}
                  </Text>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Fecha del Reporte:</Text>
                  <Text style={styles.detailValue}>
                    {new Date(selectedProblem.reportDate).toLocaleDateString('es-ES', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </Text>
                </View>
                
                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Descripción del Problema:</Text>
                  <Text style={styles.problemDescriptionFull}>{selectedProblem.problemDescription}</Text>
                </View>

                {selectedProblem.adminNotes && (
                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>Notas del Administrador:</Text>
                    <Text style={styles.detailValue}>{selectedProblem.adminNotes}</Text>
                  </View>
                )}

                {selectedProblem.resolutionDate && (
                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>Fecha de Resolución:</Text>
                    <Text style={styles.detailValue}>
                      {new Date(selectedProblem.resolutionDate).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </Text>
                  </View>
                )}

                {/* Action Buttons */}
                {selectedProblem.status === 'pending' && (
                  <View style={styles.actionButtons}>
                    <TouchableOpacity
                      style={[styles.actionButton, { backgroundColor: '#2196F3' }]}
                      onPress={() => handleTakeAction(selectedProblem, 'investigating')}
                    >
                      <Search size={20} color="white" />
                      <Text style={styles.actionButtonText}>Investigar</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {selectedProblem.status === 'investigating' && (
                  <View style={styles.actionButtons}>
                    <TouchableOpacity
                      style={[styles.actionButton, { backgroundColor: '#4CAF50' }]}
                      onPress={() => handleTakeAction(selectedProblem, 'resolved')}
                    >
                      <CheckCircle size={20} color="white" />
                      <Text style={styles.actionButtonText}>Resolver</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionButton, { backgroundColor: '#757575' }]}
                      onPress={() => handleTakeAction(selectedProblem, 'dismissed')}
                    >
                      <XCircle size={20} color="white" />
                      <Text style={styles.actionButtonText}>Desestimar</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Action Modal */}
      <Modal
        visible={showActionModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowActionModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.actionModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {actionType === 'investigating' && 'Marcar como En Investigación'}
                {actionType === 'resolved' && 'Resolver Problema'}
                {actionType === 'dismissed' && 'Desestimar Problema'}
              </Text>
              <TouchableOpacity onPress={() => setShowActionModal(false)}>
                <X size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.actionDescription}>
              {actionType === 'investigating' && 'Agrega notas sobre la investigación en curso:'}
              {actionType === 'resolved' && 'Describe cómo se resolvió el problema:'}
              {actionType === 'dismissed' && 'Explica por qué se desestima este problema:'}
            </Text>

            <View style={styles.textAreaContainer}>
              <TextInput
                style={styles.textArea}
                placeholder="Escribe tus notas aquí..."
                value={adminNotes}
                onChangeText={setAdminNotes}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.actionModalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowActionModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmButton, { backgroundColor: getStatusColor(actionType) }]}
                onPress={handleSubmitAction}
                disabled={loading}
              >
                <Text style={styles.confirmButtonText}>
                  {loading ? 'Procesando...' : 'Confirmar'}
                </Text>
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
    gap: 8,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 10,
    color: '#666',
    textAlign: 'center',
  },
  problemsList: {
    flex: 1,
  },
  problemCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  problemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  problemInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 6,
  },
  clientInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  clientName: {
    fontSize: 14,
    color: '#666',
  },
  providerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  providerLabel: {
    fontSize: 12,
    color: '#999',
  },
  providerName: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  dateInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  serviceDate: {
    fontSize: 12,
    color: '#999',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  problemDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  problemDescriptionFull: {
    fontSize: 14,
    color: '#333',
    lineHeight: 22,
    backgroundColor: '#F8F9FA',
    padding: 12,
    borderRadius: 8,
  },
  problemFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  reportDate: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  reportDateText: {
    fontSize: 12,
    color: '#999',
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
  actionModalContent: {
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
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
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
    maxHeight: 500,
  },
  detailSection: {
    marginBottom: 16,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 6,
  },
  detailValue: {
    fontSize: 16,
    color: '#333',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  actionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    lineHeight: 20,
  },
  textAreaContainer: {
    marginBottom: 20,
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
  actionModalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});