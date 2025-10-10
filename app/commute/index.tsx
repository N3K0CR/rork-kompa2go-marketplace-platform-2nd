import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, Platform, FlatList, Alert, ScrollView } from 'react-native';
import { Stack, router } from 'expo-router';
import { MapPin, Navigation, Search, Car, Users, Clock, DollarSign, X, TrendingUp, Info } from 'lucide-react-native';
import { useCommute } from '@/src/modules/commute/context/CommuteContext';
import { generateVehiclePrices, calculateDemandLevel, calculateTrafficLevel } from '@/src/modules/commute/utils/pricing';	
import * as Location from 'expo-location';
import { trpcClient } from '@/lib/trpc';
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
}

const VEHICLE_OPTIONS: VehicleOption[] = [
  {
    id: 'kommute-4',
    name: 'Kommute 4',
    capacity: 4,
    icon: Car,
  },
  {
    id: 'kommute-large',
    name: 'Kommute Large',
    capacity: 7,
    icon: Users,
  },
];
	
export default function CommuteHome() {
  const commuteContext = useCommute();
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
  const [showPricingDetails, setShowPricingDetails] = useState(false);

  useEffect(() => {
    getCurrentLocationAndAddress();
  }, []);

  const reverseGeocode = async (latitude: number, longitude: number, retries = 3): Promise<string> => {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const result = await trpcClient.geocoding.reverse.query({ latitude, longitude });
        
        if (result && result.address) {
          console.log('✅ Geocoding success:', result.address);
          return result.address;
        }
        
        if (result && result.displayName) {
          console.log('✅ Geocoding success (displayName):', result.displayName);
          return result.displayName;
        }
      } catch (error) {
        console.log(`⚠️ Geocoding attempt ${attempt}/${retries} failed:`, error);
        
        if (attempt < retries) {
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }
      }
    }
    
    console.log('⚠️ Geocoding failed, using generic location');
    return 'Mi ubicación actual';
  };

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
            
            const address = await reverseGeocode(latitude, longitude);
            setCurrentAddress(address);
            setLoadingLocation(false);
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
        
        if (geocode) {
          const parts = [];
          if (geocode.street) parts.push(geocode.street);
          if (geocode.streetNumber) parts.push(geocode.streetNumber);
          if (geocode.city) parts.push(geocode.city);
          if (geocode.district) parts.push(geocode.district);
          
          const address = parts.length > 0 ? parts.join(', ') : 'Mi ubicación actual';
          setCurrentAddress(address);
        } else {
          const address = await reverseGeocode(latitude, longitude);
          setCurrentAddress(address);
        }
        setLoadingLocation(false);
      }
    } catch (error) {
      console.error('Error in getCurrentLocationAndAddress:', error);
      setCurrentAddress('Error obteniendo ubicación');
      setLoadingLocation(false);
    }
  };

  const searchDestination = useCallback(async (query: string) => {
    if (!query || query.length < 2) {
      setSuggestions([]);
      return;
    }

    try {
      setSearching(true);
      
      await new Promise(resolve => setTimeout(resolve, 400));
      
      let results;
      const backendUrl = process.env.EXPO_PUBLIC_RORK_API_BASE_URL;
      
      if (backendUrl) {
        try {
          console.log('🔍 Trying backend geocoding at:', backendUrl);
          results = await trpcClient.geocoding.search.query({ query, countryCode: 'cr' });
          console.log('✅ Backend search results:', results.length, 'items found for:', query);
        } catch (backendError) {
          console.warn('⚠️ Backend error, falling back to direct API:', backendError);
          results = null;
        }
      } else {
        console.log('⚠️ Backend not configured, using direct Nominatim API');
        results = null;
      }
      
      if (!results) {
        const searchQuery = query.includes('Costa Rica') ? query : `${query}, Costa Rica`;
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=8&addressdetails=1&countrycodes=cr`;
        
        console.log('🔍 Fetching from Nominatim:', url);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'User-Agent': 'Kompa2Go/1.0',
            'Accept': 'application/json',
          },
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          throw new Error(`Geocoding failed: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        
        results = data.map((item: any) => ({
          placeId: item.place_id,
          displayName: item.display_name,
          latitude: parseFloat(item.lat),
          longitude: parseFloat(item.lon),
          address: item.display_name,
        }));
        
        console.log('✅ Direct API search results:', results.length, 'items found for:', query);
      }
      
      const suggestions: AddressSuggestion[] = results.map((result: { placeId: number; displayName: string; latitude: number; longitude: number; address: string }) => ({
        place_id: result.placeId.toString(),
        display_name: result.displayName,
        lat: result.latitude.toString(),
        lon: result.longitude.toString(),
        address: {
          road: result.address,
          city: '',
        },
      }));
      
      setSuggestions(suggestions);
    } catch (error) {
      if (error instanceof Error) {
        console.error('Error searching destination:', error.message);
        
        if (error.message.includes('Rate limit')) {
          Alert.alert('Límite de búsqueda', 'Por favor espera un momento antes de buscar de nuevo.');
        } else if (error.name === 'AbortError') {
          console.log('⚠️ Search request timed out');
          Alert.alert('Tiempo agotado', 'La búsqueda tardó demasiado. Por favor intenta de nuevo.');
        } else {
          Alert.alert(
            'Error de Búsqueda',
            'No se pudo realizar la búsqueda. Verifica tu conexión a internet.',
            [{ text: 'OK' }]
          );
        }
      }
      setSuggestions([]);
    } finally {
      setSearching(false);
    }
  }, []);

  const handleDestinationChange = (text: string) => {
    setDestination(text);
    if (text.length >= 2) {
      searchDestination(text);
    } else {
      setSuggestions([]);
    }
  };

  const handleSelectDestination = (suggestion: AddressSuggestion) => {
    if (!userLocation) {
      Alert.alert('Error', 'No se pudo obtener tu ubicación actual');
      return;
    }

    setDestination(suggestion.display_name);
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
    setDuration(Math.ceil((distanceKm / 30) * 60));
    
    setTimeout(() => {
      setSuggestions([]);
    }, 100);
  };

  const handleClearDestination = () => {
    setDestination('');
    setSelectedDestination(null);
    setSelectedVehicle(null);
    setDistance(0);
    setDuration(0);
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
          estimatedPrice: selectedVehicleDetails?.totalPrice.toString() || '0',
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

  const currentTime = new Date();
  const demandLevel = calculateDemandLevel(currentTime);
  const trafficLevel = calculateTrafficLevel(currentTime);
  
  const vehiclePrices = distance > 0 ? generateVehiclePrices(
    distance * 1000,
    duration * 60,
    {
      timestamp: currentTime,
      demandLevel,
      trafficLevel,
      weatherCondition: 'normal',
      isSpecialEvent: false,
    }
  ) : [];
  
  const vehicleDetails = VEHICLE_OPTIONS.map(vehicle => {
    const priceData = vehiclePrices.find(p => p.vehicleType === vehicle.id);
    return {
      ...vehicle,
      totalPrice: priceData?.price || 0,
      basePrice: priceData?.basePrice || 0,
      estimatedTime: duration || 0,
      appliedFactors: priceData?.appliedFactors || [],
      surgeMultiplier: priceData?.surgeMultiplier || 1.0,
      ivaAmount: priceData?.ivaAmount || 0,
      kompa2goCommission: priceData?.kompa2goCommission || 0,
      driverEarnings: priceData?.driverEarnings || 0,
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

          {destination.length >= 2 && !selectedDestination && (
            <View style={styles.suggestionsContainer}>
              {searching && suggestions.length === 0 ? (
                <View style={styles.searchingContainer}>
                  <ActivityIndicator size="small" color="#6b9e47" />
                  <Text style={styles.searchingText}>Buscando direcciones...</Text>
                </View>
              ) : suggestions.length > 0 ? (
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
                        <Text style={styles.suggestionSecondaryText} numberOfLines={2}>
                          {item.display_name}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  )}
                  scrollEnabled={false}
                />
              ) : !searching ? (
                <View style={styles.noResultsContainer}>
                  <Text style={styles.noResultsText}>No se encontraron resultados</Text>
                  <Text style={styles.noResultsSubtext}>Intenta con otra búsqueda</Text>
                </View>
              ) : null}
            </View>
          )}
        </View>

        {selectedDestination && (
          <View style={styles.vehicleSelectionContainer}>
            <Text style={styles.sectionTitle}>Elige un vehículo</Text>

            {vehicleDetails.map((vehicle) => {
              const Icon = vehicle.icon;
              const isSelected = selectedVehicle === vehicle.id;
              const hasSurge = vehicle.surgeMultiplier > 1.0;

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
                      {hasSurge && (
                        <View style={styles.surgeIndicator}>
                          <TrendingUp size={12} color="#ff9800" />
                          <Text style={styles.surgeText}>
                            {vehicle.surgeMultiplier.toFixed(1)}x demanda
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>

                  <View style={styles.vehiclePricing}>
                    <Text style={styles.vehiclePrice}>
                      ₡{vehicle.totalPrice.toLocaleString('es-CR')}
                    </Text>
                    {hasSurge && vehicle.basePrice > 0 && (
                      <Text style={styles.basePriceStrikethrough}>
                        ₡{vehicle.basePrice.toLocaleString('es-CR')}
                      </Text>
                    )}
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
                <View style={styles.tripSummaryHeader}>
                  <Text style={styles.tripSummaryTitle}>Resumen del viaje</Text>
                  {selectedVehicleData.appliedFactors.length > 0 && (
                    <TouchableOpacity 
                      onPress={() => setShowPricingDetails(!showPricingDetails)}
                      style={styles.infoButton}
                    >
                      <Info size={18} color="#6b9e47" />
                    </TouchableOpacity>
                  )}
                </View>
                
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

                {selectedVehicleData.surgeMultiplier > 1.0 && selectedVehicleData.basePrice > 0 && (
                  <View style={styles.tripSummaryRow}>
                    <View style={styles.tripSummaryIcon}>
                      <DollarSign size={18} color="#9ca3af" />
                    </View>
                    <Text style={styles.tripSummaryLabel}>Precio base</Text>
                    <Text style={styles.tripSummaryValueStrikethrough}>
                      ₡{selectedVehicleData.basePrice.toLocaleString('es-CR')}
                    </Text>
                  </View>
                )}

                <View style={styles.tripSummaryRow}>
                  <View style={styles.tripSummaryIcon}>
                    <DollarSign size={18} color="#6b9e47" />
                  </View>
                  <Text style={styles.tripSummaryLabel}>Precio (sin IVA)</Text>
                  <Text style={styles.tripSummaryValue}>
                    ₡{(selectedVehicleData.totalPrice - selectedVehicleData.ivaAmount).toLocaleString('es-CR')}
                  </Text>
                </View>

                <View style={styles.tripSummaryRow}>
                  <View style={styles.tripSummaryIcon}>
                    <DollarSign size={18} color="#ff9800" />
                  </View>
                  <Text style={styles.tripSummaryLabel}>IVA (13%)</Text>
                  <Text style={styles.tripSummaryValueIVA}>
                    ₡{selectedVehicleData.ivaAmount.toLocaleString('es-CR')}
                  </Text>
                </View>

                <View style={styles.tripSummaryDivider} />

                <View style={styles.tripSummaryRow}>
                  <View style={styles.tripSummaryIcon}>
                    <DollarSign size={18} color="#65ea06" />
                  </View>
                  <Text style={styles.tripSummaryLabel}>Total a pagar</Text>
                  <Text style={styles.tripSummaryValueHighlight}>
                    ₡{selectedVehicleData.totalPrice.toLocaleString('es-CR')}
                  </Text>
                </View>

                {showPricingDetails && selectedVehicleData.appliedFactors.length > 0 && (
                  <View style={styles.pricingFactorsContainer}>
                    <Text style={styles.pricingFactorsTitle}>Factores aplicados:</Text>
                    {selectedVehicleData.appliedFactors.map((factor, index) => (
                      <View key={index} style={styles.pricingFactorRow}>
                        <View style={styles.pricingFactorDot} />
                        <View style={styles.pricingFactorContent}>
                          <Text style={styles.pricingFactorName}>{factor.name}</Text>
                          <Text style={styles.pricingFactorDescription}>{factor.description}</Text>
                        </View>
                        <Text style={styles.pricingFactorMultiplier}>
                          +{((factor.multiplier - 1) * 100).toFixed(0)}%
                        </Text>
                      </View>
                    ))}
                  </View>
                )}

                <View style={styles.commissionInfo}>
                  <Text style={styles.commissionInfoTitle}>Desglose transparente:</Text>
                  <View style={styles.commissionRow}>
                    <Text style={styles.commissionLabel}>Conductor (85%):</Text>
                    <Text style={styles.commissionValue}>
                      ₡{selectedVehicleData.driverEarnings.toLocaleString('es-CR')}
                    </Text>
                  </View>
                  <View style={styles.commissionRow}>
                    <Text style={styles.commissionLabel}>Kompa2Go (15%):</Text>
                    <Text style={styles.commissionValue}>
                      ₡{selectedVehicleData.kompa2goCommission.toLocaleString('es-CR')}
                    </Text>
                  </View>
                </View>

                <Text style={styles.negotiableNote}>
                  * Precio final incluye IVA para cumplimiento fiscal
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
    flexWrap: 'wrap',
  },
  searchingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 12,
  },
  searchingText: {
    fontSize: 14,
    color: '#6b9e47',
    fontWeight: '500' as const,
  },
  noResultsContainer: {
    alignItems: 'center',
    padding: 24,
    gap: 8,
  },
  noResultsText: {
    fontSize: 15,
    color: '#131c0d',
    fontWeight: '600' as const,
  },
  noResultsSubtext: {
    fontSize: 13,
    color: '#6b9e47',
    fontWeight: '400' as const,
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
  surgeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  surgeText: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: '#ff9800',
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
  basePriceStrikethrough: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: '#9ca3af',
    textDecorationLine: 'line-through' as const,
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
  tripSummaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  tripSummaryTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#131c0d',
  },
  infoButton: {
    padding: 4,
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
  tripSummaryValueStrikethrough: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: '#9ca3af',
    textDecorationLine: 'line-through' as const,
  },
  pricingFactorsContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#ecf4e6',
    gap: 12,
  },
  pricingFactorsTitle: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#6b9e47',
    marginBottom: 4,
  },
  pricingFactorRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  pricingFactorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#ff9800',
    marginTop: 6,
  },
  pricingFactorContent: {
    flex: 1,
    gap: 2,
  },
  pricingFactorName: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#131c0d',
  },
  pricingFactorDescription: {
    fontSize: 11,
    fontWeight: '400' as const,
    color: '#6b9e47',
    lineHeight: 14,
  },
  pricingFactorMultiplier: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: '#ff9800',
  },
  tripSummaryValueIVA: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#ff9800',
  },
  tripSummaryDivider: {
    height: 1,
    backgroundColor: '#ecf4e6',
    marginVertical: 8,
  },
  commissionInfo: {
    padding: 16,
    backgroundColor: '#f8fff4',
    borderRadius: 12,
    gap: 8,
    marginTop: 8,
  },
  commissionInfoTitle: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: '#6b9e47',
    marginBottom: 4,
  },
  commissionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  commissionLabel: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: '#6b9e47',
  },
  commissionValue: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#131c0d',
  },
  negotiableNote: {
    fontSize: 12,
    fontWeight: '500' as const,
    color: '#9ca3af',
    fontStyle: 'italic' as const,
    marginTop: 12,
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
