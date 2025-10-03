import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, Platform, FlatList, Alert } from 'react-native';
import { Stack, router } from 'expo-router';
import { MapPin, Navigation, Search } from 'lucide-react-native';
import { useCommute } from '@/src/modules/commute/context/CommuteContext';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '@/context-package/design-system';
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
              const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
              );
              const data = await response.json();
              const address = data.address?.road 
                ? `${data.address.road}, ${data.address.city || ''}` 
                : data.display_name?.split(',').slice(0, 2).join(',');
              setCurrentAddress(address || 'Ubicación actual');
            } catch (error) {
              console.error('Error getting address:', error);
              setCurrentAddress(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
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
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1&countrycodes=cr`
      );
      const data = await response.json();
      setSuggestions(data);
    } catch (error) {
      console.error('Error searching destination:', error);
      setSuggestions([]);
    } finally {
      setSearching(false);
    }
  }, []);

  const handleDestinationChange = (text: string) => {
    setDestination(text);
    searchDestination(text);
  };

  const handleSelectDestination = async (suggestion: AddressSuggestion) => {
    if (!userLocation) {
      Alert.alert('Error', 'No se pudo obtener tu ubicación actual');
      return;
    }

    const userId = firebaseUser && typeof firebaseUser === 'object' && 'uid' in firebaseUser 
      ? (firebaseUser as { uid: string }).uid 
      : 'demo_user';

    setDestination(suggestion.display_name);
    setSuggestions([]);

    try {
      const routeData = {
        userId,
        name: `Viaje a ${suggestion.address?.road || suggestion.address?.city || 'destino'}`,
        points: [
          {
            id: `origin_${Date.now()}`,
            latitude: userLocation.latitude,
            longitude: userLocation.longitude,
            address: currentAddress,
            type: 'origin' as const,
          },
          {
            id: `dest_${Date.now()}`,
            latitude: parseFloat(suggestion.lat),
            longitude: parseFloat(suggestion.lon),
            address: suggestion.display_name,
            type: 'destination' as const,
          },
        ],
        transportModes: transportModes.slice(0, 1),
        status: 'planned' as const,
        distance: 0,
        duration: 0,
        estimatedCost: 0,
        carbonFootprint: 0,
        isRecurring: false,
      };

      const newRoute = await createRoute(routeData);
      await startTrip(newRoute.id);
      
      Alert.alert(
        'Viaje Solicitado',
        'Buscando conductores disponibles cerca de ti...',
        [
          {
            text: 'Ver Viaje',
            onPress: () => router.push('/commute/search'),
          },
        ]
      );
    } catch (error) {
      console.error('Error creating trip:', error);
      Alert.alert('Error', 'No se pudo crear el viaje. Intenta nuevamente.');
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{ 
          headerShown: false,
        }} 
      />
      
      <View style={styles.mapPlaceholder}>
        <View style={styles.mapOverlay}>
          <Text style={styles.mapText}>Mapa</Text>
        </View>
      </View>

      <View style={[styles.searchContainer, { paddingTop: insets.top + Spacing[4] }]}>
        <View style={styles.currentLocationCard}>
          <View style={styles.locationIcon}>
            <Navigation size={20} color={Colors.primary[500]} />
          </View>
          <View style={styles.locationInfo}>
            <Text style={styles.locationLabel}>Tu ubicación</Text>
            {loadingLocation ? (
              <ActivityIndicator size="small" color={Colors.primary[500]} />
            ) : (
              <Text style={styles.locationAddress} numberOfLines={1}>{currentAddress}</Text>
            )}
          </View>
        </View>

        <View style={styles.destinationCard}>
          <View style={styles.searchIcon}>
            <Search size={20} color={Colors.neutral[400]} />
          </View>
          <TextInput
            style={styles.destinationInput}
            placeholder="¿A dónde vas?"
            placeholderTextColor={Colors.neutral[400]}
            value={destination}
            onChangeText={handleDestinationChange}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searching && (
            <ActivityIndicator size="small" color={Colors.primary[500]} style={styles.searchingIndicator} />
          )}
        </View>

        {suggestions.length > 0 && (
          <View style={styles.suggestionsContainer}>
            <FlatList
              data={suggestions}
              keyExtractor={(item) => item.place_id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.suggestionItem}
                  onPress={() => handleSelectDestination(item)}
                >
                  <MapPin size={18} color={Colors.neutral[500]} />
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.neutral[100],
  },
  mapPlaceholder: {
    flex: 1,
    backgroundColor: Colors.neutral[200],
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapOverlay: {
    padding: Spacing[6],
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: BorderRadius.lg,
  },
  mapText: {
    ...Typography.textStyles.h4,
    color: Colors.neutral[500],
  },
  searchContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing[4],
    paddingBottom: Spacing[4],
    gap: Spacing[3],
  },
  currentLocationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: BorderRadius.lg,
    padding: Spacing[4],
    gap: Spacing[3],
    ...Shadows.md,
  },
  locationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary[50],
    justifyContent: 'center',
    alignItems: 'center',
  },
  locationInfo: {
    flex: 1,
    gap: Spacing[1],
  },
  locationLabel: {
    ...Typography.textStyles.caption,
    color: Colors.neutral[500],
    fontSize: 12,
    fontWeight: Typography.fontWeight.medium,
  },
  locationAddress: {
    ...Typography.textStyles.body,
    color: Colors.neutral[800],
    fontSize: 15,
    fontWeight: Typography.fontWeight.semibold,
  },
  destinationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: BorderRadius.lg,
    padding: Spacing[4],
    gap: Spacing[3],
    ...Shadows.md,
  },
  searchIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.neutral[50],
    justifyContent: 'center',
    alignItems: 'center',
  },
  destinationInput: {
    flex: 1,
    ...Typography.textStyles.body,
    color: Colors.neutral[800],
    fontSize: 16,
    padding: 0,
  },
  searchingIndicator: {
    marginLeft: Spacing[2],
  },
  suggestionsContainer: {
    backgroundColor: 'white',
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    ...Shadows.lg,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing[4],
    gap: Spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[100],
  },
  suggestionTextContainer: {
    flex: 1,
    gap: Spacing[1],
  },
  suggestionMainText: {
    ...Typography.textStyles.body,
    color: Colors.neutral[800],
    fontSize: 15,
    fontWeight: Typography.fontWeight.semibold,
  },
  suggestionSecondaryText: {
    ...Typography.textStyles.caption,
    color: Colors.neutral[500],
    fontSize: 13,
  },
});
