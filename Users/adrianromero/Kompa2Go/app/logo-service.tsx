import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
  Text,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AccessibleText } from '@/components/AccessibleText';
import { AccessibleButton } from '@/components/AccessibleButton';
import { AccessibleInput } from '@/components/AccessibleInput';
import { useAccessibility } from '@/contexts/AccessibilityContext';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

type StylePreference = 'modern' | 'classic' | 'minimalist' | 'bold' | 'playful';

export default function LogoServiceScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { settings, speak } = useAccessibility();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);

  const [formData, setFormData] = useState({
    clientInfo: {
      name: '',
      email: '',
      phone: '',
      companyName: '',
    },
    projectDetails: {
      businessType: '',
      targetAudience: '',
      preferredColors: [''],
      stylePreferences: [] as StylePreference[],
      inspirationReferences: '',
      additionalNotes: '',
    },
    paymentMethod: 'sinpe' as 'sinpe' | 'kash',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const styleOptions: StylePreference[] = ['modern', 'classic', 'minimalist', 'bold', 'playful'];

  const validateStep1 = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.clientInfo.name.trim()) {
      newErrors.name = 'El nombre es requerido';
    }
    if (!formData.clientInfo.email.trim()) {
      newErrors.email = 'El email es requerido';
    } else if (!/\S+@\S+\.\S+/.test(formData.clientInfo.email)) {
      newErrors.email = 'Email inválido';
    }
    if (!formData.clientInfo.phone.trim()) {
      newErrors.phone = 'El teléfono es requerido';
    }
    if (!formData.clientInfo.companyName.trim()) {
      newErrors.companyName = 'El nombre de la empresa es requerido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.projectDetails.businessType.trim()) {
      newErrors.businessType = 'El tipo de negocio es requerido';
    }
    if (!formData.projectDetails.targetAudience.trim()) {
      newErrors.targetAudience = 'La audiencia objetivo es requerida';
    }
    if (formData.projectDetails.preferredColors.filter(c => c.trim()).length === 0) {
      newErrors.colors = 'Debe especificar al menos un color';
    }
    if (formData.projectDetails.stylePreferences.length === 0) {
      newErrors.styles = 'Debe seleccionar al menos un estilo';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
      if (settings.ttsEnabled) {
        speak('Paso 2: Detalles del proyecto');
      }
    } else if (step === 2 && validateStep2()) {
      setStep(3);
      if (settings.ttsEnabled) {
        speak('Paso 3: Método de pago');
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
      const ADVANCE_AMOUNT = 13000;
      const REMAINING_AMOUNT = 12000;
      const TOTAL_AMOUNT = 25000;
      const DELIVERY_HOURS = 72;

      const requestId = `logo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const deliveryDate = new Date();
      deliveryDate.setHours(deliveryDate.getHours() + DELIVERY_HOURS);

      const logoRequest = {
        id: requestId,
        clientInfo: formData.clientInfo,
        projectDetails: formData.projectDetails,
        payment: {
          method: formData.paymentMethod,
          advanceAmount: ADVANCE_AMOUNT,
          remainingAmount: REMAINING_AMOUNT,
          totalAmount: TOTAL_AMOUNT,
          advancePaid: false,
          remainingPaid: false,
        },
        status: 'pending_payment',
        createdAt: new Date(),
        updatedAt: new Date(),
        deliveryDate,
      };

      await setDoc(doc(db, 'logo_requests', requestId), {
        ...logoRequest,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      const paymentInfo = {
        method: formData.paymentMethod,
        accountNumber: formData.paymentMethod === 'sinpe' ? '8888-8888' : 'kompa2go@kash.cr',
        accountHolder: formData.paymentMethod === 'sinpe' ? 'Kompa2Go S.A.' : 'Kompa2Go',
        amount: ADVANCE_AMOUNT,
        reference: `LOGO-${Date.now()}`,
      };

      if (settings.ttsEnabled) {
        speak('Solicitud creada exitosamente. Proceda con el pago del adelanto.');
      }

      Alert.alert(
        'Solicitud Creada',
        `Tu solicitud ha sido creada exitosamente.\n\nID: ${requestId}\n\nPara continuar, realiza el pago del adelanto de ₡13,000 a:\n\n${paymentInfo.method === 'sinpe' ? 'SINPE Móvil' : 'Kash'}: ${paymentInfo.accountNumber}\nTitular: ${paymentInfo.accountHolder}\nReferencia: ${paymentInfo.reference}\n\nEl adelanto no es reembolsable si no se acepta ninguna propuesta.`,
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error) {
      console.error('Logo service request error:', error);
      Alert.alert('Error', 'No se pudo crear la solicitud. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const toggleStyle = (style: StylePreference) => {
    const currentStyles = formData.projectDetails.stylePreferences;
    const newStyles = currentStyles.includes(style)
      ? currentStyles.filter(s => s !== style)
      : [...currentStyles, style];
    
    setFormData({
      ...formData,
      projectDetails: {
        ...formData.projectDetails,
        stylePreferences: newStyles,
      },
    });
  };

  const addColorField = () => {
    setFormData({
      ...formData,
      projectDetails: {
        ...formData.projectDetails,
        preferredColors: [...formData.projectDetails.preferredColors, ''],
      },
    });
  };

  const updateColor = (index: number, value: string) => {
    const newColors = [...formData.projectDetails.preferredColors];
    newColors[index] = value;
    setFormData({
      ...formData,
      projectDetails: {
        ...formData.projectDetails,
        preferredColors: newColors,
      },
    });
  };

  const removeColor = (index: number) => {
    const newColors = formData.projectDetails.preferredColors.filter((_, i) => i !== index);
    setFormData({
      ...formData,
      projectDetails: {
        ...formData.projectDetails,
        preferredColors: newColors.length > 0 ? newColors : [''],
      },
    });
  };

  const renderStep1 = () => (
    <View>
      <AccessibleText text="Información del Cliente" style={styles.stepTitle} />
      
      <AccessibleInput
        label="Nombre Completo"
        value={formData.clientInfo.name}
        onChangeText={(text) =>
          setFormData({
            ...formData,
            clientInfo: { ...formData.clientInfo, name: text },
          })
        }
        error={errors.name}
        required
        autoCapitalize="words"
      />

      <AccessibleInput
        label="Email"
        value={formData.clientInfo.email}
        onChangeText={(text) =>
          setFormData({
            ...formData,
            clientInfo: { ...formData.clientInfo, email: text },
          })
        }
        error={errors.email}
        required
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <AccessibleInput
        label="Teléfono"
        value={formData.clientInfo.phone}
        onChangeText={(text) =>
          setFormData({
            ...formData,
            clientInfo: { ...formData.clientInfo, phone: text },
          })
        }
        error={errors.phone}
        required
        keyboardType="phone-pad"
      />

      <AccessibleInput
        label="Nombre de la Empresa"
        value={formData.clientInfo.companyName}
        onChangeText={(text) =>
          setFormData({
            ...formData,
            clientInfo: { ...formData.clientInfo, companyName: text },
          })
        }
        error={errors.companyName}
        required
      />
    </View>
  );

  const renderStep2 = () => (
    <View>
      <AccessibleText text="Detalles del Proyecto" style={styles.stepTitle} />

      <AccessibleInput
        label="Tipo de Negocio"
        value={formData.projectDetails.businessType}
        onChangeText={(text) =>
          setFormData({
            ...formData,
            projectDetails: { ...formData.projectDetails, businessType: text },
          })
        }
        error={errors.businessType}
        required
        placeholder="Ej: Restaurante, Tecnología, Salud"
      />

      <AccessibleInput
        label="Audiencia Objetivo"
        value={formData.projectDetails.targetAudience}
        onChangeText={(text) =>
          setFormData({
            ...formData,
            projectDetails: { ...formData.projectDetails, targetAudience: text },
          })
        }
        error={errors.targetAudience}
        required
        placeholder="Ej: Jóvenes 18-35, Profesionales, Familias"
      />

      <View style={styles.section}>
        <AccessibleText text="Colores Preferidos *" style={styles.sectionLabel} />
        {errors.colors && <Text style={styles.errorText}>{errors.colors}</Text>}
        {formData.projectDetails.preferredColors.map((color, index) => (
          <View key={index} style={styles.colorRow}>
            <View style={styles.colorInput}>
              <AccessibleInput
                label={`Color ${index + 1}`}
                value={color}
                onChangeText={(text) => updateColor(index, text)}
                placeholder="Ej: Azul, #0000FF"
              />
            </View>
            {formData.projectDetails.preferredColors.length > 1 && (
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => removeColor(index)}
              >
                <Text style={styles.removeButtonText}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}
        <TouchableOpacity style={styles.addButton} onPress={addColorField}>
          <Text style={styles.addButtonText}>+ Agregar Color</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <AccessibleText text="Estilos Preferidos *" style={styles.sectionLabel} />
        {errors.styles && <Text style={styles.errorText}>{errors.styles}</Text>}
        <View style={styles.styleGrid}>
          {styleOptions.map((style) => (
            <TouchableOpacity
              key={style}
              style={[
                styles.styleChip,
                formData.projectDetails.stylePreferences.includes(style) && styles.styleChipSelected,
              ]}
              onPress={() => toggleStyle(style)}
            >
              <Text
                style={[
                  styles.styleChipText,
                  formData.projectDetails.stylePreferences.includes(style) && styles.styleChipTextSelected,
                ]}
              >
                {style.charAt(0).toUpperCase() + style.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <AccessibleInput
        label="Referencias de Inspiración (Opcional)"
        value={formData.projectDetails.inspirationReferences}
        onChangeText={(text) =>
          setFormData({
            ...formData,
            projectDetails: { ...formData.projectDetails, inspirationReferences: text },
          })
        }
        placeholder="URLs o nombres de marcas que te gusten"
      />

      <AccessibleInput
        label="Notas Adicionales (Opcional)"
        value={formData.projectDetails.additionalNotes}
        onChangeText={(text) =>
          setFormData({
            ...formData,
            projectDetails: { ...formData.projectDetails, additionalNotes: text },
          })
        }
        placeholder="Cualquier detalle adicional que debamos saber"
      />
    </View>
  );

  const renderStep3 = () => (
    <View>
      <AccessibleText text="Método de Pago" style={styles.stepTitle} />

      <View style={styles.priceCard}>
        <Text style={styles.priceTitle}>Servicio de Diseño de Logo</Text>
        <Text style={styles.priceAmount}>₡25,000</Text>
        <View style={styles.priceDivider} />
        <View style={styles.priceBreakdown}>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Adelanto (no reembolsable):</Text>
            <Text style={styles.priceValue}>₡13,000</Text>
          </View>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Saldo (al aprobar):</Text>
            <Text style={styles.priceValue}>₡12,000</Text>
          </View>
        </View>
        <View style={styles.deliveryInfo}>
          <Text style={styles.deliveryText}>✓ 3 Propuestas de logo</Text>
          <Text style={styles.deliveryText}>✓ Entrega en 48-72 horas</Text>
          <Text style={styles.deliveryText}>✓ 2 rondas de revisión</Text>
          <Text style={styles.deliveryText}>✓ Archivos en PNG, SVG, PDF, AI</Text>
        </View>
      </View>

      <View style={styles.paymentMethods}>
        <TouchableOpacity
          style={[
            styles.paymentMethod,
            formData.paymentMethod === 'sinpe' && styles.paymentMethodSelected,
          ]}
          onPress={() => setFormData({ ...formData, paymentMethod: 'sinpe' })}
        >
          <Text style={styles.paymentMethodTitle}>SINPE Móvil</Text>
          <Text style={styles.paymentMethodDesc}>Transferencia bancaria</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.paymentMethod,
            formData.paymentMethod === 'kash' && styles.paymentMethodSelected,
          ]}
          onPress={() => setFormData({ ...formData, paymentMethod: 'kash' })}
        >
          <Text style={styles.paymentMethodTitle}>Kash</Text>
          <Text style={styles.paymentMethodDesc}>Pago digital</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.infoBox}>
        <Text style={styles.infoText}>
          ℹ️ El adelanto de ₡13,000 no es reembolsable si no se acepta ninguna de las 3 propuestas presentadas.
        </Text>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Stack.Screen options={{ headerShown: false }} />
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <AccessibleText text="Servicio de Diseño de Logo" style={styles.title} />
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
              label={loading ? 'Procesando...' : 'Crear Solicitud'}
              text={loading ? 'Procesando...' : 'Crear Solicitud'}
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
    paddingBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: '700' as const,
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
    fontWeight: '600' as const,
    marginBottom: 20,
    color: '#333',
  },
  section: {
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '600' as const,
    marginBottom: 12,
    color: '#333',
  },
  colorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  colorInput: {
    flex: 1,
  },
  removeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  removeButtonText: {
    fontSize: 24,
    color: '#FF3B30',
  },
  addButton: {
    padding: 12,
    backgroundColor: '#FFF',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#007AFF',
    borderStyle: 'dashed' as const,
    alignItems: 'center',
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#007AFF',
  },
  styleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  styleChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFF',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  styleChipSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  styleChipText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#333',
  },
  styleChipTextSelected: {
    color: '#FFF',
  },
  priceCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  priceTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#333',
    marginBottom: 8,
  },
  priceAmount: {
    fontSize: 36,
    fontWeight: '700' as const,
    color: '#007AFF',
    marginBottom: 16,
  },
  priceDivider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginBottom: 16,
  },
  priceBreakdown: {
    marginBottom: 16,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  priceLabel: {
    fontSize: 14,
    color: '#666',
  },
  priceValue: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#333',
  },
  deliveryInfo: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
  },
  deliveryText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  paymentMethods: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  paymentMethod: {
    flex: 1,
    padding: 16,
    backgroundColor: '#FFF',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    alignItems: 'center',
  },
  paymentMethodSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#F0F8FF',
  },
  paymentMethodTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#333',
    marginBottom: 4,
  },
  paymentMethodDesc: {
    fontSize: 12,
    color: '#666',
  },
  infoBox: {
    backgroundColor: '#FFF3CD',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#FFC107',
  },
  infoText: {
    fontSize: 14,
    color: '#856404',
    lineHeight: 20,
  },
  errorText: {
    fontSize: 12,
    color: '#FF3B30',
    marginBottom: 8,
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
