import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, TextInput, Modal, Image, Platform } from 'react-native';
import { Stack, router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import * as ImagePicker from 'expo-image-picker';
import { 
  ChevronLeft, 
  User, 
  Mail, 
  Calendar, 
  Camera, 
  Upload, 
  X, 
  Lock,
  Key,
  Save,
  AlertTriangle
} from 'lucide-react-native';

export default function ClientEditProfileScreen() {
  const { user, changePassword, resetPassword } = useAuth();
  const { t } = useLanguage();
  
  // Profile data state
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    birthDate: '',
    profileImage: null as string | null
  });
  
  // Modal states
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  
  // Password change state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  
  // Reset password state
  const [resetEmail, setResetEmail] = useState('');
  const [loading, setLoading] = useState(false);

  // Early return for non-clients
  if (user?.userType !== 'client') {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: 'Acceso Denegado' }} />
        <Text style={styles.errorText}>Esta función es solo para clientes</Text>
      </View>
    );
  }

  const handleSaveProfile = () => {
    if (!profileData.name.trim()) {
      Alert.alert('Error', 'El nombre es obligatorio');
      return;
    }
    
    if (!profileData.email.trim()) {
      Alert.alert('Error', 'El correo electrónico es obligatorio');
      return;
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(profileData.email)) {
      Alert.alert('Error', 'Por favor ingresa un correo electrónico válido');
      return;
    }
    
    Alert.alert(
      'Perfil Actualizado',
      'Tu información personal ha sido actualizada exitosamente.',
      [{ text: 'OK' }]
    );
  };

  const handleChangePassword = async () => {
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      Alert.alert('Error', 'Por favor completa todos los campos');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      Alert.alert('Error', 'Las contraseñas no coinciden');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      Alert.alert('Error', 'La nueva contraseña debe tener al menos 6 caracteres');
      return;
    }

    setLoading(true);
    try {
      await changePassword(passwordData.currentPassword, passwordData.newPassword);
      Alert.alert('Éxito', 'Contraseña cambiada exitosamente');
      setShowPasswordModal(false);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Error al cambiar la contraseña');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!resetEmail) {
      Alert.alert('Error', 'Por favor ingresa tu correo electrónico');
      return;
    }

    setLoading(true);
    try {
      await resetPassword(resetEmail);
      Alert.alert('Éxito', 'Se ha enviado un correo de recuperación a tu email');
      setShowResetModal(false);
      setResetEmail('');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Error al enviar el correo de recuperación');
    } finally {
      setLoading(false);
    }
  };

  const requestPermissions = async () => {
    if (Platform.OS !== 'web') {
      const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
      const { status: mediaLibraryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (cameraStatus !== 'granted' || mediaLibraryStatus !== 'granted') {
        Alert.alert(
          'Permisos Requeridos',
          'Necesitamos permisos de cámara y galería para cambiar tu foto de perfil.',
          [{ text: 'OK' }]
        );
        return false;
      }
    }
    return true;
  };

  const handleImageUpload = async (method: 'camera' | 'gallery') => {
    const hasPermissions = await requestPermissions();
    if (!hasPermissions && Platform.OS !== 'web') return;

    try {
      let result: any;
      
      if (method === 'camera') {
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [1, 1], // Square aspect for profile photos
          quality: 0.8,
        });
      } else {
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [1, 1], // Square aspect for profile photos
          quality: 0.8,
        });
      }

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        
        // Check file size (max 5MB for profile photos)
        if (asset.fileSize && asset.fileSize > 5 * 1024 * 1024) {
          Alert.alert(
            'Archivo Muy Grande',
            'La foto de perfil debe ser menor a 5MB. Por favor selecciona una imagen más pequeña.',
            [{ text: 'OK' }]
          );
          return;
        }
        
        setProfileData(prev => ({ ...prev, profileImage: asset.uri }));
        setShowImageModal(false);
        Alert.alert('Éxito', 'Foto de perfil actualizada correctamente');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      Alert.alert('Error', 'No se pudo actualizar la foto de perfil. Inténtalo de nuevo.');
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{
          title: 'Editar Perfil',
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

      <ScrollView style={styles.content}>
        {/* Profile Photo Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Camera size={24} color="#D81B60" />
            <Text style={styles.sectionTitle}>Foto de Perfil</Text>
          </View>
          
          <View style={styles.profilePhotoContainer}>
            {profileData.profileImage ? (
              <Image source={{ uri: profileData.profileImage }} style={styles.profilePhoto} />
            ) : (
              <View style={styles.defaultProfilePhoto}>
                <User size={48} color="#999" />
              </View>
            )}
            
            <TouchableOpacity 
              style={styles.changePhotoButton}
              onPress={() => setShowImageModal(true)}
            >
              <Camera size={20} color="#D81B60" />
              <Text style={styles.changePhotoText}>Cambiar Foto</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Personal Information Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <User size={24} color="#D81B60" />
            <Text style={styles.sectionTitle}>Información Personal</Text>
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Nombre Completo *</Text>
            <View style={styles.inputContainer}>
              <User size={20} color="#666" />
              <TextInput
                style={styles.textInput}
                value={profileData.name}
                onChangeText={(text) => setProfileData(prev => ({ ...prev, name: text }))}
                placeholder="Tu nombre completo"
                placeholderTextColor="#666"
              />
            </View>
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Correo Electrónico *</Text>
            <View style={styles.inputContainer}>
              <Mail size={20} color="#666" />
              <TextInput
                style={styles.textInput}
                value={profileData.email}
                onChangeText={(text) => setProfileData(prev => ({ ...prev, email: text }))}
                placeholder="tu@email.com"
                placeholderTextColor="#666"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Fecha de Nacimiento</Text>
            <View style={styles.inputContainer}>
              <Calendar size={20} color="#666" />
              <TextInput
                style={styles.textInput}
                value={profileData.birthDate}
                onChangeText={(text) => setProfileData(prev => ({ ...prev, birthDate: text }))}
                placeholder="DD/MM/AAAA"
                placeholderTextColor="#666"
              />
            </View>
          </View>
          
          <TouchableOpacity style={styles.saveButton} onPress={handleSaveProfile}>
            <Save size={20} color="white" />
            <Text style={styles.saveButtonText}>Guardar Cambios</Text>
          </TouchableOpacity>
        </View>

        {/* Security Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Lock size={24} color="#D81B60" />
            <Text style={styles.sectionTitle}>Seguridad</Text>
          </View>
          
          <TouchableOpacity 
            style={styles.securityOption}
            onPress={() => setShowPasswordModal(true)}
          >
            <Lock size={20} color="#666" />
            <View style={styles.securityOptionContent}>
              <Text style={styles.securityOptionTitle}>Cambiar Contraseña</Text>
              <Text style={styles.securityOptionSubtitle}>Actualizar tu contraseña de acceso</Text>
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.securityOption}
            onPress={() => setShowResetModal(true)}
          >
            <Key size={20} color="#666" />
            <View style={styles.securityOptionContent}>
              <Text style={styles.securityOptionTitle}>Recuperar Contraseña</Text>
              <Text style={styles.securityOptionSubtitle}>Enviar correo de recuperación</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Payment Options Section (Future) */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <AlertTriangle size={24} color="#FF9800" />
            <Text style={styles.sectionTitle}>Opciones de Pago</Text>
          </View>
          
          <View style={styles.comingSoonContainer}>
            <Text style={styles.comingSoonText}>
              Las opciones de pago estarán disponibles próximamente. Podrás agregar tarjetas de crédito, 
              cuentas bancarias y otros métodos de pago para facilitar tus reservas.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Change Password Modal */}
      <Modal
        visible={showPasswordModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPasswordModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Cambiar Contraseña</Text>
              <TouchableOpacity
                onPress={() => setShowPasswordModal(false)}
                style={styles.closeButton}
              >
                <X size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <View style={styles.inputContainer}>
              <Lock size={20} color="#666" />
              <TextInput
                style={styles.modalInput}
                placeholder="Contraseña actual"
                value={passwordData.currentPassword}
                onChangeText={(text) => setPasswordData({ ...passwordData, currentPassword: text })}
                secureTextEntry
                placeholderTextColor="#666"
              />
            </View>

            <View style={styles.inputContainer}>
              <Lock size={20} color="#666" />
              <TextInput
                style={styles.modalInput}
                placeholder="Nueva contraseña"
                value={passwordData.newPassword}
                onChangeText={(text) => setPasswordData({ ...passwordData, newPassword: text })}
                secureTextEntry
                placeholderTextColor="#666"
              />
            </View>

            <View style={styles.inputContainer}>
              <Lock size={20} color="#666" />
              <TextInput
                style={styles.modalInput}
                placeholder="Confirmar nueva contraseña"
                value={passwordData.confirmPassword}
                onChangeText={(text) => setPasswordData({ ...passwordData, confirmPassword: text })}
                secureTextEntry
                placeholderTextColor="#666"
              />
            </View>

            <TouchableOpacity
              style={styles.modalButton}
              onPress={handleChangePassword}
              disabled={loading}
            >
              <Text style={styles.modalButtonText}>
                {loading ? 'Cambiando...' : 'Cambiar Contraseña'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Reset Password Modal */}
      <Modal
        visible={showResetModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowResetModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Recuperar Contraseña</Text>
              <TouchableOpacity
                onPress={() => setShowResetModal(false)}
                style={styles.closeButton}
              >
                <X size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalDescription}>
              Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña.
            </Text>

            <View style={styles.inputContainer}>
              <Mail size={20} color="#666" />
              <TextInput
                style={styles.modalInput}
                placeholder="Correo electrónico"
                value={resetEmail}
                onChangeText={setResetEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor="#666"
              />
            </View>

            <TouchableOpacity
              style={styles.modalButton}
              onPress={handleResetPassword}
              disabled={loading}
            >
              <Text style={styles.modalButtonText}>
                {loading ? 'Enviando...' : 'Enviar Correo'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Image Upload Modal */}
      <Modal
        visible={showImageModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowImageModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Cambiar Foto de Perfil</Text>
              <TouchableOpacity
                onPress={() => setShowImageModal(false)}
                style={styles.closeButton}
              >
                <X size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.imageOptionsContainer}>
              <Text style={styles.imageOptionsTitle}>Selecciona una opción:</Text>
              
              <TouchableOpacity 
                style={styles.imageOption}
                onPress={() => handleImageUpload('camera')}
              >
                <Camera size={24} color="#D81B60" />
                <View style={styles.imageOptionContent}>
                  <Text style={styles.imageOptionTitle}>Tomar Foto</Text>
                  <Text style={styles.imageOptionDescription}>Captura una nueva foto con la cámara</Text>
                </View>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.imageOption}
                onPress={() => handleImageUpload('gallery')}
              >
                <Upload size={24} color="#D81B60" />
                <View style={styles.imageOptionContent}>
                  <Text style={styles.imageOptionTitle}>Galería de Fotos</Text>
                  <Text style={styles.imageOptionDescription}>Selecciona una foto desde tu galería</Text>
                </View>
              </TouchableOpacity>
              
              <View style={styles.imageRequirements}>
                <Text style={styles.imageRequirementsTitle}>📋 Requisitos de la Foto</Text>
                <Text style={styles.imageRequirementsText}>• Formato: JPG, PNG</Text>
                <Text style={styles.imageRequirementsText}>• Tamaño máximo: 5MB</Text>
                <Text style={styles.imageRequirementsText}>• Recomendado: Imagen cuadrada</Text>
              </View>
            </View>
            
            <TouchableOpacity 
              style={styles.cancelButton}
              onPress={() => setShowImageModal(false)}
            >
              <Text style={styles.cancelButtonText}>Cancelar</Text>
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
    paddingTop: 20,
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  profilePhotoContainer: {
    alignItems: 'center',
    gap: 16,
  },
  profilePhoto: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: '#D81B60',
  },
  defaultProfilePhoto: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#E5E5E5',
  },
  changePhotoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D81B60',
    backgroundColor: '#FCE4EC',
  },
  changePhotoText: {
    fontSize: 16,
    color: '#D81B60',
    fontWeight: '600',
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 4,
    gap: 12,
  },
  textInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
  },
  saveButton: {
    backgroundColor: '#D81B60',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  securityOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    marginBottom: 12,
    gap: 16,
  },
  securityOptionContent: {
    flex: 1,
  },
  securityOptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  securityOptionSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  comingSoonContainer: {
    backgroundColor: '#FFF3E0',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  comingSoonText: {
    fontSize: 14,
    color: '#F57C00',
    lineHeight: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    marginTop: 100,
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
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  modalDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
    lineHeight: 20,
  },
  modalInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
  },
  modalButton: {
    backgroundColor: '#D81B60',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  modalButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  imageOptionsContainer: {
    paddingVertical: 16,
  },
  imageOptionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  imageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    gap: 16,
  },
  imageOptionContent: {
    flex: 1,
  },
  imageOptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  imageOptionDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 18,
  },
  imageRequirements: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  imageRequirementsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  imageRequirementsText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
    lineHeight: 16,
  },
  cancelButton: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    marginTop: 12,
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },
});