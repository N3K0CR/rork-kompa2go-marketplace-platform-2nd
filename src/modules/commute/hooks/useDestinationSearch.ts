import { useState, useCallback, useEffect, useRef } from 'react';
import { trpcClient } from '@/lib/trpc';

interface Location {
  latitude: number;
  longitude: number;
}

export interface PlaceResult {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
  types: string[];
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
  const abortControllerRef = useRef<AbortController | null>(null);

  const search = useCallback(async (query: string) => {
    setError(null);

    if (!query || query.trim().length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    setLoading(true);

    try {
      console.log('🔍 Frontend: Buscando destino vía tRPC:', query);

      const response = await trpcClient.commute.searchPlaces.query({
        query: query.trim(),
        location: userLocation,
      });

      console.log('✅ Frontend: Resultados recibidos:', response.predictions.length);

      setResults(response.predictions);
      
    } catch (err: any) {
      if (err.name !== 'AbortError' && !err.message?.includes('aborted')) {
        console.error('❌ Frontend: Error en búsqueda de destino:', err);
        setError(err.message || 'Error al buscar destino');
        setResults([]);
      }
      
    } finally {
      setLoading(false);
      abortControllerRef.current = null;
    }
  }, [userLocation]);

  const clearResults = useCallback(() => {
    setResults([]);
    setError(null);
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
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
