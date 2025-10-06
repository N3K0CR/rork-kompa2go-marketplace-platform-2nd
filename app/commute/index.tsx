import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, Platform, FlatList, Alert, ScrollView } from 'react-native';
import { Stack, router } from 'expo-router';
import { MapPin, Navigation, Search, Car, Users, Clock, DollarSign, X } from 'lucide-react-native';
import { useCommute } from '@/src/modules/commute/context/CommuteContext';

import * as Location from 'expo-location';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface AddressSuggestion {
  place_id: string;
  display_name: string;
  lat: string;
  lon: string;
  address?: {
    road?: string;
    city?: string;
  };
}

interface VehicleOption {
  id: 'kommute-4' | 'kommute-large';
  name: string;
  capacity: number;
  icon: typeof Car | typeof Users;
  basePrice: number;
  pricePerKm: number;
  estimatedTime: number;
}

const VEHICLE_OPTIONS: VehicleOption[] = [
  {
    id: 'kommute-4',
    name: 'Kommute 4',
    capacity: 4,
    icon: Car,
    basePrice: 1500,
    pricePerKm: 500,
    estimatedTime: 12,
  },
  {
    id: 'kommute-large',
    name: 'Kommute Large',
    capacity: 7,
    icon: Users,
    basePrice: 2000,
    pricePerKm: 600,
    estimatedTime: 15,
  },
];

function roundToCostaRicanCurrency(amount: number): number {
  if (amount < 100) {
    return Math.round(amount / 5) * 5;
  } else if (amount < 500) {
    return Math.round(amount / 10) * 10;
  } else if (amount < 1000) {
    return Math.round(amount / 25) * 25;
  } else if (amount < 5000) {
    return Math.round(amount / 50) * 50;
  } else if (amount < 10000) {
    return Math.round(amount / 100) * 100;
  } else if (amount < 20000) {
    return Math.round(amount / 500) * 500;
  } else {
    return Math.round(amount / 1000) * 1000;
  }
}

