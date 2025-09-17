import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Image, ActivityIndicator } from 'react-native';
import { Stack, router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { useReservationPlans } from '@/contexts/ReservationPlansContext';
import { usePaymentBackend } from '@/contexts/PaymentBackendContext';
import { useLemonSqueezy } from '@/contexts/LemonSqueezyContext';
import CardPaymentCheckout from '@/components/CardPaymentCheckout';
import { Check, ArrowLeft, Upload, Info, X } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';

export default function PurchasePlanScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { getAvailablePlans, purchasePlan } = useReservationPlans();
  const {
    selectedCountry,
    currentCountryConfig,
    isCreatingPayment,
    createPayment,
    calculateFees,
    formatAmount,
    isPaymentMethodSupported
  } = usePaymentBackend();
  
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'sinpe' | 'kash' | 'card' | 'bank_transfer'>('card');
  const [proofImage, setProofImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [hoveredMethod, setHoveredMethod] = useState<string | null>(null);
  
  const plans = useMemo(() => getAvailablePlans(), [getAvailablePlans]);
  const selectedPlanData = useMemo(() => plans.find(p => p.id === selectedPlan), [plans, selectedPlan]);
  // No tax charges - total is same as plan price
  const fees = useMemo(() => selectedPlanData ? {
    ...calculateFees(selectedPlanData.price, paymentMethod),
    totalAmount: selectedPlanData.price // Override total to remove taxes
  } : null, [selectedPlanData, calculateFees, paymentMethod]);
  
  useEffect(() => {
    if (plans.length > 0 && !selectedPlan) {
      setSelectedPlan(plans.find(p => p.popular)?.id || plans[0].id);
    }
  }, [plans, selectedPlan]);
  
  const handleImagePicker = async () => {
    try {
      setIsUploading(true);
      
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Error', 'Se necesitan permisos para acceder a la galería');
        return;
      }
      
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: true,
      });
      
      if (!result.canceled && result.assets[0].base64) {
        const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`;
        setProofImage(base64Image);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'No se pudo seleccionar la imagen');
    } finally {
      setIsUploading(false);
    }
  };
  
  const handlePurchase = async () => {
    if (!selectedPlanData) {
      Alert.alert('Error', 'Selecciona un plan');
      return;
    }
    
    if (!user) {
      Alert.alert('Error', 'Debes iniciar sesión');
      return;
    }
    
    // Para métodos tradicionales (SINPE, Kash)
    if (['sinpe', 'kash'].includes(paymentMethod) && !proofImage) {
      Alert.alert('Error', 'Debes subir el comprobante de pago');
      return;
    }
    
    try {
      if (paymentMethod === 'card') {
        // El pago con tarjeta se maneja en CardPaymentCheckout
        return;
      }

      // Crear payment para métodos tradicionales
      const payment = await createPayment({
        amount: selectedPlanData.price,
        paymentMethod: paymentMethod as any,
        description: `Plan ${selectedPlanData.name} - ${selectedPlanData.reservations} reservas`,
        planId: selectedPlanData.id,
        proofImage: proofImage || undefined,
      });
      
      // También crear en el sistema anterior para compatibilidad
      if (['sinpe', 'kash'].includes(paymentMethod) && proofImage) {
        await purchasePlan(selectedPlanData.id, paymentMethod as 'sinpe' | 'kash', proofImage);
      }
      
      // Navigate to success page with payment details
      router.replace({
        pathname: '/payment-success',
        params: {
          planId: selectedPlanData.id,
          planName: selectedPlanData.name,
          amount: selectedPlanData.price.toString(),
          paymentId: payment.id,
          paymentMethod: paymentMethod,
          reservations: selectedPlanData.reservations.toString()
        }
      });
      
    } catch (error) {
      console.error('Purchase error:', error);
      Alert.alert('Error', error instanceof Error ? error.message : 'Error al procesar el pago');
    }
  };
  

  
  const getPaymentMethods = () => {
    return ['card', 'sinpe', 'kash', 'bank_transfer'];
  };

  const isMethodEnabled = (method: string) => {
    if (method === 'card') return true;
    return ['sinpe', 'kash'].includes(method);
  };

  const getMethodTooltip = (method: string) => {
    if (method === 'bank_transfer') {
      return 'Próximamente disponible - Estamos trabajando para traer esta funcionalidad pronto';
    }
    return null;
  };

  const getMethodDetails = (method: string) => {
    const details = {
      card: {
        emoji: '💳',
        name: 'Tarjeta de Crédito/Débito',
        description: 'Pago seguro internacional',
        badge: '🌍 Global'
      },
      sinpe: {
        emoji: '📱',
        name: 'SINPE Móvil',
        description: 'Transferencia inmediata Costa Rica',
        badge: '🇨🇷 CR'
      },
      kash: {
        emoji: '💰',
        name: 'Kash',
        description: 'Billetera digital Costa Rica',
        badge: '🇨🇷 CR'
      },
      bank_transfer: {
        emoji: '🏦',
        name: 'Transferencia Bancaria',
        description: 'Próximamente disponible',
        badge: ''
      }
    };
    return details[method as keyof typeof details];
  };
  
  return (
    <>
      <Stack.Screen 
        options={{
          title: 'Comprar Pase de Reserva',
          headerStyle: { backgroundColor: '#D81B60' },
          headerTintColor: 'white',
          headerTitleStyle: { fontWeight: 'bold' },
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()}>
              <ArrowLeft size={24} color="white" />
            </TouchableOpacity>
          ),
        }} 
      />
      
      <View style={[styles.safeContainer, { paddingTop: insets.top }]}>
        <ScrollView style={styles.container}>
        <LinearGradient
          colors={['#D81B60', '#E91E63']}
          style={styles.header}
        >
          <Text style={styles.headerTitle}>Planes de Reserva</Text>
          <Text style={styles.headerSubtitle}>
            Adquiere un plan para acceder a información de contacto y realizar reservas
          </Text>
        </LinearGradient>
        
        <View style={styles.content}>
          {/* Plan Selection */}
          <Text style={styles.sectionTitle}>Selecciona tu Plan</Text>
          <View style={styles.plansGrid}>
            {plans.map((plan) => (
              <TouchableOpacity
                key={plan.id}
                style={[
                  styles.planCard,
                  selectedPlan === plan.id && styles.selectedPlan
                ]}
                onPress={() => setSelectedPlan(plan.id)}
              >
                {plan.popular && (
                  <View style={styles.popularBadge}>
                    <Text style={styles.popularText}>Popular</Text>
                  </View>
                )}
                {selectedPlan === plan.id && (
                  <View style={styles.selectedIndicator}>
                    <Check size={16} color="white" />
                  </View>
                )}
                <Text style={styles.planName}>{plan.name}</Text>
                <Text style={styles.planPrice}>₡{plan.price.toLocaleString()}</Text>
                <Text style={styles.planDescription}>{plan.description}</Text>
                <View style={styles.planBenefits}>
                  {plan.benefits.map((benefit, index) => (
                    <View key={index} style={styles.benefitItem}>
                      <Check size={16} color="#10B981" />
                      <Text style={styles.benefitText}>{benefit}</Text>
                    </View>
                  ))}
                </View>
              </TouchableOpacity>
            ))}
          </View>
          
          {/* Payment Method Selection */}
          <Text style={styles.sectionTitle}>Método de Pago</Text>
          <View style={styles.paymentMethods}>
            {getPaymentMethods().map((method) => {
              const methodDetails = getMethodDetails(method);
              const isEnabled = isMethodEnabled(method);
              const tooltip = getMethodTooltip(method);
              
              return (
                <View key={method} style={styles.paymentMethodContainer}>
                  <TouchableOpacity
                    style={[
                      styles.paymentMethodCard,
                      paymentMethod === method && styles.selectedPaymentMethod,
                      !isEnabled && styles.disabledPaymentMethod,
                    ]}
                    onPress={() => isEnabled && setPaymentMethod(method as any)}
                    disabled={!isEnabled}
                    onPressIn={() => setHoveredMethod(method)}
                    onPressOut={() => setHoveredMethod(null)}
                  >
                    <View style={styles.paymentMethodIcon}>
                      <Text style={styles.methodEmoji}>{methodDetails.emoji}</Text>
                    </View>
                    <View style={styles.paymentMethodContent}>
                      <Text style={[
                        styles.paymentMethodName,
                        paymentMethod === method && styles.selectedPaymentMethodName,
                        !isEnabled && styles.disabledPaymentMethodName,
                      ]}>
                        {methodDetails.name}
                      </Text>
                      <Text style={styles.paymentMethodDescription}>
                        {methodDetails.description}
                      </Text>
                      {methodDetails.badge && (
                        <Text style={styles.methodBadge}>{methodDetails.badge}</Text>
                      )}
                    </View>
                    {tooltip && (
                      <TouchableOpacity style={styles.infoIcon}>
                        <Info size={16} color="#6B7280" />
                      </TouchableOpacity>
                    )}
                  </TouchableOpacity>
                  
                  {tooltip && hoveredMethod === method && (
                    <View style={styles.tooltip}>
                      <Text style={styles.tooltipText}>{tooltip}</Text>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
          
          {/* Payment Details */}
          {selectedPlanData && (
            <>
              {/* Card Payment Component */}
              {paymentMethod === 'card' && (
                <CardPaymentCheckout
                  planId={selectedPlanData.id}
                  planName={selectedPlanData.name}
                  amount={selectedPlanData.price}
                  currency="CRC"
                  onSuccess={() => {
                    router.replace({
                      pathname: '/payment-success',
                      params: {
                        planId: selectedPlanData.id,
                        planName: selectedPlanData.name,
                        amount: selectedPlanData.price.toString(),
                        paymentId: 'card-payment-' + Date.now(),
                        paymentMethod: 'card',
                        reservations: selectedPlanData.reservations.toString()
                      }
                    });
                  }}
                  onError={(error) => {
                    console.error('Card payment error:', error);
                  }}
                />
              )}
          
              {/* Traditional Payment Methods */}
              {['sinpe', 'kash'].includes(paymentMethod) && (
                <>
                  <View style={styles.paymentDetails}>
                    <Text style={styles.paymentDetailsTitle}>
                      Detalles del Pago - {getMethodDetails(paymentMethod).name}
                    </Text>
                    
                    {paymentMethod === 'sinpe' && (
                      <>
                        <Text style={styles.paymentDetailsText}>
                          Número SINPE: <Text style={styles.highlight}>8888-8888</Text>
                        </Text>
                        <Text style={styles.paymentDetailsText}>
                          Nombre: <Text style={styles.highlight}>Kompa2Go Costa Rica</Text>
                        </Text>
                      </>
                    )}
                    
                    {paymentMethod === 'kash' && (
                      <>
                        <Text style={styles.paymentDetailsText}>
                          Usuario Kash: <Text style={styles.highlight}>@kompa2go</Text>
                        </Text>
                        <Text style={styles.paymentDetailsText}>
                          Nombre: <Text style={styles.highlight}>Kompa2Go CR</Text>
                        </Text>
                      </>
                    )}
                    
                    <Text style={styles.paymentDetailsText}>
                      Monto: <Text style={styles.highlight}>₡{selectedPlanData.price.toLocaleString()}</Text>
                    </Text>
                  </View>

                  <View style={styles.uploadSection}>
                    <Text style={styles.sectionTitle}>Comprobante de Pago</Text>
                    <Text style={styles.uploadInstructions}>
                      Sube una captura de pantalla del comprobante de tu pago
                    </Text>
                    
                    {proofImage ? (
                      <View style={styles.imagePreview}>
                        <Image source={{ uri: proofImage }} style={styles.uploadedImage} />
                        <TouchableOpacity 
                          style={styles.removeImageButton}
                          onPress={() => setProofImage(null)}
                        >
                          <X size={16} color="white" />
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <TouchableOpacity
                        style={styles.uploadButton}
                        onPress={handleImagePicker}
                        disabled={isUploading}
                      >
                        {isUploading ? (
                          <ActivityIndicator color="#D81B60" />
                        ) : (
                          <Upload size={24} color="#D81B60" />
                        )}
                        <Text style={styles.uploadButtonText}>
                          {isUploading ? 'Subiendo...' : 'Subir Comprobante'}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  <TouchableOpacity
                    style={[
                      styles.purchaseButton,
                      !proofImage && styles.purchaseButtonDisabled
                    ]}
                    onPress={handlePurchase}
                    disabled={!proofImage || isCreatingPayment}
                  >
                    {isCreatingPayment ? (
                      <ActivityIndicator color="white" />
                    ) : (
                      <Text style={styles.purchaseButtonText}>
                        Enviar Comprobante
                      </Text>
                    )}
                  </TouchableOpacity>
                </>
              )}
            </>
          )}
          

        </View>
        </ScrollView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#D81B60',
  },
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    paddingTop: 20,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  plansGrid: {
    gap: 12,
    marginBottom: 24,
  },
  planCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    position: 'relative',
  },
  selectedPlan: {
    borderColor: '#D81B60',
    backgroundColor: '#FFF5F8',
  },
  popularBadge: {
    position: 'absolute',
    top: -8,
    right: 16,
    backgroundColor: '#F59E0B',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  popularText: {
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
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  planPrice: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#D81B60',
  },
  planDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  planBenefits: {
    gap: 8,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  benefitText: {
    fontSize: 14,
    color: '#374151',
  },
  selectedIndicator: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: '#D81B60',
    borderRadius: 12,
    padding: 4,
  },
  paymentMethods: {
    gap: 12,
  },
  paymentMethodCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  selectedPaymentMethod: {
    borderColor: '#D81B60',
    backgroundColor: '#FFF5F8',
  },
  disabledPaymentMethod: {
    opacity: 0.4,
    backgroundColor: '#F5F5F5',
  },
  paymentMethodContainer: {
    position: 'relative',
  },
  disabledPaymentMethodName: {
    color: '#999',
  },
  infoIcon: {
    marginLeft: 'auto',
  },
  tooltip: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#333',
    padding: 12,
    borderRadius: 8,
    marginTop: 4,
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  tooltipText: {
    color: 'white',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
  },
  paymentDetails: {
    backgroundColor: '#E3F2FD',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  paymentDetailsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1565C0',
    marginBottom: 8,
  },
  paymentDetailsText: {
    fontSize: 14,
    color: '#1976D2',
    marginBottom: 4,
    fontWeight: '500',
  },
  paymentMethodIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  methodEmoji: {
    fontSize: 20,
  },
  paymentMethodName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  paymentMethodDescription: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  methodBadge: {
    fontSize: 10,
    color: '#10B981',
    fontWeight: '600',
    marginTop: 4,
  },
  highlight: {
    fontWeight: 'bold',
    color: '#D81B60',
  },
  selectedPaymentMethodName: {
    color: '#D81B60',
  },
  cardForm: {
    gap: 16,
  },
  formGroup: {
    gap: 8,
  },
  formRow: {
    flexDirection: 'row',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  input: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  uploadSection: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
  },
  uploadInstructions: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
    textAlign: 'center',
  },
  paymentInfo: {
    backgroundColor: '#F3F4F6',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  paymentInfoText: {
    fontSize: 14,
    color: '#374151',
    textAlign: 'center',
  },
  paymentAmount: {
    fontWeight: 'bold',
    color: '#D81B60',
  },
  uploadButton: {
    backgroundColor: 'rgba(216, 27, 96, 0.1)',
    borderWidth: 2,
    borderColor: '#D81B60',
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    gap: 8,
  },
  uploadButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#D81B60',
  },
  imagePreview: {
    position: 'relative',
    alignItems: 'center',
    marginTop: 16,
  },
  uploadedImage: {
    width: 200,
    height: 200,
    borderRadius: 12,
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 12,
    padding: 4,
  },
  purchaseButtonDisabled: {
    backgroundColor: '#9CA3AF',
    opacity: 0.6,
  },
  imagePreviewText: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '600',
  },
  feeBreakdown: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
  },
  feeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  feeLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  feeValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    marginTop: 8,
    paddingTop: 16,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#D81B60',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  cancelButtonText: {
    color: '#6B7280',
    fontSize: 16,
    fontWeight: '600',
  },
  purchaseButton: {
    flex: 2,
    backgroundColor: '#D81B60',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  disabledButton: {
    backgroundColor: '#9CA3AF',
  },
  purchaseButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  paymentMethodContent: {
    flex: 1,
  },
  cardPaymentSection: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cardPaymentMessage: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});