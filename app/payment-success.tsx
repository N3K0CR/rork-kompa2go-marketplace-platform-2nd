import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated } from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useReservationPlans } from '@/contexts/ReservationPlansContext';
import { useOKoins } from '@/contexts/OKoinsContext';
import { CheckCircle, Gift, Calendar, ArrowRight, Home, CreditCard, Clock } from 'lucide-react-native';



export default function PaymentSuccessScreen() {
  const insets = useSafeAreaInsets();
  const { getAvailablePlans, refreshPlans } = useReservationPlans();
  const { addOKoins } = useOKoins();
  const params = useLocalSearchParams();
  
  const [scaleAnim] = useState(new Animated.Value(0));
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));
  
  const plans = getAvailablePlans();
  const selectedPlan = plans.find(p => p.id === params.planId);
  
  useEffect(() => {
    // Refresh plans data when payment is successful
    refreshPlans();
    
    // Award bonus OKoins for successful payment
    if (params.amount && typeof params.amount === 'string') {
      const bonusOKoins = Math.floor(parseInt(params.amount) / 100); // 1 OKoin per 100 colones
      addOKoins(bonusOKoins, `Compra de plan ${params.planName || 'K2G'}`);
    }
    
    // Start animations
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        })
      ])
    ]).start();
  }, [params, refreshPlans, addOKoins, scaleAnim, fadeAnim, slideAnim]);
  
  const handleGoHome = () => {
    router.replace('/(tabs)');
  };
  
  const handleViewPlans = () => {
    router.push('/(tabs)/profile');
  };
  
  const formatAmount = (amount: string | string[] | undefined) => {
    if (!amount) return '0';
    const amountStr = Array.isArray(amount) ? amount[0] : amount;
    return parseInt(amountStr).toLocaleString();
  };
  
  const getPaymentMethodDisplay = (method: string | string[] | undefined) => {
    if (!method) return 'Método de pago';
    const methodStr = Array.isArray(method) ? method[0] : method;
    if (!methodStr || !methodStr.trim() || methodStr.length > 50) return 'Método de pago';
    
    const sanitizedMethod = methodStr.trim();
    const methods = {
      'sinpe': 'SINPE Móvil',
      'kash': 'Kash',
      'card': 'Tarjeta de Crédito/Débito',
      'bank_transfer': 'Transferencia Bancaria'
    };
    return methods[sanitizedMethod as keyof typeof methods] || sanitizedMethod || 'Método de pago';
  };
  
  return (
    <>
      <Stack.Screen 
        options={{
          headerShown: false,
        }} 
      />
      
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <LinearGradient
          colors={['#10B981', '#059669', '#047857']}
          style={styles.header}
        >
          <Animated.View 
            style={[
              styles.successIconContainer,
              {
                transform: [{ scale: scaleAnim }]
              }
            ]}
          >
            <CheckCircle size={80} color="white" />
          </Animated.View>
          
          <Animated.View 
            style={[
              styles.headerContent,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }]
              }
            ]}
          >
            <Text style={styles.successTitle}>¡Pago Exitoso!</Text>
            <Text style={styles.successSubtitle}>
              Tu plan ha sido activado correctamente
            </Text>
          </Animated.View>
        </LinearGradient>
        
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <Animated.View 
            style={[
              styles.detailsCard,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }]
              }
            ]}
          >
            <View style={styles.cardHeader}>
              <CreditCard size={24} color="#10B981" />
              <Text style={styles.cardTitle}>Detalles del Pago</Text>
            </View>
            
            <View style={styles.detailsGrid}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Plan Adquirido</Text>
                <Text style={styles.detailValue}>{Array.isArray(params.planName) ? params.planName[0] : params.planName || 'Plan K2G'}</Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Monto Pagado</Text>
                <Text style={styles.detailValueHighlight}>₡{formatAmount(params.amount)}</Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Método de Pago</Text>
                <Text style={styles.detailValue}>{getPaymentMethodDisplay(params.paymentMethod)}</Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>ID de Transacción</Text>
                <Text style={styles.detailValueSmall}>{Array.isArray(params.paymentId) ? params.paymentId[0] : params.paymentId || 'N/A'}</Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Reservas Incluidas</Text>
                <Text style={styles.detailValue}>{Array.isArray(params.reservations) ? params.reservations[0] : params.reservations || selectedPlan?.reservations || '0'}</Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Fecha de Activación</Text>
                <Text style={styles.detailValue}>{new Date().toLocaleDateString('es-CR')}</Text>
              </View>
            </View>
          </Animated.View>
          
          {/* Benefits Card */}
          <Animated.View 
            style={[
              styles.benefitsCard,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }]
              }
            ]}
          >
            <View style={styles.cardHeader}>
              <Gift size={24} color="#F59E0B" />
              <Text style={styles.cardTitle}>Beneficios Activados</Text>
            </View>
            
            <View style={styles.benefitsList}>
              <View style={styles.benefitItem}>
                <CheckCircle size={20} color="#10B981" />
                <Text style={styles.benefitText}>Acceso completo a información de contacto</Text>
              </View>
              
              <View style={styles.benefitItem}>
                <CheckCircle size={20} color="#10B981" />
                <Text style={styles.benefitText}>Reservas ilimitadas durante 30 días</Text>
              </View>
              
              <View style={styles.benefitItem}>
                <CheckCircle size={20} color="#10B981" />
                <Text style={styles.benefitText}>Soporte prioritario</Text>
              </View>
              
              <View style={styles.benefitItem}>
                <CheckCircle size={20} color="#10B981" />
                <Text style={styles.benefitText}>OKoins de bonificación ganados</Text>
              </View>
            </View>
          </Animated.View>
          
          {/* Next Steps Card */}
          <Animated.View 
            style={[
              styles.nextStepsCard,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }]
              }
            ]}
          >
            <View style={styles.cardHeader}>
              <Clock size={24} color="#3B82F6" />
              <Text style={styles.cardTitle}>Próximos Pasos</Text>
            </View>
            
            <View style={styles.stepsList}>
              <View style={styles.stepItem}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>1</Text>
                </View>
                <Text style={styles.stepText}>Busca proveedores de servicios en la pestaña &quot;Buscar&quot;</Text>
              </View>
              
              <View style={styles.stepItem}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>2</Text>
                </View>
                <Text style={styles.stepText}>Accede a la información de contacto completa</Text>
              </View>
              
              <View style={styles.stepItem}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>3</Text>
                </View>
                <Text style={styles.stepText}>Realiza tus reservas directamente</Text>
              </View>
            </View>
          </Animated.View>
          
          {/* Action Buttons */}
          <Animated.View 
            style={[
              styles.actionButtons,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }]
              }
            ]}
          >
            <TouchableOpacity style={styles.secondaryButton} onPress={handleViewPlans}>
              <Calendar size={20} color="#6B7280" />
              <Text style={styles.secondaryButtonText}>Ver Mis Planes</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.primaryButton} onPress={handleGoHome}>
              <Home size={20} color="white" />
              <Text style={styles.primaryButtonText}>Ir al Inicio</Text>
              <ArrowRight size={16} color="white" />
            </TouchableOpacity>
          </Animated.View>
          
          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              ¡Gracias por confiar en Kompa2Go! 🎉
            </Text>
            <Text style={styles.footerSubtext}>
              Si tienes alguna pregunta, no dudes en contactarnos
            </Text>
          </View>
        </ScrollView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    paddingTop: 40,
    paddingBottom: 40,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  successIconContainer: {
    marginBottom: 20,
  },
  headerContent: {
    alignItems: 'center',
  },
  successTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
    textAlign: 'center',
  },
  successSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 22,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  detailsCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginTop: -20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  benefitsCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  nextStepsCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  detailsGrid: {
    gap: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  detailLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '600',
  },
  detailValueHighlight: {
    fontSize: 16,
    color: '#10B981',
    fontWeight: 'bold',
  },
  detailValueSmall: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
    maxWidth: 120,
    textAlign: 'right',
  },
  benefitsList: {
    gap: 12,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  benefitText: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
    lineHeight: 20,
  },
  stepsList: {
    gap: 16,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  stepNumberText: {
    fontSize: 12,
    color: 'white',
    fontWeight: 'bold',
  },
  stepText: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
    lineHeight: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  secondaryButtonText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '600',
  },
  primaryButton: {
    flex: 1,
    backgroundColor: '#10B981',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  primaryButtonText: {
    fontSize: 14,
    color: 'white',
    fontWeight: 'bold',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 20,
    marginBottom: 20,
  },
  footerText: {
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 4,
  },
  footerSubtext: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
});