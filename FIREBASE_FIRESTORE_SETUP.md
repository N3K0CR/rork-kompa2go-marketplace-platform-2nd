# Firebase Firestore Setup para 2Kommute

## Configuración Completada

### 1. Firebase Configuration
- ✅ Credenciales de producción configuradas en `lib/firebase.ts`
- ✅ Project ID: `kompa2go`
- ✅ Analytics habilitado para web

### 2. Colecciones de Firestore

Las siguientes colecciones se crearán automáticamente cuando se guarden datos:

#### `kommute_routes`
Almacena las rutas de los usuarios.

**Campos principales:**
- `id` (string): ID único de la ruta
- `userId` (string): ID del usuario propietario
- `name` (string): Nombre de la ruta
- `points` (array): Puntos de la ruta (origen, destino, waypoints)
- `transportModes` (array): Modos de transporte disponibles
- `distance` (number): Distancia en metros
- `duration` (number): Duración en segundos
- `status` (string): 'planned' | 'active' | 'completed' | 'cancelled'
- `createdAt` (timestamp): Fecha de creación
- `updatedAt` (timestamp): Última actualización

**Índices requeridos:**
```
Collection: kommute_routes
- userId (Ascending) + createdAt (Descending)
- userId (Ascending) + status (Ascending)
```

#### `kommute_trips`
Almacena los viajes realizados.

**Campos principales:**
- `id` (string): ID único del viaje
- `routeId` (string): ID de la ruta asociada
- `userId` (string): ID del usuario
- `startTime` (timestamp): Hora de inicio
- `endTime` (timestamp): Hora de finalización
- `status` (string): 'planned' | 'in_progress' | 'completed' | 'cancelled'
- `trackingPoints` (array): Puntos de seguimiento GPS
- `actualDistance` (number): Distancia real recorrida
- `actualDuration` (number): Duración real en milisegundos

**Índices requeridos:**
```
Collection: kommute_trips
- userId (Ascending) + startTime (Descending)
- routeId (Ascending) + startTime (Descending)
- userId (Ascending) + status (Ascending)
```

#### `kommute_tracking_points`
Almacena puntos de seguimiento GPS individuales.

**Campos principales:**
- `id` (string): ID único del punto
- `tripId` (string): ID del viaje asociado
- `latitude` (number): Latitud
- `longitude` (number): Longitud
- `timestamp` (timestamp): Momento del registro
- `speed` (number, opcional): Velocidad en m/s
- `accuracy` (number, opcional): Precisión en metros

**Índices requeridos:**
```
Collection: kommute_tracking_points
- tripId (Ascending) + timestamp (Ascending)
```

#### `kommute_trip_chains`
Almacena cadenas de viajes para conductores.

**Campos principales:**
- `id` (string): ID único de la cadena
- `driverId` (string): ID del conductor
- `trips` (array): Array de viajes en la cadena
- `status` (string): 'active' | 'completed' | 'cancelled' | 'paused'
- `totalDistance` (number): Distancia total en metros
- `totalEarnings` (number): Ganancias totales
- `createdAt` (timestamp): Fecha de creación
- `updatedAt` (timestamp): Última actualización

**Índices requeridos:**
```
Collection: kommute_trip_chains
- driverId (Ascending) + createdAt (Descending)
- driverId (Ascending) + status (Ascending)
```

#### `kommute_trip_queue`
Cola de viajes pendientes de asignación.

**Campos principales:**
- `id` (string): ID único de la entrada
- `tripId` (string): ID del viaje
- `passengerId` (string): ID del pasajero
- `pickupLocation` (object): Ubicación de recogida
- `dropoffLocation` (object): Ubicación de destino
- `status` (string): 'queued' | 'matched' | 'expired' | 'cancelled'
- `priority` (number): Prioridad (1-10)
- `expiresAt` (timestamp): Fecha de expiración
- `createdAt` (timestamp): Fecha de creación

**Índices requeridos:**
```
Collection: kommute_trip_queue
- status (Ascending) + expiresAt (Ascending) + priority (Descending)
```

#### `kommute_driver_availability`
Estado de disponibilidad de conductores.

**Campos principales:**
- `driverId` (string): ID del conductor (usado como document ID)
- `currentLocation` (object): Ubicación actual
- `isAcceptingChainedTrips` (boolean): Acepta viajes encadenados
- `maxChainLength` (number): Máximo de viajes en cadena
- `vehicleInfo` (object): Información del vehículo
- `driverRating` (number): Calificación del conductor

**Índices requeridos:**
```
Collection: kommute_driver_availability
- isAcceptingChainedTrips (Ascending)
```

### 3. Reglas de Seguridad de Firestore

