// ============================================================================
// KOMMUTE PRICING UTILITIES
// ============================================================================
// Utilidades para calcular precios en Colones Costarricenses (CRC)

// Constantes de precios
export const PRICING_CONSTANTS = {
  // Tarifa base por kilómetro en CRC (competitiva con Uber X y Didi)
  BASE_RATE_PER_KM: 155, // ₡155 por km (ajustado para precio objetivo de 1850)
  
  // Tarifa mínima del viaje en CRC
  MINIMUM_FARE: 1000, // ₡1,000 mínimo
  
  // Tarifa de inicio (banderazo) en CRC
  BASE_FARE: 500, // ₡500 al iniciar el viaje
  
  // Tarifa por minuto de espera en CRC
  WAIT_TIME_PER_MINUTE: 35, // ₡35 por minuto
  
  // Incremento/decremento de precio (como Didi)
  PRICE_ADJUSTMENT_STEP: 50, // ₡50 para ajustar precio
  
  // Redondeo a los billetes/monedas más cercanos
  ROUNDING_VALUES: [5, 10, 25, 50, 100, 500, 1000, 2000, 5000, 10000, 20000],
} as const;

// Factores de precios dinámicos (similar a Uber)
export const DYNAMIC_PRICING_FACTORS = {
  // Factores por hora del día
  TIME_OF_DAY: {
    PEAK_MORNING: { start: 6, end: 9, multiplier: 1.3 },      // 6am-9am: +30%
    PEAK_EVENING: { start: 17, end: 20, multiplier: 1.35 },   // 5pm-8pm: +35%
    LATE_NIGHT: { start: 22, end: 4, multiplier: 1.25 },      // 10pm-4am: +25%
    NORMAL: { multiplier: 1.0 },                               // Resto del día: normal
  },
  
  // Factores por día de la semana
  DAY_OF_WEEK: {
    WEEKEND: { multiplier: 1.15 },      // Fin de semana: +15%
    FRIDAY: { multiplier: 1.2 },        // Viernes: +20%
    WEEKDAY: { multiplier: 1.0 },       // Días normales: normal
  },
  
  // Factores por tráfico
  TRAFFIC: {
    HEAVY: { multiplier: 1.4 },         // Tráfico pesado: +40%
    MODERATE: { multiplier: 1.2 },      // Tráfico moderado: +20%
    LIGHT: { multiplier: 1.0 },         // Tráfico ligero: normal
  },
  
  // Factores por demanda
  DEMAND: {
    VERY_HIGH: { multiplier: 1.5 },     // Demanda muy alta: +50%
    HIGH: { multiplier: 1.3 },          // Demanda alta: +30%
    MODERATE: { multiplier: 1.15 },     // Demanda moderada: +15%
    NORMAL: { multiplier: 1.0 },        // Demanda normal: normal
  },
  
  // Factores por eventos especiales
  EVENTS: {
    MAJOR_EVENT: { multiplier: 1.6 },   // Evento mayor: +60%
    HOLIDAY: { multiplier: 1.4 },       // Día festivo: +40%
    SPECIAL: { multiplier: 1.25 },      // Evento especial: +25%
  },
  
  // Factores por clima
  WEATHER: {
    SEVERE: { multiplier: 1.3 },        // Clima severo: +30%
    RAIN: { multiplier: 1.15 },         // Lluvia: +15%
    NORMAL: { multiplier: 1.0 },        // Clima normal: normal
  },
} as const;

// Días festivos de Costa Rica
export const COSTA_RICA_HOLIDAYS = [
  { month: 1, day: 1, name: 'Año Nuevo' },
  { month: 4, day: 11, name: 'Día de Juan Santamaría' },
  { month: 5, day: 1, name: 'Día del Trabajador' },
  { month: 7, day: 25, name: 'Anexión de Guanacaste' },
  { month: 8, day: 2, name: 'Día de la Virgen de los Ángeles' },
  { month: 8, day: 15, name: 'Día de la Madre' },
  { month: 9, day: 15, name: 'Día de la Independencia' },
  { month: 12, day: 25, name: 'Navidad' },
];

