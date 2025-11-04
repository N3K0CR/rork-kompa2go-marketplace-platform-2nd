import { trpcClient } from '@/lib/trpc';
import { GOOGLE_MAPS_CONFIG } from '@/lib/google-maps';

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

export class PlacesService {

  static async getPlaceDetails(placeId: string): Promise<PlaceDetails> {
    try {
      console.log('🔍 Obteniendo detalles del lugar vía tRPC:', placeId);

      const response = await trpcClient.commute.getPlaceDetails.query({
        placeId,
        language: GOOGLE_MAPS_CONFIG.defaultLanguage,
      });

      console.log('✅ Detalles obtenidos exitosamente');

      return response.result;

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
      console.log('🔍 Reverse geocoding vía tRPC:', latitude, longitude);

      const response = await trpcClient.commute.reverseGeocode.query({
        latitude,
        longitude,
        language: GOOGLE_MAPS_CONFIG.defaultLanguage,
      });

      console.log('✅ Dirección obtenida exitosamente:', response.address);

      return response.address;

    } catch (error) {
      console.error('❌ Error en geocoding reverso:', error);
      throw error;
    }
  }

}
