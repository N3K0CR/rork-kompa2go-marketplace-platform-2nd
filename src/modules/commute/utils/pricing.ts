// ============================================================================
// KOMMUTE PRICING UTILITIES
// ============================================================================
// Utilidades para calcular precios en Colones Costarricenses (CRC)

// Constantes de precios
export const PRICING_CONSTANTS = {
  // Tarifa base por kilómetro en CRC (competitiva con Uber X y Didi)
  BASE_RATE_PER_KM: 150, // ₡150 por km (más bajo que Uber X y Didi)
  
  // Tarifa mínima del viaje en CRC
  MINIMUM_FARE: 1200, // ₡1,200 mínimo
  
  // Tarifa de inicio (banderazo) en CRC
  BASE_FARE: 600, // ₡600 al iniciar el viaje
  
  // Tarifa por minuto de espera en CRC
  WAIT_TIME_PER_MINUTE: 40, // ₡40 por minuto
  
  // Incremento/decremento de precio (como Didi)
  PRICE_ADJUSTMENT_STEP: 50, // ₡50 para ajustar precio
  
  // Redondeo a los billetes/monedas más cercanos
  ROUNDING_VALUES: [5, 10, 25, 50, 100, 500, 1000, 2000, 5000, 10000, 20000],
} as const;

/**
 * Calcula el precio estimado de un viaje en CRC
 * @param distanceMeters Distancia en metros
 * @param durationSeconds Duración estimada en segundos
 * @param costFactor Factor de costo del tipo de vehículo (1.0 = estándar, 1.5 = large, 2.0 = premium)
 * @returns Precio en Colones Costarricenses
 */
export function calculateTripPrice(
  distanceMeters: number,
  durationSeconds: number,
  costFactor: number = 1.0
): number {
  // Convertir distancia a kilómetros
  const distanceKm = distanceMeters / 1000;
  
  // Calcular precio base por distancia
  const distancePrice = distanceKm * PRICING_CONSTANTS.BASE_RATE_PER_KM;
  
  // Aplicar factor de costo del vehículo
  const adjustedPrice = distancePrice * costFactor;
  
  // Agregar tarifa de inicio
  const totalPrice = PRICING_CONSTANTS.BASE_FARE + adjustedPrice;
  
  // Aplicar tarifa mínima
  const finalPrice = Math.max(totalPrice, PRICING_CONSTANTS.MINIMUM_FARE);
  
  // Redondear al valor más cercano
  return roundToNearestCurrency(finalPrice);
}

/**
 * Redondea un precio al billete o moneda más cercano en circulación
 * @param amount Monto a redondear
 * @returns Monto redondeado
 */
export function roundToNearestCurrency(amount: number): number {
  // Si es menor a 5, redondear a 5
  if (amount < 5) return 5;
  
  // Encontrar el valor de redondeo más apropiado
  // Para montos pequeños (< 1000), redondear a múltiplos de 25 o 50
  if (amount < 1000) {
    return Math.round(amount / 25) * 25;
  }
  
  // Para montos medianos (1000-5000), redondear a múltiplos de 100
  if (amount < 5000) {
    return Math.round(amount / 100) * 100;
  }
  
  // Para montos grandes (>= 5000), redondear a múltiplos de 500
  return Math.round(amount / 500) * 500;
}

/**
 * Formatea un precio en CRC con el símbolo de colones
 * @param amount Monto en colones
 * @param includeDecimals Si debe incluir decimales (por defecto false)
 * @returns String formateado con el precio
 */
export function formatCRC(amount: number, includeDecimals: boolean = false): string {
  const formatted = includeDecimals 
    ? amount.toLocaleString('es-CR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : amount.toLocaleString('es-CR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  
  return `₡${formatted}`;
}

/**
 * Calcula el precio por kilómetro para un tipo de vehículo
 * @param costFactor Factor de costo del vehículo
 * @returns Precio por kilómetro en CRC
 */
export function getPricePerKm(costFactor: number): number {
  return roundToNearestCurrency(PRICING_CONSTANTS.BASE_RATE_PER_KM * costFactor);
}

/**
 * Calcula distancia estimada entre dos puntos usando fórmula de Haversine
 * @param lat1 Latitud del punto 1
 * @param lon1 Longitud del punto 1
 * @param lat2 Latitud del punto 2
 * @param lon2 Longitud del punto 2
 * @returns Distancia en metros
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Radio de la Tierra en metros
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Calcula duración estimada del viaje
 * @param distanceMeters Distancia en metros
 * @param averageSpeedKmh Velocidad promedio en km/h
 * @returns Duración en segundos
 */
export function calculateDuration(
  distanceMeters: number,
  averageSpeedKmh: number = 30
): number {
  const distanceKm = distanceMeters / 1000;
  const durationHours = distanceKm / averageSpeedKmh;
  return Math.round(durationHours * 3600); // Convertir a segundos
}

/**
 * Genera precios de ejemplo para diferentes tipos de vehículos
 * @param distanceMeters Distancia en metros
 * @param durationSeconds Duración en segundos
 * @returns Array de precios por tipo de vehículo
 */
export function generateVehiclePrices(
  distanceMeters: number,
  durationSeconds: number
): {
  vehicleType: 'kommute-4' | 'kommute-large' | 'kommute-premium';
  price: number;
  priceFormatted: string;
  estimatedTime: string;
  priceRange: { min: number; max: number };
}[] {
  const vehicles = [
    { type: 'kommute-4' as const, costFactor: 0.85, name: 'Kommute 4' },
    { type: 'kommute-large' as const, costFactor: 1.25, name: 'Kommute Large' },
    { type: 'kommute-premium' as const, costFactor: 1.45, name: 'Kommute Premium' },
  ];

  return vehicles.map((vehicle) => {
    const basePrice = calculateTripPrice(distanceMeters, durationSeconds, vehicle.costFactor);
    const timeMinutes = Math.ceil(durationSeconds / 60);
    
    // Calcular rango de precios (como Didi permite ajustar ±50)
    const minPrice = roundToNearestCurrency(basePrice - (PRICING_CONSTANTS.PRICE_ADJUSTMENT_STEP * 3));
    const maxPrice = roundToNearestCurrency(basePrice + (PRICING_CONSTANTS.PRICE_ADJUSTMENT_STEP * 3));
    
    return {
      vehicleType: vehicle.type,
      price: basePrice,
      priceFormatted: formatCRC(basePrice),
      estimatedTime: `${timeMinutes} min`,
      priceRange: { min: minPrice, max: maxPrice },
    };
  });
}

/**
 * Ajusta el precio en incrementos de ₡50 (como Didi)
 * @param currentPrice Precio actual
 * @param direction 'up' para aumentar, 'down' para disminuir
 * @returns Nuevo precio ajustado
 */
export function adjustPrice(currentPrice: number, direction: 'up' | 'down'): number {
  const adjustment = direction === 'up' 
    ? PRICING_CONSTANTS.PRICE_ADJUSTMENT_STEP 
    : -PRICING_CONSTANTS.PRICE_ADJUSTMENT_STEP;
  
  const newPrice = currentPrice + adjustment;
  return roundToNearestCurrency(newPrice);
}
