import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useProvider } from '@/contexts/ProviderContext';
import { SERVICE_CATEGORIES } from '@/src/shared/types';
import { X, Upload, AlertCircle } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';

export default function ServiceFormScreen() {
  const { serviceId } = useLocalSearchParams<{ serviceId?: string }>();
  const { 
    services, 
    profile,
    addService, 
    updateService, 
    uploadServicePhoto,
    deleteServicePhoto,
  } = useProvider();

  const isEditing = !!serviceId;
  const existingService = services.find(s => s.id === serviceId);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    price: '',
    currency: 'USD',
    duration: '',
    photos: [] as string[],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  useEffect(() => {
    if (existingService) {
      setFormData({
        name: existingService.name,
        description: existingService.description,
        category: existingService.category,
        price: existingService.price.toString(),
        currency: existingService.currency,
        duration: existingService.duration?.toString() || '',
        photos: existingService.photos || [],
      });
    }
  }, [existingService]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es requerido';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'La descripción es requerida';
    }

    if (!formData.category) {
      newErrors.category = 'Selecciona una categoría';
    }

    if (!formData.price || parseFloat(formData.price) <= 0) {
      newErrors.price = 'El precio debe ser mayor a 0';
    }

    if (!isEditing) {
      const existingServiceWithName = services.find(
        s => s.name.toLowerCase() === formData.name.toLowerCase().trim()
      );
      if (existingServiceWithName) {
        newErrors.name = 'Ya existe un servicio con este nombre';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permiso Denegado', 'Necesitamos acceso a tu galería para subir fotos');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await handleUploadPhoto(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'No se pudo seleccionar la imagen');
    }
  };

  const handleUploadPhoto = async (uri: string) => {
    if (!profile) {
      Alert.alert('Error', 'No se encontró el perfil del proveedor');
      return;
    }

    if (formData.photos.length >= 5) {
      Alert.alert('Límite Alcanzado', 'Puedes subir máximo 5 fotos por servicio');
      return;
    }

    try {
      setUploadingPhoto(true);
      const photoUrl = await uploadServicePhoto(
        profile.userId,
        serviceId || 'temp',
        uri
      );
      
      setFormData(prev => ({
        ...prev,
        photos: [...prev.photos, photoUrl],
      }));
    } catch (error: any) {
      Alert.alert('Error', error.message || 'No se pudo subir la foto');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleDeletePhoto = async (photoUrl: string) => {
    Alert.alert(
      'Eliminar Foto',
      '¿Estás seguro de que deseas eliminar esta foto?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteServicePhoto(photoUrl);
              setFormData(prev => ({
                ...prev,
                photos: prev.photos.filter(p => p !== photoUrl),
              }));
            } catch (error: any) {
              Alert.alert('Error', error.message || 'No se pudo eliminar la foto');
            }
          },
        },
      ]
    );
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      Alert.alert('Error', 'Por favor corrige los errores en el formulario');
      return;
    }

    if (!profile) {
      Alert.alert('Error', 'No se encontró el perfil del proveedor');
      return;
    }

    try {
      setSubmitting(true);

      const serviceData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        category: formData.category,
        price: parseFloat(formData.price),
        currency: formData.currency,
        duration: formData.duration ? parseInt(formData.duration) : undefined,
        photos: formData.photos,
        isActive: true,
        status: 'pending_approval' as const,
      };

      if (isEditing && serviceId) {
        await updateService(serviceId, serviceData);
        Alert.alert('Éxito', 'Servicio actualizado correctamente');
      } else {
        await addService(profile.userId, serviceData);
        Alert.alert(
          'Éxito', 
          'Servicio agregado. Estará visible una vez aprobado por el administrador'
        );
      }

      router.back();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'No se pudo guardar el servicio');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: isEditing ? 'Editar Servicio' : 'Agregar Servicio',
        }} 
      />
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nombre del Servicio *</Text>
            <TextInput
              style={[styles.input, errors.name && styles.inputError]}
              value={formData.name}
              onChangeText={(text) => {
                setFormData(prev => ({ ...prev, name: text }));
                setErrors(prev => ({ ...prev, name: '' }));
              }}
              placeholder="Ej: Transporte Ejecutivo"
              placeholderTextColor="#9CA3AF"
            />
            {errors.name && (
              <Text style={styles.errorText}>{errors.name}</Text>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Categoría *</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.categoryRow}>
                {SERVICE_CATEGORIES.map((cat: { id: string; name: string; description: string; icon: string }) => (
                  <TouchableOpacity
                    key={cat.id}
                    style={[
                      styles.categoryChip,
                      formData.category === cat.name && styles.categoryChipSelected,
                    ]}
                    onPress={() => {
                      setFormData(prev => ({ ...prev, category: cat.name }));
                      setErrors(prev => ({ ...prev, category: '' }));
                    }}
                  >
                    <Text
                      style={[
                        styles.categoryChipText,
                        formData.category === cat.name && styles.categoryChipTextSelected,
                      ]}
                    >
                      {cat.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
            {errors.category && (
              <Text style={styles.errorText}>{errors.category}</Text>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Descripción *</Text>
            <TextInput
              style={[styles.textArea, errors.description && styles.inputError]}
              value={formData.description}
              onChangeText={(text) => {
                setFormData(prev => ({ ...prev, description: text }));
                setErrors(prev => ({ ...prev, description: '' }));
              }}
              placeholder="Describe tu servicio en detalle"
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
            {errors.description && (
              <Text style={styles.errorText}>{errors.description}</Text>
            )}
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.label}>Precio *</Text>
              <TextInput
                style={[styles.input, errors.price && styles.inputError]}
                value={formData.price}
                onChangeText={(text) => {
                  setFormData(prev => ({ ...prev, price: text }));
                  setErrors(prev => ({ ...prev, price: '' }));
                }}
                placeholder="0.00"
                placeholderTextColor="#9CA3AF"
                keyboardType="decimal-pad"
              />
              {errors.price && (
                <Text style={styles.errorText}>{errors.price}</Text>
              )}
            </View>

            <View style={[styles.inputGroup, { width: 100 }]}>
              <Text style={styles.label}>Moneda</Text>
              <View style={styles.currencyPicker}>
                <Text style={styles.currencyText}>{formData.currency}</Text>
              </View>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Duración (minutos)</Text>
            <TextInput
              style={styles.input}
              value={formData.duration}
              onChangeText={(text) => setFormData(prev => ({ ...prev, duration: text }))}
              placeholder="Ej: 60"
              placeholderTextColor="#9CA3AF"
              keyboardType="number-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Fotos del Servicio</Text>
            <Text style={styles.helperText}>Máximo 5 fotos</Text>
            
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.photosRow}>
                {formData.photos.map((photo, index) => (
                  <View key={index} style={styles.photoContainer}>
                    <Image source={{ uri: photo }} style={styles.photo} />
                    <TouchableOpacity
                      style={styles.deletePhotoButton}
                      onPress={() => handleDeletePhoto(photo)}
                    >
                      <X size={16} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>
                ))}

                {formData.photos.length < 5 && (
                  <TouchableOpacity
                    style={styles.uploadButton}
                    onPress={handlePickImage}
                    disabled={uploadingPhoto}
                  >
                    {uploadingPhoto ? (
                      <ActivityIndicator size="small" color="#007AFF" />
                    ) : (
                      <>
                        <Upload size={24} color="#007AFF" />
                        <Text style={styles.uploadButtonText}>Subir Foto</Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}
              </View>
            </ScrollView>
          </View>

          {!isEditing && (
            <View style={styles.infoBox}>
              <AlertCircle size={20} color="#3B82F6" />
              <Text style={styles.infoText}>
                Tu servicio será revisado por un administrador antes de ser visible para los clientes.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => router.back()}
          disabled={submitting}
        >
          <Text style={styles.cancelButtonText}>Cancelar</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.submitButtonText}>
              {isEditing ? 'Actualizar' : 'Agregar'}
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
    backgroundColor: '#F9FAFB',
  },
  scrollView: {
    flex: 1,
  },
  form: {
    padding: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  helperText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#111827',
  },
  inputError: {
    borderColor: '#EF4444',
  },
  textArea: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#111827',
    minHeight: 100,
  },
  errorText: {
    fontSize: 14,
    color: '#EF4444',
    marginTop: 4,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  categoryRow: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 4,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  categoryChipSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  categoryChipText: {
    fontSize: 14,
    color: '#374151',
  },
  categoryChipTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  currencyPicker: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  currencyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  photosRow: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 4,
  },
  photoContainer: {
    position: 'relative',
  },
  photo: {
    width: 120,
    height: 120,
    borderRadius: 8,
  },
  deletePhotoButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#EF4444',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadButton: {
    width: 120,
    height: 120,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  uploadButtonText: {
    fontSize: 12,
    color: '#007AFF',
    marginTop: 4,
  },
  infoBox: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#1E40AF',
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  cancelButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  submitButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#007AFF',
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
