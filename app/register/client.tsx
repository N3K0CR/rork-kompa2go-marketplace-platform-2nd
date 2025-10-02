import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, Eye, EyeOff, Check } from 'lucide-react-native';
import { ClientRegistrationSchema, ClientRegistrationType } from '@/src/shared/types/registration-types';
import { useAccessibility } from '@/contexts/AccessibilityContext';
import * as Speech from 'expo-speech';

export default function ClientRegistrationScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { preferences } = useAccessibility();

  const [step, setStep] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState<Partial<ClientRegistrationType>>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    address: '',
    city: '',
    province: '',
    preferredPaymentMethod: 'card',
    notificationPreferences: {
      email: true,
      sms: true,
      push: true,
    },
    accessibilityNeeds: {
      hasVisualImpairment: false,
      hasReadingDifficulty: false,
      hasHearingImpairment: false,
      hasMotorImpairment: false,
      other: '',
    },
    accessibilityPreferences: {
      enableTTS: preferences?.ttsEnabled || false,
      ttsSpeed: preferences?.ttsSpeed || 'normal',
      preferTextOnly: false,
      detailLevel: preferences?.descriptionLevel || 'intermediate',
      navigationMode: preferences?.navigationMode || 'combined',
    },
    referralCode: '',
  });

  const speakText = (text: string) => {
    if (preferences?.ttsEnabled && Platform.OS !== 'web') {
      Speech.speak(text, {
        language: 'es-ES',
        rate: preferences.ttsSpeed === 'slow' ? 0.75 : preferences.ttsSpeed === 'fast' ? 1.25 : 1.0,
      });
    }
  };

  const updateField = (field: keyof ClientRegistrationType, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateStep = (currentStep: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (currentStep === 1) {
      if (!formData.firstName || formData.firstName.length < 2) {
        newErrors.firstName = 'El nombre debe tener al menos 2 caracteres';
      }
      if (!formData.lastName || formData.lastName.length < 2) {
        newErrors.lastName = 'El apellido debe tener al menos 2 caracteres';
      }
      if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = 'Email inválido';
      }
      if (!formData.phone || formData.phone.length < 8) {
        newErrors.phone = 'Teléfono debe tener al menos 8 dígitos';
      }
    }

    if (currentStep === 2) {
      if (!formData.password || formData.password.length < 8) {
        newErrors.password = 'La contraseña debe tener al menos 8 caracteres';
      }
      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Las contraseñas no coinciden';
      }
    }

    if (currentStep === 3) {
      if (!formData.address || formData.address.length < 5) {
        newErrors.address = 'La dirección debe tener al menos 5 caracteres';
      }
      if (!formData.city || formData.city.length < 2) {
        newErrors.city = 'La ciudad es requerida';
      }
      if (!formData.province || formData.province.length < 2) {
        newErrors.province = 'La provincia es requerida';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      if (step < 5) {
        setStep(step + 1);
        speakText(`Paso ${step + 1} de 5`);
      } else {
        handleSubmit();
      }
    } else {
      const errorMessage = Object.values(errors).join('. ');
      speakText(`Errores en el formulario: ${errorMessage}`);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
      speakText(`Paso ${step - 1} de 5`);
    } else {
      router.back();
    }
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      speakText('Procesando registro');

      const validatedData = ClientRegistrationSchema.parse(formData);

      console.log('Client registration data:', validatedData);

      await new Promise((resolve) => setTimeout(resolve, 2000));

      speakText('Registro completado exitosamente');
      Alert.alert(
        'Registro Exitoso',
        'Tu cuenta ha sido creada. Bienvenido a MiKompa!',
        [
          {
            text: 'OK',
            onPress: () => router.replace('/(tabs)'),
          },
        ]
      );
    } catch (error: any) {
      console.error('Registration error:', error);
      const errorMessage = error.errors?.[0]?.message || 'Error al registrar. Intenta nuevamente.';
      speakText(errorMessage);
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle} onPress={() => speakText('Información Personal')}>
        Información Personal
      </Text>

      <View style={styles.inputGroup}>
        <Text style={styles.label} onPress={() => speakText('Nombre')}>
          Nombre *
        </Text>
        <TextInput
          style={[styles.input, errors.firstName && styles.inputError]}
          value={formData.firstName}
          onChangeText={(value) => updateField('firstName', value)}
          placeholder="Ingresa tu nombre"
          placeholderTextColor="#999"
          accessibilityLabel="Campo de nombre"
          accessibilityHint="Ingresa tu nombre"
        />
        {errors.firstName && (
          <Text style={styles.errorText} onPress={() => speakText(errors.firstName)}>
            {errors.firstName}
          </Text>
        )}
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label} onPress={() => speakText('Apellido')}>
          Apellido *
        </Text>
        <TextInput
          style={[styles.input, errors.lastName && styles.inputError]}
          value={formData.lastName}
          onChangeText={(value) => updateField('lastName', value)}
          placeholder="Ingresa tu apellido"
          placeholderTextColor="#999"
          accessibilityLabel="Campo de apellido"
          accessibilityHint="Ingresa tu apellido"
        />
        {errors.lastName && (
          <Text style={styles.errorText} onPress={() => speakText(errors.lastName)}>
            {errors.lastName}
          </Text>
        )}
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label} onPress={() => speakText('Correo Electrónico')}>
          Correo Electrónico *
        </Text>
        <TextInput
          style={[styles.input, errors.email && styles.inputError]}
          value={formData.email}
          onChangeText={(value) => updateField('email', value)}
          placeholder="correo@ejemplo.com"
          placeholderTextColor="#999"
          keyboardType="email-address"
          autoCapitalize="none"
          accessibilityLabel="Campo de correo electrónico"
          accessibilityHint="Ingresa tu correo electrónico"
        />
        {errors.email && (
          <Text style={styles.errorText} onPress={() => speakText(errors.email)}>
            {errors.email}
          </Text>
        )}
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label} onPress={() => speakText('Teléfono')}>
          Teléfono *
        </Text>
        <TextInput
          style={[styles.input, errors.phone && styles.inputError]}
          value={formData.phone}
          onChangeText={(value) => updateField('phone', value)}
          placeholder="8888-8888"
          placeholderTextColor="#999"
          keyboardType="phone-pad"
          accessibilityLabel="Campo de teléfono"
          accessibilityHint="Ingresa tu número de teléfono"
        />
        {errors.phone && (
          <Text style={styles.errorText} onPress={() => speakText(errors.phone)}>
            {errors.phone}
          </Text>
        )}
      </View>
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle} onPress={() => speakText('Seguridad')}>
        Seguridad
      </Text>

      <View style={styles.inputGroup}>
        <Text style={styles.label} onPress={() => speakText('Contraseña')}>
          Contraseña *
        </Text>
        <View style={styles.passwordContainer}>
          <TextInput
            style={[styles.passwordInput, errors.password && styles.inputError]}
            value={formData.password}
            onChangeText={(value) => updateField('password', value)}
            placeholder="Mínimo 8 caracteres"
            placeholderTextColor="#999"
            secureTextEntry={!showPassword}
            accessibilityLabel="Campo de contraseña"
            accessibilityHint="Ingresa tu contraseña"
          />
          <TouchableOpacity
            style={styles.eyeIcon}
            onPress={() => setShowPassword(!showPassword)}
            accessibilityLabel={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          >
            {showPassword ? (
              <EyeOff size={20} color="#666" />
            ) : (
              <Eye size={20} color="#666" />
            )}
          </TouchableOpacity>
        </View>
        {errors.password && (
          <Text style={styles.errorText} onPress={() => speakText(errors.password)}>
            {errors.password}
          </Text>
        )}
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label} onPress={() => speakText('Confirmar Contraseña')}>
          Confirmar Contraseña *
        </Text>
        <View style={styles.passwordContainer}>
          <TextInput
            style={[styles.passwordInput, errors.confirmPassword && styles.inputError]}
            value={formData.confirmPassword}
            onChangeText={(value) => updateField('confirmPassword', value)}
            placeholder="Repite tu contraseña"
            placeholderTextColor="#999"
            secureTextEntry={!showConfirmPassword}
            accessibilityLabel="Campo de confirmar contraseña"
            accessibilityHint="Confirma tu contraseña"
          />
          <TouchableOpacity
            style={styles.eyeIcon}
            onPress={() => setShowConfirmPassword(!showConfirmPassword)}
            accessibilityLabel={showConfirmPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          >
            {showConfirmPassword ? (
              <EyeOff size={20} color="#666" />
            ) : (
              <Eye size={20} color="#666" />
            )}
          </TouchableOpacity>
        </View>
        {errors.confirmPassword && (
          <Text style={styles.errorText} onPress={() => speakText(errors.confirmPassword)}>
            {errors.confirmPassword}
          </Text>
        )}
      </View>
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle} onPress={() => speakText('Dirección')}>
        Dirección
      </Text>

      <View style={styles.inputGroup}>
        <Text style={styles.label} onPress={() => speakText('Dirección Principal')}>
          Dirección Principal *
        </Text>
        <TextInput
          style={[styles.input, styles.textArea, errors.address && styles.inputError]}
          value={formData.address}
          onChangeText={(value) => updateField('address', value)}
          placeholder="Calle, número, detalles"
          placeholderTextColor="#999"
          multiline
          numberOfLines={3}
          accessibilityLabel="Campo de dirección"
          accessibilityHint="Ingresa tu dirección completa"
        />
        {errors.address && (
          <Text style={styles.errorText} onPress={() => speakText(errors.address)}>
            {errors.address}
          </Text>
        )}
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label} onPress={() => speakText('Ciudad')}>
          Ciudad *
        </Text>
        <TextInput
          style={[styles.input, errors.city && styles.inputError]}
          value={formData.city}
          onChangeText={(value) => updateField('city', value)}
          placeholder="Ej: San José"
          placeholderTextColor="#999"
          accessibilityLabel="Campo de ciudad"
          accessibilityHint="Ingresa tu ciudad"
        />
        {errors.city && (
          <Text style={styles.errorText} onPress={() => speakText(errors.city)}>
            {errors.city}
          </Text>
        )}
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label} onPress={() => speakText('Provincia')}>
          Provincia *
        </Text>
        <TextInput
          style={[styles.input, errors.province && styles.inputError]}
          value={formData.province}
          onChangeText={(value) => updateField('province', value)}
          placeholder="Ej: San José"
          placeholderTextColor="#999"
          accessibilityLabel="Campo de provincia"
          accessibilityHint="Ingresa tu provincia"
        />
        {errors.province && (
          <Text style={styles.errorText} onPress={() => speakText(errors.province)}>
            {errors.province}
          </Text>
        )}
      </View>
    </View>
  );

  const renderStep4 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle} onPress={() => speakText('Preferencias')}>
        Preferencias
      </Text>

      <View style={styles.inputGroup}>
        <Text style={styles.label} onPress={() => speakText('Método de Pago Preferido')}>
          Método de Pago Preferido
        </Text>
        <View style={styles.radioGroup}>
          {[
            { value: 'card', label: 'Tarjeta' },
            { value: 'cash', label: 'Efectivo' },
            { value: 'transfer', label: 'Transferencia' },
          ].map((option) => (
            <TouchableOpacity
              key={option.value}
              style={styles.radioOption}
              onPress={() => updateField('preferredPaymentMethod', option.value)}
              accessibilityLabel={`Método de pago: ${option.label}`}
              accessibilityRole="radio"
              accessibilityState={{ checked: formData.preferredPaymentMethod === option.value }}
            >
              <View style={styles.radioCircle}>
                {formData.preferredPaymentMethod === option.value && (
                  <View style={styles.radioSelected} />
                )}
              </View>
              <Text
                style={styles.radioLabel}
                onPress={() => speakText(option.label)}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label} onPress={() => speakText('Notificaciones')}>
          Notificaciones
        </Text>
        {[
          { key: 'email', label: 'Email' },
          { key: 'sms', label: 'SMS' },
          { key: 'push', label: 'Push' },
        ].map((option) => (
          <TouchableOpacity
            key={option.key}
            style={styles.checkboxOption}
            onPress={() =>
              setFormData((prev) => ({
                ...prev,
                notificationPreferences: {
                  ...prev.notificationPreferences!,
                  [option.key]: !prev.notificationPreferences![option.key as keyof typeof prev.notificationPreferences],
                },
              }))
            }
            accessibilityLabel={`Notificación por ${option.label}`}
            accessibilityRole="checkbox"
            accessibilityState={{
              checked: formData.notificationPreferences?.[option.key as keyof typeof formData.notificationPreferences] || false,
            }}
          >
            <View style={styles.checkbox}>
              {formData.notificationPreferences?.[option.key as keyof typeof formData.notificationPreferences] && (
                <Check size={16} color="#fff" />
              )}
            </View>
            <Text style={styles.checkboxLabel} onPress={() => speakText(option.label)}>
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderStep5 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle} onPress={() => speakText('Accesibilidad y Referidos')}>
        Accesibilidad y Referidos
      </Text>

      <View style={styles.inputGroup}>
        <Text style={styles.label} onPress={() => speakText('Necesidades de Accesibilidad')}>
          Necesidades de Accesibilidad
        </Text>
        {[
          { key: 'hasVisualImpairment', label: 'Discapacidad Visual' },
          { key: 'hasReadingDifficulty', label: 'Dificultad de Lectura' },
          { key: 'hasHearingImpairment', label: 'Discapacidad Auditiva' },
          { key: 'hasMotorImpairment', label: 'Discapacidad Motriz' },
        ].map((option) => (
          <TouchableOpacity
            key={option.key}
            style={styles.checkboxOption}
            onPress={() =>
              setFormData((prev) => ({
                ...prev,
                accessibilityNeeds: {
                  ...prev.accessibilityNeeds!,
                  [option.key]: !prev.accessibilityNeeds![option.key as keyof typeof prev.accessibilityNeeds],
                },
              }))
            }
            accessibilityLabel={option.label}
            accessibilityRole="checkbox"
            accessibilityState={{
              checked: (formData.accessibilityNeeds?.[option.key as keyof typeof formData.accessibilityNeeds] as boolean) || false,
            }}
          >
            <View style={styles.checkbox}>
              {formData.accessibilityNeeds?.[option.key as keyof typeof formData.accessibilityNeeds] && (
                <Check size={16} color="#fff" />
              )}
            </View>
            <Text style={styles.checkboxLabel} onPress={() => speakText(option.label)}>
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label} onPress={() => speakText('Código de Referido (Opcional)')}>
          Código de Referido (Opcional)
        </Text>
        <TextInput
          style={styles.input}
          value={formData.referralCode}
          onChangeText={(value) => updateField('referralCode', value)}
          placeholder="Ingresa el código si tienes uno"
          placeholderTextColor="#999"
          autoCapitalize="characters"
          accessibilityLabel="Campo de código de referido"
          accessibilityHint="Ingresa el código de referido si tienes uno"
        />
        <Text style={styles.helperText} onPress={() => speakText('Gana 10,000 colones al completar 25 viajes')}>
          Gana ₡10,000 al completar 25 viajes
        </Text>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.header}>
        <TouchableOpacity
          onPress={handleBack}
          style={styles.backButton}
          accessibilityLabel="Volver"
          accessibilityRole="button"
        >
          <ChevronLeft size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} onPress={() => speakText('Registro de Cliente')}>
          Registro de Cliente
        </Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${(step / 5) * 100}%` }]} />
        </View>
        <Text style={styles.progressText} onPress={() => speakText(`Paso ${step} de 5`)}>
          Paso {step} de 5
        </Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
        {step === 4 && renderStep4()}
        {step === 5 && renderStep5()}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity
          style={[styles.button, styles.buttonPrimary]}
          onPress={handleNext}
          disabled={loading}
          accessibilityLabel={step === 5 ? 'Registrarse' : 'Siguiente'}
          accessibilityRole="button"
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>
              {step === 5 ? 'Registrarse' : 'Siguiente'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#333',
  },
  placeholder: {
    width: 40,
  },
  progressContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#fff',
  },
  progressBar: {
    height: 6,
    backgroundColor: '#e0e0e0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 3,
  },
  progressText: {
    marginTop: 8,
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  stepContainer: {
    gap: 20,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#333',
    marginBottom: 8,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#333',
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
  },
  inputError: {
    borderColor: '#f44336',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  passwordContainer: {
    position: 'relative',
  },
  passwordInput: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    paddingRight: 48,
    fontSize: 16,
    color: '#333',
  },
  eyeIcon: {
    position: 'absolute',
    right: 12,
    top: 12,
    padding: 4,
  },
  errorText: {
    fontSize: 14,
    color: '#f44336',
  },
  helperText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic' as const,
  },
  radioGroup: {
    gap: 12,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  radioCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#4CAF50',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4CAF50',
  },
  radioLabel: {
    fontSize: 16,
    color: '#333',
  },
  checkboxOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#4CAF50',
    backgroundColor: '#4CAF50',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxLabel: {
    fontSize: 16,
    color: '#333',
  },
  footer: {
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  button: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPrimary: {
    backgroundColor: '#4CAF50',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#fff',
  },
});
