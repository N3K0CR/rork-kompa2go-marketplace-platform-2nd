import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator, Platform, FlatList } from 'react-native';
import { Stack, router } from 'expo-router';
import { Search, MapPin, Navigation, X } from 'lucide-react-native';
import { useCommute } from '@/hooks/useCommute';
import { CommuteButton } from '@/components/commute';
import { Colors, Spacing, BorderRadius, Shadows, Typography } from '@/context-package/design-system';
import * as Location from 'expo-location';

interface AddressSuggestion {
  place_id: string;
  display_name: string;
  lat: string;
  lon: string;
  address?: {
    road?: string;
    house_number?: string;
    city?: string;
    state?: string;
    country?: string;
  };
}

interface LocationPoint {
  latitude: number;
  longitude: number;
  address: string;
  name?: string;
}

export default function CommuteSearch() {
  const { transportModes, createRoute, startTrip } = useCommute();

  const [origin, setOrigin] = useState<LocationPoint | null>(null);
  const [destination, setDestination] = useState<LocationPoint | null>(null);
  const [originInput, setOriginInput] = useState('');
  const [destinationInput, setDestinationInput] = useState('');
  const [selectedVehicleType, setSelectedVehicleType] = useState<string>('kommute-4');
  const [isSearching, setIsSearching] = useState(false);
  const [loadingLocation, setLoadingLocation] = useState<'origin' | 'destination' | null>(null);
  const [originSuggestions, setOriginSuggestions] = useState<AddressSuggestion[]>([]);
  const [destinationSuggestions, setDestinationSuggestions] = useState<AddressSuggestion[]>([]);
  const [showOriginSuggestions, setShowOriginSuggestions] = useState(false);
  const [showDestinationSuggestions, setShowDestinationSuggestions] = useState(false);
  const [searchingAddress, setSearchingAddress] = useState<'origin' | 'destination' | null>(null);
  const [saveAsFrequent, setSaveAsFrequent] = useState(false);

  console.log('🔍 CommuteSearch: Rendered');

  const searchAddress = async (query: string, type: 'origin' | 'destination') => {
    if (!query || query.length < 3) {
      if (type === 'origin') {
        setOriginSuggestions([]);
        setShowOriginSuggestions(false);
      } else {
        setDestinationSuggestions([]);
        setShowDestinationSuggestions(false);
      }
      return;
    }

    try {
      setSearchingAddress(type);
      if (type === 'origin') {
        setShowOriginSuggestions(true);
      } else {
        setShowDestinationSuggestions(true);
      }
      
      console.log('🔍 Searching address:', query);
      
      // Agregar Costa Rica al query para mejorar resultados
      const searchQuery = query.includes('Costa Rica') ? query : `${query}, Costa Rica`;
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=5&addressdetails=1&countrycodes=cr`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Kompa2Go/1.0', // Nominatim requiere User-Agent
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('✅ Address search results:', data.length, 'results');
      
      if (type === 'origin') {
        setOriginSuggestions(data);
      } else {
        setDestinationSuggestions(data);
      }
    } catch (error) {
      console.error('❌ Error searching address:', error);
      Alert.alert(
        'Error de búsqueda',
        'No se pudo buscar la dirección. Por favor verifica tu conexión a internet e intenta de nuevo.'
      );
      if (type === 'origin') {
        setOriginSuggestions([]);
      } else {
        setDestinationSuggestions([]);
      }
    } finally {
      setSearchingAddress(null);
    }
  };

  const selectAddressSuggestion = (suggestion: AddressSuggestion, type: 'origin' | 'destination') => {
    const location: LocationPoint = {
      latitude: parseFloat(suggestion.lat),
      longitude: parseFloat(suggestion.lon),
      address: suggestion.display_name,
      name: suggestion.address?.road || suggestion.address?.city || undefined
    };
    
    if (type === 'origin') {
      setOrigin(location);
      setOriginInput(suggestion.display_name);
      setShowOriginSuggestions(false);
      setOriginSuggestions([]);
    } else {
      setDestination(location);
      setDestinationInput(suggestion.display_name);
      setShowDestinationSuggestions(false);
      setDestinationSuggestions([]);
    }
    
    console.log('✅ Address selected:', suggestion.display_name);
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
              const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
                {
                  method: 'GET',
                  headers: {
                    'Accept': 'application/json',
                    'User-Agent': 'Kompa2Go/1.0',
                  },
                }
              );
              
              if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
              }
              
              const data = await response.json();
              const address = data.display_name || `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
              
              const location: LocationPoint = {
                latitude,
                longitude,
                address,
                name: data.name || data.address?.road || undefined
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
              Alert.alert(
                'Error',
                'No se pudo obtener la dirección. Se usarán las coordenadas.'
              );
              const location: LocationPoint = {
                latitude,
                longitude,
                address: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
              };
              
              if (type === 'origin') {
                setOrigin(location);
                setOriginInput(location.address);
              } else {
                setDestination(location);
                setDestinationInput(location.address);
              }
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
        
        const [geocode] = await Location.reverseGeocodeAsync({
          latitude,
          longitude,
        });

        const address = geocode
          ? `${geocode.street || ''} ${geocode.streetNumber || ''}, ${geocode.city || ''}, ${geocode.region || ''}`.trim()
          : `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;

        const locationPoint: LocationPoint = {
          latitude,
          longitude,
          address,
          name: geocode?.name || geocode?.street || undefined
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

  const renderLocationInput = (
    type: 'origin' | 'destination',
    value: string,
    onChangeText: (text: string) => void,
    suggestions: AddressSuggestion[],
    showSuggestions: boolean,
    placeholder: string
  ) => (
    <View style={styles.locationInputContainer}>
      <View style={styles.locationInputHeader}>
        <MapPin size={20} color={type === 'origin' ? Colors.success[500] : Colors.error[500]} />
        <Text style={styles.locationLabel}>
          {type === 'origin' ? 'Origen' : 'Destino'}
        </Text>
      </View>
      
      <View style={styles.inputWrapper}>
        <TextInput
          style={styles.addressInput}
          placeholder={placeholder}
          value={value}
          onChangeText={(text) => {
            onChangeText(text);
            searchAddress(text, type);
          }}
          onFocus={() => {
            if (value && value.length >= 3) {
              searchAddress(value, type);
            }
          }}
        />
        {searchingAddress === type && (
          <ActivityIndicator 
            size="small" 
            color={Colors.primary[500]} 
            style={styles.searchIndicator}
          />
        )}
        {value.length > 0 && (
          <TouchableOpacity
            style={styles.clearButton}
            onPress={() => {
              onChangeText('');
              if (type === 'origin') {
                setOrigin(null);
                setOriginSuggestions([]);
                setShowOriginSuggestions(false);
              } else {
                setDestination(null);
                setDestinationSuggestions([]);
                setShowDestinationSuggestions(false);
              }
            }}
          >
            <X size={16} color={Colors.neutral[400]} />
          </TouchableOpacity>
        )}
      </View>
      
      {showSuggestions && suggestions.length > 0 && (
        <View style={styles.suggestionsContainer}>
          <FlatList
            data={suggestions}
            keyExtractor={(item) => item.place_id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.suggestionItem}
                onPress={() => selectAddressSuggestion(item, type)}
              >
                <MapPin size={16} color={Colors.neutral[500]} />
                <Text style={styles.suggestionText} numberOfLines={2}>
                  {item.display_name}
                </Text>
              </TouchableOpacity>
            )}
            style={styles.suggestionsList}
            scrollEnabled={false}
          />
        </View>
      )}
      
      <TouchableOpacity 
        style={[
          styles.locationButton,
          loadingLocation === type && styles.locationButtonLoading
        ]}
        onPress={() => handleUseCurrentLocation(type)}
        disabled={loadingLocation === type}
      >
        {loadingLocation === type ? (
          <ActivityIndicator size="small" color={Colors.primary[500]} />
        ) : (
          <Navigation size={16} color={Colors.primary[500]} />
        )}
        <Text style={styles.locationButtonText}>
          {loadingLocation === type ? 'Obteniendo ubicación...' : 'Usar ubicación actual'}
        </Text>
      </TouchableOpacity>
    </View>
  );

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
          <Text style={styles.sectionTitle}>¿A dónde vas?</Text>
          
          {renderLocationInput(
            'origin',
            originInput,
            setOriginInput,
            originSuggestions,
            showOriginSuggestions,
            'Escribe tu punto de partida...'
          )}
          
          <View style={styles.separator} />
          
          {renderLocationInput(
            'destination',
            destinationInput,
            setDestinationInput,
            destinationSuggestions,
            showDestinationSuggestions,
            'Escribe tu destino...'
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
  sectionTitle: {
    ...Typography.textStyles.h5,
    color: Colors.neutral[800],
    marginBottom: Spacing[5],
    fontWeight: Typography.fontWeight.bold,
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
    maxHeight: 200,
    ...Shadows.md,
  },
  suggestionsList: {
    maxHeight: 200,
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
