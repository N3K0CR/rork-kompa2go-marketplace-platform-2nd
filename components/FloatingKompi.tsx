import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Dimensions, Platform, PanResponder, Alert } from 'react-native';
import { MessageCircle, X, MapPin, Volume2, Brain, Database } from 'lucide-react-native';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useKompiBrain } from '@/contexts/KompiBrainContext';

const { width } = Dimensions.get('window');

interface FloatingKompiProps {
  isVisible?: boolean;
  onLocationShare?: () => void;
  serviceRequest?: {
    id: string;
    clientName: string;
    service: string;
    location: string;
    timestamp: number;
  } | null;
  onAcceptRequest?: (requestId: string) => void;
  onRejectRequest?: (requestId: string) => void;
}

export default function FloatingKompi({ 
  isVisible = true, 
  onLocationShare, 
  serviceRequest, 
  onAcceptRequest, 
  onRejectRequest 
}: FloatingKompiProps) {
  const [showGreeting, setShowGreeting] = useState(false);
  const [greetingType, setGreetingType] = useState<'welcome' | 'idle' | 'help'>('welcome');
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0));
  const [showServiceAlert, setShowServiceAlert] = useState(false);
  const [alertTimeLeft, setAlertTimeLeft] = useState(20);
  const pan = useRef(new Animated.ValueXY()).current;
  const { user } = useAuth();
  const { t } = useLanguage();
  const { 
    isActive, 
    conversations, 
    currentConversationId, 
    isLoading,
    activateKompi,
    createConversation,
    setCurrentConversation 
  } = useKompiBrain();
  
  // Drag and drop functionality
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        pan.setOffset({
          x: (pan.x as any)._value,
          y: (pan.y as any)._value,
        });
      },
      onPanResponderMove: Animated.event(
        [null, { dx: pan.x, dy: pan.y }],
        { useNativeDriver: false }
      ),
      onPanResponderRelease: () => {
        pan.flattenOffset();
        // Snap to edges if needed
        const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
        const currentX = (pan.x as any)._value;
        const currentY = (pan.y as any)._value;
        
        // Keep within screen bounds
        const newX = Math.max(-screenWidth/2 + 50, Math.min(screenWidth/2 - 50, currentX));
        const newY = Math.max(-screenHeight/2 + 100, Math.min(screenHeight/2 - 200, currentY));
        
        Animated.spring(pan, {
          toValue: { x: newX, y: newY },
          useNativeDriver: false,
        }).start();
      },
    })
  ).current;
  
  const greetings = {
    welcome: `${t('hello')}${user?.name ? `, ${user.name}` : ''}! 👋 Soy Kompi, tu asistente inteligente con memoria. ¿En qué puedo ayudarte hoy?`,
    idle: '🧠 Mi memoria está activa y puedo recordar nuestras conversaciones anteriores. ¿Necesitas ayuda?',
    help: '🔍 Puedo ayudarte a buscar servicios, recordar tus preferencias, y aprender de nuestras conversaciones.',
  };

  // Service request alert effect
  useEffect(() => {
    if (serviceRequest && user?.userType === 'provider') {
      setShowServiceAlert(true);
      setAlertTimeLeft(20);
      
      // Play alert sound (simulated with console log)
      console.log('🔊 UBER-STYLE ALERT: New service request!');
      
      const alertTimer = setInterval(() => {
        setAlertTimeLeft(prev => {
          if (prev <= 1) {
            setShowServiceAlert(false);
            console.log('⏰ Service request timed out - rerouting to next provider');
            // Trigger client notification about provider not responding
            Alert.alert(
              'Proveedor no disponible',
              'El proveedor no respondió. Buscando otro proveedor disponible...',
              [{ text: 'OK' }]
            );
            clearInterval(alertTimer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      return () => clearInterval(alertTimer);
    }
  }, [serviceRequest, user?.userType]);

  useEffect(() => {
    if (isVisible) {
      // Show the floating button with animation
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();

      // Show different greetings based on user activity
      const greetingTimer = setTimeout(() => {
        if (!user) {
          setGreetingType('welcome');
        } else {
          setGreetingType('idle');
        }
        setShowGreeting(true);
        setTimeout(() => setShowGreeting(false), 7000);
      }, 4000);
      
      // Show help greeting after longer inactivity
      const helpTimer = setTimeout(() => {
        setGreetingType('help');
        setShowGreeting(true);
        setTimeout(() => setShowGreeting(false), 6000);
      }, 15000);

      return () => {
        clearTimeout(greetingTimer);
        clearTimeout(helpTimer);
      };
    }
  }, [isVisible, fadeAnim, scaleAnim, user]);

  const handlePress = () => {
    setShowGreeting(false);
    
    // Activate KompiBrain if not active
    if (!isActive) {
      activateKompi();
    }
    
    // Create initial conversation if none exists
    if (!currentConversationId && conversations.length === 0) {
      const newId = createConversation('Chat Principal');
      setCurrentConversation(newId);
      console.log('Kompi: Created initial conversation:', newId);
    }
    
    console.log('Kompi: Opening chat with memory enabled');
    console.log('Kompi: Active conversations:', conversations.length);
    console.log('Kompi: Current conversation:', currentConversationId);
    console.log('Kompi: User type:', user?.userType || 'guest');
    
    router.push('/chat');
  };
  
  const handleLocationShare = () => {
    if (Platform.OS === 'web') {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            console.log('Kompi: Location shared -', {
              lat: position.coords.latitude,
              lng: position.coords.longitude
            });
            onLocationShare?.();
          },
          (error) => {
            console.log('Kompi: Location sharing failed -', error.message);
          }
        );
      }
    } else {
      console.log('Kompi: Location sharing requested on mobile');
      onLocationShare?.();
    }
    setShowGreeting(false);
  };

  const dismissGreeting = () => {
    setShowGreeting(false);
  };
  
  const handleAcceptRequest = () => {
    if (serviceRequest && onAcceptRequest) {
      onAcceptRequest(serviceRequest.id);
      setShowServiceAlert(false);
      console.log('✅ Service request accepted');
    }
  };
  
  const handleRejectRequest = () => {
    if (serviceRequest && onRejectRequest) {
      Alert.alert(
        'Rechazar Solicitud',
        '¿Estás seguro? Rechazar sin una razón válida resultará en una sanción de 30 minutos.',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Rechazar',
            style: 'destructive',
            onPress: () => {
              onRejectRequest(serviceRequest.id);
              setShowServiceAlert(false);
              console.log('❌ Service request rejected - 30min penalty applied');
            }
          }
        ]
      );
    }
  };

  if (!isVisible) return null;

  return (
    <Animated.View 
      style={[
        styles.container,
        {
          transform: [{ translateX: pan.x }, { translateY: pan.y }]
        }
      ]}
      {...panResponder.panHandlers}
    >
      {/* Service Request Alert */}
      {showServiceAlert && serviceRequest && (
        <Animated.View style={[styles.serviceAlert, { opacity: fadeAnim }]}>
          <View style={styles.alertHeader}>
            <Volume2 size={20} color="#FF5722" />
            <Text style={styles.alertTitle}>¡Nueva Solicitud de Servicio!</Text>
            <Text style={styles.alertTimer}>{alertTimeLeft}s</Text>
          </View>
          <View style={styles.alertContent}>
            <Text style={styles.alertClient}>{serviceRequest.clientName}</Text>
            <Text style={styles.alertService}>{serviceRequest.service}</Text>
            <Text style={styles.alertLocation}>📍 {serviceRequest.location}</Text>
          </View>
          <View style={styles.alertActions}>
            <TouchableOpacity 
              style={styles.rejectButton}
              onPress={handleRejectRequest}
            >
              <Text style={styles.rejectButtonText}>Rechazar</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.acceptButton}
              onPress={handleAcceptRequest}
            >
              <Text style={styles.acceptButtonText}>Aceptar</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}
      
      {showGreeting && !showServiceAlert && (
        <Animated.View style={[styles.greetingBubble, { opacity: fadeAnim }]}>
          <TouchableOpacity 
            style={styles.dismissButton}
            onPress={dismissGreeting}
          >
            <X size={16} color="#666" />
          </TouchableOpacity>
          <Text style={styles.greetingText}>
            {greetings[greetingType]}
          </Text>
          
          {/* Memory Status */}
          {isActive && (
            <View style={styles.memoryStatus}>
              <Brain size={14} color="#D81B60" />
              <Text style={styles.memoryStatusText}>
                {conversations.length} conversaciones en memoria
              </Text>
            </View>
          )}
          {greetingType === 'idle' && (
            <TouchableOpacity 
              style={styles.locationButton}
              onPress={handleLocationShare}
            >
              <MapPin size={14} color="#D81B60" />
              <Text style={styles.locationButtonText}>{t('share_location')}</Text>
            </TouchableOpacity>
          )}
          <View style={styles.bubbleArrow} />
        </Animated.View>
      )}
      
      <Animated.View
        style={[
          styles.floatingButton,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.button,
            showServiceAlert && styles.buttonAlert
          ]}
          onPress={handlePress}
          activeOpacity={0.8}
        >
          <View style={styles.buttonContent}>
            <Brain size={24} color="white" />
            <Text style={styles.buttonText}>Kompi</Text>
            {isActive && (
              <View style={styles.memoryIndicator}>
                <Database size={12} color="white" />
              </View>
            )}
          </View>
          <View style={[
            styles.onlineIndicator,
            showServiceAlert && styles.alertIndicator,
            isActive && styles.memoryActiveIndicator
          ]} />
          
          {/* Memory Status Badge */}
          {conversations.length > 0 && (
            <View style={styles.conversationBadge}>
              <Text style={styles.conversationBadgeText}>{conversations.length}</Text>
            </View>
          )}
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    zIndex: 1000,
  },
  serviceAlert: {
    position: 'absolute',
    bottom: 70,
    right: 0,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    width: width - 40,
    maxWidth: 320,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#FF5722',
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF5722',
    flex: 1,
    marginLeft: 8,
  },
  alertTimer: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FF5722',
    backgroundColor: '#FFEBEE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  alertContent: {
    marginBottom: 16,
  },
  alertClient: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  alertService: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  alertLocation: {
    fontSize: 14,
    color: '#999',
  },
  alertActions: {
    flexDirection: 'row',
    gap: 12,
  },
  rejectButton: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  rejectButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  acceptButton: {
    flex: 1,
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  acceptButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
  buttonAlert: {
    backgroundColor: '#FF5722',
  },
  alertIndicator: {
    backgroundColor: '#FF5722',
  },
  floatingButton: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  button: {
    backgroundColor: '#D81B60',
    borderRadius: 30,
    paddingHorizontal: 20,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
    minWidth: 120,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    position: 'relative',
  },
  memoryIndicator: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 8,
    padding: 2,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  onlineIndicator: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 12,
    height: 12,
    backgroundColor: '#4CAF50',
    borderRadius: 6,
    borderWidth: 2,
    borderColor: 'white',
  },
  memoryActiveIndicator: {
    backgroundColor: '#2196F3',
  },
  conversationBadge: {
    position: 'absolute',
    top: -8,
    left: -8,
    backgroundColor: '#FF9800',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  conversationBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  greetingBubble: {
    position: 'absolute',
    bottom: 70,
    right: 0,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    maxWidth: width - 80,
    minWidth: 200,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(216, 27, 96, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 12,
    gap: 6,
  },
  locationButtonText: {
    fontSize: 12,
    color: '#D81B60',
    fontWeight: '600',
  },
  greetingText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    marginBottom: 8,
  },
  memoryStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(216, 27, 96, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 6,
    alignSelf: 'flex-start',
  },
  memoryStatusText: {
    fontSize: 11,
    color: '#D81B60',
    fontWeight: '600',
  },
  dismissButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    padding: 4,
  },
  bubbleArrow: {
    position: 'absolute',
    bottom: -8,
    right: 30,
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: 'white',
  },
});