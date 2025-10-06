# Kommute Wallet - Sistema de Billetera Dual

## Resumen de Implementación

Se ha implementado un sistema completo de billetera dual para Kompa2Go, separando completamente:
- **Billetera Kommute**: Para pagos de viajes de transporte
- **Billetera de Reservas**: Para servicios de reserva (existente)

## Componentes Implementados

### 1. Types y Schema (`src/shared/types/kommute-wallet-types.ts`)
- `KommuteWalletBalance`: Balance de la billetera
- `KommuteWalletRecharge`: Solicitudes de recarga
- `KommuteWalletTransaction`: Transacciones de la billetera
- `KommutePaymentDistribution`: Distribución de pagos a conductores
- `KommuteWalletStats`: Estadísticas de la billetera
- `RechargeApprovalRequest`: Solicitudes pendientes de aprobación

### 2. Firestore Service (`src/modules/kommute-wallet/services/firestore-wallet-service.ts`)
Servicio completo para gestión de billetera con:
- Gestión de balance (inicialización, consulta)
- Creación y aprobación/rechazo de recargas
- Gestión de transacciones
- Sistema de viajes gratis (2 primeros viajes)
- Retención de fondos para viajes
- Programación de distribución de pagos (diaria a la 1 PM)
- Estadísticas de billetera

**Colecciones Firestore:**
- `kommute_wallet_balances`: Balances de usuarios
- `kommute_wallet_recharges`: Solicitudes de recarga
- `kommute_wallet_transactions`: Historial de transacciones
- `kommute_payment_distributions`: Pagos programados a conductores
- `user_profiles`: Perfiles de usuario (referencia)

### 3. Context (`contexts/KommuteWalletContext.tsx`)
Context optimizado con:
- Estado de balance, transacciones y estadísticas
- Funciones memoizadas con `useCallback`
- Valor de retorno memoizado con `useMemo`
- Carga automática al autenticar usuario
- Función `createRecharge` para solicitar recargas

### 4. tRPC Routes (`backend/trpc/routes/kommute-wallet/routes.ts`)
Rutas protegidas para:
- `getBalance`: Obtener balance del usuario
- `getTransactions`: Historial de transacciones
- `getStats`: Estadísticas de la billetera
- `createRecharge`: Crear solicitud de recarga
- `getPendingRecharges`: Recargas pendientes (admin)
- `approveRecharge`: Aprobar recarga (admin)
- `rejectRecharge`: Rechazar recarga (admin)
- `getAllTransactions`: Todas las transacciones (admin)
- `getPendingDistributions`: Pagos pendientes (admin)
- `markDistributionCompleted`: Marcar pago completado (admin)
- `markDistributionFailed`: Marcar pago fallido (admin)

### 5. UI - Pantalla de Recarga (`app/kommute-wallet-recharge.tsx`)
Pantalla completa con:
- Selección de montos predefinidos (₡5,000, ₡7,000, ₡10,000, ₡20,000)
- Opción de monto personalizado (mínimo ₡5,000)
- Información de pago SINPE Móvil
- Campo para referencia SINPE
- Subida de comprobante de pago (imagen)
- Indicador de viajes gratis restantes
- Validaciones completas
- Estados de carga

## Flujo de Funcionamiento

### Para Clientes:

1. **Primeros 2 Viajes Gratis**
   - No requieren saldo en billetera
   - Se registran como transacciones con monto ₡0
   - Contador de viajes gratis se incrementa

2. **Recarga de Billetera**
   - Cliente selecciona monto (mínimo ₡5,000)
   - Realiza transferencia SINPE Móvil
   - Sube comprobante e ingresa referencia
   - Solicitud queda pendiente de aprobación

3. **Aprobación de Recarga**
   - Admin revisa comprobante en Panel Kommuter
   - Aprueba o rechaza con motivo
   - Si aprueba: fondos se agregan a billetera
   - Cliente recibe notificación

4. **Uso de Fondos**
   - Al solicitar viaje: fondos se retienen
   - Al completar viaje: se programa pago a conductor
   - Transacción registrada en historial

### Para Conductores:

1. **Distribución de Pagos**
   - Pagos se programan automáticamente al completar viaje
   - Horario de corte: 1:00 PM
   - Viajes antes de 1 PM: se pagan ese día
   - Viajes después de 1 PM: se pagan al día siguiente

