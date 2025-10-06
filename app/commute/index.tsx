import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, Platform, FlatList, Alert } from 'react-native';
import { Stack, router } from 'expo-router';
import { MapPin, Navigation, Search } from 'lucide-react-native';
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

  const handleSelectDestination = (suggestion: AddressSuggestion) => {
    if (!userLocation) {
      Alert.alert('Error', 'No se pudo obtener tu ubicación actual');
      return;
    }

    setDestination(suggestion.display_name);
    setSuggestions([]);

    router.push({
      pathname: '/commute/vehicle-selection',
      params: {
        originLat: userLocation.latitude.toString(),
        originLon: userLocation.longitude.toString(),
        originAddress: currentAddress,
        destLat: suggestion.lat,
        destLon: suggestion.lon,
        destAddress: suggestion.display_name,
      },
    });
  };

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
          />
          {searching && (
            <ActivityIndicator size="small" color="#6b9e47" style={styles.searchingIndicator} />
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fafcf8',
  },
  mapBackground: {
    flex: 1,
    backgroundColor: '#e8f5e9',
  },
  mapGradient: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  searchContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
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
    fontSize: 16,
    color: '#131c0d',
    fontWeight: '700' as const,
  },
  suggestionSecondaryText: {
    fontSize: 13,
    color: '#6b9e47',
    fontWeight: '500' as const,
  },
});
