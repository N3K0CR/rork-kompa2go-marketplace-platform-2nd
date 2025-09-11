import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, TextInput, Modal, Image, Platform } from 'react-native';
import { Stack, router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { 
  ChevronLeft, 
  Building2, 
  Plus, 
  X, 
  Check, 
  Camera, 
  Upload, 
  AlertTriangle,
  FileText,
  DollarSign,
  Ban,
  Video,
  Image as ImageIcon,
  Folder
} from 'lucide-react-native';

interface Service {
  id: string;
  name: string;
  price: number;
  duration: number;
  description: string;
  isActive: boolean;
}

interface GalleryMedia {
  id: string;
  uri: string;
  description: string;
  type: 'image' | 'video';
  fileName?: string;
  size?: number;
}

interface BusinessBranding {
  logo?: string;
  logoFileName?: string;
  logoSize?: number;
  hasCustomLogo: boolean;
}

interface SupportTicket {
  id: string;
  type: 'price_change' | 'block_service';
  serviceId?: string;
  serviceName?: string;
  newPriceListUrl?: string;
  justification?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

const mockServices: Service[] = [
  {
    id: '1',
    name: 'Limpieza General',
    price: 15000,
    duration: 120,
    description: 'Limpieza completa de espacios residenciales',
    isActive: true
  },
  {
    id: '2',
    name: 'Limpieza Profunda',
    price: 25000,
    duration: 180,
    description: 'Limpieza detallada incluyendo áreas difíciles',
    isActive: true
  },
  {
    id: '3',
    name: 'Organización',
    price: 12000,
    duration: 90,
    description: 'Organización y ordenamiento de espacios',
    isActive: false
  }
];

const mockGallery: GalleryMedia[] = [
  {
    id: '1',
    uri: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=300&h=200&fit=crop',
    description: 'Limpieza de cocina',
    type: 'image'
  },
  {
    id: '2',
    uri: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&h=200&fit=crop',
    description: 'Organización de closet',
    type: 'image'
  },
  {
    id: '3',
    uri: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=300&h=200&fit=crop',
    description: 'Limpieza de baño',
    type: 'image'
  },
  {
    id: '4',
    uri: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
    description: 'Video de trabajo completado',
    type: 'video'
  }
];

export default function EditProfileScreen() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [businessName, setBusinessName] = useState(user?.name || 'Mi Negocio');
  const [services, setServices] = useState<Service[]>(mockServices);
  const [gallery, setGallery] = useState<GalleryMedia[]>(mockGallery);
  const [maxGallerySize, setMaxGallerySize] = useState(10); // Can be increased through achievements
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [showAddServiceModal, setShowAddServiceModal] = useState(false);
  const [showPriceChangeModal, setShowPriceChangeModal] = useState(false);
  const [showBlockServiceModal, setShowBlockServiceModal] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [newService, setNewService] = useState({
    name: '',
    price: '',
    duration: '',
    description: ''
  });
  const [priceChangeData, setPriceChangeData] = useState({
    newPriceListUrl: '',
    justification: ''
  });
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>([]);
  const [businessBranding, setBusinessBranding] = useState<BusinessBranding>({
    hasCustomLogo: false
  });
  const [showLogoModal, setShowLogoModal] = useState(false);

  // Early return after all hooks are called
  if (user?.userType !== 'provider') {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: 'Acceso Denegado' }} />
        <Text style={styles.errorText}>Esta función es solo para proveedores</Text>
      </View>
    );
  }

  const handleSaveBusinessName = () => {
    Alert.alert(
      'Nombre Actualizado',
      `El nombre de tu negocio ha sido actualizado a: "${businessName}"`,
      [{ text: 'OK' }]
    );
  };

  const handleAddService = () => {
    if (!newService.name || !newService.price || !newService.duration) {
      Alert.alert('Error', 'Por favor completa todos los campos obligatorios');
      return;
    }

    const service: Service = {
      id: Date.now().toString(),
      name: newService.name,
      price: parseInt(newService.price),
      duration: parseInt(newService.duration),
      description: newService.description,
      isActive: true
    };

    setServices(prev => [...prev, service]);
    setNewService({ name: '', price: '', duration: '', description: '' });
    setShowAddServiceModal(false);
    Alert.alert('Éxito', 'Servicio agregado correctamente');
  };

  const handleRemoveService = (serviceId: string) => {
    const service = services.find(s => s.id === serviceId);
    if (!service) return;

    Alert.alert(
      'Remover Servicio',
      `¿Estás seguro que deseas remover "${service.name}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: () => {
            setServices(prev => prev.filter(s => s.id !== serviceId));
            Alert.alert('Éxito', 'Servicio removido correctamente');
          }
        }
      ]
    );
  };

  const handleRequestPriceChange = () => {
    if (!selectedService || !priceChangeData.newPriceListUrl || !priceChangeData.justification) {
      Alert.alert('Error', 'Por favor completa todos los campos obligatorios');
      return;
    }

    const ticket: SupportTicket = {
      id: Date.now().toString(),
      type: 'price_change',
      serviceId: selectedService.id,
      serviceName: selectedService.name,
      newPriceListUrl: priceChangeData.newPriceListUrl,
      justification: priceChangeData.justification,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    setSupportTickets(prev => [...prev, ticket]);
    setPriceChangeData({ newPriceListUrl: '', justification: '' });
    setSelectedService(null);
    setShowPriceChangeModal(false);
    Alert.alert('Solicitud Enviada', 'Tu solicitud de cambio de precio ha sido enviada al equipo de administración.');
  };

  const handleRequestBlockService = () => {
    if (!selectedService) return;

    const ticket: SupportTicket = {
      id: Date.now().toString(),
      type: 'block_service',
      serviceId: selectedService.id,
      serviceName: selectedService.name,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    setSupportTickets(prev => [...prev, ticket]);
    setSelectedService(null);
    setShowBlockServiceModal(false);
    Alert.alert('Solicitud Enviada', 'Tu solicitud para bloquear el servicio ha sido enviada al equipo de administración.');
  };

  const requestPermissions = async () => {
    if (Platform.OS !== 'web') {
      const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
      const { status: mediaLibraryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (cameraStatus !== 'granted' || mediaLibraryStatus !== 'granted') {
        Alert.alert(
          'Permisos Requeridos',
          'Necesitamos permisos de cámara y galería para subir archivos.',
          [{ text: 'OK' }]
        );
        return false;
      }
    }
    return true;
  };

  const handleAddGalleryMedia = () => {
    if (gallery.length >= maxGallerySize) {
      Alert.alert(
        'Límite Alcanzado',
        `Has alcanzado el límite de ${maxGallerySize} archivos en tu galería. Completa logros para aumentar este límite.`,
        [{ text: 'OK' }]
      );
      return;
    }
    setShowMediaModal(true);
  };

  const handleCameraCapture = async (mediaType: 'photo' | 'video') => {
    const hasPermissions = await requestPermissions();
    if (!hasPermissions) return;

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: mediaType === 'photo' ? ImagePicker.MediaTypeOptions.Images : ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: true,
        aspect: mediaType === 'photo' ? [16, 9] : undefined,
        quality: 0.8,
        videoMaxDuration: 30, // 30 seconds max for videos
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const newMedia: GalleryMedia = {
          id: Date.now().toString(),
          uri: asset.uri,
          description: `Nuevo ${mediaType === 'photo' ? 'imagen' : 'video'} desde cámara`,
          type: mediaType === 'photo' ? 'image' : 'video',
          fileName: asset.fileName || `media_${Date.now()}.${mediaType === 'photo' ? 'jpg' : 'mp4'}`,
          size: asset.fileSize
        };

        setGallery(prev => [...prev, newMedia]);
        setShowMediaModal(false);
        Alert.alert('Éxito', `${mediaType === 'photo' ? 'Imagen' : 'Video'} agregado a tu galería de trabajos`);
      }
    } catch (error) {
      console.error('Error capturing media:', error);
      Alert.alert('Error', 'No se pudo capturar el archivo. Inténtalo de nuevo.');
    }
  };

  const handleFileUpload = async (multiple: boolean = false) => {
    try {
      const remainingSlots = maxGallerySize - gallery.length;
      if (remainingSlots <= 0) {
        Alert.alert(
          'Límite Alcanzado',
          `Has alcanzado el límite de ${maxGallerySize} archivos en tu galería.`,
          [{ text: 'OK' }]
        );
        return;
      }

      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'video/*'],
        copyToCacheDirectory: true,
        multiple: multiple && remainingSlots > 1
      });

      if (!result.canceled && result.assets.length > 0) {
        const assetsToAdd = result.assets.slice(0, remainingSlots);
        const newMediaItems: GalleryMedia[] = [];
        
        for (const asset of assetsToAdd) {
          // Check file size (max 50MB)
          if (asset.size && asset.size > 50 * 1024 * 1024) {
            Alert.alert(
              'Archivo Muy Grande',
              `El archivo "${asset.name}" es muy grande. El tamaño máximo permitido es 50MB.`,
              [{ text: 'OK' }]
            );
            continue;
          }

          const isVideo = asset.mimeType?.startsWith('video/') || 
                         asset.name.toLowerCase().includes('.mp4') || 
                         asset.name.toLowerCase().includes('.mov') ||
                         asset.name.toLowerCase().includes('.avi') ||
                         asset.name.toLowerCase().includes('.mkv');
          
          const newMedia: GalleryMedia = {
            id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            uri: asset.uri,
            description: `Archivo subido: ${asset.name}`,
            type: isVideo ? 'video' : 'image',
            fileName: asset.name,
            size: asset.size
          };
          
          newMediaItems.push(newMedia);
        }

        if (newMediaItems.length > 0) {
          setGallery(prev => [...prev, ...newMediaItems]);
          setShowMediaModal(false);
          Alert.alert(
            'Éxito', 
            `${newMediaItems.length} archivo${newMediaItems.length > 1 ? 's' : ''} agregado${newMediaItems.length > 1 ? 's' : ''} a tu galería de trabajos`
          );
        }
      }
    } catch (error) {
      console.error('Error picking file:', error);
      Alert.alert('Error', 'No se pudo seleccionar el archivo. Inténtalo de nuevo.');
    }
  };

  const handleGalleryPicker = async () => {
    const hasPermissions = await requestPermissions();
    if (!hasPermissions) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
        videoMaxDuration: 30,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const newMedia: GalleryMedia = {
          id: Date.now().toString(),
          uri: asset.uri,
          description: `Archivo desde galería`,
          type: asset.type === 'video' ? 'video' : 'image',
          fileName: asset.fileName || `media_${Date.now()}.${asset.type === 'video' ? 'mp4' : 'jpg'}`,
          size: asset.fileSize
        };

        setGallery(prev => [...prev, newMedia]);
        setShowMediaModal(false);
        Alert.alert('Éxito', 'Archivo agregado a tu galería de trabajos');
      }
    } catch (error) {
      console.error('Error picking from gallery:', error);
      Alert.alert('Error', 'No se pudo seleccionar el archivo. Inténtalo de nuevo.');
    }
  };

  const handleLogoUpload = async (method: 'camera' | 'gallery' | 'file') => {
    const hasPermissions = await requestPermissions();
    if (!hasPermissions && method !== 'file') return;

    try {
      let result: any;
      
      if (method === 'camera') {
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [1, 1], // Square aspect for logos
          quality: 0.9,
        });
      } else if (method === 'gallery') {
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [1, 1], // Square aspect for logos
          quality: 0.9,
        });
      } else {
        // File picker
        const docResult = await DocumentPicker.getDocumentAsync({
          type: ['image/*'],
          copyToCacheDirectory: true,
        });
        
        if (!docResult.canceled && docResult.assets[0]) {
          const asset = docResult.assets[0];
          
          // Check file size (max 10MB for logos)
          if (asset.size && asset.size > 10 * 1024 * 1024) {
            Alert.alert(
              'Archivo Muy Grande',
              'El logo debe ser menor a 10MB. Por favor selecciona una imagen más pequeña.',
              [{ text: 'OK' }]
            );
            return;
          }
          
          setBusinessBranding({
            hasCustomLogo: true,
            logo: asset.uri,
            logoFileName: asset.name,
            logoSize: asset.size
          });
          
          setShowLogoModal(false);
          Alert.alert('Éxito', 'Logo subido correctamente');
          return;
        }
        return;
      }

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        
        // Check file size (max 10MB for logos)
        if (asset.fileSize && asset.fileSize > 10 * 1024 * 1024) {
          Alert.alert(
            'Archivo Muy Grande',
            'El logo debe ser menor a 10MB. Por favor selecciona una imagen más pequeña.',
            [{ text: 'OK' }]
          );
          return;
        }
        
        setBusinessBranding({
          hasCustomLogo: true,
          logo: asset.uri,
          logoFileName: asset.fileName || `logo_${Date.now()}.jpg`,
          logoSize: asset.fileSize
        });
        
        setShowLogoModal(false);
        Alert.alert('Éxito', 'Logo subido correctamente');
      }
    } catch (error) {
      console.error('Error uploading logo:', error);
      Alert.alert('Error', 'No se pudo subir el logo. Inténtalo de nuevo.');
    }
  };

  const handleRemoveGalleryMedia = (mediaId: string) => {
    const media = gallery.find(item => item.id === mediaId);
    if (!media) return;

    Alert.alert(
      `Eliminar ${media.type === 'image' ? 'Imagen' : 'Video'}`,
      `¿Estás seguro que deseas eliminar este ${media.type === 'image' ? 'imagen' : 'video'}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            setGallery(prev => prev.filter(item => item.id !== mediaId));
          }
        }
      ]
    );
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
        {/* Business Name Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Building2 size={24} color="#D81B60" />
            <Text style={styles.sectionTitle}>Nombre del Negocio</Text>
          </View>
          <TextInput
            style={styles.textInput}
            value={businessName}
            onChangeText={setBusinessName}
            placeholder="Nombre de tu negocio"
            placeholderTextColor="#666"
          />
          <TouchableOpacity style={styles.saveButton} onPress={handleSaveBusinessName}>
            <Text style={styles.saveButtonText}>Guardar Cambios</Text>
          </TouchableOpacity>
        </View>

        {/* Business Branding Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <ImageIcon size={24} color="#D81B60" />
            <Text style={styles.sectionTitle}>Imagen de Marca</Text>
          </View>
          
          {businessBranding.hasCustomLogo && businessBranding.logo ? (
            <View style={styles.logoContainer}>
              <Image source={{ uri: businessBranding.logo }} style={styles.businessLogo} />
              <View style={styles.logoInfo}>
                <Text style={styles.logoFileName}>{businessBranding.logoFileName}</Text>
                {businessBranding.logoSize && (
                  <Text style={styles.logoSize}>
                    {(businessBranding.logoSize / 1024 / 1024).toFixed(1)} MB
                  </Text>
                )}
              </View>
              <TouchableOpacity 
                style={styles.removeLogoButton}
                onPress={() => {
                  Alert.alert(
                    'Eliminar Logo',
                    '¿Estás seguro que deseas eliminar el logo de tu negocio?',
                    [
                      { text: 'Cancelar', style: 'cancel' },
                      {
                        text: 'Eliminar',
                        style: 'destructive',
                        onPress: () => {
                          setBusinessBranding({ hasCustomLogo: false });
                          Alert.alert('Éxito', 'Logo eliminado correctamente');
                        }
                      }
                    ]
                  );
                }}
              >
                <X size={16} color="white" />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.noLogoContainer}>
              <ImageIcon size={48} color="#ccc" />
              <Text style={styles.noLogoText}>Sin logo personalizado</Text>
            </View>
          )}
          
          <View style={styles.brandingActions}>
            <TouchableOpacity 
              style={styles.brandingButton}
              onPress={() => setShowLogoModal(true)}
            >
              <Upload size={20} color="#D81B60" />
              <Text style={styles.brandingButtonText}>Subir Logo</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.brandingButton, styles.createLogoButton]}
              onPress={() => {
                Alert.alert(
                  'Crear Logo Profesional',
                  'El servicio de creación de logo y branding tiene un costo de ₡25,000. ¿Deseas solicitar este servicio?',
                  [
                    { text: 'Cancelar', style: 'cancel' },
                    {
                      text: 'Solicitar',
                      onPress: () => {
                        // Send alert to admin panel
                        Alert.alert(
                          'Solicitud Enviada',
                          'Tu solicitud de creación de logo ha sido enviada al equipo de Kompa2go Utilities. Te contactaremos pronto para coordinar el servicio.',
                          [{ text: 'OK' }]
                        );
                        console.log('ADMIN ALERT: Logo creation request from provider:', user?.name, user?.email);
                      }
                    }
                  ]
                );
              }}
            >
              <DollarSign size={20} color="#4CAF50" />
              <Text style={[styles.brandingButtonText, { color: '#4CAF50' }]}>Crear Logo (₡25,000)</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.brandingInfo}>
            <AlertTriangle size={16} color="#2196F3" />
            <Text style={styles.brandingInfoText}>
              Un logo profesional ayuda a que los clientes reconozcan y confíen en tu negocio.
            </Text>
          </View>
        </View>

        {/* Services Management Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <FileText size={24} color="#D81B60" />
            <Text style={styles.sectionTitle}>Gestión de Servicios</Text>
          </View>
          
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => setShowAddServiceModal(true)}
          >
            <Plus size={20} color="white" />
            <Text style={styles.addButtonText}>Agregar Nuevo Servicio</Text>
          </TouchableOpacity>

          {services.map((service) => (
            <View key={service.id} style={styles.serviceCard}>
              <View style={styles.serviceHeader}>
                <Text style={styles.serviceName}>{service.name}</Text>
                <View style={[
                  styles.serviceStatus,
                  { backgroundColor: service.isActive ? '#4CAF50' : '#FF5722' }
                ]}>
                  <Text style={styles.serviceStatusText}>
                    {service.isActive ? 'Activo' : 'Inactivo'}
                  </Text>
                </View>
              </View>
              <Text style={styles.servicePrice}>₡{service.price.toLocaleString()}</Text>
              <Text style={styles.serviceDuration}>{service.duration} minutos</Text>
              <Text style={styles.serviceDescription}>{service.description}</Text>
              
              <View style={styles.serviceActions}>
                <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={() => {
                    setSelectedService(service);
                    setShowPriceChangeModal(true);
                  }}
                >
                  <DollarSign size={16} color="#2196F3" />
                  <Text style={styles.actionButtonText}>Cambiar Precio</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={() => {
                    setSelectedService(service);
                    setShowBlockServiceModal(true);
                  }}
                >
                  <Ban size={16} color="#FF9800" />
                  <Text style={styles.actionButtonText}>Bloquear</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.actionButton, styles.removeButton]}
                  onPress={() => handleRemoveService(service.id)}
                >
                  <X size={16} color="#FF5722" />
                  <Text style={[styles.actionButtonText, styles.removeButtonText]}>Remover</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

        {/* Work Gallery Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Camera size={24} color="#D81B60" />
            <Text style={styles.sectionTitle}>Galería de Trabajos</Text>
          </View>
          
          <View style={styles.galleryInfo}>
            <View style={styles.galleryWarning}>
              <AlertTriangle size={20} color="#FF9800" />
              <Text style={styles.warningText}>
                Las imágenes no deben incluir números de teléfono, ubicación o nombre del negocio.
              </Text>
            </View>
            <View style={styles.galleryCounter}>
              <Text style={styles.galleryCounterText}>
                {gallery.length} / {maxGallerySize} archivos
              </Text>
              <Text style={styles.galleryCounterSubtext}>
                Completa logros para aumentar el límite
              </Text>
            </View>
          </View>
          
          <TouchableOpacity style={styles.addButton} onPress={handleAddGalleryMedia}>
            <Upload size={20} color="white" />
            <Text style={styles.addButtonText}>Agregar Imagen/Video</Text>
          </TouchableOpacity>

          <View style={styles.galleryGrid}>
            {gallery.map((media) => (
              <View key={media.id} style={styles.galleryItem}>
                {media.type === 'image' ? (
                  <Image source={{ uri: media.uri }} style={styles.galleryMedia} />
                ) : (
                  <View style={styles.videoContainer}>
                    <Image 
                      source={{ uri: media.uri }} 
                      style={styles.galleryMedia}
                      defaultSource={require('@/assets/images/icon.png')}
                    />
                    <View style={styles.videoOverlay}>
                      <Video size={24} color="white" />
                    </View>
                  </View>
                )}
                <TouchableOpacity 
                  style={styles.removeMediaButton}
                  onPress={() => handleRemoveGalleryMedia(media.id)}
                >
                  <X size={16} color="white" />
                </TouchableOpacity>
                <View style={styles.mediaInfo}>
                  <Text style={styles.mediaDescription}>{media.description}</Text>
                  {media.fileName && (
                    <Text style={styles.mediaFileName}>{media.fileName}</Text>
                  )}
                  {media.size && (
                    <Text style={styles.mediaSize}>
                      {(media.size / 1024 / 1024).toFixed(1)} MB
                    </Text>
                  )}
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Support Tickets Section */}
        {supportTickets.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <FileText size={24} color="#D81B60" />
              <Text style={styles.sectionTitle}>Solicitudes Pendientes</Text>
            </View>
            
            {supportTickets.map((ticket) => (
              <View key={ticket.id} style={styles.ticketCard}>
                <View style={styles.ticketHeader}>
                  <Text style={styles.ticketType}>
                    {ticket.type === 'price_change' ? 'Cambio de Precio' : 'Bloquear Servicio'}
                  </Text>
                  <View style={[
                    styles.ticketStatus,
                    { backgroundColor: 
                      ticket.status === 'pending' ? '#FF9800' :
                      ticket.status === 'approved' ? '#4CAF50' : '#FF5722'
                    }
                  ]}>
                    <Text style={styles.ticketStatusText}>
                      {ticket.status === 'pending' ? 'Pendiente' :
                       ticket.status === 'approved' ? 'Aprobado' : 'Rechazado'}
                    </Text>
                  </View>
                </View>
                <Text style={styles.ticketService}>Servicio: {ticket.serviceName}</Text>
                <Text style={styles.ticketDate}>
                  Enviado: {new Date(ticket.createdAt).toLocaleDateString('es-ES')}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Information Note */}
        <View style={styles.infoSection}>
          <AlertTriangle size={20} color="#2196F3" />
          <Text style={styles.infoText}>
            Mantener precios actualizados y precisos es una condición obligatoria para participar en la comunidad Kompa2Go.
          </Text>
        </View>
      </ScrollView>

      {/* Add Service Modal */}
      <Modal
        visible={showAddServiceModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddServiceModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Agregar Servicio</Text>
              <TouchableOpacity onPress={() => setShowAddServiceModal(false)}>
                <X size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalForm}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Nombre del Servicio *</Text>
                <TextInput
                  style={styles.textInput}
                  value={newService.name}
                  onChangeText={(text) => setNewService({...newService, name: text})}
                  placeholder="Ej: Limpieza General"
                  placeholderTextColor="#666"
                />
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Precio (₡) *</Text>
                <TextInput
                  style={styles.textInput}
                  value={newService.price}
                  onChangeText={(text) => setNewService({...newService, price: text})}
                  placeholder="15000"
                  placeholderTextColor="#666"
                  keyboardType="numeric"
                />
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Duración (minutos) *</Text>
                <TextInput
                  style={styles.textInput}
                  value={newService.duration}
                  onChangeText={(text) => setNewService({...newService, duration: text})}
                  placeholder="120"
                  placeholderTextColor="#666"
                  keyboardType="numeric"
                />
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Descripción</Text>
                <TextInput
                  style={[styles.textInput, styles.textArea]}
                  value={newService.description}
                  onChangeText={(text) => setNewService({...newService, description: text})}
                  placeholder="Descripción del servicio..."
                  placeholderTextColor="#666"
                  multiline
                  numberOfLines={3}
                />
              </View>
            </ScrollView>
            
            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => setShowAddServiceModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.saveButton}
                onPress={handleAddService}
              >
                <Text style={styles.saveButtonText}>Agregar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Price Change Modal */}
      <Modal
        visible={showPriceChangeModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPriceChangeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Solicitar Cambio de Precio</Text>
              <TouchableOpacity onPress={() => setShowPriceChangeModal(false)}>
                <X size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalForm}>
              <Text style={styles.modalSubtitle}>
                Servicio: {selectedService?.name}
              </Text>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Nueva Lista de Precios (URL) *</Text>
                <TextInput
                  style={styles.textInput}
                  value={priceChangeData.newPriceListUrl}
                  onChangeText={(text) => setPriceChangeData({...priceChangeData, newPriceListUrl: text})}
                  placeholder="https://ejemplo.com/nueva-lista-precios"
                  placeholderTextColor="#666"
                  keyboardType="url"
                />
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Justificación del Cambio *</Text>
                <TextInput
                  style={[styles.textInput, styles.textArea]}
                  value={priceChangeData.justification}
                  onChangeText={(text) => setPriceChangeData({...priceChangeData, justification: text})}
                  placeholder="Explica las razones del cambio de precio..."
                  placeholderTextColor="#666"
                  multiline
                  numberOfLines={4}
                />
              </View>
            </ScrollView>
            
            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => setShowPriceChangeModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.saveButton}
                onPress={handleRequestPriceChange}
              >
                <Text style={styles.saveButtonText}>Enviar Solicitud</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Block Service Modal */}
      <Modal
        visible={showBlockServiceModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowBlockServiceModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Bloquear Servicio</Text>
              <TouchableOpacity onPress={() => setShowBlockServiceModal(false)}>
                <X size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalBody}>
              <Text style={styles.modalSubtitle}>
                ¿Estás seguro que deseas solicitar el bloqueo del servicio "{selectedService?.name}"?
              </Text>
              <Text style={styles.modalDescription}>
                Esta solicitud será revisada por el equipo de administración. El servicio permanecerá activo hasta que se apruebe la solicitud.
              </Text>
            </View>
            
            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => setShowBlockServiceModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.saveButton, { backgroundColor: '#FF5722' }]}
                onPress={handleRequestBlockService}
              >
                <Text style={styles.saveButtonText}>Solicitar Bloqueo</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Media Upload Modal */}
      <Modal
        visible={showMediaModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowMediaModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Agregar Archivo</Text>
              <TouchableOpacity onPress={() => setShowMediaModal(false)}>
                <X size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.mediaOptionsContainer}>
              <Text style={styles.mediaOptionsTitle}>Selecciona una opción:</Text>
              
              <View style={styles.mediaOptionsSection}>
                <Text style={styles.mediaSectionTitle}>📷 Usar Cámara</Text>
                
                <TouchableOpacity 
                  style={styles.mediaOption}
                  onPress={() => handleCameraCapture('photo')}
                >
                  <Camera size={24} color="#D81B60" />
                  <View style={styles.mediaOptionContent}>
                    <Text style={styles.mediaOptionTitle}>Tomar Foto</Text>
                    <Text style={styles.mediaOptionDescription}>Captura una imagen con la cámara</Text>
                  </View>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.mediaOption}
                  onPress={() => handleCameraCapture('video')}
                >
                  <Video size={24} color="#D81B60" />
                  <View style={styles.mediaOptionContent}>
                    <Text style={styles.mediaOptionTitle}>Grabar Video</Text>
                    <Text style={styles.mediaOptionDescription}>Graba un video (máx. 30s)</Text>
                  </View>
                </TouchableOpacity>
              </View>
              
              <View style={styles.mediaOptionsSection}>
                <Text style={styles.mediaSectionTitle}>📁 Subir desde Archivo</Text>
                
                <TouchableOpacity 
                  style={styles.mediaOption}
                  onPress={() => handleFileUpload(false)}
                >
                  <Folder size={24} color="#D81B60" />
                  <View style={styles.mediaOptionContent}>
                    <Text style={styles.mediaOptionTitle}>Subir Archivo Individual</Text>
                    <Text style={styles.mediaOptionDescription}>Selecciona un archivo (imagen o video)</Text>
                  </View>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.mediaOption}
                  onPress={() => handleFileUpload(true)}
                  disabled={maxGallerySize - gallery.length <= 1}
                >
                  <Upload size={24} color={maxGallerySize - gallery.length <= 1 ? "#999" : "#D81B60"} />
                  <View style={styles.mediaOptionContent}>
                    <Text style={[
                      styles.mediaOptionTitle,
                      maxGallerySize - gallery.length <= 1 && styles.mediaOptionDisabled
                    ]}>Subir Múltiples Archivos</Text>
                    <Text style={[
                      styles.mediaOptionDescription,
                      maxGallerySize - gallery.length <= 1 && styles.mediaOptionDisabled
                    ]}>Selecciona varios archivos a la vez</Text>
                  </View>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.mediaOption}
                  onPress={handleGalleryPicker}
                >
                  <ImageIcon size={24} color="#D81B60" />
                  <View style={styles.mediaOptionContent}>
                    <Text style={styles.mediaOptionTitle}>Galería de Fotos</Text>
                    <Text style={styles.mediaOptionDescription}>Selecciona desde tu galería</Text>
                  </View>
                </TouchableOpacity>
              </View>
              
              <View style={styles.mediaLimitsInfo}>
                <Text style={styles.mediaLimitsTitle}>📋 Límites y Formatos</Text>
                <Text style={styles.mediaLimitsText}>• Tamaño máximo: 50MB por archivo</Text>
                <Text style={styles.mediaLimitsText}>• Imágenes: JPG, PNG, GIF, WEBP</Text>
                <Text style={styles.mediaLimitsText}>• Videos: MP4, MOV, AVI, MKV (máx. 30s)</Text>
                <Text style={styles.mediaLimitsText}>• Capacidad actual: {gallery.length}/{maxGallerySize} archivos</Text>
              </View>
            </View>
            
            <TouchableOpacity 
              style={styles.cancelButton}
              onPress={() => setShowMediaModal(false)}
            >
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Logo Upload Modal */}
      <Modal
        visible={showLogoModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowLogoModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Subir Logo del Negocio</Text>
              <TouchableOpacity onPress={() => setShowLogoModal(false)}>
                <X size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.logoOptionsContainer}>
              <Text style={styles.logoOptionsTitle}>Selecciona una opción:</Text>
              
              <TouchableOpacity 
                style={styles.logoOption}
                onPress={() => handleLogoUpload('camera')}
              >
                <Camera size={24} color="#D81B60" />
                <View style={styles.logoOptionContent}>
                  <Text style={styles.logoOptionTitle}>Tomar Foto</Text>
                  <Text style={styles.logoOptionDescription}>Captura el logo con la cámara</Text>
                </View>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.logoOption}
                onPress={() => handleLogoUpload('gallery')}
              >
                <ImageIcon size={24} color="#D81B60" />
                <View style={styles.logoOptionContent}>
                  <Text style={styles.logoOptionTitle}>Galería de Fotos</Text>
                  <Text style={styles.logoOptionDescription}>Selecciona desde tu galería</Text>
                </View>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.logoOption}
                onPress={() => handleLogoUpload('file')}
              >
                <Folder size={24} color="#D81B60" />
                <View style={styles.logoOptionContent}>
                  <Text style={styles.logoOptionTitle}>Subir Archivo</Text>
                  <Text style={styles.logoOptionDescription}>Selecciona un archivo de imagen</Text>
                </View>
              </TouchableOpacity>
              
              <View style={styles.logoRequirements}>
                <Text style={styles.logoRequirementsTitle}>📋 Requisitos del Logo</Text>
                <Text style={styles.logoRequirementsText}>• Formato: JPG, PNG, GIF, WEBP</Text>
                <Text style={styles.logoRequirementsText}>• Tamaño máximo: 10MB</Text>
                <Text style={styles.logoRequirementsText}>• Recomendado: Imagen cuadrada (1:1)</Text>
                <Text style={styles.logoRequirementsText}>• Resolución mínima: 200x200 px</Text>
              </View>
            </View>
            
            <TouchableOpacity 
              style={styles.cancelButton}
              onPress={() => setShowLogoModal(false)}
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
  textInput: {
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    color: '#333',
    marginBottom: 12,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  saveButton: {
    backgroundColor: '#D81B60',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  addButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 16,
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  serviceCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  serviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  serviceStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  serviceStatusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  servicePrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#D81B60',
    marginBottom: 4,
  },
  serviceDuration: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  serviceDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  serviceActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
    paddingVertical: 10,
    gap: 6,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2196F3',
  },
  removeButton: {
    backgroundColor: '#FFEBEE',
  },
  removeButtonText: {
    color: '#FF5722',
  },
  galleryInfo: {
    marginBottom: 16,
  },
  galleryWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    gap: 8,
  },
  galleryCounter: {
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  galleryCounterText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1976D2',
    marginBottom: 4,
  },
  galleryCounterSubtext: {
    fontSize: 12,
    color: '#1976D2',
    opacity: 0.8,
  },
  warningText: {
    fontSize: 14,
    color: '#F57C00',
    flex: 1,
  },
  galleryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  galleryItem: {
    width: '48%',
    position: 'relative',
  },
  galleryMedia: {
    width: '100%',
    height: 120,
    borderRadius: 8,
    marginBottom: 8,
  },
  videoContainer: {
    position: 'relative',
    width: '100%',
    height: 120,
    borderRadius: 8,
    marginBottom: 8,
  },
  videoOverlay: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -12 }, { translateY: -12 }],
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 20,
    padding: 8,
  },
  removeMediaButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 12,
    padding: 4,
  },
  mediaInfo: {
    flex: 1,
  },
  mediaDescription: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginBottom: 2,
  },
  mediaFileName: {
    fontSize: 10,
    color: '#999',
    textAlign: 'center',
    marginBottom: 2,
  },
  mediaSize: {
    fontSize: 10,
    color: '#999',
    textAlign: 'center',
  },
  mediaOptionsContainer: {
    paddingVertical: 16,
  },
  mediaOptionsSection: {
    marginBottom: 20,
  },
  mediaSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
    paddingLeft: 4,
  },
  mediaLimitsInfo: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  mediaLimitsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  mediaLimitsText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
    lineHeight: 16,
  },
  mediaOptionDisabled: {
    color: '#999',
  },
  mediaOptionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  mediaOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    gap: 16,
  },
  mediaOptionContent: {
    flex: 1,
  },
  mediaOptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  mediaOptionDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 18,
  },
  ticketCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  ticketType: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  ticketStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  ticketStatusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  ticketService: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  ticketDate: {
    fontSize: 12,
    color: '#999',
  },
  infoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    gap: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#1976D2',
    flex: 1,
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
  modalSubtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  modalDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 16,
  },
  modalForm: {
    maxHeight: 300,
  },
  modalBody: {
    paddingVertical: 16,
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
  logoContainer: {
    position: 'relative',
    alignItems: 'center',
    marginBottom: 16,
  },
  businessLogo: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#E5E5E5',
  },
  logoInfo: {
    alignItems: 'center',
    marginBottom: 8,
  },
  logoFileName: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
    marginBottom: 4,
  },
  logoSize: {
    fontSize: 12,
    color: '#666',
  },
  removeLogoButton: {
    position: 'absolute',
    top: 8,
    right: '35%',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 12,
    padding: 6,
  },
  noLogoContainer: {
    alignItems: 'center',
    paddingVertical: 32,
    marginBottom: 16,
  },
  noLogoText: {
    fontSize: 16,
    color: '#999',
    marginTop: 12,
  },
  brandingActions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  brandingButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  createLogoButton: {
    backgroundColor: '#E8F5E8',
    borderColor: '#4CAF50',
  },
  brandingButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#D81B60',
    textAlign: 'center',
  },
  brandingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
    padding: 12,
    gap: 8,
  },
  brandingInfoText: {
    fontSize: 12,
    color: '#1976D2',
    flex: 1,
    lineHeight: 16,
  },
  logoOptionsContainer: {
    paddingVertical: 16,
  },
  logoOptionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  logoOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    gap: 16,
  },
  logoOptionContent: {
    flex: 1,
  },
  logoOptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  logoOptionDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 18,
  },
  logoRequirements: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  logoRequirementsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  logoRequirementsText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
    lineHeight: 16,
  },
});