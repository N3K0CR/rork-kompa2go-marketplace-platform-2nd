# Google Maps Destination Search Implementation

## ✅ Implementación Completada

Se ha implementado exitosamente la búsqueda de destinos usando Google Maps Places API, reemplazando el sistema anterior basado en tRPC.

## 📁 Archivos Creados/Modificados

### Nuevos Archivos

1. **`lib/google-maps.ts`**
   - Configuración de API Keys por plataforma (iOS, Android, Web)
   - Validación de configuración
   - Constantes regionales para Costa Rica

2. **`src/modules/commute/services/places-service.ts`**
   - Servicio completo de Google Places API
   - Búsqueda de destinos con autocomplete
   - Obtención de detalles de lugares
   - Geocoding reverso (coordenadas → dirección)
   - Manejo robusto de errores y timeouts
   - Cancelación de búsquedas pendientes

3. **`hooks/useDebounce.ts`**
   - Hook para debounce de valores
   - Retrasa actualizaciones hasta que el usuario deje de escribir
   - Delay configurable (default: 500ms)

4. **`src/modules/commute/hooks/useDestinationSearch.ts`**
   - Hook personalizado para búsqueda de destinos
   - Gestión de estado (results, loading, error)
   - Integración con PlacesService
   - Limpieza automática al desmontar

5. **`components/commute/DestinationSearchInput.tsx`**
   - Componente reutilizable de búsqueda
   - Input con debounce automático
   - Lista de resultados con scroll
   - Indicadores de carga y error
   - Botón para limpiar búsqueda

### Archivos Modificados

1. **`app/commute/search.tsx`**
   - Integración del nuevo componente `DestinationSearchInput`
   - Uso de Google Maps para geocoding reverso
   - Eliminación de código obsoleto de tRPC
   - Obtención automática de ubicación del usuario

## 🔧 Configuración Requerida

### 1. Variables de Entorno

Agregar en `.env.local`:

```bash
# Google Maps API Key (requerido)
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=TU_API_KEY_AQUI

# Opcional: Keys específicas por plataforma
# EXPO_PUBLIC_GOOGLE_MAPS_IOS_KEY=tu_key_ios
# EXPO_PUBLIC_GOOGLE_MAPS_ANDROID_KEY=tu_key_android
# EXPO_PUBLIC_GOOGLE_MAPS_WEB_KEY=tu_key_web
```

### 2. Google Cloud Console

1. **Ir a**: https://console.cloud.google.com/
2. **Crear/Seleccionar proyecto**
3. **Habilitar APIs**:
   - ✅ Places API
   - ✅ Geocoding API
   - ✅ Maps SDK for Android (si usas Android)
   - ✅ Maps SDK for iOS (si usas iOS)

4. **Crear API Key**:
   - APIs & Services → Credentials
   - Create Credentials → API Key
   - Copiar la key

5. **Configurar Restricciones** (Producción):
   - **Application restrictions**: Seleccionar plataformas
   - **API restrictions**: Solo las APIs necesarias

6. **Para Desarrollo**:
   - Dejar sin restricciones temporalmente

## 🚀 Características Implementadas

### Búsqueda de Destinos
- ✅ Autocomplete con Google Places API
- ✅ Debounce de 500ms para optimizar requests
- ✅ Cancelación automática de búsquedas anteriores
- ✅ Timeout de 10 segundos
- ✅ Bias de ubicación del usuario
- ✅ Filtrado por país (Costa Rica)
- ✅ Resultados en español

### Manejo de Errores
- ✅ Mensajes de error amigables
- ✅ Manejo de errores de red
- ✅ Manejo de timeouts
- ✅ Manejo de límites de API
- ✅ Fallback con coordenadas si falla geocoding

### UX/UI
- ✅ Indicador de carga durante búsqueda
- ✅ Botón para limpiar búsqueda
- ✅ Lista de resultados con scroll
- ✅ Selección de resultado actualiza el input
- ✅ Diseño responsive y accesible

