import { useState, useCallback, useEffect } from 'react';
import { PlacesService, PlaceResult } from '../services/places-service';

interface Location {
  latitude: number;
  longitude: number;
}

interface UseDestinationSearchResult {
  results: PlaceResult[];
  loading: boolean;
  error: string | null;
  search: (query: string) => Promise<void>;
  clearResults: () => void;
  clearError: () => void;
}

export function useDestinationSearch(userLocation?: Location): UseDestinationSearchResult {
  const [results, setResults] = useState<PlaceResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async (query: string) => {
    setError(null);

    if (!query || query.trim().length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const searchResults = await PlacesService.searchDestination({
        query: query.trim(),
        location: userLocation,
      });

      setResults(searchResults);
      
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('Error en búsqueda de destino:', err);
        setError(err.message || 'Error al buscar destino');
        setResults([]);
      }
      
    } finally {
      setLoading(false);
    }
  }, [userLocation]);

  const clearResults = useCallback(() => {
    setResults([]);
    setError(null);
    PlacesService.cancelSearch();
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  useEffect(() => {
    return () => {
      PlacesService.cancelSearch();
    };
  }, []);

  return {
    results,
    loading,
    error,
    search,
    clearResults,
    clearError,
  };
}
