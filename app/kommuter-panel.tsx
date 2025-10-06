import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Modal, Switch } from 'react-native';
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
  XCircle
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { calculateRevenueEstimates, formatCRC, PRICING_CONSTANTS } from '@/src/modules/commute/utils/pricing';

type AlertType = 'danger' | 'rating' | 'complaint';
type AlertStatus = 'active' | 'resolved' | 'investigating';

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

export default function KommuterPanel() {
  const insets = useSafeAreaInsets();
  const [averageTripsPerDay, setAverageTripsPerDay] = useState('100');
  const [averageTripPrice, setAverageTripPrice] = useState('2500');
  const [showPromotionModal, setShowPromotionModal] = useState(false);
  const [showCollaborationModal, setShowCollaborationModal] = useState(false);
  const [showAlertDetailModal, setShowAlertDetailModal] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<DriverAlert | null>(null);

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

  const handleAlertAction = (alertId: string, action: 'resolve' | 'investigate' | 'call911') => {
    if (action === 'call911') {
      Alert.alert(
        '🚨 Llamar al 911',
        '¿Confirmar llamada a autoridades?\n\nSe enviará la ubicación y detalles del conductor.',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Llamar 911',
            style: 'destructive',
            onPress: () => {
              Alert.alert('✅ Llamada Realizada', 'Autoridades notificadas. Ubicación compartida.');
              updateAlertStatus(alertId, 'investigating');
            }
          }
        ]
      );
    } else if (action === 'resolve') {
      updateAlertStatus(alertId, 'resolved');
      Alert.alert('✅ Alerta Resuelta', 'La alerta ha sido marcada como resuelta.');
    } else if (action === 'investigate') {
      updateAlertStatus(alertId, 'investigating');
      Alert.alert('🔍 En Investigación', 'La alerta está siendo investigada.');
    }
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
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>12</Text>
              <Text style={styles.statLabel}>Pendientes Aprobación</Text>
            </View>
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
                    style={styles.call911Button}
                    onPress={() => handleAlertAction(selectedAlert.id, 'call911')}
                  >
                    <Shield size={20} color="#fff" />
                    <Text style={styles.call911ButtonText}>Llamar al 911</Text>
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
});
