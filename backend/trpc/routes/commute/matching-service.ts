// ============================================================================
// 2KOMMUTE MATCHING SERVICE
// ============================================================================
// Servicio de negocio para matching inteligente de rutas y carpooling

import { TRPCError } from '@trpc/server';
import type {
  MatchingRequest,
  MatchingResponse,
  Route,
  RoutePoint,
  TransportMode,
  Trip,
  TeamTransport
} from './types';

// Mock data for transport modes
const TRANSPORT_MODES: TransportMode[] = [
  {
    id: 'walking',
    name: 'Caminar',
    icon: 'walk',
    color: '#4CAF50',
    carbonFactor: 0,
    costFactor: 0,
    speedFactor: 5,
    available: true,
  },
  {
    id: 'bicycle',
    name: 'Bicicleta',
    icon: 'bike',
    color: '#2196F3',
    carbonFactor: 0,
    costFactor: 0,
    speedFactor: 15,
    available: true,
  },
  {
    id: 'public_transport',
    name: 'Transporte Público',
    icon: 'bus',
    color: '#FF9800',
    carbonFactor: 0.05,
    costFactor: 0.5,
    speedFactor: 25,
    available: true,
  },
  {
    id: 'car_solo',
    name: 'Auto Personal',
    icon: 'car',
    color: '#F44336',
    carbonFactor: 0.2,
    costFactor: 1.2,
    speedFactor: 40,
    available: true,
  },
  {
    id: 'car_shared',
    name: 'Auto Compartido',
    icon: 'users',
    color: '#9C27B0',
    carbonFactor: 0.1,
    costFactor: 0.6,
    speedFactor: 35,
    available: true,
  },
  {
    id: 'motorcycle',
    name: 'Motocicleta',
    icon: 'bike',
    color: '#607D8B',
    carbonFactor: 0.08,
    costFactor: 0.4,
    speedFactor: 45,
    available: true,
  },
];

// Mock database for active routes and trips
const activeRoutes: Map<string, Route> = new Map();
const activeTrips: Map<string, Trip> = new Map();
const teamTransports: Map<string, TeamTransport> = new Map();

