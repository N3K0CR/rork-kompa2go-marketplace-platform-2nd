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
  private static currentController: AbortController | null = null;

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

    if (this.currentController) {
      this.currentController.abort();
      this.currentController = null;
    }

    if (!query || query.trim().length < 2) {
      return [];
    }

    this.currentController = new AbortController();
    const controller = this.currentController;
    
    const timeoutId = setTimeout(() => {
      if (controller && !controller.signal.aborted) {
        controller.abort();
      }
    }, timeout);

    try {
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
        signal: controller.signal,
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
        console.log('ℹ️ No se encontraron resultados');
        return [];
      }

      if (data.status === 'REQUEST_DENIED') {
        console.error('❌ API Key inválida:', data.error_message);
        throw new Error('Configuración de Google Maps incorrecta');
      }

      if (data.status === 'OVER_QUERY_LIMIT') {
        console.error('❌ Límite de consultas excedido');
        throw new Error('Límite de búsquedas alcanzado');
      }

      if (data.status === 'INVALID_REQUEST') {
        console.error('❌ Solicitud inválida:', data.error_message);
        throw new Error('Error en la búsqueda');
      }

      if (data.status !== 'OK') {
        console.error('❌ Error de API:', data.status);
        throw new Error(data.error_message || 'Error al buscar destino');
      }

      const results = data.predictions || [];
      console.log(`✅ Encontrados ${results.length} resultados`);

      return results;

    } catch (error: any) {
      clearTimeout(timeoutId);

      if (error.name === 'AbortError') {
        console.log('🔄 Búsqueda cancelada');
        return [];
      }

      if (error.message?.includes('Network request failed') || 
          error.message?.includes('Failed to fetch')) {
        console.error('❌ Error de red');
        throw new Error('Sin conexión a internet');
      }

      console.error('❌ Error en búsqueda:', error);
      throw error;
    } finally {
      clearTimeout(timeoutId);
      if (this.currentController === controller) {
        this.currentController = null;
      }
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
        throw new Error(data.error_message || 'Error obteniendo detalles');
      }

      return data.result;

    } catch (error) {
      console.error('❌ Error obteniendo detalles:', error);
      throw error;
    }
  }

  static async reverseGeocode(latitude: number, longitude: number): Promise<string> {
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
      console.error('❌ Error en geocoding:', error);
      throw error;
    }
  }

  static cancelSearch(): void {
    if (this.currentController) {
      console.log('🛑 Cancelando búsqueda');
      this.currentController.abort();
      this.currentController = null;
    }
  }

  static validateConfig(): boolean {
    return !!GOOGLE_MAPS_API_KEY;
  }
}
