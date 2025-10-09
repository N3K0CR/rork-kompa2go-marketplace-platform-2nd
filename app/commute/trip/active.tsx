import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, Linking, Platform } from 'react-native';
import { Stack, router } from 'expo-router';
import { useFirebaseAuth } from '@/contexts/FirebaseAuthContext';
import { tripHistoryService } from '@/src/modules/commute/services/trip-history-service';
import { 
  MapPin, 
  Navigation, 
  Phone, 
  MessageCircle, 
  Clock, 
  DollarSign,
  AlertCircle,
  CheckCircle,
  Star,
  X,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type TripStatus = 'driver_arriving' | 'in_progress' | 'arriving_destination' | 'completed';

export default function ActiveTripScreen() {
  const { firebaseUser } = useFirebaseAuth();
  const insets = useSafeAreaInsets();
  
  const [tripStatus, setTripStatus] = useState<TripStatus>('driver_arriving');
  const [estimatedArrival, setEstimatedArrival] = useState<number>(5);
  const [currentDistance, setCurrentDistance] = useState<number>(2.5);
  const [showRatingModal, setShowRatingModal] = useState<boolean>(false);
  const [rating, setRating] = useState<number>(0);
  const [tripData] = useState({
    id: `trip_${Date.now()}`,
    driverName: 'Carlos',
    driverPhone: '+506 8888-8888',
    vehicleType: 'Kommute 4',
    vehiclePlate: 'ABC-123',
    originAddress: 'San José Centro',
    destinationAddress: 'Escazú',
    estimatedPrice: 5000,
    startTime: new Date(),
  });

  useEffect(() => {
    const statusInterval = setInterval(() => {
      if (tripStatus === 'driver_arriving' && estimatedArrival > 0) {
        setEstimatedArrival(prev => Math.max(0, prev - 1));
        setCurrentDistance(prev => Math.max(0, prev - 0.5));
        
        if (estimatedArrival <= 1) {
          setTripStatus('in_progress');
          setEstimatedArrival(15);
        }
      } else if (tripStatus === 'in_progress' && estimatedArrival > 0) {
        setEstimatedArrival(prev => Math.max(0, prev - 1));
        
        if (estimatedArrival <= 2) {
          setTripStatus('arriving_destination');
        }
      } else if (tripStatus === 'arriving_destination' && estimatedArrival > 0) {
        setEstimatedArrival(prev => Math.max(0, prev - 1));
        
        if (estimatedArrival <= 0) {
          setTripStatus('completed');
          setShowRatingModal(true);
        }
      }
    }, 1000);

    return () => clearInterval(statusInterval);
  }, [tripStatus, estimatedArrival]);

  const handleCall = useCallback(() => {
    const phoneNumber = tripData.driverPhone.replace(/[^0-9]/g, '');
    const url = Platform.OS === 'ios' ? `telprompt:${phoneNumber}` : `tel:${phoneNumber}`;
    
    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) {
          return Linking.openURL(url);
        } else {
          Alert.alert('Error', 'No se puede realizar la llamada');
        }
      })
      .catch((err) => console.error('Error opening phone:', err));
  }, [tripData.driverPhone]);

  const handleMessage = useCallback(() => {
    Alert.alert(
      'Enviar mensaje',
      `¿Deseas enviar un mensaje a ${tripData.driverName}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Enviar',
          onPress: () => {
            Alert.alert('Mensaje enviado', 'Tu mensaje ha sido enviado al conductor');
          },
        },
      ]
    );
  }, [tripData.driverName]);

  const handleEmergency = useCallback(() => {
    Alert.alert(
      'Emergencia',
      '¿Necesitas ayuda de emergencia?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Llamar al 911',
          style: 'destructive',
          onPress: () => {
            Linking.openURL('tel:911');
          },
        },
      ]
    );
  }, []);

  const handleCancelTrip = useCallback(() => {
    Alert.alert(
      'Cancelar viaje',
      '¿Estás seguro de que deseas cancelar este viaje? Puede aplicar una tarifa de cancelación.',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Sí, cancelar',
          style: 'destructive',
          onPress: async () => {
            if (firebaseUser?.uid) {
              await tripHistoryService.addTripToHistory(firebaseUser.uid, {
                id: tripData.id,
                routeId: 'route_1',
                userId: firebaseUser.uid,
                startTime: tripData.startTime,
                endTime: new Date(),
                status: 'cancelled',
                trackingPoints: [],
                vehicleType: tripData.vehicleType,
                vehicleName: tripData.vehicleType,
                originAddress: tripData.originAddress,
                destinationAddress: tripData.destinationAddress,
                driverName: tripData.driverName,
                paymentStatus: 'completed',
              });
            }
            
            Alert.alert('Viaje cancelado', 'El viaje ha sido cancelado exitosamente');
            router.replace('/commute');
          },
        },
      ]
    );
  }, [firebaseUser, tripData]);

  const handleRateTrip = useCallback(async () => {
    if (rating === 0) {
      Alert.alert('Calificación requerida', 'Por favor selecciona una calificación');
      return;
    }

    if (firebaseUser?.uid) {
      await tripHistoryService.addTripToHistory(firebaseUser.uid, {
        id: tripData.id,
        routeId: 'route_1',
        userId: firebaseUser.uid,
        startTime: tripData.startTime,
        endTime: new Date(),
        status: 'completed',
        actualCost: tripData.estimatedPrice,
        actualDistance: 5000,
        actualDuration: 900,
        trackingPoints: [],
        vehicleType: tripData.vehicleType,
        vehicleName: tripData.vehicleType,
        originAddress: tripData.originAddress,
        destinationAddress: tripData.destinationAddress,
        driverName: tripData.driverName,
        driverRating: 4.9,
        paymentMethod: 'Efectivo',
        paymentStatus: 'completed',
        rating,
      });
    }

    Alert.alert(
      'Gracias por tu calificación',
      'Tu opinión nos ayuda a mejorar el servicio',
      [
        {
          text: 'OK',
          onPress: () => {
            setShowRatingModal(false);
            router.replace('/commute');
          },
        },
      ]
    );
  }, [rating, firebaseUser, tripData]);

  const getStatusInfo = () => {
    switch (tripStatus) {
      case 'driver_arriving':
        return {
          icon: <Navigation size={24} color="#65ea06" />,
          title: `${tripData.driverName} está en camino`,
          subtitle: `Llegará en ${estimatedArrival} minutos`,
          color: '#65ea06',
        };
      case 'in_progress':
        return {
          icon: <MapPin size={24} color="#FF9800" />,
          title: 'Viaje en progreso',
          subtitle: `Llegarás en ${estimatedArrival} minutos`,
          color: '#FF9800',
        };
      case 'arriving_destination':
        return {
          icon: <CheckCircle size={24} color="#4CAF50" />,
          title: 'Llegando a tu destino',
          subtitle: 'Prepárate para descender',
          color: '#4CAF50',
        };
      case 'completed':
        return {
          icon: <CheckCircle size={24} color="#4CAF50" />,
          title: '¡Viaje completado!',
          subtitle: 'Gracias por viajar con Kommute',
          color: '#4CAF50',
        };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.mapPlaceholder}>
        <View style={styles.mapOverlay} />
        
        <View style={[styles.statusCard, { top: insets.top + 16 }]}>
          <View style={[styles.statusIcon, { backgroundColor: `${statusInfo.color}20` }]}>
            {statusInfo.icon}
          </View>
          <View style={styles.statusInfo}>
            <Text style={styles.statusTitle}>{statusInfo.title}</Text>
            <Text style={styles.statusSubtitle}>{statusInfo.subtitle}</Text>
          </View>
        </View>

        {tripStatus !== 'completed' && (
          <TouchableOpacity
            style={[styles.emergencyButton, { top: insets.top + 16 }]}
            onPress={handleEmergency}
          >
            <AlertCircle size={24} color="#F44336" />
          </TouchableOpacity>
        )}
      </View>

      <View style={[styles.content, { paddingBottom: insets.bottom + 16 }]}>
        <ScrollView 
          style={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.driverCard}>
            <View style={styles.driverHeader}>
              <View style={styles.driverAvatar}>
                <Text style={styles.driverInitial}>
                  {tripData.driverName.charAt(0)}
                </Text>
              </View>
              <View style={styles.driverInfo}>
                <Text style={styles.driverName}>{tripData.driverName}</Text>
                <Text style={styles.driverVehicle}>
                  {tripData.vehicleType} • {tripData.vehiclePlate}
                </Text>
              </View>
            </View>

            <View style={styles.driverActions}>
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={handleCall}
              >
                <Phone size={20} color="#65ea06" />
                <Text style={styles.actionButtonText}>Llamar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={handleMessage}
              >
                <MessageCircle size={20} color="#65ea06" />
                <Text style={styles.actionButtonText}>Mensaje</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.tripDetailsCard}>
            <Text style={styles.cardTitle}>Detalles del viaje</Text>
            
            <View style={styles.routeInfo}>
              <View style={styles.routePoint}>
                <View style={styles.routeDot} />
                <Text style={styles.routeAddress}>{tripData.originAddress}</Text>
              </View>
              <View style={styles.routeLine} />
              <View style={styles.routePoint}>
                <MapPin size={16} color="#65ea06" />
                <Text style={styles.routeAddress}>{tripData.destinationAddress}</Text>
              </View>
            </View>

            <View style={styles.tripStats}>
              <View style={styles.statItem}>
                <Clock size={18} color="#6b9e47" />
                <Text style={styles.statLabel}>Tiempo estimado</Text>
                <Text style={styles.statValue}>{estimatedArrival} min</Text>
              </View>
              
              {currentDistance > 0 && (
                <View style={styles.statItem}>
                  <Navigation size={18} color="#6b9e47" />
                  <Text style={styles.statLabel}>Distancia</Text>
                  <Text style={styles.statValue}>{currentDistance.toFixed(1)} km</Text>
                </View>
              )}
              
              <View style={styles.statItem}>
                <DollarSign size={18} color="#6b9e47" />
                <Text style={styles.statLabel}>Costo estimado</Text>
                <Text style={styles.statValue}>
                  ₡{tripData.estimatedPrice.toLocaleString('es-CR')}
                </Text>
              </View>
            </View>
          </View>

          {tripStatus !== 'completed' && (
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleCancelTrip}
            >
              <X size={20} color="#F44336" />
              <Text style={styles.cancelButtonText}>Cancelar viaje</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </View>

      {showRatingModal && (
        <View style={styles.ratingOverlay}>
          <View style={styles.ratingModal}>
            <Text style={styles.ratingTitle}>¿Cómo fue tu viaje?</Text>
            <Text style={styles.ratingSubtitle}>
              Califica tu experiencia con {tripData.driverName}
            </Text>

            <View style={styles.starsContainer}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity
                  key={star}
                  onPress={() => setRating(star)}
                  style={styles.starButton}
                >
                  <Star
                    size={40}
                    color={star <= rating ? '#FFD700' : '#E0E0E0'}
                    fill={star <= rating ? '#FFD700' : 'transparent'}
                  />
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={[
                styles.submitRatingButton,
                rating === 0 && styles.submitRatingButtonDisabled,
              ]}
              onPress={handleRateTrip}
              disabled={rating === 0}
            >
              <Text style={styles.submitRatingButtonText}>Enviar calificación</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fafcf8',
  },
  mapPlaceholder: {
    height: '50%',
    backgroundColor: '#e8f5e9',
  },
  mapOverlay: {
    flex: 1,
    backgroundColor: 'rgba(250, 252, 248, 0.3)',
  },
  statusCard: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  statusIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusInfo: {
    flex: 1,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#131c0d',
    marginBottom: 2,
  },
  statusSubtitle: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: '#6b9e47',
  },
  emergencyButton: {
    position: 'absolute',
    right: 16,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  content: {
    flex: 1,
    backgroundColor: '#fafcf8',
  },
  scrollContent: {
    flex: 1,
    padding: 16,
  },
  driverCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  driverHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  driverAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#65ea06',
    justifyContent: 'center',
    alignItems: 'center',
  },
  driverInitial: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: 'white',
  },
  driverInfo: {
    flex: 1,
  },
  driverName: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#131c0d',
    marginBottom: 4,
  },
  driverVehicle: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: '#6b9e47',
  },
  driverActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    backgroundColor: '#f8fff4',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ecf4e6',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#65ea06',
  },
  tripDetailsCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#131c0d',
    marginBottom: 16,
  },
  routeInfo: {
    marginBottom: 20,
  },
  routePoint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  routeDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#6b9e47',
  },
  routeLine: {
    width: 2,
    height: 24,
    backgroundColor: '#ecf4e6',
    marginLeft: 5,
    marginVertical: 4,
  },
  routeAddress: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500' as const,
    color: '#131c0d',
  },
  tripStats: {
    gap: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500' as const,
    color: '#6b9e47',
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#131c0d',
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F44336',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#F44336',
  },
  ratingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  ratingModal: {
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 32,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  ratingTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#131c0d',
    marginBottom: 8,
    textAlign: 'center',
  },
  ratingSubtitle: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: '#6b9e47',
    marginBottom: 32,
    textAlign: 'center',
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 32,
  },
  starButton: {
    padding: 4,
  },
  submitRatingButton: {
    width: '100%',
    paddingVertical: 16,
    backgroundColor: '#65ea06',
    borderRadius: 12,
    alignItems: 'center',
  },
  submitRatingButtonDisabled: {
    backgroundColor: '#ecf4e6',
  },
  submitRatingButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#131c0d',
  },
});
