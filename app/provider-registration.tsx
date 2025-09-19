import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal } from 'react-native';
import { Stack, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, User, MapPin, Building2, Clock, Check, X } from 'lucide-react-native';

interface ProviderFormData {
  businessName: string;
  ownerName: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  serviceType: string;
  experience: string;
  description: string;
}

const serviceTypes = [
  'Limpieza Doméstica',
  'Jardinería',
  'Plomería',
  'Electricidad',
  'Carpintería',
  'Pintura',
  'Reparaciones Generales',
  'Cuidado de Mascotas',
  'Cocina/Catering',
  'Transporte',
  'Otro'
];

export default function ProviderRegistrationScreen() {
  const [formData, setFormData] = useState<ProviderFormData>({
    businessName: '',
    ownerName: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    serviceType: '',
    experience: '',
    description: ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showServiceTypes, setShowServiceTypes] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const insets = useSafeAreaInsets();

  const updateField = (field: keyof ProviderFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const showError = (message: string) => {
    setErrorMessage(message);
    setShowErrorModal(true);
  };

  const validateForm = (): boolean => {
    const required = ['businessName', 'ownerName', 'phone', 'email', 'serviceType'];
    
    for (const field of required) {
      const value = formData[field as keyof ProviderFormData];
      if (!value?.trim()) {
        showError(`El campo ${getFieldLabel(field)} es obligatorio`);
        return false;
      }
    }
    
    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email.trim())) {
      showError('Por favor ingresa un email válido');
      return false;
    }
    
    // Validate phone
    const phoneRegex = /^[0-9+\-\s()]{8,15}$/;
    if (!phoneRegex.test(formData.phone.trim())) {
      showError('Por favor ingresa un teléfono válido');
      return false;
    }
    
    return true;
  };

  const getFieldLabel = (field: string): string => {
    const labels: Record<string, string> = {
      businessName: 'Nombre del Negocio',
      ownerName: 'Nombre del Propietario',
      phone: 'Teléfono',
      email: 'Email',
      serviceType: 'Tipo de Servicio'
    };
    return labels[field] || field;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      console.log('Provider registration data:', formData);
      
      setShowSuccessModal(true);
      
    } catch (error) {
      console.error('Registration error:', error);
      showError('Hubo un problema al enviar tu solicitud. Por favor intenta de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectServiceType = (type: string) => {
    if (!type?.trim() || type.length > 50) return;
    const sanitizedType = type.trim();
    updateField('serviceType', sanitizedType);
    setShowServiceTypes(false);
  };

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{
          title: 'Registro de Proveedor',
          headerStyle: { backgroundColor: '#D81B60' },
          headerTintColor: 'white',
          headerTitleStyle: { fontWeight: 'bold' },
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <ChevronLeft size={24} color="white" />
            </TouchableOpacity>
          )
        }}
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Únete a 2Kommute</Text>
          <Text style={styles.subtitle}>
            Completa el formulario para comenzar a ofrecer tus servicios
          </Text>
        </View>

        {/* Business Information */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Building2 size={20} color="#D81B60" />
            <Text style={styles.sectionTitle}>Información del Negocio</Text>
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Nombre del Negocio *</Text>
            <TextInput
              style={styles.textInput}
              value={formData.businessName}
              onChangeText={(text) => updateField('businessName', text)}
              placeholder="Ej: Limpieza Express"
              placeholderTextColor="#999"
              maxLength={50}
            />
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Tipo de Servicio *</Text>
            <TouchableOpacity 
              style={[styles.textInput, styles.selectInput]}
              onPress={() => setShowServiceTypes(!showServiceTypes)}
            >
              <Text style={[styles.selectText, !formData.serviceType && styles.placeholderText]}>
                {formData.serviceType || 'Selecciona un tipo de servicio'}
              </Text>
            </TouchableOpacity>
            
            {showServiceTypes && (
              <View style={styles.dropdown}>
                {serviceTypes.map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={styles.dropdownItem}
                    onPress={() => selectServiceType(type)}
                  >
                    <Text style={styles.dropdownText}>{type}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Descripción del Servicio</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              value={formData.description}
              onChangeText={(text) => updateField('description', text)}
              placeholder="Describe brevemente los servicios que ofreces..."
              placeholderTextColor="#999"
              multiline
              numberOfLines={3}
              maxLength={200}
            />
          </View>
        </View>

        {/* Personal Information */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <User size={20} color="#D81B60" />
            <Text style={styles.sectionTitle}>Información Personal</Text>
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Nombre del Propietario *</Text>
            <TextInput
              style={styles.textInput}
              value={formData.ownerName}
              onChangeText={(text) => updateField('ownerName', text)}
              placeholder="Tu nombre completo"
              placeholderTextColor="#999"
              maxLength={50}
            />
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Teléfono *</Text>
            <TextInput
              style={styles.textInput}
              value={formData.phone}
              onChangeText={(text) => updateField('phone', text)}
              placeholder="8888-8888"
              placeholderTextColor="#999"
              keyboardType="phone-pad"
              maxLength={15}
            />
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email *</Text>
            <TextInput
              style={styles.textInput}
              value={formData.email}
              onChangeText={(text) => updateField('email', text)}
              placeholder="tu@email.com"
              placeholderTextColor="#999"
              keyboardType="email-address"
              autoCapitalize="none"
              maxLength={50}
            />
          </View>
        </View>

        {/* Location Information */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MapPin size={20} color="#D81B60" />
            <Text style={styles.sectionTitle}>Ubicación</Text>
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Dirección</Text>
            <TextInput
              style={styles.textInput}
              value={formData.address}
              onChangeText={(text) => updateField('address', text)}
              placeholder="Dirección completa"
              placeholderTextColor="#999"
              maxLength={100}
            />
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Ciudad</Text>
            <TextInput
              style={styles.textInput}
              value={formData.city}
              onChangeText={(text) => updateField('city', text)}
              placeholder="Tu ciudad"
              placeholderTextColor="#999"
              maxLength={30}
            />
          </View>
        </View>

        {/* Experience */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Clock size={20} color="#D81B60" />
            <Text style={styles.sectionTitle}>Experiencia</Text>
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Años de Experiencia</Text>
            <TextInput
              style={styles.textInput}
              value={formData.experience}
              onChangeText={(text) => updateField('experience', text)}
              placeholder="Ej: 5 años"
              placeholderTextColor="#999"
              maxLength={20}
            />
          </View>
        </View>

        {/* Submit Button */}
        <TouchableOpacity 
          style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <Text style={styles.submitButtonText}>Enviando...</Text>
          ) : (
            <>
              <Check size={20} color="white" />
              <Text style={styles.submitButtonText}>Enviar Solicitud</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Info Note */}
        <View style={styles.infoNote}>
          <Text style={styles.infoText}>
            📋 Después de enviar tu solicitud, nuestro equipo la revisará y te contactará 
            en un plazo de 24-48 horas para completar el proceso de verificación.
          </Text>
        </View>
      </ScrollView>

      {/* Error Modal */}
      <Modal
        visible={showErrorModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowErrorModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Error</Text>
              <TouchableOpacity onPress={() => setShowErrorModal(false)}>
                <X size={24} color="#666" />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalMessage}>{errorMessage}</Text>
            <TouchableOpacity 
              style={styles.modalButton}
              onPress={() => setShowErrorModal(false)}
            >
              <Text style={styles.modalButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Success Modal */}
      <Modal
        visible={showSuccessModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSuccessModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>¡Registro Exitoso!</Text>
              <TouchableOpacity onPress={() => setShowSuccessModal(false)}>
                <X size={24} color="#666" />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalMessage}>
              Tu solicitud ha sido enviada. Te contactaremos pronto para completar el proceso de verificación.
            </Text>
            <TouchableOpacity 
              style={styles.modalButton}
              onPress={() => {
                setShowSuccessModal(false);
                router.back();
              }}
            >
              <Text style={styles.modalButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  backButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#FAFAFA',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  selectInput: {
    justifyContent: 'center',
  },
  selectText: {
    fontSize: 16,
    color: '#333',
  },
  placeholderText: {
    color: '#999',
  },
  dropdown: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 12,
    marginTop: 4,
    maxHeight: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dropdownItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  dropdownText: {
    fontSize: 16,
    color: '#333',
  },
  submitButton: {
    backgroundColor: '#D81B60',
    borderRadius: 16,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginVertical: 20,
    shadowColor: '#D81B60',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  submitButtonDisabled: {
    backgroundColor: '#999',
    shadowOpacity: 0,
    elevation: 0,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  infoNote: {
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  infoText: {
    fontSize: 14,
    color: '#1976D2',
    lineHeight: 20,
    textAlign: 'center',
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
    borderRadius: 16,
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
  modalMessage: {
    fontSize: 16,
    color: '#666',
    lineHeight: 22,
    marginBottom: 20,
  },
  modalButton: {
    backgroundColor: '#D81B60',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  modalButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});