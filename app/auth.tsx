import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, ScrollView, Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { User, Mail, Lock, Phone, MapPin, RefreshCw, X, Building, Globe, Navigation, ArrowLeft, ArrowRight, HelpCircle } from 'lucide-react-native';

interface Service {
  name: string;
  price: string;
  duration: string;
}

export default function AuthScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const { t } = useLanguage();
  const [userType, setUserType] = useState<'client' | 'provider'>('client');
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    phone: '',
    location: '',
    dateOfBirth: '',
    howDidYouFindUs: '',
    businessName: '',
    services: [] as Service[],
    priceListLink: '',
    requiresClientTravel: false,
    isHomeDelivery: false,
    hasDeliveryOther: false,
    deliveryOtherDescription: '',
    hasSalesRoutes: false,
    enableRealTimeTracking: false,
    socialMediaLinks: {
      facebook: '',
      instagram: '',
      website: '',
    },
    suggestedServices: [] as string[],
  });
  const [loading, setLoading] = useState(false);
  const [showRoleSwitch, setShowRoleSwitch] = useState(false);
  const [showGuidanceModal, setShowGuidanceModal] = useState(false);
  const [guidanceContent, setGuidanceContent] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [roleSwitchData, setRoleSwitchData] = useState({
    email: '',
    password: '',
    targetRole: 'client' as 'client' | 'provider',
  });
  const { signIn, signUp, switchRole, resetPassword } = useAuth();

  const totalProviderSteps = 4;

  const showGuidance = (content: string) => {
    setGuidanceContent(content);
    setShowGuidanceModal(true);
  };

  const addService = () => {
    setFormData({
      ...formData,
      services: [...formData.services, { name: '', price: '', duration: '' }]
    });
  };

  const updateService = (index: number, field: keyof Service, value: string) => {
    const updatedServices = [...formData.services];
    updatedServices[index] = { ...updatedServices[index], [field]: value };
    setFormData({ ...formData, services: updatedServices });
  };

  const removeService = (index: number) => {
    const updatedServices = formData.services.filter((_, i) => i !== index);
    setFormData({ ...formData, services: updatedServices });
  };

  const nextStep = () => {
    if (currentStep < totalProviderSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleAuth = async () => {
    if (!formData.email || !formData.password) {
      Alert.alert('Error', 'Por favor completa todos los campos requeridos');
      return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        await signIn(formData.email, formData.password);
      } else {
        await signUp(formData.email, formData.password, {
          name: formData.name,
          phone: formData.phone,
          location: formData.location,
          userType,
        });
      }
      router.replace('/(tabs)');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Ocurrió un error');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleSwitch = async () => {
    if (!roleSwitchData.email || !roleSwitchData.password) {
      Alert.alert('Error', 'Por favor completa todos los campos');
      return;
    }

    setLoading(true);
    try {
      await switchRole(roleSwitchData.email, roleSwitchData.password, roleSwitchData.targetRole);
      setShowRoleSwitch(false);
      setRoleSwitchData({ email: '', password: '', targetRole: 'client' });
      router.replace('/(tabs)');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Error al cambiar de rol');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!forgotPasswordEmail) {
      Alert.alert('Error', 'Por favor ingresa tu correo electrónico');
      return;
    }

    setLoading(true);
    try {
      await resetPassword(forgotPasswordEmail);
      Alert.alert('Éxito', 'Se ha enviado un correo de recuperación a tu email');
      setShowForgotPassword(false);
      setForgotPasswordEmail('');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Error al enviar el correo de recuperación');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={['#D81B60', '#E91E63']}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.languageSwitcherContainer}>
          <LanguageSwitcher />
        </View>
        <View style={styles.header}>
          <Text style={styles.logo}>Kompa2Go</Text>
          <Text style={styles.subtitle}>
            {isLogin ? 'Bienvenido de vuelta' : 'Únete a nuestra comunidad'}
          </Text>
        </View>

        <View style={styles.formContainer}>
          {!isLogin && (
            <View style={styles.userTypeContainer}>
              <Text style={styles.userTypeLabel}>¿Qué tipo de usuario eres?</Text>
              <View style={styles.userTypeButtons}>
                <TouchableOpacity
                  style={[
                    styles.userTypeButton,
                    userType === 'client' && styles.userTypeButtonActive,
                  ]}
                  onPress={() => {
                    setUserType('client');
                    setCurrentStep(1);
                  }}
                >
                  <Text style={[
                    styles.userTypeButtonText,
                    userType === 'client' && styles.userTypeButtonTextActive,
                  ]}>
                    Mi-Kompa (Cliente)
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.userTypeButton,
                    userType === 'provider' && styles.userTypeButtonActive,
                  ]}
                  onPress={() => {
                    setUserType('provider');
                    setCurrentStep(1);
                  }}
                >
                  <Text style={[
                    styles.userTypeButtonText,
                    userType === 'provider' && styles.userTypeButtonTextActive,
                  ]}>
                    2-Kompa (Proveedor)
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {!isLogin && userType === 'client' && (
            <View style={styles.inputContainer}>
              <User size={20} color="#666" />
              <TextInput
                style={styles.input}
                placeholder="Nombre completo"
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
                placeholderTextColor="#666"
              />
            </View>
          )}

          {!isLogin && userType === 'provider' && currentStep === 1 && (
            <>
              <View style={styles.stepHeader}>
                <Text style={styles.stepTitle}>Paso 1 de {totalProviderSteps}: Información Básica</Text>
              </View>
              <View style={styles.inputContainer}>
                <User size={20} color="#666" />
                <TextInput
                  style={styles.input}
                  placeholder="Nombre completo"
                  value={formData.name}
                  onChangeText={(text) => setFormData({ ...formData, name: text })}
                  placeholderTextColor="#666"
                />
              </View>
            </>
          )}

          {!isLogin && userType === 'provider' && currentStep === 2 && (
            <>
              <View style={styles.stepHeader}>
                <Text style={styles.stepTitle}>Paso 2 de {totalProviderSteps}: Detalles del Negocio</Text>
              </View>
              <View style={styles.inputContainer}>
                <Building size={20} color="#666" />
                <TextInput
                  style={styles.input}
                  placeholder="Nombre del negocio"
                  value={formData.businessName}
                  onChangeText={(text) => setFormData({ ...formData, businessName: text })}
                  placeholderTextColor="#666"
                />
              </View>
              
              <View style={styles.servicesSection}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Servicios que ofreces</Text>
                  <TouchableOpacity onPress={addService} style={styles.addButton}>
                    <Text style={styles.addButtonText}>+ Agregar</Text>
                  </TouchableOpacity>
                </View>
                
                {formData.services.map((service, index) => (
                  <View key={index} style={styles.serviceRow}>
                    <TextInput
                      style={[styles.input, styles.serviceInput]}
                      placeholder="Nombre del servicio"
                      value={service.name}
                      onChangeText={(text) => updateService(index, 'name', text)}
                      placeholderTextColor="#666"
                    />
                    <TextInput
                      style={[styles.input, styles.serviceInput]}
                      placeholder="Precio"
                      value={service.price}
                      onChangeText={(text) => updateService(index, 'price', text)}
                      placeholderTextColor="#666"
                    />
                    <TextInput
                      style={[styles.input, styles.serviceInput]}
                      placeholder="Duración"
                      value={service.duration}
                      onChangeText={(text) => updateService(index, 'duration', text)}
                      placeholderTextColor="#666"
                    />
                    <TouchableOpacity onPress={() => removeService(index)} style={styles.removeButton}>
                      <X size={16} color="#FF4444" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
              
              <View style={styles.inputContainer}>
                <Globe size={20} color="#666" />
                <TextInput
                  style={styles.input}
                  placeholder="Link a lista de precios pública (obligatorio)"
                  value={formData.priceListLink}
                  onChangeText={(text) => setFormData({ ...formData, priceListLink: text })}
                  placeholderTextColor="#666"
                />
              </View>
            </>
          )}

          {!isLogin && userType === 'provider' && currentStep === 3 && (
            <>
              <View style={styles.stepHeader}>
                <Text style={styles.stepTitle}>Paso 3 de {totalProviderSteps}: Logística de Servicios</Text>
              </View>
              
              <View style={styles.questionContainer}>
                <View style={styles.questionHeader}>
                  <Text style={styles.questionText}>¿Tu servicio requiere que los clientes viajen a tu ubicación?</Text>
                  <TouchableOpacity 
                    onPress={() => showGuidance('Indica si los clientes deben ir a tu local, oficina o taller para recibir el servicio.')}
                    style={styles.helpButton}
                  >
                    <HelpCircle size={16} color="#D81B60" />
                  </TouchableOpacity>
                </View>
                <View style={styles.yesNoButtons}>
                  <TouchableOpacity
                    style={[styles.yesNoButton, formData.requiresClientTravel && styles.yesNoButtonActive]}
                    onPress={() => setFormData({ ...formData, requiresClientTravel: true })}
                  >
                    <Text style={[styles.yesNoButtonText, formData.requiresClientTravel && styles.yesNoButtonTextActive]}>Sí</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.yesNoButton, !formData.requiresClientTravel && styles.yesNoButtonActive]}
                    onPress={() => setFormData({ ...formData, requiresClientTravel: false })}
                  >
                    <Text style={[styles.yesNoButtonText, !formData.requiresClientTravel && styles.yesNoButtonTextActive]}>No</Text>
                  </TouchableOpacity>
                </View>
                
                {formData.requiresClientTravel && (
                  <View style={styles.inputContainer}>
                    <Navigation size={20} color="#666" />
                    <TextInput
                      style={styles.input}
                      placeholder="Link de Waze/Google Maps"
                      value={formData.location}
                      onChangeText={(text) => setFormData({ ...formData, location: text })}
                      placeholderTextColor="#666"
                    />
                  </View>
                )}
              </View>
              
              <View style={styles.questionContainer}>
                <Text style={styles.questionText}>¿Tu servicio es a domicilio o vía mensajería privada?</Text>
                <View style={styles.deliveryOptions}>
                  <TouchableOpacity
                    style={[styles.optionButton, formData.isHomeDelivery && styles.optionButtonActive]}
                    onPress={() => setFormData({ ...formData, isHomeDelivery: true, hasDeliveryOther: false })}
                  >
                    <Text style={[styles.optionButtonText, formData.isHomeDelivery && styles.optionButtonTextActive]}>Sí</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.optionButton, !formData.isHomeDelivery && !formData.hasDeliveryOther && styles.optionButtonActive]}
                    onPress={() => setFormData({ ...formData, isHomeDelivery: false, hasDeliveryOther: false })}
                  >
                    <Text style={[styles.optionButtonText, !formData.isHomeDelivery && !formData.hasDeliveryOther && styles.optionButtonTextActive]}>No</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.optionButton, formData.hasDeliveryOther && styles.optionButtonActive]}
                    onPress={() => setFormData({ ...formData, isHomeDelivery: false, hasDeliveryOther: true })}
                  >
                    <Text style={[styles.optionButtonText, formData.hasDeliveryOther && styles.optionButtonTextActive]}>Otro</Text>
                  </TouchableOpacity>
                </View>
                
                {formData.hasDeliveryOther && (
                  <View style={styles.inputContainer}>
                    <TextInput
                      style={styles.input}
                      placeholder="Describe tu método de entrega"
                      value={formData.deliveryOtherDescription}
                      onChangeText={(text) => setFormData({ ...formData, deliveryOtherDescription: text })}
                      placeholderTextColor="#666"
                      multiline
                    />
                  </View>
                )}
              </View>
              
              <View style={styles.questionContainer}>
                <Text style={styles.questionText}>¿Trabajas adicionalmente con rutas de ventas?</Text>
                <View style={styles.yesNoButtons}>
                  <TouchableOpacity
                    style={[styles.yesNoButton, formData.hasSalesRoutes && styles.yesNoButtonActive]}
                    onPress={() => setFormData({ ...formData, hasSalesRoutes: true })}
                  >
                    <Text style={[styles.yesNoButtonText, formData.hasSalesRoutes && styles.yesNoButtonTextActive]}>Sí</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.yesNoButton, !formData.hasSalesRoutes && styles.yesNoButtonActive]}
                    onPress={() => setFormData({ ...formData, hasSalesRoutes: false, enableRealTimeTracking: false })}
                  >
                    <Text style={[styles.yesNoButtonText, !formData.hasSalesRoutes && styles.yesNoButtonTextActive]}>No</Text>
                  </TouchableOpacity>
                </View>
                
                {formData.hasSalesRoutes && (
                  <View style={styles.checkboxContainer}>
                    <TouchableOpacity
                      style={[styles.checkbox, formData.enableRealTimeTracking && styles.checkboxActive]}
                      onPress={() => setFormData({ ...formData, enableRealTimeTracking: !formData.enableRealTimeTracking })}
                    >
                      {formData.enableRealTimeTracking && <Text style={styles.checkmark}>✓</Text>}
                    </TouchableOpacity>
                    <Text style={styles.checkboxLabel}>Habilitar seguimiento en tiempo real</Text>
                  </View>
                )}
              </View>
            </>
          )}

          {!isLogin && userType === 'provider' && currentStep === 4 && (
            <>
              <View style={styles.stepHeader}>
                <Text style={styles.stepTitle}>Paso 4 de {totalProviderSteps}: Detalles Finales</Text>
              </View>
              
              <Text style={styles.sectionTitle}>Redes sociales (opcional)</Text>
              
              <View style={styles.inputContainer}>
                <Globe size={20} color="#666" />
                <TextInput
                  style={styles.input}
                  placeholder="Facebook"
                  value={formData.socialMediaLinks.facebook}
                  onChangeText={(text) => setFormData({ 
                    ...formData, 
                    socialMediaLinks: { ...formData.socialMediaLinks, facebook: text }
                  })}
                  placeholderTextColor="#666"
                />
              </View>
              
              <View style={styles.inputContainer}>
                <Globe size={20} color="#666" />
                <TextInput
                  style={styles.input}
                  placeholder="Instagram"
                  value={formData.socialMediaLinks.instagram}
                  onChangeText={(text) => setFormData({ 
                    ...formData, 
                    socialMediaLinks: { ...formData.socialMediaLinks, instagram: text }
                  })}
                  placeholderTextColor="#666"
                />
              </View>
              
              <View style={styles.inputContainer}>
                <Globe size={20} color="#666" />
                <TextInput
                  style={styles.input}
                  placeholder="Sitio web"
                  value={formData.socialMediaLinks.website}
                  onChangeText={(text) => setFormData({ 
                    ...formData, 
                    socialMediaLinks: { ...formData.socialMediaLinks, website: text }
                  })}
                  placeholderTextColor="#666"
                />
              </View>
            </>
          )}

          <View style={styles.inputContainer}>
            <Mail size={20} color="#666" />
            <TextInput
              style={styles.input}
              placeholder="Correo electrónico"
              value={formData.email}
              onChangeText={(text) => setFormData({ ...formData, email: text })}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholderTextColor="#666"
            />
          </View>

          <View style={styles.inputContainer}>
            <Lock size={20} color="#666" />
            <TextInput
              style={styles.input}
              placeholder="Contraseña"
              value={formData.password}
              onChangeText={(text) => setFormData({ ...formData, password: text })}
              secureTextEntry
              placeholderTextColor="#666"
            />
          </View>

          {!isLogin && userType === 'client' && (
            <>
              <View style={styles.inputContainer}>
                <Phone size={20} color="#666" />
                <TextInput
                  style={styles.input}
                  placeholder="Teléfono"
                  value={formData.phone}
                  onChangeText={(text) => setFormData({ ...formData, phone: text })}
                  keyboardType="phone-pad"
                  placeholderTextColor="#666"
                />
              </View>

              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Fecha de nacimiento (DD/MM/AAAA)"
                  value={formData.dateOfBirth}
                  onChangeText={(text) => setFormData({ ...formData, dateOfBirth: text })}
                  placeholderTextColor="#666"
                />
              </View>

              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="¿Cómo nos encontraste?"
                  value={formData.howDidYouFindUs}
                  onChangeText={(text) => setFormData({ ...formData, howDidYouFindUs: text })}
                  placeholderTextColor="#666"
                />
              </View>

              <View style={styles.inputContainer}>
                <MapPin size={20} color="#666" />
                <TextInput
                  style={styles.input}
                  placeholder="Provincia, Cantón, Distrito, Otros detalles..."
                  value={formData.location}
                  onChangeText={(text) => setFormData({ ...formData, location: text })}
                  placeholderTextColor="#666"
                />
                <TouchableOpacity style={styles.shareLocationButton}>
                  <Navigation size={16} color="#D81B60" />
                </TouchableOpacity>
              </View>
              
              <View style={styles.servicesSection}>
                <Text style={styles.sectionTitle}>¿Qué servicios te gustaría encontrar?</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Describe los servicios que buscas..."
                  value={formData.suggestedServices.join(', ')}
                  onChangeText={(text) => setFormData({ ...formData, suggestedServices: text.split(', ') })}
                  placeholderTextColor="#666"
                  multiline
                  numberOfLines={3}
                />
              </View>
            </>
          )}

          {!isLogin && userType === 'provider' && (currentStep === 1 || currentStep === 4) && (
            <>
              <View style={styles.inputContainer}>
                <Phone size={20} color="#666" />
                <TextInput
                  style={styles.input}
                  placeholder="Teléfono"
                  value={formData.phone}
                  onChangeText={(text) => setFormData({ ...formData, phone: text })}
                  keyboardType="phone-pad"
                  placeholderTextColor="#666"
                />
              </View>

              {currentStep === 1 && (
                <>
                  <View style={styles.inputContainer}>
                    <TextInput
                      style={styles.input}
                      placeholder="Fecha de nacimiento (DD/MM/AAAA)"
                      value={formData.dateOfBirth}
                      onChangeText={(text) => setFormData({ ...formData, dateOfBirth: text })}
                      placeholderTextColor="#666"
                    />
                  </View>

                  <View style={styles.inputContainer}>
                    <TextInput
                      style={styles.input}
                      placeholder="¿Cómo nos encontraste?"
                      value={formData.howDidYouFindUs}
                      onChangeText={(text) => setFormData({ ...formData, howDidYouFindUs: text })}
                      placeholderTextColor="#666"
                    />
                  </View>
                </>
              )}
            </>
          )}

          {!isLogin && userType === 'provider' && currentStep < totalProviderSteps && (
            <View style={styles.navigationButtons}>
              {currentStep > 1 && (
                <TouchableOpacity style={styles.prevButton} onPress={prevStep}>
                  <ArrowLeft size={20} color="#666" />
                  <Text style={styles.prevButtonText}>Anterior</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={styles.nextButton} onPress={nextStep}>
                <Text style={styles.nextButtonText}>Siguiente</Text>
                <ArrowRight size={20} color="white" />
              </TouchableOpacity>
            </View>
          )}

          {(isLogin || userType === 'client' || (userType === 'provider' && currentStep === totalProviderSteps)) && (
            <TouchableOpacity
              style={styles.authButton}
              onPress={handleAuth}
              disabled={loading}
            >
              <Text style={styles.authButtonText}>
                {loading ? 'Cargando...' : (isLogin ? 'Iniciar Sesión' : 'Crear mi cuenta')}
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.switchButton}
            onPress={() => setIsLogin(!isLogin)}
          >
            <Text style={styles.switchButtonText}>
              {isLogin ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia sesión'}
            </Text>
          </TouchableOpacity>

          {isLogin && (
            <>
              <TouchableOpacity
                style={styles.forgotPasswordButton}
                onPress={() => setShowForgotPassword(true)}
              >
                <Text style={styles.forgotPasswordText}>
                  ¿Olvidó su contraseña?
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.roleSwitchButton}
                onPress={() => setShowRoleSwitch(true)}
              >
                <RefreshCw size={16} color="#D81B60" />
                <Text style={styles.roleSwitchButtonText}>
                  Cambiar a Proveedor/Cliente
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>

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
              <Text style={styles.modalTitle}>Cambiar Rol</Text>
              <TouchableOpacity
                onPress={() => setShowRoleSwitch(false)}
                style={styles.closeButton}
              >
                <X size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalDescription}>
              Ingresa las credenciales para el rol que deseas usar:
            </Text>

            <View style={styles.roleSelectionContainer}>
              <Text style={styles.roleSelectionLabel}>Seleccionar Rol:</Text>
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
                    Mi-Kompa (Cliente)
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
                    2-Kompa (Proveedor)
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.modalInputContainer}>
              <Mail size={20} color="#666" />
              <TextInput
                style={styles.modalInput}
                placeholder="Correo electrónico"
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
                placeholder="Contraseña"
                value={roleSwitchData.password}
                onChangeText={(text) => setRoleSwitchData({ ...roleSwitchData, password: text })}
                secureTextEntry
                placeholderTextColor="#666"
              />
            </View>

            <TouchableOpacity
              style={styles.modalButton}
              onPress={handleRoleSwitch}
              disabled={loading}
            >
              <Text style={styles.modalButtonText}>
                {loading ? 'Cambiando...' : 'Cambiar Rol'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Forgot Password Modal */}
      <Modal
        visible={showForgotPassword}
        transparent
        animationType="slide"
        onRequestClose={() => setShowForgotPassword(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Recuperar Contraseña</Text>
              <TouchableOpacity
                onPress={() => setShowForgotPassword(false)}
                style={styles.closeButton}
              >
                <X size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalDescription}>
              Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña.
            </Text>

            <View style={styles.modalInputContainer}>
              <Mail size={20} color="#666" />
              <TextInput
                style={styles.modalInput}
                placeholder="Correo electrónico"
                value={forgotPasswordEmail}
                onChangeText={setForgotPasswordEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor="#666"
              />
            </View>

            <TouchableOpacity
              style={styles.modalButton}
              onPress={handleForgotPassword}
              disabled={loading}
            >
              <Text style={styles.modalButtonText}>
                {loading ? 'Enviando...' : 'Enviar Correo'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Guidance Modal */}
      <Modal
        visible={showGuidanceModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowGuidanceModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.guidanceModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Ayuda</Text>
              <TouchableOpacity
                onPress={() => setShowGuidanceModal(false)}
                style={styles.closeButton}
              >
                <X size={24} color="#666" />
              </TouchableOpacity>
            </View>
            <Text style={styles.guidanceText}>{guidanceContent}</Text>
            <TouchableOpacity
              style={styles.guidanceButton}
              onPress={() => setShowGuidanceModal(false)}
            >
              <Text style={styles.guidanceButtonText}>Entendido</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  languageSwitcherContainer: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    fontSize: 36,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  formContainer: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    gap: 16,
  },
  userTypeContainer: {
    marginBottom: 8,
  },
  userTypeLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  userTypeButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  userTypeButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D81B60',
    alignItems: 'center',
  },
  userTypeButtonActive: {
    backgroundColor: '#D81B60',
  },
  userTypeButtonText: {
    color: '#D81B60',
    fontWeight: '600',
    fontSize: 12,
  },
  userTypeButtonTextActive: {
    color: 'white',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 4,
    gap: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
  },
  authButton: {
    backgroundColor: '#D81B60',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  authButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  switchButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  switchButtonText: {
    color: '#666',
    fontSize: 14,
  },
  roleSwitchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    marginTop: 8,
  },
  roleSwitchButtonText: {
    color: '#D81B60',
    fontSize: 14,
    fontWeight: '600',
  },
  forgotPasswordButton: {
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: 8,
  },
  forgotPasswordText: {
    color: '#D81B60',
    fontSize: 14,
    fontWeight: '600',
    textDecorationLine: 'underline',
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
  stepHeader: {
    marginBottom: 16,
    alignItems: 'center',
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#D81B60',
    textAlign: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  addButton: {
    backgroundColor: '#D81B60',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  addButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  servicesSection: {
    marginBottom: 16,
  },
  serviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  serviceInput: {
    flex: 1,
    marginBottom: 0,
  },
  removeButton: {
    padding: 8,
  },
  questionContainer: {
    marginBottom: 20,
  },
  questionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  questionText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  helpButton: {
    padding: 4,
    marginLeft: 8,
  },
  yesNoButtons: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  yesNoButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D81B60',
    alignItems: 'center',
  },
  yesNoButtonActive: {
    backgroundColor: '#D81B60',
  },
  yesNoButtonText: {
    color: '#D81B60',
    fontWeight: '600',
  },
  yesNoButtonTextActive: {
    color: 'white',
  },
  deliveryOptions: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  optionButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D81B60',
    alignItems: 'center',
  },
  optionButtonActive: {
    backgroundColor: '#D81B60',
  },
  optionButtonText: {
    color: '#D81B60',
    fontWeight: '600',
    fontSize: 12,
  },
  optionButtonTextActive: {
    color: 'white',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#D81B60',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  checkboxActive: {
    backgroundColor: '#D81B60',
  },
  checkmark: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  checkboxLabel: {
    fontSize: 14,
    color: '#333',
  },
  navigationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  prevButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#666',
    gap: 8,
  },
  prevButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D81B60',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  nextButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  shareLocationButton: {
    padding: 8,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  guidanceModal: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    width: '90%',
    maxWidth: 350,
  },
  guidanceText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 16,
  },
  guidanceButton: {
    backgroundColor: '#D81B60',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  guidanceButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});