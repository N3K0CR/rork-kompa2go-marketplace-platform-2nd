import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Switch,
  TouchableOpacity,
  Text,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Plus, Trash2 } from 'lucide-react-native';
import { AccessibleText } from '@/components/AccessibleText';
import { AccessibleButton } from '@/components/AccessibleButton';
import { AccessibleInput } from '@/components/AccessibleInput';
import { TermsAcceptance } from '@/components/TermsAcceptance';
import { useAccessibility } from '@/contexts/AccessibilityContext';
import { default as RegistrationService } from '@/src/modules/registration/services/firestore-registration-service';
import type { KommuterRegistrationData, VehicleData, FleetDriverData } from '@/src/shared/types/registration-types';

export default function KommuterRegistrationScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { settings, updateSettings, speak } = useAccessibility();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(0);
  const [termsAccepted, setTermsAccepted] = useState(false);

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
      category: 'B',
    },
    vehicleInfo: {
      isFleet: false,
      vehicles: [{
        brand: '',
        model: '',
        year: new Date().getFullYear(),
        plate: '',
        color: '',
        capacity: 4,
        vehicleType: 'sedan',
        documents: {},
      }],
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

  const [fleetDrivers, setFleetDrivers] = useState<FleetDriverData[]>([]);
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

    if (!formData.driverLicense.number.trim()) {
      newErrors.licenseNumber = 'El número de licencia es requerido';
    }
    if (!formData.driverLicense.expirationDate.trim()) {
      newErrors.licenseExpiration = 'La fecha de vencimiento es requerida';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep3 = (): boolean => {
    const newErrors: Record<string, string> = {};

    formData.vehicleInfo.vehicles.forEach((vehicle, index) => {
      if (!vehicle.brand.trim()) {
        newErrors[`vehicle${index}Brand`] = 'La marca es requerida';
      }
      if (!vehicle.model.trim()) {
        newErrors[`vehicle${index}Model`] = 'El modelo es requerido';
      }
      if (!vehicle.plate.trim()) {
        newErrors[`vehicle${index}Plate`] = 'La placa es requerida';
      }
    });

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
        speak('Paso 2: Licencia de conducir');
      }
    } else if (step === 2 && validateStep2()) {
      setStep(3);
      if (settings.ttsEnabled) {
        speak('Paso 3: Información del vehículo');
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

  const handleSubmit = async () => {
    if (!validateStep3()) return;

    setLoading(true);
    try {
      await updateSettings(formData.accessibility!);
      
      await RegistrationService.registerKommuter(formData);
      
      if (settings.ttsEnabled) {
        speak('Registro completado exitosamente. Tu cuenta está pendiente de aprobación.');
      }

      Alert.alert(
        'Registro Exitoso',
        'Tu cuenta ha sido creada y está pendiente de aprobación. Recibirás una notificación cuando sea activada.',
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

  const addVehicle = () => {
    setFormData({
      ...formData,
      vehicleInfo: {
        ...formData.vehicleInfo,
        vehicles: [
          ...formData.vehicleInfo.vehicles,
          {
            brand: '',
            model: '',
            year: new Date().getFullYear(),
            plate: '',
            color: '',
            capacity: 4,
            vehicleType: 'sedan',
            documents: {},
          },
        ],
      },
    });
  };

  const removeVehicle = (index: number) => {
    const newVehicles = formData.vehicleInfo.vehicles.filter((_, i) => i !== index);
    setFormData({
      ...formData,
      vehicleInfo: {
        ...formData.vehicleInfo,
        vehicles: newVehicles,
      },
    });
  };

  const updateVehicle = (index: number, field: keyof VehicleData, value: any) => {
    const newVehicles = [...formData.vehicleInfo.vehicles];
    newVehicles[index] = { ...newVehicles[index], [field]: value };
    setFormData({
      ...formData,
      vehicleInfo: {
        ...formData.vehicleInfo,
        vehicles: newVehicles,
      },
    });
  };

  const addFleetDriver = () => {
    setFleetDrivers([
      ...fleetDrivers,
      {
        firstName: '',
        lastName: '',
        cedula: '',
        phone: '',
        licenseNumber: '',
      },
    ]);
  };

  const removeFleetDriver = (index: number) => {
    setFleetDrivers(fleetDrivers.filter((_, i) => i !== index));
  };

  const updateFleetDriver = (index: number, field: keyof FleetDriverData, value: string) => {
    const newDrivers = [...fleetDrivers];
    newDrivers[index] = { ...newDrivers[index], [field]: value };
    setFleetDrivers(newDrivers);
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

      <AccessibleInput
        label="Fecha de Nacimiento"
        value={formData.personalInfo.dateOfBirth}
        onChangeText={(text) =>
          setFormData({
            ...formData,
            personalInfo: { ...formData.personalInfo, dateOfBirth: text },
          })
        }
        placeholder="DD/MM/AAAA"
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

      <AccessibleInput
        label="Fecha de Vencimiento"
        value={formData.driverLicense.expirationDate}
        onChangeText={(text) =>
          setFormData({
            ...formData,
            driverLicense: { ...formData.driverLicense, expirationDate: text },
          })
        }
        error={errors.licenseExpiration}
        required
        placeholder="DD/MM/AAAA"
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
        placeholder="Ej: B, C, D"
      />
    </View>
  );

  const renderStep3 = () => (
    <View>
      <AccessibleText text="Información del Vehículo" style={styles.stepTitle} />

      <View style={styles.switchContainer}>
        <AccessibleText text="¿Administras una flotilla?" />
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

      {formData.vehicleInfo.vehicles.map((vehicle, index) => (
        <View key={index} style={styles.vehicleCard}>
          <View style={styles.vehicleHeader}>
            <Text style={styles.vehicleTitle}>Vehículo {index + 1}</Text>
            {formData.vehicleInfo.vehicles.length > 1 && (
              <TouchableOpacity onPress={() => removeVehicle(index)}>
                <Trash2 size={20} color="#FF3B30" />
              </TouchableOpacity>
            )}
          </View>

          <AccessibleInput
            label="Marca"
            value={vehicle.brand}
            onChangeText={(text) => updateVehicle(index, 'brand', text)}
            error={errors[`vehicle${index}Brand`]}
            required
          />

          <AccessibleInput
            label="Modelo"
            value={vehicle.model}
            onChangeText={(text) => updateVehicle(index, 'model', text)}
            error={errors[`vehicle${index}Model`]}
            required
          />

          <AccessibleInput
            label="Año"
            value={vehicle.year.toString()}
            onChangeText={(text) => updateVehicle(index, 'year', parseInt(text) || new Date().getFullYear())}
            keyboardType="numeric"
          />

          <AccessibleInput
            label="Placa"
            value={vehicle.plate}
            onChangeText={(text) => updateVehicle(index, 'plate', text.toUpperCase())}
            error={errors[`vehicle${index}Plate`]}
            required
            autoCapitalize="characters"
          />

          <AccessibleInput
            label="Color"
            value={vehicle.color}
            onChangeText={(text) => updateVehicle(index, 'color', text)}
          />

          <AccessibleInput
            label="Capacidad de Pasajeros"
            value={vehicle.capacity.toString()}
            onChangeText={(text) => updateVehicle(index, 'capacity', parseInt(text) || 4)}
            keyboardType="numeric"
          />
        </View>
      ))}

      {formData.vehicleInfo.isFleet && (
        <TouchableOpacity style={styles.addButton} onPress={addVehicle}>
          <Plus size={20} color="#007AFF" />
          <Text style={styles.addButtonText}>Agregar Vehículo</Text>
        </TouchableOpacity>
      )}

      {formData.vehicleInfo.isFleet && fleetDrivers.length > 0 && (
        <View style={styles.driversSection}>
          <AccessibleText text="Conductores de la Flotilla" style={styles.sectionTitle} />
          {fleetDrivers.map((driver, index) => (
            <View key={index} style={styles.driverCard}>
              <View style={styles.vehicleHeader}>
                <Text style={styles.vehicleTitle}>Conductor {index + 1}</Text>
                <TouchableOpacity onPress={() => removeFleetDriver(index)}>
                  <Trash2 size={20} color="#FF3B30" />
                </TouchableOpacity>
              </View>

              <AccessibleInput
                label="Nombre"
                value={driver.firstName}
                onChangeText={(text) => updateFleetDriver(index, 'firstName', text)}
              />

              <AccessibleInput
                label="Apellido"
                value={driver.lastName}
                onChangeText={(text) => updateFleetDriver(index, 'lastName', text)}
              />

              <AccessibleInput
                label="Cédula"
                value={driver.cedula}
                onChangeText={(text) => updateFleetDriver(index, 'cedula', text)}
              />

              <AccessibleInput
                label="Teléfono"
                value={driver.phone}
                onChangeText={(text) => updateFleetDriver(index, 'phone', text)}
                keyboardType="phone-pad"
              />

              <AccessibleInput
                label="Número de Licencia"
                value={driver.licenseNumber}
                onChangeText={(text) => updateFleetDriver(index, 'licenseNumber', text)}
              />
            </View>
          ))}
        </View>
      )}

      {formData.vehicleInfo.isFleet && (
        <TouchableOpacity style={styles.addButton} onPress={addFleetDriver}>
          <Plus size={20} color="#007AFF" />
          <Text style={styles.addButtonText}>Agregar Conductor</Text>
        </TouchableOpacity>
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

      <View style={styles.infoBox}>
        <Text style={styles.infoText}>
          ℹ️ Nota: La verificación de antecedentes penales será requerida después de completar 20 viajes exitosos.
        </Text>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Stack.Screen options={{ headerShown: false }} />
      
      {step === 0 ? (
        <TermsAcceptance 
          onAccept={handleTermsAccept}
          onDecline={handleTermsDecline}
        />
      ) : (
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
          <AccessibleText text="Registro de Kommuter" style={styles.title} />
          <AccessibleText text={`Paso ${step} de 4`} style={styles.subtitle} />

          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
          {step === 4 && renderStep4()}

        <View style={styles.buttonContainer}>
          {step > 1 && (
            <AccessibleButton
              text="Atrás"
              label="Atrás"
              onPress={handleBack}
              style={[styles.button, styles.secondaryButton]}
            />
          )}
          
          {step < 4 ? (
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
    paddingBottom: 40,
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
    marginBottom: 16,
    marginTop: 24,
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
  vehicleCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  vehicleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  vehicleTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  driverCard: {
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  driversSection: {
    marginTop: 24,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#FFF',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#007AFF',
    borderStyle: 'dashed',
    marginBottom: 16,
  },
  addButtonText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  infoBox: {
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  infoText: {
    fontSize: 14,
    color: '#1565C0',
    lineHeight: 20,
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
