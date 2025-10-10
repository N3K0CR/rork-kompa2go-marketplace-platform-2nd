import { GOOGLE_MAPS_API_KEY, GOOGLE_MAPS_CONFIG } from '@/lib/google-maps';

const PLACES_API_BASE = 'https://maps.googleapis.com/maps/api/place';
const GEOCODING_API_BASE = 'https://maps.googleapis.com/maps/api/geocode';

export interface PlaceResult {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
  types: string[];
}

export interface PlaceDetails {
  place_id: string;
  formatted_address: string;
  name: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
}

interface SearchDestinationParams {
  query: string;
  location?: { latitude: number; longitude: number };
  radius?: number;
  language?: string;
  timeout?: number;
}

export class PlacesService {
  private static abortController: AbortController | null = null;

  static async searchDestination({
    query,
    location,
    radius = GOOGLE_MAPS_CONFIG.defaultRadius,
    language = GOOGLE_MAPS_CONFIG.defaultLanguage,
    timeout = 10000,
  }: SearchDestinationParams): Promise<PlaceResult[]> {
    
    if (!GOOGLE_MAPS_API_KEY) {
      throw new Error('Google Maps API Key no configurada');
    }

    if (this.abortController) {
      this.abortController.abort();
      console.log('🔄 Cancelando búsqueda anterior...');
    }

    this.abortController = new AbortController();
    
    const timeoutId = setTimeout(() => {
      if (this.abortController) {
        console.log('⏱️ Timeout de búsqueda alcanzado');
        this.abortController.abort();
      }
    }, timeout);

    try {
      if (!query || query.trim().length < 2) {
        clearTimeout(timeoutId);
        return [];
      }

      let url = `${PLACES_API_BASE}/autocomplete/json`;
      url += `?input=${encodeURIComponent(query.trim())}`;
      url += `&key=${GOOGLE_MAPS_API_KEY}`;
      url += `&language=${language}`;
      url += `&components=country:${GOOGLE_MAPS_CONFIG.defaultCountry}`;

      if (location) {
        url += `&location=${location.latitude},${location.longitude}`;
        url += `&radius=${radius}`;
      }

      console.log('🔍 Buscando destino:', query.substring(0, 30));

      const response = await fetch(url, {
        signal: this.abortController.signal,
        headers: {
          'Accept': 'application/json',
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.status === 'ZERO_RESULTS') {
        console.log('ℹ️ No se encontraron resultados para:', query);
        return [];
      }

      if (data.status === 'REQUEST_DENIED') {
        console.error('❌ API Key inválida o sin permisos:', data.error_message);
        throw new Error('Configuración de Google Maps incorrecta');
      }

      if (data.status === 'OVER_QUERY_LIMIT') {
        console.error('❌ Límite de consultas excedido');
        throw new Error('Límite de búsquedas alcanzado. Intenta más tarde.');
      }

      if (data.status === 'INVALID_REQUEST') {
        console.error('❌ Solicitud inválida:', data.error_message);
        throw new Error('Error en la búsqueda');
      }

      if (data.status !== 'OK') {
        console.error('❌ Error de Google Places API:', data.status, data.error_message);
        throw new Error(data.error_message || 'Error al buscar destino');
      }

      const results = data.predictions || [];
      console.log(`✅ Encontrados ${results.length} resultados`);

      return results;

    } catch (error: any) {
      clearTimeout(timeoutId);

      if (error.name === 'AbortError') {
        console.log('🔄 Búsqueda cancelada (nueva búsqueda iniciada)');
        return [];
      }

      if (error.message?.includes('Network request failed') || 
          error.message?.includes('Failed to fetch')) {
        console.error('❌ Error de red:', error.message);
        throw new Error('Sin conexión a internet. Verifica tu conexión.');
      }

      if (error.message?.includes('timeout') || error.message?.includes('aborted')) {
        console.error('❌ Timeout en búsqueda');
        throw new Error('La búsqueda tardó demasiado. Intenta de nuevo.');
      }

      console.error('❌ Error inesperado en búsqueda:', error);
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  static async getPlaceDetails(placeId: string): Promise<PlaceDetails> {
    try {
      if (!GOOGLE_MAPS_API_KEY) {
        throw new Error('Google Maps API Key no configurada');
      }

      const url = `${PLACES_API_BASE}/details/json?place_id=${placeId}&key=${GOOGLE_MAPS_API_KEY}&language=es&fields=geometry,formatted_address,name,place_id`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.status !== 'OK') {
        throw new Error(data.error_message || 'Error obteniendo detalles del lugar');
      }

      return data.result;

    } catch (error) {
      console.error('❌ Error obteniendo detalles del lugar:', error);
      throw error;
    }
  }

  static async reverseGeocode(
    latitude: number,
    longitude: number
  ): Promise<string> {
    try {
      if (!GOOGLE_MAPS_API_KEY) {
        throw new Error('Google Maps API Key no configurada');
      }

      const url = `${GEOCODING_API_BASE}/json?latlng=${latitude},${longitude}&key=${GOOGLE_MAPS_API_KEY}&language=es`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.status === 'OK' && data.results.length > 0) {
        return data.results[0].formatted_address;
      }

      throw new Error('No se pudo obtener la dirección');

    } catch (error) {
      console.error('❌ Error en geocoding reverso:', error);
      throw error;
    }
  }

  static cancelSearch(): void {
    if (this.abortController) {
      console.log('🛑 Cancelando búsqueda activa...');
      this.abortController.abort();
      this.abortController = null;
    }
  }

  static validateConfig(): boolean {
    return !!GOOGLE_MAPS_API_KEY;
  }
}
