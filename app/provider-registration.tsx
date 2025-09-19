import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal, Alert, Platform } from 'react-native';
import { Stack, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, User, MapPin, Building2, Clock, Check, X, FileText, Upload, CheckCircle, AlertCircle } from 'lucide-react-native';
import * as DocumentPicker from 'expo-document-picker';

interface DocumentFile {
  uri: string;
  name: string;
  type: string;
  size: number;
  uploadedAt: Date;
  isValid?: boolean;
  expiryDate?: Date;
}

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
  documents: {
    licencia?: DocumentFile;
    hojaDelincuencia?: DocumentFile;
    dekra?: DocumentFile;
    marchamo?: DocumentFile;
  };
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

const requiredDocuments = [
  {
    key: 'licencia' as const,
    label: 'Licencia de Conducir',
    description: 'Licencia vigente (para servicios de transporte)',
    required: false,
    validityMonths: 60 // 5 años
  },
  {
    key: 'hojaDelincuencia' as const,
    label: 'Hoja de Delincuencia',
    description: 'Certificado de antecedentes penales (máximo 3 meses)',
    required: true,
    validityMonths: 3
  },
  {
    key: 'dekra' as const,
    label: 'Certificado DEKRA',
    description: 'Revisión técnica vehicular (para servicios de transporte)',
    required: false,
    validityMonths: 12
  },
  {
    key: 'marchamo' as const,
    label: 'Marchamo',
    description: 'Comprobante de pago de marchamo vigente',
    required: false,
    validityMonths: 12
  }
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
    description: '',
    documents: {}
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showServiceTypes, setShowServiceTypes] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [uploadingDocument, setUploadingDocument] = useState<string | null>(null);
  const insets = useSafeAreaInsets();

  const updateField = (field: keyof ProviderFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const showError = (message: string) => {
    setErrorMessage(message);
    setShowErrorModal(true);
  };

  const isDocumentExpired = (document: DocumentFile, validityMonths: number): boolean => {
    if (!document.expiryDate) return false;
    const now = new Date();
    return document.expiryDate < now;
  };

  const getDocumentExpiryDate = (uploadDate: Date, validityMonths: number): Date => {
    const expiryDate = new Date(uploadDate);
    expiryDate.setMonth(expiryDate.getMonth() + validityMonths);
    return expiryDate;
  };

  const validateDocument = (document: DocumentFile, validityMonths: number): boolean => {
    // Validate file size (max 5MB)
    if (document.size > 5 * 1024 * 1024) {
      showError('El archivo no puede ser mayor a 5MB');
      return false;
    }

    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedTypes.includes(document.type)) {
      showError('Solo se permiten archivos PDF, JPG o PNG');
      return false;
    }

    // Check if document is expired
    if (document.expiryDate && isDocumentExpired(document, validityMonths)) {
      showError('El documento ha expirado. Por favor sube un documento vigente.');
      return false;
    }

    return true;
  };

  const pickDocument = async (documentType: keyof typeof formData.documents) => {
    try {
      setUploadingDocument(documentType);
      
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
        multiple: false
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const documentInfo = requiredDocuments.find(doc => doc.key === documentType);
        
        if (!documentInfo) {
          showError('Tipo de documento no válido');
          return;
        }

        const uploadDate = new Date();
        const expiryDate = getDocumentExpiryDate(uploadDate, documentInfo.validityMonths);
        
        const documentFile: DocumentFile = {
          uri: asset.uri,
          name: asset.name || `${documentType}.pdf`,
          type: asset.mimeType || 'application/pdf',
          size: asset.size || 0,
          uploadedAt: uploadDate,
          expiryDate,
          isValid: true
        };

        if (validateDocument(documentFile, documentInfo.validityMonths)) {
          setFormData(prev => ({
            ...prev,
            documents: {
              ...prev.documents,
              [documentType]: documentFile
            }
          }));
          
          console.log(`Document ${documentType} uploaded successfully:`, documentFile);
        }
      }
    } catch (error) {
      console.error('Error picking document:', error);
      showError('Error al seleccionar el documento. Por favor intenta de nuevo.');
    } finally {
      setUploadingDocument(null);
    }
  };

  const removeDocument = (documentType: keyof typeof formData.documents) => {
    if (Platform.OS === 'web') {
      const confirmed = confirm('¿Estás seguro de que quieres eliminar este documento?');
      if (confirmed) {
        setFormData(prev => {
          const newDocuments = { ...prev.documents };
          delete newDocuments[documentType];
          return {
            ...prev,
            documents: newDocuments
          };
        });
      }
    } else {
      Alert.alert(
        'Eliminar Documento',
        '¿Estás seguro de que quieres eliminar este documento?',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Eliminar',
            style: 'destructive',
            onPress: () => {
              setFormData(prev => {
                const newDocuments = { ...prev.documents };
                delete newDocuments[documentType];
                return {
                  ...prev,
                  documents: newDocuments
                };
              });
            }
          }
        ]
      );
    }
  };

  const validateForm = (): boolean => {
    const required = ['businessName', 'ownerName', 'phone', 'email', 'serviceType'];
    
    for (const field of required) {
      const value = formData[field as keyof ProviderFormData];
      if (typeof value === 'string' && !value?.trim()) {
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
    
    // Validate required documents
    const requiredDocs = requiredDocuments.filter(doc => doc.required);
    for (const docInfo of requiredDocs) {
      const document = formData.documents[docInfo.key];
      if (!document) {
        showError(`El documento ${docInfo.label} es obligatorio`);
        return false;
      }
      
      if (document.expiryDate && isDocumentExpired(document, docInfo.validityMonths)) {
        showError(`El documento ${docInfo.label} ha expirado. Por favor sube un documento vigente.`);
        return false;
      }
    }
    
    // Validate transport-specific documents if service type is transport
    if (formData.serviceType === 'Transporte') {
      const transportDocs = ['licencia', 'dekra', 'marchamo'] as const;
      for (const docType of transportDocs) {
        const document = formData.documents[docType];
        if (!document) {
          const docInfo = requiredDocuments.find(doc => doc.key === docType);
          showError(`Para servicios de transporte, el documento ${docInfo?.label} es obligatorio`);
          return false;
        }
      }
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

        {/* Documents Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <FileText size={20} color="#D81B60" />
            <Text style={styles.sectionTitle}>Documentos Requeridos</Text>
          </View>
          
          <Text style={styles.documentsNote}>
            📄 Sube los documentos vigentes requeridos. Los archivos deben ser PDF, JPG o PNG (máximo 5MB).
          </Text>
          
          {requiredDocuments.map((docInfo) => {
            const document = formData.documents[docInfo.key];
            const isRequired = docInfo.required || (formData.serviceType === 'Transporte' && ['licencia', 'dekra', 'marchamo'].includes(docInfo.key));
            const isExpired = document && document.expiryDate && isDocumentExpired(document, docInfo.validityMonths);
            
            return (
              <View key={docInfo.key} style={styles.documentItem}>
                <View style={styles.documentHeader}>
                  <Text style={styles.documentLabel}>
                    {docInfo.label}
                    {isRequired && <Text style={styles.requiredAsterisk}> *</Text>}
                  </Text>
                  {document && (
                    <View style={[styles.documentStatus, isExpired ? styles.documentExpired : styles.documentValid]}>
                      {isExpired ? (
                        <AlertCircle size={16} color="#F44336" />
                      ) : (
                        <CheckCircle size={16} color="#4CAF50" />
                      )}
                      <Text style={[styles.documentStatusText, isExpired ? styles.expiredText : styles.validText]}>
                        {isExpired ? 'Expirado' : 'Válido'}
                      </Text>
                    </View>
                  )}
                </View>
                
                <Text style={styles.documentDescription}>{docInfo.description}</Text>
                
                {document ? (
                  <View style={styles.uploadedDocument}>
                    <View style={styles.documentInfo}>
                      <FileText size={20} color="#4CAF50" />
                      <View style={styles.documentDetails}>
                        <Text style={styles.documentName} numberOfLines={1}>{document.name}</Text>
                        <Text style={styles.documentMeta}>
                          {(document.size / 1024 / 1024).toFixed(2)} MB • 
                          Subido: {document.uploadedAt.toLocaleDateString()}
                          {document.expiryDate && (
                            <Text style={isExpired ? styles.expiredDate : styles.validDate}>
                              {' • '}Vence: {document.expiryDate.toLocaleDateString()}
                            </Text>
                          )}
                        </Text>
                      </View>
                    </View>
                    
                    <View style={styles.documentActions}>
                      <TouchableOpacity
                        style={styles.replaceButton}
                        onPress={() => pickDocument(docInfo.key)}
                        disabled={uploadingDocument === docInfo.key}
                      >
                        <Upload size={16} color="#D81B60" />
                        <Text style={styles.replaceButtonText}>Reemplazar</Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity
                        style={styles.removeButton}
                        onPress={() => removeDocument(docInfo.key)}
                      >
                        <X size={16} color="#F44336" />
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={[styles.uploadButton, uploadingDocument === docInfo.key && styles.uploadButtonDisabled]}
                    onPress={() => pickDocument(docInfo.key)}
                    disabled={uploadingDocument === docInfo.key}
                  >
                    <Upload size={20} color={uploadingDocument === docInfo.key ? '#999' : '#D81B60'} />
                    <Text style={[styles.uploadButtonText, uploadingDocument === docInfo.key && styles.uploadButtonTextDisabled]}>
                      {uploadingDocument === docInfo.key ? 'Subiendo...' : 'Subir Documento'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          })}
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
  documentsNote: {
    fontSize: 14,
    color: '#666',
    backgroundColor: '#F0F8FF',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    lineHeight: 20,
  },
  documentItem: {
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  documentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  documentLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    flex: 1,
  },
  requiredAsterisk: {
    color: '#F44336',
  },
  documentStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  documentValid: {
    backgroundColor: '#E8F5E8',
  },
  documentExpired: {
    backgroundColor: '#FFEBEE',
  },
  documentStatusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  validText: {
    color: '#4CAF50',
  },
  expiredText: {
    color: '#F44336',
  },
  documentDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 18,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FFF',
    borderWidth: 2,
    borderColor: '#D81B60',
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 16,
  },
  uploadButtonDisabled: {
    borderColor: '#999',
  },
  uploadButtonText: {
    fontSize: 16,
    color: '#D81B60',
    fontWeight: '500',
  },
  uploadButtonTextDisabled: {
    color: '#999',
  },
  uploadedDocument: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 12,
  },
  documentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  documentDetails: {
    flex: 1,
  },
  documentName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 2,
  },
  documentMeta: {
    fontSize: 12,
    color: '#666',
  },
  validDate: {
    color: '#4CAF50',
  },
  expiredDate: {
    color: '#F44336',
  },
  documentActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  replaceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#D81B60',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    flex: 1,
    justifyContent: 'center',
  },
  replaceButtonText: {
    fontSize: 14,
    color: '#D81B60',
    fontWeight: '500',
  },
  removeButton: {
    backgroundColor: '#FFEBEE',
    borderRadius: 8,
    padding: 8,
  },
});