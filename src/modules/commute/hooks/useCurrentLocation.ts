import { useState, useEffect } from 'react';
import { Platform } from 'react-native';
import * as Location from 'expo-location';

interface UseCurrentLocationResult {
  data: string | null;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
}

export const useCurrentLocation = (): UseCurrentLocationResult => {
  const [data, setData] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const getCurrentLocation = async () => {
      try {
        setIsLoading(true);
        setIsError(false);
        setError(null);

        if (Platform.OS === 'web') {
          if (!navigator.geolocation) {
            throw new Error('Geolocation is not supported');
          }

          navigator.geolocation.getCurrentPosition(
            async (position) => {
              const { latitude, longitude } = position.coords;
              
              try {
                const [geocode] = await Location.reverseGeocodeAsync({
                  latitude,
                  longitude,
                });

                if (geocode) {
                  const parts = [];
                  if (geocode.street) parts.push(geocode.street);
                  if (geocode.streetNumber) parts.push(geocode.streetNumber);
                  if (geocode.city) parts.push(geocode.city);
                  
                  const address = parts.length > 0 ? parts.join(', ') : 'Mi ubicación actual';
                  setData(address);
                } else {
                  setData('Mi ubicación actual');
                }
              } catch (geocodeError) {
                console.error('Geocoding error:', geocodeError);
                setData('Mi ubicación actual');
              }

              setIsLoading(false);
            },
            (err) => {
              console.error('Geolocation error:', err);
              setIsError(true);
              setError(new Error(err.message));
              setIsLoading(false);
            },
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
          );
        } else {
          const { status } = await Location.requestForegroundPermissionsAsync();
          
          if (status !== 'granted') {
            setIsError(true);
            setError(new Error('Location permission denied'));
            setIsLoading(false);
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

          if (geocode) {
            const parts = [];
            if (geocode.street) parts.push(geocode.street);
            if (geocode.streetNumber) parts.push(geocode.streetNumber);
            if (geocode.city) parts.push(geocode.city);
            if (geocode.district) parts.push(geocode.district);
            
            const address = parts.length > 0 ? parts.join(', ') : 'Mi ubicación actual';
            setData(address);
          } else {
            setData('Mi ubicación actual');
          }

          setIsLoading(false);
        }
      } catch (err) {
        console.error('Error getting location:', err);
        setIsError(true);
        setError(err instanceof Error ? err : new Error('Unknown error'));
        setIsLoading(false);
      }
    };

    getCurrentLocation();
  }, []);

  return {
    data,
    isLoading,
    isError,
    error,
  };
};
