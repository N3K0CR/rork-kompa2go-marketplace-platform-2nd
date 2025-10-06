import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Car, Users, MapPin, Clock, DollarSign, Plus, Minus } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCommute } from '@/src/modules/commute/context/CommuteContext';
import { calculateTripPrice, adjustPrice, formatCRC } from '@/src/modules/commute/utils/pricing';

interface VehicleOption {
  id: 'kommute-4' | 'kommute-large';
  name: string;
  capacity: number;
  icon: typeof Car;
  costFactor: number;
}

const VEHICLE_OPTIONS: VehicleOption[] = [
  {
    id: 'kommute-4',
    name: 'Kommute 4',
    capacity: 4,
    icon: Car,
    costFactor: 0.85,
  },
  {
    id: 'kommute-large',
    name: 'Kommute Large',
    capacity: 7,
    icon: Users,
    costFactor: 1.25,
  },
];



export default function VehicleSelection() {
  const params = useLocalSearchParams<{
    originLat: string;
    originLon: string;
    originAddress: string;
    destLat: string;
    destLon: string;
    destAddress: string;
  }>();

  const insets = useSafeAreaInsets();
  const commuteContext = useCommute();
  const firebaseUser = 'firebaseUser' in commuteContext ? commuteContext.firebaseUser : null;

  const [selectedVehicle, setSelectedVehicle] = useState<'kommute-4' | 'kommute-large' | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [distance, setDistance] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [customPrices, setCustomPrices] = useState<Record<string, number>>({});

  useEffect(() => {
    calculateRouteDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const calculateRouteDetails = () => {
    if (!params.originLat || !params.destLat) return;

    const R = 6371;
    const dLat = (parseFloat(params.destLat) - parseFloat(params.originLat)) * Math.PI / 180;
    const dLon = (parseFloat(params.destLon) - parseFloat(params.originLon)) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(parseFloat(params.originLat) * Math.PI / 180) * Math.cos(parseFloat(params.destLat) * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distanceKm = R * c;

    setDistance(distanceKm);
    setDuration(Math.ceil((distanceKm / 40) * 60));
  };

  const vehicleDetails = useMemo(() => {
    return VEHICLE_OPTIONS.map(vehicle => {
      const distanceMeters = distance * 1000;
      const durationSeconds = duration * 60;
      const basePrice = calculateTripPrice(distanceMeters, durationSeconds, vehicle.costFactor);
      const price = customPrices[vehicle.id] ?? basePrice;
      
      return {
        ...vehicle,
        basePrice,
        totalPrice: price,
        estimatedTime: duration,
      };
    });
  }, [distance, duration, customPrices]);

  const handleConfirmRide = async () => {
    if (!selectedVehicle) {
      Alert.alert('Selecciona un vehículo', 'Por favor selecciona un tipo de vehículo para continuar');
      return;
    }

    if (!firebaseUser) {
      Alert.alert('Error', 'Debes iniciar sesión para solicitar un viaje');
      return;
    }

    setIsSearching(true);

    try {
      const selectedVehicleData = vehicleDetails.find(v => v.id === selectedVehicle);
      
      router.push({
        pathname: '/commute/trip/searching',
        params: {
          originLat: params.originLat,
          originLon: params.originLon,
          originAddress: params.originAddress,
          destLat: params.destLat,
          destLon: params.destLon,
          destAddress: params.destAddress,
          vehicleType: selectedVehicle,
          vehicleName: selectedVehicleData?.name,
          estimatedPrice: selectedVehicleData?.totalPrice.toString(),
          estimatedTime: selectedVehicleData?.estimatedTime.toString(),
          distance: distance.toFixed(2),
        },
      });
    } catch (error) {
      console.error('Error confirming ride:', error);
      Alert.alert('Error', 'No se pudo procesar tu solicitud. Intenta nuevamente.');
      setIsSearching(false);
    }
  };

  const selectedVehicleData = vehicleDetails.find(v => v.id === selectedVehicle);

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.mapPlaceholder}>
        <View style={styles.mapOverlay} />
      </View>

      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color="#131c0d" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Rutas</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.routeInfo}>
          <View style={styles.routePoint}>
            <View style={styles.routeIconContainer}>
              <MapPin size={16} color="#6b9e47" />
            </View>
            <View style={styles.routeTextContainer}>
              <Text style={styles.routeLabel}>Origen</Text>
              <Text style={styles.routeAddress} numberOfLines={1}>
                {params.originAddress}
              </Text>
            </View>
          </View>

          <View style={styles.routeDivider} />

          <View style={styles.routePoint}>
            <View style={styles.routeIconContainer}>
              <MapPin size={16} color="#65ea06" />
            </View>
            <View style={styles.routeTextContainer}>
              <Text style={styles.routeLabel}>Destino</Text>
              <Text style={styles.routeAddress} numberOfLines={1}>
                {params.destAddress}
              </Text>
            </View>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Elige un vehículo</Text>

        {vehicleDetails.map((vehicle) => {
          const Icon = vehicle.icon;
          const isSelected = selectedVehicle === vehicle.id;

          return (
            <TouchableOpacity
              key={vehicle.id}
              style={[
                styles.vehicleCard,
                isSelected && styles.vehicleCardSelected,
              ]}
              onPress={() => setSelectedVehicle(vehicle.id)}
              activeOpacity={0.7}
            >
              <View style={styles.vehicleInfo}>
                <View style={[
                  styles.vehicleIconContainer,
                  isSelected && styles.vehicleIconContainerSelected,
                ]}>
                  <Icon size={24} color={isSelected ? '#65ea06' : '#131c0d'} />
                </View>
                <View style={styles.vehicleDetails}>
                  <Text style={styles.vehicleName}>{vehicle.name}</Text>
                  <Text style={styles.vehicleCapacity}>
                    Capacidad: {vehicle.capacity} pasajeros
                  </Text>
                </View>
              </View>

              <View style={styles.vehiclePricing}>
                <View style={styles.priceAdjuster}>
                  <TouchableOpacity
                    style={styles.priceButton}
                    onPress={() => {
                      const newPrice = adjustPrice(vehicle.totalPrice, 'down');
                      setCustomPrices(prev => ({ ...prev, [vehicle.id]: newPrice }));
                    }}
                  >
                    <Minus size={16} color="#6b9e47" />
                  </TouchableOpacity>
                  
                  <View style={styles.priceDisplay}>
                    <Text style={styles.vehiclePrice}>
                      {formatCRC(vehicle.totalPrice)}
                    </Text>
                    <Text style={styles.vehicleTime}>
                      {vehicle.estimatedTime} min
                    </Text>
                  </View>
                  
                  <TouchableOpacity
                    style={styles.priceButton}
                    onPress={() => {
                      const newPrice = adjustPrice(vehicle.totalPrice, 'up');
                      setCustomPrices(prev => ({ ...prev, [vehicle.id]: newPrice }));
                    }}
                  >
                    <Plus size={16} color="#6b9e47" />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={[
                styles.vehicleSelector,
                isSelected && styles.vehicleSelectorSelected,
              ]}>
                {isSelected && <View style={styles.vehicleSelectorDot} />}
              </View>
            </TouchableOpacity>
          );
        })}

        {selectedVehicleData && (
          <View style={styles.tripSummary}>
            <Text style={styles.tripSummaryTitle}>Resumen del viaje</Text>
            
            <View style={styles.tripSummaryRow}>
              <View style={styles.tripSummaryIcon}>
                <MapPin size={18} color="#6b9e47" />
              </View>
              <Text style={styles.tripSummaryLabel}>Distancia</Text>
              <Text style={styles.tripSummaryValue}>{distance.toFixed(1)} km</Text>
            </View>

            <View style={styles.tripSummaryRow}>
              <View style={styles.tripSummaryIcon}>
                <Clock size={18} color="#6b9e47" />
              </View>
              <Text style={styles.tripSummaryLabel}>Tiempo estimado</Text>
              <Text style={styles.tripSummaryValue}>{selectedVehicleData.estimatedTime} min</Text>
            </View>

            <View style={styles.tripSummaryRow}>
              <View style={styles.tripSummaryIcon}>
                <DollarSign size={18} color="#6b9e47" />
              </View>
              <Text style={styles.tripSummaryLabel}>Costo total</Text>
              <Text style={styles.tripSummaryValueHighlight}>
                {formatCRC(selectedVehicleData.totalPrice)}
              </Text>
            </View>

            <Text style={styles.negotiableNote}>
              * Ajusta el precio con los botones + y - • El conductor puede aceptar o proponer otro precio
            </Text>
          </View>
        )}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity
          style={[
            styles.confirmButton,
            (!selectedVehicle || isSearching) && styles.confirmButtonDisabled,
          ]}
          onPress={handleConfirmRide}
          disabled={!selectedVehicle || isSearching}
        >
          {isSearching ? (
            <ActivityIndicator size="small" color="#131c0d" />
          ) : (
            <Text style={styles.confirmButtonText}>Confirmar viaje</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fafcf8',
  },
  mapPlaceholder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 300,
    backgroundColor: '#e8f5e9',
  },
  mapOverlay: {
    flex: 1,
    backgroundColor: 'rgba(250, 252, 248, 0.3)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: 'transparent',
  },
  backButton: {
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
  headerTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#131c0d',
  },
  content: {
    flex: 1,
    marginTop: 200,
  },
  contentContainer: {
    padding: 16,
    gap: 16,
  },
  routeInfo: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  routePoint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  routeIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#ecf4e6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  routeTextContainer: {
    flex: 1,
    gap: 2,
  },
  routeLabel: {
    fontSize: 12,
    fontWeight: '500' as const,
    color: '#6b9e47',
  },
  routeAddress: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#131c0d',
  },
  routeDivider: {
    height: 1,
    backgroundColor: '#ecf4e6',
    marginLeft: 44,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#131c0d',
    marginTop: 8,
  },
  vehicleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    gap: 12,
    borderWidth: 2,
    borderColor: '#ecf4e6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  vehicleCardSelected: {
    borderColor: '#65ea06',
    backgroundColor: '#f8fff4',
  },
  vehicleInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  vehicleIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#ecf4e6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  vehicleIconContainerSelected: {
    backgroundColor: '#e6f9e0',
  },
  vehicleDetails: {
    flex: 1,
    gap: 4,
  },
  vehicleName: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#131c0d',
  },
  vehicleCapacity: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: '#6b9e47',
  },
  vehiclePricing: {
    alignItems: 'center',
    gap: 8,
  },
  priceAdjuster: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  priceButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#ecf4e6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#6b9e47',
  },
  priceDisplay: {
    alignItems: 'center',
    gap: 2,
    minWidth: 80,
  },
  vehiclePrice: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#131c0d',
  },
  vehicleTime: {
    fontSize: 12,
    fontWeight: '500' as const,
    color: '#6b9e47',
  },
  vehicleSelector: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#ecf4e6',
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  vehicleSelectorSelected: {
    borderColor: '#65ea06',
    backgroundColor: '#65ea06',
  },
  vehicleSelectorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'white',
  },
  tripSummary: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    gap: 16,
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  tripSummaryTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#131c0d',
    marginBottom: 4,
  },
  tripSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  tripSummaryIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ecf4e6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tripSummaryLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500' as const,
    color: '#6b9e47',
  },
  tripSummaryValue: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#131c0d',
  },
  tripSummaryValueHighlight: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#65ea06',
  },
  negotiableNote: {
    fontSize: 12,
    fontWeight: '500' as const,
    color: '#9ca3af',
    fontStyle: 'italic' as const,
    marginTop: 4,
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    backgroundColor: '#fafcf8',
    borderTopWidth: 1,
    borderTopColor: '#ecf4e6',
  },
  confirmButton: {
    height: 56,
    borderRadius: 16,
    backgroundColor: '#65ea06',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#65ea06',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 5,
  },
  confirmButtonDisabled: {
    backgroundColor: '#ecf4e6',
    shadowOpacity: 0,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#131c0d',
  },
});
