import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Switch,
  Platform,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AccessibleText } from '@/components/AccessibleText';
import { AccessibleButton } from '@/components/AccessibleButton';
import { AccessibleInput } from '@/components/AccessibleInput';
import { useAccessibility } from '@/contexts/AccessibilityContext';
import { RegistrationService } from '@/src/modules/registration/services/firestore-registration-service';
import { ClientRegistrationData } from '@/src/shared/types/registration-types';

export default function ClientRegistrationScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { settings, updateSettings, speak } = useAccessibility();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);

  const [formData, setFormData] = useState<ClientRegistrationData>({
    personalInfo: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      cedula: '',
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
      
      const userId = await RegistrationService.registerClient(formData);
      
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
      <AccessibleText style={styles.stepTitle}>Información Personal</AccessibleText>
      
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
    </View>
  );

  const renderStep2 = () => (
    <View>
      <AccessibleText style={styles.stepTitle}>Dirección</AccessibleText>

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
      <AccessibleText style={styles.stepTitle}>Preferencias y Accesibilidad</AccessibleText>

      <View style={styles.switchContainer}>
        <AccessibleText>¿Tienes alguna discapacidad?</AccessibleText>
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
            <AccessibleText>Activar lectura de texto</AccessibleText>
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
            <AccessibleText>Alto contraste</AccessibleText>
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
            <AccessibleText>Texto grande</AccessibleText>
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
            <AccessibleText>Navegación por voz</AccessibleText>
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
        value={formData.referralCode}
        onChangeText={(text) => setFormData({ ...formData, referralCode: text })}
        autoCapitalize="characters"
      />
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Stack.Screen options={{ headerShown: false }} />
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <AccessibleText style={styles.title}>Registro de Cliente</AccessibleText>
        <AccessibleText style={styles.subtitle}>Paso {step} de 3</AccessibleText>

        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}

        <View style={styles.buttonContainer}>
          {step > 1 && (
            <AccessibleButton
              title="Atrás"
              onPress={handleBack}
              style={[styles.button, styles.secondaryButton]}
            />
          )}
          
          {step < 3 ? (
            <AccessibleButton
              title="Siguiente"
              onPress={handleNext}
              style={styles.button}
            />
          ) : (
            <AccessibleButton
              title={loading ? 'Registrando...' : 'Completar Registro'}
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
});
