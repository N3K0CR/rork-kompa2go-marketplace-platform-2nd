import { useState, useEffect, useCallback, useMemo } from 'react';
import createContextHook from '@nkzw/create-context-hook';
import { Platform } from 'react-native';
import * as Location from 'expo-location';

export interface LocationCoordinates {
  latitude: number;
  longitude: number;
}

export interface Provider {
  id: string;
  name: string;
  fullName: string;
  service: string;
  rating: number;
  reviews: number;
  location: string;
  coordinates: LocationCoordinates;
  price: string;
  image: string;
  distance?: number;
  isSpecialProvider?: boolean;
}

export interface SearchRadius {
  current: number;
  attempted: number[];
  maxRadius: number;
}

interface LocationSearchState {
  userLocation: LocationCoordinates | null;
  locationPermission: boolean;
  isLoadingLocation: boolean;
  searchRadius: SearchRadius;
  foundProviders: Provider[];
  isSearching: boolean;
  searchError: string | null;
  showExtendRadiusDialog: boolean;
}

const mockProviders: Provider[] = [
  {
    id: '999',
    name: 'Sakura Beauty Salon',
    fullName: 'Sakura Beauty Salon',
    service: 'Servicios de Belleza',
    rating: 5.0,
    reviews: 250,
    location: 'San José Centro',
    coordinates: { latitude: 9.9281, longitude: -84.0907 },
    price: '₡15,000/sesión',
    image: '🌸',
    isSpecialProvider: true,
  },
  {
    id: '1',
    name: 'María',
    fullName: 'María González',
    service: 'Limpieza Residencial',
    rating: 4.9,
    reviews: 127,
    location: 'San José Centro',
    coordinates: { latitude: 9.9281, longitude: -84.0907 },
    price: '₡8,000/hora',
    image: '👩‍💼',
    isSpecialProvider: false,
  },
  {
    id: '2',
    name: 'Carlos',
    fullName: 'Carlos Rodríguez',
    service: 'Plomería',
    rating: 4.8,
    reviews: 89,
    location: 'Escazú',
    coordinates: { latitude: 9.9189, longitude: -84.1400 },
    price: '₡12,000/visita',
    image: '👨‍🔧',
    isSpecialProvider: false,
  },
  {
    id: '3',
    name: 'Ana',
    fullName: 'Ana Jiménez',
    service: 'Jardinería',
    rating: 4.7,
    reviews: 64,
    location: 'Cartago',
    coordinates: { latitude: 9.8644, longitude: -83.9194 },
    price: '₡15,000/día',
    image: '👩‍🌾',
    isSpecialProvider: false,
  },
  {
    id: '4',
    name: 'Luis',
    fullName: 'Luis Morales',
    service: 'Electricidad',
    rating: 4.6,
    reviews: 45,
    location: 'Heredia',
    coordinates: { latitude: 9.9989, longitude: -84.1167 },
    price: '₡10,000/visita',
    image: '👨‍🔧',
    isSpecialProvider: false,
  },
  {
    id: '5',
    name: 'Sofia',
    fullName: 'Sofia Vargas',
    service: 'Belleza',
    rating: 4.9,
    reviews: 156,
    location: 'Alajuela',
    coordinates: { latitude: 10.0162, longitude: -84.2119 },
    price: '₡20,000/sesión',
    image: '👩‍💄',
    isSpecialProvider: false,
  },
  {
    id: '6',
    name: 'Roberto',
    fullName: 'Roberto Fernández',
    service: 'Carpintería',
    rating: 4.5,
    reviews: 78,
    location: 'Puntarenas',
    coordinates: { latitude: 9.9761, longitude: -84.8369 },
    price: '₡25,000/proyecto',
    image: '👨‍🔨',
    isSpecialProvider: false,
  },
];

const SEARCH_RADII = [5, 10, 15]; // km
const MAX_EXTENDED_RADIUS = 50; // km

