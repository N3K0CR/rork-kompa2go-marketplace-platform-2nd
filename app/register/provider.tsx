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
import { ProviderRegistrationSchema, ProviderRegistrationType } from '@/src/shared/types/registration-types';
import { useAccessibility } from '@/contexts/AccessibilityContext';
import * as Speech from 'expo-speech';

const SERVICE_TYPES = ['Transporte', 'Delivery', 'Mudanza', 'Mensajería', 'Otro'];
const VEHICLE_TYPES = ['Sedan', 'SUV', 'Van', 'Camión', 'Motocicleta'];
const COVERAGE_AREAS = ['San José', 'Alajuela', 'Cartago', 'Heredia', 'Guanacaste', 'Puntarenas', 'Limón'];

export default function ProviderRegistrationScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { preferences } = useAccessibility();

  const [step, setStep] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState<Partial<ProviderRegistrationType>>({
    companyName: '',
    businessId: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    contactPersonName: '',
    contactPersonEmail: '',
    contactPersonPhone: '',
    businessAddress: '',
    city: '',
    province: '',
    serviceTypes: [],
    vehicleTypes: [],
    coverageAreas: [],
    businessLicense: '',
    taxDocument: '',
    insuranceDocument: '',
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

  const updateField = (field: keyof ProviderRegistrationType, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const toggleArrayItem = (field: 'serviceTypes' | 'vehicleTypes' | 'coverageAreas', item: string) => {
    setFormData((prev) => {
      const currentArray = prev[field] || [];
      const newArray = currentArray.includes(item)
        ? currentArray.filter((i) => i !== item)
        : [...currentArray, item];
      return { ...prev, [field]: newArray };
    });
  };

  const validateStep = (currentStep: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (currentStep === 1) {
      if (!formData.companyName || formData.companyName.length < 3) {
        newErrors.companyName = 'El nombre de la empresa debe tener al menos 3 caracteres';
      }
      if (!formData.businessId || formData.businessId.length < 5) {
        newErrors.businessId = 'RUC/NIT es requerido';
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
      if (!formData.contactPersonName || formData.contactPersonName.length < 3) {
        newErrors.contactPersonName = 'Nombre del contacto es requerido';
      }
      if (!formData.contactPersonEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contactPersonEmail)) {
        newErrors.contactPersonEmail = 'Email del contacto inválido';
      }
      if (!formData.contactPersonPhone || formData.contactPersonPhone.length < 8) {
        newErrors.contactPersonPhone = 'Teléfono del contacto es requerido';
      }
    }

    if (currentStep === 4) {
      if (!formData.businessAddress || formData.businessAddress.length < 5) {
        newErrors.businessAddress = 'La dirección es requerida';
      }
      if (!formData.city || formData.city.length < 2) {
        newErrors.city = 'La ciudad es requerida';
      }
      if (!formData.province || formData.province.length < 2) {
        newErrors.province = 'La provincia es requerida';
      }
    }

    if (currentStep === 5) {
      if (!formData.serviceTypes || formData.serviceTypes.length === 0) {
        newErrors.serviceTypes = 'Seleccione al menos un tipo de servicio';
      }
      if (!formData.vehicleTypes || formData.vehicleTypes.length === 0) {
        newErrors.vehicleTypes = 'Seleccione al menos un tipo de vehículo';
      }
      if (!formData.coverageAreas || formData.coverageAreas.length === 0) {
        newErrors.coverageAreas = 'Seleccione al menos un área de cobertura';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      if (step < 6) {
        setStep(step + 1);
        speakText(`Paso ${step + 1} de 6`);
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
      speakText(`Paso ${step - 1} de 6`);
    } else {
      router.back();
    }
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      speakText('Procesando registro');

      const validatedData = ProviderRegistrationSchema.parse(formData);

      console.log('Provider registration data:', validatedData);

      await new Promise((resolve) => setTimeout(resolve, 2000));

      speakText('Registro completado exitosamente');
      Alert.alert(
        'Registro Exitoso',
        'Tu cuenta de proveedor ha sido creada. Bienvenido a 2Kompa!',
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
      <Text style={styles.stepTitle} onPress={() => speakText('Información de la Empresa')}>
        Información de la Empresa
      </Text>

      <View style={styles.inputGroup}>
        <Text style={styles.label} onPress={() => speakText('Nombre de la Empresa')}>
          Nombre de la Empresa *
        </Text>
        <TextInput
          style={[styles.input, errors.companyName && styles.inputError]}
          value={formData.companyName}
          onChangeText={(value) => updateField('companyName', value)}
          placeholder="Nombre comercial"
          placeholderTextColor="#999"
          accessibilityLabel="Campo de nombre de empresa"
        />
        {errors.companyName && (
          <Text style={styles.errorText}>{errors.companyName}</Text>
        )}
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label} onPress={() => speakText('RUC o NIT')}>
          RUC/NIT *
        </Text>
        <TextInput
          style={[styles.input, errors.businessId && styles.inputError]}
          value={formData.businessId}
          onChangeText={(value) => updateField('businessId', value)}
          placeholder="Número de identificación fiscal"
          placeholderTextColor="#999"
          accessibilityLabel="Campo de RUC o NIT"
        />
        {errors.businessId && (
          <Text style={styles.errorText}>{errors.businessId}</Text>
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
          placeholder="correo@empresa.com"
          placeholderTextColor="#999"
          keyboardType="email-address"
          autoCapitalize="none"
          accessibilityLabel="Campo de correo electrónico"
        />
        {errors.email && (
          <Text style={styles.errorText}>{errors.email}</Text>
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
        />
        {errors.phone && (
          <Text style={styles.errorText}>{errors.phone}</Text>
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
          <Text style={styles.errorText}>{errors.password}</Text>
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
          <Text style={styles.errorText}>{errors.confirmPassword}</Text>
        )}
      </View>
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle} onPress={() => speakText('Persona de Contacto')}>
        Persona de Contacto
      </Text>

      <View style={styles.inputGroup}>
        <Text style={styles.label} onPress={() => speakText('Nombre Completo')}>
          Nombre Completo *
        </Text>
        <TextInput
          style={[styles.input, errors.contactPersonName && styles.inputError]}
          value={formData.contactPersonName}
          onChangeText={(value) => updateField('contactPersonName', value)}
          placeholder="Nombre del responsable"
          placeholderTextColor="#999"
          accessibilityLabel="Campo de nombre de contacto"
        />
        {errors.contactPersonName && (
          <Text style={styles.errorText}>{errors.contactPersonName}</Text>
        )}
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label} onPress={() => speakText('Correo Electrónico')}>
          Correo Electrónico *
        </Text>
        <TextInput
          style={[styles.input, errors.contactPersonEmail && styles.inputError]}
          value={formData.contactPersonEmail}
          onChangeText={(value) => updateField('contactPersonEmail', value)}
          placeholder="correo@ejemplo.com"
          placeholderTextColor="#999"
          keyboardType="email-address"
          autoCapitalize="none"
          accessibilityLabel="Campo de correo de contacto"
        />
        {errors.contactPersonEmail && (
          <Text style={styles.errorText}>{errors.contactPersonEmail}</Text>
        )}
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label} onPress={() => speakText('Teléfono')}>
          Teléfono *
        </Text>
        <TextInput
          style={[styles.input, errors.contactPersonPhone && styles.inputError]}
          value={formData.contactPersonPhone}
          onChangeText={(value) => updateField('contactPersonPhone', value)}
          placeholder="8888-8888"
          placeholderTextColor="#999"
          keyboardType="phone-pad"
          accessibilityLabel="Campo de teléfono de contacto"
        />
        {errors.contactPersonPhone && (
          <Text style={styles.errorText}>{errors.contactPersonPhone}</Text>
        )}
      </View>
    </View>
  );

  const renderStep4 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle} onPress={() => speakText('Dirección del Negocio')}>
        Dirección del Negocio
      </Text>

      <View style={styles.inputGroup}>
        <Text style={styles.label} onPress={() => speakText('Dirección')}>
          Dirección *
        </Text>
        <TextInput
          style={[styles.input, styles.textArea, errors.businessAddress && styles.inputError]}
          value={formData.businessAddress}
          onChangeText={(value) => updateField('businessAddress', value)}
          placeholder="Dirección completa del negocio"
          placeholderTextColor="#999"
          multiline
          numberOfLines={3}
          accessibilityLabel="Campo de dirección"
        />
        {errors.businessAddress && (
          <Text style={styles.errorText}>{errors.businessAddress}</Text>
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
        />
        {errors.city && (
          <Text style={styles.errorText}>{errors.city}</Text>
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
        />
        {errors.province && (
          <Text style={styles.errorText}>{errors.province}</Text>
        )}
      </View>
    </View>
  );

  const renderStep5 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle} onPress={() => speakText('Servicios y Cobertura')}>
        Servicios y Cobertura
      </Text>

      <View style={styles.inputGroup}>
        <Text style={styles.label} onPress={() => speakText('Tipos de Servicio')}>
          Tipos de Servicio *
        </Text>
        <View style={styles.chipContainer}>
          {SERVICE_TYPES.map((service) => (
            <TouchableOpacity
              key={service}
              style={[
                styles.chip,
                formData.serviceTypes?.includes(service) && styles.chipSelected,
              ]}
              onPress={() => toggleArrayItem('serviceTypes', service)}
              accessibilityLabel={`Servicio: ${service}`}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: formData.serviceTypes?.includes(service) }}
            >
              <Text
                style={[
                  styles.chipText,
                  formData.serviceTypes?.includes(service) && styles.chipTextSelected,
                ]}
              >
                {service}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        {errors.serviceTypes && (
          <Text style={styles.errorText}>{errors.serviceTypes}</Text>
        )}
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label} onPress={() => speakText('Tipos de Vehículo')}>
          Tipos de Vehículo *
        </Text>
        <View style={styles.chipContainer}>
          {VEHICLE_TYPES.map((vehicle) => (
            <TouchableOpacity
              key={vehicle}
              style={[
                styles.chip,
                formData.vehicleTypes?.includes(vehicle) && styles.chipSelected,
              ]}
              onPress={() => toggleArrayItem('vehicleTypes', vehicle)}
              accessibilityLabel={`Vehículo: ${vehicle}`}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: formData.vehicleTypes?.includes(vehicle) }}
            >
              <Text
                style={[
                  styles.chipText,
                  formData.vehicleTypes?.includes(vehicle) && styles.chipTextSelected,
                ]}
              >
                {vehicle}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        {errors.vehicleTypes && (
          <Text style={styles.errorText}>{errors.vehicleTypes}</Text>
        )}
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label} onPress={() => speakText('Áreas de Cobertura')}>
          Áreas de Cobertura *
        </Text>
        <View style={styles.chipContainer}>
          {COVERAGE_AREAS.map((area) => (
            <TouchableOpacity
              key={area}
              style={[
                styles.chip,
                formData.coverageAreas?.includes(area) && styles.chipSelected,
              ]}
              onPress={() => toggleArrayItem('coverageAreas', area)}
              accessibilityLabel={`Área: ${area}`}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: formData.coverageAreas?.includes(area) }}
            >
              <Text
                style={[
                  styles.chipText,
                  formData.coverageAreas?.includes(area) && styles.chipTextSelected,
                ]}
              >
                {area}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        {errors.coverageAreas && (
          <Text style={styles.errorText}>{errors.coverageAreas}</Text>
        )}
      </View>
    </View>
  );

  const renderStep6 = () => (
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
            <Text style={styles.checkboxLabel}>{option.label}</Text>
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
        />
        <Text style={styles.helperText} onPress={() => speakText('Gana 20,000 colones cuando tu referido complete 20 viajes')}>
          Gana ₡20,000 cuando tu referido complete 20 viajes
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
        <Text style={styles.headerTitle} onPress={() => speakText('Registro de Proveedor')}>
          Registro de Proveedor
        </Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${(step / 6) * 100}%` }]} />
        </View>
        <Text style={styles.progressText} onPress={() => speakText(`Paso ${step} de 6`)}>
          Paso {step} de 6
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
        {step === 6 && renderStep6()}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity
          style={[styles.button, styles.buttonPrimary]}
          onPress={handleNext}
          disabled={loading}
          accessibilityLabel={step === 6 ? 'Registrarse' : 'Siguiente'}
          accessibilityRole="button"
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>
              {step === 6 ? 'Registrarse' : 'Siguiente'}
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
    backgroundColor: '#2196F3',
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
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#2196F3',
    backgroundColor: '#fff',
  },
  chipSelected: {
    backgroundColor: '#2196F3',
  },
  chipText: {
    fontSize: 14,
    color: '#2196F3',
  },
  chipTextSelected: {
    color: '#fff',
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
    borderColor: '#2196F3',
    backgroundColor: '#2196F3',
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
    backgroundColor: '#2196F3',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#fff',
  },
});