export class MatchingService {
  /**
   * Encuentra matches para una solicitud de viaje
   */
  static async findMatches(request: MatchingRequest): Promise<MatchingResponse> {
    console.log('🔍 Finding matches for request:', request);

    try {
      // Obtener la ruta del usuario
      const userRoute = activeRoutes.get(request.routeId);
      if (!userRoute) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Route not found',
        });
      }

      // Buscar matches directos (misma ruta)
      const directMatches = await this.findDirectMatches(request, userRoute);
      
      // Buscar matches de carpooling
      const carpoolMatches = await this.findCarpoolMatches(request, userRoute);
      
      // Buscar alternativas de transporte público
      const publicTransportAlternatives = await this.findPublicTransportAlternatives(userRoute);
      
      // Combinar y rankear resultados
      const allMatches = [...directMatches, ...carpoolMatches];
      const rankedMatches = this.rankMatches(allMatches, request.preferences);
      
      return {
        matches: rankedMatches.slice(0, 5), // Top 5 matches
        alternatives: publicTransportAlternatives,
      };
    } catch (error) {
      console.error('❌ Error finding matches:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to find matches',
        cause: error,
      });
    }
  }

  /**
   * Busca matches directos (misma ruta exacta)
   */
  private static async findDirectMatches(request: MatchingRequest, userRoute: Route) {
    const matches = [];
    const timeWindow = request.flexibility?.timeWindow || 30; // minutes
    
    for (const [routeId, route] of activeRoutes) {
      if (routeId === request.routeId) continue;
      
      // Verificar si las rutas son similares
      if (this.areRoutesSimilar(userRoute, route)) {
        // Buscar trips activos en esa ruta
        const activeTripsForRoute = Array.from(activeTrips.values())
          .filter(trip => trip.routeId === routeId && trip.status === 'planned');
        
        for (const trip of activeTripsForRoute) {
          const timeDiff = Math.abs(
            trip.startTime.getTime() - request.departureTime.getTime()
          ) / (1000 * 60); // minutes
          
          if (timeDiff <= timeWindow) {
            matches.push({
              id: `direct_${trip.id}`,
              type: 'direct_route' as const,
              route: route,
              participants: [
                {
                  userId: trip.userId,
                  role: 'driver' as const,
                  pickupPoint: route.points[0],
                  dropoffPoint: route.points[route.points.length - 1],
                },
                {
                  userId: request.userId,
                  role: 'passenger' as const,
                  pickupPoint: userRoute.points[0],
                  dropoffPoint: userRoute.points[userRoute.points.length - 1],
                }
              ],
              estimatedCost: route.estimatedCost / 2, // Split cost
              estimatedDuration: route.duration,
              carbonFootprint: route.carbonFootprint / 2, // Shared emissions
              confidence: 0.9 - (timeDiff / timeWindow) * 0.2,
              availableUntil: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
            });
          }
        }
      }
    }
    
    return matches;
  }

  /**
   * Busca matches de carpooling (rutas parcialmente compatibles)
   */
  private static async findCarpoolMatches(request: MatchingRequest, userRoute: Route) {
    const matches = [];
    const maxDetour = request.flexibility?.maxDetour || 2000; // meters
    
    for (const [routeId, route] of activeRoutes) {
      if (routeId === request.routeId) continue;
      
      // Verificar si hay overlap en las rutas
      const overlap = this.calculateRouteOverlap(userRoute, route);
      if (overlap.percentage > 0.6) { // 60% overlap minimum
        const activeTripsForRoute = Array.from(activeTrips.values())
          .filter(trip => trip.routeId === routeId && trip.status === 'planned');
        
        for (const trip of activeTripsForRoute) {
          const detour = this.calculateDetour(route, userRoute.points[0], userRoute.points[userRoute.points.length - 1]);
          
          if (detour <= maxDetour) {
            matches.push({
              id: `carpool_${trip.id}`,
              type: 'shared_ride' as const,
              route: this.createOptimizedRoute(route, userRoute),
              participants: [
                {
                  userId: trip.userId,
                  role: 'driver' as const,
                  pickupPoint: route.points[0],
                  dropoffPoint: route.points[route.points.length - 1],
                },
                {
                  userId: request.userId,
                  role: 'passenger' as const,
                  pickupPoint: userRoute.points[0],
                  dropoffPoint: userRoute.points[userRoute.points.length - 1],
                }
              ],
              estimatedCost: (route.estimatedCost + detour * 0.001) / 2,
              estimatedDuration: route.duration + (detour / 1000) * 2, // 2 min per km detour
              carbonFootprint: (route.carbonFootprint + detour * 0.0001) / 2,
              confidence: 0.7 * overlap.percentage,
              availableUntil: new Date(Date.now() + 20 * 60 * 1000), // 20 minutes
            });
          }
        }
      }
    }
    
    return matches;
  }

  /**
   * Busca alternativas de transporte público
   */
  private static async findPublicTransportAlternatives(route: Route) {
    const alternatives = [];
    
    // Simular alternativa de transporte público
    const publicTransportMode = TRANSPORT_MODES.find(m => m.id === 'public_transport');
    if (publicTransportMode) {
      alternatives.push({
        type: 'public_transport' as const,
        estimatedCost: route.distance * publicTransportMode.costFactor / 1000,
        estimatedDuration: (route.distance / 1000) / publicTransportMode.speedFactor * 3600,
        carbonFootprint: route.distance * publicTransportMode.carbonFactor / 1000,
        instructions: [
          'Caminar hasta la parada más cercana',
          'Tomar el autobús línea 123',
          'Transferir en la estación central',
          'Caminar hasta el destino final'
        ],
      });
    }
    
    // Simular alternativa de bicicleta
    const bicycleMode = TRANSPORT_MODES.find(m => m.id === 'bicycle');
    if (bicycleMode && route.distance < 10000) { // Solo para distancias < 10km
      alternatives.push({
        type: 'bike_share' as const,
        estimatedCost: 2.5, // Costo fijo de bike share
        estimatedDuration: (route.distance / 1000) / bicycleMode.speedFactor * 3600,
        carbonFootprint: 0,
        instructions: [
          'Localizar estación de bicicletas más cercana',
          'Desbloquear bicicleta con la app',
          'Seguir ruta ciclista recomendada',
          'Devolver bicicleta en estación de destino'
        ],
      });
    }
    
    return alternatives;
  }

  /**
   * Rankea los matches según las preferencias del usuario
   */
  private static rankMatches(matches: any[], preferences?: MatchingRequest['preferences']) {
    if (!preferences) return matches;
    
    return matches.sort((a, b) => {
      let scoreA = 0;
      let scoreB = 0;
      
      // Priorizar tiempo
      if (preferences.prioritizeTime) {
        scoreA += (1 / a.estimatedDuration) * 1000;
        scoreB += (1 / b.estimatedDuration) * 1000;
      }
      
      // Priorizar costo
      if (preferences.prioritizeCost) {
        scoreA += (1 / (a.estimatedCost + 1)) * 100;
        scoreB += (1 / (b.estimatedCost + 1)) * 100;
      }
      
      // Priorizar carbono
      if (preferences.prioritizeCarbonSaving) {
        scoreA += (1 / (a.carbonFootprint + 0.1)) * 50;
        scoreB += (1 / (b.carbonFootprint + 0.1)) * 50;
      }
      
      // Factor de confianza
      scoreA += a.confidence * 20;
      scoreB += b.confidence * 20;
      
      return scoreB - scoreA;
    });
  }

  /**
   * Verifica si dos rutas son similares
   */
  private static areRoutesSimilar(route1: Route, route2: Route): boolean {
    const origin1 = route1.points[0];
    const dest1 = route1.points[route1.points.length - 1];
    const origin2 = route2.points[0];
    const dest2 = route2.points[route2.points.length - 1];
    
    const originDistance = this.calculateDistance(origin1, origin2);
    const destDistance = this.calculateDistance(dest1, dest2);
    
    // Considerar similares si origen y destino están a menos de 500m
    return originDistance < 500 && destDistance < 500;
  }

  /**
   * Calcula el overlap entre dos rutas
   */
  private static calculateRouteOverlap(route1: Route, route2: Route) {
    // Implementación simplificada
    // En producción, usaríamos algoritmos más sofisticados
    const similarity = this.areRoutesSimilar(route1, route2) ? 0.8 : 0.3;
    
    return {
      percentage: similarity,
      sharedDistance: route1.distance * similarity,
      sharedPoints: [],
    };
  }

  /**
   * Calcula el detour necesario para recoger/dejar pasajero
   */
  private static calculateDetour(originalRoute: Route, pickupPoint: RoutePoint, dropoffPoint: RoutePoint): number {
    // Implementación simplificada
    // En producción, usaríamos APIs de routing reales
    const pickupDetour = this.calculateDistance(
      originalRoute.points[0],
      pickupPoint
    );
    const dropoffDetour = this.calculateDistance(
      originalRoute.points[originalRoute.points.length - 1],
      dropoffPoint
    );
    
    return pickupDetour + dropoffDetour;
  }

  /**
   * Crea una ruta optimizada combinando dos rutas
   */
  private static createOptimizedRoute(baseRoute: Route, additionalRoute: Route): Route {
    // Implementación simplificada
    // En producción, optimizaríamos la ruta real
    return {
      ...baseRoute,
      points: [
        ...baseRoute.points,
        additionalRoute.points[0], // pickup
        additionalRoute.points[additionalRoute.points.length - 1], // dropoff
      ],
      distance: baseRoute.distance + 1000, // Estimación
      duration: baseRoute.duration + 300, // +5 minutos
      estimatedCost: baseRoute.estimatedCost + 2,
      carbonFootprint: baseRoute.carbonFootprint + 0.2,
    };
  }

  /**
   * Calcula la distancia entre dos puntos usando fórmula de Haversine
   */
  private static calculateDistance(point1: RoutePoint, point2: RoutePoint): number {
    const R = 6371e3; // Radio de la Tierra en metros
    const φ1 = point1.latitude * Math.PI / 180;
    const φ2 = point2.latitude * Math.PI / 180;
    const Δφ = (point2.latitude - point1.latitude) * Math.PI / 180;
    const Δλ = (point2.longitude - point1.longitude) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c; // Distancia en metros
  }

  /**
   * Métodos para gestión de datos mock (en producción serían llamadas a BD)
   */
  static addRoute(route: Route): void {
    activeRoutes.set(route.id, route);
    console.log('📍 Route added to matching pool:', route.id);
  }

  static removeRoute(routeId: string): void {
    activeRoutes.delete(routeId);
    console.log('🗑️ Route removed from matching pool:', routeId);
  }

  static addTrip(trip: Trip): void {
    activeTrips.set(trip.id, trip);
    console.log('🚗 Trip added to matching pool:', trip.id);
  }

  static removeTrip(tripId: string): void {
    activeTrips.delete(tripId);
    console.log('🏁 Trip removed from matching pool:', tripId);
  }

  static getActiveRoutes(): Route[] {
    return Array.from(activeRoutes.values());
  }

  static getActiveTrips(): Trip[] {
    return Array.from(activeTrips.values());
  }

  /**
   * Obtiene estadísticas del servicio de matching
   */
  static getMatchingStats() {
    return {
      activeRoutes: activeRoutes.size,
      activeTrips: activeTrips.size,
      activeTeams: teamTransports.size,
      transportModes: TRANSPORT_MODES.length,
      lastUpdate: new Date(),
    };
  }
}