// Calculate distance between two coordinates using Haversine formula
function calculateDistance(coord1: LocationCoordinates, coord2: LocationCoordinates): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (coord2.latitude - coord1.latitude) * Math.PI / 180;
  const dLon = (coord2.longitude - coord1.longitude) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(coord1.latitude * Math.PI / 180) * Math.cos(coord2.latitude * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

export const [LocationSearchProvider, useLocationSearch] = createContextHook(() => {
  const [state, setState] = useState<LocationSearchState>({
    userLocation: null,
    locationPermission: false,
    isLoadingLocation: false,
    searchRadius: {
      current: SEARCH_RADII[0],
      attempted: [],
      maxRadius: SEARCH_RADII[SEARCH_RADII.length - 1]
    },
    foundProviders: [],
    isSearching: false,
    searchError: null,
    showExtendRadiusDialog: false
  });

  // Request location permission and get current location
  const requestLocationPermission = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoadingLocation: true, searchError: null }));
      
      if (Platform.OS === 'web') {
        // Web geolocation API
        if (!navigator.geolocation) {
          throw new Error('Geolocation is not supported by this browser');
        }
        
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 60000
          });
        });
        
        const userLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        };
        
        setState(prev => ({
          ...prev,
          userLocation,
          locationPermission: true,
          isLoadingLocation: false
        }));
        
        console.log('Location obtained (web):', userLocation);
        return userLocation;
        
      } else {
        // Mobile expo-location
        const { status } = await Location.requestForegroundPermissionsAsync();
        
        if (status !== 'granted') {
          setState(prev => ({
            ...prev,
            locationPermission: false,
            isLoadingLocation: false,
            searchError: 'Permiso de ubicación denegado'
          }));
          return null;
        }
        
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced
        });
        
        const userLocation = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude
        };
        
        setState(prev => ({
          ...prev,
          userLocation,
          locationPermission: true,
          isLoadingLocation: false
        }));
        
        console.log('Location obtained (mobile):', userLocation);
        return userLocation;
      }
      
    } catch (error) {
      console.error('Error getting location:', error);
      setState(prev => ({
        ...prev,
        locationPermission: false,
        isLoadingLocation: false,
        searchError: 'No se pudo obtener la ubicación'
      }));
      return null;
    }
  }, []);

  // Search providers within radius
  const searchProvidersInRadius = useCallback(async (radius: number, userLoc?: LocationCoordinates) => {
    const location = userLoc || state.userLocation;
    if (!location) return [];
    
    console.log(`Searching providers within ${radius}km of`, location);
    
    // Calculate distances and filter by radius
    const providersWithDistance = mockProviders.map(provider => {
      const distance = calculateDistance(location, provider.coordinates);
      return {
        ...provider,
        distance
      };
    }).filter(provider => provider.distance <= radius)
      .sort((a, b) => {
        // Always put Sakura Beauty Salon first
        if (a.isSpecialProvider || a.id === '999') return -1;
        if (b.isSpecialProvider || b.id === '999') return 1;
        return a.distance - b.distance;
      });
    
    console.log(`Found ${providersWithDistance.length} providers within ${radius}km`);
    return providersWithDistance;
  }, [state.userLocation]);

  // Main search function with expanding radius
  const searchProviders = useCallback(async (serviceType?: string) => {
    try {
      setState(prev => ({ 
        ...prev, 
        isSearching: true, 
        searchError: null,
        foundProviders: [],
        searchRadius: {
          current: SEARCH_RADII[0],
          attempted: [],
          maxRadius: SEARCH_RADII[SEARCH_RADII.length - 1]
        }
      }));
      
      // Get location if not available
      let userLocation = state.userLocation;
      if (!userLocation) {
        userLocation = await requestLocationPermission();
        if (!userLocation) {
          setState(prev => ({ 
            ...prev, 
            isSearching: false,
            searchError: 'Ubicación requerida para buscar proveedores'
          }));
          return;
        }
      }
      
      // Try each radius progressively
      for (let i = 0; i < SEARCH_RADII.length; i++) {
        const radius = SEARCH_RADII[i];
        console.log(`Attempting search with radius: ${radius}km`);
        
        setState(prev => ({
          ...prev,
          searchRadius: {
            ...prev.searchRadius,
            current: radius,
            attempted: [...prev.searchRadius.attempted, radius]
          }
        }));
        
        const providers = await searchProvidersInRadius(radius, userLocation);
        
        // Filter by service type if specified
        const filteredProviders = serviceType 
          ? providers.filter(p => p.service.toLowerCase().includes(serviceType.toLowerCase()))
          : providers;
        
        if (filteredProviders.length > 0) {
          setState(prev => ({
            ...prev,
            foundProviders: filteredProviders,
            isSearching: false
          }));
          return;
        }
        
        // Small delay between radius attempts
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      // No providers found in standard radii
      setState(prev => ({
        ...prev,
        isSearching: false,
        showExtendRadiusDialog: true
      }));
      
    } catch (error) {
      console.error('Error searching providers:', error);
      setState(prev => ({
        ...prev,
        isSearching: false,
        searchError: 'Error al buscar proveedores'
      }));
    }
  }, [state.userLocation, requestLocationPermission, searchProvidersInRadius]);

  // Extend search radius beyond standard limits
  const extendSearchRadius = useCallback(async (newRadius: number) => {
    try {
      setState(prev => ({ 
        ...prev, 
        isSearching: true,
        showExtendRadiusDialog: false,
        searchRadius: {
          ...prev.searchRadius,
          current: newRadius,
          maxRadius: newRadius
        }
      }));
      
      if (!state.userLocation) return;
      
      const providers = await searchProvidersInRadius(newRadius);
      
      setState(prev => ({
        ...prev,
        foundProviders: providers,
        isSearching: false
      }));
      
      if (providers.length === 0) {
        setState(prev => ({
          ...prev,
          searchError: `No se encontraron proveedores en un radio de ${newRadius}km`
        }));
      }
      
    } catch (error) {
      console.error('Error extending search radius:', error);
      setState(prev => ({
        ...prev,
        isSearching: false,
        searchError: 'Error al extender la búsqueda'
      }));
    }
  }, [state.userLocation, searchProvidersInRadius]);

  // Dismiss extend radius dialog
  const dismissExtendDialog = useCallback(() => {
    setState(prev => ({ ...prev, showExtendRadiusDialog: false }));
  }, []);

  // Reset search
  const resetSearch = useCallback(() => {
    setState(prev => ({
      ...prev,
      foundProviders: [],
      searchError: null,
      showExtendRadiusDialog: false,
      searchRadius: {
        current: SEARCH_RADII[0],
        attempted: [],
        maxRadius: SEARCH_RADII[SEARCH_RADII.length - 1]
      }
    }));
  }, []);

  return useMemo(() => ({
    // State
    userLocation: state.userLocation,
    locationPermission: state.locationPermission,
    isLoadingLocation: state.isLoadingLocation,
    searchRadius: state.searchRadius,
    foundProviders: state.foundProviders,
    isSearching: state.isSearching,
    searchError: state.searchError,
    showExtendRadiusDialog: state.showExtendRadiusDialog,
    
    // Constants
    availableRadii: SEARCH_RADII,
    maxExtendedRadius: MAX_EXTENDED_RADIUS,
    
    // Actions
    requestLocationPermission,
    searchProviders,
    extendSearchRadius,
    dismissExtendDialog,
    resetSearch
  }), [
    state.userLocation,
    state.locationPermission,
    state.isLoadingLocation,
    state.searchRadius,
    state.foundProviders,
    state.isSearching,
    state.searchError,
    state.showExtendRadiusDialog,
    requestLocationPermission,
    searchProviders,
    extendSearchRadius,
    dismissExtendDialog,
    resetSearch
  ]);
});