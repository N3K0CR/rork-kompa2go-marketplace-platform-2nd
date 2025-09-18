// ============================================================================
// 2KOMMUTE REAL-TIME SERVICE
// ============================================================================
// Servicio de negocio para eventos en tiempo real y notificaciones

import { TRPCError } from '@trpc/server';
import type {
  RealTimeEvent,
  SubscriptionInput,
  Trip,
  Route,
  AddTrackingPointInput
} from './types';

// Tipos para el sistema de eventos
interface EventSubscription {
  id: string;
  userId: string;
  eventTypes: string[];
  filters?: {
    tripIds?: string[];
    teamIds?: string[];
    priority?: string;
  };
  callback: (event: RealTimeEvent) => void;
  createdAt: Date;
}

interface LocationUpdate {
  tripId: string;
  userId: string;
  latitude: number;
  longitude: number;
  timestamp: Date;
  speed?: number;
  accuracy?: number;
  altitude?: number;
}

// Storage en memoria para eventos y suscripciones
const eventSubscriptions: Map<string, EventSubscription> = new Map();
const recentEvents: RealTimeEvent[] = [];
const activeLocationUpdates: Map<string, LocationUpdate[]> = new Map();
const tripAlerts: Map<string, any[]> = new Map();

export class RealTimeService {
  /**
   * Suscribe a un usuario a eventos en tiempo real
   */
  static async subscribe(input: SubscriptionInput): Promise<{ subscriptionId: string }> {
    console.log('📡 Creating real-time subscription for user:', input.userId);

    try {
      const subscriptionId = `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const subscription: EventSubscription = {
        id: subscriptionId,
        userId: input.userId,
        eventTypes: input.eventTypes,
        filters: input.filters,
        callback: (event) => {
          // En producción, esto sería WebSocket o Server-Sent Events
          console.log('📨 Event sent to user:', input.userId, event.type);
        },
        createdAt: new Date(),
      };
      
      eventSubscriptions.set(subscriptionId, subscription);
      
      // Enviar eventos recientes relevantes
      const relevantEvents = this.getRelevantEvents(input.userId, input.eventTypes, input.filters);
      relevantEvents.forEach(event => subscription.callback(event));
      
      return { subscriptionId };
    } catch (error) {
      console.error('❌ Error creating subscription:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to create subscription',
        cause: error,
      });
    }
  }

  /**
   * Cancela una suscripción
   */
  static async unsubscribe(subscriptionId: string): Promise<{ success: boolean }> {
    console.log('🔌 Unsubscribing:', subscriptionId);
    
    const removed = eventSubscriptions.delete(subscriptionId);
    return { success: removed };
  }

  /**
   * Publica un evento a todos los suscriptores relevantes
   */
  static async publishEvent(event: RealTimeEvent): Promise<void> {
    console.log('📢 Publishing event:', event.type, 'for user:', event.userId);
    
    try {
      // Agregar timestamp si no existe
      if (!event.timestamp) {
        event.timestamp = new Date();
      }
      
      // Almacenar evento reciente
      recentEvents.push(event);
      
      // Mantener solo los últimos 1000 eventos
      if (recentEvents.length > 1000) {
        recentEvents.shift();
      }
      
      // Encontrar suscriptores relevantes
      const relevantSubscriptions = this.findRelevantSubscriptions(event);
      
      // Enviar evento a cada suscriptor
      relevantSubscriptions.forEach(subscription => {
        try {
          subscription.callback(event);
        } catch (error) {
          console.error('❌ Error sending event to subscriber:', subscription.id, error);
        }
      });
      
      // Procesar lógica específica del evento
      await this.processEventLogic(event);
      
    } catch (error) {
      console.error('❌ Error publishing event:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to publish event',
        cause: error,
      });
    }
  }

  /**
   * Actualiza la ubicación de un viaje en tiempo real
   */
  static async updateLocation(input: AddTrackingPointInput, userId?: string): Promise<{ success: boolean }> {
    console.log('📍 Updating location for trip:', input.tripId);
    
    try {
      // Validar entrada
      if (!input.tripId || typeof input.latitude !== 'number' || typeof input.longitude !== 'number') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Invalid location data provided',
        });
      }

      // Validar coordenadas
      if (input.latitude < -90 || input.latitude > 90 || input.longitude < -180 || input.longitude > 180) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Invalid coordinates provided',
        });
      }

      const locationUpdate: LocationUpdate = {
        tripId: input.tripId,
        userId: userId || 'unknown', // Se obtendría del contexto de autenticación
        latitude: input.latitude,
        longitude: input.longitude,
        timestamp: input.timestamp || new Date(),
        speed: input.speed,
        accuracy: input.accuracy,
        altitude: input.altitude,
      };
      
      // Almacenar actualización de ubicación
      if (!activeLocationUpdates.has(input.tripId)) {
        activeLocationUpdates.set(input.tripId, []);
      }
      
      const updates = activeLocationUpdates.get(input.tripId)!;
      updates.push(locationUpdate);
      
      // Mantener solo las últimas 100 actualizaciones por viaje
      if (updates.length > 100) {
        updates.shift();
      }
      
      // Detectar anomalías y generar alertas
      await this.detectLocationAnomalies(input.tripId, locationUpdate);
      
      // Publicar evento de actualización de ubicación
      await this.publishEvent({
        id: `loc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'location_update',
        userId: locationUpdate.userId,
        tripId: input.tripId,
        data: {
          latitude: input.latitude,
          longitude: input.longitude,
          speed: input.speed,
          accuracy: input.accuracy,
          timestamp: locationUpdate.timestamp,
        },
        timestamp: new Date(),
        priority: 'low',
      });
      
