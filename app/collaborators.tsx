import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Modal, TextInput, Image, Platform } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import * as ImagePicker from 'expo-image-picker';
import { Users, Plus, Edit, Trash2, Lock, Unlock, X, Check, Camera, Upload } from 'lucide-react-native';
import { Stack } from 'expo-router';

interface Collaborator {
  id: string;
  name: string;
  alias: string;
  username: string;
  password: string;
  services: string[];
  avatar: string;
  customPhoto?: string;
  isActive: boolean;
  isBlocked: boolean;
  createdAt: string;
}

const mockCollaborators: Collaborator[] = [
  {
    id: '1',
    name: 'Luis Pérez Morales',
    alias: 'Luis',
    username: 'luis_perez',
    password: 'luis123',
    services: ['Limpieza General', 'Limpieza Profunda'],
    avatar: '👨‍💼',
    isActive: true,
    isBlocked: false,
    createdAt: '2024-01-15'
  },
  {
    id: '2',
    name: 'Carmen Solís Vargas',
    alias: 'Carmen',
    username: 'carmen_solis',
    password: 'carmen456',
    services: ['Organización', 'Limpieza de Ventanas'],
    avatar: '👩‍💼',
    isActive: true,
    isBlocked: false,
    createdAt: '2024-02-20'
  },
  {
    id: '3',
    name: 'Roberto Jiménez',
    alias: 'Roberto',
    username: 'roberto_j',
    password: 'roberto789',
    services: ['Mantenimiento General'],
    avatar: '👨‍🔧',
    isActive: false,
    isBlocked: true,
    createdAt: '2024-03-10'
  }
];

const availableServices = [
  'Limpieza General',
  'Limpieza Profunda', 
  'Limpieza de Oficina',
  'Organización',
  'Limpieza de Ventanas',
  'Limpieza Post-Construcción',
  'Mantenimiento General'
];

