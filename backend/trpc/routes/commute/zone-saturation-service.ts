// ============================================================================
// ZONE SATURATION SERVICE
// ============================================================================
// Servicio para gestionar zonas geográficas con control de saturación

import type {
  Zone,
  DriverZoneAssignment,
  ZoneSaturationStatus,
  CreateZoneInput,
  UpdateZoneInput,
  JoinZoneInput,
  LeaveZoneInput,
  GetZoneSaturationInput,
  GetZoneRecommendationsInput,
} from './types';

// ============================================================================
// MOCK DATA STORAGE
// ============================================================================

const zones = new Map<string, Zone>();
const driverAssignments = new Map<string, DriverZoneAssignment[]>();
const zoneWaitingLists = new Map<string, string[]>(); // zoneId -> driverIds

// Initialize with sample zones
const sampleZones: Zone[] = [
  {
    id: 'zone-centro',
    name: 'Centro Histórico',
    description: 'Zona céntrica con alta demanda',
    coordinates: [
      { latitude: -12.0464, longitude: -77.0428 },
      { latitude: -12.0464, longitude: -77.0328 },
      { latitude: -12.0364, longitude: -77.0328 },
      { latitude: -12.0364, longitude: -77.0428 },
    ],
    center: { latitude: -12.0414, longitude: -77.0378 },
    maxDrivers: 50,
    currentDrivers: 35,
    saturationLevel: 70,
    status: 'active',
    priority: 8,
    incentives: {
      bonusMultiplier: 1.5,
      minimumTrips: 3,
      timeBasedBonus: true,
    },
    restrictions: {
      minRating: 4.0,
      minExperience: 30,
      vehicleTypes: ['sedan', 'suv'],
    },
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date(),
  },
  {
    id: 'zone-miraflores',
    name: 'Miraflores',
    description: 'Distrito turístico premium',
    coordinates: [
      { latitude: -12.1164, longitude: -77.0364 },
      { latitude: -12.1164, longitude: -77.0264 },
      { latitude: -12.1064, longitude: -77.0264 },
      { latitude: -12.1064, longitude: -77.0364 },
    ],
    center: { latitude: -12.1114, longitude: -77.0314 },
    maxDrivers: 30,
    currentDrivers: 28,
    saturationLevel: 93,
    status: 'saturated',
    priority: 9,
    incentives: {
      bonusMultiplier: 2.0,
      minimumTrips: 5,
      timeBasedBonus: true,
    },
    restrictions: {
      minRating: 4.5,
      minExperience: 60,
      vehicleTypes: ['sedan', 'suv', 'premium'],
    },
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date(),
  },
  {
    id: 'zone-san-isidro',
    name: 'San Isidro',
    description: 'Distrito financiero',
    coordinates: [
      { latitude: -12.0964, longitude: -77.0464 },
      { latitude: -12.0964, longitude: -77.0364 },
      { latitude: -12.0864, longitude: -77.0364 },
      { latitude: -12.0864, longitude: -77.0464 },
    ],
    center: { latitude: -12.0914, longitude: -77.0414 },
    maxDrivers: 25,
    currentDrivers: 12,
    saturationLevel: 48,
    status: 'high_demand',
    priority: 7,
    incentives: {
      bonusMultiplier: 1.8,
      minimumTrips: 2,
      timeBasedBonus: false,
    },
    restrictions: {
      minRating: 4.2,
      minExperience: 45,
    },
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date(),
  },
];

// Initialize zones
sampleZones.forEach(zone => {
  zones.set(zone.id, zone);
  zoneWaitingLists.set(zone.id, []);
});

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
          Math.cos(φ1) * Math.cos(φ2) *
          Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c;
}

function isPointInPolygon(point: { latitude: number; longitude: number }, polygon: { latitude: number; longitude: number }[]): boolean {
  const x = point.longitude;
  const y = point.latitude;
  let inside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].longitude;
    const yi = polygon[i].latitude;
    const xj = polygon[j].longitude;
    const yj = polygon[j].latitude;

    if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) {
      inside = !inside;
    }
  }

  return inside;
}

function calculateSaturationLevel(currentDrivers: number, maxDrivers: number): number {
  return Math.round((currentDrivers / maxDrivers) * 100);
}

function getSaturationStatus(saturationLevel: number): 'low' | 'optimal' | 'high' | 'saturated' {
  if (saturationLevel < 30) return 'low';
  if (saturationLevel < 70) return 'optimal';
  if (saturationLevel < 90) return 'high';
  return 'saturated';
}