      return { success: true };
    } catch (error) {
      console.error('❌ Error updating location:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to update location',
        cause: error,
      });
    }
  }

  /**
   * Inicia el tracking de un viaje
   */
  static async startTripTracking(tripId: string, userId: string): Promise<{ success: boolean }> {
    console.log('🚀 Starting trip tracking:', tripId);
    
    try {
      // Publicar evento de inicio de viaje
      await this.publishEvent({
        id: `trip_start_${Date.now()}`,
        type: 'trip_started',
        userId: userId,
        tripId: tripId,
        data: {
          startTime: new Date(),
          trackingEnabled: true,
        },
        timestamp: new Date(),
        priority: 'medium',
      });
      
      // Inicializar array de actualizaciones de ubicación
      activeLocationUpdates.set(tripId, []);
      
      return { success: true };
    } catch (error) {
      console.error('❌ Error starting trip tracking:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to start trip tracking',
        cause: error,
      });
    }
  }

  /**
   * Detiene el tracking de un viaje
   */
  static async stopTripTracking(tripId: string, userId: string): Promise<{ success: boolean }> {
    console.log('🏁 Stopping trip tracking:', tripId);
    
    try {
      // Obtener estadísticas del viaje
      const locationUpdates = activeLocationUpdates.get(tripId) || [];
      const tripStats = this.calculateTripStats(locationUpdates);
      
      // Publicar evento de fin de viaje
      await this.publishEvent({
        id: `trip_end_${Date.now()}`,
        type: 'trip_ended',
        userId: userId,
        tripId: tripId,
        data: {
          endTime: new Date(),
          totalDistance: tripStats.totalDistance,
          totalDuration: tripStats.totalDuration,
          averageSpeed: tripStats.averageSpeed,
          trackingPoints: locationUpdates.length,
        },
        timestamp: new Date(),
        priority: 'medium',
      });
      
      // Limpiar datos de tracking
      activeLocationUpdates.delete(tripId);
      tripAlerts.delete(tripId);
      
      return { success: true };
    } catch (error) {
      console.error('❌ Error stopping trip tracking:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to stop trip tracking',
        cause: error,
      });
    }
  }

  /**
   * Obtiene el estado en tiempo real de un viaje
   */
  static async getTripRealTimeStatus(tripId: string) {
    console.log('📊 Getting real-time status for trip:', tripId);
    
    const locationUpdates = activeLocationUpdates.get(tripId) || [];
    const alerts = tripAlerts.get(tripId) || [];
    const lastUpdate = locationUpdates[locationUpdates.length - 1];
    
    return {
      tripId,
      isActive: locationUpdates.length > 0,
      lastUpdate: lastUpdate ? {
        latitude: lastUpdate.latitude,
        longitude: lastUpdate.longitude,
        timestamp: lastUpdate.timestamp,
        speed: lastUpdate.speed,
        accuracy: lastUpdate.accuracy,
      } : null,
      totalUpdates: locationUpdates.length,
      activeAlerts: alerts.filter(alert => alert.status === 'active'),
      stats: this.calculateTripStats(locationUpdates),
    };
  }

  /**
   * Obtiene eventos recientes para un usuario
   */
  static getRecentEvents(userId: string, limit: number = 50) {
    return recentEvents
      .filter(event => event.userId === userId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  /**
   * Encuentra suscripciones relevantes para un evento
   */
  private static findRelevantSubscriptions(event: RealTimeEvent): EventSubscription[] {
    const relevant: EventSubscription[] = [];
    
    for (const subscription of eventSubscriptions.values()) {
      // Verificar tipo de evento
      if (!subscription.eventTypes.includes(event.type)) {
        continue;
      }
      
      // Verificar filtros
      if (subscription.filters) {
        const { tripIds, teamIds, priority } = subscription.filters;
        
        if (tripIds && event.tripId && !tripIds.includes(event.tripId)) {
          continue;
        }
        
        if (teamIds && event.teamId && !teamIds.includes(event.teamId)) {
          continue;
        }
        
        if (priority && event.priority !== priority) {
          continue;
        }
      }
      
      // Verificar si el usuario debe recibir este evento
      if (this.shouldUserReceiveEvent(subscription.userId, event)) {
        relevant.push(subscription);
      }
    }
    
    return relevant;
  }

  /**
   * Determina si un usuario debe recibir un evento específico
   */
  private static shouldUserReceiveEvent(userId: string, event: RealTimeEvent): boolean {
    // El usuario siempre recibe sus propios eventos
    if (event.userId === userId) {
      return true;
    }
    
    // Lógica adicional para eventos de equipo, etc.
    if (event.teamId) {
      // Verificar si el usuario es miembro del equipo
      // En producción, esto consultaría la base de datos
      return true; // Simplificado
    }
    
    return false;
  }

  /**
   * Obtiene eventos relevantes para un usuario
   */
  private static getRelevantEvents(
    userId: string,
    eventTypes: string[],
    filters?: SubscriptionInput['filters']
  ): RealTimeEvent[] {
    return recentEvents.filter(event => {
      // Verificar tipo de evento
      if (!eventTypes.includes(event.type)) {
        return false;
      }
      
      // Verificar si el usuario debe recibir este evento
      if (!this.shouldUserReceiveEvent(userId, event)) {
        return false;
      }
      
      // Aplicar filtros adicionales
      if (filters) {
        const { tripIds, teamIds, priority } = filters;
        
        if (tripIds && event.tripId && !tripIds.includes(event.tripId)) {
          return false;
        }
        
        if (teamIds && event.teamId && !teamIds.includes(event.teamId)) {
          return false;
        }
        
        if (priority && event.priority !== priority) {
          return false;
        }
      }
      
      return true;
    }).slice(-10); // Últimos 10 eventos relevantes
  }

  /**
   * Procesa lógica específica para cada tipo de evento
   */
  private static async processEventLogic(event: RealTimeEvent): Promise<void> {
    switch (event.type) {
      case 'trip_started':
        // Lógica para inicio de viaje
        console.log('🚀 Processing trip start logic for:', event.tripId);
        break;
        
      case 'trip_ended':
        // Lógica para fin de viaje
        console.log('🏁 Processing trip end logic for:', event.tripId);
        break;
        
      case 'route_deviation':
        // Lógica para desviación de ruta
        console.log('🛣️ Processing route deviation for:', event.tripId);
        await this.handleRouteDeviation(event);
        break;
        
      case 'delay_detected':
        // Lógica para retraso detectado
        console.log('⏰ Processing delay detection for:', event.tripId);
        await this.handleDelayDetection(event);
        break;
        
      case 'emergency_alert':
        // Lógica para alerta de emergencia
        console.log('🚨 Processing emergency alert for:', event.userId);
        await this.handleEmergencyAlert(event);
        break;
    }
  }

  /**
   * Detecta anomalías en las actualizaciones de ubicación
   */
  private static async detectLocationAnomalies(tripId: string, update: LocationUpdate): Promise<void> {
    const updates = activeLocationUpdates.get(tripId) || [];
    
    if (updates.length < 2) return; // Necesitamos al menos 2 puntos
    
    const previousUpdate = updates[updates.length - 2];
    
    // Detectar velocidad excesiva
    if (update.speed && update.speed > 120) { // > 120 km/h
      await this.publishEvent({
        id: `speed_alert_${Date.now()}`,
        type: 'emergency_alert',
        userId: update.userId,
        tripId: tripId,
        data: {
          alertType: 'excessive_speed',
          speed: update.speed,
          location: { latitude: update.latitude, longitude: update.longitude },
        },
        timestamp: new Date(),
        priority: 'high',
      });
    }
    
    // Detectar parada prolongada
    const timeDiff = update.timestamp.getTime() - previousUpdate.timestamp.getTime();
    const distance = this.calculateDistance(
      { latitude: previousUpdate.latitude, longitude: previousUpdate.longitude },
      { latitude: update.latitude, longitude: update.longitude }
    );
    
    if (timeDiff > 10 * 60 * 1000 && distance < 50) { // 10 min sin moverse > 50m
      await this.publishEvent({
        id: `stop_alert_${Date.now()}`,
        type: 'delay_detected',
        userId: update.userId,
        tripId: tripId,
        data: {
          alertType: 'prolonged_stop',
          duration: timeDiff,
          location: { latitude: update.latitude, longitude: update.longitude },
        },
        timestamp: new Date(),
        priority: 'medium',
      });
    }
  }

  /**
   * Calcula estadísticas de un viaje basado en actualizaciones de ubicación
   */
  private static calculateTripStats(updates: LocationUpdate[]) {
    if (updates.length === 0) {
      return {
        totalDistance: 0,
        totalDuration: 0,
        averageSpeed: 0,
        maxSpeed: 0,
      };
    }
    
    let totalDistance = 0;
    let maxSpeed = 0;
    const speeds: number[] = [];
    
    for (let i = 1; i < updates.length; i++) {
      const prev = updates[i - 1];
      const curr = updates[i];
      
      // Calcular distancia
      const distance = this.calculateDistance(
        { latitude: prev.latitude, longitude: prev.longitude },
        { latitude: curr.latitude, longitude: curr.longitude }
      );
      totalDistance += distance;
      
      // Registrar velocidades
      if (curr.speed) {
        speeds.push(curr.speed);
        maxSpeed = Math.max(maxSpeed, curr.speed);
      }
    }
    
    const totalDuration = updates.length > 0 ?
      updates[updates.length - 1].timestamp.getTime() - updates[0].timestamp.getTime() :
      0;
    
    const averageSpeed = speeds.length > 0 ?
      speeds.reduce((sum, speed) => sum + speed, 0) / speeds.length :
      0;
    
    return {
      totalDistance: Math.round(totalDistance),
      totalDuration: Math.round(totalDuration / 1000), // en segundos
      averageSpeed: Math.round(averageSpeed * 10) / 10,
      maxSpeed: Math.round(maxSpeed * 10) / 10,
    };
  }

  /**
   * Calcula distancia entre dos puntos
   */
  private static calculateDistance(
    point1: { latitude: number; longitude: number },
    point2: { latitude: number; longitude: number }
  ): number {
    const R = 6371e3; // Radio de la Tierra en metros
    const φ1 = point1.latitude * Math.PI / 180;
    const φ2 = point2.latitude * Math.PI / 180;
    const Δφ = (point2.latitude - point1.latitude) * Math.PI / 180;
    const Δλ = (point2.longitude - point1.longitude) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
  }

  /**
   * Maneja desviaciones de ruta
   */
  private static async handleRouteDeviation(event: RealTimeEvent): Promise<void> {
    // Lógica para manejar desviaciones de ruta
    console.log('🛣️ Handling route deviation:', event.data);
  }

  /**
   * Maneja detección de retrasos
   */
  private static async handleDelayDetection(event: RealTimeEvent): Promise<void> {
    // Lógica para manejar retrasos
    console.log('⏰ Handling delay detection:', event.data);
  }

  /**
   * Maneja alertas de emergencia
   */
  private static async handleEmergencyAlert(event: RealTimeEvent): Promise<void> {
    // Lógica para manejar emergencias
    console.log('🚨 Handling emergency alert:', event.data);
  }

  /**
   * Obtiene estadísticas del servicio en tiempo real
   */
  static getRealTimeStats() {
    return {
      activeSubscriptions: eventSubscriptions.size,
      recentEventsCount: recentEvents.length,
      activeTripsTracking: activeLocationUpdates.size,
      totalLocationUpdates: Array.from(activeLocationUpdates.values())
        .reduce((sum, updates) => sum + updates.length, 0),
      lastEventTime: recentEvents.length > 0 ?
        recentEvents[recentEvents.length - 1].timestamp :
        null,
    };
  }
}