export default function CollaboratorsScreen() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [collaborators, setCollaborators] = useState<Collaborator[]>(mockCollaborators);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [photoModalType, setPhotoModalType] = useState<'new' | 'edit'>('new');
  const [selectedCollaborator, setSelectedCollaborator] = useState<Collaborator | null>(null);
  const [editCollaborator, setEditCollaborator] = useState({
    name: '',
    alias: '',
    username: '',
    password: '',
    services: [] as string[],
    avatar: '👤',
    customPhoto: undefined as string | undefined,
  });
  const [newCollaborator, setNewCollaborator] = useState({
    name: '',
    alias: '',
    username: '',
    password: '',
    services: [] as string[],
    avatar: '👤',
    customPhoto: undefined as string | undefined,
  });

  const requestPhotoPermissions = async () => {
    if (Platform.OS !== 'web') {
      const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
      const { status: mediaLibraryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (cameraStatus !== 'granted' || mediaLibraryStatus !== 'granted') {
        Alert.alert(
          'Permisos Requeridos',
          'Necesitamos permisos de cámara y galería para subir fotos.',
          [{ text: 'OK' }]
        );
        return false;
      }
    }
    return true;
  };

  const handlePhotoCapture = async (source: 'camera' | 'gallery') => {
    const hasPermissions = await requestPhotoPermissions();
    if (!hasPermissions) return;

    try {
      const result = source === 'camera' 
        ? await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
          })
        : await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
            allowsMultipleSelection: false,
          });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        
        // Check file size (max 10MB for profile photos)
        if (asset.fileSize && asset.fileSize > 10 * 1024 * 1024) {
          Alert.alert(
            'Archivo Muy Grande',
            'La foto es muy grande. El tamaño máximo permitido es 10MB.',
            [{ text: 'OK' }]
          );
          return;
        }
        
        const photoUri = asset.uri;
        
        if (photoModalType === 'new') {
          setNewCollaborator({...newCollaborator, customPhoto: photoUri, avatar: '👤'});
        } else {
          setEditCollaborator({...editCollaborator, customPhoto: photoUri, avatar: '👤'});
        }
        
        setShowPhotoModal(false);
        Alert.alert('Éxito', 'Foto de perfil agregada correctamente');
      }
    } catch (error) {
      console.error('Error capturing photo:', error);
      Alert.alert('Error', 'No se pudo capturar la foto. Inténtalo de nuevo.');
    }
  };

  const handleRemovePhoto = () => {
    if (photoModalType === 'new') {
      setNewCollaborator({...newCollaborator, customPhoto: undefined});
    } else {
      setEditCollaborator({...editCollaborator, customPhoto: undefined});
    }
    setShowPhotoModal(false);
  };

  if (user?.userType !== 'provider') {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: t('collaborators') }} />
        <Text style={styles.errorText}>{t('function_providers_only')}</Text>
      </View>
    );
  }

  const handleAddCollaborator = () => {
    if (!newCollaborator.name || !newCollaborator.alias || !newCollaborator.username || !newCollaborator.password) {
      Alert.alert(t('error'), t('complete_required_fields'));
      return;
    }
    
    const collaborator: Collaborator = {
      id: Date.now().toString(),
      name: newCollaborator.name,
      alias: newCollaborator.alias,
      username: newCollaborator.username,
      password: newCollaborator.password,
      services: newCollaborator.services,
      avatar: newCollaborator.avatar,
      customPhoto: newCollaborator.customPhoto,
      isActive: true,
      isBlocked: false,
      createdAt: new Date().toISOString().split('T')[0]
    };
    
    setCollaborators(prev => [...prev, collaborator]);
    setShowAddModal(false);
    setNewCollaborator({ name: '', alias: '', username: '', password: '', services: [], avatar: '👤', customPhoto: undefined });
    Alert.alert(t('success'), t('collaborator_added'));
  };

  const handleToggleBlock = (collaboratorId: string) => {
    const collaborator = collaborators.find(c => c.id === collaboratorId);
    if (!collaborator) return;

    const action = collaborator.isBlocked ? 'desbloquear' : 'bloquear';
    Alert.alert(
      `${action.charAt(0).toUpperCase() + action.slice(1)} Colaborador`,
      `¿Estás seguro que deseas ${action} a ${collaborator.name}?`,
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('confirm'),
          style: collaborator.isBlocked ? 'default' : 'destructive',
          onPress: () => {
            setCollaborators(prev => prev.map(c => 
              c.id === collaboratorId 
                ? { ...c, isBlocked: !c.isBlocked, isActive: c.isBlocked }
                : c
            ));
          }
        }
      ]
    );
  };

  const handleDeleteCollaborator = (collaboratorId: string) => {
    const collaborator = collaborators.find(c => c.id === collaboratorId);
    if (!collaborator) return;

    Alert.alert(
      t('delete_collaborator'),
      `¿Estás seguro que deseas eliminar a ${collaborator.name}? Esta acción no se puede deshacer.`,
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('delete'),
          style: 'destructive',
          onPress: () => {
            setCollaborators(prev => prev.filter(c => c.id !== collaboratorId));
            Alert.alert(t('success'), 'Colaborador eliminado correctamente');
          }
        }
      ]
    );
  };

  const toggleService = (service: string) => {
    const services = newCollaborator.services.includes(service)
      ? newCollaborator.services.filter(s => s !== service)
      : [...newCollaborator.services, service];
    setNewCollaborator({ ...newCollaborator, services });
  };

  const toggleEditService = (service: string) => {
    const services = editCollaborator.services.includes(service)
      ? editCollaborator.services.filter(s => s !== service)
      : [...editCollaborator.services, service];
    setEditCollaborator({ ...editCollaborator, services });
  };

  const handleEditCollaborator = () => {
    if (!editCollaborator.name || !editCollaborator.alias || !editCollaborator.username || !editCollaborator.password) {
      Alert.alert(t('error'), t('complete_required_fields'));
      return;
    }
    
    if (!selectedCollaborator) return;
    
    const updatedCollaborator: Collaborator = {
      ...selectedCollaborator,
      name: editCollaborator.name,
      alias: editCollaborator.alias,
      username: editCollaborator.username,
      password: editCollaborator.password,
      services: editCollaborator.services,
      avatar: editCollaborator.avatar,
      customPhoto: editCollaborator.customPhoto,
    };
    
    setCollaborators(prev => prev.map(c => 
      c.id === selectedCollaborator.id ? updatedCollaborator : c
    ));
    setShowEditModal(false);
    setSelectedCollaborator(null);
    setEditCollaborator({ name: '', alias: '', username: '', password: '', services: [], avatar: '👤', customPhoto: undefined });
    Alert.alert(t('success'), 'Colaborador actualizado correctamente');
  };

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: t('collaborators_management'),
          headerStyle: { backgroundColor: '#D81B60' },
          headerTintColor: 'white',
          headerTitleStyle: { fontWeight: 'bold' }
        }} 
      />
      
      <ScrollView style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>{t('collaborators_management')}</Text>
          <Text style={styles.subtitle}>
            Administra tu equipo de trabajo y asigna servicios específicos a cada colaborador.
          </Text>
        </View>

        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => setShowAddModal(true)}
        >
          <Plus size={20} color="white" />
          <Text style={styles.addButtonText}>Agregar Nuevo Colaborador</Text>
        </TouchableOpacity>

        <View style={styles.collaboratorsList}>
          {collaborators.map((collaborator) => (
            <View key={collaborator.id} style={[
              styles.collaboratorCard,
              collaborator.isBlocked && styles.collaboratorCardBlocked
            ]}>
              <View style={styles.collaboratorHeader}>
                <View style={styles.avatarContainer}>
                  {collaborator.customPhoto ? (
                    <Image source={{ uri: collaborator.customPhoto }} style={styles.collaboratorPhoto} />
                  ) : (
                    <Text style={styles.collaboratorAvatar}>{collaborator.avatar}</Text>
                  )}
                </View>
                <View style={styles.collaboratorInfo}>
                  <Text style={[
                    styles.collaboratorName,
                    collaborator.isBlocked && styles.collaboratorNameBlocked
                  ]}>
                    {collaborator.name}
                  </Text>
                  <Text style={styles.collaboratorAlias}>@{collaborator.alias}</Text>
                  <Text style={styles.collaboratorUsername}>Usuario: {collaborator.username}</Text>
                </View>
                <View style={[
                  styles.statusIndicator,
                  { backgroundColor: collaborator.isBlocked ? '#FF5722' : collaborator.isActive ? '#4CAF50' : '#666' }
                ]} />
              </View>
              
              <View style={styles.collaboratorServices}>
                <Text style={styles.servicesLabel}>Servicios asignados:</Text>
                <View style={styles.servicesTags}>
                  {collaborator.services.map((service, index) => (
                    <View key={index} style={styles.serviceTag}>
                      <Text style={styles.serviceTagText}>{service}</Text>
                    </View>
                  ))}
                </View>
              </View>
              
              <View style={styles.collaboratorActions}>
                <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={() => {
                    setSelectedCollaborator(collaborator);
                    setEditCollaborator({
                      name: collaborator.name,
                      alias: collaborator.alias,
                      username: collaborator.username,
                      password: collaborator.password,
                      services: collaborator.services,
                      avatar: collaborator.avatar,
                      customPhoto: collaborator.customPhoto,
                    });
                    setShowEditModal(true);
                  }}
                >
                  <Edit size={16} color="#2196F3" />
                  <Text style={styles.actionButtonText}>{t('edit')}</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={() => handleToggleBlock(collaborator.id)}
                >
                  {collaborator.isBlocked ? (
                    <Unlock size={16} color="#4CAF50" />
                  ) : (
                    <Lock size={16} color="#FF9800" />
                  )}
                  <Text style={styles.actionButtonText}>
                    {collaborator.isBlocked ? 'Desbloquear' : 'Bloquear'}
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.actionButton, styles.deleteButton]}
                  onPress={() => handleDeleteCollaborator(collaborator.id)}
                >
                  <Trash2 size={16} color="#FF5722" />
                  <Text style={[styles.actionButtonText, styles.deleteButtonText]}>{t('delete')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Add Collaborator Modal */}
      <Modal
        visible={showAddModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Agregar Colaborador</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <X size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalForm}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{t('full_name_required')}</Text>
                <TextInput
                  style={styles.textInput}
                  value={newCollaborator.name}
                  onChangeText={(text) => setNewCollaborator({...newCollaborator, name: text})}
                  placeholder="Nombre completo del colaborador"
                  placeholderTextColor="#666"
                />
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{t('alias_required')}</Text>
                <TextInput
                  style={styles.textInput}
                  value={newCollaborator.alias}
                  onChangeText={(text) => setNewCollaborator({...newCollaborator, alias: text})}
                  placeholder="Nombre corto o apodo"
                  placeholderTextColor="#666"
                />
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{t('username')} *</Text>
                <TextInput
                  style={styles.textInput}
                  value={newCollaborator.username}
                  onChangeText={(text) => setNewCollaborator({...newCollaborator, username: text})}
                  placeholder="Usuario para iniciar sesión"
                  placeholderTextColor="#666"
                  autoCapitalize="none"
                />
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{t('password')} *</Text>
                <TextInput
                  style={styles.textInput}
                  value={newCollaborator.password}
                  onChangeText={(text) => setNewCollaborator({...newCollaborator, password: text})}
                  placeholder="Contraseña temporal"
                  placeholderTextColor="#666"
                  secureTextEntry
                />
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{t('assign_services')}</Text>
                <View style={styles.servicesGrid}>
                  {availableServices.map((service) => (
                    <TouchableOpacity
                      key={service}
                      style={[
                        styles.serviceCheckbox,
                        newCollaborator.services.includes(service) && styles.serviceCheckboxSelected
                      ]}
                      onPress={() => toggleService(service)}
                    >
                      <View style={[
                        styles.checkbox,
                        newCollaborator.services.includes(service) && styles.checkboxChecked
                      ]}>
                        {newCollaborator.services.includes(service) && <Check size={12} color="white" />}
                      </View>
                      <Text style={[
                        styles.serviceCheckboxText,
                        newCollaborator.services.includes(service) && styles.serviceCheckboxTextSelected
                      ]}>
                        {service}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{t('avatar')}</Text>
                
                {/* Custom Photo Option */}
                <View style={styles.photoSection}>
                  <Text style={styles.photoSectionTitle}>Foto de Perfil Personalizada</Text>
                  <TouchableOpacity 
                    style={styles.photoUploadButton}
                    onPress={() => {
                      setPhotoModalType('new');
                      setShowPhotoModal(true);
                    }}
                  >
                    {newCollaborator.customPhoto ? (
                      <View style={styles.uploadedPhotoContainer}>
                        <Image source={{ uri: newCollaborator.customPhoto }} style={styles.uploadedPhoto} />
                        <View style={styles.photoOverlay}>
                          <Camera size={16} color="white" />
                          <Text style={styles.photoOverlayText}>Cambiar</Text>
                        </View>
                      </View>
                    ) : (
                      <View style={styles.photoPlaceholder}>
                        <Camera size={24} color="#666" />
                        <Text style={styles.photoPlaceholderText}>Subir Foto Personalizada</Text>
                        <Text style={styles.photoPlaceholderSubtext}>Recomendado para apariencia profesional</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                </View>
                
                <Text style={styles.orText}>o selecciona un avatar:</Text>
                
                <View style={styles.avatarSelector}>
                  {['👤', '👨‍💼', '👩‍💼', '👨‍🔧', '👩‍🔧', '👨‍🌾', '👩‍🌾', '👨‍💻', '👩‍💻'].map((emoji) => (
                    <TouchableOpacity
                      key={emoji}
                      style={[
                        styles.avatarOption,
                        newCollaborator.avatar === emoji && !newCollaborator.customPhoto && styles.selectedAvatar
                      ]}
                      onPress={() => setNewCollaborator({...newCollaborator, avatar: emoji, customPhoto: undefined})}
                    >
                      <Text style={styles.avatarEmoji}>{emoji}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </ScrollView>
            
            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => setShowAddModal(false)}
              >
                <Text style={styles.cancelButtonText}>{t('cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.saveButton}
                onPress={handleAddCollaborator}
              >
                <Text style={styles.saveButtonText}>{t('save')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit Collaborator Modal */}
      <Modal
        visible={showEditModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Editar Colaborador</Text>
              <TouchableOpacity onPress={() => setShowEditModal(false)}>
                <X size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalForm}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{t('full_name_required')}</Text>
                <TextInput
                  style={styles.textInput}
                  value={editCollaborator.name}
                  onChangeText={(text) => setEditCollaborator({...editCollaborator, name: text})}
                  placeholder="Nombre completo del colaborador"
                  placeholderTextColor="#666"
                />
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{t('alias_required')}</Text>
                <TextInput
                  style={styles.textInput}
                  value={editCollaborator.alias}
                  onChangeText={(text) => setEditCollaborator({...editCollaborator, alias: text})}
                  placeholder="Nombre corto o apodo"
                  placeholderTextColor="#666"
                />
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{t('username')} *</Text>
                <TextInput
                  style={styles.textInput}
                  value={editCollaborator.username}
                  onChangeText={(text) => setEditCollaborator({...editCollaborator, username: text})}
                  placeholder="Usuario para iniciar sesión"
                  placeholderTextColor="#666"
                  autoCapitalize="none"
                />
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{t('password')} *</Text>
                <TextInput
                  style={styles.textInput}
                  value={editCollaborator.password}
                  onChangeText={(text) => setEditCollaborator({...editCollaborator, password: text})}
                  placeholder="Contraseña"
                  placeholderTextColor="#666"
                  secureTextEntry
                />
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{t('assign_services')}</Text>
                <View style={styles.servicesGrid}>
                  {availableServices.map((service) => (
                    <TouchableOpacity
                      key={service}
                      style={[
                        styles.serviceCheckbox,
                        editCollaborator.services.includes(service) && styles.serviceCheckboxSelected
                      ]}
                      onPress={() => toggleEditService(service)}
                    >
                      <View style={[
                        styles.checkbox,
                        editCollaborator.services.includes(service) && styles.checkboxChecked
                      ]}>
                        {editCollaborator.services.includes(service) && <Check size={12} color="white" />}
                      </View>
                      <Text style={[
                        styles.serviceCheckboxText,
                        editCollaborator.services.includes(service) && styles.serviceCheckboxTextSelected
                      ]}>
                        {service}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{t('avatar')}</Text>
                
                {/* Custom Photo Option */}
                <View style={styles.photoSection}>
                  <Text style={styles.photoSectionTitle}>Foto de Perfil Personalizada</Text>
                  <TouchableOpacity 
                    style={styles.photoUploadButton}
                    onPress={() => {
                      setPhotoModalType('edit');
                      setShowPhotoModal(true);
                    }}
                  >
                    {editCollaborator.customPhoto ? (
                      <View style={styles.uploadedPhotoContainer}>
                        <Image source={{ uri: editCollaborator.customPhoto }} style={styles.uploadedPhoto} />
                        <View style={styles.photoOverlay}>
                          <Camera size={16} color="white" />
                          <Text style={styles.photoOverlayText}>Cambiar</Text>
                        </View>
                      </View>
                    ) : (
                      <View style={styles.photoPlaceholder}>
                        <Camera size={24} color="#666" />
                        <Text style={styles.photoPlaceholderText}>Subir Foto Personalizada</Text>
                        <Text style={styles.photoPlaceholderSubtext}>Recomendado para apariencia profesional</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                </View>
                
                <Text style={styles.orText}>o selecciona un avatar:</Text>
                
                <View style={styles.avatarSelector}>
                  {['👤', '👨‍💼', '👩‍💼', '👨‍🔧', '👩‍🔧', '👨‍🌾', '👩‍🌾', '👨‍💻', '👩‍💻'].map((emoji) => (
                    <TouchableOpacity
                      key={emoji}
                      style={[
                        styles.avatarOption,
                        editCollaborator.avatar === emoji && !editCollaborator.customPhoto && styles.selectedAvatar
                      ]}
                      onPress={() => setEditCollaborator({...editCollaborator, avatar: emoji, customPhoto: undefined})}
                    >
                      <Text style={styles.avatarEmoji}>{emoji}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </ScrollView>
            
            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => setShowEditModal(false)}
              >
                <Text style={styles.cancelButtonText}>{t('cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.saveButton}
                onPress={handleEditCollaborator}
              >
                <Text style={styles.saveButtonText}>Actualizar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Photo Upload Modal */}
      <Modal
        visible={showPhotoModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPhotoModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Foto de Perfil</Text>
              <TouchableOpacity onPress={() => setShowPhotoModal(false)}>
                <X size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.photoOptionsContainer}>
              <Text style={styles.photoOptionsTitle}>Selecciona una opción:</Text>
              
              <View style={styles.photoOptionsSection}>
                <Text style={styles.photoSectionSubtitle}>📷 Capturar Nueva Foto</Text>
                
                <TouchableOpacity 
                  style={styles.photoOption}
                  onPress={() => handlePhotoCapture('camera')}
                >
                  <Camera size={24} color="#D81B60" />
                  <View style={styles.photoOptionContent}>
                    <Text style={styles.photoOptionTitle}>Tomar Foto</Text>
                    <Text style={styles.photoOptionDescription}>Usa la cámara para capturar una foto de perfil</Text>
                  </View>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.photoOption}
                  onPress={() => handlePhotoCapture('gallery')}
                >
                  <Upload size={24} color="#D81B60" />
                  <View style={styles.photoOptionContent}>
                    <Text style={styles.photoOptionTitle}>Seleccionar de Galería</Text>
                    <Text style={styles.photoOptionDescription}>Elige una foto existente de tu galería</Text>
                  </View>
                </TouchableOpacity>
              </View>
              
              {((photoModalType === 'new' && newCollaborator.customPhoto) || 
                (photoModalType === 'edit' && editCollaborator.customPhoto)) && (
                <View style={styles.photoOptionsSection}>
                  <Text style={styles.photoSectionSubtitle}>🗑️ Gestionar Foto</Text>
                  
                  <TouchableOpacity 
                    style={[styles.photoOption, styles.removePhotoOption]}
                    onPress={handleRemovePhoto}
                  >
                    <X size={24} color="#FF5722" />
                    <View style={styles.photoOptionContent}>
                      <Text style={[styles.photoOptionTitle, { color: '#FF5722' }]}>Eliminar Foto</Text>
                      <Text style={styles.photoOptionDescription}>Usar avatar predeterminado en su lugar</Text>
                    </View>
                  </TouchableOpacity>
                </View>
              )}
              
              <View style={styles.photoLimitsInfo}>
                <Text style={styles.photoLimitsTitle}>📋 Requisitos de Foto</Text>
                <Text style={styles.photoLimitsText}>• Tamaño máximo: 10MB</Text>
                <Text style={styles.photoLimitsText}>• Formatos: JPG, PNG, WEBP</Text>
                <Text style={styles.photoLimitsText}>• Recomendado: Foto cuadrada (1:1)</Text>
                <Text style={styles.photoLimitsText}>• Para mejor apariencia profesional</Text>
              </View>
            </View>
            
            <TouchableOpacity 
              style={styles.cancelButton}
              onPress={() => setShowPhotoModal(false)}
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
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    paddingVertical: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  addButton: {
    backgroundColor: '#D81B60',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 20,
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  collaboratorsList: {
    gap: 16,
  },
  collaboratorCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  collaboratorCardBlocked: {
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: '#FFCDD2',
  },
  collaboratorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarContainer: {
    marginRight: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  collaboratorAvatar: {
    fontSize: 32,
  },
  collaboratorPhoto: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  collaboratorInfo: {
    flex: 1,
  },
  collaboratorName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  collaboratorNameBlocked: {
    color: '#999',
  },
  collaboratorAlias: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  collaboratorUsername: {
    fontSize: 12,
    color: '#999',
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  collaboratorServices: {
    marginBottom: 16,
  },
  servicesLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  servicesTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  serviceTag: {
    backgroundColor: '#E3F2FD',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  serviceTagText: {
    fontSize: 12,
    color: '#1976D2',
    fontWeight: '500',
  },
  collaboratorActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingVertical: 10,
    gap: 6,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  deleteButton: {
    backgroundColor: '#FFEBEE',
  },
  deleteButtonText: {
    color: '#FF5722',
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
  modalForm: {
    maxHeight: 400,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    color: '#333',
  },
  servicesGrid: {
    gap: 8,
  },
  serviceCheckbox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12,
    gap: 12,
  },
  serviceCheckboxSelected: {
    backgroundColor: '#E8F5E8',
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#D81B60',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#D81B60',
  },
  serviceCheckboxText: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  serviceCheckboxTextSelected: {
    color: '#333',
    fontWeight: '600',
  },
  avatarSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  avatarOption: {
    padding: 8,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedAvatar: {
    borderColor: '#D81B60',
    backgroundColor: '#FFE8F0',
  },
  avatarEmoji: {
    fontSize: 24,
  },
  photoUploadButton: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#E5E5E5',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoSection: {
    marginBottom: 16,
  },
  photoSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  photoSectionSubtitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    paddingLeft: 4,
  },
  uploadedPhotoContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadedPhoto: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  photoOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  photoOverlayText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
  },
  photoPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  photoPlaceholderText: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
    fontWeight: '600',
  },
  photoPlaceholderSubtext: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
    textAlign: 'center',
  },
  orText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 12,
  },
  photoOptionsContainer: {
    paddingVertical: 16,
  },
  photoOptionsSection: {
    marginBottom: 16,
  },
  photoLimitsInfo: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  photoLimitsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  photoLimitsText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
    lineHeight: 16,
  },
  photoOptionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  photoOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    gap: 16,
  },
  removePhotoOption: {
    backgroundColor: '#FFEBEE',
  },
  photoOptionContent: {
    flex: 1,
  },
  photoOptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  photoOptionDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 18,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#D81B60',
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    color: 'white',
    fontWeight: '600',
  },
});