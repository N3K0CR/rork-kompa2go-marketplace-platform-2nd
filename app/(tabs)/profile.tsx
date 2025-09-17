import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Modal, TextInput, Platform } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useWallet } from '@/contexts/WalletContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useReservationPlans } from '@/contexts/ReservationPlansContext';
import { usePendingPayments } from '@/contexts/PendingPaymentsContext';
import { User, Settings, CreditCard, History, LogOut, Shield, Calendar, Users, BarChart3, Star, TrendingUp, Lock, X, Package, Check, AlertTriangle, Share } from 'lucide-react-native';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as Clipboard from 'expo-clipboard';

export default function ProfileScreen() {
  const { user, signOut, changePassword, resetPassword } = useAuth();
  const { walletBalance, okoins, bookingPasses } = useWallet();
  const { t } = useLanguage();
  const { getAvailablePlans, purchasePlan } = useReservationPlans();
  const { addPaymentProof } = usePendingPayments();
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [resetEmail, setResetEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [showPlansModal, setShowPlansModal] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'sinpe' | 'kash' | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [proofImage, setProofImage] = useState<string | null>(null);
  const [purchaseLoading, setPurchaseLoading] = useState(false);
  const [showReferralModal, setShowReferralModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleSignOut = () => {
    setShowLogoutModal(true);
  };

  const confirmSignOut = async () => {
    try {
      console.log('🔄 Starting logout process...');
      console.log('🔍 Current user before logout:', user);
      
      setShowLogoutModal(false);
      
      // Clear user state first
      await signOut();
      
      console.log('✅ Logout successful, redirecting to auth...');
      
      // Force navigation to auth screen and reset navigation stack
      router.replace('/auth');
      
      // Additional cleanup - force a small delay to ensure state is cleared
      setTimeout(() => {
        console.log('✅ Navigation completed');
        // Double-check navigation if needed
        if (user) {
          console.log('⚠️ User still exists after logout, forcing navigation again');
          router.replace('/onboarding');
        }
      }, 200);
      
    } catch (error) {
      console.error('❌ Error during logout:', error);
      Alert.alert('Error', 'No se pudo cerrar sesión. Inténtalo de nuevo.');
    }
  };

  const handleMenuPress = (action: string) => {
    switch (action) {
      case 'edit_profile':
        if (user?.userType === 'provider') {
          router.push('/provider/edit-profile');
        } else {
          router.push('/client/edit-profile');
        }
        break;
      case 'wallet':
        if (user?.userType === 'client') {
          setShowPurchaseModal(true);
        } else {
          Alert.alert(t('my_wallet'), 'Esta función no está disponible para proveedores');
        }
        break;
      case 'plans':
        if (user?.userType === 'client') {
          setShowPlansModal(true);
        } else {
          Alert.alert('Planes', 'Esta función no está disponible para proveedores');
        }
        break;
      case 'history':
        if (user?.userType === 'provider') {
          router.push('/provider/history');
        } else if (user?.userType === 'client') {
          router.push('/client/history');
        } else {
          Alert.alert(t('historical'), 'Historial de servicios en desarrollo');
        }
        break;
      case 'settings':
        Alert.alert(t('configurations'), 'Configuraciones en desarrollo');
        break;
      case 'reset_password':
        setShowResetModal(true);
        break;
      case 'calendar':
        router.push('/(tabs)/calendar');
        break;
      case 'collaborators':
        router.push('/collaborators');
        break;
      case 'rating':
        Alert.alert(
          t('rating_summary'),
          `${t('total_rated_services')}: 127\nCalificación promedio: 4.8/5.0\n\n${t('rating_tips')}:\n• Responde rápidamente a los mensajes\n• Llega puntual a las citas\n• Mantén alta calidad en el servicio\n• Solicita feedback a tus clientes`
        );
        break;
      case 'services':
        Alert.alert(
          t('services_analytics'),
          `${t('most_popular_services')}:\n• Limpieza General (45 servicios)\n• Limpieza Profunda (32 servicios)\n• Organización (28 servicios)\n• Limpieza de Ventanas (22 servicios)`
        );
        break;
      case 'revenue':
        Alert.alert(
          t('revenue_breakdown'),
          `Ingresos del mes: ₡450,000\n\n${t('filter_by_week')}:\n• Semana 1: ₡120,000\n• Semana 2: ₡110,000\n• Semana 3: ₡105,000\n• Semana 4: ₡115,000\n\n${t('revenue_improvement_guide')}:\n• Agrega promociones\n• Mejora tu calificación\n• Actualiza tu galería de trabajos`
        );
        break;
      case 'reported_problems':
        router.push('/reported-problems');
        break;
      case 'share_referral':
        handleShareReferral();
        break;
      default:
        Alert.alert('Funcionalidad', 'En desarrollo');
    }
  };

  const handleChangePassword = async () => {
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      Alert.alert('Error', 'Por favor completa todos los campos');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      Alert.alert('Error', 'Las contraseñas no coinciden');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      Alert.alert('Error', 'La nueva contraseña debe tener al menos 6 caracteres');
      return;
    }

    setLoading(true);
    try {
      await changePassword(passwordData.currentPassword, passwordData.newPassword);
      Alert.alert('Éxito', 'Contraseña cambiada exitosamente');
      setShowPasswordModal(false);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Error al cambiar la contraseña');
    } finally {
      setLoading(false);
    }
  };

  const handleShareReferral = async () => {
    const referralLink = `https://kompa2go.com/ref/${user?.uniqueId || user?.id}`;
    
    if (Platform.OS === 'web') {
      // For web, copy to clipboard
      try {
        await Clipboard.setStringAsync(referralLink);
        setShowReferralModal(true);
      } catch (error) {
        Alert.alert('Error', 'No se pudo copiar el enlace');
      }
    } else {
      // For mobile, use native sharing
      try {
        await Clipboard.setStringAsync(referralLink);
        setShowReferralModal(true);
      } catch (error) {
        Alert.alert('Error', 'No se pudo copiar el enlace');
      }
    }
  };

  const handleResetPassword = async () => {
    if (!resetEmail) {
      Alert.alert('Error', 'Por favor ingresa tu correo electrónico');
      return;
    }

    setLoading(true);
    try {
      await resetPassword(resetEmail);
      Alert.alert('Éxito', 'Se ha enviado un correo de recuperación a tu email');
      setShowResetModal(false);
      setResetEmail('');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Error al enviar el correo de recuperación');
    } finally {
      setLoading(false);
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

  const menuItems = [
    { icon: User, title: t('edit_profile'), subtitle: t('update_personal_info'), action: 'edit_profile' },
    { icon: History, title: t('historical'), subtitle: t('view_previous_bookings'), action: 'history' },
    { icon: Share, title: 'Compartir Enlace de Referido', subtitle: 'Invita amigos y gana recompensas', action: 'share_referral' },
    ...(user?.userType !== 'provider' ? [{ icon: Settings, title: t('configurations'), subtitle: t('app_preferences'), action: 'settings' }] : []),
  ];

  if (user?.userType === 'provider') {
    menuItems.splice(2, 0, 
      { icon: Calendar, title: t('my_calendar'), subtitle: t('manage_availability'), action: 'calendar' },
      { icon: Users, title: t('collaborators'), subtitle: t('manage_team'), action: 'collaborators' }
    );
  }

  if (user?.userType === 'admin') {
    menuItems.splice(1, 0,
      { icon: Shield, title: t('admin_panel'), subtitle: t('manage_platform'), action: 'admin_panel' },
      { icon: AlertTriangle, title: 'Problemas Reportados', subtitle: 'Gestionar reportes de clientes', action: 'reported_problems' }
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.profileSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </Text>
          </View>
          <Text style={styles.name}>{user?.name || t('user')}</Text>
          <Text style={styles.email}>{user?.email}</Text>
          <View style={styles.userTypeBadge}>
            <Text style={styles.userTypeText}>
              {user?.userType === 'client' && t('client_mikompa')}
              {user?.userType === 'provider' && t('provider_2kompa')}
              {user?.userType === 'admin' && t('administrator')}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.content}>
        {user?.userType === 'client' && (
          <View style={styles.walletSection}>
            <TouchableOpacity 
              style={styles.walletCard}
              onPress={() => setShowPurchaseModal(true)}
              activeOpacity={0.7}
            >
              <View style={styles.walletHeader}>
                <CreditCard size={20} color="#D81B60" />
                <Text style={styles.walletTitle}>{t('my_wallet')}</Text>
              </View>
              <Text style={styles.walletBalance}>₡{walletBalance.toLocaleString()}</Text>
              <Text style={styles.walletSubtitle}>{t('wallet_balance')}</Text>
              
              {/* Booking Passes Info */}
              <View style={styles.passesInfo}>
                <Text style={styles.passesCount}>{bookingPasses.filter(p => !p.isUsed).length} pases disponibles</Text>
                <Text style={styles.buyPassHint}>Toca para comprar pases</Text>
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.okoinsCard}
              onPress={() => setShowPlansModal(true)}
              activeOpacity={0.7}
            >
              <View style={styles.walletHeader}>
                <Star size={20} color="#FF9800" />
                <Text style={styles.okoinsTitle}>OKoins</Text>
              </View>
              <Text style={styles.okoinsBalance}>{okoins}</Text>
              <Text style={styles.okoinsSubtitle}>{t('loyalty_points')}</Text>
              
              {/* Plans Info */}
              <View style={styles.plansInfo}>
                <Package size={16} color="#FF9800" />
                <Text style={styles.plansHint}>Ver planes</Text>
              </View>
            </TouchableOpacity>
          </View>
        )}

        {user?.userType === 'provider' && (
          <View style={styles.statsCard}>
            <Text style={styles.statsTitle}>{t('statistics')}</Text>
            <View style={styles.statsRow}>
              <TouchableOpacity 
                style={styles.statItem}
                onPress={() => handleMenuPress('rating')}
              >
                <Star size={20} color="#FFD700" />
                <Text style={styles.statNumber}>4.8</Text>
                <Text style={styles.statLabel}>Calificación</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.statItem}
                onPress={() => handleMenuPress('services')}
              >
                <BarChart3 size={20} color="#2196F3" />
                <Text style={styles.statNumber}>127</Text>
                <Text style={styles.statLabel}>Servicios</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.statItem}
                onPress={() => handleMenuPress('revenue')}
              >
                <TrendingUp size={20} color="#4CAF50" />
                <Text style={styles.statNumber}>₡450K</Text>
                <Text style={styles.statLabel}>Ingresos</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={styles.menuSection}>
          {menuItems.map((item, index) => {
            const IconComponent = item.icon;
            return (
              <TouchableOpacity 
                key={index} 
                style={styles.menuItem}
                onPress={() => handleMenuPress(item.action)}
              >
                <IconComponent size={24} color="#D81B60" />
                <View style={styles.menuItemContent}>
                  <Text style={styles.menuItemTitle}>{item.title}</Text>
                  <Text style={styles.menuItemSubtitle}>{item.subtitle}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <LogOut size={20} color="#FF4444" />
          <Text style={styles.signOutText}>{t('sign_out')}</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.debugButton}
          onPress={() => router.push('/test-kompi')}
        >
          <Text style={styles.debugButtonText}>Test Kompi Brain</Text>
        </TouchableOpacity>
      </View>

      {/* Change Password Modal */}
      <Modal
        visible={showPasswordModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPasswordModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Cambiar Contraseña</Text>
              <TouchableOpacity
                onPress={() => setShowPasswordModal(false)}
                style={styles.closeButton}
              >
                <X size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <View style={styles.inputContainer}>
              <Lock size={20} color="#666" />
              <TextInput
                style={styles.input}
                placeholder="Contraseña actual"
                value={passwordData.currentPassword}
                onChangeText={(text) => setPasswordData({ ...passwordData, currentPassword: text })}
                secureTextEntry
                placeholderTextColor="#666"
              />
            </View>

            <View style={styles.inputContainer}>
              <Lock size={20} color="#666" />
              <TextInput
                style={styles.input}
                placeholder="Nueva contraseña"
                value={passwordData.newPassword}
                onChangeText={(text) => setPasswordData({ ...passwordData, newPassword: text })}
                secureTextEntry
                placeholderTextColor="#666"
              />
            </View>

            <View style={styles.inputContainer}>
              <Lock size={20} color="#666" />
              <TextInput
                style={styles.input}
                placeholder="Confirmar nueva contraseña"
                value={passwordData.confirmPassword}
                onChangeText={(text) => setPasswordData({ ...passwordData, confirmPassword: text })}
                secureTextEntry
                placeholderTextColor="#666"
              />
            </View>

            <TouchableOpacity
              style={styles.modalButton}
              onPress={handleChangePassword}
              disabled={loading}
            >
              <Text style={styles.modalButtonText}>
                {loading ? 'Cambiando...' : 'Cambiar Contraseña'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Reset Password Modal */}
      <Modal
        visible={showResetModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowResetModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Recuperar Contraseña</Text>
              <TouchableOpacity
                onPress={() => setShowResetModal(false)}
                style={styles.closeButton}
              >
                <X size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalDescription}>
              Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña.
            </Text>

            <View style={styles.inputContainer}>
              <User size={20} color="#666" />
              <TextInput
                style={styles.input}
                placeholder="Correo electrónico"
                value={resetEmail}
                onChangeText={setResetEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor="#666"
              />
            </View>

            <TouchableOpacity
              style={styles.modalButton}
              onPress={handleResetPassword}
              disabled={loading}
            >
              <Text style={styles.modalButtonText}>
                {loading ? 'Enviando...' : 'Enviar Correo'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Referral Link Modal */}
      <Modal
        visible={showReferralModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowReferralModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>¡Enlace Copiado!</Text>
              <TouchableOpacity
                onPress={() => setShowReferralModal(false)}
                style={styles.closeButton}
              >
                <X size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.referralModalContent}>
              <Check size={48} color="#10B981" style={styles.successIcon} />
              <Text style={styles.referralSuccessText}>
                Tu enlace de referido ha sido copiado al portapapeles
              </Text>
              <Text style={styles.referralInstructions}>
                Compártelo con tus amigos para que se unan a Kompa2Go y ambos reciban recompensas
              </Text>
              
              <TouchableOpacity
                style={styles.referralCloseButton}
                onPress={() => setShowReferralModal(false)}
              >
                <Text style={styles.referralCloseButtonText}>Entendido</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Logout Confirmation Modal */}
      <Modal
        visible={showLogoutModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLogoutModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('sign_out')}</Text>
              <TouchableOpacity
                onPress={() => setShowLogoutModal(false)}
                style={styles.closeButton}
              >
                <X size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.logoutModalContent}>
              <LogOut size={48} color="#FF4444" style={styles.logoutIcon} />
              <Text style={styles.logoutConfirmText}>
                {t('sign_out_confirm') || '¿Estás seguro de que quieres cerrar sesión?'}
              </Text>
              <Text style={styles.logoutWarningText}>
                Tendrás que iniciar sesión nuevamente para acceder a tu cuenta.
              </Text>
              
              <View style={styles.logoutButtonsContainer}>
                <TouchableOpacity
                  style={styles.cancelLogoutButton}
                  onPress={() => setShowLogoutModal(false)}
                >
                  <Text style={styles.cancelLogoutButtonText}>{t('cancel') || 'Cancelar'}</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.confirmLogoutButton}
                  onPress={confirmSignOut}
                >
                  <Text style={styles.confirmLogoutButtonText}>{t('sign_out') || 'Cerrar Sesión'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    backgroundColor: '#D81B60',
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  profileSection: {
    alignItems: 'center',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  email: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 12,
  },
  userTypeBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
  },
  userTypeText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  walletSection: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  walletCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  okoinsCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  walletHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  walletTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  okoinsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  walletBalance: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 4,
  },
  okoinsBalance: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FF9800',
    marginBottom: 4,
  },
  walletSubtitle: {
    fontSize: 12,
    color: '#999',
  },
  okoinsSubtitle: {
    fontSize: 12,
    color: '#999',
  },
  passesInfo: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    alignItems: 'center',
  },
  passesCount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#D81B60',
    marginBottom: 4,
  },
  buyPassHint: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
  plansInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    gap: 6,
  },
  plansHint: {
    fontSize: 12,
    color: '#FF9800',
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
    alignSelf: 'center',
  },
  plansModalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    width: '100%',
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
  statsCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#D81B60',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  menuSection: {
    backgroundColor: 'white',
    borderRadius: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    gap: 16,
  },
  menuItemContent: {
    flex: 1,
  },
  menuItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  menuItemSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    marginBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  signOutText: {
    color: '#FF4444',
    fontSize: 16,
    fontWeight: '600',
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
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 4,
    gap: 12,
    marginBottom: 16,
  },
  input: {
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
  referralModalContent: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  successIcon: {
    marginBottom: 16,
  },
  referralSuccessText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#10B981',
    textAlign: 'center',
    marginBottom: 12,
  },
  referralInstructions: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  referralCloseButton: {
    backgroundColor: '#D81B60',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
  },
  referralCloseButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  logoutModalContent: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  logoutIcon: {
    marginBottom: 16,
  },
  logoutConfirmText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 12,
  },
  logoutWarningText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  logoutButtonsContainer: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  cancelLogoutButton: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelLogoutButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  confirmLogoutButton: {
    flex: 1,
    backgroundColor: '#FF4444',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmLogoutButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  debugButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  debugButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});