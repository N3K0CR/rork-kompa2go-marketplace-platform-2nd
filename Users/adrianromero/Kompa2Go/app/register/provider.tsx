import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Switch,
  Modal,
  TouchableOpacity,
  Text,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronDown } from 'lucide-react-native';
import { AccessibleText } from '@/components/AccessibleText';
import { AccessibleButton } from '@/components/AccessibleButton';
import { AccessibleInput } from '@/components/AccessibleInput';
import { useAccessibility } from '@/contexts/AccessibilityContext';
import { useAuth } from '@/contexts/AuthContext';
import { RegistrationService } from '@/src/modules/registration/services/firestore-registration-service';
import type { ProviderRegistrationData } from '@/src/shared/types/registration-types';

export default function ProviderRegistrationScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { settings, updateSettings, speak } = useAccessibility();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [isUpgrade, setIsUpgrade] = useState(false);

  const [formData, setFormData] = useState<ProviderRegistrationData>({
    companyInfo: {
      businessName: '',
      taxId: '',
      address: '',
      city: '',
      state: '',
      country: 'Costa Rica',
    },
    contactInfo: {
      contactName: '',
      email: '',
      phone: '',
      howFoundUs: '',
    },
    serviceInfo: {
      vehicleTypes: [],
      coverageAreas: [],
      serviceNiche: '',
    },
    documents: {},
    accessibility: {
      hasDisability: false,
      ttsEnabled: false,
      ttsSpeed: 'normal',
      highContrast: false,
      largeText: false,
      voiceNavigation: false,
      autoReadMessages: false,
    },
    referralCode: '',
  });

  useEffect(() => {
    if (user && user.userType === 'client') {
      setIsUpgrade(true);
      setFormData(prev => ({
        ...prev,
        contactInfo: {
          ...prev.contactInfo,
          contactName: user.name || '',
          email: user.email || '',
          phone: user.phone || '',
        },
      }));
      console.log('[ProviderRegistration] Detected client upgrade, pre-filling data');
    }
  }, [user]);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showHowFoundUsModal, setShowHowFoundUsModal] = useState(false);

  const howFoundUsOptions = [
    'Redes Sociales (Facebook, Instagram, TikTok)',
    'Recomendación de un amigo/familiar',
    'Búsqueda en Google',
    'Publicidad en línea',
    'Publicidad en medios tradicionales (TV, Radio)',
    'Evento o feria',
    'Asociación empresarial',
    'Otro',
  ];

  const validateStep1 = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.companyInfo.businessName.trim()) {
      newErrors.businessName = 'El nombre de la empresa es requerido';
    }
    if (!formData.companyInfo.taxId.trim()) {
      newErrors.taxId = 'El RUC/NIT es requerido';
    }
    if (!formData.companyInfo.address.trim()) {
      newErrors.address = 'La dirección es requerida';
    }
    if (!formData.companyInfo.city.trim()) {
      newErrors.city = 'La ciudad es requerida';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.contactInfo.contactName.trim()) {
      newErrors.contactName = 'El nombre de contacto es requerido';
    }
    if (!formData.contactInfo.email.trim()) {
      newErrors.email = 'El email es requerido';
    } else if (!/\S+@\S+\.\S+/.test(formData.contactInfo.email)) {
      newErrors.email = 'Email inválido';
    }
    if (!formData.contactInfo.phone.trim()) {
      newErrors.phone = 'El teléfono es requerido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
      if (settings.ttsEnabled) {
        speak('Paso 2: Información de contacto');
      }
    } else if (step === 2 && validateStep2()) {
      setStep(3);
      if (settings.ttsEnabled) {
        speak('Paso 3: Servicios y accesibilidad');
      }
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSubmit = async () => {
    if (!validateStep2()) return;

    setLoading(true);
    try {
      await updateSettings(formData.accessibility!);
      
      if (isUpgrade && user) {
        await RegistrationService.upgradeClientToProvider(user.id, formData);
        
        if (settings.ttsEnabled) {
          speak('Actualización completada exitosamente. Tu cuenta de proveedor está pendiente de aprobación.');
        }

        Alert.alert(
          'Actualización Exitosa',
          'Tu cuenta ha sido actualizada a proveedor 2Kompa y está pendiente de aprobación. Podrás seguir usando tu cuenta de cliente mientras tanto.',
          [
            {
              text: 'OK',
              onPress: () => router.replace('/(tabs)'),
            },
          ]
        );
      } else {
        await RegistrationService.registerProvider(formData);
        
        if (settings.ttsEnabled) {
          speak('Registro completado exitosamente. Tu cuenta está pendiente de aprobación.');
        }

        Alert.alert(
          'Registro Exitoso',
          'Tu cuenta ha sido creada y está pendiente de aprobación',
          [
            {
              text: 'OK',
              onPress: () => router.replace('/(tabs)'),
            },
          ]
        );
      }
    } catch (error) {
      console.error('Registration error:', error);
      Alert.alert('Error', 'No se pudo completar el registro. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <View>
      <AccessibleText text="Información de la Empresa" style={styles.stepTitle} />
      
      <AccessibleInput
        label="Nombre de la Empresa"
        value={formData.companyInfo.businessName}
        onChangeText={(text) =>
          setFormData({
            ...formData,
            companyInfo: { ...formData.companyInfo, businessName: text },
          })
        }
        error={errors.businessName}
        required
      />

      <AccessibleInput
        label="RUC/NIT"
        value={formData.companyInfo.taxId}
        onChangeText={(text) =>
          setFormData({
            ...formData,
            companyInfo: { ...formData.companyInfo, taxId: text },
          })
        }
        error={errors.taxId}
        required
      />

      <AccessibleInput
        label="Dirección"
        value={formData.companyInfo.address}
        onChangeText={(text) =>
          setFormData({
            ...formData,
            companyInfo: { ...formData.companyInfo, address: text },
          })
        }
        error={errors.address}
        required
      />

      <AccessibleInput
        label="Ciudad"
        value={formData.companyInfo.city}
        onChangeText={(text) =>
          setFormData({
            ...formData,
            companyInfo: { ...formData.companyInfo, city: text },
          })
        }
        error={errors.city}
        required
      />

      <AccessibleInput
        label="Provincia"
        value={formData.companyInfo.state}
        onChangeText={(text) =>
          setFormData({
            ...formData,
            companyInfo: { ...formData.companyInfo, state: text },
          })
        }
      />
    </View>
  );

  const renderStep2 = () => (
    <View>
      <AccessibleText text="Información de Contacto" style={styles.stepTitle} />

      <AccessibleInput
        label="Nombre de Contacto"
        value={formData.contactInfo.contactName}
        onChangeText={(text) =>
          setFormData({
            ...formData,
            contactInfo: { ...formData.contactInfo, contactName: text },
          })
        }
        error={errors.contactName}
        required
        autoCapitalize="words"
      />

      <AccessibleInput
        label="Email"
        value={formData.contactInfo.email}
        onChangeText={(text) =>
          setFormData({
            ...formData,
            contactInfo: { ...formData.contactInfo, email: text },
          })
        }
        error={errors.email}
        required
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <AccessibleInput
        label="Teléfono"
        value={formData.contactInfo.phone}
        onChangeText={(text) =>
          setFormData({
            ...formData,
            contactInfo: { ...formData.contactInfo, phone: text },
          })
        }
        error={errors.phone}
        required
        keyboardType="phone-pad"
      />

      <View style={styles.inputContainer}>
        <AccessibleText text="¿Cómo nos encontraste?" style={styles.label} />
        <TouchableOpacity
          style={styles.dropdownButton}
          onPress={() => setShowHowFoundUsModal(true)}
        >
          <Text style={styles.dropdownText}>
            {formData.contactInfo.howFoundUs || 'Selecciona una opción'}
          </Text>
          <ChevronDown size={20} color="#666" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderStep3 = () => (
    <View>
      <AccessibleText text="Servicios y Accesibilidad" style={styles.stepTitle} />

      <AccessibleInput
        label="Nicho de Servicio"
        value={formData.serviceInfo.serviceNiche}
        onChangeText={(text) =>
          setFormData({
            ...formData,
            serviceInfo: { ...formData.serviceInfo, serviceNiche: text },
          })
        }
        placeholder="Ej: Transporte ejecutivo, mudanzas, etc."
      />

      <View style={styles.switchContainer}>
        <AccessibleText text="¿Tienes alguna discapacidad?" />
        <Switch
          value={formData.accessibility?.hasDisability}
          onValueChange={(value) =>
            setFormData({
              ...formData,
              accessibility: { ...formData.accessibility!, hasDisability: value },
            })
          }
        />
      </View>

      {formData.accessibility?.hasDisability && (
        <>
          <View style={styles.switchContainer}>
            <AccessibleText text="Activar lectura de texto" />
            <Switch
              value={formData.accessibility?.ttsEnabled}
              onValueChange={(value) =>
                setFormData({
                  ...formData,
                  accessibility: { ...formData.accessibility!, ttsEnabled: value },
                })
              }
            />
          </View>

          <View style={styles.switchContainer}>
            <AccessibleText text="Alto contraste" />
            <Switch
              value={formData.accessibility?.highContrast}
              onValueChange={(value) =>
                setFormData({
                  ...formData,
                  accessibility: { ...formData.accessibility!, highContrast: value },
                })
              }
            />
          </View>

          <View style={styles.switchContainer}>
            <AccessibleText text="Texto grande" />
            <Switch
              value={formData.accessibility?.largeText}
              onValueChange={(value) =>
                setFormData({
                  ...formData,
                  accessibility: { ...formData.accessibility!, largeText: value },
                })
              }
            />
          </View>
        </>
      )}

      <AccessibleInput
        label="Código de Referido (Opcional)"
        value={formData.referralCode || ''}
        onChangeText={(text) => setFormData({ ...formData, referralCode: text })}
        autoCapitalize="characters"
      />
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Stack.Screen options={{ headerShown: false }} />

      <Modal
        visible={showHowFoundUsModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowHowFoundUsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <AccessibleText text="¿Cómo nos encontraste?" style={styles.modalTitle} />
            <ScrollView style={styles.optionsList}>
              {howFoundUsOptions.map((option, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.optionItem}
                  onPress={() => {
                    setFormData({
                      ...formData,
                      contactInfo: { ...formData.contactInfo, howFoundUs: option },
                    });
                    setShowHowFoundUsModal(false);
                  }}
                >
                  <Text style={styles.optionText}>{option}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <AccessibleButton
              label="Cancelar"
              text="Cancelar"
              onPress={() => setShowHowFoundUsModal(false)}
              style={styles.modalCancelButton}
            />
          </View>
        </View>
      </Modal>
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <AccessibleText 
          text={isUpgrade ? "Conviértete en Proveedor 2Kompa" : "Registro de Proveedor"} 
          style={styles.title} 
        />
        {isUpgrade && (
          <AccessibleText 
            text="Completa la información adicional para ofrecer tus servicios" 
            style={styles.upgradeSubtitle} 
          />
        )}
        <AccessibleText text={`Paso ${step} de 3`} style={styles.subtitle} />

        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}

        <View style={styles.buttonContainer}>
          {step > 1 && (
            <AccessibleButton
              label="Atrás"
              text="Atrás"
              onPress={handleBack}
              style={[styles.button, styles.secondaryButton]}
            />
          )}
          
          {step < 3 ? (
            <AccessibleButton
              label="Siguiente"
              text="Siguiente"
              onPress={handleNext}
              style={styles.button}
            />
          ) : (
            <AccessibleButton
              label={loading ? 'Registrando...' : 'Completar Registro'}
              text={loading ? 'Registrando...' : 'Completar Registro'}
              onPress={handleSubmit}
              disabled={loading}
              style={styles.button}
            />
          )}
        </View>

        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
    color: '#000',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
  },
  upgradeSubtitle: {
    fontSize: 14,
    color: '#D81B60',
    marginBottom: 12,
    textAlign: 'center',
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 20,
    color: '#333',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
    marginBottom: 12,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  button: {
    flex: 1,
  },
  secondaryButton: {
    backgroundColor: '#6C757D',
  },
  loadingContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  dropdownButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    padding: 14,
  },
  dropdownText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '70%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
    color: '#000',
  },
  optionsList: {
    maxHeight: 400,
  },
  optionItem: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  optionText: {
    fontSize: 16,
    color: '#333',
  },
  modalCancelButton: {
    marginTop: 16,
    backgroundColor: '#6C757D',
  },
});
