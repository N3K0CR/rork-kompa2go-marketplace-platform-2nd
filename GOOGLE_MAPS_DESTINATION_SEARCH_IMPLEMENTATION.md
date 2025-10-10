# ✅ Implementación Completa: Búsqueda de Destinos con Google Maps y Negociación de Precios

## 📋 Resumen

Se ha implementado exitosamente:

1. **Sistema de búsqueda de destinos con Google Maps Places API**
2. **Sistema de negociación de precios competitivo con Uber**
3. **Integración completa con el backend tRPC**
4. **Componentes de UI listos para usar**

---

## 🗺️ Google Maps Places API

### Archivos Creados/Actualizados

#### 1. `lib/google-maps.ts`
- Configuración de API Keys por plataforma
- Validación de configuración
- Configuración regional para Costa Rica

#### 2. `src/modules/commute/services/places-service.ts`
- `searchDestination()` - Búsqueda con autocomplete
- `getPlaceDetails()` - Detalles de un lugar específico
- `reverseGeocode()` - Convertir coordenadas a dirección
- Manejo robusto de errores y timeouts
- Cancelación de búsquedas pendientes

#### 3. `hooks/useDebounce.ts`
- Hook para debounce de 500ms
- Evita búsquedas excesivas mientras el usuario escribe

#### 4. `src/modules/commute/hooks/useDestinationSearch.ts`
- Hook personalizado para búsqueda de destinos
- Manejo de estado (loading, error, results)
- Integración con ubicación del usuario

#### 5. `components/commute/DestinationSearchInput.tsx`
- Componente de UI completo
- Input con autocomplete
- Lista de resultados con scroll
- Manejo de errores visual
- Botón para limpiar búsqueda

### Configuración

```env
# .env.local
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyAVnzJY7V-8GHqm3TlKAMcT3_Lavh_CK-E
```

### Uso

```tsx
import { DestinationSearchInput } from '@/components/commute/DestinationSearchInput';

<DestinationSearchInput
  onSelectDestination={(place) => {
    console.log('Selected:', place);
    // place contiene: place_id, name, formatted_address, geometry.location
  }}
  placeholder="¿A dónde vas?"
  userLocation={{ latitude: 9.9281, longitude: -84.0907 }}
/>
```

---

## 💰 Sistema de Negociación de Precios

### Estrategia

- **Objetivo**: Ofrecer precios 2-3% más bajos que Uber
- **Primeros 10 viajes**: Sin necesidad de captura de pantalla
- **A partir del viaje 11**: Requiere captura de pantalla del precio de Uber
- **Verificación**: Análisis de tendencias y muestras aleatorias
- **Penalización**: Bloqueo permanente por fraude

### Archivos Creados

#### 1. `src/shared/types/price-negotiation-types.ts`
- `UberPriceComparison` - Datos de negociación
- `UserNegotiationProfile` - Perfil del usuario
- `PriceNegotiationSettings` - Configuración del sistema
- `ScreenshotVerificationRequest` - Verificación de capturas
- `PriceNegotiationAnalytics` - Métricas del sistema

#### 2. `src/modules/commute/services/price-negotiation-service.ts`
- `getUserProfile()` - Obtener perfil de negociación
- `createOrGetUserProfile()` - Crear perfil si no existe
- `createNegotiation()` - Crear nueva negociación
- `completeNegotiation()` - Completar negociación exitosa
- `reportFraud()` - Reportar fraude y bloquear usuario
- `getUserNegotiations()` - Historial de negociaciones
- `calculateNegotiatedPrice()` - Calcular precio negociado

#### 3. `backend/trpc/routes/commute/price-negotiation-routes.ts`
- `getUserNegotiationProfile` - Query para perfil
- `createPriceNegotiation` - Mutation para crear negociación
- `completePriceNegotiation` - Mutation para completar
- `detectFraud` - Mutation para reportar fraude
- `getUserNegotiations` - Query para historial
- `getNegotiationAnalytics` - Query para analíticas

#### 4. `components/commute/PriceNegotiationCard.tsx`
- Componente de UI completo
- Input para precio de Uber
- Selector de captura de pantalla
- Visualización de precio negociado
- Indicador de descuento
- Manejo de estados (loading, success, error)

### Integración en Backend

