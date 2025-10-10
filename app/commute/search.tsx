import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Platform } from 'react-native';
import { Stack, router } from 'expo-router';
import { Search, MapPin, Navigation } from 'lucide-react-native';
import { useCommute } from '@/hooks/useCommute';

import { CommuteButton } from '@/components/commute';
import { MultiStopSelector } from '@/components/commute/LocationSelector';
import { DestinationSearchInput } from '@/components/commute/DestinationSearchInput';
import { PlaceDetails, PlacesService } from '@/src/modules/commute/services/places-service';
import { Colors, Spacing, BorderRadius, Shadows, Typography } from '@/context-package/design-system';
import * as Location from 'expo-location';

interface LocationPoint {
  latitude: number;
  longitude: number;
  address: string;
  name?: string;
}

interface StopPoint extends LocationPoint {
  id: string;
}

export default function CommuteSearch() {
  const { transportModes, createRoute, startTrip } = useCommute();

  const [origin, setOrigin] = useState<LocationPoint | null>(null);
  const [destination, setDestination] = useState<LocationPoint | null>(null);
  const [stops, setStops] = useState<StopPoint[]>([]);
  const [useMultiStop, setUseMultiStop] = useState(false);
  const [originInput, setOriginInput] = useState('');
  const [destinationInput, setDestinationInput] = useState('');
  const [selectedVehicleType, setSelectedVehicleType] = useState<string>('kommute-4');
  const [isSearching, setIsSearching] = useState(false);
  const [loadingLocation, setLoadingLocation] = useState<'origin' | 'destination' | null>(null);
  const [saveAsFrequent, setSaveAsFrequent] = useState(false);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | undefined>();

  console.log('🔍 CommuteSearch: Rendered');

  React.useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const location = await Location.getCurrentPositionAsync({});
          setUserLocation({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          });
          console.log('✅ User location obtained:', location.coords);
        }
      } catch (error) {
        console.log('⚠️ Could not get user location:', error);
      }
    })();
  }, []);

  const handleSelectOrigin = (place: PlaceDetails) => {
    console.log('✅ Origin selected:', place);
    setOrigin({
      latitude: place.geometry.location.lat,
      longitude: place.geometry.location.lng,
      address: place.formatted_address,
      name: place.name,
    });
    setOriginInput(place.name || place.formatted_address);
  };

  const handleSelectDestination = (place: PlaceDetails) => {
    console.log('✅ Destination selected:', place);
    setDestination({
      latitude: place.geometry.location.lat,
      longitude: place.geometry.location.lng,
      address: place.formatted_address,
      name: place.name,
    });
    setDestinationInput(place.name || place.formatted_address);
  };

  const reverseGeocodeWithRetry = async (latitude: number, longitude: number): Promise<string> => {
    try {
      console.log('🔍 Reverse geocoding via Google Maps:', latitude, longitude);
      
      const address = await PlacesService.reverseGeocode(latitude, longitude);
      
      console.log('✅ Reverse geocoding result:', address);
      return address;
    } catch (error: any) {
      console.error('❌ Reverse geocoding error:', error.message);
      throw error;
    }
  };

  const handleUseCurrentLocation = async (type: 'origin' | 'destination') => {
    if (Platform.OS === 'web') {
      try {
        setLoadingLocation(type);
        
        if (!navigator.geolocation) {
          Alert.alert('Error', 'La geolocalización no está disponible en este navegador');
          return;
        }

        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;
            
            try {
              const address = await reverseGeocodeWithRetry(latitude, longitude);
              
              const location: LocationPoint = {
                latitude,
                longitude,
                address,
              };
              
              if (type === 'origin') {
                setOrigin(location);
                setOriginInput(address);
              } else {
                setDestination(location);
                setDestinationInput(address);
              }
              
              console.log('✅ Location updated:', { latitude, longitude, address });
            } catch (error) {
              console.error('❌ Error getting address:', error);
              
              const fallbackAddress = `Ubicación: ${latitude.toFixed(4)}°, ${longitude.toFixed(4)}°`;
              
              const location: LocationPoint = {
                latitude,
                longitude,
                address: fallbackAddress,
              };
              
              if (type === 'origin') {
                setOrigin(location);
                setOriginInput(fallbackAddress);
              } else {
                setDestination(location);
                setDestinationInput(fallbackAddress);
              }
              
              console.log('⚠️ Using fallback address:', fallbackAddress);
            } finally {
              setLoadingLocation(null);
            }
          },
          (error) => {
            console.error('❌ Error getting location:', error);
            Alert.alert('Error', 'No se pudo obtener la ubicación actual');
            setLoadingLocation(null);
          },
          { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
        );
      } catch (error) {
        console.error('❌ Error in web geolocation:', error);
        Alert.alert('Error', 'No se pudo obtener la ubicación actual');
        setLoadingLocation(null);
      }
    } else {
      try {
        setLoadingLocation(type);
        
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permiso Denegado', 'Se necesita permiso para acceder a la ubicación');
          setLoadingLocation(null);
          return;
        }

        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });

        const { latitude, longitude } = location.coords;
        
        try {
          const address = await reverseGeocodeWithRetry(latitude, longitude);
          
          const locationPoint: LocationPoint = {
            latitude,
            longitude,
            address,
          };
          
          if (type === 'origin') {
            setOrigin(locationPoint);
            setOriginInput(address);
          } else {
            setDestination(locationPoint);
            setDestinationInput(address);
          }
          
          console.log('✅ Location updated:', { latitude, longitude, address });
        } catch (error) {
          console.error('❌ Error getting address:', error);
          
          const fallbackAddress = `Ubicación: ${latitude.toFixed(4)}°, ${longitude.toFixed(4)}°`;
          
          const locationPoint: LocationPoint = {
            latitude,
            longitude,
            address: fallbackAddress,
          };
          
          if (type === 'origin') {
            setOrigin(locationPoint);
            setOriginInput(fallbackAddress);
          } else {
            setDestination(locationPoint);
            setDestinationInput(fallbackAddress);
          }
          
          console.log('⚠️ Using fallback address:', fallbackAddress);
        }
      } catch (error) {
        console.error('❌ Error getting location:', error);
        Alert.alert('Error', 'No se pudo obtener la ubicación actual');
      } finally {
        setLoadingLocation(null);
      }
    }
  };

  const handleSearchTrip = async () => {
    if (!origin || !destination) {
      Alert.alert('Error', 'Por favor selecciona origen y destino');
      return;
    }

    if (!selectedVehicleType) {
      Alert.alert('Error', 'Por favor selecciona un tipo de vehículo');
      return;
    }

    setIsSearching(true);
    try {
      console.log('🚀 Creating trip request...');
      
      const selectedMode = transportModes.find(m => m.id === selectedVehicleType);
      if (!selectedMode) {
        throw new Error('Tipo de vehículo no encontrado');
      }

      if (saveAsFrequent) {
        const route = await createRoute({
          userId: 'current_user',
          name: `${origin.name || 'Origen'} → ${destination.name || 'Destino'}`,
          points: [
            {
              id: `point_origin_${Date.now()}`,
              latitude: origin.latitude,
              longitude: origin.longitude,
              address: origin.address,
              name: origin.name,
              type: 'origin'
            },
            {
              id: `point_dest_${Date.now()}`,
              latitude: destination.latitude,
              longitude: destination.longitude,
              address: destination.address,
              name: destination.name,
              type: 'destination'
            }
          ],
          transportModes: [selectedMode],
          distance: 0,
          duration: 0,
          estimatedCost: 0,
          carbonFootprint: 0,
          status: 'planned',
          isRecurring: false
        });
        
        await startTrip(route.id);
        router.push(`/commute/trip/${route.id}`);
      } else {
        const tempRoute = await createRoute({
          userId: 'current_user',
          name: `Viaje temporal - ${new Date().toLocaleTimeString()}`,
          points: [
            {
              id: `point_origin_${Date.now()}`,
              latitude: origin.latitude,
              longitude: origin.longitude,
              address: origin.address,
              name: origin.name,
              type: 'origin'
            },
            {
              id: `point_dest_${Date.now()}`,
              latitude: destination.latitude,
              longitude: destination.longitude,
              address: destination.address,
              name: destination.name,
              type: 'destination'
            }
          ],
          transportModes: [selectedMode],
          distance: 0,
          duration: 0,
          estimatedCost: 0,
          carbonFootprint: 0,
          status: 'planned',
          isRecurring: false
        });
        
        await startTrip(tempRoute.id);
        router.push(`/commute/trip/${tempRoute.id}`);
      }
    } catch (error) {
      console.error('❌ Error creating trip:', error);
      Alert.alert('Error', 'No se pudo crear el viaje. Por favor intenta de nuevo.');
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: 'Buscar Viaje',
          headerStyle: { backgroundColor: Colors.primary[500] },
          headerTintColor: 'white',
          headerTitleStyle: { fontWeight: 'bold' }
        }} 
      />
      
      <ScrollView style={styles.scrollView}>
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>¿A dónde vas?</Text>
            <TouchableOpacity
              style={styles.multiStopToggle}
              onPress={() => setUseMultiStop(!useMultiStop)}
            >
              <Text style={styles.multiStopToggleText}>
                {useMultiStop ? 'Modo simple' : 'Agregar paradas'}
              </Text>
            </TouchableOpacity>
          </View>
          
          {useMultiStop ? (
            <MultiStopSelector
              origin={origin}
              destination={destination}
              stops={stops}
              onOriginChange={(location) => {
                setOrigin(location);
                setOriginInput(location.address);
              }}
              onDestinationChange={(location) => {
                setDestination(location);
                setDestinationInput(location.address);
              }}
              onStopsChange={setStops}
              maxStops={3}
            />
          ) : (
            <>
              <View style={styles.locationInputContainer}>
                <View style={styles.locationInputHeader}>
                  <MapPin size={20} color={Colors.success[500]} />
                  <Text style={styles.locationLabel}>Origen</Text>
                </View>
                <DestinationSearchInput
                  onSelectDestination={handleSelectOrigin}
                  placeholder="Escribe tu punto de partida..."
                  initialValue={originInput}
                  userLocation={userLocation}
                />
                <TouchableOpacity 
                  style={[
                    styles.locationButton,
                    loadingLocation === 'origin' && styles.locationButtonLoading
                  ]}
                  onPress={() => handleUseCurrentLocation('origin')}
                  disabled={loadingLocation === 'origin'}
                >
                  {loadingLocation === 'origin' ? (
                    <ActivityIndicator size="small" color={Colors.primary[500]} />
                  ) : (
                    <Navigation size={16} color={Colors.primary[500]} />
                  )}
                  <Text style={styles.locationButtonText}>
                    {loadingLocation === 'origin' ? 'Obteniendo ubicación...' : 'Usar ubicación actual'}
                  </Text>
                </TouchableOpacity>
              </View>
              
              <View style={styles.separator} />
              
              <View style={styles.locationInputContainer}>
                <View style={styles.locationInputHeader}>
                  <MapPin size={20} color={Colors.error[500]} />
                  <Text style={styles.locationLabel}>Destino</Text>
                </View>
                <DestinationSearchInput
                  onSelectDestination={handleSelectDestination}
                  placeholder="Escribe tu destino..."
                  initialValue={destinationInput}
                  userLocation={userLocation}
                />
                <TouchableOpacity 
                  style={[
                    styles.locationButton,
                    loadingLocation === 'destination' && styles.locationButtonLoading
                  ]}
                  onPress={() => handleUseCurrentLocation('destination')}
                  disabled={loadingLocation === 'destination'}
                >
                  {loadingLocation === 'destination' ? (
                    <ActivityIndicator size="small" color={Colors.primary[500]} />
                  ) : (
                    <Navigation size={16} color={Colors.primary[500]} />
                  )}
                  <Text style={styles.locationButtonText}>
                    {loadingLocation === 'destination' ? 'Obteniendo ubicación...' : 'Usar ubicación actual'}
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tipo de Vehículo</Text>
          <View style={styles.vehicleOptions}>
            {transportModes.map((mode) => (
              <TouchableOpacity
                key={mode.id}
                style={[
                  styles.vehicleCard,
                  selectedVehicleType === mode.id && styles.vehicleCardSelected
                ]}
                onPress={() => setSelectedVehicleType(mode.id)}
              >
                <Text style={styles.vehicleIcon}>{mode.icon}</Text>
                <Text style={[
                  styles.vehicleName,
                  selectedVehicleType === mode.id && styles.vehicleNameSelected
                ]}>
                  {mode.name}
                </Text>
                <Text style={styles.vehicleCapacity}>
                  Hasta {mode.capacity} pasajeros
                </Text>
                <Text style={styles.vehicleDescription}>
                  {mode.description}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <TouchableOpacity
            style={styles.frequentRouteOption}
            onPress={() => setSaveAsFrequent(!saveAsFrequent)}
          >
            <View style={[
              styles.checkbox,
              saveAsFrequent && styles.checkboxChecked
            ]}>
              {saveAsFrequent && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <View style={styles.frequentRouteText}>
              <Text style={styles.frequentRouteTitle}>
                Guardar como ruta frecuente
              </Text>
              <Text style={styles.frequentRouteSubtitle}>
                Podrás acceder rápidamente a esta ruta en el futuro
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.searchSection}>
          <CommuteButton
            title={isSearching ? 'Buscando...' : 'Buscar Viaje'}
            subtitle={origin && destination ? 'Encontrar conductor disponible' : 'Completa origen y destino'}
            icon={<Search size={20} color="white" />}
            onPress={handleSearchTrip}
            disabled={!origin || !destination || isSearching}
            loading={isSearching}
            variant="primary"
            size="large"
          />
        </View>
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
  section: {
    padding: Spacing[5],
    backgroundColor: 'white',
    marginBottom: Spacing[3],
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing[5],
  },
  sectionTitle: {
    ...Typography.textStyles.h5,
    color: Colors.neutral[800],
    fontWeight: Typography.fontWeight.bold,
  },
  multiStopToggle: {
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[2],
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primary[50],
    borderWidth: 1,
    borderColor: Colors.primary[300],
  },
  multiStopToggleText: {
    ...Typography.textStyles.bodySmall,
    color: Colors.primary[600],
    fontWeight: Typography.fontWeight.semibold,
    fontSize: 13,
  },
  locationInputContainer: {
    marginBottom: Spacing[4],
  },
  locationInputHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
    marginBottom: Spacing[3],
  },
  locationLabel: {
    ...Typography.textStyles.h6,
    color: Colors.neutral[700],
    fontWeight: Typography.fontWeight.semibold,
  },
  inputWrapper: {
    position: 'relative',
    marginBottom: Spacing[3],
  },
  addressInput: {
    backgroundColor: Colors.neutral[50],
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.neutral[300],
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[4],
    paddingRight: Spacing[12],
    ...Typography.textStyles.body,
    color: Colors.neutral[800],
    fontSize: 15,
    lineHeight: 22,
  },
  searchIndicator: {
    position: 'absolute',
    right: Spacing[10],
    top: Spacing[4],
  },
  clearButton: {
    position: 'absolute',
    right: Spacing[4],
    top: Spacing[4],
    padding: Spacing[2],
  },
  suggestionsContainer: {
    backgroundColor: 'white',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.neutral[300],
    marginBottom: Spacing[3],
    maxHeight: 300,
    ...Shadows.md,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing[4],
    gap: Spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[100],
    backgroundColor: 'white',
  },
  suggestionText: {
    ...Typography.textStyles.body,
    color: Colors.neutral[900],
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  locationButton: {
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
  locationButtonLoading: {
    opacity: 0.6,
  },
  locationButtonText: {
    ...Typography.textStyles.bodySmall,
    color: Colors.primary[600],
    fontWeight: Typography.fontWeight.medium,
    fontSize: 14,
  },
  separator: {
    height: 1,
    backgroundColor: Colors.neutral[200],
    marginVertical: Spacing[5],
  },
  vehicleOptions: {
    gap: Spacing[4],
  },
  vehicleCard: {
    backgroundColor: Colors.neutral[50],
    borderRadius: BorderRadius.lg,
    padding: Spacing[5],
    borderWidth: 2,
    borderColor: Colors.neutral[200],
    ...Shadows.sm,
  },
  vehicleCardSelected: {
    borderColor: Colors.primary[500],
    backgroundColor: Colors.primary[50],
  },
  vehicleIcon: {
    fontSize: 32,
    marginBottom: Spacing[3],
  },
  vehicleName: {
    ...Typography.textStyles.h6,
    color: Colors.neutral[800],
    marginBottom: Spacing[2],
    fontWeight: Typography.fontWeight.bold,
  },
  vehicleNameSelected: {
    color: Colors.primary[700],
  },
  vehicleCapacity: {
    ...Typography.textStyles.bodySmall,
    color: Colors.neutral[600],
    marginBottom: Spacing[2],
    fontSize: 13,
  },
  vehicleDescription: {
    ...Typography.textStyles.caption,
    color: Colors.neutral[500],
    fontSize: 12,
    lineHeight: 18,
  },
  frequentRouteOption: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing[3],
    padding: Spacing[4],
    backgroundColor: Colors.neutral[50],
    borderRadius: BorderRadius.md,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.neutral[300],
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: Colors.primary[500],
    borderColor: Colors.primary[500],
  },
  checkmark: {
    color: 'white',
    fontSize: 14,
    fontWeight: Typography.fontWeight.bold,
  },
  frequentRouteText: {
    flex: 1,
  },
  frequentRouteTitle: {
    ...Typography.textStyles.body,
    color: Colors.neutral[800],
    fontWeight: Typography.fontWeight.semibold,
    marginBottom: Spacing[1],
    fontSize: 15,
  },
  frequentRouteSubtitle: {
    ...Typography.textStyles.caption,
    color: Colors.neutral[600],
    fontSize: 13,
    lineHeight: 18,
  },
  searchSection: {
    padding: Spacing[5],
    backgroundColor: 'white',
    marginBottom: Spacing[3],
  },
});