/**
 * Calcula el precio estimado de un viaje en CRC con precios dinámicos
 * @param distanceMeters Distancia en metros
 * @param durationSeconds Duración estimada en segundos
 * @param costFactor Factor de costo del tipo de vehículo (1.0 = estándar, 1.5 = large, 2.0 = premium)
 * @param options Opciones adicionales para precios dinámicos
 * @returns Precio en Colones Costarricenses y factores aplicados
 */
export function calculateTripPrice(
  distanceMeters: number,
  durationSeconds: number,
  costFactor: number = 1.0,
  options?: {
    timestamp?: Date;
    trafficLevel?: 'light' | 'moderate' | 'heavy';
    demandLevel?: 'normal' | 'moderate' | 'high' | 'very_high';
    weatherCondition?: 'normal' | 'rain' | 'severe';
    isSpecialEvent?: boolean;
  }
): { price: number; basePrice: number; appliedFactors: DynamicPricingFactor[] } {
  // Convertir distancia a kilómetros
  const distanceKm = distanceMeters / 1000;
  
  // Calcular precio base por distancia
  const distancePrice = distanceKm * PRICING_CONSTANTS.BASE_RATE_PER_KM;
  
  // Aplicar factor de costo del vehículo
  const adjustedPrice = distancePrice * costFactor;
  
  // Agregar tarifa de inicio
  const basePrice = PRICING_CONSTANTS.BASE_FARE + adjustedPrice;
  
  // Aplicar precios dinámicos
  const { finalPrice, appliedFactors } = applyDynamicPricing(basePrice, options);
  
  // Aplicar tarifa mínima
  const priceWithMinimum = Math.max(finalPrice, PRICING_CONSTANTS.MINIMUM_FARE);
  
  // Redondear al valor más cercano
  return {
    price: roundToNearestCurrency(priceWithMinimum),
    basePrice: roundToNearestCurrency(basePrice),
    appliedFactors,
  };
}

export interface DynamicPricingFactor {
  type: 'time' | 'day' | 'traffic' | 'demand' | 'weather' | 'event' | 'holiday';
  name: string;
  multiplier: number;
  description: string;
}

/**
 * Aplica factores de precios dinámicos
 */
