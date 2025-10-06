import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Car, MapPin, User } from 'lucide-react-native';
import { useCommute } from '@/src/modules/commute/context/CommuteContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface VehicleOption {
  id: string;
  name: string;
  price: number;
  estimatedTime: number;
  selected: boolean;
}

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
  
  const [vehicles, setVehicles] = useState<VehicleOption[]>([]);
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
      
      const basePrice = 2000;
      const pricePerKm = 500;
      const baseTime = 5;
      const timePerKm = 2;
      
      const vehicleOptions: VehicleOption[] = transportModes.map((mode, index) => ({
        id: mode.id,
        name: mode.name,
        price: Math.round(basePrice + (dist * pricePerKm * mode.costFactor)),
        estimatedTime: Math.round(baseTime + (dist * timePerKm)),
        selected: index === 0,
      }));
      
      setVehicles(vehicleOptions);
    }
  }, [params, transportModes]);

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

  const toggleVehicle = (vehicleId: string) => {
    setVehicles(prev => prev.map(v => ({
      ...v,
      selected: v.id === vehicleId ? !v.selected : v.selected
    })));
  };

  const handleConfirmRide = async () => {
    const selectedVehicle = vehicles.find(v => v.selected);
    if (!selectedVehicle) {
      Alert.alert('Error', 'Por favor selecciona un vehículo');
      return;
    }

    const userId = firebaseUser && typeof firebaseUser === 'object' && 'uid' in firebaseUser 
      ? (firebaseUser as { uid: string }).uid 
      : 'demo_user';

    setIsCreating(true);
    try {
      const selectedMode = transportModes.find(m => m.id === selectedVehicle.id);
      if (!selectedMode) {
        throw new Error('Vehículo no encontrado');
      }

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
        estimatedCost: selectedVehicle.price,
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

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Stack.Screen options={{ headerShown: false }} />
      
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color="#131c0d" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Rutas</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.mapContainer}>
          <View style={styles.mapPlaceholder} />
        </View>

        <Text style={styles.sectionTitle}>Elige un viaje</Text>

        {vehicles.map((vehicle) => (
          <View key={vehicle.id} style={styles.vehicleRow}>
            <View style={styles.vehicleInfo}>
              <View style={styles.vehicleIcon}>
                <Car size={24} color="#131c0d" />
              </View>
              <View style={styles.vehicleDetails}>
                <Text style={styles.vehiclePrice}>₡{vehicle.price.toLocaleString()}</Text>
                <Text style={styles.vehicleTime}>{vehicle.estimatedTime} min</Text>
              </View>
            </View>
            
            <TouchableOpacity 
              style={styles.toggleContainer}
              onPress={() => toggleVehicle(vehicle.id)}
              activeOpacity={0.7}
            >
              <View style={[
                styles.toggle,
                vehicle.selected && styles.toggleActive
              ]}>
                <View style={[
                  styles.toggleThumb,
                  vehicle.selected && styles.toggleThumbActive
                ]} />
              </View>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom || 20 }]}>
        <TouchableOpacity 
          style={[styles.confirmButton, isCreating && styles.confirmButtonDisabled]}
          onPress={handleConfirmRide}
          disabled={isCreating}
          activeOpacity={0.8}
        >
          {isCreating ? (
            <ActivityIndicator size="small" color="#131c0d" />
          ) : (
            <Text style={styles.confirmButtonText}>Confirmar viaje</Text>
          )}
        </TouchableOpacity>

        <View style={styles.tabBar}>
          <TouchableOpacity 
            style={styles.tab}
            onPress={() => router.back()}
          >
            <MapPin size={24} color="#131c0d" />
            <Text style={styles.tabLabel}>Mapa</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.tab, styles.tabActive]}>
            <Car size={24} color="#6b9e47" />
            <Text style={[styles.tabLabel, styles.tabLabelActive]}>Viajes</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.tab}>
            <User size={24} color="#6b9e47" />
            <Text style={styles.tabLabel}>Perfil</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fafcf8',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#fafcf8',
  },
  backButton: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#131c0d',
    letterSpacing: -0.27,
  },
  content: {
    flex: 1,
  },
  mapContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  mapPlaceholder: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#e8f5e9',
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#131c0d',
    letterSpacing: -0.27,
    paddingHorizontal: 16,
    paddingBottom: 8,
    paddingTop: 16,
  },
  vehicleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fafcf8',
    paddingHorizontal: 16,
    minHeight: 72,
    paddingVertical: 8,
  },
  vehicleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  vehicleIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#ecf4e6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  vehicleDetails: {
    gap: 4,
  },
  vehiclePrice: {
    fontSize: 16,
    fontWeight: '500' as const,
    color: '#131c0d',
    lineHeight: 24,
  },
  vehicleTime: {
    fontSize: 14,
    fontWeight: '400' as const,
    color: '#6b9e47',
    lineHeight: 20,
  },
  toggleContainer: {
    padding: 8,
  },
  toggle: {
    width: 51,
    height: 31,
    borderRadius: 15.5,
    backgroundColor: '#ecf4e6',
    padding: 2,
    justifyContent: 'center',
  },
  toggleActive: {
    backgroundColor: '#65ea06',
    justifyContent: 'flex-end',
  },
  toggleThumb: {
    width: 27,
    height: 27,
    borderRadius: 13.5,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  toggleThumbActive: {
    alignSelf: 'flex-end',
  },
  footer: {
    backgroundColor: '#fafcf8',
  },
  confirmButton: {
    backgroundColor: '#65ea06',
    marginHorizontal: 16,
    marginVertical: 12,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmButtonDisabled: {
    opacity: 0.6,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#131c0d',
    letterSpacing: 0.24,
  },
  tabBar: {
    flexDirection: 'row',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#ecf4e6',
    backgroundColor: '#fafcf8',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
    paddingVertical: 8,
  },
  tabActive: {
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '500' as const,
    color: '#131c0d',
    letterSpacing: 0.18,
  },
  tabLabelActive: {
    color: '#6b9e47',
  },
});