Para configurar las reglas de seguridad en Firebase Console:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }
    
    // Routes
    match /kommute_routes/{routeId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated() && request.resource.data.userId == request.auth.uid;
      allow update, delete: if isOwner(resource.data.userId);
    }
    
    // Trips
    match /kommute_trips/{tripId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated() && request.resource.data.userId == request.auth.uid;
      allow update, delete: if isOwner(resource.data.userId);
    }
    
    // Tracking Points
    match /kommute_tracking_points/{pointId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated();
      allow update, delete: if isAuthenticated();
    }
    
    // Trip Chains
    match /kommute_trip_chains/{chainId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated() && request.resource.data.driverId == request.auth.uid;
      allow update, delete: if isOwner(resource.data.driverId);
    }
    
    // Trip Queue
    match /kommute_trip_queue/{entryId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated();
      allow update: if isAuthenticated();
      allow delete: if isAuthenticated();
    }
    
    // Driver Availability
    match /kommute_driver_availability/{driverId} {
      allow read: if isAuthenticated();
      allow write: if isOwner(driverId);
    }
  }
}
```

### 4. Configuración de Índices Compuestos

Para crear los índices en Firebase Console:

1. Ve a Firebase Console > Firestore Database > Indexes
2. Crea los siguientes índices compuestos:

**kommute_routes:**
- Collection ID: `kommute_routes`
  - Field: `userId` (Ascending)
  - Field: `createdAt` (Descending)

**kommute_trips:**
- Collection ID: `kommute_trips`
  - Field: `userId` (Ascending)
  - Field: `startTime` (Descending)

- Collection ID: `kommute_trips`
  - Field: `routeId` (Ascending)
  - Field: `startTime` (Descending)

**kommute_tracking_points:**
- Collection ID: `kommute_tracking_points`
  - Field: `tripId` (Ascending)
  - Field: `timestamp` (Ascending)

**kommute_trip_chains:**
- Collection ID: `kommute_trip_chains`
  - Field: `driverId` (Ascending)
  - Field: `createdAt` (Descending)

**kommute_trip_queue:**
- Collection ID: `kommute_trip_queue`
  - Field: `status` (Ascending)
  - Field: `expiresAt` (Ascending)
  - Field: `priority` (Descending)

**kommute_driver_availability:**
- Collection ID: `kommute_driver_availability`
  - Field: `isAcceptingChainedTrips` (Ascending)

### 5. Características Implementadas

✅ **Persistencia en tiempo real:**
- Sincronización automática de rutas y viajes
- Listeners en tiempo real para actualizaciones
- Manejo de errores y recuperación

✅ **Operaciones CRUD completas:**
- Crear, leer, actualizar y eliminar rutas
- Crear, leer, actualizar y eliminar viajes
- Agregar puntos de seguimiento GPS

✅ **Funcionalidades avanzadas:**
- Trip chaining (encadenamiento de viajes)
- Cola de viajes pendientes
- Disponibilidad de conductores
- Estadísticas de usuario

✅ **Conversión de tipos:**
- Conversión automática entre Date y Timestamp
- Manejo de datos anidados (puntos de ruta, tracking points)
- Soporte para patrones recurrentes

### 6. Uso del Servicio

```typescript
import firestoreService from '@/src/modules/commute/services/firestore-service';

// Crear una ruta
await firestoreService.routes.create(newRoute);

// Suscribirse a rutas del usuario
const unsubscribe = firestoreService.routes.subscribeToUserRoutes(
  userId, 
  (routes) => {
    console.log('Routes updated:', routes);
  }
);

// Crear un viaje
await firestoreService.trips.create(newTrip);

// Agregar punto de seguimiento
await firestoreService.tracking.addPoint(trackingPoint);

// Obtener estadísticas
const stats = await firestoreService.utils.getStats(userId);
```

### 7. Próximos Pasos

1. **Configurar autenticación de Firebase:**
   - Implementar Firebase Authentication
   - Reemplazar 'current_user' con el UID real del usuario

2. **Optimizar consultas:**
   - Implementar paginación para listas grandes
   - Agregar caché local con AsyncStorage

3. **Agregar funciones Cloud:**
   - Limpieza automática de datos antiguos
   - Notificaciones push para eventos importantes
   - Procesamiento de estadísticas en segundo plano

4. **Monitoreo:**
   - Configurar Firebase Analytics
   - Implementar logging de errores
   - Monitorear uso de Firestore

### 8. Consideraciones de Costos

**Firestore Pricing (Free Tier):**
- 50,000 lecturas/día
- 20,000 escrituras/día
- 20,000 eliminaciones/día
- 1 GB de almacenamiento

**Recomendaciones:**
- Usar listeners en tiempo real con moderación
- Implementar caché local para reducir lecturas
- Limpiar datos antiguos periódicamente
- Monitorear uso en Firebase Console

### 9. Testing

Para probar la integración:

1. Habilitar Kommute en la app
2. Crear una ruta de prueba
3. Iniciar un viaje
4. Verificar en Firebase Console que los datos se guardan
5. Probar sincronización en tiempo real con múltiples dispositivos

### 10. Troubleshooting

**Error: Missing or insufficient permissions**
- Verificar reglas de seguridad en Firebase Console
- Asegurarse de que el usuario esté autenticado

**Error: Index not found**
- Crear los índices compuestos necesarios
- Esperar a que los índices se construyan (puede tomar minutos)

**Error: Quota exceeded**
- Revisar uso en Firebase Console
- Implementar caché local
- Optimizar frecuencia de escrituras

## Estado Actual

✅ Firebase configurado con credenciales de producción
✅ Servicio de Firestore implementado
✅ Integración con CommuteContext completada
✅ Sincronización en tiempo real habilitada
⏳ Pendiente: Configurar índices en Firebase Console
⏳ Pendiente: Configurar reglas de seguridad
⏳ Pendiente: Implementar autenticación de Firebase
