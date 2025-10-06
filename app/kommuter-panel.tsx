import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Modal, Switch, ActivityIndicator } from 'react-native';
import { Stack, router } from 'expo-router';
import { 
  TrendingUp, 
  Users, 
  Calendar, 
  DollarSign, 
  AlertTriangle, 
  MessageSquare, 
  Star, 
  Gift, 
  Megaphone,
  Shield,
  X,
  Plus,
  Edit,
  Trash2,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  Car,
  Phone,
  Mail,
  MapPin,
  UserCheck,
  UserX
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { calculateRevenueEstimates, formatCRC, PRICING_CONSTANTS } from '@/src/modules/commute/utils/pricing';
import { db, auth } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, updateDoc, getDoc, orderBy } from 'firebase/firestore';
import { signInAnonymously } from 'firebase/auth';
import type { KommuterRegistrationData, VehicleData } from '@/src/shared/types/registration-types';
import { alertTrackingService } from '@/src/modules/alerts/services/alert-tracking-service';
import type { DriverTrackingSession } from '@/src/shared/types/alert-types';
import SecurityVerificationModal from '@/components/SecurityVerificationModal';

type AlertType = 'danger' | 'rating' | 'complaint';
type AlertStatus = 'active' | 'resolved' | 'investigating' | 'awaiting_verification';

interface DriverAlert {
  id: string;
  driverId: string;
  driverName: string;
  type: AlertType;
  message: string;
  encryptedCode: string;
  location?: { lat: number; lng: number };
  timestamp: Date;
  status: AlertStatus;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

interface Promotion {
  id: string;
  title: string;
  description: string;
  discount: number;
  validUntil: Date;
  active: boolean;
  type: 'percentage' | 'fixed';
}

interface BrandCollaboration {
  id: string;
  brandName: string;
  description: string;
  benefit: string;
  active: boolean;
}

interface PendingKommuter {
  id: string;
  personalInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    cedula: string;
    dateOfBirth: string;
    address: string;
  };
  driverLicense: {
    number: string;
    expirationDate: string;
    category: string;
  };
  vehicleInfo: {
    isFleet: boolean;
    vehicles: VehicleData[];
    fleetDrivers?: any[];
  };
  status: 'pending' | 'approved' | 'rejected';
  createdAt: any;
  documents?: Record<string, any>;
}

