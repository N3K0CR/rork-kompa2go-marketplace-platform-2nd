import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Modal, TextInput, Alert, Image, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/contexts/AuthContext';
import { useWallet } from '@/contexts/WalletContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAppointments } from '@/contexts/AppointmentsContext';
import { useReservationAlert } from '@/contexts/ReservationAlertContext';
import { useReservationPlans } from '@/contexts/ReservationPlansContext';
import { usePendingPayments } from '@/contexts/PendingPaymentsContext';
import { useChat } from '@/contexts/ChatContext';
import { Search, Calendar, Star, TrendingUp, Users, DollarSign, RefreshCw, X, Mail, Lock, Award, Bell, CreditCard, Camera, Upload, Package, Check, Phone, MessageCircle, Settings, CheckCircle, XCircle, RotateCcw } from 'lucide-react-native';
import FloatingKompi from '@/components/FloatingKompi';
import { router, useLocalSearchParams } from 'expo-router';
import { Linking } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const { user, loading, switchRole } = useAuth();
  const { walletBalance, okoins, bookingPasses } = useWallet();
  const { t } = useLanguage();
  const { getTodayAppointments, getUpcomingAppointments, updateAppointment } = useAppointments();
  const { simulateNewReservation, pendingReservations, isAlertActive } = useReservationAlert();
  const userType = user?.userType || 'client';
  const { modal } = useLocalSearchParams<{ modal?: string }>();
  
  const todayAppointments = getTodayAppointments();
  const upcomingAppointments = getUpcomingAppointments();
  const [showRoleSwitch, setShowRoleSwitch] = useState(false);
  const [roleSwitchData, setRoleSwitchData] = useState({
    email: '',
    password: '',
    targetRole: 'client' as 'client' | 'provider',
  });
  const [loadingRoleSwitch, setLoadingRoleSwitch] = useState(false);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'sinpe' | 'kash' | null>(null);
  const [proofImage, setProofImage] = useState<string | null>(null);
  const [purchaseLoading, setPurchaseLoading] = useState(false);
  const [showPlansModal, setShowPlansModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const { getAvailablePlans, purchasePlan } = useReservationPlans();
  const { addPaymentProof, getPendingCount } = usePendingPayments();
  const { createChat, sendMessage } = useChat();
  const [showReservationDetailsModal, setShowReservationDetailsModal] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState<any>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/onboarding');
    }
  }, [user, loading]);
  
  // Handle modal parameter from search page
  useEffect(() => {
    if (modal && user && userType === 'client') {
      console.log('Opening modal from search:', modal);
      if (modal === 'purchase') {
        setShowPurchaseModal(true);
      } else if (modal === 'plans') {
        setShowPlansModal(true);
      }
      // Clear the parameter to avoid reopening modal on re-renders
      router.replace('/(tabs)');
    }
  }, [modal, user, userType]);

  if (loading) {
    return (
      <LinearGradient
        colors={['#D81B60', '#E91E63', '#F06292']}
        style={styles.splashContainer}
      >
        <View style={styles.splashContent}>
          <Text style={styles.splashLogo}>Kompa2Go</Text>
          <Text style={styles.splashTagline}>{t('slogan')}</Text>
        </View>
      </LinearGradient>
    );
  }

  if (!user) {
    return null;
  }

  const renderClientDashboard = () => (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
      <LinearGradient
        colors={['#D81B60', '#E91E63']}
        style={styles.header}
      >
        <Text style={styles.greeting}>{t('hello')}, {user?.name}!</Text>
        <Text style={styles.subtitle}>{t('what_service_today')}</Text>
      </LinearGradient>

      <View style={styles.content}>
        {/* Wallet & OKoins Section */}
        <View style={styles.walletSection}>
          <View style={styles.walletCard}>
            <Text style={styles.walletTitle}>{t('my_wallet')}</Text>
            <Text style={styles.walletBalance}>₡{walletBalance.toLocaleString()}</Text>
            <Text style={styles.walletSubtext}>{t('wallet_balance')}</Text>
          </View>
          <View style={styles.okoinsCard}>
            <Text style={styles.okoinsTitle}>OKoins</Text>
            <Text style={styles.okoinsBalance}>{okoins}</Text>
            <Text style={styles.okoinsSubtext}>{t('loyalty_points')}</Text>
          </View>
        </View>

        {/* Booking Passes */}
        <View style={styles.passesSection}>
          <Text style={styles.sectionTitle}>{t('booking_passes')}</Text>
          <View style={styles.passesCard}>
            <Text style={styles.passesCount}>{bookingPasses.filter(p => !p.isUsed).length}</Text>
            <Text style={styles.passesText}>{t('available_passes')}</Text>
            <TouchableOpacity 
              style={styles.buyPassButton}
              onPress={() => setShowPurchaseModal(true)}
            >
              <Text style={styles.buyPassText}>{t('buy_pass_price')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.quickActions}>
          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => router.push('/search')}
          >
            <Search size={24} color="#D81B60" />
            <Text style={styles.actionText}>{t('search_services')}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => router.push('/chat')}
          >
            <Star size={24} color="#D81B60" />
            <Text style={styles.actionText}>{t('ask_kompi')}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('upcoming_appointments')}</Text>
          {upcomingAppointments.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {upcomingAppointments.slice(0, 5).map((appointment) => (
                <TouchableOpacity 
                  key={appointment.id} 
                  style={styles.appointmentCard}
                  onPress={() => {
                    console.log('🎯 Opening reservation details for:', appointment.id);
                    setSelectedReservation(appointment);
                    setShowReservationDetailsModal(true);
                  }}
                  activeOpacity={0.7}
                >
                  <View style={styles.appointmentHeader}>
                    <Text style={styles.appointmentDate}>
                      {new Date(appointment.date).toLocaleDateString('es-ES', { 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </Text>
                    <Text style={styles.appointmentTime}>{appointment.time}</Text>
                  </View>
                  <Text style={styles.appointmentClient}>{appointment.clientName}</Text>
                  <Text style={styles.appointmentService}>{appointment.service}</Text>
                  <View style={[
                    styles.appointmentType,
                    { backgroundColor: 
                      appointment.type === 'kompa2go' ? '#FFE8F0' :
                      appointment.type === 'manual' ? '#E3F2FD' : '#FFF3E0'
                    }
                  ]}>
                    <Text style={[
                      styles.appointmentTypeText,
                      { color: 
                        appointment.type === 'kompa2go' ? '#D81B60' :
                        appointment.type === 'manual' ? '#2196F3' : '#FF9800'
                      }
                    ]}>
                      {appointment.type === 'kompa2go' ? 'Kompa2Go' :
                       appointment.type === 'manual' ? 'Manual' : 'Bloqueado'}
                    </Text>
                  </View>
                  
                  {/* Status indicator for client view */}
                  {userType === 'client' && (
                    <View style={[
                      styles.statusIndicator,
                      appointment.status === 'confirmed' && styles.statusConfirmed,
                      appointment.status === 'pending' && styles.statusPending,
                      appointment.status === 'cancelled' && styles.statusCancelled
                    ]}>
                      <Text style={styles.statusIndicatorText}>
                        {appointment.status === 'confirmed' ? '✅ Confirmada' :
                         appointment.status === 'pending' ? '⏳ Pendiente' : '❌ Cancelada'}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          ) : (
            <View style={styles.emptyState}>
              <Calendar size={48} color="#CCC" />
              <Text style={styles.emptyText}>{t('no_appointments')}</Text>
              <TouchableOpacity 
                style={styles.emptyButton}
                onPress={() => router.push('/search')}
              >
                <Text style={styles.emptyButtonText}>{t('search_services')}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('popular_services')}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {['Limpieza', 'Plomería', 'Electricidad', 'Jardinería'].map((service, index) => (
              <TouchableOpacity key={index} style={styles.serviceCard}>
                <Text style={styles.serviceText}>{service}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
      </ScrollView>
      <FloatingKompi isVisible={true} />
      
      {/* Purchase Pass Modal */}
      <Modal
        visible={showPurchaseModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPurchaseModal(false)}
      >
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={styles.scrollModalContent}>
            <View style={styles.purchaseModalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Comprar Pase de Reserva</Text>
                <TouchableOpacity
                  onPress={() => {
                    setShowPurchaseModal(false);
                    setSelectedPaymentMethod(null);
                    setProofImage(null);
                  }}
                  style={styles.closeButton}
                >
                  <X size={24} color="#666" />
                </TouchableOpacity>
              </View>

              <View style={styles.priceSection}>
                <Text style={styles.priceLabel}>Precio del Pase:</Text>
                <Text style={styles.priceAmount}>₡500</Text>
                <Text style={styles.priceDescription}>Válido para una reserva de servicio</Text>
              </View>

              <View style={styles.paymentMethodSection}>
                <Text style={styles.sectionLabel}>Método de Pago:</Text>
                
                <TouchableOpacity
                  style={[
                    styles.paymentMethodButton,
                    selectedPaymentMethod === 'sinpe' && styles.paymentMethodButtonActive
                  ]}
                  onPress={() => setSelectedPaymentMethod('sinpe')}
                >
                  <CreditCard size={20} color={selectedPaymentMethod === 'sinpe' ? '#fff' : '#D81B60'} />
                  <Text style={[
                    styles.paymentMethodText,
                    selectedPaymentMethod === 'sinpe' && styles.paymentMethodTextActive
                  ]}>SINPE Móvil</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.paymentMethodButton,
                    selectedPaymentMethod === 'kash' && styles.paymentMethodButtonActive
                  ]}
                  onPress={() => setSelectedPaymentMethod('kash')}
                >
                  <CreditCard size={20} color={selectedPaymentMethod === 'kash' ? '#fff' : '#D81B60'} />
                  <Text style={[
                    styles.paymentMethodText,
                    selectedPaymentMethod === 'kash' && styles.paymentMethodTextActive
                  ]}>Kash</Text>
                </TouchableOpacity>
              </View>

              {selectedPaymentMethod && (
                <View style={styles.paymentInfoSection}>
                  <Text style={styles.paymentInfoTitle}>
                    {selectedPaymentMethod === 'sinpe' ? 'SINPE Móvil' : 'Kash'}
                  </Text>
                  <Text style={styles.paymentInfoNumber}>
                    +506 88332517
                  </Text>
                  <Text style={styles.paymentInfoOwner}>
                    Ricardo Narvaez Vargas
                  </Text>
                  <Text style={styles.paymentInfoInstructions}>
                    Envía ₡500 al número indicado y sube el comprobante de pago.
                  </Text>
                  <Text style={styles.paymentInfoNote}>
                    Sakura Beauty Salon es propietario de Kompa2Go. Todos los pagos serán revisados y aprobados por ellos.
                  </Text>
                </View>
              )}

              {selectedPaymentMethod && (
                <View style={styles.proofSection}>
                  <Text style={styles.sectionLabel}>Comprobante de Pago:</Text>
                  
                  {proofImage ? (
                    <View style={styles.imagePreviewContainer}>
                      <Image source={{ uri: proofImage }} style={styles.imagePreview} />
                      <TouchableOpacity
                        style={styles.changeImageButton}
                        onPress={pickImage}
                      >
                        <Camera size={16} color="#D81B60" />
                        <Text style={styles.changeImageText}>Cambiar imagen</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <TouchableOpacity style={styles.uploadButton} onPress={pickImage}>
                      <Upload size={24} color="#D81B60" />
                      <Text style={styles.uploadButtonText}>Subir comprobante</Text>
                      <Text style={styles.uploadButtonSubtext}>Toca para seleccionar imagen</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}

              {selectedPaymentMethod && proofImage && (
                <TouchableOpacity
                  style={styles.submitButton}
                  onPress={handlePurchaseSubmit}
                  disabled={purchaseLoading}
                >
                  <Text style={styles.submitButtonText}>
                    {purchaseLoading ? 'Procesando...' : 'Enviar Comprobante'}
                  </Text>
                </TouchableOpacity>
              )}

              <View style={styles.recommendationSection}>
                <Text style={styles.recommendationTitle}>💡 Recomendación</Text>
                <Text style={styles.recommendationText}>
                  Considera comprar un plan de reservas para tener reservas más rápidas sin esperar aprobación de pago.
                </Text>
                <TouchableOpacity 
                  style={styles.planButton}
                  onPress={() => setShowPlansModal(true)}
                >
                  <Text style={styles.planButtonText}>Ver Planes de Reserva</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>
      
      {/* Reservation Plans Modal */}
      <Modal
        visible={showPlansModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPlansModal(false)}
      >
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={styles.scrollModalContent}>
            <View style={styles.plansModalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Planes de Reserva</Text>
                <TouchableOpacity
                  onPress={() => {
                    setShowPlansModal(false);
                    setSelectedPlan(null);
                    setSelectedPaymentMethod(null);
                    setProofImage(null);
                  }}
                  style={styles.closeButton}
                >
                  <X size={24} color="#666" />
                </TouchableOpacity>
              </View>

              <Text style={styles.plansDescription}>
                Los planes de reserva te permiten hacer reservas más rápidas sin esperar la aprobación de cada pago individual.
              </Text>

              {getAvailablePlans().map((plan) => (
                <TouchableOpacity
                  key={plan.id}
                  style={[
                    styles.planCard,
                    plan.popular && styles.popularPlanCard,
                    selectedPlan === plan.id && styles.selectedPlanCard
                  ]}
                  onPress={() => setSelectedPlan(plan.id)}
                >
                  {plan.popular && (
                    <View style={styles.popularBadge}>
                      <Text style={styles.popularBadgeText}>MÁS POPULAR</Text>
                    </View>
                  )}
                  
                  <View style={styles.planHeader}>
                    <Text style={styles.planName}>{plan.name}</Text>
                    <Text style={styles.planPrice}>₡{plan.price.toLocaleString()}</Text>
                  </View>
                  
                  <Text style={styles.planDescription}>{plan.description}</Text>
                  
                  <View style={styles.planBenefits}>
                    {plan.benefits.map((benefit, index) => (
                      <View key={index} style={styles.benefitRow}>
                        <Check size={16} color="#4CAF50" />
                        <Text style={styles.benefitText}>{benefit}</Text>
                      </View>
                    ))}
                  </View>
                  
                  <View style={styles.planStats}>
                    <Text style={styles.planStatsText}>
                      {plan.reservations} reservas
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}

              {selectedPlan && (
                <>
                  <View style={styles.paymentMethodSection}>
                    <Text style={styles.sectionLabel}>Método de Pago:</Text>
                    
                    <TouchableOpacity
                      style={[
                        styles.paymentMethodButton,
                        selectedPaymentMethod === 'sinpe' && styles.paymentMethodButtonActive
                      ]}
                      onPress={() => setSelectedPaymentMethod('sinpe')}
                    >
                      <CreditCard size={20} color={selectedPaymentMethod === 'sinpe' ? '#fff' : '#D81B60'} />
                      <Text style={[
                        styles.paymentMethodText,
                        selectedPaymentMethod === 'sinpe' && styles.paymentMethodTextActive
                      ]}>SINPE Móvil</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.paymentMethodButton,
                        selectedPaymentMethod === 'kash' && styles.paymentMethodButtonActive
                      ]}
                      onPress={() => setSelectedPaymentMethod('kash')}
                    >
                      <CreditCard size={20} color={selectedPaymentMethod === 'kash' ? '#fff' : '#D81B60'} />
                      <Text style={[
                        styles.paymentMethodText,
                        selectedPaymentMethod === 'kash' && styles.paymentMethodTextActive
                      ]}>Kash</Text>
                    </TouchableOpacity>
                  </View>

                  {selectedPaymentMethod && (
                    <View style={styles.paymentInfoSection}>
                      <Text style={styles.paymentInfoTitle}>
                        {selectedPaymentMethod === 'sinpe' ? 'SINPE Móvil' : 'Kash'}
                      </Text>
                      <Text style={styles.paymentInfoNumber}>
                        +506 88332517
                      </Text>
                      <Text style={styles.paymentInfoOwner}>
                        Ricardo Narvaez Vargas
                      </Text>
                      <Text style={styles.paymentInfoInstructions}>
                        Envía ₡{getAvailablePlans().find(p => p.id === selectedPlan)?.price.toLocaleString()} al número indicado y sube el comprobante de pago.
                      </Text>
                      <Text style={styles.paymentInfoNote}>
                        Sakura Beauty Salon es propietario de Kompa2Go. Todos los pagos serán revisados y aprobados por ellos.
                      </Text>
                    </View>
                  )}

                  {selectedPaymentMethod && (
                    <View style={styles.proofSection}>
                      <Text style={styles.sectionLabel}>Comprobante de Pago:</Text>
                      
                      {proofImage ? (
                        <View style={styles.imagePreviewContainer}>
                          <Image source={{ uri: proofImage }} style={styles.imagePreview} />
                          <TouchableOpacity
                            style={styles.changeImageButton}
                            onPress={pickImage}
                          >
                            <Camera size={16} color="#D81B60" />
                            <Text style={styles.changeImageText}>Cambiar imagen</Text>
                          </TouchableOpacity>
                        </View>
                      ) : (
                        <TouchableOpacity style={styles.uploadButton} onPress={pickImage}>
                          <Upload size={24} color="#D81B60" />
                          <Text style={styles.uploadButtonText}>Subir comprobante</Text>
                          <Text style={styles.uploadButtonSubtext}>Toca para seleccionar imagen</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  )}

                  {selectedPlan && selectedPaymentMethod && proofImage && (
                    <TouchableOpacity
                      style={styles.submitButton}
                      onPress={handlePlanPurchaseSubmit}
                      disabled={purchaseLoading}
                    >
                      <Text style={styles.submitButtonText}>
                        {purchaseLoading ? 'Procesando...' : 'Comprar Plan'}
                      </Text>
                    </TouchableOpacity>
                  )}
                </>
              )}
            </View>
          </ScrollView>
        </View>
      </Modal>
      
      {/* Reservation Details Modal */}
      <Modal
        visible={showReservationDetailsModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          setShowReservationDetailsModal(false);
          setSelectedReservation(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.reservationDetailsModalContent}>
            <View style={[styles.modalHeader, { padding: 20, paddingBottom: 10 }]}>
              <Text style={styles.modalTitle}>Detalles de Reserva</Text>
              <TouchableOpacity 
                onPress={() => {
                  setShowReservationDetailsModal(false);
                  setSelectedReservation(null);
                }}
                style={{ padding: 4 }}
              >
                <X size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            {selectedReservation && (
              <ScrollView style={styles.reservationDetailsContent}>
                {/* Reservation Information */}
                <View style={styles.reservationInfoSection}>
                  <Text style={styles.sectionTitle}>Información de la Reserva</Text>
                  
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Fecha:</Text>
                    <Text style={styles.detailValue}>
                      {new Date(selectedReservation.date).toLocaleDateString('es-ES', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </Text>
                  </View>
                  
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Hora:</Text>
                    <Text style={styles.detailValue}>{selectedReservation.time}</Text>
                  </View>
                  
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Duración:</Text>
                    <Text style={styles.detailValue}>{selectedReservation.duration} minutos</Text>
                  </View>
                  
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Servicio:</Text>
                    <Text style={styles.detailValue}>{selectedReservation.service}</Text>
                  </View>
                  
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>
                      {userType === 'client' ? 'Proveedor:' : 'Cliente:'}
                    </Text>
                    <Text style={styles.detailValue}>{selectedReservation.clientName}</Text>
                  </View>
                  
                  {selectedReservation.clientPhone && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Teléfono:</Text>
                      <Text style={styles.detailValue}>{selectedReservation.clientPhone}</Text>
                    </View>
                  )}
                  
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Estado:</Text>
                    <View style={[
                      styles.statusBadge,
                      selectedReservation.status === 'confirmed' && styles.statusConfirmed,
                      selectedReservation.status === 'pending' && styles.statusPending,
                      selectedReservation.status === 'cancelled' && styles.statusCancelled
                    ]}>
                      <Text style={styles.statusText}>
                        {selectedReservation.status === 'confirmed' ? 'Confirmada' :
                         selectedReservation.status === 'pending' ? 'Pendiente' : 'Cancelada'}
                      </Text>
                    </View>
                  </View>
                  
                  {selectedReservation.notes && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Notas:</Text>
                      <Text style={styles.detailValue}>{selectedReservation.notes}</Text>
                    </View>
                  )}
                </View>
                
                {/* Action Buttons */}
                <View style={styles.reservationActionsSection}>
                  <Text style={styles.sectionTitle}>Administrar Reserva</Text>
                  
                  {/* Confirmation Action */}
                  {selectedReservation.status === 'pending' && (
                    <TouchableOpacity 
                      style={[styles.actionButton, styles.confirmButton]}
                      onPress={async () => {
                        Alert.alert(
                          'Confirmar Reserva',
                          `¿Confirmas tu reserva para el ${new Date(selectedReservation.date).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })} a las ${selectedReservation.time}?\n\nServicio: ${selectedReservation.service}\n${userType === 'client' ? `Proveedor: ${selectedReservation.clientName}` : `Cliente: ${selectedReservation.clientName}`}`,
                          [
                            { text: 'Cancelar', style: 'cancel' },
                            {
                              text: 'Confirmar',
                              style: 'default',
                              onPress: async () => {
                                await updateAppointment(selectedReservation.id, { 
                                  status: 'confirmed',
                                  notes: (selectedReservation.notes || '') + ` [Confirmada por ${userType} el ${new Date().toLocaleString('es-ES')}]`
                                });
                                setShowReservationDetailsModal(false);
                                Alert.alert('✅ Confirmada', 'Tu reserva ha sido confirmada exitosamente.');
                              }
                            }
                          ]
                        );
                      }}
                    >
                      <CheckCircle size={20} color="white" />
                      <Text style={styles.actionButtonText}>Confirmar Reserva</Text>
                    </TouchableOpacity>
                  )}
                  
                  {/* Reschedule Action */}
                  <TouchableOpacity 
                    style={[styles.actionButton, styles.rescheduleButton]}
                    onPress={() => {
                      Alert.alert(
                        'Reprogramar Cita',
                        `Para reprogramar tu reserva del ${new Date(selectedReservation.date).toLocaleDateString('es-ES')} necesitas coordinar directamente con ${userType === 'client' ? 'el proveedor' : 'el cliente'}.\n\n¿Cómo prefieres contactarlos?`,
                        [
                          { text: 'Cancelar', style: 'cancel' },
                          {
                            text: '💬 Chat Kompa2Go',
                            style: 'default',
                            onPress: async () => {
                              try {
                                // Get provider info from reservation
                                const providerId = selectedReservation.providerId || 'provider_' + selectedReservation.id;
                                const providerName = selectedReservation.providerName || selectedReservation.clientName;
                                
                                // Create or get existing chat
                                const chatId = await createChat(providerId, providerName);
                                
                                // Send initial message about rescheduling
                                await sendMessage(chatId, `Hola, necesito reprogramar nuestra cita del ${new Date(selectedReservation.date).toLocaleDateString('es-ES')} a las ${selectedReservation.time} para ${selectedReservation.service}. ¿Cuándo tienes disponibilidad?`);
                                
                                // Close modal and navigate to chat
                                setShowReservationDetailsModal(false);
                                setSelectedReservation(null);
                                router.push(`/chat/${chatId}`);
                              } catch (error) {
                                console.error('Error opening chat:', error);
                                Alert.alert('Error', 'No se pudo abrir el chat. Por favor intenta de nuevo.');
                              }
                            }
                          },
                          {
                            text: '📞 Llamar',
                            style: 'default',
                            onPress: () => {
                              const phoneNumber = selectedReservation.clientPhone || '+506 8888-0000';
                              const cleanPhone = phoneNumber.replace(/[^0-9+]/g, '');
                              const telUrl = `tel:${cleanPhone}`;
                              
                              Alert.alert(
                                'Realizar Llamada',
                                `¿Deseas llamar a ${phoneNumber}?`,
                                [
                                  { text: 'Cancelar', style: 'cancel' },
                                  {
                                    text: 'Llamar',
                                    onPress: () => {
                                      Linking.openURL(telUrl).catch(() => {
                                        Alert.alert('Error', 'No se pudo realizar la llamada.');
                                      });
                                    }
                                  }
                                ]
                              );
                            }
                          }
                        ]
                      );
                    }}
                  >
                    <RotateCcw size={20} color="white" />
                    <Text style={styles.actionButtonText}>Reprogramar</Text>
                  </TouchableOpacity>
                  
                  {/* Cancel Action */}
                  {selectedReservation.status !== 'cancelled' && (
                    <TouchableOpacity 
                      style={[styles.actionButton, styles.cancelButton]}
                      onPress={() => {
                        Alert.alert(
                          '⚠️ Cancelar Reserva',
                          userType === 'client' ? 
                            'POLÍTICA DE CANCELACIÓN:\n\n• La comisión pagada NO será reembolsada\n• El proveedor será notificado inmediatamente\n• Esta acción no se puede deshacer\n\n¿Estás completamente seguro?' :
                            'Esta acción cancelará la reserva y notificará al cliente inmediatamente.\n\n¿Confirmas la cancelación?',
                          [
                            { text: 'No, Mantener', style: 'cancel' },
                            {
                              text: 'Sí, Cancelar',
                              style: 'destructive',
                              onPress: async () => {
                                await updateAppointment(selectedReservation.id, { 
                                  status: 'cancelled',
                                  notes: (selectedReservation.notes || '') + ` [Cancelada por ${userType} el ${new Date().toLocaleString('es-ES')}${userType === 'client' ? ' - Comisión no reembolsable' : ''}]`
                                });
                                setShowReservationDetailsModal(false);
                                Alert.alert(
                                  '❌ Reserva Cancelada', 
                                  userType === 'client' ? 
                                    'Tu reserva ha sido cancelada. La comisión no es reembolsable.' :
                                    'La reserva ha sido cancelada y el cliente ha sido notificado.'
                                );
                              }
                            }
                          ]
                        );
                      }}
                    >
                      <XCircle size={20} color="white" />
                      <Text style={styles.actionButtonText}>Cancelar Reserva</Text>
                    </TouchableOpacity>
                  )}
                </View>
                
                {/* Contact Section */}
                <View style={styles.contactSection}>
                  <Text style={styles.sectionTitle}>Contacto</Text>
                  
                  <View style={styles.contactButtonsRow}>
                    <TouchableOpacity 
                      style={[styles.contactButton, styles.kompa2goButton, { flex: 1 }]}
                      onPress={async () => {
                        try {
                          // Get provider info from reservation
                          const providerId = selectedReservation.providerId || 'provider_' + selectedReservation.id;
                          const providerName = selectedReservation.providerName || selectedReservation.clientName;
                          
                          // Create or get existing chat
                          const chatId = await createChat(providerId, providerName);
                          
                          // Close modal and navigate to chat
                          setShowReservationDetailsModal(false);
                          setSelectedReservation(null);
                          router.push(`/chat/${chatId}`);
                        } catch (error) {
                          console.error('Error opening chat:', error);
                          Alert.alert('Error', 'No se pudo abrir el chat. Por favor intenta de nuevo.');
                        }
                      }}
                    >
                      <MessageCircle size={18} color="white" />
                      <Text style={styles.contactButtonText}>Chat Kompa2Go</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );

  const renderProviderDashboard = () => (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
      <LinearGradient
        colors={['#D81B60', '#E91E63']}
        style={styles.header}
      >
        <Text style={styles.greeting}>{t('hello')}, {user?.name}!</Text>
        <Text style={styles.subtitle}>{t('manage_business')}</Text>
      </LinearGradient>

      <View style={styles.content}>
        <View style={styles.statsContainer}>
          <TouchableOpacity 
            style={styles.statCard}
            onPress={() => {
              console.log('Navigating to calendar with today\'s appointments:', todayAppointments.length);
              console.log('Today\'s appointments data:', todayAppointments);
              router.push('/(tabs)/calendar');
            }}
          >
            <Calendar size={24} color="#D81B60" />
            <Text style={styles.statNumber}>{todayAppointments.length}</Text>
            <Text style={styles.statLabel}>{t('appointments_today')}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.statCard}
            onPress={() => {
              Alert.alert(
                t('rating_summary'),
                `${t('total_rated_services')}: 127\nCalificación promedio: 4.8/5.0\n\n${t('rating_tips')}:\n• Responde rápidamente a los mensajes\n• Llega puntual a las citas\n• Mantén alta calidad en el servicio\n• Solicita feedback a tus clientes`
              );
            }}
          >
            <Award size={24} color="#D81B60" />
            <Text style={styles.statNumber}>4.8</Text>
            <Text style={styles.statLabel}>{t('rating')}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.quickActions}>
          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => router.push('/(tabs)/calendar')}
          >
            <Calendar size={24} color="#D81B60" />
            <Text style={styles.actionText}>{t('view_calendar')}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => {
              router.push('/collaborators');
            }}
          >
            <Users size={24} color="#D81B60" />
            <Text style={styles.actionText}>{t('collaborators')}</Text>
          </TouchableOpacity>
        </View>



        {/* Test Alert System - Only for Proveedor Demo 1 */}
        {user?.alias === '2kompa1' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Sistema de Alertas</Text>
            <View style={styles.alertTestContainer}>
              <TouchableOpacity 
                style={[
                  styles.testAlertButton,
                  isAlertActive && styles.testAlertButtonActive
                ]}
                onPress={simulateNewReservation}
                disabled={isAlertActive}
              >
                <Bell size={20} color={isAlertActive ? "#fff" : "#ff6b35"} />
                <Text style={[
                  styles.testAlertButtonText,
                  isAlertActive && styles.testAlertButtonTextActive
                ]}>
                  {isAlertActive ? 'Alerta Activa' : 'Simular Nueva Reserva'}
                </Text>
              </TouchableOpacity>
              
              {pendingReservations.length > 0 && (
                <View style={styles.alertStatus}>
                  <Text style={styles.alertStatusText}>
                    {pendingReservations.length} reserva(s) pendiente(s)
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('upcoming_appointments')}</Text>
          {upcomingAppointments.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {upcomingAppointments.slice(0, 5).map((appointment) => (
                <View key={appointment.id} style={styles.appointmentCard}>
                  <View style={styles.appointmentHeader}>
                    <Text style={styles.appointmentDate}>
                      {new Date(appointment.date).toLocaleDateString('es-ES', { 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </Text>
                    <Text style={styles.appointmentTime}>{appointment.time}</Text>
                  </View>
                  <Text style={styles.appointmentClient}>{appointment.clientName}</Text>
                  <Text style={styles.appointmentService}>{appointment.service}</Text>
                  <View style={[
                    styles.appointmentType,
                    { backgroundColor: 
                      appointment.type === 'kompa2go' ? '#FFE8F0' :
                      appointment.type === 'manual' ? '#E3F2FD' : '#FFF3E0'
                    }
                  ]}>
                    <Text style={[
                      styles.appointmentTypeText,
                      { color: 
                        appointment.type === 'kompa2go' ? '#D81B60' :
                        appointment.type === 'manual' ? '#2196F3' : '#FF9800'
                      }
                    ]}>
                      {appointment.type === 'kompa2go' ? 'Kompa2Go' :
                       appointment.type === 'manual' ? 'Manual' : 'Bloqueado'}
                    </Text>
                  </View>
                </View>
              ))}
            </ScrollView>
          ) : (
            <View style={styles.emptyState}>
              <Calendar size={48} color="#CCC" />
              <Text style={styles.emptyText}>{t('no_appointments')}</Text>
            </View>
          )}
        </View>
      </View>
      </ScrollView>
      <FloatingKompi isVisible={true} />
    </View>
  );

  const renderAdminDashboard = () => (
    <ScrollView style={styles.container}>
      <LinearGradient
        colors={['#D81B60', '#E91E63']}
        style={styles.header}
      >
        <Text style={styles.greeting}>{t('admin_panel')}</Text>
        <Text style={styles.subtitle}>{t('system_overview')}</Text>
      </LinearGradient>

      <View style={styles.content}>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Users size={24} color="#D81B60" />
            <Text style={styles.statNumber}>1,234</Text>
            <Text style={styles.statLabel}>{t('users')}</Text>
          </View>
          
          <View style={styles.statCard}>
            <TrendingUp size={24} color="#D81B60" />
            <Text style={styles.statNumber}>567</Text>
            <Text style={styles.statLabel}>{t('providers')}</Text>
          </View>
          
          <View style={styles.statCard}>
            <Calendar size={24} color="#D81B60" />
            <Text style={styles.statNumber}>89</Text>
            <Text style={styles.statLabel}>{t('bookings_today')}</Text>
          </View>
          
          <View style={styles.statCard}>
            <DollarSign size={24} color="#D81B60" />
            <Text style={styles.statNumber}>₡45K</Text>
            <Text style={styles.statLabel}>{t('revenue')}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('quick_actions')}</Text>
          <View style={styles.adminActions}>
            <TouchableOpacity 
              style={styles.adminActionCard}
              onPress={() => router.push('/pending-payments')}
            >
              <View style={styles.adminActionContent}>
                <DollarSign size={20} color="#D81B60" />
                <Text style={styles.adminActionText}>Pagos Pendientes</Text>
                {getPendingCount() > 0 && (
                  <View style={styles.notificationBadge}>
                    <Text style={styles.notificationText}>{getPendingCount()}</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
            <TouchableOpacity style={styles.adminActionCard}>
              <View style={styles.adminActionContent}>
                <Users size={20} color="#D81B60" />
                <Text style={styles.adminActionText}>{t('manage_users')}</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity style={styles.adminActionCard}>
              <View style={styles.adminActionContent}>
                <TrendingUp size={20} color="#D81B60" />
                <Text style={styles.adminActionText}>{t('approve_providers')}</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity style={styles.adminActionCard}>
              <View style={styles.adminActionContent}>
                <Calendar size={20} color="#D81B60" />
                <Text style={styles.adminActionText}>{t('view_transactions')}</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('test_users')}</Text>
          <TouchableOpacity 
            style={styles.testUserButton}
            onPress={() => setShowRoleSwitch(true)}
          >
            <RefreshCw size={20} color="#D81B60" />
            <Text style={styles.testUserButtonText}>{t('switch_to_client_provider')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );

  const handleRoleSwitch = async () => {
    if (!roleSwitchData.email || !roleSwitchData.password) {
      Alert.alert(t('error'), t('complete_required_fields'));
      return;
    }

    setLoadingRoleSwitch(true);
    try {
      await switchRole(roleSwitchData.email, roleSwitchData.password, roleSwitchData.targetRole);
      setShowRoleSwitch(false);
      setRoleSwitchData({ email: '', password: '', targetRole: 'client' });
      router.replace('/(tabs)');
    } catch (error: any) {
      Alert.alert(t('error'), error.message || t('error'));
    } finally {
      setLoadingRoleSwitch(false);
    }
  };

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permisos requeridos', 'Necesitamos acceso a tu galería para subir el comprobante.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setProofImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'No se pudo seleccionar la imagen');
    }
  };

  const handlePurchaseSubmit = async () => {
    if (!selectedPaymentMethod || !proofImage) {
      Alert.alert('Error', 'Por favor completa todos los campos');
      return;
    }

    setPurchaseLoading(true);
    try {
      // Create payment submission data
      const paymentData = {
        userId: user?.id,
        userName: user?.name,
        userEmail: user?.email,
        amount: 500,
        paymentMethod: selectedPaymentMethod,
        proofImage: proofImage,
        type: 'booking_pass' as const
      };

      // Submit payment proof using context
      await addPaymentProof(paymentData);

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      Alert.alert(
        'Comprobante Enviado',
        'Tu comprobante ha sido enviado exitosamente. El pase será activado una vez que se verifique el pago (usualmente en 5-10 minutos). El administrador recibirá una alerta sonora para procesar tu pago urgentemente.',
        [
          {
            text: 'OK',
            onPress: () => {
              setShowPurchaseModal(false);
              setSelectedPaymentMethod(null);
              setProofImage(null);
            }
          }
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'No se pudo procesar el comprobante. Inténtalo de nuevo.');
    } finally {
      setPurchaseLoading(false);
    }
  };

  const handlePlanPurchaseSubmit = async () => {
    if (!selectedPlan || !selectedPaymentMethod || !proofImage) {
      Alert.alert('Error', 'Por favor completa todos los campos');
      return;
    }

    setPurchaseLoading(true);
    try {
      await purchasePlan(selectedPlan, selectedPaymentMethod, proofImage);
      
      Alert.alert(
        'Plan Comprado',
        'Tu comprobante ha sido enviado exitosamente. El plan será activado una vez que se verifique el pago (usualmente en 5-10 minutos). El administrador recibirá una alerta sonora para procesar tu pago urgentemente.',
        [
          {
            text: 'OK',
            onPress: () => {
              setShowPlansModal(false);
              setSelectedPlan(null);
              setSelectedPaymentMethod(null);
              setProofImage(null);
            }
          }
        ]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'No se pudo procesar la compra del plan.');
    } finally {
      setPurchaseLoading(false);
    }
  };

  if (userType === 'admin') {
    return (
      <>
        {renderAdminDashboard()}
        
        {/* Role Switch Modal */}
        <Modal
          visible={showRoleSwitch}
          transparent
          animationType="slide"
          onRequestClose={() => setShowRoleSwitch(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{t('switch_to_test_user')}</Text>
                <TouchableOpacity
                  onPress={() => setShowRoleSwitch(false)}
                  style={styles.closeButton}
                >
                  <X size={24} color="#666" />
                </TouchableOpacity>
              </View>

              <Text style={styles.modalDescription}>
                {t('enter_test_credentials')}
              </Text>

              <View style={styles.roleSelectionContainer}>
                <Text style={styles.roleSelectionLabel}>{t('select_role')}:</Text>
                <View style={styles.roleButtons}>
                  <TouchableOpacity
                    style={[
                      styles.roleButton,
                      roleSwitchData.targetRole === 'client' && styles.roleButtonActive,
                    ]}
                    onPress={() => setRoleSwitchData({ ...roleSwitchData, targetRole: 'client' })}
                  >
                    <Text style={[
                      styles.roleButtonText,
                      roleSwitchData.targetRole === 'client' && styles.roleButtonTextActive,
                    ]}>
                      {t('client_mikompa')}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.roleButton,
                      roleSwitchData.targetRole === 'provider' && styles.roleButtonActive,
                    ]}
                    onPress={() => setRoleSwitchData({ ...roleSwitchData, targetRole: 'provider' })}
                  >
                    <Text style={[
                      styles.roleButtonText,
                      roleSwitchData.targetRole === 'provider' && styles.roleButtonTextActive,
                    ]}>
                      {t('provider_2kompa')}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.modalInputContainer}>
                <Mail size={20} color="#666" />
                <TextInput
                  style={styles.modalInput}
                  placeholder={t('email')}
                  value={roleSwitchData.email}
                  onChangeText={(text) => setRoleSwitchData({ ...roleSwitchData, email: text })}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholderTextColor="#666"
                />
              </View>

              <View style={styles.modalInputContainer}>
                <Lock size={20} color="#666" />
                <TextInput
                  style={styles.modalInput}
                  placeholder={t('password')}
                  value={roleSwitchData.password}
                  onChangeText={(text) => setRoleSwitchData({ ...roleSwitchData, password: text })}
                  secureTextEntry
                  placeholderTextColor="#666"
                />
              </View>

              <TouchableOpacity
                style={styles.modalButton}
                onPress={handleRoleSwitch}
                disabled={loadingRoleSwitch}
              >
                <Text style={styles.modalButtonText}>
                  {loadingRoleSwitch ? t('switching') : t('change_role')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </>
    );
  }
  if (userType === 'provider') return renderProviderDashboard();
  return renderClientDashboard();
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  actionCard: {
    flex: 1,
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    flexWrap: 'wrap',
    ...(Platform.OS === 'web' && {
      wordWrap: 'break-word',
      overflowWrap: 'break-word',
    }),
  },
  emptyState: {
    backgroundColor: 'white',
    padding: 40,
    borderRadius: 16,
    alignItems: 'center',
    gap: 12,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  emptyButton: {
    backgroundColor: '#D81B60',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  emptyButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  serviceCard: {
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  serviceText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    gap: 8,
    flex: 1,
    minWidth: (width - 60) / 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  adminActions: {
    gap: 12,
  },
  adminActionCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  adminActionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  adminActionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  splashContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  splashContent: {
    alignItems: 'center',
  },
  splashLogo: {
    fontSize: 48,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  splashTagline: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '300',
  },
  walletSection: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  walletCard: {
    flex: 1,
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  walletTitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  walletBalance: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 4,
  },
  walletSubtext: {
    fontSize: 12,
    color: '#999',
  },
  okoinsCard: {
    flex: 1,
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  okoinsTitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  okoinsBalance: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF9800',
    marginBottom: 4,
  },
  okoinsSubtext: {
    fontSize: 12,
    color: '#999',
  },
  passesSection: {
    marginBottom: 24,
  },
  passesCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  passesCount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#D81B60',
    marginBottom: 8,
  },
  passesText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
  },
  buyPassButton: {
    backgroundColor: '#D81B60',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buyPassText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  testUserButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D81B60',
    gap: 12,
  },
  testUserButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#D81B60',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  modalContent: {
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
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    flexWrap: 'wrap',
    flex: 1,
    ...(Platform.OS === 'web' && {
      wordWrap: 'break-word',
      overflowWrap: 'break-word',
    }),
  },
  closeButton: {
    padding: 4,
  },
  modalDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  roleSelectionContainer: {
    marginBottom: 20,
  },
  roleSelectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  roleButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  roleButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D81B60',
    alignItems: 'center',
  },
  roleButtonActive: {
    backgroundColor: '#D81B60',
  },
  roleButtonText: {
    color: '#D81B60',
    fontWeight: '600',
    fontSize: 12,
  },
  roleButtonTextActive: {
    color: 'white',
  },
  modalInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 4,
    gap: 12,
    marginBottom: 16,
  },
  modalInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
  },
  modalButton: {
    backgroundColor: '#D81B60',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  modalButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  appointmentCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginRight: 12,
    width: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  appointmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  appointmentDate: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    textTransform: 'uppercase',
  },
  appointmentTime: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  appointmentClient: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  appointmentService: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  appointmentType: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  appointmentTypeText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  alertTestContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  testAlertButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff3f0',
    borderWidth: 2,
    borderColor: '#ff6b35',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
  testAlertButtonActive: {
    backgroundColor: '#ff6b35',
    borderColor: '#ff6b35',
  },
  testAlertButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ff6b35',
  },
  testAlertButtonTextActive: {
    color: '#fff',
  },
  alertStatus: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#e3f2fd',
    borderRadius: 8,
    alignItems: 'center',
  },
  alertStatusText: {
    fontSize: 14,
    color: '#1976d2',
    fontWeight: '500',
  },
  scrollModalContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 40,
  },
  purchaseModalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    width: '100%',
    maxWidth: width - 32,
    alignSelf: 'center',
  },
  plansModalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    width: '100%',
    maxWidth: width - 32,
    alignSelf: 'center',
  },
  plansDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
    lineHeight: 20,
  },
  planCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
  },
  popularPlanCard: {
    borderColor: '#FF9800',
    backgroundColor: '#FFF8E1',
  },
  selectedPlanCard: {
    borderColor: '#D81B60',
    backgroundColor: '#FCE4EC',
  },
  popularBadge: {
    position: 'absolute',
    top: -8,
    right: 16,
    backgroundColor: '#FF9800',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  popularBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  planName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  planPrice: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#D81B60',
  },
  planDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  planBenefits: {
    marginBottom: 16,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  benefitText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  planStats: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  planStatsText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    fontWeight: '600',
  },
  priceSection: {
    alignItems: 'center',
    marginBottom: 24,
    paddingVertical: 20,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
  },
  priceLabel: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  priceAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#D81B60',
    marginBottom: 4,
  },
  priceDescription: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  paymentMethodSection: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  paymentMethodButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#D81B60',
    marginBottom: 8,
    gap: 12,
  },
  paymentMethodButtonActive: {
    backgroundColor: '#D81B60',
  },
  paymentMethodText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#D81B60',
  },
  paymentMethodTextActive: {
    color: 'white',
  },
  paymentInfoSection: {
    backgroundColor: '#E8F5E8',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    alignItems: 'center',
  },
  paymentInfoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 8,
  },
  paymentInfoNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1B5E20',
    marginBottom: 4,
  },
  paymentInfoOwner: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2E7D32',
    marginBottom: 12,
  },
  paymentInfoNote: {
    fontSize: 12,
    color: '#4CAF50',
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 8,
  },
  paymentInfoInstructions: {
    fontSize: 14,
    color: '#388E3C',
    textAlign: 'center',
  },
  proofSection: {
    marginBottom: 24,
  },
  uploadButton: {
    borderWidth: 2,
    borderColor: '#D81B60',
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    gap: 8,
  },
  uploadButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#D81B60',
  },
  uploadButtonSubtext: {
    fontSize: 12,
    color: '#999',
  },
  imagePreviewContainer: {
    alignItems: 'center',
    gap: 12,
  },
  imagePreview: {
    width: 200,
    height: 150,
    borderRadius: 12,
    resizeMode: 'cover',
  },
  changeImageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D81B60',
  },
  changeImageText: {
    fontSize: 14,
    color: '#D81B60',
    fontWeight: '500',
  },
  submitButton: {
    backgroundColor: '#D81B60',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 24,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  recommendationSection: {
    backgroundColor: '#FFF3E0',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  recommendationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#E65100',
    marginBottom: 8,
  },
  recommendationText: {
    fontSize: 14,
    color: '#BF360C',
    marginBottom: 12,
    lineHeight: 20,
  },
  planButton: {
    backgroundColor: '#FF9800',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  planButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  notificationBadge: {
    backgroundColor: '#FF4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 'auto',
  },
  notificationText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  statusIndicator: {
    marginTop: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  statusConfirmed: {
    backgroundColor: '#4CAF50',
  },
  statusPending: {
    backgroundColor: '#FF9800',
  },
  statusCancelled: {
    backgroundColor: '#F44336',
  },
  statusIndicatorText: {
    fontSize: 10,
    fontWeight: '600',
    color: 'white',
  },
  reservationDetailsModalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 0,
    width: '95%',
    maxWidth: 450,
    maxHeight: '90%',
    minHeight: 400,
    overflow: 'hidden',
    alignSelf: 'center',
  },
  reservationDetailsContent: {
    flex: 1,
    padding: 20,
    minHeight: 300,
  },
  reservationInfoSection: {
    marginBottom: 24,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
    flex: 1,
    flexWrap: 'wrap',
    ...(Platform.OS === 'web' && {
      wordWrap: 'break-word',
      overflowWrap: 'break-word',
    }),
  },
  detailValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
    flex: 2,
    textAlign: 'right',
    textTransform: 'capitalize',
    flexWrap: 'wrap',
    ...(Platform.OS === 'web' && {
      wordWrap: 'break-word',
      overflowWrap: 'break-word',
    }),
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignItems: 'center',
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  reservationActionsSection: {
    marginBottom: 24,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 12,
    gap: 8,
  },
  confirmButton: {
    backgroundColor: '#4CAF50',
  },
  rescheduleButton: {
    backgroundColor: '#2196F3',
  },
  cancelButton: {
    backgroundColor: '#F44336',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  contactSection: {
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
    paddingTop: 20,
  },
  contactButtonsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  contactButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 8,
  },
  callButton: {
    backgroundColor: '#4CAF50',
  },

  kompa2goButton: {
    backgroundColor: '#D81B60',
  },
  contactButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },

});