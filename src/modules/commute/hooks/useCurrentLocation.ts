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
              console.log('✅ Web geolocation success:', {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                accuracy: position.coords.accuracy
              });

              const { latitude, longitude } = position.coords;
              
              try {
                console.log('🔍 Attempting reverse geocoding...');
                const [geocode] = await Location.reverseGeocodeAsync({
                  latitude,
                  longitude,
                });

                console.log('✅ Reverse geocoding result:', geocode);

                if (geocode) {
                  const parts = [];
                  if (geocode.street) parts.push(geocode.street);
                  if (geocode.streetNumber) parts.push(geocode.streetNumber);
                  if (geocode.city) parts.push(geocode.city);
                  
                  const address = parts.length > 0 ? parts.join(', ') : 'Mi ubicación actual';
                  console.log('📍 Final address:', address);
                  setData(address);
                } else {
                  console.log('⚠️ No geocoding result, using default');
                  setData('Mi ubicación actual');
                }
              } catch (geocodeError) {
                console.error('❌ Geocoding error:', {
                  error: geocodeError,
                  message: geocodeError instanceof Error ? geocodeError.message : String(geocodeError),
                  code: (geocodeError as any)?.code,
                  stack: geocodeError instanceof Error ? geocodeError.stack : undefined
                });
                setData('Mi ubicación actual');
              }

              setIsLoading(false);
            },
            (err) => {
              console.error('❌ Web Geolocation error:', {
                code: err.code,
                message: err.message,
                PERMISSION_DENIED: err.code === 1,
                POSITION_UNAVAILABLE: err.code === 2,
                TIMEOUT: err.code === 3
              });
              setIsError(true);
              setError(new Error(`Geolocation error (code ${err.code}): ${err.message}`));
              setIsLoading(false);
            },
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
          );
        } else {
          console.log('📱 Requesting location permissions (mobile)...');
          
          const { status } = await Location.requestForegroundPermissionsAsync();
          console.log('📱 Permission status:', status);
          
          if (status !== 'granted') {
            const errorMsg = 'Permisos de ubicación denegados';
            console.error('❌', errorMsg);
            setIsError(true);
            setError(new Error(errorMsg));
            setIsLoading(false);
            return;
          }

          console.log('📍 Getting current position (mobile)...');
          const location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });

          console.log('✅ Current position:', {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            accuracy: location.coords.accuracy
          });

          const { latitude, longitude } = location.coords;
          
          console.log('🔍 Attempting reverse geocoding (mobile)...');
          const [geocode] = await Location.reverseGeocodeAsync({
            latitude,
            longitude,
          });

          console.log('✅ Reverse geocoding result (mobile):', geocode);

          if (geocode) {
            const parts = [];
            if (geocode.street) parts.push(geocode.street);
            if (geocode.streetNumber) parts.push(geocode.streetNumber);
            if (geocode.city) parts.push(geocode.city);
            if (geocode.district) parts.push(geocode.district);
            
            const address = parts.length > 0 ? parts.join(', ') : 'Mi ubicación actual';
            console.log('📍 Final address (mobile):', address);
            setData(address);
          } else {
            console.log('⚠️ No geocoding result (mobile), using default');
            setData('Mi ubicación actual');
          }

          setIsLoading(false);
        }
      } catch (err) {
        console.error('❌ Error getting location (catch block):', {
          error: err,
          message: err instanceof Error ? err.message : String(err),
          code: (err as any)?.code,
          name: err instanceof Error ? err.name : undefined,
          stack: err instanceof Error ? err.stack : undefined,
          stringified: JSON.stringify(err, null, 2)
        });
        setIsError(true);
        setError(err instanceof Error ? err : new Error(String(err)));
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
