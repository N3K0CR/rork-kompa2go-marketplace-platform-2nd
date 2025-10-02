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
import { ChevronDown, Trash2 } from 'lucide-react-native';
import { AccessibleText } from '@/components/AccessibleText';
import { AccessibleButton } from '@/components/AccessibleButton';
import { AccessibleInput } from '@/components/AccessibleInput';
import { DatePicker } from '@/components/DatePicker';
import { useAccessibility } from '@/contexts/AccessibilityContext';
import { RegistrationService } from '@/src/modules/registration/services/registration-service-wrapper';
import type { KommuterRegistrationData, VehicleData } from '@/src/shared/types/registration-types';

export default function KommuterRegistrationScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { settings, updateSettings, speak } = useAccessibility();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);

  const [formData, setFormData] = useState<KommuterRegistrationData>({
    personalInfo: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      cedula: '',
      dateOfBirth: '',
      address: '',
    },
    driverLicense: {
      number: '',
      expirationDate: '',
      category: 'B1',
    },
    vehicleInfo: {
      isFleet: false,
      vehicles: [],
      fleetDrivers: [],
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

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [currentVehicle, setCurrentVehicle] = useState<VehicleData>({
    brand: '',
    model: '',
    year: new Date().getFullYear(),
    plate: '',
    color: '',
    capacity: 4,
    vehicleType: 'sedan',
    documents: {},
  });
  const [showVehicleTypeModal, setShowVehicleTypeModal] = useState(false);

  const vehicleTypes = [
    { value: 'sedan', label: 'Sedán' },
    { value: 'suv', label: 'SUV' },
    { value: 'van', label: 'Van' },
    { value: 'truck', label: 'Camioneta' },
    { value: 'motorcycle', label: 'Motocicleta' },
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

    if (!formData.driverLicense.number.trim()) {
      newErrors.licenseNumber = 'El número de licencia es requerido';
    }
    if (!formData.driverLicense.expirationDate) {
      newErrors.licenseExpiry = 'La fecha de vencimiento es requerida';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep3 = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (formData.vehicleInfo.vehicles.length === 0) {
      newErrors.vehicles = 'Debe agregar al menos un vehículo';
      Alert.alert('Error', 'Debe agregar al menos un vehículo');
    }

    if (formData.vehicleInfo.isFleet && (!formData.vehicleInfo.fleetDrivers || formData.vehicleInfo.fleetDrivers.length === 0)) {
      newErrors.fleetDrivers = 'Los administradores de flotilla deben agregar al menos un conductor';
      Alert.alert('Error', 'Los administradores de flotilla deben agregar al menos un conductor');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
      if (settings.ttsEnabled) {
        speak('Paso 2: Información de licencia de conducir');
      }
    } else if (step === 2 && validateStep2()) {
      setStep(3);
      if (settings.ttsEnabled) {
        speak('Paso 3: Información de vehículos');
      }
    } else if (step === 3 && validateStep3()) {
      setStep(4);
      if (settings.ttsEnabled) {
        speak('Paso 4: Preferencias y accesibilidad');
      }
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleAddVehicle = () => {
    if (!currentVehicle.brand.trim() || !currentVehicle.model.trim() || !currentVehicle.plate.trim()) {
      Alert.alert('Error', 'Complete todos los campos del vehículo');
      return;
    }

    setFormData({
      ...formData,
      vehicleInfo: {
        ...formData.vehicleInfo,
        vehicles: [...formData.vehicleInfo.vehicles, currentVehicle],
      },
    });

    setCurrentVehicle({
      brand: '',
      model: '',
      year: new Date().getFullYear(),
      plate: '',
      color: '',
      capacity: 4,
      vehicleType: 'sedan',
      documents: {},
    });

    if (settings.ttsEnabled) {
      speak('Vehículo agregado exitosamente');
    }
  };

  const handleRemoveVehicle = (index: number) => {
    const newVehicles = formData.vehicleInfo.vehicles.filter((_, i) => i !== index);
    setFormData({
      ...formData,
      vehicleInfo: {
        ...formData.vehicleInfo,
        vehicles: newVehicles,
      },
    });
  };

  const handleSubmit = async () => {
    if (!validateStep3()) return;

    setLoading(true);
    try {
      await updateSettings(formData.accessibility!);
      
      await RegistrationService.registerKommuter(formData);
      
      if (settings.ttsEnabled) {
        speak('Registro completado exitosamente. Tu cuenta está pendiente de verificación de antecedentes.');
      }

      Alert.alert(
        'Registro Exitoso',
        'Tu cuenta ha sido creada y está pendiente de verificación de antecedentes',
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

      <AccessibleInput
        label="Dirección"
        value={formData.personalInfo.address}
        onChangeText={(text) =>
          setFormData({
            ...formData,
            personalInfo: { ...formData.personalInfo, address: text },
          })
        }
      />
    </View>
  );

  const renderStep2 = () => (
    <View>
      <AccessibleText text="Licencia de Conducir" style={styles.stepTitle} />

      <AccessibleInput
        label="Número de Licencia"
        value={formData.driverLicense.number}
        onChangeText={(text) =>
          setFormData({
            ...formData,
            driverLicense: { ...formData.driverLicense, number: text },
          })
        }
        error={errors.licenseNumber}
        required
      />

      <DatePicker
        label="Fecha de Vencimiento"
        value={formData.driverLicense.expirationDate || ''}
        onDateChange={(date) =>
          setFormData({
            ...formData,
            driverLicense: { ...formData.driverLicense, expirationDate: date },
          })
        }
        minAge={-10}
        maxAge={-1}
      />

      <AccessibleInput
        label="Categoría"
        value={formData.driverLicense.category}
        onChangeText={(text) =>
          setFormData({
            ...formData,
            driverLicense: { ...formData.driverLicense, category: text },
          })
        }
        placeholder="Ej: B1, B2, C1"
      />
    </View>
  );

  const renderStep3 = () => (
    <View>
      <AccessibleText text="Información de Vehículos" style={styles.stepTitle} />

      <View style={styles.switchContainer}>
        <AccessibleText text="¿Eres administrador de flotilla?" />
        <Switch
          value={formData.vehicleInfo.isFleet}
          onValueChange={(value) =>
            setFormData({
              ...formData,
              vehicleInfo: { ...formData.vehicleInfo, isFleet: value },
            })
          }
        />
      </View>

      <View style={styles.vehicleFormContainer}>
        <AccessibleText text="Agregar Vehículo" style={styles.sectionTitle} />

        <AccessibleInput
          label="Marca"
          value={currentVehicle.brand}
          onChangeText={(text) => setCurrentVehicle({ ...currentVehicle, brand: text })}
          required
        />

        <AccessibleInput
          label="Modelo"
          value={currentVehicle.model}
          onChangeText={(text) => setCurrentVehicle({ ...currentVehicle, model: text })}
          required
        />

        <AccessibleInput
          label="Año"
          value={currentVehicle.year.toString()}
          onChangeText={(text) => setCurrentVehicle({ ...currentVehicle, year: parseInt(text) || new Date().getFullYear() })}
          keyboardType="numeric"
        />

        <AccessibleInput
          label="Placa"
          value={currentVehicle.plate}
          onChangeText={(text) => setCurrentVehicle({ ...currentVehicle, plate: text })}
          required
          autoCapitalize="characters"
        />

        <AccessibleInput
          label="Color"
          value={currentVehicle.color}
          onChangeText={(text) => setCurrentVehicle({ ...currentVehicle, color: text })}
        />

        <AccessibleInput
          label="Capacidad"
          value={currentVehicle.capacity.toString()}
          onChangeText={(text) => setCurrentVehicle({ ...currentVehicle, capacity: parseInt(text) || 4 })}
          keyboardType="numeric"
        />

        <View style={styles.inputContainer}>
          <AccessibleText text="Tipo de Vehículo" style={styles.label} />
          <TouchableOpacity
            style={styles.dropdownButton}
            onPress={() => setShowVehicleTypeModal(true)}
          >
            <Text style={styles.dropdownText}>
              {vehicleTypes.find(vt => vt.value === currentVehicle.vehicleType)?.label || 'Selecciona'}
            </Text>
            <ChevronDown size={20} color="#666" />
          </TouchableOpacity>
        </View>

        <AccessibleButton
          label="Agregar Vehículo"
          text="Agregar Vehículo"
          onPress={handleAddVehicle}
          style={styles.addButton}
        />
      </View>

      {formData.vehicleInfo.vehicles.length > 0 && (
        <View style={styles.vehiclesList}>
          <AccessibleText text="Vehículos Agregados" style={styles.sectionTitle} />
          {formData.vehicleInfo.vehicles.map((vehicle, index) => (
            <View key={index} style={styles.vehicleCard}>
              <View style={styles.vehicleInfo}>
                <Text style={styles.vehicleText}>
                  {vehicle.brand} {vehicle.model} ({vehicle.year})
                </Text>
                <Text style={styles.vehicleSubtext}>
                  Placa: {vehicle.plate} - {vehicleTypes.find(vt => vt.value === vehicle.vehicleType)?.label}
                </Text>
              </View>
              <TouchableOpacity onPress={() => handleRemoveVehicle(index)}>
                <Trash2 size={20} color="#ff3b30" />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}
    </View>
  );

  const renderStep4 = () => (
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
        visible={showVehicleTypeModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowVehicleTypeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <AccessibleText text="Tipo de Vehículo" style={styles.modalTitle} />
            <ScrollView style={styles.optionsList}>
              {vehicleTypes.map((type, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.optionItem}
                  onPress={() => {
                    setCurrentVehicle({ ...currentVehicle, vehicleType: type.value as any });
                    setShowVehicleTypeModal(false);
                  }}
                >
                  <Text style={styles.optionText}>{type.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <AccessibleButton
              label="Cancelar"
              text="Cancelar"
              onPress={() => setShowVehicleTypeModal(false)}
              style={styles.modalCancelButton}
            />
          </View>
        </View>
      </Modal>
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <AccessibleText text="Registro de Conductor" style={styles.title} />
        <AccessibleText text={`Paso ${step} de 4`} style={styles.subtitle} />

        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
        {step === 4 && renderStep4()}

        <View style={styles.buttonContainer}>
          {step > 1 && (
            <AccessibleButton
              label="Atrás"
              text="Atrás"
              onPress={handleBack}
              style={[styles.button, styles.secondaryButton]}
            />
          )}
          
          {step < 4 ? (
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
  stepTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 20,
    color: '#333',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
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
  vehicleFormContainer: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  addButton: {
    marginTop: 12,
    backgroundColor: '#34C759',
  },
  vehiclesList: {
    marginTop: 16,
  },
  vehicleCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
  },
  vehicleInfo: {
    flex: 1,
  },
  vehicleText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  vehicleSubtext: {
    fontSize: 14,
    color: '#666',
  },
});
