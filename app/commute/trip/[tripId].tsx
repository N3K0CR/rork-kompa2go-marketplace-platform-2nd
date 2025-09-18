import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MapPin, Clock, Phone, MessageCircle, Navigation, CheckCircle, X } from 'lucide-react-native';
import { useCommute } from '@/hooks/useCommute';
import { MapView, TripStatus } from '@/components/commute';
import { Colors, Spacing, BorderRadius, Shadows, Typography } from '@/context-package/design-system';

export default function TripDetails() {
  const { tripId } = useLocalSearchParams<{ tripId: string }>();
  const {
    getTripById,
    updateTripStatus,
    cancelTrip,
    completeTrip
  } = useCommute();

  const [trip, setTrip] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  console.log('🚗 TripDetails: Rendered for trip:', tripId);

  useEffect(() => {
    loadTripData();
  }, [tripId]);

  const loadTripData = async () => {
    if (!tripId) return;
    
    try {
      setIsLoading(true);
      const tripData = await getTripById(tripId);
      setTrip(tripData);
      console.log('📊 TripDetails: Loaded trip data:', tripData?.status);
    } catch (error) {
      console.error('❌ TripDetails: Error loading trip:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateStatus = async (newStatus: string) => {
    if (!trip) return;

    try {
      console.log('🔄 TripDetails: Updating status to:', newStatus);
      await updateTripStatus(trip.id, newStatus);
      setTrip({ ...trip, status: newStatus });
    } catch (error) {
      console.error('❌ TripDetails: Error updating status:', error);
    }
  };

  const handleCancelTrip = () => {
    Alert.alert(
      'Cancelar Viaje',
      '¿Estás seguro de que quieres cancelar este viaje?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Sí, Cancelar',
          style: 'destructive',
          onPress: async () => {
            try {
              await cancelTrip(trip.id);
              router.back();
            } catch (error) {
              console.error('❌ TripDetails: Error canceling trip:', error);
            }
          }
        }
      ]
    );
  };

  const handleCompleteTrip = async () => {
    try {
      console.log('✅ TripDetails: Completing trip:', trip.id);
      await completeTrip(trip.id);
      router.back();
    } catch (error) {
      console.error('❌ TripDetails: Error completing trip:', error);
    }
  };

  const renderTripHeader = () => {
    if (!trip) return null;

    return (
      <View style={styles.tripHeader}>
        <View style={styles.tripInfo}>
          <Text style={styles.tripTitle}>{trip.route?.name}</Text>
          <Text style={styles.tripRole}>
            {trip.role === 'driver' ? '🚗 Conductor' : '👤 Pasajero'}
          </Text>
        </View>
        <View style={styles.tripStatus}>
          <View style={[
            styles.statusIndicator,
            { backgroundColor: getStatusColor(trip.status) }
          ]} />
          <Text style={styles.statusText}>{getStatusText(trip.status)}</Text>
        </View>
      </View>
    );
  };

  const renderParticipantInfo = () => {
    if (!trip) return null;

    const otherParticipant = trip.role === 'driver' ? trip.passenger : trip.driver;
    if (!otherParticipant) return null;

    return (
      <View style={styles.participantCard}>
        <View style={styles.participantInfo}>
          <View style={styles.participantAvatar}>
            <Text style={styles.participantInitial}>
              {otherParticipant.name?.charAt(0) || '?'}
            </Text>
          </View>
          <View style={styles.participantDetails}>
            <Text style={styles.participantName}>{otherParticipant.name}</Text>
            <Text style={styles.participantRole}>
              {trip.role === 'driver' ? 'Pasajero' : 'Conductor'}
            </Text>
            {otherParticipant.rating && (
              <Text style={styles.participantRating}>
                ⭐ {otherParticipant.rating.toFixed(1)}
              </Text>
            )}
          </View>
        </View>
        
        <View style={styles.participantActions}>
          <TouchableOpacity style={styles.actionButton}>
            <Phone size={20} color={Colors.primary[500]} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <MessageCircle size={20} color={Colors.primary[500]} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderTripDetails = () => {
    if (!trip) return null;

    return (
      <View style={styles.detailsCard}>
        <Text style={styles.detailsTitle}>Detalles del Viaje</Text>
        
        <View style={styles.detailsGrid}>
          {trip.estimatedDuration && (
            <View style={styles.detailItem}>
              <Clock size={16} color={Colors.neutral[500]} />
              <Text style={styles.detailLabel}>Duración</Text>
              <Text style={styles.detailValue}>{trip.estimatedDuration} min</Text>
            </View>
          )}
          
          {trip.estimatedDistance && (
            <View style={styles.detailItem}>
              <MapPin size={16} color={Colors.neutral[500]} />
              <Text style={styles.detailLabel}>Distancia</Text>
              <Text style={styles.detailValue}>
                {(trip.estimatedDistance / 1000).toFixed(1)} km
              </Text>
            </View>
          )}
          
          {trip.estimatedCost && (
            <View style={styles.detailItem}>
              <Text style={styles.costIcon}>₡</Text>
              <Text style={styles.detailLabel}>Costo</Text>
              <Text style={styles.detailValue}>₡{trip.estimatedCost}</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  const renderActionButtons = () => {
    if (!trip) return null;

    const canStart = trip.status === 'pending' && trip.role === 'driver';
    const canComplete = trip.status === 'in_progress';
    const canCancel = ['pending', 'accepted'].includes(trip.status);

    return (
      <View style={styles.actionButtons}>
        {canStart && (
          <TouchableOpacity
            style={[styles.actionBtn, styles.startButton]}
            onPress={() => handleUpdateStatus('in_progress')}
          >
            <Navigation size={20} color="white" />
            <Text style={styles.actionBtnText}>Iniciar Viaje</Text>
          </TouchableOpacity>
        )}
        
        {canComplete && (
          <TouchableOpacity
            style={[styles.actionBtn, styles.completeButton]}
            onPress={handleCompleteTrip}
          >
            <CheckCircle size={20} color="white" />
            <Text style={styles.actionBtnText}>Completar Viaje</Text>
          </TouchableOpacity>
        )}
        
        {canCancel && (
          <TouchableOpacity
            style={[styles.actionBtn, styles.cancelButton]}
            onPress={handleCancelTrip}
          >
            <X size={20} color="white" />
            <Text style={styles.actionBtnText}>Cancelar</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return Colors.warning[500];
      case 'accepted': return Colors.info[500];
      case 'in_progress': return Colors.success[500];
      case 'completed': return Colors.success[600];
      case 'cancelled': return Colors.error[500];
      default: return Colors.neutral[500];
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Pendiente';
      case 'accepted': return 'Aceptado';
      case 'in_progress': return 'En Progreso';
      case 'completed': return 'Completado';
      case 'cancelled': return 'Cancelado';
      default: return 'Desconocido';
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Stack.Screen options={{ title: 'Cargando...' }} />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Cargando detalles del viaje...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!trip) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Stack.Screen options={{ title: 'Viaje no encontrado' }} />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>No se pudo cargar el viaje</Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>Volver</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen 
        options={{ 
          title: 'Detalles del Viaje',
          headerStyle: { backgroundColor: Colors.primary[500] },
          headerTintColor: 'white',
          headerTitleStyle: { fontWeight: 'bold' }
        }} 
      />
      
      <View style={styles.content}>
        <MapView
          route={trip.route}
          currentLocation={trip.currentLocation}
          showRoute
          showProgress
          style={styles.map}
        />
        
        <View style={styles.bottomSheet}>
          {renderTripHeader()}
          {renderParticipantInfo()}
          {renderTripDetails()}
          {renderActionButtons()}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.neutral[50],
  },
  content: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  bottomSheet: {
    backgroundColor: 'white',
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing[4],
    maxHeight: '60%',
    ...Shadows.lg,
  },
  tripHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing[4],
    paddingBottom: Spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[200],
  },
  tripInfo: {
    flex: 1,
  },
  tripTitle: {
    ...Typography.textStyles.h5,
    color: Colors.neutral[800],
    marginBottom: Spacing[1],
  },
  tripRole: {
    ...Typography.textStyles.body,
    color: Colors.neutral[600],
  },
  tripStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
  },
  statusIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  statusText: {
    ...Typography.textStyles.bodySmall,
    color: Colors.neutral[600],
    fontWeight: Typography.fontWeight.medium,
  },
  participantCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.neutral[50],
    borderRadius: BorderRadius.lg,
    padding: Spacing[4],
    marginBottom: Spacing[4],
  },
  participantInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: Spacing[3],
  },
  participantAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary[500],
    justifyContent: 'center',
    alignItems: 'center',
  },
  participantInitial: {
    ...Typography.textStyles.h6,
    color: 'white',
    fontWeight: Typography.fontWeight.bold,
  },
  participantDetails: {
    flex: 1,
  },
  participantName: {
    ...Typography.textStyles.h6,
    color: Colors.neutral[800],
    marginBottom: Spacing[1],
  },
  participantRole: {
    ...Typography.textStyles.bodySmall,
    color: Colors.neutral[600],
  },
  participantRating: {
    ...Typography.textStyles.caption,
    color: Colors.warning[600],
    marginTop: Spacing[1],
  },
  participantActions: {
    flexDirection: 'row',
    gap: Spacing[2],
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailsCard: {
    backgroundColor: Colors.neutral[50],
    borderRadius: BorderRadius.lg,
    padding: Spacing[4],
    marginBottom: Spacing[4],
  },
  detailsTitle: {
    ...Typography.textStyles.h6,
    color: Colors.neutral[800],
    marginBottom: Spacing[3],
  },
  detailsGrid: {
    gap: Spacing[3],
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
  },
  detailLabel: {
    ...Typography.textStyles.body,
    color: Colors.neutral[600],
    flex: 1,
  },
  detailValue: {
    ...Typography.textStyles.body,
    color: Colors.neutral[800],
    fontWeight: Typography.fontWeight.medium,
  },
  costIcon: {
    ...Typography.textStyles.body,
    color: Colors.success[500],
    fontWeight: Typography.fontWeight.bold,
    width: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: Spacing[3],
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing[2],
    paddingVertical: Spacing[3],
    borderRadius: BorderRadius.md,
  },
  actionBtnText: {
    ...Typography.textStyles.button,
    color: 'white',
  },
  startButton: {
    backgroundColor: Colors.success[500],
  },
  completeButton: {
    backgroundColor: Colors.primary[500],
  },
  cancelButton: {
    backgroundColor: Colors.error[500],
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...Typography.textStyles.body,
    color: Colors.neutral[600],
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing[4],
  },
  errorText: {
    ...Typography.textStyles.h6,
    color: Colors.error[500],
    marginBottom: Spacing[4],
    textAlign: 'center',
  },
  backButton: {
    backgroundColor: Colors.primary[500],
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[2],
    borderRadius: BorderRadius.md,
  },
  backButtonText: {
    ...Typography.textStyles.button,
    color: 'white',
  },
});