function generateZoneId(): string {
  return `zone-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function generateAssignmentId(): string {
  return `assignment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// ============================================================================
// ZONE MANAGEMENT FUNCTIONS
// ============================================================================

export async function createZone(input: CreateZoneInput): Promise<Zone> {
  console.log('🏗️ Creating new zone:', input.name);

  const zoneId = generateZoneId();
  
  // Calculate center point from coordinates
  const center = {
    latitude: input.coordinates.reduce((sum, coord) => sum + coord.latitude, 0) / input.coordinates.length,
    longitude: input.coordinates.reduce((sum, coord) => sum + coord.longitude, 0) / input.coordinates.length,
  };

  const zone: Zone = {
    id: zoneId,
    name: input.name,
    description: input.description,
    coordinates: input.coordinates,
    center,
    maxDrivers: input.maxDrivers,
    currentDrivers: 0,
    saturationLevel: 0,
    status: 'active',
    priority: input.priority || 5,
    incentives: input.incentives,
    restrictions: input.restrictions,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  zones.set(zoneId, zone);
  zoneWaitingLists.set(zoneId, []);

  console.log('✅ Zone created successfully:', zoneId);
  return zone;
}

export async function updateZone(input: UpdateZoneInput): Promise<Zone> {
  console.log('📝 Updating zone:', input.zoneId);

  const zone = zones.get(input.zoneId);
  if (!zone) {
    throw new Error(`Zone not found: ${input.zoneId}`);
  }

  const updatedZone: Zone = {
    ...zone,
    ...input,
    id: zone.id, // Preserve original ID
    updatedAt: new Date(),
  };

  // Recalculate center if coordinates changed
  if (input.coordinates) {
    updatedZone.center = {
      latitude: input.coordinates.reduce((sum, coord) => sum + coord.latitude, 0) / input.coordinates.length,
      longitude: input.coordinates.reduce((sum, coord) => sum + coord.longitude, 0) / input.coordinates.length,
    };
  }

  // Recalculate saturation if maxDrivers changed
  if (input.maxDrivers) {
    updatedZone.saturationLevel = calculateSaturationLevel(updatedZone.currentDrivers, input.maxDrivers);
  }

  zones.set(input.zoneId, updatedZone);

  console.log('✅ Zone updated successfully');
  return updatedZone;
}

export async function deleteZone(zoneId: string): Promise<boolean> {
  console.log('🗑️ Deleting zone:', zoneId);

  const zone = zones.get(zoneId);
  if (!zone) {
    throw new Error(`Zone not found: ${zoneId}`);
  }

  // Remove all driver assignments for this zone
  for (const [driverId, assignments] of driverAssignments.entries()) {
    const filteredAssignments = assignments.filter(a => a.zoneId !== zoneId);
    if (filteredAssignments.length !== assignments.length) {
      driverAssignments.set(driverId, filteredAssignments);
    }
  }

  zones.delete(zoneId);
  zoneWaitingLists.delete(zoneId);

  console.log('✅ Zone deleted successfully');
  return true;
}

export async function getAllZones(): Promise<Zone[]> {
  console.log('📋 Getting all zones');
  return Array.from(zones.values());
}

export async function getZoneById(zoneId: string): Promise<Zone | null> {
  console.log('🔍 Getting zone by ID:', zoneId);
  return zones.get(zoneId) || null;
}

// ============================================================================
// DRIVER ZONE ASSIGNMENT FUNCTIONS
// ============================================================================

export async function joinZone(driverId: string, input: JoinZoneInput): Promise<DriverZoneAssignment> {
  console.log('🚗 Driver joining zone:', driverId, input.zoneId);

  const zone = zones.get(input.zoneId);
  if (!zone) {
    throw new Error(`Zone not found: ${input.zoneId}`);
  }

  // Check if driver is already in this zone
  const existingAssignments = driverAssignments.get(driverId) || [];
  const existingAssignment = existingAssignments.find(a => a.zoneId === input.zoneId && a.status === 'active');
  
  if (existingAssignment) {
    console.log('⚠️ Driver already in zone');
    return existingAssignment;
  }

  // Check if driver is within zone boundaries
  const isInZone = isPointInPolygon(input.driverLocation, zone.coordinates);
  if (!isInZone) {
    throw new Error('Driver location is outside zone boundaries');
  }

  // Check zone capacity
  if (zone.currentDrivers >= zone.maxDrivers) {
    console.log('⏳ Zone is saturated, adding to waiting list');
    
    const waitingList = zoneWaitingLists.get(input.zoneId) || [];
    if (!waitingList.includes(driverId)) {
      waitingList.push(driverId);
      zoneWaitingLists.set(input.zoneId, waitingList);
    }

    const assignment: DriverZoneAssignment = {
      id: generateAssignmentId(),
      driverId,
      zoneId: input.zoneId,
      status: 'pending',
      assignedAt: new Date(),
    };

    const assignments = driverAssignments.get(driverId) || [];
    assignments.push(assignment);
    driverAssignments.set(driverId, assignments);

    return assignment;
  }

  // Create active assignment
  const assignment: DriverZoneAssignment = {
    id: generateAssignmentId(),
    driverId,
    zoneId: input.zoneId,
    status: 'active',
    assignedAt: new Date(),
    lastActiveAt: new Date(),
    performanceMetrics: {
      tripsCompleted: 0,
      averageRating: 0,
      acceptanceRate: 100,
      cancellationRate: 0,
    },
    earnings: {
      totalEarnings: 0,
      bonusEarnings: 0,
      tripsCount: 0,
    },
  };

  const assignments = driverAssignments.get(driverId) || [];
  assignments.push(assignment);
  driverAssignments.set(driverId, assignments);

  // Update zone current drivers count
  zone.currentDrivers += 1;
  zone.saturationLevel = calculateSaturationLevel(zone.currentDrivers, zone.maxDrivers);
  zone.updatedAt = new Date();
  zones.set(input.zoneId, zone);

  console.log('✅ Driver joined zone successfully');
  return assignment;
}

export async function leaveZone(driverId: string, input: LeaveZoneInput): Promise<boolean> {
  console.log('🚪 Driver leaving zone:', driverId, input.zoneId);

  const zone = zones.get(input.zoneId);
  if (!zone) {
    throw new Error(`Zone not found: ${input.zoneId}`);
  }

  const assignments = driverAssignments.get(driverId) || [];
  const assignmentIndex = assignments.findIndex(a => a.zoneId === input.zoneId && a.status === 'active');
  
  if (assignmentIndex === -1) {
    console.log('⚠️ Driver not found in zone');
    return false;
  }

  // Update assignment status
  assignments[assignmentIndex].status = 'inactive';
  driverAssignments.set(driverId, assignments);

  // Update zone current drivers count
  zone.currentDrivers = Math.max(0, zone.currentDrivers - 1);
  zone.saturationLevel = calculateSaturationLevel(zone.currentDrivers, zone.maxDrivers);
  zone.updatedAt = new Date();
  zones.set(input.zoneId, zone);

  // Process waiting list
  const waitingList = zoneWaitingLists.get(input.zoneId) || [];
  if (waitingList.length > 0 && zone.currentDrivers < zone.maxDrivers) {
    const nextDriverId = waitingList.shift()!;
    zoneWaitingLists.set(input.zoneId, waitingList);
    
    // Activate pending assignment for next driver
    const nextDriverAssignments = driverAssignments.get(nextDriverId) || [];
    const pendingAssignment = nextDriverAssignments.find(a => a.zoneId === input.zoneId && a.status === 'pending');
    
    if (pendingAssignment) {
      pendingAssignment.status = 'active';
      pendingAssignment.lastActiveAt = new Date();
      driverAssignments.set(nextDriverId, nextDriverAssignments);
      
      zone.currentDrivers += 1;
      zone.saturationLevel = calculateSaturationLevel(zone.currentDrivers, zone.maxDrivers);
      zones.set(input.zoneId, zone);
      
      console.log('✅ Next driver activated from waiting list:', nextDriverId);
    }
  }

  console.log('✅ Driver left zone successfully');
  return true;
}

export async function getDriverZoneAssignments(driverId: string): Promise<DriverZoneAssignment[]> {
  console.log('📋 Getting driver zone assignments:', driverId);
  return driverAssignments.get(driverId) || [];
}

// ============================================================================
// ZONE SATURATION FUNCTIONS
// ============================================================================

export async function getZoneSaturation(input: GetZoneSaturationInput): Promise<ZoneSaturationStatus[]> {
  console.log('📊 Getting zone saturation for location:', input.location);

  const nearbyZones = Array.from(zones.values()).filter(zone => {
    const distance = calculateDistance(
      input.location.latitude,
      input.location.longitude,
      zone.center.latitude,
      zone.center.longitude
    );
    return distance <= input.radius;
  });

  const saturationStatuses: ZoneSaturationStatus[] = nearbyZones.map(zone => {
    const waitingList = zoneWaitingLists.get(zone.id) || [];
    const saturationStatus = getSaturationStatus(zone.saturationLevel);
    
    const recommendations = [];
    
    if (saturationStatus === 'saturated') {
      recommendations.push({
        type: 'wait' as const,
        message: `Zona saturada. ${waitingList.length} conductores en lista de espera.`,
      });
      
      // Find alternative zones
      const alternativeZones = Array.from(zones.values())
        .filter(z => z.id !== zone.id && z.saturationLevel < 80)
        .sort((a, b) => a.saturationLevel - b.saturationLevel)
        .slice(0, 2);
      
      alternativeZones.forEach(altZone => {
        recommendations.push({
          type: 'alternative_zone' as const,
          message: `Considera ${altZone.name} (${altZone.saturationLevel}% ocupado)`,
          alternativeZoneId: altZone.id,
        });
      });
    } else if (saturationStatus === 'high') {
      recommendations.push({
        type: 'move_to_zone' as const,
        message: 'Zona con alta demanda. ¡Únete ahora!',
      });
    } else if (saturationStatus === 'low') {
      recommendations.push({
        type: 'move_to_zone' as const,
        message: 'Zona con baja saturación. Oportunidad de ingresos.',
      });
    } else {
      recommendations.push({
        type: 'move_to_zone' as const,
        message: 'Zona con disponibilidad óptima.',
      });
    }

    return {
      zoneId: zone.id,
      currentDrivers: zone.currentDrivers,
      maxDrivers: zone.maxDrivers,
      saturationLevel: zone.saturationLevel,
      status: saturationStatus,
      waitingList: waitingList.length,
      estimatedWaitTime: waitingList.length > 0 ? waitingList.length * 5 : undefined,
      recommendations,
      lastUpdated: new Date(),
    };
  });

  console.log(`✅ Found ${saturationStatuses.length} zones in radius`);
  return saturationStatuses;
}

export async function getZoneRecommendations(input: GetZoneRecommendationsInput): Promise<{
  recommendedZones: Array<{
    zone: Zone;
    saturationStatus: ZoneSaturationStatus;
    distance: number;
    score: number;
  }>;
}> {
  console.log('🎯 Getting zone recommendations for driver:', input.driverId);

  const allZones = Array.from(zones.values());
  const preferences = input.preferences || {
    prioritizeEarnings: true,
    prioritizeDistance: false,
    minBonusMultiplier: 1,
  };

  const recommendations = allZones
    .map(zone => {
      const distance = calculateDistance(
        input.currentLocation.latitude,
        input.currentLocation.longitude,
        zone.center.latitude,
        zone.center.longitude
      );

      // Skip zones that are too far
      if (distance > input.maxDistance) {
        return null;
      }

      // Skip zones that don't meet bonus requirements
      if (zone.incentives && zone.incentives.bonusMultiplier < preferences.minBonusMultiplier) {
        return null;
      }

      const waitingList = zoneWaitingLists.get(zone.id) || [];
      const saturationStatus = getSaturationStatus(zone.saturationLevel);
      
      const saturationStatusData: ZoneSaturationStatus = {
        zoneId: zone.id,
        currentDrivers: zone.currentDrivers,
        maxDrivers: zone.maxDrivers,
        saturationLevel: zone.saturationLevel,
        status: saturationStatus,
        waitingList: waitingList.length,
        estimatedWaitTime: waitingList.length > 0 ? waitingList.length * 5 : undefined,
        recommendations: [],
        lastUpdated: new Date(),
      };

      // Calculate recommendation score
      let score = 0;
      
      // Earnings factor
      if (preferences.prioritizeEarnings) {
        const bonusMultiplier = zone.incentives?.bonusMultiplier || 1;
        score += bonusMultiplier * 30;
        score += zone.priority * 5;
      }
      
      // Distance factor (closer is better)
      if (preferences.prioritizeDistance) {
        score += Math.max(0, 50 - (distance / 1000) * 2); // Reduce score by 2 per km
      } else {
        score += Math.max(0, 20 - (distance / 1000) * 1); // Smaller distance penalty
      }
      
      // Saturation factor
      if (saturationStatus === 'low') {
        score += 20; // Good opportunity
      } else if (saturationStatus === 'optimal') {
        score += 15; // Balanced
      } else if (saturationStatus === 'high') {
        score += 10; // Still good but competitive
      } else {
        score -= 20; // Saturated, not recommended
      }
      
      // Availability factor
      if (zone.status === 'active') {
        score += 10;
      } else if (zone.status === 'high_demand') {
        score += 25;
      } else {
        score -= 30;
      }

      return {
        zone,
        saturationStatus: saturationStatusData,
        distance: Math.round(distance),
        score: Math.round(score),
      };
    })
    .filter((rec): rec is NonNullable<typeof rec> => rec !== null)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5); // Top 5 recommendations

  console.log(`✅ Generated ${recommendations.length} zone recommendations`);
  return { recommendedZones: recommendations };
}

// ============================================================================
// ZONE ANALYTICS FUNCTIONS
// ============================================================================

export async function getZoneAnalytics(zoneId: string): Promise<{
  zone: Zone;
  analytics: {
    averageDrivers: number;
    peakHours: Array<{ hour: number; drivers: number }>;
    driverTurnover: number;
    totalTripsCompleted: number;
    averageEarningsPerDriver: number;
    topPerformers: Array<{
      driverId: string;
      tripsCompleted: number;
      averageRating: number;
      totalEarnings: number;
    }>;
  };
}> {
  console.log('📈 Getting zone analytics:', zoneId);

  const zone = zones.get(zoneId);
  if (!zone) {
    throw new Error(`Zone not found: ${zoneId}`);
  }

  // Mock analytics data
  const analytics = {
    averageDrivers: Math.round(zone.currentDrivers * 0.8),
    peakHours: [
      { hour: 7, drivers: Math.round(zone.currentDrivers * 1.2) },
      { hour: 8, drivers: Math.round(zone.currentDrivers * 1.5) },
      { hour: 17, drivers: Math.round(zone.currentDrivers * 1.3) },
      { hour: 18, drivers: Math.round(zone.currentDrivers * 1.4) },
    ],
    driverTurnover: 15, // percentage
    totalTripsCompleted: zone.currentDrivers * 12, // mock data
    averageEarningsPerDriver: 150, // mock data in currency
    topPerformers: [
      {
        driverId: 'driver-1',
        tripsCompleted: 25,
        averageRating: 4.8,
        totalEarnings: 320,
      },
      {
        driverId: 'driver-2',
        tripsCompleted: 22,
        averageRating: 4.7,
        totalEarnings: 290,
      },
    ],
  };

  console.log('✅ Zone analytics retrieved');
  return { zone, analytics };
}

// ============================================================================
// AUTOMATIC ZONE MANAGEMENT
// ============================================================================

export async function updateZoneSaturationLevels(): Promise<void> {
  console.log('🔄 Updating zone saturation levels');

  for (const [zoneId, zone] of zones.entries()) {
    const newSaturationLevel = calculateSaturationLevel(zone.currentDrivers, zone.maxDrivers);
    const newStatus = getSaturationStatus(newSaturationLevel);
    
    let statusChanged = false;
    
    if (zone.saturationLevel !== newSaturationLevel || zone.status !== newStatus) {
      zone.saturationLevel = newSaturationLevel;
      
      // Update zone status based on saturation
      if (newStatus === 'saturated' && zone.status !== 'saturated') {
        zone.status = 'saturated';
        statusChanged = true;
      } else if (newStatus === 'low' && zone.status !== 'high_demand') {
        zone.status = 'high_demand';
        statusChanged = true;
      } else if (newStatus === 'optimal' && zone.status === 'saturated') {
        zone.status = 'active';
        statusChanged = true;
      }
      
      zone.updatedAt = new Date();
      zones.set(zoneId, zone);
      
      if (statusChanged) {
        console.log(`📊 Zone ${zone.name} status changed to: ${zone.status}`);
      }
    }
  }

  console.log('✅ Zone saturation levels updated');
}

// Auto-update every 5 minutes
setInterval(updateZoneSaturationLevels, 5 * 60 * 1000);

console.log('🚀 Zone Saturation Service initialized');
console.log(`📍 Loaded ${zones.size} zones`);