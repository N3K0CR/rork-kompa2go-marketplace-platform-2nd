import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Modal } from 'react-native';
import { Send, Bot, MessageCircle, Brain, Trash2, MapPin, X } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useKompiBrain } from '@/contexts/KompiBrainContext';
import { useLocationSearch } from '@/contexts/LocationSearchContext';

export default function ChatScreen() {
  const [inputText, setInputText] = useState('');
  const [showLocationButton, setShowLocationButton] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState<string | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const { user } = useAuth();
  const {
    isActive,
    conversations,
    currentConversationId,
    isLoading,
    activateKompi,
    createConversation,
    sendMessage,
    setCurrentConversation,
    deleteConversation,
    getCurrentConversation
  } = useKompiBrain();
  
  const {
    userLocation,
    isLoadingLocation,
    requestLocationPermission
  } = useLocationSearch();

  const currentConversation = getCurrentConversation();
  const messages = currentConversation?.messages || [];
  
  // Check if the last bot message mentions location sharing
  useEffect(() => {
    const lastBotMessage = messages.filter(m => m.role === 'assistant').pop();
    console.log('🔍 Checking for location button visibility...');
    console.log('🔍 Last bot message:', lastBotMessage?.content?.substring(0, 100));
    
    if (lastBotMessage) {
      const content = lastBotMessage.content.toLowerCase();
      const needsLocation = content.includes('ubicación') || 
                           content.includes('compartir') ||
                           content.includes('cerca') ||
                           content.includes('zona') ||
                           content.includes('botón');
      console.log('🔍 Needs location button:', needsLocation);
      console.log('🔍 Content keywords found:', {
        ubicacion: content.includes('ubicación'),
        compartir: content.includes('compartir'),
        cerca: content.includes('cerca'),
        zona: content.includes('zona'),
        boton: content.includes('botón')
      });
      setShowLocationButton(needsLocation);
    } else {
      console.log('🔍 No bot messages found, hiding location button');
      setShowLocationButton(false);
    }
  }, [messages]);

  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  useEffect(() => {
    // Activate KompiBrain and create initial conversation if needed
    if (!isActive) {
      activateKompi();
    }
    
    if (!currentConversationId && conversations.length === 0) {
      const newConversationId = createConversation('Chat Principal');
      console.log('Created initial conversation:', newConversationId);
    }
  }, [isActive, currentConversationId, conversations.length, activateKompi, createConversation]);

  const handleSendMessage = async () => {
    if (!inputText.trim() || isLoading) return;
    
    if (!currentConversationId) {
      console.log('No hay conversación activa. Creando nueva conversación...');
      const newId = createConversation('Nueva Conversación');
      setCurrentConversation(newId);
      return;
    }

    try {
      await sendMessage(currentConversationId, inputText.trim());
      setInputText('');
    } catch (error) {
      console.error('Error sending message:', error);
      console.log('No se pudo enviar el mensaje. Inténtalo de nuevo.');
    }
  };

  const handleNewConversation = () => {
    const newId = createConversation(`Conversación ${conversations.length + 1}`);
    setCurrentConversation(newId);
  };

  const handleDeleteConversation = (conversationId: string) => {
    setShowDeleteModal(conversationId);
  };

  const confirmDeleteConversation = () => {
    if (showDeleteModal) {
      deleteConversation(showDeleteModal);
      setShowDeleteModal(null);
    }
  };
  
  const handleShareLocation = () => {
    console.log('🗺️ Location button pressed!');
    setShowLocationModal(true);
  };

  const shareCurrentLocation = async () => {
    console.log('📍 Sharing current location...');
    
    if (!currentConversationId) {
      console.log('❌ No current conversation ID');
      setShowLocationModal(false);
      return;
    }
    
    try {
      console.log('📍 Requesting location permission...');
      const location = await requestLocationPermission();
      console.log('📍 Location result:', location);
      
      if (location) {
        const locationMessage = `Mi ubicación actual: ${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`;
        console.log('📤 Sending location message:', locationMessage);
        await sendMessage(currentConversationId, locationMessage);
        setShowLocationButton(false);
        setShowLocationModal(false);
        console.log('✅ Location shared successfully');
      } else {
        console.log('❌ Location not available');
        setShowLocationModal(false);
      }
    } catch (error) {
      console.error('❌ Error sharing location:', error);
      setShowLocationModal(false);
    }
  };

  const shareManualLocation = (location: string) => {
    if (!currentConversationId || !location.trim()) return;
    
    console.log('📤 Sending manual location:', location);
    sendMessage(currentConversationId, `Mi ubicación: ${location.trim()}`);
    setShowLocationButton(false);
    setShowLocationModal(false);
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Brain size={24} color="#D81B60" />
          <View>
            <Text style={styles.headerTitle}>KompiBrain</Text>
            <Text style={styles.headerSubtitle}>
              {isActive ? '🧠 Memoria Activa' : '💤 Inactivo'} • {conversations.length} conversaciones
            </Text>
          </View>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={handleNewConversation}
          >
            <MessageCircle size={20} color="#D81B60" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Conversation Selector */}
      {conversations.length > 1 && (
        <View style={styles.conversationSelector}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {conversations.map((conv) => (
              <TouchableOpacity
                key={conv.id}
                style={[
                  styles.conversationTab,
                  currentConversationId === conv.id && styles.activeConversationTab
                ]}
                onPress={() => setCurrentConversation(conv.id)}
                onLongPress={() => handleDeleteConversation(conv.id)}
              >
                <Text style={[
                  styles.conversationTabText,
                  currentConversationId === conv.id && styles.activeConversationTabText
                ]}>
                  {conv.title}
                </Text>
                <Text style={styles.conversationTabCount}>
                  {conv.messages.length}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
      >
        {messages.length === 0 ? (
          <View style={styles.emptyState}>
            <Brain size={48} color="#D81B60" />
            <Text style={styles.emptyStateTitle}>¡Hola! Soy KompiBrain</Text>
            <Text style={styles.emptyStateText}>
              Tu asistente inteligente con memoria. Puedo recordar nuestras conversaciones anteriores y ayudarte mejor cada vez.
            </Text>
            <Text style={styles.emptyStateHint}>
              Escribe un mensaje para comenzar...
            </Text>
          </View>
        ) : (
          messages.map((message) => (
            <View
              key={message.id}
              style={[
                styles.messageContainer,
                message.role === 'user' ? styles.userMessage : styles.botMessage,
              ]}
            >
              <View
                style={[
                  styles.messageBubble,
                  message.role === 'user' ? styles.userBubble : styles.botBubble,
                ]}
              >
                <Text
                  style={[
                    styles.messageText,
                    message.role === 'user' ? styles.userText : styles.botText,
                  ]}
                >
                  {message.content}
                </Text>
                <Text style={[
                  styles.messageTime,
                  message.role === 'user' ? styles.userTime : styles.botTime
                ]}>
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
            </View>
          ))
        )}
        
        {isLoading && (
          <View style={[styles.messageContainer, styles.botMessage]}>
            <View style={[styles.messageBubble, styles.botBubble]}>
              <Text style={styles.loadingText}>🧠 KompiBrain está pensando...</Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Location sharing button */}
      {(() => {
        console.log('🔴 Rendering location button area, showLocationButton:', showLocationButton);
        return null;
      })()}
      {showLocationButton && (
        <View style={styles.locationButtonContainer}>
          {(() => {
            console.log('🔴 Location button container is rendering!');
            return null;
          })()}
          <TouchableOpacity
            style={styles.locationButton}
            onPress={handleShareLocation}
          >
            <MapPin size={16} color="white" />
            <Text style={styles.locationButtonText}>
              Compartir Ubicación
            </Text>
          </TouchableOpacity>
          <Text style={styles.locationHint}>
            O escribe tu zona manualmente (ej: San José Centro)
          </Text>
        </View>
      )}
      
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          value={inputText}
          onChangeText={setInputText}
          placeholder="Escribe tu mensaje..."
          placeholderTextColor="#666"
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          style={[styles.sendButton, (!inputText.trim() || isLoading) && styles.sendButtonDisabled]}
          onPress={handleSendMessage}
          disabled={!inputText.trim() || isLoading}
        >
          <Send size={20} color={(!inputText.trim() || isLoading) ? '#CCC' : 'white'} />
        </TouchableOpacity>
      </View>

      {/* Location Modal */}
      <LocationModal
        visible={showLocationModal}
        onClose={() => setShowLocationModal(false)}
        onShareCurrent={shareCurrentLocation}
        onShareManual={shareManualLocation}
        isLoadingLocation={isLoadingLocation}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        visible={showDeleteModal !== null}
        onClose={() => setShowDeleteModal(null)}
        onConfirm={confirmDeleteConversation}
      />
    </KeyboardAvoidingView>
  );
}

// Location Modal Component
interface LocationModalProps {
  visible: boolean;
  onClose: () => void;
  onShareCurrent: () => void;
  onShareManual: (location: string) => void;
  isLoadingLocation: boolean;
}

function LocationModal({ visible, onClose, onShareCurrent, onShareManual, isLoadingLocation }: LocationModalProps) {
  const [manualLocation, setManualLocation] = useState('');

  const handleManualShare = () => {
    if (manualLocation.trim()) {
      onShareManual(manualLocation.trim());
      setManualLocation('');
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Compartir Ubicación</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <Text style={styles.modalDescription}>
            Elige cómo compartir tu ubicación para encontrar proveedores cercanos:
          </Text>

          <TouchableOpacity
            style={[styles.modalButton, styles.currentLocationButton]}
            onPress={onShareCurrent}
            disabled={isLoadingLocation}
          >
            <MapPin size={20} color="white" />
            <Text style={styles.modalButtonText}>
              {isLoadingLocation ? 'Obteniendo ubicación...' : 'Usar Ubicación Actual'}
            </Text>
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>O</Text>
            <View style={styles.dividerLine} />
          </View>

          <Text style={styles.manualLocationLabel}>Escribe tu zona manualmente:</Text>
          <TextInput
            style={styles.manualLocationInput}
            value={manualLocation}
            onChangeText={setManualLocation}
            placeholder="Ej: San José Centro, Cartago, Heredia..."
            placeholderTextColor="#999"
          />

          <TouchableOpacity
            style={[styles.modalButton, styles.manualLocationButton, !manualLocation.trim() && styles.disabledButton]}
            onPress={handleManualShare}
            disabled={!manualLocation.trim()}
          >
            <Text style={[styles.modalButtonText, styles.manualButtonText]}>
              Usar Esta Ubicación
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// Delete Confirmation Modal Component
interface DeleteConfirmationModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

function DeleteConfirmationModal({ visible, onClose, onConfirm }: DeleteConfirmationModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.deleteModalContent}>
          <Text style={styles.deleteModalTitle}>Eliminar Conversación</Text>
          <Text style={styles.deleteModalDescription}>
            ¿Estás seguro de que quieres eliminar esta conversación? Esta acción no se puede deshacer.
          </Text>
          
          <View style={styles.deleteModalButtons}>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={onClose}
            >
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.modalButton, styles.deleteButton]}
              onPress={onConfirm}
            >
              <Text style={styles.deleteButtonText}>Eliminar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    backgroundColor: 'white',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  headerButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
  },
  conversationSelector: {
    backgroundColor: 'white',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  conversationTab: {
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  activeConversationTab: {
    backgroundColor: '#D81B60',
  },
  conversationTabText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  activeConversationTabText: {
    color: 'white',
  },
  conversationTabCount: {
    fontSize: 12,
    color: '#999',
    backgroundColor: 'rgba(255,255,255,0.3)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 20,
    textAlign: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyStateTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 16,
  },
  emptyStateHint: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 20,
  },
  messageContainer: {
    marginBottom: 16,
  },
  userMessage: {
    alignItems: 'flex-end',
  },
  botMessage: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
  },
  userBubble: {
    backgroundColor: '#D81B60',
    borderBottomRightRadius: 4,
  },
  botBubble: {
    backgroundColor: 'white',
    borderBottomLeftRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
    marginBottom: 4,
  },
  messageTime: {
    fontSize: 11,
    opacity: 0.7,
  },
  userTime: {
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'right',
  },
  botTime: {
    color: '#999',
  },
  userText: {
    color: 'white',
  },
  botText: {
    color: '#333',
  },
  loadingText: {
    color: '#666',
    fontStyle: 'italic',
  },
  inputContainer: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  textInput: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    maxHeight: 100,
    color: '#333',
  },
  sendButton: {
    backgroundColor: '#D81B60',
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#F5F5F5',
  },
  locationButtonContainer: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
    alignItems: 'center',
  },
  locationButton: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    gap: 8,
    marginBottom: 8,
  },
  locationButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  locationHint: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
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
  closeButton: {
    padding: 4,
  },
  modalDescription: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
    lineHeight: 22,
  },
  modalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 8,
  },
  currentLocationButton: {
    backgroundColor: '#4CAF50',
    marginBottom: 20,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E5E5',
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
    color: '#999',
  },
  manualLocationLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  manualLocationInput: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
    marginBottom: 16,
  },
  manualLocationButton: {
    backgroundColor: '#D81B60',
  },
  manualButtonText: {
    color: 'white',
  },
  disabledButton: {
    backgroundColor: '#CCC',
  },
  // Delete Modal Styles
  deleteModalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 350,
  },
  deleteModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  deleteModalDescription: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 22,
  },
  deleteModalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  deleteButton: {
    flex: 1,
    backgroundColor: '#FF4444',
  },
  deleteButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});