function applyDynamicPricing(
  basePrice: number,
  options?: {
    timestamp?: Date;
    trafficLevel?: 'light' | 'moderate' | 'heavy';
    demandLevel?: 'normal' | 'moderate' | 'high' | 'very_high';
    weatherCondition?: 'normal' | 'rain' | 'severe';
    isSpecialEvent?: boolean;
  }
): { finalPrice: number; appliedFactors: DynamicPricingFactor[] } {
  const appliedFactors: DynamicPricingFactor[] = [];
  let totalMultiplier = 1.0;
  
  const timestamp = options?.timestamp || new Date();
  const hour = timestamp.getHours();
  const day = timestamp.getDay(); // 0 = Sunday, 6 = Saturday
  
  // Factor por hora del día
  const timeMultiplier = getTimeOfDayMultiplier(hour);
  if (timeMultiplier.multiplier > 1.0) {
    appliedFactors.push({
      type: 'time',
      name: timeMultiplier.name,
      multiplier: timeMultiplier.multiplier,
      description: timeMultiplier.description,
    });
    totalMultiplier *= timeMultiplier.multiplier;
  }
  
  // Factor por día de la semana
  const dayMultiplier = getDayOfWeekMultiplier(day);
  if (dayMultiplier.multiplier > 1.0) {
    appliedFactors.push({
      type: 'day',
      name: dayMultiplier.name,
      multiplier: dayMultiplier.multiplier,
      description: dayMultiplier.description,
    });
    totalMultiplier *= dayMultiplier.multiplier;
  }
  
  // Factor por día festivo
  if (isHoliday(timestamp)) {
    appliedFactors.push({
      type: 'holiday',
      name: 'Día Festivo',
      multiplier: DYNAMIC_PRICING_FACTORS.EVENTS.HOLIDAY.multiplier,
      description: 'Tarifa especial por día festivo',
    });
    totalMultiplier *= DYNAMIC_PRICING_FACTORS.EVENTS.HOLIDAY.multiplier;
  }
  
  // Factor por tráfico
  if (options?.trafficLevel && options.trafficLevel !== 'light') {
    const trafficMultiplier = getTrafficMultiplier(options.trafficLevel);
    appliedFactors.push({
      type: 'traffic',
      name: trafficMultiplier.name,
      multiplier: trafficMultiplier.multiplier,
      description: trafficMultiplier.description,
    });
    totalMultiplier *= trafficMultiplier.multiplier;
  }
  
  // Factor por demanda
  if (options?.demandLevel && options.demandLevel !== 'normal') {
    const demandMultiplier = getDemandMultiplier(options.demandLevel);
    appliedFactors.push({
      type: 'demand',
      name: demandMultiplier.name,
      multiplier: demandMultiplier.multiplier,
      description: demandMultiplier.description,
    });
    totalMultiplier *= demandMultiplier.multiplier;
  }
  
  // Factor por clima
  if (options?.weatherCondition && options.weatherCondition !== 'normal') {
    const weatherMultiplier = getWeatherMultiplier(options.weatherCondition);
    appliedFactors.push({
      type: 'weather',
      name: weatherMultiplier.name,
      multiplier: weatherMultiplier.multiplier,
      description: weatherMultiplier.description,
    });
    totalMultiplier *= weatherMultiplier.multiplier;
  }
  
  // Factor por evento especial
  if (options?.isSpecialEvent) {
    appliedFactors.push({
      type: 'event',
      name: 'Evento Especial',
      multiplier: DYNAMIC_PRICING_FACTORS.EVENTS.SPECIAL.multiplier,
      description: 'Tarifa especial por evento en la zona',
    });
    totalMultiplier *= DYNAMIC_PRICING_FACTORS.EVENTS.SPECIAL.multiplier;
  }
  
  const finalPrice = basePrice * totalMultiplier;
  
  return { finalPrice, appliedFactors };
}

/**
 * Obtiene el multiplicador por hora del día
 */
function getTimeOfDayMultiplier(hour: number): {
  multiplier: number;
  name: string;
  description: string;
} {
  const { TIME_OF_DAY } = DYNAMIC_PRICING_FACTORS;
  
  if (hour >= TIME_OF_DAY.PEAK_MORNING.start && hour < TIME_OF_DAY.PEAK_MORNING.end) {
    return {
      multiplier: TIME_OF_DAY.PEAK_MORNING.multiplier,
      name: 'Hora Pico Mañana',
      description: 'Mayor demanda en horas de la mañana',
    };
  }
  
  if (hour >= TIME_OF_DAY.PEAK_EVENING.start && hour < TIME_OF_DAY.PEAK_EVENING.end) {
    return {
      multiplier: TIME_OF_DAY.PEAK_EVENING.multiplier,
      name: 'Hora Pico Tarde',
      description: 'Mayor demanda en horas de la tarde',
    };
  }
  
  if (hour >= TIME_OF_DAY.LATE_NIGHT.start || hour < 4) {
    return {
      multiplier: TIME_OF_DAY.LATE_NIGHT.multiplier,
      name: 'Tarifa Nocturna',
      description: 'Tarifa especial por horario nocturno',
    };
  }
  
  return {
    multiplier: TIME_OF_DAY.NORMAL.multiplier,
    name: 'Tarifa Normal',
    description: 'Tarifa estándar',
  };
}

/**
 * Obtiene el multiplicador por día de la semana
 */
