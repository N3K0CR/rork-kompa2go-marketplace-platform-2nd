import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  SafeAreaView,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { Stack } from 'expo-router';
import { useKompiBrain } from '@/contexts/KompiBrainContext';
import { MessageCircle, Plus, Trash2, Settings, Power, PowerOff, MapPin, Send, Navigation } from 'lucide-react-native';
import * as Location from 'expo-location';

export default function TestKompiScreen() {
  const {
    isActive,
    conversations,
    currentConversationId,
    isLoading,
    settings,
    activateKompi,
    deactivateKompi,
    createConversation,
    sendMessage,
    setCurrentConversation,
    deleteConversation,
    updateSettings,
    clearAllData,

  } = useKompiBrain();

  const [messageInput, setMessageInput] = useState('');
  const [conversationTitle, setConversationTitle] = useState('');
  const [currentLocation, setCurrentLocation] = useState<Location.LocationObject | null>(null);
  const [locationPermission, setLocationPermission] = useState<Location.PermissionStatus | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [showLocationOptions, setShowLocationOptions] = useState(false);

  const currentConversation = useMemo(() => {
    if (!currentConversationId) {
      return null;
    }
    return conversations.find(conv => conv.id === currentConversationId) || null;
  }, [currentConversationId, conversations]);

  // Check location permission on mount
  useEffect(() => {
    (async () => {
      if (Platform.OS !== 'web') {
        const { status } = await Location.getForegroundPermissionsAsync();
        setLocationPermission(status);
      }
    })();
  }, []);

  const requestLocationPermission = async () => {
    if (Platform.OS === 'web') {
      Alert.alert('Ubicación', 'La ubicación automática no está disponible en web. Por favor, escribe tu ubicación manualmente.');
      return false;
    }

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setLocationPermission(status);
      
      if (status !== 'granted') {
        Alert.alert(
          'Permisos de ubicación',
          'Para mostrarte proveedores cercanos, necesitamos acceso a tu ubicación. Puedes habilitarlo en configuración o escribir tu ubicación manualmente.'
        );
        return false;
      }
      return true;
    } catch (error) {
      console.error('Error requesting location permission:', error);
      Alert.alert('Error', 'No se pudo solicitar permisos de ubicación');
      return false;
    }
  };

  const getCurrentLocation = async () => {
    if (Platform.OS === 'web') {
      Alert.alert('Ubicación', 'La ubicación automática no está disponible en web. Por favor, escribe tu ubicación manualmente.');
      return;
    }

    setIsGettingLocation(true);
    
    try {
      // Check permission first
      if (locationPermission !== 'granted') {
        const hasPermission = await requestLocationPermission();
        if (!hasPermission) {
          setIsGettingLocation(false);
          return;
        }
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 10000,
      });
      
      setCurrentLocation(location);
      
      // Get address from coordinates
      const [address] = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
      
      const locationText = `${address.city || address.district || address.subregion}, ${address.region || address.country}`;
      
      // Add location to message input
      const locationMessage = `Mi ubicación actual: ${locationText} (${location.coords.latitude.toFixed(6)}, ${location.coords.longitude.toFixed(6)})`;
      
      if (currentConversationId) {
        await sendMessage(currentConversationId, locationMessage);
      } else {
        setMessageInput(prev => prev + (prev ? '\n' : '') + locationMessage);
      }
      
      Alert.alert('Ubicación compartida', `Se ha compartido tu ubicación: ${locationText}`);
      
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert(
        'Error de ubicación',
        'No se pudo obtener tu ubicación actual. Puedes escribir tu ubicación manualmente.'
      );
    } finally {
      setIsGettingLocation(false);
      setShowLocationOptions(false);
    }
  };

  const showLocationDialog = () => {
    Alert.alert(
      'Compartir ubicación',
      '¿Cómo quieres compartir tu ubicación?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Ubicación actual',
          onPress: getCurrentLocation,
        },
        {
          text: 'Escribir manualmente',
          onPress: () => {
            setMessageInput(prev => prev + (prev ? '\n' : '') + 'Mi ubicación: ');
          },
        },
      ]
    );
  };

  const sendLocationSuggestions = async () => {
    if (!currentConversationId) return;
    
    const suggestions = [
      'San José centro',
      'Heredia',
      'Alajuela',
      'Cartago',
      'Puntarenas',
      'Guanacaste',
      'Limón'
    ];
    
    const suggestionText = `Puedes elegir una de estas zonas principales de Costa Rica:\n\n${suggestions.map((zone, index) => `${index + 1}. ${zone}`).join('\n')}\n\nO escribe tu ubicación específica (barrio, residencial, etc.)`;
    
    await sendMessage(currentConversationId, suggestionText);
  };

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !currentConversationId) return;
    
    try {
      await sendMessage(currentConversationId, messageInput.trim());
      setMessageInput('');
    } catch (error) {
      Alert.alert('Error', 'No se pudo enviar el mensaje');
    }
  };

  const handleCreateConversation = () => {
    const title = conversationTitle.trim() || undefined;
    const newId = createConversation(title);
    setConversationTitle('');
    Alert.alert('Éxito', `Conversación creada con ID: ${newId}`);
  };

  const handleDeleteConversation = (id: string) => {
    Alert.alert(
      'Confirmar eliminación',
      '¿Estás seguro de que quieres eliminar esta conversación?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => deleteConversation(id),
        },
      ]
    );
  };

  const handleClearAllData = () => {
    Alert.alert(
      'Limpiar todos los datos',
      '¿Estás seguro de que quieres eliminar todas las conversaciones?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Limpiar',
          style: 'destructive',
          onPress: clearAllData,
        },
      ]
    );
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <Stack.Screen options={{ title: 'Chat Kompi - Test', headerShown: true }} />
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Status Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Estado del Sistema</Text>
          <View style={styles.statusContainer}>
            <View style={styles.statusItem}>
              <Text style={styles.statusLabel}>Estado:</Text>
              <View style={[styles.statusIndicator, { backgroundColor: isActive ? '#4CAF50' : '#F44336' }]}>
                {isActive ? <Power size={16} color="white" /> : <PowerOff size={16} color="white" />}
                <Text style={styles.statusText}>{isActive ? 'Activo' : 'Inactivo'}</Text>
              </View>
            </View>
            
            <View style={styles.statusItem}>
              <Text style={styles.statusLabel}>Cargando:</Text>
              <Text style={[styles.statusValue, { color: isLoading ? '#FF9800' : '#4CAF50' }]}>
                {isLoading ? 'Sí' : 'No'}
              </Text>
            </View>
            
            <View style={styles.statusItem}>
              <Text style={styles.statusLabel}>Conversaciones:</Text>
              <Text style={styles.statusValue}>{conversations.length}</Text>
            </View>
            
            <View style={styles.statusItem}>
              <Text style={styles.statusLabel}>Conversación actual:</Text>
              <Text style={styles.statusValue}>{currentConversationId || 'Ninguna'}</Text>
            </View>
          </View>
          
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.button, styles.activateButton]}
              onPress={activateKompi}
              disabled={isActive}
            >
              <Power size={16} color="white" />
              <Text style={styles.buttonText}>Activar</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.button, styles.deactivateButton]}
              onPress={deactivateKompi}
              disabled={!isActive}
            >
              <PowerOff size={16} color="white" />
              <Text style={styles.buttonText}>Desactivar</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Settings Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Configuración</Text>
          <View style={styles.settingsContainer}>
            <Text style={styles.settingItem}>Tema: {settings.theme}</Text>
            <Text style={styles.settingItem}>Idioma: {settings.language}</Text>
            <Text style={styles.settingItem}>Auto-guardar: {settings.autoSave ? 'Sí' : 'No'}</Text>
          </View>
          
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.button, styles.settingsButton]}
              onPress={() => updateSettings({ theme: settings.theme === 'light' ? 'dark' : 'light' })}
            >
              <Settings size={16} color="white" />
              <Text style={styles.buttonText}>Cambiar Tema</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.button, styles.settingsButton]}
              onPress={() => updateSettings({ language: settings.language === 'es' ? 'en' : 'es' })}
            >
              <Settings size={16} color="white" />
              <Text style={styles.buttonText}>Cambiar Idioma</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Create Conversation Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Crear Conversación</Text>
          <TextInput
            style={styles.input}
            placeholder="Título de la conversación (opcional)"
            value={conversationTitle}
            onChangeText={setConversationTitle}
          />
          <TouchableOpacity
            style={[styles.button, styles.createButton]}
            onPress={handleCreateConversation}
          >
            <Plus size={16} color="white" />
            <Text style={styles.buttonText}>Crear Conversación</Text>
          </TouchableOpacity>
        </View>

        {/* Conversations List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Conversaciones ({conversations.length})</Text>
          {conversations.length === 0 ? (
            <Text style={styles.emptyText}>No hay conversaciones</Text>
          ) : (
            conversations.map((conversation) => (
              <View key={conversation.id} style={styles.conversationItem}>
                <View style={styles.conversationHeader}>
                  <MessageCircle size={16} color="#666" />
                  <Text style={styles.conversationTitle}>{conversation.title}</Text>
                  <Text style={styles.conversationId}>ID: {conversation.id}</Text>
                </View>
                <Text style={styles.conversationInfo}>
                  Mensajes: {conversation.messages.length} | 
                  Creada: {conversation.createdAt.toLocaleDateString()}
                </Text>
                
                <View style={styles.conversationActions}>
                  <TouchableOpacity
                    style={[
                      styles.smallButton,
                      styles.selectButton,
                      currentConversationId === conversation.id && styles.selectedButton
                    ]}
                    onPress={() => setCurrentConversation(conversation.id)}
                  >
                    <Text style={styles.smallButtonText}>
                      {currentConversationId === conversation.id ? 'Seleccionada' : 'Seleccionar'}
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[styles.smallButton, styles.deleteButton]}
                    onPress={() => handleDeleteConversation(conversation.id)}
                  >
                    <Trash2 size={12} color="white" />
                    <Text style={styles.smallButtonText}>Eliminar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Current Conversation Messages */}
        {currentConversation && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Mensajes - {currentConversation.title}
            </Text>
            {currentConversation.messages.length === 0 ? (
              <Text style={styles.emptyText}>No hay mensajes en esta conversación</Text>
            ) : (
              currentConversation.messages.map((message: any) => (
                <View key={message.id} style={[
                  styles.messageItem,
                  message.role === 'user' ? styles.userMessage : styles.assistantMessage
                ]}>
                  <Text style={styles.messageRole}>{message.role.toUpperCase()}</Text>
                  <Text style={styles.messageContent}>{message.content}</Text>
                  <Text style={styles.messageTime}>
                    {message.timestamp.toLocaleTimeString()}
                  </Text>
                </View>
              ))
            )}
          </View>
        )}

        {/* Send Message Section */}
        {currentConversationId && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Enviar Mensaje</Text>
            
            {/* Location Options */}
            <View style={styles.locationContainer}>
              <TouchableOpacity
                style={[styles.locationButton, styles.primaryLocationButton]}
                onPress={showLocationDialog}
                disabled={isGettingLocation}
              >
                <MapPin size={16} color="white" />
                <Text style={styles.locationButtonText}>
                  {isGettingLocation ? 'Obteniendo...' : 'Compartir Ubicación'}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.locationButton, styles.secondaryLocationButton]}
                onPress={sendLocationSuggestions}
              >
                <Navigation size={16} color="#2196F3" />
                <Text style={[styles.locationButtonText, { color: '#2196F3' }]}>
                  Zonas CR
                </Text>
              </TouchableOpacity>
            </View>
            
            <TextInput
              style={[styles.input, styles.messageInput]}
              placeholder="Escribe tu mensaje aquí... \n\nEjemplos:\n• 'necesito una barbería cerca de mi'\n• 'Mi ubicación: Cartago, Tejar'\n• 'busco limpieza en San José centro'"
              value={messageInput}
              onChangeText={setMessageInput}
              multiline
              numberOfLines={4}
            />
            
            <View style={styles.messageActions}>
              <TouchableOpacity
                style={[
                  styles.button,
                  styles.sendButton,
                  (!messageInput.trim() || isLoading) && styles.disabledButton
                ]}
                onPress={handleSendMessage}
                disabled={!messageInput.trim() || isLoading}
              >
                <Send size={16} color="white" />
                <Text style={styles.buttonText}>
                  {isLoading ? 'Enviando...' : 'Enviar'}
                </Text>
              </TouchableOpacity>
            </View>
            
            {/* Quick Location Examples */}
            <View style={styles.quickExamples}>
              <Text style={styles.quickExamplesTitle}>Ejemplos rápidos:</Text>
              <View style={styles.quickExamplesContainer}>
                {[
                  'Cartago, Tejar',
                  'San José centro',
                  'Heredia, Mercedes',
                  'Alajuela centro'
                ].map((example, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.quickExampleButton}
                    onPress={() => setMessageInput(`Mi ubicación: ${example}`)}
                  >
                    <Text style={styles.quickExampleText}>{example}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* Clear Data Section */}
        <View style={styles.section}>
          <TouchableOpacity
            style={[styles.button, styles.clearButton]}
            onPress={handleClearAllData}
          >
            <Trash2 size={16} color="white" />
            <Text style={styles.buttonText}>Limpiar Todos los Datos</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  statusContainer: {
    marginBottom: 16,
  },
  statusItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  statusValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 8,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  buttonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  activateButton: {
    backgroundColor: '#4CAF50',
  },
  deactivateButton: {
    backgroundColor: '#F44336',
  },
  settingsButton: {
    backgroundColor: '#2196F3',
  },
  createButton: {
    backgroundColor: '#FF9800',
  },
  sendButton: {
    backgroundColor: '#9C27B0',
  },
  clearButton: {
    backgroundColor: '#F44336',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  locationContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 6,
    flex: 1,
  },
  primaryLocationButton: {
    backgroundColor: '#4CAF50',
  },
  secondaryLocationButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#2196F3',
  },
  locationButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: 'white',
  },
  messageActions: {
    marginTop: 8,
  },
  quickExamples: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  quickExamplesTitle: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
    fontWeight: '500',
  },
  quickExamplesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  quickExampleButton: {
    backgroundColor: '#f0f0f0',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  quickExampleText: {
    fontSize: 12,
    color: '#666',
  },
  settingsContainer: {
    marginBottom: 16,
  },
  settingItem: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    marginBottom: 12,
    backgroundColor: '#f9f9f9',
  },
  messageInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 20,
  },
  conversationItem: {
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    backgroundColor: '#fafafa',
  },
  conversationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 8,
  },
  conversationTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  conversationId: {
    fontSize: 10,
    color: '#999',
  },
  conversationInfo: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  conversationActions: {
    flexDirection: 'row',
    gap: 8,
  },
  smallButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    gap: 4,
  },
  smallButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  selectButton: {
    backgroundColor: '#2196F3',
  },
  selectedButton: {
    backgroundColor: '#4CAF50',
  },
  deleteButton: {
    backgroundColor: '#F44336',
  },
  messageItem: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  userMessage: {
    backgroundColor: '#E3F2FD',
    alignSelf: 'flex-end',
    maxWidth: '80%',
  },
  assistantMessage: {
    backgroundColor: '#F3E5F5',
    alignSelf: 'flex-start',
    maxWidth: '80%',
  },
  messageRole: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 4,
  },
  messageContent: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  messageTime: {
    fontSize: 10,
    color: '#999',
    textAlign: 'right',
  },
});