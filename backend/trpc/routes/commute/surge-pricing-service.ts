// ============================================================================
// SURGE PRICING SERVICE
// ============================================================================
// Servicio para gestionar precios dinámicos basados en demanda y saturación

import type {
  Zone,
  ZoneSaturationStatus,
  Trip,
} from './types';

// ============================================================================
// SURGE PRICING TYPES
// ============================================================================

export interface SurgePricingConfig {
  id: string;
  zoneId: string;
  baseMultiplier: number;
  maxMultiplier: number;
  demandThreshold: number;
  timeBasedMultipliers: {
    peakHours: number[];
    offPeakHours: number[];
    peakMultiplier: number;
    offPeakMultiplier: number;
  };
  weatherMultipliers: {
    rain: number;
    storm: number;
    snow: number;
  };
  eventMultipliers: {
    holiday: number;
    specialEvent: number;
    emergency: number;
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface SurgePricingCalculation {
  zoneId: string;
  basePrice: number;
  surgeMultiplier: number;
  finalPrice: number;
  factors: {
    demand: number;
    time: number;
    weather: number;
    event: number;
    saturation: number;
  };
  explanation: string[];
  validUntil: Date;
}

export interface DemandMetrics {
  zoneId: string;
  currentDemand: number;
  averageDemand: number;
  peakDemand: number;
  demandTrend: 'increasing' | 'decreasing' | 'stable';
  waitingPassengers: number;
  availableDrivers: number;
  completedTrips: number;
  timestamp: Date;
}

// ============================================================================
// MOCK DATA STORAGE
// ============================================================================

const surgePricingConfigs = new Map<string, SurgePricingConfig>();
const demandMetrics = new Map<string, DemandMetrics[]>();
const activeSurgePricing = new Map<string, SurgePricingCalculation>();

// Initialize with sample configurations
const sampleConfigs: SurgePricingConfig[] = [
  {
    id: 'surge-centro',
    zoneId: 'zone-centro',
    baseMultiplier: 1.0,
    maxMultiplier: 3.0,
    demandThreshold: 0.7,
    timeBasedMultipliers: {
      peakHours: [7, 8, 9, 17, 18, 19],
      offPeakHours: [22, 23, 0, 1, 2, 3, 4, 5, 6],
      peakMultiplier: 1.5,
      offPeakMultiplier: 0.8,
    },
    weatherMultipliers: {
      rain: 1.3,
      storm: 1.8,
      snow: 2.0,
    },
    eventMultipliers: {
      holiday: 1.4,
      specialEvent: 1.6,
      emergency: 2.5,
    },
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date(),
  },
  {
    id: 'surge-miraflores',
    zoneId: 'zone-miraflores',
    baseMultiplier: 1.2,
    maxMultiplier: 4.0,
    demandThreshold: 0.6,
    timeBasedMultipliers: {
      peakHours: [7, 8, 9, 12, 13, 17, 18, 19, 20],
      offPeakHours: [22, 23, 0, 1, 2, 3, 4, 5, 6],
      peakMultiplier: 1.8,
      offPeakMultiplier: 0.9,
    },
    weatherMultipliers: {
      rain: 1.4,
      storm: 2.0,
      snow: 2.2,
    },
    eventMultipliers: {
      holiday: 1.5,
      specialEvent: 2.0,
      emergency: 3.0,
    },
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date(),
  },
];

// Initialize configurations
sampleConfigs.forEach(config => {
  surgePricingConfigs.set(config.zoneId, config);
  demandMetrics.set(config.zoneId, []);
});

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function getCurrentHour(): number {
  return new Date().getHours();
}

function calculateDemandRatio(metrics: DemandMetrics): number {
  if (metrics.availableDrivers === 0) return 1.0;
  return metrics.waitingPassengers / metrics.availableDrivers;
}

function getDemandTrend(zoneId: string): 'increasing' | 'decreasing' | 'stable' {
  const metrics = demandMetrics.get(zoneId) || [];
  if (metrics.length < 2) return 'stable';
  
  const recent = metrics.slice(-3);
  const avgRecent = recent.reduce((sum, m) => sum + m.currentDemand, 0) / recent.length;
  const older = metrics.slice(-6, -3);
  const avgOlder = older.reduce((sum, m) => sum + m.currentDemand, 0) / older.length;
  
  if (avgRecent > avgOlder * 1.1) return 'increasing';
  if (avgRecent < avgOlder * 0.9) return 'decreasing';
  return 'stable';
}

function getWeatherCondition(): 'clear' | 'rain' | 'storm' | 'snow' {
  // Mock weather - in real implementation, integrate with weather API
  const conditions = ['clear', 'rain', 'storm', 'snow'] as const;
  const weights = [0.6, 0.25, 0.1, 0.05]; // Probability weights
  
  const random = Math.random();
  let cumulative = 0;
  
  for (let i = 0; i < conditions.length; i++) {
    cumulative += weights[i];
    if (random <= cumulative) {
      return conditions[i];
    }
  }
  
  return 'clear';
}

function getEventType(): 'normal' | 'holiday' | 'specialEvent' | 'emergency' {
  // Mock event detection - in real implementation, integrate with calendar/event APIs
  const now = new Date();
  const hour = now.getHours();
  const dayOfWeek = now.getDay();
  
  // Weekend nights = special events
  if ((dayOfWeek === 5 || dayOfWeek === 6) && hour >= 20) {
    return Math.random() > 0.7 ? 'specialEvent' : 'normal';
  }
  
  // Emergency events are rare
  if (Math.random() > 0.98) {
    return 'emergency';
  }
  
  return 'normal';
}

// ============================================================================
// DEMAND TRACKING FUNCTIONS
// ============================================================================

export async function updateDemandMetrics(
  zoneId: string,
  waitingPassengers: number,
  availableDrivers: number,
  completedTrips: number
): Promise<DemandMetrics> {
  console.log('📊 Updating demand metrics for zone:', zoneId);
  
  const currentDemand = calculateDemandRatio({
    zoneId,
    currentDemand: 0,
    averageDemand: 0,
    peakDemand: 0,
    demandTrend: 'stable',
    waitingPassengers,
    availableDrivers,
    completedTrips,
    timestamp: new Date(),
  });
  
  const zoneMetrics = demandMetrics.get(zoneId) || [];
  
  // Calculate averages
  const averageDemand = zoneMetrics.length > 0 
    ? zoneMetrics.reduce((sum, m) => sum + m.currentDemand, 0) / zoneMetrics.length
    : currentDemand;
  
  const peakDemand = zoneMetrics.length > 0
    ? Math.max(...zoneMetrics.map(m => m.currentDemand), currentDemand)
    : currentDemand;
  
  const newMetrics: DemandMetrics = {
    zoneId,
    currentDemand,
    averageDemand,
    peakDemand,
    demandTrend: getDemandTrend(zoneId),
    waitingPassengers,
    availableDrivers,
    completedTrips,
    timestamp: new Date(),
  };
  
  // Keep only last 24 hours of data (assuming updates every 5 minutes = 288 entries)
  zoneMetrics.push(newMetrics);
  if (zoneMetrics.length > 288) {
    zoneMetrics.shift();
  }
  
  demandMetrics.set(zoneId, zoneMetrics);
  
  console.log('✅ Demand metrics updated:', {
    zoneId,
    currentDemand: currentDemand.toFixed(2),
    trend: newMetrics.demandTrend,
  });
  
  return newMetrics;
}

export async function getDemandMetrics(zoneId: string): Promise<DemandMetrics[]> {
  console.log('📈 Getting demand metrics for zone:', zoneId);
  return demandMetrics.get(zoneId) || [];
}

// ============================================================================
// SURGE PRICING CALCULATION FUNCTIONS
// ============================================================================

export async function calculateSurgePrice(
  zoneId: string,
  basePrice: number,
  saturationStatus?: ZoneSaturationStatus
): Promise<SurgePricingCalculation> {
  console.log('💰 Calculating surge price for zone:', zoneId);
  
  const config = surgePricingConfigs.get(zoneId);
  if (!config || !config.isActive) {
    return {
      zoneId,
      basePrice,
      surgeMultiplier: 1.0,
      finalPrice: basePrice,
      factors: {
        demand: 1.0,
        time: 1.0,
        weather: 1.0,
        event: 1.0,
        saturation: 1.0,
      },
      explanation: ['Surge pricing not active for this zone'],
      validUntil: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
    };
  }
  
  const currentHour = getCurrentHour();
  const weather = getWeatherCondition();
  const eventType = getEventType();
  const zoneMetrics = demandMetrics.get(zoneId) || [];
  const latestMetrics = zoneMetrics[zoneMetrics.length - 1];
  
  // Calculate individual factors
  const factors = {
    demand: 1.0,
    time: 1.0,
    weather: 1.0,
    event: 1.0,
    saturation: 1.0,
  };
  
  const explanation: string[] = [];
  
  // 1. Demand Factor
  if (latestMetrics) {
    const demandRatio = latestMetrics.currentDemand;
    if (demandRatio > config.demandThreshold) {
      factors.demand = Math.min(
        1 + (demandRatio - config.demandThreshold) * 2,
        config.maxMultiplier
      );
      explanation.push(`Alta demanda detectada (${(demandRatio * 100).toFixed(0)}% ratio)`);
    }
  }
  
  // 2. Time Factor
  if (config.timeBasedMultipliers.peakHours.includes(currentHour)) {
    factors.time = config.timeBasedMultipliers.peakMultiplier;
    explanation.push(`Hora pico (${currentHour}:00)`);
  } else if (config.timeBasedMultipliers.offPeakHours.includes(currentHour)) {
    factors.time = config.timeBasedMultipliers.offPeakMultiplier;
    explanation.push(`Hora valle (${currentHour}:00)`);
  }
  
  // 3. Weather Factor
  if (weather !== 'clear') {
    factors.weather = config.weatherMultipliers[weather];
    explanation.push(`Condiciones climáticas: ${weather}`);
  }
  
  // 4. Event Factor
  if (eventType !== 'normal') {
    factors.event = config.eventMultipliers[eventType];
    explanation.push(`Evento especial: ${eventType}`);
  }
  
  // 5. Saturation Factor
  if (saturationStatus) {
    switch (saturationStatus.status) {
      case 'saturated':
        factors.saturation = 1.8;
        explanation.push('Zona saturada - alta demanda');
        break;
      case 'high':
        factors.saturation = 1.4;
        explanation.push('Zona con alta ocupación');
        break;
      case 'low':
        factors.saturation = 0.9;
        explanation.push('Zona con baja ocupación');
        break;
      default:
        factors.saturation = 1.0;
    }
  }
  
  // Calculate final multiplier
  let surgeMultiplier = config.baseMultiplier;
  surgeMultiplier *= factors.demand;
  surgeMultiplier *= factors.time;
  surgeMultiplier *= factors.weather;
  surgeMultiplier *= factors.event;
  surgeMultiplier *= factors.saturation;
  
  // Apply maximum limit
  surgeMultiplier = Math.min(surgeMultiplier, config.maxMultiplier);
  surgeMultiplier = Math.max(surgeMultiplier, 0.5); // Minimum 50% of base price
  
  const finalPrice = Math.round(basePrice * surgeMultiplier * 100) / 100;
  
  if (explanation.length === 0) {
    explanation.push('Precio base - sin factores de surge');
  }
  
  const calculation: SurgePricingCalculation = {
    zoneId,
    basePrice,
    surgeMultiplier: Math.round(surgeMultiplier * 100) / 100,
    finalPrice,
    factors,
    explanation,
    validUntil: new Date(Date.now() + 15 * 60 * 1000), // Valid for 15 minutes
  };
  
  // Cache the calculation
  activeSurgePricing.set(zoneId, calculation);
  
  console.log('✅ Surge price calculated:', {
    zoneId,
    multiplier: calculation.surgeMultiplier,
    finalPrice: calculation.finalPrice,
  });
  
  return calculation;
}

export async function getSurgePrice(zoneId: string): Promise<SurgePricingCalculation | null> {
  console.log('💰 Getting cached surge price for zone:', zoneId);
  
  const cached = activeSurgePricing.get(zoneId);
  if (!cached) return null;
  
  // Check if still valid
  if (cached.validUntil < new Date()) {
    activeSurgePricing.delete(zoneId);
    return null;
  }
  
  return cached;
}

// ============================================================================
// SURGE PRICING CONFIGURATION FUNCTIONS
// ============================================================================

export async function createSurgePricingConfig(
  config: Omit<SurgePricingConfig, 'id' | 'createdAt' | 'updatedAt'>
): Promise<SurgePricingConfig> {
  console.log('🏗️ Creating surge pricing config for zone:', config.zoneId);
  
  const configId = `surge-${config.zoneId}-${Date.now()}`;
  
  const newConfig: SurgePricingConfig = {
    ...config,
    id: configId,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  
  surgePricingConfigs.set(config.zoneId, newConfig);
  
  console.log('✅ Surge pricing config created:', configId);
  return newConfig;
}

export async function updateSurgePricingConfig(
  zoneId: string,
  updates: Partial<Omit<SurgePricingConfig, 'id' | 'zoneId' | 'createdAt' | 'updatedAt'>>
): Promise<SurgePricingConfig> {
  console.log('📝 Updating surge pricing config for zone:', zoneId);
  
  const config = surgePricingConfigs.get(zoneId);
  if (!config) {
    throw new Error(`Surge pricing config not found for zone: ${zoneId}`);
  }
  
  const updatedConfig: SurgePricingConfig = {
    ...config,
    ...updates,
    updatedAt: new Date(),
  };
  
  surgePricingConfigs.set(zoneId, updatedConfig);
  
  // Clear cached pricing to force recalculation
  activeSurgePricing.delete(zoneId);
  
  console.log('✅ Surge pricing config updated');
  return updatedConfig;
}

export async function getSurgePricingConfig(zoneId: string): Promise<SurgePricingConfig | null> {
  console.log('🔍 Getting surge pricing config for zone:', zoneId);
  return surgePricingConfigs.get(zoneId) || null;
}

export async function getAllSurgePricingConfigs(): Promise<SurgePricingConfig[]> {
  console.log('📋 Getting all surge pricing configs');
  return Array.from(surgePricingConfigs.values());
}

// ============================================================================
// ANALYTICS FUNCTIONS
// ============================================================================

export async function getSurgePricingAnalytics(zoneId: string): Promise<{
  zone: string;
  averageMultiplier: number;
  peakMultiplier: number;
  totalRevenue: number;
  surgeRevenue: number;
  activationRate: number;
  demandPatterns: Array<{
    hour: number;
    averageMultiplier: number;
    activations: number;
  }>;
}> {
  console.log('📈 Getting surge pricing analytics for zone:', zoneId);
  
  // Mock analytics data - in real implementation, calculate from historical data
  const analytics = {
    zone: zoneId,
    averageMultiplier: 1.3,
    peakMultiplier: 2.8,
    totalRevenue: 15420.50,
    surgeRevenue: 4626.15,
    activationRate: 0.35, // 35% of trips had surge pricing
    demandPatterns: [
      { hour: 7, averageMultiplier: 1.8, activations: 45 },
      { hour: 8, averageMultiplier: 2.2, activations: 67 },
      { hour: 9, averageMultiplier: 1.6, activations: 38 },
      { hour: 17, averageMultiplier: 1.9, activations: 52 },
      { hour: 18, averageMultiplier: 2.4, activations: 71 },
      { hour: 19, averageMultiplier: 2.0, activations: 48 },
    ],
  };
  
  console.log('✅ Surge pricing analytics retrieved');
  return analytics;
}

// ============================================================================
// AUTOMATIC SURGE PRICING UPDATES
// ============================================================================

export async function updateAllSurgePricing(): Promise<void> {
  console.log('🔄 Updating surge pricing for all zones');
  
  for (const [zoneId, config] of surgePricingConfigs.entries()) {
    if (!config.isActive) continue;
    
    try {
      // Get latest metrics and recalculate
      const basePrice = 10.0; // Mock base price
      await calculateSurgePrice(zoneId, basePrice);
    } catch (error) {
      console.error(`Error updating surge pricing for zone ${zoneId}:`, error);
    }
  }
  
  console.log('✅ Surge pricing updated for all zones');
}

// Auto-update every 5 minutes
setInterval(updateAllSurgePricing, 5 * 60 * 1000);

console.log('🚀 Surge Pricing Service initialized');
console.log(`💰 Loaded ${surgePricingConfigs.size} surge pricing configurations`);