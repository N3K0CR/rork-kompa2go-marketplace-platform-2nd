# Google Places Proxy - Implementación Completada

## 🎯 Problema Resuelto
Error "blocked by CORS policy" al intentar buscar destinos desde el frontend web. Las APIs de Google Maps no permiten llamadas directas desde el navegador por motivos de seguridad.

## ✅ Solución Implementada

### Backend (tRPC Proxy)
Se crearon 3 nuevos endpoints en el backend que actúan como proxy:

#### 1. `commute.searchPlaces` - Búsqueda de lugares
- **Ubicación**: `backend/trpc/routes/commute/routes.ts` (línea 1377)
- **Tipo**: Query
- **Input**: 
  - `query`: string (texto de búsqueda)
  - `location`: { latitude, longitude } (opcional)
  - `radius`: number (opcional, default: 50000)
  - `language`: string (opcional, default: 'es')
- **Output**: Lista de predicciones con place_id, description, structured_formatting
- **Función**: Llama a Google Places Autocomplete API desde el servidor

#### 2. `commute.getPlaceDetails` - Detalles de un lugar
- **Ubicación**: `backend/trpc/routes/commute/routes.ts` (línea 1484)
- **Tipo**: Query
- **Input**:
  - `placeId`: string
  - `language`: string (opcional, default: 'es')
- **Output**: Detalles completos del lugar (coordenadas, dirección, nombre)
- **Función**: Obtiene información detallada de un place_id específico

#### 3. `commute.reverseGeocode` - Coordenadas a dirección
- **Ubicación**: `backend/trpc/routes/commute/routes.ts` (línea 1560)
- **Tipo**: Query
- **Input**:
  - `latitude`: number
  - `longitude`: number
  - `language`: string (opcional, default: 'es')
- **Output**: Dirección formateada como string
- **Función**: Convierte coordenadas geográficas en una dirección legible

### Frontend (Actualización del Hook)

#### Hook `useDestinationSearch`
- **Ubicación**: `src/modules/commute/hooks/useDestinationSearch.ts`
- **Cambios**:
  - ❌ **Antes**: Llamaba directamente a `PlacesService.searchDestination()` que hacía fetch a Google
  - ✅ **Ahora**: Usa `trpcClient.commute.searchPlaces.query()` que llama al backend
  - Mantiene la misma interfaz pública (no requiere cambios en los componentes)
  - Incluye manejo de cancelación de búsquedas con AbortController

#### Servicio `PlacesService`
- **Ubicación**: `src/modules/commute/services/places-service.ts`
- **Cambios**:
  - Eliminada función `searchDestination()` (ahora se usa el hook directamente)
  - `getPlaceDetails()`: Ahora usa `trpcClient.commute.getPlaceDetails.query()`
  - `reverseGeocode()`: Ahora usa `trpcClient.commute.reverseGeocode.query()`
  - Todas las llamadas ahora pasan por el backend tRPC

### Registro de Rutas
- **Ubicación**: `backend/trpc/app-router.ts` (líneas 131-134)
- Las 3 nuevas rutas están registradas en el router principal de tRPC

## 🔐 Seguridad
- ✅ La API Key de Google Maps solo se usa en el servidor (no se expone al cliente)
- ✅ Las peticiones pasan por autenticación de tRPC (protectedProcedure)
- ✅ No hay problemas de CORS porque todas las llamadas son servidor-a-servidor

## 📊 Flujo de Datos

```
Usuario escribe → 
  useDestinationSearch (hook) → 
    trpcClient.commute.searchPlaces → 
      Backend tRPC → 
        Google Places API → 
          Respuesta → 
            Frontend
```

## 🧪 Pruebas
Para verificar que funciona:
1. Abre la app en el navegador
2. Ve a la pantalla de búsqueda de viaje (`/commute/search`)
3. Escribe una dirección en el campo de origen o destino
4. Deberías ver sugerencias sin errores de CORS
5. Revisa la consola del navegador - deberías ver:
   - `🔍 Frontend: Buscando destino vía tRPC: [tu búsqueda]`
   - `✅ Frontend: Resultados recibidos: [número de resultados]`
6. Revisa la consola del servidor - deberías ver:
   - `🔍 Backend: Buscando lugares para: [tu búsqueda]`
   - `✅ Backend: Respuesta recibida: { status: 'OK', results: X }`

## 📝 Archivos Modificados

### Creados/Modificados
- ✅ `backend/trpc/routes/commute/routes.ts` - 3 nuevos procedures
- ✅ `backend/trpc/app-router.ts` - Registro de rutas
- ✅ `src/modules/commute/hooks/useDestinationSearch.ts` - Actualizado para usar tRPC
- ✅ `src/modules/commute/services/places-service.ts` - Simplificado para usar tRPC

### Sin Cambios Requeridos
- ✅ `components/commute/DestinationSearchInput.tsx` - Compatible con la nueva implementación
- ✅ `app/commute/search.tsx` - Compatible con la nueva implementación

## ⚡ Beneficios
1. **Sin CORS**: Todas las llamadas son servidor-a-servidor
2. **Seguridad**: API Key protegida en el backend
3. **Caché**: tRPC puede implementar caché automático
4. **Type Safety**: TypeScript end-to-end
5. **Logs**: Visibilidad completa del flujo de datos
6. **Fácil Debugging**: Console logs en frontend y backend

## 🚀 Próximos Pasos
La implementación está lista. Solo necesitas:
1. Asegurarte de que el backend esté corriendo
2. Verificar que `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` esté en `.env.local` o `.env`
3. Probar la búsqueda de destinos en la app

---
**Status**: ✅ Implementación Completada  
**Fecha**: 2025-01-04  
**Problema Original**: CORS error en Google Places API  
**Solución**: Proxy tRPC en el backend