function getDayOfWeekMultiplier(day: number): {
  multiplier: number;
  name: string;
  description: string;
} {
  const { DAY_OF_WEEK } = DYNAMIC_PRICING_FACTORS;
  
  if (day === 5) { // Viernes
    return {
      multiplier: DAY_OF_WEEK.FRIDAY.multiplier,
      name: 'Viernes',
      description: 'Mayor demanda los viernes',
    };
  }
  
  if (day === 0 || day === 6) { // Fin de semana
    return {
      multiplier: DAY_OF_WEEK.WEEKEND.multiplier,
      name: 'Fin de Semana',
      description: 'Tarifa de fin de semana',
    };
  }
  
  return {
    multiplier: DAY_OF_WEEK.WEEKDAY.multiplier,
    name: 'Día Normal',
    description: 'Tarifa de día entre semana',
  };
}

/**
 * Obtiene el multiplicador por tráfico
 */
function getTrafficMultiplier(level: 'moderate' | 'heavy'): {
  multiplier: number;
  name: string;
  description: string;
} {
  const { TRAFFIC } = DYNAMIC_PRICING_FACTORS;
  
  if (level === 'heavy') {
    return {
      multiplier: TRAFFIC.HEAVY.multiplier,
      name: 'Tráfico Pesado',
      description: 'Ajuste por tráfico intenso',
    };
  }
  
  return {
    multiplier: TRAFFIC.MODERATE.multiplier,
    name: 'Tráfico Moderado',
    description: 'Ajuste por tráfico moderado',
  };
}

/**
 * Obtiene el multiplicador por demanda
 */
function getDemandMultiplier(level: 'moderate' | 'high' | 'very_high'): {
  multiplier: number;
  name: string;
  description: string;
} {
  const { DEMAND } = DYNAMIC_PRICING_FACTORS;
  
  if (level === 'very_high') {
    return {
      multiplier: DEMAND.VERY_HIGH.multiplier,
      name: 'Demanda Muy Alta',
      description: 'Ajuste por demanda excepcional',
    };
  }
  
  if (level === 'high') {
    return {
      multiplier: DEMAND.HIGH.multiplier,
      name: 'Demanda Alta',
      description: 'Ajuste por alta demanda',
    };
  }
  
  return {
    multiplier: DEMAND.MODERATE.multiplier,
    name: 'Demanda Moderada',
    description: 'Ajuste por demanda moderada',
  };
}

/**
 * Obtiene el multiplicador por clima
 */
function getWeatherMultiplier(condition: 'rain' | 'severe'): {
  multiplier: number;
  name: string;
  description: string;
} {
  const { WEATHER } = DYNAMIC_PRICING_FACTORS;
  
  if (condition === 'severe') {
    return {
      multiplier: WEATHER.SEVERE.multiplier,
      name: 'Clima Severo',
      description: 'Ajuste por condiciones climáticas adversas',
    };
  }
  
  return {
    multiplier: WEATHER.RAIN.multiplier,
    name: 'Lluvia',
    description: 'Ajuste por lluvia',
  };
}

/**
 * Verifica si una fecha es día festivo en Costa Rica
 */
function isHoliday(date: Date): boolean {
  const month = date.getMonth() + 1; // getMonth() returns 0-11
  const day = date.getDate();
  
  return COSTA_RICA_HOLIDAYS.some(
    holiday => holiday.month === month && holiday.day === day
  );
}

/**
 * Calcula el nivel de demanda basado en la hora y día
 */