```typescript
// backend/trpc/app-router.ts
commute: createTRPCRouter({
  // ... otras rutas
  
  // Price Negotiation Service
  getUserNegotiationProfile: priceNegotiationRoutes.getUserNegotiationProfile,
  createPriceNegotiation: priceNegotiationRoutes.createPriceNegotiation,
  completePriceNegotiation: priceNegotiationRoutes.completePriceNegotiation,
  getUserNegotiations: priceNegotiationRoutes.getUserNegotiations,
  detectFraud: priceNegotiationRoutes.detectFraud,
  getNegotiationAnalytics: priceNegotiationRoutes.getNegotiationAnalytics,
}),
```

### Uso del Componente

```tsx
import { PriceNegotiationCard } from '@/components/commute/PriceNegotiationCard';
import { trpc } from '@/lib/trpc';

function TripScreen() {
  const kommutePrice = 5000; // Precio calculado de Kommute
  const userId = 'user-123';
  
  const createNegotiation = trpc.commute.createPriceNegotiation.useMutation();
  
  const handleNegotiate = async (uberPrice: number, screenshot?: string) => {
    const result = await createNegotiation.mutateAsync({
      userId,
      origin: { latitude: 9.9, longitude: -84.0, address: 'San José' },
      destination: { latitude: 9.8, longitude: -84.1, address: 'Escazú' },
      distance: 5000,
      kommuteOriginalPrice: kommutePrice,
      uberReportedPrice: uberPrice,
      screenshotBase64: screenshot,
    });
    
    console.log('Negotiated price:', result.kommuteNegotiatedPrice);
    console.log('Discount:', result.discountPercentage + '%');
  };
  
  return (
    <PriceNegotiationCard
      kommutePrice={kommutePrice}
      onNegotiate={handleNegotiate}
      tripNumber={5}
      requiresScreenshot={false}
    />
  );
}
```

---

## 🗄️ Estructura de Firestore

### Colecciones Creadas