export default function CommuteHome() {
  const commuteContext = useCommute();
  const { transportModes, createRoute, startTrip } = commuteContext;
  const firebaseUser = 'firebaseUser' in commuteContext ? commuteContext.firebaseUser : null;
  const insets = useSafeAreaInsets();
  
  const [destination, setDestination] = useState('');
  const [currentAddress, setCurrentAddress] = useState('Obteniendo ubicación...');
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [searching, setSearching] = useState(false);
  const [loadingLocation, setLoadingLocation] = useState(true);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [selectedDestination, setSelectedDestination] = useState<AddressSuggestion | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<'kommute-4' | 'kommute-large' | null>(null);
  const [distance, setDistance] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [isRequestingTrip, setIsRequestingTrip] = useState(false);

  useEffect(() => {
    getCurrentLocationAndAddress();
  }, []);

  const getCurrentLocationAndAddress = async () => {
    try {
      setLoadingLocation(true);
      
      if (Platform.OS === 'web') {
        if (!navigator.geolocation) {
          setCurrentAddress('Ubicación no disponible');
          setLoadingLocation(false);
          return;
        }

        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;
            setUserLocation({ latitude, longitude });
            
            try {
              const controller = new AbortController();
              const timeoutId = setTimeout(() => controller.abort(), 5000);
              
              const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
                {
                  signal: controller.signal,
                  headers: {
                    'User-Agent': 'Kompa2Go/1.0',
                  },
                }
              );
              
              clearTimeout(timeoutId);
              
              if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
              }
              
              const data = await response.json();
              const address = data.address?.road 
                ? `${data.address.road}, ${data.address.city || ''}` 
                : data.display_name?.split(',').slice(0, 2).join(',');
              setCurrentAddress(address || 'Ubicación actual');
            } catch (error) {
              console.error('Error getting address:', error);
              setCurrentAddress(`Lat: ${latitude.toFixed(4)}, Lon: ${longitude.toFixed(4)}`);
            } finally {
              setLoadingLocation(false);
            }
          },
          (error) => {
            console.error('Error getting location:', error);
            setCurrentAddress('No se pudo obtener ubicación');
            setLoadingLocation(false);
          },
          { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
        );
      } else {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setCurrentAddress('Permiso de ubicación denegado');
          setLoadingLocation(false);
          return;
        }

        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });

        const { latitude, longitude } = location.coords;
        setUserLocation({ latitude, longitude });
        
        const [geocode] = await Location.reverseGeocodeAsync({ latitude, longitude });
        const address = geocode
          ? `${geocode.street || ''} ${geocode.streetNumber || ''}, ${geocode.city || ''}`.trim()
          : `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
        
        setCurrentAddress(address);
        setLoadingLocation(false);
      }
    } catch (error) {
      console.error('Error in getCurrentLocationAndAddress:', error);
      setCurrentAddress('Error obteniendo ubicación');
      setLoadingLocation(false);
    }
  };

  const searchDestination = useCallback(async (query: string) => {
    if (!query || query.length < 3) {
      setSuggestions([]);
      return;
    }

    try {
      setSearching(true);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);
      
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1&countrycodes=cr`,
        {
          signal: controller.signal,
          headers: {
            'User-Agent': 'Kompa2Go/1.0',
          },
        }
      );
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setSuggestions(data);
    } catch (error) {
      console.error('Error searching destination:', error);
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          console.log('Search request timed out');
        }
      }
      setSuggestions([]);
    } finally {
      setSearching(false);
    }
  }, []);

  const handleDestinationChange = (text: string) => {
    setDestination(text);
    searchDestination(text);
  };

  const handleSelectDestination = (suggestion: AddressSuggestion) => {
    if (!userLocation) {
      Alert.alert('Error', 'No se pudo obtener tu ubicación actual');
      return;
    }

    setDestination(suggestion.display_name);
    setSuggestions([]);
    setSelectedDestination(suggestion);

    const R = 6371;
    const dLat = (parseFloat(suggestion.lat) - userLocation.latitude) * Math.PI / 180;
    const dLon = (parseFloat(suggestion.lon) - userLocation.longitude) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(userLocation.latitude * Math.PI / 180) * Math.cos(parseFloat(suggestion.lat) * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distanceKm = R * c;

    setDistance(distanceKm);
    setDuration(Math.ceil((distanceKm / 40) * 60));
  };

  const handleClearDestination = () => {
    setDestination('');
    setSelectedDestination(null);
    setSelectedVehicle(null);
    setSuggestions([]);
  };

  const handleConfirmRide = async () => {
    if (!selectedVehicle || !selectedDestination || !userLocation) {
      Alert.alert('Error', 'Por favor completa todos los campos');
      return;
    }

    if (!firebaseUser) {
      Alert.alert('Error', 'Debes iniciar sesión para solicitar un viaje');
      return;
    }

    setIsRequestingTrip(true);

    try {
      const selectedVehicleDetails = vehicleDetails.find(v => v.id === selectedVehicle);
      
      router.push({
        pathname: '/commute/trip/searching',
        params: {
          originLat: userLocation.latitude.toString(),
          originLon: userLocation.longitude.toString(),
          originAddress: currentAddress,
          destLat: selectedDestination.lat,
          destLon: selectedDestination.lon,
          destAddress: selectedDestination.display_name,
          vehicleType: selectedVehicle,
          vehicleName: selectedVehicleDetails?.name,
          estimatedPrice: selectedVehicleDetails ? selectedVehicleDetails.totalPrice.toString() : '0',
          estimatedTime: duration.toString(),
          distance: distance.toFixed(2),
        },
      });
    } catch (error) {
      console.error('Error confirming ride:', error);
      Alert.alert('Error', 'No se pudo procesar tu solicitud. Intenta nuevamente.');
    } finally {
      setIsRequestingTrip(false);
    }
  };

  const vehicleDetails = VEHICLE_OPTIONS.map(vehicle => {
    const rawPrice = vehicle.basePrice + (distance * vehicle.pricePerKm);
    return {
      ...vehicle,
      totalPrice: roundToCostaRicanCurrency(rawPrice),
      estimatedTime: duration || vehicle.estimatedTime,
    };
  });

  const selectedVehicleData = vehicleDetails.find(v => v.id === selectedVehicle);

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{ 
          headerShown: false,
        }} 
      />
      
      <View style={styles.mapBackground}>
        <View style={styles.mapGradient} />
      </View>

      <ScrollView 
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.searchContainer, { paddingTop: insets.top + 16 }]}>
          <View style={styles.currentLocationCard}>
            <View style={styles.locationIcon}>
              <Navigation size={20} color="#6b9e47" />
            </View>
            <View style={styles.locationInfo}>
              <Text style={styles.locationLabel}>Tu ubicación</Text>
              {loadingLocation ? (
                <ActivityIndicator size="small" color="#6b9e47" />
              ) : (
                <Text style={styles.locationAddress} numberOfLines={1}>{currentAddress}</Text>
              )}
            </View>
          </View>

          <View style={styles.destinationCard}>
            <View style={styles.searchIcon}>
              <Search size={20} color="#6b9e47" />
            </View>
            <TextInput
              style={styles.destinationInput}
              placeholder="¿A dónde vas?"
              placeholderTextColor="#9ca3af"
              value={destination}
              onChangeText={handleDestinationChange}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!selectedDestination}
            />
            {searching && (
              <ActivityIndicator size="small" color="#6b9e47" style={styles.searchingIndicator} />
            )}
            {selectedDestination && (
              <TouchableOpacity onPress={handleClearDestination} style={styles.clearButton}>
                <X size={20} color="#6b9e47" />
              </TouchableOpacity>
            )}
          </View>

          {suggestions.length > 0 && !selectedDestination && (
            <View style={styles.suggestionsContainer}>
              <FlatList
                data={suggestions}
                keyExtractor={(item) => item.place_id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.suggestionItem}
                    onPress={() => handleSelectDestination(item)}
                  >
                    <MapPin size={18} color="#6b9e47" />
                    <View style={styles.suggestionTextContainer}>
                      <Text style={styles.suggestionMainText} numberOfLines={1}>
                        {item.address?.road || item.address?.city || 'Ubicación'}
                      </Text>
                      <Text style={styles.suggestionSecondaryText} numberOfLines={1}>
                        {item.display_name}
                      </Text>
                    </View>
                  </TouchableOpacity>
                )}
                scrollEnabled={false}
              />
            </View>
          )}
        </View>

        {selectedDestination && (
          <View style={styles.vehicleSelectionContainer}>
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
                        {vehicle.capacity} pasajeros
                      </Text>
                    </View>
                  </View>

                  <View style={styles.vehiclePricing}>
                    <Text style={styles.vehiclePrice}>
                      ₡{vehicle.totalPrice.toLocaleString('es-CR')}
                    </Text>
                    <Text style={styles.vehicleTime}>
                      {vehicle.estimatedTime} min
                    </Text>
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
                  <Text style={styles.tripSummaryValue}>{distance.toFixed(2)} km</Text>
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
                    ₡{selectedVehicleData.totalPrice.toLocaleString('es-CR')}
                  </Text>
                </View>

                <Text style={styles.negotiableNote}>
                  * El precio es negociable con el conductor
                </Text>
              </View>
            )}

            <TouchableOpacity
              style={[
                styles.confirmButton,
                (!selectedVehicle || isRequestingTrip) && styles.confirmButtonDisabled,
              ]}
              onPress={handleConfirmRide}
              disabled={!selectedVehicle || isRequestingTrip}
            >
              {isRequestingTrip ? (
                <ActivityIndicator size="small" color="#131c0d" />
              ) : (
                <Text style={styles.confirmButtonText}>Solicitar viaje</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fafcf8',
  },
  mapBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 300,
    backgroundColor: '#e8f5e9',
  },
  mapGradient: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 12,
  },
  currentLocationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  locationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ecf4e6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  locationInfo: {
    flex: 1,
    gap: 4,
  },
  locationLabel: {
    fontSize: 12,
    color: '#6b9e47',
    fontWeight: '500' as const,
  },
  locationAddress: {
    fontSize: 15,
    color: '#131c0d',
    fontWeight: '600' as const,
  },
  destinationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  searchIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ecf4e6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  destinationInput: {
    flex: 1,
    fontSize: 16,
    color: '#131c0d',
    padding: 0,
    fontWeight: '500' as const,
  },
  searchingIndicator: {
    marginLeft: 8,
  },
  suggestionsContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#ecf4e6',
  },
  suggestionTextContainer: {
    flex: 1,
    gap: 4,
  },
  suggestionMainText: {
    fontSize: 15,
    color: '#131c0d',
    fontWeight: '600' as const,
    lineHeight: 20,
  },
  suggestionSecondaryText: {
    fontSize: 12,
    color: '#6b9e47',
    fontWeight: '400' as const,
    lineHeight: 16,
  },
  clearButton: {
    padding: 4,
  },
  vehicleSelectionContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#131c0d',
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
    alignItems: 'flex-end',
    gap: 2,
  },
  vehiclePrice: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#131c0d',
  },
  vehicleTime: {
    fontSize: 13,
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
    marginTop: 8,
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