export function calculateDemandLevel(
  timestamp: Date = new Date()
): 'normal' | 'moderate' | 'high' | 'very_high' {
  const hour = timestamp.getHours();
  const day = timestamp.getDay();
  
  // Hora pico de la mañana (6am-9am) en días laborables
  if (hour >= 6 && hour < 9 && day >= 1 && day <= 5) {
    return 'very_high';
  }
  
  // Hora pico de la tarde (5pm-8pm) en días laborables
  if (hour >= 17 && hour < 20 && day >= 1 && day <= 5) {
    return 'very_high';
  }
  
  // Viernes en la noche (8pm-12am)
  if (day === 5 && hour >= 20) {
    return 'high';
  }
  
  // Fin de semana en la noche (8pm-2am)
  if ((day === 0 || day === 6) && (hour >= 20 || hour < 2)) {
    return 'high';
  }
  
  // Días festivos
  if (isHoliday(timestamp)) {
    return 'high';
  }
  
  // Horas normales en días laborables
  if (day >= 1 && day <= 5 && hour >= 9 && hour < 17) {
    return 'moderate';
  }
  
  return 'normal';
}

/**
 * Calcula el nivel de tráfico basado en la hora y día
 */
export function calculateTrafficLevel(
  timestamp: Date = new Date()
): 'light' | 'moderate' | 'heavy' {
  const hour = timestamp.getHours();
  const day = timestamp.getDay();
  
  // Hora pico de la mañana (6am-9am) en días laborables
  if (hour >= 6 && hour < 9 && day >= 1 && day <= 5) {
    return 'heavy';
  }
  
  // Hora pico de la tarde (5pm-8pm) en días laborables
  if (hour >= 17 && hour < 20 && day >= 1 && day <= 5) {
    return 'heavy';
  }
  
  // Horas normales en días laborables
  if (day >= 1 && day <= 5 && ((hour >= 9 && hour < 17) || (hour >= 20 && hour < 22))) {
    return 'moderate';
  }
  
  return 'light';
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
 * Genera precios de ejemplo para diferentes tipos de vehículos con precios dinámicos
 * @param distanceMeters Distancia en metros
 * @param durationSeconds Duración en segundos
 * @param options Opciones para precios dinámicos
 * @returns Array de precios por tipo de vehículo
 */
export function generateVehiclePrices(
  distanceMeters: number,
  durationSeconds: number,
  options?: {
    timestamp?: Date;
    trafficLevel?: 'light' | 'moderate' | 'heavy';
    demandLevel?: 'normal' | 'moderate' | 'high' | 'very_high';
    weatherCondition?: 'normal' | 'rain' | 'severe';
    isSpecialEvent?: boolean;
  }
): {
  vehicleType: 'kommute-4' | 'kommute-large';
  price: number;
  basePrice: number;
  priceFormatted: string;
  estimatedTime: string;
  priceRange: { min: number; max: number };
  appliedFactors: DynamicPricingFactor[];
  surgeMultiplier: number;
}[] {
  const vehicles = [
    { type: 'kommute-4' as const, costFactor: 0.85, name: 'Kommute 4' },
    { type: 'kommute-large' as const, costFactor: 1.15, name: 'Kommute Large' },
  ];

  return vehicles.map((vehicle) => {
    const result = calculateTripPrice(distanceMeters, durationSeconds, vehicle.costFactor, options);
    const timeMinutes = Math.ceil(durationSeconds / 60);
    
    // Calcular multiplicador total de surge
    const surgeMultiplier = result.appliedFactors.reduce(
      (acc, factor) => acc * factor.multiplier,
      1.0
    );
    
    // Calcular rango de precios (como Didi permite ajustar ±50)
    const minPrice = roundToNearestCurrency(result.price - (PRICING_CONSTANTS.PRICE_ADJUSTMENT_STEP * 3));
    const maxPrice = roundToNearestCurrency(result.price + (PRICING_CONSTANTS.PRICE_ADJUSTMENT_STEP * 3));
    
    return {
      vehicleType: vehicle.type,
      price: result.price,
      basePrice: result.basePrice,
      priceFormatted: formatCRC(result.price),
      estimatedTime: `${timeMinutes} min`,
      priceRange: { min: minPrice, max: maxPrice },
      appliedFactors: result.appliedFactors,
      surgeMultiplier,
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
