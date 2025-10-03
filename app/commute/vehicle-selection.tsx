import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { Car, Users, DollarSign, MessageCircle, Check } from 'lucide-react-native';
import { useCommute } from '@/src/modules/commute/context/CommuteContext';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '@/context-package/design-system';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function VehicleSelection() {
  const params = useLocalSearchParams<{
    originLat: string;
    originLon: string;
    originAddress: string;
    destLat: string;
    destLon: string;
    destAddress: string;
  }>();
  
  const { transportModes, createRoute, startTrip } = useCommute();
  const commuteContext = useCommute();
  const firebaseUser = 'firebaseUser' in commuteContext ? commuteContext.firebaseUser : null;
  const insets = useSafeAreaInsets();
  
  const [selectedVehicle, setSelectedVehicle] = useState<string | null>(null);
  const [estimatedPrice, setEstimatedPrice] = useState<number>(0);
  const [proposedPrice, setProposedPrice] = useState<string>('');
  const [showNegotiation, setShowNegotiation] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [distance, setDistance] = useState<number>(0);

  useEffect(() => {
    if (params.originLat && params.destLat) {
      const dist = calculateDistance(
        parseFloat(params.originLat),
        parseFloat(params.originLon),
        parseFloat(params.destLat),
        parseFloat(params.destLon)
      );
      setDistance(dist);
    }
  }, [params]);

  useEffect(() => {
    if (selectedVehicle && distance > 0) {
      const vehicle = transportModes.find(m => m.id === selectedVehicle);
      if (vehicle) {
        const basePrice = 2000;
        const pricePerKm = 500;
        const estimated = basePrice + (distance * pricePerKm * vehicle.costFactor);
        setEstimatedPrice(Math.round(estimated));
        setProposedPrice(Math.round(estimated).toString());
      }
    }
  }, [selectedVehicle, distance, transportModes]);

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const handleConfirmTrip = async () => {
    if (!selectedVehicle) {
      Alert.alert('Error', 'Por favor selecciona un tipo de vehículo');
      return;
    }

    const userId = firebaseUser && typeof firebaseUser === 'object' && 'uid' in firebaseUser 
      ? (firebaseUser as { uid: string }).uid 
      : 'demo_user';

    setIsCreating(true);
    try {
      const selectedMode = transportModes.find(m => m.id === selectedVehicle);
      if (!selectedMode) {
        throw new Error('Vehículo no encontrado');
      }

      const finalPrice = proposedPrice ? parseInt(proposedPrice) : estimatedPrice;

      const routeData = {
        userId,
        name: `Viaje a ${params.destAddress.split(',')[0]}`,
        points: [
          {
            id: `origin_${Date.now()}`,
            latitude: parseFloat(params.originLat),
            longitude: parseFloat(params.originLon),
            address: params.originAddress,
            type: 'origin' as const,
          },
          {
            id: `dest_${Date.now()}`,
            latitude: parseFloat(params.destLat),
            longitude: parseFloat(params.destLon),
            address: params.destAddress,
            type: 'destination' as const,
          },
        ],
        transportModes: [selectedMode],
        status: 'planned' as const,
        distance: distance * 1000,
        duration: 0,
        estimatedCost: finalPrice,
        carbonFootprint: 0,
        isRecurring: false,
      };

      const newRoute = await createRoute(routeData);
      await startTrip(newRoute.id);
      
      router.replace({
        pathname: '/commute/trip/[tripId]',
        params: { tripId: newRoute.id },
      });
    } catch (error) {
      console.error('Error creating trip:', error);
      Alert.alert('Error', 'No se pudo crear el viaje. Intenta nuevamente.');
    } finally {
      setIsCreating(false);
    }
  };

  const selectedVehicleData = transportModes.find(m => m.id === selectedVehicle);

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: 'Seleccionar Vehículo',
          headerStyle: { backgroundColor: Colors.primary[500] },
          headerTintColor: 'white',
          headerTitleStyle: { fontWeight: 'bold' as const }
        }} 
      />
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.routeCard}>
          <Text style={styles.routeTitle}>Tu viaje</Text>
          <View style={styles.routeInfo}>
            <View style={styles.routePoint}>
              <View style={[styles.routeDot, { backgroundColor: Colors.success[500] }]} />
              <Text style={styles.routeAddress} numberOfLines={2}>{params.originAddress}</Text>
            </View>
            <View style={styles.routeLine} />
            <View style={styles.routePoint}>
              <View style={[styles.routeDot, { backgroundColor: Colors.error[500] }]} />
              <Text style={styles.routeAddress} numberOfLines={2}>{params.destAddress}</Text>
            </View>
          </View>
          <Text style={styles.distanceText}>Distancia: {distance.toFixed(1)} km</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Selecciona tu vehículo</Text>
          <View style={styles.vehicleGrid}>
            {transportModes.map((mode) => (
              <TouchableOpacity
                key={mode.id}
                style={[
                  styles.vehicleCard,
                  selectedVehicle === mode.id && styles.vehicleCardSelected
                ]}
                onPress={() => setSelectedVehicle(mode.id)}
              >
                {selectedVehicle === mode.id && (
                  <View style={styles.selectedBadge}>
                    <Check size={16} color="white" />
                  </View>
                )}
                {mode.id === 'kommute-4' ? (
                  <Car size={32} color={selectedVehicle === mode.id ? Colors.primary[600] : Colors.neutral[600]} />
                ) : (
                  <Users size={32} color={selectedVehicle === mode.id ? Colors.primary[600] : Colors.neutral[600]} />
                )}
                <Text style={[
                  styles.vehicleName,
                  selectedVehicle === mode.id && styles.vehicleNameSelected
                ]}>
                  {mode.name}
                </Text>
                <Text style={styles.vehicleCapacity}>
                  {mode.capacity} pasajeros
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {selectedVehicle && (
          <>
            <View style={styles.priceCard}>
              <View style={styles.priceHeader}>
                <DollarSign size={24} color={Colors.primary[500]} />
                <Text style={styles.priceTitle}>Precio estimado</Text>
              </View>
              <Text style={styles.priceAmount}>₡{estimatedPrice.toLocaleString()}</Text>
              <Text style={styles.priceSubtext}>
                Basado en {distance.toFixed(1)} km con {selectedVehicleData?.name}
              </Text>
              
              <TouchableOpacity
                style={styles.negotiateButton}
                onPress={() => setShowNegotiation(!showNegotiation)}
              >
                <MessageCircle size={18} color={Colors.primary[600]} />
                <Text style={styles.negotiateButtonText}>
                  {showNegotiation ? 'Ocultar negociación' : 'Proponer otro precio'}
                </Text>
              </TouchableOpacity>

              {showNegotiation && (
                <View style={styles.negotiationBox}>
                  <Text style={styles.negotiationLabel}>Tu propuesta (₡)</Text>
                  <TextInput
                    style={styles.priceInput}
                    value={proposedPrice}
                    onChangeText={setProposedPrice}
                    keyboardType="numeric"
                    placeholder={estimatedPrice.toString()}
                    placeholderTextColor={Colors.neutral[400]}
                  />
                  <Text style={styles.negotiationHint}>
                    El conductor podrá aceptar o rechazar tu propuesta
                  </Text>
                </View>
              )}
            </View>

            <View style={[styles.confirmSection, { paddingBottom: insets.bottom + Spacing[4] }]}>
              <TouchableOpacity
                style={[styles.confirmButton, isCreating && styles.confirmButtonDisabled]}
                onPress={handleConfirmTrip}
                disabled={isCreating}
              >
                {isCreating ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <>
                    <Check size={20} color="white" />
                    <Text style={styles.confirmButtonText}>
                      Confirmar viaje por ₡{(proposedPrice ? parseInt(proposedPrice) : estimatedPrice).toLocaleString()}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.neutral[50],
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Spacing[6],
  },
  routeCard: {
    backgroundColor: 'white',
    padding: Spacing[5],
    marginBottom: Spacing[3],
    ...Shadows.sm,
  },
  routeTitle: {
    ...Typography.textStyles.h6,
    color: Colors.neutral[800],
    fontWeight: Typography.fontWeight.bold,
    marginBottom: Spacing[4],
  },
  routeInfo: {
    marginBottom: Spacing[3],
  },
  routePoint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing[3],
  },
  routeDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 4,
  },
  routeLine: {
    width: 2,
    height: 24,
    backgroundColor: Colors.neutral[300],
    marginLeft: 5,
    marginVertical: Spacing[2],
  },
  routeAddress: {
    ...Typography.textStyles.body,
    color: Colors.neutral[700],
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  distanceText: {
    ...Typography.textStyles.bodySmall,
    color: Colors.neutral[600],
    fontWeight: Typography.fontWeight.medium,
    fontSize: 13,
  },
  section: {
    backgroundColor: 'white',
    padding: Spacing[5],
    marginBottom: Spacing[3],
  },
  sectionTitle: {
    ...Typography.textStyles.h6,
    color: Colors.neutral[800],
    fontWeight: Typography.fontWeight.bold,
    marginBottom: Spacing[4],
  },
  vehicleGrid: {
    flexDirection: 'row',
    gap: Spacing[3],
  },
  vehicleCard: {
    flex: 1,
    backgroundColor: Colors.neutral[50],
    borderRadius: BorderRadius.lg,
    padding: Spacing[4],
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.neutral[200],
    position: 'relative',
  },
  vehicleCardSelected: {
    borderColor: Colors.primary[500],
    backgroundColor: Colors.primary[50],
  },
  selectedBadge: {
    position: 'absolute',
    top: Spacing[2],
    right: Spacing[2],
    backgroundColor: Colors.primary[500],
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  vehicleName: {
    ...Typography.textStyles.body,
    color: Colors.neutral[800],
    fontWeight: Typography.fontWeight.bold,
    marginTop: Spacing[3],
    fontSize: 15,
    textAlign: 'center',
  },
  vehicleNameSelected: {
    color: Colors.primary[700],
  },
  vehicleCapacity: {
    ...Typography.textStyles.caption,
    color: Colors.neutral[600],
    marginTop: Spacing[1],
    fontSize: 12,
  },
  priceCard: {
    backgroundColor: 'white',
    padding: Spacing[5],
    marginBottom: Spacing[3],
    ...Shadows.sm,
  },
  priceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
    marginBottom: Spacing[3],
  },
  priceTitle: {
    ...Typography.textStyles.h6,
    color: Colors.neutral[800],
    fontWeight: Typography.fontWeight.bold,
  },
  priceAmount: {
    ...Typography.textStyles.h3,
    color: Colors.primary[600],
    fontWeight: Typography.fontWeight.bold,
    marginBottom: Spacing[2],
  },
  priceSubtext: {
    ...Typography.textStyles.bodySmall,
    color: Colors.neutral[600],
    marginBottom: Spacing[4],
    fontSize: 13,
  },
  negotiateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing[2],
    paddingVertical: Spacing[3],
    paddingHorizontal: Spacing[4],
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.primary[300],
    backgroundColor: 'transparent',
  },
  negotiateButtonText: {
    ...Typography.textStyles.body,
    color: Colors.primary[600],
    fontWeight: Typography.fontWeight.semibold,
    fontSize: 14,
  },
  negotiationBox: {
    marginTop: Spacing[4],
    padding: Spacing[4],
    backgroundColor: Colors.neutral[50],
    borderRadius: BorderRadius.md,
  },
  negotiationLabel: {
    ...Typography.textStyles.bodySmall,
    color: Colors.neutral[700],
    fontWeight: Typography.fontWeight.semibold,
    marginBottom: Spacing[2],
    fontSize: 13,
  },
  priceInput: {
    backgroundColor: 'white',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.neutral[300],
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
    ...Typography.textStyles.h5,
    color: Colors.neutral[800],
    marginBottom: Spacing[2],
  },
  negotiationHint: {
    ...Typography.textStyles.caption,
    color: Colors.neutral[500],
    fontSize: 12,
    lineHeight: 16,
  },
  confirmSection: {
    backgroundColor: 'white',
    padding: Spacing[5],
    ...Shadows.lg,
  },
  confirmButton: {
    backgroundColor: Colors.primary[500],
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing[4],
    paddingHorizontal: Spacing[5],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing[2],
    ...Shadows.md,
  },
  confirmButtonDisabled: {
    opacity: 0.6,
  },
  confirmButtonText: {
    ...Typography.textStyles.body,
    color: 'white',
    fontWeight: Typography.fontWeight.bold,
    fontSize: 16,
  },
});