export default function KommuterPanel() {
  const insets = useSafeAreaInsets();
  const [averageTripsPerDay, setAverageTripsPerDay] = useState('100');
  const [averageTripPrice, setAverageTripPrice] = useState('2500');
  const [showPromotionModal, setShowPromotionModal] = useState(false);
  const [showCollaborationModal, setShowCollaborationModal] = useState(false);
  const [showAlertDetailModal, setShowAlertDetailModal] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<DriverAlert | null>(null);
  const [showKommuterDetailModal, setShowKommuterDetailModal] = useState(false);
  const [selectedKommuter, setSelectedKommuter] = useState<PendingKommuter | null>(null);
  const [pendingKommuters, setPendingKommuters] = useState<PendingKommuter[]>([]);
  const [loadingKommuters, setLoadingKommuters] = useState(true);
  const [processingApproval, setProcessingApproval] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [trackingSessions, setTrackingSessions] = useState<Map<string, DriverTrackingSession>>(new Map());
  const [showSecurityVerificationModal, setShowSecurityVerificationModal] = useState(false);
  const [verificationAlert, setVerificationAlert] = useState<DriverAlert | null>(null);

  const [promotions, setPromotions] = useState<Promotion[]>([
    {
      id: '1',
      title: 'Descuento Fin de Semana',
      description: 'Viajes con 15% de descuento',
      discount: 15,
      validUntil: new Date('2025-12-31'),
      active: true,
      type: 'percentage'
    }
  ]);

  const [collaborations, setCollaborations] = useState<BrandCollaboration[]>([
    {
      id: '1',
      brandName: 'Café Britt',
      description: 'Descuentos en productos',
      benefit: '10% descuento en tienda',
      active: true
    }
  ]);

  const [driverAlerts, setDriverAlerts] = useState<DriverAlert[]>([
    {
      id: '1',
      driverId: '2KPAB123',
      driverName: 'Juan Pérez',
      type: 'danger',
      message: 'Alerta de peligro activada',
      encryptedCode: 'ALPHA-TANGO-9-4',
      location: { lat: 9.9281, lng: -84.0907 },
      timestamp: new Date(),
      status: 'active',
      priority: 'critical'
    },
    {
      id: '2',
      driverId: '2KPCD456',
      driverName: 'María González',
      type: 'rating',
      message: 'Calificación baja recibida',
      encryptedCode: 'BRAVO-ECHO-2-7',
      timestamp: new Date(Date.now() - 3600000),
      status: 'investigating',
      priority: 'medium'
    },
    {
      id: '3',
      driverId: '2KPEF789',
      driverName: 'Carlos Rodríguez',
      type: 'complaint',
      message: 'Queja de usuario recibida',
      encryptedCode: 'CHARLIE-DELTA-5-1',
      timestamp: new Date(Date.now() - 7200000),
      status: 'resolved',
      priority: 'low'
    }
  ]);

  const tripsPerDay = parseInt(averageTripsPerDay) || 0;
  const tripPrice = parseInt(averageTripPrice) || 0;
  const estimates = calculateRevenueEstimates(tripsPerDay, tripPrice);

  const commissionPercentage = PRICING_CONSTANTS.KOMPA2GO_COMMISSION * 100;
  const driverSharePercentage = PRICING_CONSTANTS.DRIVER_SHARE * 100;
  const ivaPercentage = PRICING_CONSTANTS.IVA_RATE * 100;

  const handleAlertAction = async (alertId: string, action: 'resolve' | 'investigate' | 'verify') => {
    const alert = driverAlerts.find(a => a.id === alertId);
    if (!alert) return;

    if (action === 'verify') {
      setVerificationAlert(alert);
      setShowSecurityVerificationModal(true);
    } else if (action === 'resolve') {
      updateAlertStatus(alertId, 'resolved');
      Alert.alert('✅ Alerta Resuelta', 'La alerta ha sido marcada como resuelta.');
    } else if (action === 'investigate') {
      updateAlertStatus(alertId, 'investigating');
      Alert.alert('🔍 En Investigación', 'La alerta está siendo investigada.');
    }
  };

  const handleVerificationComplete = (action: 'tracking_enabled' | '911_called' | 'dismissed') => {
    if (verificationAlert) {
      if (action === '911_called') {
        updateAlertStatus(verificationAlert.id, 'investigating');
      } else if (action === 'dismissed') {
        updateAlertStatus(verificationAlert.id, 'resolved');
      }
    }
    setVerificationAlert(null);
  };

  const updateAlertStatus = (alertId: string, status: AlertStatus) => {
    setDriverAlerts(prev => 
      prev.map(alert => 
        alert.id === alertId ? { ...alert, status } : alert
      )
    );
  };

  const getAlertColor = (type: AlertType) => {
    switch (type) {
      case 'danger': return '#FF3B30';
      case 'rating': return '#FF9500';
      case 'complaint': return '#FFCC00';
      default: return '#999';
    }
  };

  const getAlertIcon = (type: AlertType) => {
    switch (type) {
      case 'danger': return <AlertTriangle size={20} color="#fff" />;
      case 'rating': return <Star size={20} color="#fff" />;
      case 'complaint': return <MessageSquare size={20} color="#fff" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return '#FF3B30';
      case 'high': return '#FF9500';
      case 'medium': return '#FFCC00';
      case 'low': return '#34C759';
      default: return '#999';
    }
  };

  const activeAlerts = driverAlerts.filter(a => a.status === 'active');
  const investigatingAlerts = driverAlerts.filter(a => a.status === 'investigating');

  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      if (!auth.currentUser) {
        console.log('[KommuterPanel] No user authenticated, signing in anonymously...');
        await signInAnonymously(auth);
        console.log('[KommuterPanel] Anonymous sign in successful');
      }
      await loadPendingKommuters();
    } catch (error) {
      console.error('[KommuterPanel] Auth initialization error:', error);
      setAuthError('Error de autenticación. Por favor recarga la página.');
      setLoadingKommuters(false);
    }
  };

  const loadPendingKommuters = async () => {
    try {
      setLoadingKommuters(true);
      const q = query(
        collection(db, 'kommuters'),
        where('status', '==', 'pending'),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      const kommuters = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as PendingKommuter[];
      setPendingKommuters(kommuters);
      console.log('✅ Loaded pending kommuters:', kommuters.length);
    } catch (error) {
      console.error('❌ Error loading pending kommuters:', error);
      Alert.alert('Error', 'No se pudieron cargar las aprobaciones pendientes');
    } finally {
      setLoadingKommuters(false);
    }
  };

  const handleApproveKommuter = async (kommuterId: string) => {
    Alert.alert(
      '✅ Aprobar Conductor',
      '¿Está seguro que desea aprobar este conductor?\n\nEl conductor podrá comenzar a recibir viajes.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Aprobar',
          style: 'default',
          onPress: async () => {
            try {
              setProcessingApproval(true);
              const kommuterRef = doc(db, 'kommuters', kommuterId);
              await updateDoc(kommuterRef, {
                status: 'approved',
                approvedAt: new Date(),
                updatedAt: new Date()
              });
              
              Alert.alert('✅ Aprobado', 'El conductor ha sido aprobado exitosamente');
              await loadPendingKommuters();
              setShowKommuterDetailModal(false);
            } catch (error) {
              console.error('❌ Error approving kommuter:', error);
              Alert.alert('Error', 'No se pudo aprobar el conductor');
            } finally {
              setProcessingApproval(false);
            }
          }
        }
      ]
    );
  };

  const handleRejectKommuter = async (kommuterId: string) => {
    Alert.alert(
      '❌ Rechazar Conductor',
      '¿Está seguro que desea rechazar este conductor?\n\nEsta acción puede ser revertida más tarde.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Rechazar',
          style: 'destructive',
          onPress: async () => {
            try {
              setProcessingApproval(true);
              const kommuterRef = doc(db, 'kommuters', kommuterId);
              await updateDoc(kommuterRef, {
                status: 'rejected',
                rejectedAt: new Date(),
                updatedAt: new Date()
              });
              
              Alert.alert('❌ Rechazado', 'El conductor ha sido rechazado');
              await loadPendingKommuters();
              setShowKommuterDetailModal(false);
            } catch (error) {
              console.error('❌ Error rejecting kommuter:', error);
              Alert.alert('Error', 'No se pudo rechazar el conductor');
            } finally {
              setProcessingApproval(false);
            }
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: 'Kommuter Panel',
          headerStyle: { backgroundColor: '#65ea06' },
          headerTintColor: '#131c0d',
          headerTitleStyle: { fontWeight: '700' as const },
        }} 
      />

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.alertsSection}>
          <View style={styles.sectionHeader}>
            <AlertTriangle size={24} color="#FF3B30" />
            <Text style={styles.sectionTitle}>Alertas en Tiempo Real</Text>
            {activeAlerts.length > 0 && (
              <View style={styles.alertBadge}>
                <Text style={styles.alertBadgeText}>{activeAlerts.length}</Text>
              </View>
            )}
          </View>

          {activeAlerts.length === 0 && investigatingAlerts.length === 0 ? (
            <View style={styles.emptyState}>
              <CheckCircle size={48} color="#34C759" />
              <Text style={styles.emptyStateText}>No hay alertas activas</Text>
            </View>
          ) : (
            <>
              {activeAlerts.map(alert => (
                <TouchableOpacity
                  key={alert.id}
                  style={[styles.alertCard, { borderLeftColor: getAlertColor(alert.type) }]}
                  onPress={() => {
                    setSelectedAlert(alert);
                    setShowAlertDetailModal(true);
                  }}
                >
                  <View style={styles.alertHeader}>
                    <View style={[styles.alertTypeIcon, { backgroundColor: getAlertColor(alert.type) }]}>
                      {getAlertIcon(alert.type)}
                    </View>
                    <View style={styles.alertInfo}>
                      <Text style={styles.alertDriverName}>{alert.driverName}</Text>
                      <Text style={styles.alertMessage}>{alert.message}</Text>
                    </View>
                    <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(alert.priority) }]}>
                      <Text style={styles.priorityText}>{alert.priority.toUpperCase()}</Text>
                    </View>
                  </View>
                  <View style={styles.alertFooter}>
                    <Text style={styles.encryptedCode}>🔐 {alert.encryptedCode}</Text>
                    <Text style={styles.alertTime}>
                      {new Date(alert.timestamp).toLocaleTimeString('es-CR', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}

              {investigatingAlerts.map(alert => (
                <TouchableOpacity
                  key={alert.id}
                  style={[styles.alertCard, styles.alertCardInvestigating]}
                  onPress={() => {
                    setSelectedAlert(alert);
                    setShowAlertDetailModal(true);
                  }}
                >
                  <View style={styles.alertHeader}>
                    <View style={[styles.alertTypeIcon, { backgroundColor: '#007AFF' }]}>
                      <Eye size={20} color="#fff" />
                    </View>
                    <View style={styles.alertInfo}>
                      <Text style={styles.alertDriverName}>{alert.driverName}</Text>
                      <Text style={styles.alertMessage}>En investigación</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </>
          )}
        </View>

        <View style={styles.revenueSection}>
          <View style={styles.sectionHeader}>
            <TrendingUp size={24} color="#65ea06" />
            <Text style={styles.sectionTitle}>Estimaciones de Ingresos</Text>
          </View>

          <View style={styles.calculatorCard}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Viajes promedio por día</Text>
              <TextInput
                style={styles.input}
                value={averageTripsPerDay}
                onChangeText={setAverageTripsPerDay}
                keyboardType="numeric"
                placeholder="100"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Precio promedio por viaje (sin IVA)</Text>
              <View style={styles.inputWithPrefix}>
                <Text style={styles.inputPrefix}>₡</Text>
                <TextInput
                  style={styles.inputWithPrefixField}
                  value={averageTripPrice}
                  onChangeText={setAverageTripPrice}
                  keyboardType="numeric"
                  placeholder="2500"
                />
              </View>
            </View>
          </View>

          <View style={styles.estimatesGrid}>
            <View style={styles.estimateCard}>
              <Text style={styles.estimatePeriod}>Semanal</Text>
              <Text style={styles.estimateValue}>{formatCRC(estimates.weekly.revenue)}</Text>
              <Text style={styles.estimateLabel}>Ingresos Kompa2Go</Text>
            </View>

            <View style={styles.estimateCard}>
              <Text style={styles.estimatePeriod}>Mensual</Text>
              <Text style={styles.estimateValue}>{formatCRC(estimates.monthly.revenue)}</Text>
              <Text style={styles.estimateLabel}>Ingresos Kompa2Go</Text>
            </View>

            <View style={[styles.estimateCard, styles.estimateCardHighlight]}>
              <Text style={styles.estimatePeriodHighlight}>Anual</Text>
              <Text style={styles.estimateValueHighlight}>{formatCRC(estimates.annual.revenue)}</Text>
              <Text style={styles.estimateLabel}>Ingresos Kompa2Go</Text>
            </View>
          </View>
        </View>

        <View style={styles.promotionsSection}>
          <View style={styles.sectionHeader}>
            <Gift size={24} color="#FF9500" />
            <Text style={styles.sectionTitle}>Promociones</Text>
            <TouchableOpacity 
              style={styles.addButton}
              onPress={() => setShowPromotionModal(true)}
            >
              <Plus size={20} color="#fff" />
            </TouchableOpacity>
          </View>

          {promotions.map(promo => (
            <View key={promo.id} style={styles.promoCard}>
              <View style={styles.promoHeader}>
                <Text style={styles.promoTitle}>{promo.title}</Text>
                <Switch
                  value={promo.active}
                  onValueChange={(value) => {
                    setPromotions(prev => 
                      prev.map(p => p.id === promo.id ? { ...p, active: value } : p)
                    );
                  }}
                  trackColor={{ false: '#ccc', true: '#65ea06' }}
                  thumbColor={promo.active ? '#fff' : '#f4f3f4'}
                />
              </View>
              <Text style={styles.promoDescription}>{promo.description}</Text>
              <View style={styles.promoFooter}>
                <Text style={styles.promoDiscount}>{promo.discount}% OFF</Text>
                <Text style={styles.promoValidity}>
                  Válido hasta {new Date(promo.validUntil).toLocaleDateString('es-CR')}
                </Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.collaborationsSection}>
          <View style={styles.sectionHeader}>
            <Megaphone size={24} color="#007AFF" />
            <Text style={styles.sectionTitle}>Colaboraciones con Marcas</Text>
            <TouchableOpacity 
              style={styles.addButton}
              onPress={() => setShowCollaborationModal(true)}
            >
              <Plus size={20} color="#fff" />
            </TouchableOpacity>
          </View>

          {collaborations.map(collab => (
            <View key={collab.id} style={styles.collabCard}>
              <View style={styles.collabHeader}>
                <Text style={styles.collabBrand}>{collab.brandName}</Text>
                <Switch
                  value={collab.active}
                  onValueChange={(value) => {
                    setCollaborations(prev => 
                      prev.map(c => c.id === collab.id ? { ...c, active: value } : c)
                    );
                  }}
                  trackColor={{ false: '#ccc', true: '#007AFF' }}
                  thumbColor={collab.active ? '#fff' : '#f4f3f4'}
                />
              </View>
              <Text style={styles.collabDescription}>{collab.description}</Text>
              <View style={styles.collabBenefit}>
                <Gift size={16} color="#007AFF" />
                <Text style={styles.collabBenefitText}>{collab.benefit}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.driversSection}>
          <View style={styles.sectionHeader}>
            <Users size={24} color="#6b9e47" />
            <Text style={styles.sectionTitle}>Gestión de Conductores</Text>
          </View>

          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>247</Text>
              <Text style={styles.statLabel}>Conductores Activos</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>4.8</Text>
              <Text style={styles.statLabel}>Calificación Promedio</Text>
            </View>
            <TouchableOpacity 
              style={[styles.statCard, pendingKommuters.length > 0 && styles.statCardHighlight]}
              onPress={() => {}}
            >
              <Text style={[styles.statNumber, pendingKommuters.length > 0 && styles.statNumberHighlight]}>
                {pendingKommuters.length}
              </Text>
              <Text style={styles.statLabel}>Pendientes Aprobación</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.pendingApprovalsSection}>
            <View style={styles.sectionSubHeader}>
              <Clock size={20} color="#FF9500" />
              <Text style={styles.sectionSubTitle}>Aprobaciones Pendientes</Text>
            </View>

            {authError ? (
              <View style={styles.errorContainer}>
                <XCircle size={48} color="#FF3B30" />
                <Text style={styles.errorText}>{authError}</Text>
                <TouchableOpacity 
                  style={styles.retryButton}
                  onPress={() => {
                    setAuthError(null);
                    setLoadingKommuters(true);
                    initializeAuth();
                  }}
                >
                  <Text style={styles.retryButtonText}>Reintentar</Text>
                </TouchableOpacity>
              </View>
            ) : loadingKommuters ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#65ea06" />
                <Text style={styles.loadingText}>Cargando conductores...</Text>
              </View>
            ) : pendingKommuters.length === 0 ? (
              <View style={styles.emptyState}>
                <CheckCircle size={48} color="#34C759" />
                <Text style={styles.emptyStateText}>No hay aprobaciones pendientes</Text>
              </View>
            ) : (
              pendingKommuters.map(kommuter => (
                <TouchableOpacity
                  key={kommuter.id}
                  style={styles.kommuterCard}
                  onPress={() => {
                    setSelectedKommuter(kommuter);
                    setShowKommuterDetailModal(true);
                  }}
                >
                  <View style={styles.kommuterHeader}>
                    <View style={styles.kommuterAvatar}>
                      <Users size={24} color="#65ea06" />
                    </View>
                    <View style={styles.kommuterInfo}>
                      <Text style={styles.kommuterName}>
                        {kommuter.personalInfo.firstName} {kommuter.personalInfo.lastName}
                      </Text>
                      <Text style={styles.kommuterEmail}>{kommuter.personalInfo.email}</Text>
                    </View>
                    <View style={styles.pendingBadge}>
                      <Clock size={16} color="#FF9500" />
                    </View>
                  </View>
                  <View style={styles.kommuterDetails}>
                    <View style={styles.kommuterDetailRow}>
                      <Phone size={14} color="#6b9e47" />
                      <Text style={styles.kommuterDetailText}>{kommuter.personalInfo.phone}</Text>
                    </View>
                    <View style={styles.kommuterDetailRow}>
                      <FileText size={14} color="#6b9e47" />
                      <Text style={styles.kommuterDetailText}>Cédula: {kommuter.personalInfo.cedula}</Text>
                    </View>
                    <View style={styles.kommuterDetailRow}>
                      <Car size={14} color="#6b9e47" />
                      <Text style={styles.kommuterDetailText}>
                        {kommuter.vehicleInfo.vehicles.length} vehículo(s)
                      </Text>
                    </View>
                  </View>
                  <View style={styles.kommuterFooter}>
                    <Text style={styles.kommuterDate}>
                      Registrado: {kommuter.createdAt?.toDate ? 
                        kommuter.createdAt.toDate().toLocaleDateString('es-CR') : 
                        'Fecha no disponible'
                      }
                    </Text>
                    <TouchableOpacity
                      style={styles.reviewButton}
                      onPress={() => {
                        setSelectedKommuter(kommuter);
                        setShowKommuterDetailModal(true);
                      }}
                    >
                      <Text style={styles.reviewButtonText}>Revisar</Text>
                      <Eye size={16} color="#65ea06" />
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>
        </View>
      </ScrollView>

      <Modal
        visible={showAlertDetailModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAlertDetailModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Detalle de Alerta</Text>
              <TouchableOpacity onPress={() => setShowAlertDetailModal(false)}>
                <X size={24} color="#666" />
              </TouchableOpacity>
            </View>

            {selectedAlert && (
              <>
                <View style={[styles.alertTypeIconLarge, { backgroundColor: getAlertColor(selectedAlert.type) }]}>
                  {getAlertIcon(selectedAlert.type)}
                </View>

                <View style={styles.alertDetailSection}>
                  <Text style={styles.alertDetailLabel}>Conductor</Text>
                  <Text style={styles.alertDetailValue}>{selectedAlert.driverName}</Text>
                </View>

                <View style={styles.alertDetailSection}>
                  <Text style={styles.alertDetailLabel}>ID Conductor</Text>
                  <Text style={styles.alertDetailValue}>{selectedAlert.driverId}</Text>
                </View>

                <View style={styles.alertDetailSection}>
                  <Text style={styles.alertDetailLabel}>Código Encriptado</Text>
                  <Text style={styles.encryptedCodeLarge}>🔐 {selectedAlert.encryptedCode}</Text>
                </View>

                <View style={styles.alertDetailSection}>
                  <Text style={styles.alertDetailLabel}>Mensaje</Text>
                  <Text style={styles.alertDetailValue}>{selectedAlert.message}</Text>
                </View>

                {selectedAlert.location && (
                  <View style={styles.alertDetailSection}>
                    <Text style={styles.alertDetailLabel}>Ubicación</Text>
                    <Text style={styles.alertDetailValue}>
                      📍 {selectedAlert.location.lat.toFixed(4)}, {selectedAlert.location.lng.toFixed(4)}
                    </Text>
                  </View>
                )}

                <View style={styles.alertDetailSection}>
                  <Text style={styles.alertDetailLabel}>Hora</Text>
                  <Text style={styles.alertDetailValue}>
                    {new Date(selectedAlert.timestamp).toLocaleString('es-CR')}
                  </Text>
                </View>

                {selectedAlert.type === 'danger' && selectedAlert.status === 'active' && (
                  <TouchableOpacity
                    style={styles.verifyButton}
                    onPress={() => {
                      handleAlertAction(selectedAlert.id, 'verify');
                      setShowAlertDetailModal(false);
                    }}
                  >
                    <Shield size={20} color="#fff" />
                    <Text style={styles.verifyButtonText}>Iniciar Verificación de Seguridad</Text>
                  </TouchableOpacity>
                )}

                <View style={styles.alertActions}>
                  {selectedAlert.status === 'active' && (
                    <TouchableOpacity
                      style={styles.investigateButton}
                      onPress={() => {
                        handleAlertAction(selectedAlert.id, 'investigate');
                        setShowAlertDetailModal(false);
                      }}
                    >
                      <Eye size={18} color="#fff" />
                      <Text style={styles.actionButtonText}>Investigar</Text>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity
                    style={styles.resolveButton}
                    onPress={() => {
                      handleAlertAction(selectedAlert.id, 'resolve');
                      setShowAlertDetailModal(false);
                    }}
                  >
                    <CheckCircle size={18} color="#fff" />
                    <Text style={styles.actionButtonText}>Resolver</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      <Modal
        visible={showKommuterDetailModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowKommuterDetailModal(false)}
      >
        <View style={styles.modalOverlay}>
          <ScrollView 
            style={styles.modalScrollView}
            contentContainerStyle={styles.modalScrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Detalle del Conductor</Text>
                <TouchableOpacity onPress={() => setShowKommuterDetailModal(false)}>
                  <X size={24} color="#666" />
                </TouchableOpacity>
              </View>

              {selectedKommuter && (
                <>
                  <View style={styles.kommuterAvatarLarge}>
                    <Users size={48} color="#65ea06" />
                  </View>

                  <View style={styles.detailSection}>
                    <Text style={styles.detailSectionTitle}>Información Personal</Text>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Nombre Completo:</Text>
                      <Text style={styles.detailValue}>
                        {selectedKommuter.personalInfo.firstName} {selectedKommuter.personalInfo.lastName}
                      </Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Cédula:</Text>
                      <Text style={styles.detailValue}>{selectedKommuter.personalInfo.cedula}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Fecha de Nacimiento:</Text>
                      <Text style={styles.detailValue}>{selectedKommuter.personalInfo.dateOfBirth}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Email:</Text>
                      <Text style={styles.detailValue}>{selectedKommuter.personalInfo.email}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Teléfono:</Text>
                      <Text style={styles.detailValue}>{selectedKommuter.personalInfo.phone}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Dirección:</Text>
                      <Text style={styles.detailValue}>{selectedKommuter.personalInfo.address}</Text>
                    </View>
                  </View>

                  <View style={styles.detailSection}>
                    <Text style={styles.detailSectionTitle}>Licencia de Conducir</Text>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Número:</Text>
                      <Text style={styles.detailValue}>{selectedKommuter.driverLicense.number}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Categoría:</Text>
                      <Text style={styles.detailValue}>{selectedKommuter.driverLicense.category}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Vencimiento:</Text>
                      <Text style={styles.detailValue}>{selectedKommuter.driverLicense.expirationDate}</Text>
                    </View>
                  </View>

                  <View style={styles.detailSection}>
                    <Text style={styles.detailSectionTitle}>Vehículos Registrados</Text>
                    {selectedKommuter.vehicleInfo.vehicles.map((vehicle, index) => (
                      <View key={index} style={styles.vehicleCard}>
                        <View style={styles.vehicleHeader}>
                          <Car size={20} color="#65ea06" />
                          <Text style={styles.vehicleTitle}>
                            {vehicle.brand} {vehicle.model} ({vehicle.year})
                          </Text>
                        </View>
                        <View style={styles.vehicleDetails}>
                          <View style={styles.vehicleDetailRow}>
                            <Text style={styles.vehicleDetailLabel}>Placa:</Text>
                            <Text style={styles.vehicleDetailValue}>{vehicle.plate}</Text>
                          </View>
                          <View style={styles.vehicleDetailRow}>
                            <Text style={styles.vehicleDetailLabel}>Color:</Text>
                            <Text style={styles.vehicleDetailValue}>{vehicle.color}</Text>
                          </View>
                          <View style={styles.vehicleDetailRow}>
                            <Text style={styles.vehicleDetailLabel}>Capacidad:</Text>
                            <Text style={styles.vehicleDetailValue}>{vehicle.capacity} pasajeros</Text>
                          </View>
                          <View style={styles.vehicleDetailRow}>
                            <Text style={styles.vehicleDetailLabel}>Tipo:</Text>
                            <Text style={styles.vehicleDetailValue}>{vehicle.vehicleType}</Text>
                          </View>
                        </View>
                      </View>
                    ))}
                  </View>

                  {selectedKommuter.vehicleInfo.isFleet && selectedKommuter.vehicleInfo.fleetDrivers && (
                    <View style={styles.detailSection}>
                      <Text style={styles.detailSectionTitle}>Conductores de Flotilla</Text>
                      {selectedKommuter.vehicleInfo.fleetDrivers.map((driver: any, index: number) => (
                        <View key={index} style={styles.fleetDriverCard}>
                          <Text style={styles.fleetDriverName}>{driver.firstName} {driver.lastName}</Text>
                          <Text style={styles.fleetDriverDetail}>Cédula: {driver.cedula}</Text>
                          <Text style={styles.fleetDriverDetail}>Licencia: {driver.licenseNumber}</Text>
                          <Text style={styles.fleetDriverDetail}>Teléfono: {driver.phone}</Text>
                        </View>
                      ))}
                    </View>
                  )}

                  {processingApproval ? (
                    <View style={styles.processingContainer}>
                      <ActivityIndicator size="large" color="#65ea06" />
                      <Text style={styles.processingText}>Procesando...</Text>
                    </View>
                  ) : (
                    <View style={styles.approvalActions}>
                      <TouchableOpacity
                        style={styles.rejectButton}
                        onPress={() => handleRejectKommuter(selectedKommuter.id)}
                      >
                        <UserX size={20} color="#fff" />
                        <Text style={styles.approvalButtonText}>Rechazar</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.approveButton}
                        onPress={() => handleApproveKommuter(selectedKommuter.id)}
                      >
                        <UserCheck size={20} color="#fff" />
                        <Text style={styles.approvalButtonText}>Aprobar</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </>
              )}
            </View>
          </ScrollView>
        </View>
      </Modal>

      {verificationAlert && (
        <SecurityVerificationModal
          visible={showSecurityVerificationModal}
          alertId={verificationAlert.id}
          driverId={verificationAlert.driverId}
          driverName={verificationAlert.driverName}
          onClose={() => {
            setShowSecurityVerificationModal(false);
            setVerificationAlert(null);
          }}
          onVerificationComplete={handleVerificationComplete}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fafcf8',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#131c0d',
    flex: 1,
  },
  alertBadge: {
    backgroundColor: '#FF3B30',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 24,
    alignItems: 'center',
  },
  alertBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700' as const,
  },
  alertsSection: {
    gap: 12,
  },
  alertCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  alertCardInvestigating: {
    opacity: 0.7,
    borderLeftColor: '#007AFF',
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  alertTypeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertTypeIconLarge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 20,
  },
  alertInfo: {
    flex: 1,
  },
  alertDriverName: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#131c0d',
    marginBottom: 4,
  },
  alertMessage: {
    fontSize: 14,
    color: '#6b9e47',
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  priorityText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700' as const,
  },
  alertFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#ecf4e6',
  },
  encryptedCode: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#FF3B30',
    fontFamily: 'monospace',
  },
  encryptedCodeLarge: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#FF3B30',
    fontFamily: 'monospace',
    textAlign: 'center',
  },
  alertTime: {
    fontSize: 12,
    color: '#999',
  },
  emptyState: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    gap: 12,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#6b9e47',
    fontWeight: '500' as const,
  },
  revenueSection: {
    gap: 16,
  },
  calculatorCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  inputGroup: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#6b9e47',
  },
  input: {
    backgroundColor: '#ecf4e6',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#131c0d',
    borderWidth: 1,
    borderColor: '#d4e8cc',
  },
  inputWithPrefix: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ecf4e6',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d4e8cc',
    paddingLeft: 16,
  },
  inputPrefix: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#6b9e47',
    marginRight: 8,
  },
  inputWithPrefixField: {
    flex: 1,
    padding: 16,
    paddingLeft: 0,
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#131c0d',
  },
  estimatesGrid: {
    gap: 12,
  },
  estimateCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  estimateCardHighlight: {
    backgroundColor: '#f8fff4',
    borderWidth: 2,
    borderColor: '#65ea06',
  },
  estimatePeriod: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#6b9e47',
    marginBottom: 8,
  },
  estimatePeriodHighlight: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#65ea06',
    marginBottom: 8,
  },
  estimateValue: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#131c0d',
    marginBottom: 4,
  },
  estimateValueHighlight: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: '#65ea06',
    marginBottom: 4,
  },
  estimateLabel: {
    fontSize: 12,
    color: '#999',
  },
  promotionsSection: {
    gap: 12,
  },
  addButton: {
    backgroundColor: '#65ea06',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  promoCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  promoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  promoTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#131c0d',
    flex: 1,
  },
  promoDescription: {
    fontSize: 14,
    color: '#6b9e47',
    marginBottom: 12,
  },
  promoFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  promoDiscount: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#FF9500',
  },
  promoValidity: {
    fontSize: 12,
    color: '#999',
  },
  collaborationsSection: {
    gap: 12,
  },
  collabCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  collabHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  collabBrand: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#131c0d',
    flex: 1,
  },
  collabDescription: {
    fontSize: 14,
    color: '#6b9e47',
    marginBottom: 12,
  },
  collabBenefit: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#e6f4ff',
    padding: 12,
    borderRadius: 8,
  },
  collabBenefitText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#007AFF',
  },
  driversSection: {
    gap: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: '#65ea06',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b9e47',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
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
    fontWeight: '700' as const,
    color: '#131c0d',
  },
  alertDetailSection: {
    marginBottom: 16,
  },
  alertDetailLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#6b9e47',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  alertDetailValue: {
    fontSize: 16,
    color: '#131c0d',
    fontWeight: '500' as const,
  },
  call911Button: {
    backgroundColor: '#FF3B30',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    borderRadius: 12,
    marginVertical: 16,
  },
  call911ButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700' as const,
  },
  trackingButton: {
    backgroundColor: '#007AFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  trackingButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700' as const,
  },
  alertActions: {
    flexDirection: 'row',
    gap: 12,
  },
  investigateButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 14,
    borderRadius: 12,
  },
  resolveButton: {
    flex: 1,
    backgroundColor: '#34C759',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 14,
    borderRadius: 12,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600' as const,
  },
  statCardHighlight: {
    borderWidth: 2,
    borderColor: '#FF9500',
  },
  statNumberHighlight: {
    color: '#FF9500',
  },
  pendingApprovalsSection: {
    marginTop: 20,
    gap: 12,
  },
  sectionSubHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionSubTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#131c0d',
  },
  loadingContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: '#6b9e47',
  },
  kommuterCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9500',
  },
  kommuterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  kommuterAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f8fff4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  kommuterAvatarLarge: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#f8fff4',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 24,
  },
  kommuterInfo: {
    flex: 1,
  },
  kommuterName: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#131c0d',
    marginBottom: 4,
  },
  kommuterEmail: {
    fontSize: 14,
    color: '#6b9e47',
  },
  pendingBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFF3E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  kommuterDetails: {
    gap: 8,
    marginBottom: 12,
  },
  kommuterDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  kommuterDetailText: {
    fontSize: 13,
    color: '#131c0d',
  },
  kommuterFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#ecf4e6',
  },
  kommuterDate: {
    fontSize: 12,
    color: '#999',
  },
  reviewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#f8fff4',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  reviewButtonText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#65ea06',
  },
  modalScrollView: {
    flex: 1,
  },
  modalScrollContent: {
    padding: 20,
  },
  detailSection: {
    marginBottom: 24,
  },
  detailSectionTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#131c0d',
    marginBottom: 12,
  },
  detailRow: {
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#6b9e47',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  detailValue: {
    fontSize: 15,
    color: '#131c0d',
  },
  vehicleCard: {
    backgroundColor: '#f8fff4',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#d4e8cc',
  },
  vehicleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  vehicleTitle: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: '#131c0d',
  },
  vehicleDetails: {
    gap: 8,
  },
  vehicleDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  vehicleDetailLabel: {
    fontSize: 13,
    color: '#6b9e47',
    fontWeight: '600' as const,
  },
  vehicleDetailValue: {
    fontSize: 13,
    color: '#131c0d',
  },
  fleetDriverCard: {
    backgroundColor: '#f8fff4',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  fleetDriverName: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#131c0d',
    marginBottom: 6,
  },
  fleetDriverDetail: {
    fontSize: 12,
    color: '#6b9e47',
    marginBottom: 2,
  },
  processingContainer: {
    padding: 24,
    alignItems: 'center',
    gap: 12,
  },
  processingText: {
    fontSize: 14,
    color: '#6b9e47',
  },
  approvalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  rejectButton: {
    flex: 1,
    backgroundColor: '#FF3B30',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    borderRadius: 12,
  },
  approveButton: {
    flex: 1,
    backgroundColor: '#34C759',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    borderRadius: 12,
  },
  approvalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700' as const,
  },
  errorContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    gap: 12,
  },
  errorText: {
    fontSize: 16,
    color: '#FF3B30',
    textAlign: 'center',
    fontWeight: '500' as const,
  },
  retryButton: {
    backgroundColor: '#65ea06',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  retryButtonText: {
    color: '#131c0d',
    fontSize: 14,
    fontWeight: '700' as const,
  },
  verifyButton: {
    backgroundColor: '#FF3B30',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  verifyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700' as const,
  },
});