#### `user_negotiation_profiles`
```typescript
{
  userId: string;
  totalNegotiations: number;
  successfulNegotiations: number;
  fraudAttempts: number;
  isBlocked: boolean;
  blockReason?: string;
  blockedAt?: Timestamp;
  freeNegotiationsRemaining: number;
  requiresScreenshotAfterTrip: number; // 11
  averageDiscount: number;
  totalSavings: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

#### `price_negotiations`
```typescript
{
  id: string;
  userId: string;
  tripId?: string;
  origin: { latitude, longitude, address };
  destination: { latitude, longitude, address };
  distance: number;
  kommuteOriginalPrice: number;
  uberReportedPrice: number;
  kommuteNegotiatedPrice: number;
  discountPercentage: number;
  tripNumber: number;
  requiresScreenshot: boolean;
  screenshotUrl?: string;
  screenshotVerified: boolean;
  screenshotVerifiedAt?: Timestamp;
  status: 'pending' | 'active' | 'completed' | 'rejected' | 'fraud_detected';
  fraudReason?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  completedAt?: Timestamp;
}
```

#### `screenshot_verifications`
```typescript
{
  id: string;
  negotiationId: string;
  userId: string;
  screenshotUrl: string;
  autoVerificationStatus: 'pending' | 'passed' | 'failed' | 'needs_manual_review';
  autoVerificationConfidence: number;
  detectedPrice?: number;
  detectedApp?: 'uber' | 'didi' | 'other' | 'unknown';
  manualReviewRequired: boolean;
  manualReviewStatus?: 'pending' | 'approved' | 'rejected';
  reviewedBy?: string;
  reviewedAt?: Timestamp;
  reviewNotes?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

---

## 🔧 Configuración de Google Cloud

### APIs Habilitadas
- ✅ Places API
- ✅ Geocoding API
- ✅ Maps SDK for Android (opcional)
- ✅ Maps SDK for iOS (opcional)

### Restricciones de API Key (Producción)
1. **Application restrictions**: Restringir por bundle ID/package name
2. **API restrictions**: Solo Places API y Geocoding API
3. **Quotas**: Monitorear uso diario

---

## 📊 Flujo de Negociación

```mermaid
graph TD
    A[Usuario ve precio Kommute] --> B{¿Quiere negociar?}
    B -->|No| C[Acepta precio Kommute]
    B -->|Sí| D[Ingresa precio Uber]
    D --> E{¿Viaje >= 11?}
    E -->|No| F[Crear negociación sin captura]
    E -->|Sí| G{¿Tiene captura?}
    G -->|No| H[Error: Captura requerida]
    G -->|Sí| I[Crear negociación con captura]
    F --> J[Calcular descuento 2-3%]
    I --> J
    J --> K[Mostrar precio negociado]
    K --> L[Usuario acepta]
    L --> M[Completar negociación]
    M --> N[Actualizar estadísticas]
```

---

## 🚀 Testing

### 1. Búsqueda de Destinos
```bash
# Navegar a /commute/search
# Escribir "San José" en el input de destino
# Verificar que aparecen resultados
# Seleccionar un resultado
# Verificar que se muestra la información completa
```

### 2. Negociación de Precios
```bash
# Crear un viaje con precio Kommute de ₡5000
# Ingresar precio Uber de ₡5200
# Verificar que se calcula descuento 2-3%
# Verificar que el precio final es menor que Uber
# Repetir 10 veces
# En el viaje 11, verificar que pide captura
```

### 3. Detección de Fraude
```bash
# Ingresar precios sospechosos (muy bajos)
# Verificar que se detecta el patrón
# Verificar que se bloquea el usuario
# Verificar que no puede crear más negociaciones
```

---

## 📈 Métricas y Analíticas

### Endpoint de Analíticas
```typescript
const analytics = await trpc.commute.getNegotiationAnalytics.query({
  startDate: '2025-01-01',
  endDate: '2025-01-31',
});

console.log(analytics);
// {
//   totalNegotiations: 150,
//   successfulNegotiations: 140,
//   fraudDetections: 5,
//   fraudRate: 3.33,
//   conversionRate: 93.33,
//   averageDiscount: 2.5,
//   totalDiscountAmount: 15000
// }
```

---

## ⚠️ Consideraciones de Seguridad

1. **Validación de Precios**: Verificar que los precios reportados sean razonables
2. **Rate Limiting**: Limitar número de negociaciones por usuario/día
3. **Análisis de Patrones**: Detectar usuarios con comportamiento sospechoso
4. **Verificación de Capturas**: Implementar OCR para validar capturas automáticamente
5. **Auditoría**: Registrar todas las negociaciones para análisis posterior

---

## 🔄 Próximos Pasos

### Fase 1: Validación (Actual) ✅
- [x] Implementar búsqueda de destinos
- [x] Implementar negociación básica
- [x] Crear componentes de UI
- [x] Integrar con backend

### Fase 2: Verificación Automática
- [ ] Implementar OCR para capturas de pantalla
- [ ] Detectar app (Uber, DiDi, etc.) en captura
- [ ] Extraer precio automáticamente
- [ ] Validar coherencia de datos

### Fase 3: Machine Learning
- [ ] Entrenar modelo para detectar fraude
- [ ] Predecir precios de Uber basado en histórico
- [ ] Optimizar descuentos dinámicamente
- [ ] Análisis de tendencias de mercado

### Fase 4: Expansión
- [ ] Agregar más competidores (DiDi, Cabify, etc.)
- [ ] Negociación multi-plataforma
- [ ] Programa de lealtad por negociaciones exitosas
- [ ] Gamificación del sistema

---

## 📞 Soporte

Si encuentras algún error o tienes preguntas:

1. Revisa los logs del backend: `console.log` en tRPC routes
2. Revisa los logs del frontend: `console.log` en componentes
3. Verifica la configuración de Google Maps API Key
4. Verifica las reglas de Firestore
5. Verifica que el backend esté corriendo en puerto 8082

---

## ✅ Checklist de Implementación

- [x] Google Maps API Key configurada
- [x] Places API habilitada
- [x] Geocoding API habilitada
- [x] Servicio de búsqueda implementado
- [x] Hook de búsqueda implementado
- [x] Componente de búsqueda implementado
- [x] Tipos de negociación definidos
- [x] Servicio de negociación implementado
- [x] Rutas tRPC implementadas
- [x] Componente de negociación implementado
- [x] Integración con Firestore
- [x] Manejo de errores
- [x] Testing básico
- [ ] Testing en producción
- [ ] Monitoreo de métricas
- [ ] Optimización de costos de API

---

**Estado**: ✅ Implementación Completa y Lista para Testing

**Última actualización**: 2025-01-10
