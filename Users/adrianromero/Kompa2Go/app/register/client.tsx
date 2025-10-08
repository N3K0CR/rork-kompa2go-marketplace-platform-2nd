import React, { useState } from 'react';
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
import { DatePicker } from '@/components/DatePicker';
import { TermsAcceptance } from '@/components/TermsAcceptance';
import { useAccessibility } from '@/contexts/AccessibilityContext';
import RegistrationService from '@/src/modules/registration/services/firestore-registration-service';
import type { ClientRegistrationData } from '@/src/shared/types/registration-types';

export default function ClientRegistrationScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { settings, updateSettings, speak } = useAccessibility();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(0);
  const [termsAccepted, setTermsAccepted] = useState(false);

  const [formData, setFormData] = useState<ClientRegistrationData>({
    personalInfo: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      cedula: '',
      dateOfBirth: '',
      howFoundUs: '',
    },
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'Costa Rica',
    },
    preferences: {
      paymentMethod: 'card',
      notifications: {
        email: true,
        sms: true,
        push: true,
      },
    },
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

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showHowFoundUsModal, setShowHowFoundUsModal] = useState(false);

  const howFoundUsOptions = [
    'Redes Sociales (Facebook, Instagram, TikTok)',
    'Recomendación de un amigo/familiar',
    'Búsqueda en Google',
    'Publicidad en línea',
    'Publicidad en medios tradicionales (TV, Radio)',
    'Evento o feria',
    'Otro',
  ];

  const validateStep1 = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.personalInfo.firstName.trim()) {
      newErrors.firstName = 'El nombre es requerido';
    }
    if (!formData.personalInfo.lastName.trim()) {
      newErrors.lastName = 'El apellido es requerido';
    }
    if (!formData.personalInfo.email.trim()) {
      newErrors.email = 'El email es requerido';
    } else if (!/\S+@\S+\.\S+/.test(formData.personalInfo.email)) {
      newErrors.email = 'Email inválido';
    }
    if (!formData.personalInfo.phone.trim()) {
      newErrors.phone = 'El teléfono es requerido';
    }
    if (!formData.personalInfo.cedula.trim()) {
      newErrors.cedula = 'La cédula es requerida';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.address.street.trim()) {
      newErrors.street = 'La dirección es requerida';
    }
    if (!formData.address.city.trim()) {
      newErrors.city = 'La ciudad es requerida';
    }
    if (!formData.address.state.trim()) {
      newErrors.state = 'La provincia es requerida';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleTermsAccept = () => {
    setTermsAccepted(true);
    setStep(1);
    if (settings.ttsEnabled) {
      speak('Paso 1: Información personal');
    }
  };

  const handleTermsDecline = () => {
    Alert.alert(
      'Registro Cancelado',
      'Debes aceptar los términos y condiciones para continuar con el registro.',
      [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]
    );
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
      if (settings.ttsEnabled) {
        speak('Paso 2: Información de dirección');
      }
    } else if (step === 2 && validateStep2()) {
      setStep(3);
      if (settings.ttsEnabled) {
        speak('Paso 3: Preferencias y accesibilidad');
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
      
      await RegistrationService.registerClient(formData);
      
      if (settings.ttsEnabled) {
        speak('Registro completado exitosamente');
      }

      Alert.alert(
        'Registro Exitoso',
        'Tu cuenta ha sido creada correctamente',
        [
          {
            text: 'OK',
            onPress: () => router.replace('/(tabs)'),
          },
        ]
      );
    } catch (error) {
      console.error('Registration error:', error);
      Alert.alert('Error', 'No se pudo completar el registro. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <View>
      <AccessibleText text="Información Personal" style={styles.stepTitle} />
      
      <AccessibleInput
        label="Nombre"
        value={formData.personalInfo.firstName}
        onChangeText={(text) =>
          setFormData({
            ...formData,
            personalInfo: { ...formData.personalInfo, firstName: text },
          })
        }
        error={errors.firstName}
        required
        autoCapitalize="words"
      />

      <AccessibleInput
        label="Apellido"
        value={formData.personalInfo.lastName}
        onChangeText={(text) =>
          setFormData({
            ...formData,
            personalInfo: { ...formData.personalInfo, lastName: text },
          })
        }
        error={errors.lastName}
        required
        autoCapitalize="words"
      />

      <AccessibleInput
        label="Email"
        value={formData.personalInfo.email}
        onChangeText={(text) =>
          setFormData({
            ...formData,
            personalInfo: { ...formData.personalInfo, email: text },
          })
        }
        error={errors.email}
        required
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <AccessibleInput
        label="Teléfono"
        value={formData.personalInfo.phone}
        onChangeText={(text) =>
          setFormData({
            ...formData,
            personalInfo: { ...formData.personalInfo, phone: text },
          })
        }
        error={errors.phone}
        required
        keyboardType="phone-pad"
      />

      <AccessibleInput
        label="Cédula"
        value={formData.personalInfo.cedula}
        onChangeText={(text) =>
          setFormData({
            ...formData,
            personalInfo: { ...formData.personalInfo, cedula: text },
          })
        }
        error={errors.cedula}
        required
      />

      <DatePicker
        label="Fecha de Nacimiento"
        value={formData.personalInfo.dateOfBirth || ''}
        onDateChange={(date) =>
          setFormData({
            ...formData,
            personalInfo: { ...formData.personalInfo, dateOfBirth: date },
          })
        }
        minAge={18}
        maxAge={100}
      />

      <View style={styles.inputContainer}>
        <AccessibleText text="¿Cómo nos encontraste?" style={styles.label} />
        <TouchableOpacity
          style={styles.dropdownButton}
          onPress={() => setShowHowFoundUsModal(true)}
        >
          <Text style={styles.dropdownText}>
            {formData.personalInfo.howFoundUs || 'Selecciona una opción'}
          </Text>
          <ChevronDown size={20} color="#666" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderStep2 = () => (
    <View>
      <AccessibleText text="Dirección" style={styles.stepTitle} />

      <AccessibleInput
        label="Dirección"
        value={formData.address.street}
        onChangeText={(text) =>
          setFormData({
            ...formData,
            address: { ...formData.address, street: text },
          })
        }
        error={errors.street}
        required
      />

      <AccessibleInput
        label="Ciudad"
        value={formData.address.city}
        onChangeText={(text) =>
          setFormData({
            ...formData,
            address: { ...formData.address, city: text },
          })
        }
        error={errors.city}
        required
      />

      <AccessibleInput
        label="Provincia"
        value={formData.address.state}
        onChangeText={(text) =>
          setFormData({
            ...formData,
            address: { ...formData.address, state: text },
          })
        }
        error={errors.state}
        required
      />

      <AccessibleInput
        label="Código Postal"
        value={formData.address.zipCode}
        onChangeText={(text) =>
          setFormData({
            ...formData,
            address: { ...formData.address, zipCode: text },
          })
        }
        keyboardType="numeric"
      />
    </View>
  );

  const renderStep3 = () => (
    <View>
      <AccessibleText text="Preferencias y Accesibilidad" style={styles.stepTitle} />

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

          <View style={styles.switchContainer}>
            <AccessibleText text="Navegación por voz" />
            <Switch
              value={formData.accessibility?.voiceNavigation}
              onValueChange={(value) =>
                setFormData({
                  ...formData,
                  accessibility: { ...formData.accessibility!, voiceNavigation: value },
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
                      personalInfo: { ...formData.personalInfo, howFoundUs: option },
                    });
                    setShowHowFoundUsModal(false);
                  }}
                >
                  <Text style={styles.optionText}>{option}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <AccessibleButton
              text="Cancelar"
              label="Cancelar"
              onPress={() => setShowHowFoundUsModal(false)}
              style={styles.modalCancelButton}
            />
          </View>
        </View>
      </Modal>
      
      {step === 0 ? (
        <TermsAcceptance 
          onAccept={handleTermsAccept}
          onDecline={handleTermsDecline}
        />
      ) : (
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
          <AccessibleText text="Registro de Cliente" style={styles.title} />
          <AccessibleText text={`Paso ${step} de 3`} style={styles.subtitle} />

          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}

        <View style={styles.buttonContainer}>
          {step > 1 && (
            <AccessibleButton
              text="Atrás"
              label="Atrás"
              onPress={handleBack}
              style={[styles.button, styles.secondaryButton]}
            />
          )}
          
          {step < 3 ? (
            <AccessibleButton
              text="Siguiente"
              label="Siguiente"
              onPress={handleNext}
              style={styles.button}
            />
          ) : (
            <AccessibleButton
              text={loading ? 'Registrando...' : 'Completar Registro'}
              label={loading ? 'Registrando...' : 'Completar Registro'}
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
      )}
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
