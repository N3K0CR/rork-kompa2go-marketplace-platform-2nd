import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Image, TextInput, ActivityIndicator, Platform } from 'react-native';
import { Stack, router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { useReservationPlans } from '@/contexts/ReservationPlansContext';
import { usePaymentBackend } from '@/contexts/PaymentBackendContext';
import { CreditCard, Check, Star, ArrowLeft, Upload, DollarSign, Info, X } from 'lucide-react-native';
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
  const [paymentMethod, setPaymentMethod] = useState<'sinpe' | 'kash' | 'card' | 'bank_transfer'>('sinpe');
  const [proofImage, setProofImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [cardholderName, setCardholderName] = useState('');
  const [hoveredMethod, setHoveredMethod] = useState<string | null>(null);
  
  const plans = getAvailablePlans();
  const selectedPlanData = plans.find(p => p.id === selectedPlan);
  // No tax charges - total is same as plan price
  const fees = selectedPlanData ? {
    ...calculateFees(selectedPlanData.price, paymentMethod),
    totalAmount: selectedPlanData.price // Override total to remove taxes
  } : null;
  
  useEffect(() => {
    if (plans.length > 0 && !selectedPlan) {
      setSelectedPlan(plans.find(p => p.popular)?.id || plans[0].id);
    }
  }, [plans]);
  
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
    
    // Validate payment method requirements
    if (['sinpe', 'kash'].includes(paymentMethod) && !proofImage) {
      Alert.alert('Error', 'Debes subir el comprobante de pago');
      return;
    }
    
    if (paymentMethod === 'card') {
      if (!cardNumber || !expiryDate || !cvv || !cardholderName) {
        Alert.alert('Error', 'Completa todos los datos de la tarjeta');
        return;
      }
      
      // Basic card validation
      if (cardNumber.replace(/\s/g, '').length < 13) {
        Alert.alert('Error', 'Número de tarjeta inválido');
        return;
      }
      
      if (!/^\d{2}\/\d{2}$/.test(expiryDate)) {
        Alert.alert('Error', 'Fecha de vencimiento inválida (MM/YY)');
        return;
      }
      
      if (cvv.length < 3) {
        Alert.alert('Error', 'CVV inválido');
        return;
      }
    }
    
    try {
      // Create payment through backend
      const payment = await createPayment({
        amount: selectedPlanData.price,
        paymentMethod: paymentMethod as any,
        description: `Plan ${selectedPlanData.name} - ${selectedPlanData.reservations} reservas`,
        planId: selectedPlanData.id,
        proofImage: proofImage || undefined,
        metadata: {
          cardLast4: paymentMethod === 'card' ? cardNumber.slice(-4) : undefined,
          cardholderName: paymentMethod === 'card' ? cardholderName : undefined,
        }
      });
      
      // Also create through old system for compatibility
      if (['sinpe', 'kash'].includes(paymentMethod) && proofImage) {
        await purchasePlan(selectedPlanData.id, paymentMethod as 'sinpe' | 'kash', proofImage);
      }
      
      Alert.alert(
        'Pago Procesado',
        `Tu pago ha sido enviado para verificación.\n\nID de Pago: ${payment.id}\n\nRecibirás una notificación cuando sea aprobado.`,
        [
          {
            text: 'OK',
            onPress: () => router.back()
          }
        ]
      );
      
    } catch (error) {
      console.error('Purchase error:', error);
      Alert.alert('Error', error instanceof Error ? error.message : 'Error al procesar el pago');
    }
  };
  
  const formatCardNumber = (text: string) => {
    const cleaned = text.replace(/\s/g, '');
    const match = cleaned.match(/.{1,4}/g);
    return match ? match.join(' ') : cleaned;
  };
  
  const formatExpiryDate = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    if (cleaned.length >= 2) {
      return cleaned.substring(0, 2) + '/' + cleaned.substring(2, 4);
    }
    return cleaned;
  };
  
  const getPaymentMethods = () => {
    return ['sinpe', 'kash', 'card', 'bank_transfer'];
  };
  
  const isMethodEnabled = (method: string) => {
    return ['sinpe', 'kash'].includes(method);
  };
  
  const getMethodTooltip = (method: string) => {
    if (method === 'card') {
      return 'Próximamente disponible - Estamos trabajando para traer esta funcionalidad pronto';
    }
    if (method === 'bank_transfer') {
      return 'Próximamente disponible - Estamos trabajando para traer esta funcionalidad pronto';
    }
    return null;
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
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Selecciona tu Plan</Text>
            
            {plans.map((plan) => (
              <TouchableOpacity
                key={plan.id}
                style={[
                  styles.planCard,
                  selectedPlan === plan.id && styles.selectedPlanCard,
                  plan.popular && styles.popularPlanCard
                ]}
                onPress={() => setSelectedPlan(plan.id)}
              >
                {plan.popular && (
                  <View style={styles.popularBadge}>
                    <Star size={12} color="white" fill="white" />
                    <Text style={styles.popularText}>MÁS POPULAR</Text>
                  </View>
                )}
                
                <View style={styles.planHeader}>
                  <Text style={styles.planName}>{plan.name}</Text>
                  <Text style={styles.planPrice}>₡{plan.price.toLocaleString()}</Text>
                </View>
                
                <Text style={styles.planDescription}>{plan.description}</Text>
                
                <View style={styles.planBenefits}>
                  {plan.benefits.map((benefit, index) => (
                    <View key={index} style={styles.benefitItem}>
                      <Check size={16} color="#10B981" />
                      <Text style={styles.benefitText}>{benefit}</Text>
                    </View>
                  ))}
                </View>
                
                {selectedPlan === plan.id && (
                  <View style={styles.selectedIndicator}>
                    <Check size={20} color="white" fill="white" />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
          
          {/* Payment Method Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Método de Pago</Text>
            
            <View style={styles.paymentMethods}>
              {getPaymentMethods().map((method) => {
                const isEnabled = isMethodEnabled(method);
                const tooltip = getMethodTooltip(method);
                
                return (
                  <View key={method} style={styles.paymentMethodContainer}>
                    <TouchableOpacity
                      style={[
                        styles.paymentMethodCard,
                        paymentMethod === method && styles.selectedPaymentMethod,
                        !isEnabled && styles.disabledPaymentMethod
                      ]}
                      onPress={() => isEnabled && setPaymentMethod(method as any)}
                      disabled={!isEnabled}
                      {...(Platform.OS === 'web' && {
                        onMouseEnter: () => setHoveredMethod(method),
                        onMouseLeave: () => setHoveredMethod(null)
                      })}
                    >
                      <View style={styles.paymentMethodIcon}>
                        {method === 'sinpe' && <Text style={styles.methodEmoji}>📱</Text>}
                        {method === 'kash' && <Text style={styles.methodEmoji}>💳</Text>}
                        {method === 'card' && <CreditCard size={24} color={isEnabled && paymentMethod === method ? '#D81B60' : '#999'} />}
                        {method === 'bank_transfer' && <Text style={styles.methodEmoji}>🏦</Text>}
                      </View>
                      <Text style={[
                        styles.paymentMethodName,
                        paymentMethod === method && isEnabled && styles.selectedPaymentMethodName,
                        !isEnabled && styles.disabledPaymentMethodName
                      ]}>
                        {method === 'sinpe' && 'SINPE Móvil'}
                        {method === 'kash' && 'KASH'}
                        {method === 'card' && 'Tarjeta de Crédito/Débito'}
                        {method === 'bank_transfer' && 'Transferencia Bancaria'}
                      </Text>
                      {!isEnabled && (
                        <Info size={16} color="#999" style={styles.infoIcon} />
                      )}
                    </TouchableOpacity>
                    
                    {/* Tooltip for disabled methods */}
                    {!isEnabled && hoveredMethod === method && tooltip && Platform.OS === 'web' && (
                      <View style={styles.tooltip}>
                        <Text style={styles.tooltipText}>{tooltip}</Text>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          </View>
          
          {/* Payment Details */}
          {paymentMethod === 'card' && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Datos de la Tarjeta</Text>
              
              <View style={styles.cardForm}>
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Número de Tarjeta</Text>
                  <TextInput
                    style={styles.input}
                    value={cardNumber}
                    onChangeText={(text) => setCardNumber(formatCardNumber(text))}
                    placeholder="1234 5678 9012 3456"
                    keyboardType="numeric"
                    maxLength={19}
                  />
                </View>
                
                <View style={styles.formRow}>
                  <View style={[styles.formGroup, { flex: 1 }]}>
                    <Text style={styles.label}>Vencimiento</Text>
                    <TextInput
                      style={styles.input}
                      value={expiryDate}
                      onChangeText={(text) => setExpiryDate(formatExpiryDate(text))}
                      placeholder="MM/YY"
                      keyboardType="numeric"
                      maxLength={5}
                    />
                  </View>
                  
                  <View style={[styles.formGroup, { flex: 1, marginLeft: 12 }]}>
                    <Text style={styles.label}>CVV</Text>
                    <TextInput
                      style={styles.input}
                      value={cvv}
                      onChangeText={setCvv}
                      placeholder="123"
                      keyboardType="numeric"
                      maxLength={4}
                      secureTextEntry
                    />
                  </View>
                </View>
                
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Nombre del Titular</Text>
                  <TextInput
                    style={styles.input}
                    value={cardholderName}
                    onChangeText={setCardholderName}
                    placeholder="Nombre como aparece en la tarjeta"
                    autoCapitalize="words"
                  />
                </View>
              </View>
            </View>
          )}
          
          {/* Proof Upload for SINPE/Kash */}
          {['sinpe', 'kash'].includes(paymentMethod) && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Comprobante de Pago</Text>
              
              <View style={styles.uploadSection}>
                <Text style={styles.uploadInstructions}>
                  {paymentMethod === 'sinpe' 
                    ? 'Realiza el pago por SINPE Móvil y sube el comprobante'
                    : 'Realiza el pago por KASH y sube el comprobante'
                  }
                </Text>
                
                <View style={styles.paymentDetails}>
                  <Text style={styles.paymentDetailsTitle}>Información de Depósito:</Text>
                  <Text style={styles.paymentDetailsText}>📱 Número: 8833-2517</Text>
                  <Text style={styles.paymentDetailsText}>👤 Nombre: Ricardo Narváez Vargas</Text>
                  <Text style={styles.paymentDetailsText}>🏢 Sakura Beauty Salon TechDev Manager</Text>
                </View>
                
                {selectedPlanData && (
                  <View style={styles.paymentInfo}>
                    <Text style={styles.paymentInfoText}>
                      Monto a pagar: <Text style={styles.paymentAmount}>₡{selectedPlanData.price.toLocaleString()}</Text>
                    </Text>
                  </View>
                )}
                
                <TouchableOpacity
                  style={styles.uploadButton}
                  onPress={handleImagePicker}
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <ActivityIndicator size="small" color="#D81B60" />
                  ) : (
                    <Upload size={24} color="#D81B60" />
                  )}
                  <Text style={styles.uploadButtonText}>
                    {isUploading ? 'Subiendo...' : proofImage ? 'Cambiar Comprobante' : 'Subir Comprobante'}
                  </Text>
                </TouchableOpacity>
                
                {proofImage && (
                  <View style={styles.imagePreview}>
                    <Image source={{ uri: proofImage }} style={styles.previewImage} />
                    <Text style={styles.imagePreviewText}>Comprobante subido ✓</Text>
                  </View>
                )}
              </View>
            </View>
          )}
          
          {/* Fee Breakdown */}
          {fees && selectedPlanData && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Resumen del Pago</Text>
              
              <View style={styles.feeBreakdown}>
                <View style={styles.feeRow}>
                  <Text style={styles.feeLabel}>Plan {selectedPlanData.name}</Text>
                  <Text style={styles.feeValue}>₡{selectedPlanData.price.toLocaleString()}</Text>
                </View>
                
                <View style={[styles.feeRow, styles.totalRow]}>
                  <Text style={styles.totalLabel}>Total a Pagar</Text>
                  <Text style={styles.totalValue}>₡{selectedPlanData.price.toLocaleString()}</Text>
                </View>
              </View>
            </View>
          )}
          
          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => router.back()}
            >
              <X size={20} color="#6B7280" />
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.purchaseButton,
                (isCreatingPayment || !selectedPlanData) && styles.disabledButton
              ]}
              onPress={handlePurchase}
              disabled={isCreatingPayment || !selectedPlanData}
            >
              {isCreatingPayment ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <DollarSign size={24} color="white" />
              )}
              <Text style={styles.purchaseButtonText}>
                {isCreatingPayment ? 'Procesando...' : 'Comprar Plan'}
              </Text>
            </TouchableOpacity>
          </View>
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
  planCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    position: 'relative',
  },
  selectedPlanCard: {
    borderColor: '#D81B60',
    backgroundColor: '#FFF5F8',
  },
  popularPlanCard: {
    borderColor: '#F59E0B',
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
    flex: 1,
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
    marginTop: 16,
    alignItems: 'center',
    gap: 8,
  },
  previewImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
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
});