2. **Procesamiento de Pagos**
   - Admin ve pagos pendientes en Panel
   - Realiza transferencias SINPE
   - Marca como completado con referencia
   - O marca como fallido con motivo

## Pendientes de Implementación

### 1. Agregar Context al App Layout
```typescript
// En app/_layout.tsx
import { KommuteWalletContext } from '@/contexts/KommuteWalletContext';

// Envolver en el provider
<KommuteWalletContext>
  {/* Resto de la app */}
</KommuteWalletContext>
```

### 2. Panel Kommuter - Pagos Pendientes
Agregar sección en `app/kommuter-panel.tsx`:
- Lista de recargas pendientes de aprobación
- Visualización de comprobantes
- Botones aprobar/rechazar
- Lista de distribuciones pendientes
- Procesamiento de pagos a conductores

### 3. Vista de Transacciones
Crear `app/kommute-wallet-transactions.tsx`:
- Lista completa de transacciones
- Filtros por tipo y fecha
- Exportación a CSV/Excel
- Búsqueda por referencia

### 4. Integración con Sistema de Viajes
Modificar flujo de viajes para:
- Verificar saldo antes de iniciar viaje
- Retener fondos al aceptar viaje
- Programar pago al completar viaje
- Manejar cancelaciones y reembolsos

### 5. Notificaciones
Implementar notificaciones para:
- Recarga aprobada/rechazada
- Fondos agregados a billetera
- Pago recibido (conductores)
- Saldo insuficiente

### 6. Reglas de Seguridad Firestore
Actualizar `firestore.rules` para:
```
// Billetera Kommute
match /kommute_wallet_balances/{userId} {
  allow read: if request.auth.uid == userId;
  allow write: if false; // Solo backend
}

match /kommute_wallet_recharges/{rechargeId} {
  allow read: if request.auth.uid == resource.data.userId || isAdmin();
  allow create: if request.auth.uid == request.resource.data.userId;
  allow update: if isAdmin();
}

match /kommute_wallet_transactions/{transactionId} {
  allow read: if request.auth.uid == resource.data.userId || isAdmin();
  allow write: if false; // Solo backend
}

match /kommute_payment_distributions/{distributionId} {
  allow read: if request.auth.uid == resource.data.kommuterId || isAdmin();
  allow write: if isAdmin();
}
```

### 7. Índices Firestore
Crear en Firebase Console:
```
Collection: kommute_wallet_recharges
- status (Ascending) + requestedAt (Descending)
- userId (Ascending) + status (Ascending)

Collection: kommute_wallet_transactions
- userId (Ascending) + createdAt (Descending)

Collection: kommute_payment_distributions
- status (Ascending) + scheduledFor (Ascending)
- kommuterId (Ascending) + status (Ascending)
```

## Características Clave

✅ **Separación Total**: Billeteras completamente independientes
✅ **Viajes Gratis**: Primeros 2 viajes sin necesidad de saldo
✅ **Validación de Comprobantes**: Revisión manual por admin
✅ **Pagos Programados**: Distribución automática diaria
✅ **Transacciones Atómicas**: Uso de Firestore transactions
✅ **Historial Completo**: Registro de todas las operaciones
✅ **Montos Flexibles**: Predefinidos y personalizados
✅ **Seguridad**: Rutas protegidas y validaciones

## Próximos Pasos

1. Agregar `KommuteWalletContext` al layout principal
2. Implementar sección de pagos en Panel Kommuter
3. Crear vista de transacciones con exportación
4. Integrar con sistema de viajes existente
5. Configurar reglas de seguridad Firestore
6. Crear índices necesarios en Firestore
7. Implementar sistema de notificaciones
8. Testing completo del flujo end-to-end

## Notas Técnicas

- **Firestore Transactions**: Garantizan consistencia en operaciones críticas
- **Optimistic Updates**: No implementados aún (considerar para UX)
- **Caché**: React Query maneja caché automáticamente
- **Errores**: Manejo exhaustivo con try-catch y mensajes claros
- **Logs**: Console.log extensivos para debugging
- **TypeScript**: Tipado estricto en todos los componentes
