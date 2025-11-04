// ============================================================================
// GEOCODING SERVICE
// ============================================================================
// Backend service for geocoding and reverse geocoding using Nominatim

interface NominatimResult {
  place_id: number;
  lat: string;
  lon: string;
  display_name: string;
  address?: {
    road?: string;
    suburb?: string;
    city?: string;
    county?: string;
    state?: string;
    country?: string;
    postcode?: string;
  };
}

interface GeocodingResult {
  latitude: number;
  longitude: number;
  displayName: string;
  address: string;
  placeId: number;
}

const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org';
const REQUEST_DELAY = 1000;
let lastRequestTime = 0;

async function rateLimitedFetch(url: string): Promise<Response> {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  
  if (timeSinceLastRequest < REQUEST_DELAY) {
    await new Promise(resolve => setTimeout(resolve, REQUEST_DELAY - timeSinceLastRequest));
  }
  
  lastRequestTime = Date.now();
  
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Kompa2Go/1.0 (contact@kompa2go.com)',
      'Accept': 'application/json',
    },
  });
  
  return response;
}

export class GeocodingService {
  private cache = new Map<string, { data: GeocodingResult[]; timestamp: number }>();
  private readonly CACHE_TTL = 1000 * 60 * 60;

  async search(query: string, countryCode: string = 'cr'): Promise<GeocodingResult[]> {
    const cacheKey = `search:${query}:${countryCode}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      console.log('[GeocodingService] Cache hit for:', query);
      return cached.data;
    }

    try {
      const searchQuery = query.includes('Costa Rica') ? query : `${query}, Costa Rica`;
      const url = `${NOMINATIM_BASE_URL}/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=8&addressdetails=1&countrycodes=${countryCode}`;
      
      console.log('[GeocodingService] Searching:', query);
      
      const response = await rateLimitedFetch(url);
      
      if (!response.ok) {
        if (response.status === 429) {
          throw new Error('Rate limit exceeded. Please try again in a moment.');
        }
        throw new Error(`Geocoding failed: ${response.status}`);
      }
      
      const data: NominatimResult[] = await response.json();
      
      const results: GeocodingResult[] = data.map(item => ({
        latitude: parseFloat(item.lat),
        longitude: parseFloat(item.lon),
        displayName: item.display_name,
        address: this.formatAddress(item),
        placeId: item.place_id,
      }));
      
      this.cache.set(cacheKey, { data: results, timestamp: Date.now() });
      
      console.log('[GeocodingService] Found', results.length, 'results for:', query);
      
      return results;
    } catch (error) {
      console.error('[GeocodingService] Search error:', error);
      throw error;
    }
  }

  async reverse(latitude: number, longitude: number): Promise<GeocodingResult | null> {
    const cacheKey = `reverse:${latitude}:${longitude}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && cached.data.length > 0 && Date.now() - cached.timestamp < this.CACHE_TTL) {
      console.log('[GeocodingService] Cache hit for reverse:', latitude, longitude);
      return cached.data[0];
    }

    try {
      const url = `${NOMINATIM_BASE_URL}/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`;
      
      console.log('[GeocodingService] Reverse geocoding URL:', url);
      console.log('[GeocodingService] Request params:', { latitude, longitude });
      
      const response = await rateLimitedFetch(url);
      
      console.log('[GeocodingService] Response status:', response.status, response.statusText);
      
      if (!response.ok) {
        if (response.status === 429) {
          throw new Error('Rate limit exceeded. Please try again in a moment.');
        }
        throw new Error(`Reverse geocoding failed: ${response.status}`);
      }
      
      const data: NominatimResult = await response.json();
      
      console.log('[GeocodingService] Raw response data:', JSON.stringify(data, null, 2));
      
      if (!data || !data.lat || !data.lon) {
        console.error('[GeocodingService] Invalid response format:', data);
        throw new Error('Invalid geocoding response format');
      }
      
      const result: GeocodingResult = {
        latitude: parseFloat(data.lat),
        longitude: parseFloat(data.lon),
        displayName: data.display_name,
        address: this.formatAddress(data),
        placeId: data.place_id,
      };
      
      this.cache.set(cacheKey, { data: [result], timestamp: Date.now() });
      
      console.log('[GeocodingService] Reverse geocoding result:', result.address);
      
      return result;
    } catch (error) {
      console.error('[GeocodingService] Reverse geocoding error:', error);
      console.error('[GeocodingService] Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        latitude,
        longitude
      });
      throw error;
    }
  }

  private formatAddress(result: NominatimResult): string {
    if (!result.address) {
      return result.display_name;
    }

    const parts: string[] = [];
    
    if (result.address.road) parts.push(result.address.road);
    if (result.address.suburb) parts.push(result.address.suburb);
    if (result.address.city) parts.push(result.address.city);
    if (result.address.county && !result.address.city) parts.push(result.address.county);
    
    return parts.length > 0 ? parts.join(', ') : result.display_name;
  }

  clearCache(): void {
    this.cache.clear();
    console.log('[GeocodingService] Cache cleared');
  }
}

export const geocodingService = new GeocodingService();