## 📊 Flujo de Búsqueda

```
Usuario escribe → Debounce (500ms) → PlacesService.searchDestination()
                                              ↓
                                    Google Places API
                                              ↓
                                    Resultados filtrados
                                              ↓
                                    Lista de sugerencias
                                              ↓
Usuario selecciona → PlacesService.getPlaceDetails()
                                              ↓
                                    Detalles completos
                                              ↓
                                    Callback con lugar seleccionado
```

## 🔍 Ejemplo de Uso

```typescript
import { DestinationSearchInput } from '@/components/commute/DestinationSearchInput';
import { PlaceDetails } from '@/src/modules/commute/services/places-service';

function MyScreen() {
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number }>();

  const handleSelectDestination = (place: PlaceDetails) => {
    console.log('Destino seleccionado:', {
      name: place.name,
      address: place.formatted_address,
      lat: place.geometry.location.lat,
      lng: place.geometry.location.lng,
    });
  };

  return (
    <DestinationSearchInput
      onSelectDestination={handleSelectDestination}
      placeholder="¿A dónde vas?"
      userLocation={userLocation}
    />
  );
}
```

## 🐛 Solución de Problemas

### Error: "Failed to fetch"
- **Causa**: No hay conexión a internet o API Key inválida
- **Solución**: Verificar conexión y API Key en `.env.local`

### Error: "REQUEST_DENIED"
- **Causa**: API Key sin permisos o Places API no habilitada
- **Solución**: Habilitar Places API en Google Cloud Console

### Error: "OVER_QUERY_LIMIT"
- **Causa**: Límite de consultas excedido
- **Solución**: Esperar o aumentar límite en Google Cloud Console

### Los resultados no se mantienen en pantalla
- **Causa**: El componente se desmonta o el estado se limpia
- **Solución**: Los resultados se limpian automáticamente al seleccionar un lugar (comportamiento esperado)

## 📝 Notas Importantes

1. **Debounce**: El componente espera 500ms después de que el usuario deje de escribir antes de hacer la búsqueda
2. **Cancelación**: Las búsquedas anteriores se cancelan automáticamente cuando se inicia una nueva
3. **Timeout**: Las búsquedas tienen un timeout de 10 segundos
4. **Limpieza**: El componente limpia recursos automáticamente al desmontarse
5. **Ubicación**: Si se proporciona la ubicación del usuario, los resultados se ordenan por proximidad

## ✅ Persistencia de Datos

### Estado Actual
La persistencia ya está correctamente implementada en el proyecto:

1. **Kommuter Panel**:
   - ✅ Promociones y colaboraciones se cargan desde Firestore
   - ✅ Los switches actualizan Firestore al cambiar
   - ✅ El estado persiste entre sesiones

2. **Admin Context**:
   - ✅ Maneja errores de permisos gracefully
   - ✅ Usa métricas por defecto si no hay acceso
   - ✅ El error de "permission-denied" es solo informativo

### Verificación
Para verificar que la persistencia funciona:

1. Abrir Kommuter Panel
2. Cambiar el estado de una promoción/colaboración
3. Verificar en consola: `[KommuterPanel] Promotion toggled: <id> <value>`
4. Recargar la página
5. El estado debe mantenerse

Si el estado no persiste:
- Verificar que hay datos en Firestore (`kommuter_promotions` y `brand_collaborations`)
- Verificar permisos de Firestore
- Revisar logs de consola para errores

## 🚀 Próximos Pasos

1. **Obtener API Key de Google Maps**
2. **Configurar en `.env.local`**
3. **Habilitar APIs en Google Cloud Console**
4. **Probar búsqueda de destinos**
5. **Configurar restricciones de API Key para producción**

## 📞 Soporte

Si encuentras problemas:
1. Verificar logs de consola
2. Verificar configuración de API Key
3. Verificar que Places API está habilitada
4. Verificar conexión a internet
