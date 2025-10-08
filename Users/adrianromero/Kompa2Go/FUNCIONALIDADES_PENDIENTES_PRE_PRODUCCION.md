# 📋 Funcionalidades Pendientes Pre-Producción

## Estado Actual del Sistema

El sistema Kompa2Go tiene implementadas las siguientes funcionalidades base:
- ✅ Sistema de autenticación con Firebase
- ✅ Registro de clientes, proveedores y kommuters
- ✅ Sistema de billetera Kommute
- ✅ Sistema de referidos
- ✅ Verificación de antecedentes para kommuters
- ✅ Aprobación de proveedores (admin)
- ✅ Sistema de accesibilidad
- ✅ Reglas de seguridad Firestore

---

## 🎯 Funcionalidades Pendientes por Rol

### 1. CLIENTE (Usuario Final)

#### 1.1 Perfil y Configuración
- [ ] **Editar perfil completo**
  - Actualizar información personal
  - Cambiar foto de perfil
  - Actualizar dirección
  - Modificar preferencias de notificaciones
  - Persistencia: `users/{userId}` en Firestore

- [ ] **Historial de viajes**
  - Ver todos los viajes realizados
  - Filtrar por fecha, estado, kommuter
  - Ver detalles de cada viaje (ruta, costo, duración)
  - Descargar recibos
  - Persistencia: `trips` collection con query `where('passengerId', '==', userId)`

- [ ] **Métodos de pago**
  - Agregar/eliminar tarjetas
  - Configurar método de pago predeterminado
  - Ver historial de pagos
  - Persistencia: `payment_methods/{userId}` subcollection

- [ ] **Direcciones guardadas**
  - Guardar direcciones frecuentes (casa, trabajo)
  - Editar/eliminar direcciones
  - Selección rápida en solicitud de viaje
  - Persistencia: `user_addresses/{userId}` subcollection

#### 1.2 Funcionalidad de Viajes
- [ ] **Solicitar viaje Kommute**
  - Seleccionar origen y destino
  - Ver estimación de precio
  - Ver kommuters disponibles
  - Confirmar solicitud
  - Persistencia: `trips` collection

- [ ] **Seguimiento en tiempo real**
  - Ver ubicación del kommuter en mapa
  - Tiempo estimado de llegada
  - Notificaciones de estado del viaje
  - Persistencia: `trip_locations/{tripId}` con updates en tiempo real

- [ ] **Calificación y reseñas**
  - Calificar kommuter después del viaje
  - Dejar comentarios
  - Ver calificaciones propias
  - Persistencia: `ratings` collection

- [ ] **Favoritos**
  - Marcar kommuters como favoritos
  - Solicitar viaje con favoritos
  - Persistencia: `user_favorites/{userId}` subcollection

#### 1.3 Servicios 2Kompa
- [ ] **Solicitar servicio de proveedor**
  - Buscar proveedores por categoría
  - Ver perfil y servicios del proveedor
  - Solicitar cotización
  - Agendar servicio
  - Persistencia: `service_requests` collection

- [ ] **Historial de servicios**
  - Ver servicios contratados
  - Estado de servicios activos
  - Calificar proveedores
  - Persistencia: `service_history/{userId}` subcollection

---

### 2. KOMMUTER (Conductor)

#### 2.1 Perfil y Documentación
- [ ] **Panel de kommuter completo**
  - Dashboard con estadísticas
  - Ganancias del día/semana/mes
  - Viajes completados
  - Calificación promedio
  - Persistencia: Agregación de `trips` y `kommute_wallet_transactions`

- [ ] **Gestión de vehículos**
  - Agregar/editar vehículos
  - Subir documentos (RITEVE, seguro, marchamo)
  - Alertas de vencimiento de documentos
  - Persistencia: `kommuter_vehicles/{kommuterId}` subcollection

- [ ] **Gestión de flota** (para kommuters con múltiples vehículos)
  - Asignar conductores a vehículos
  - Ver estado de cada vehículo
  - Gestionar permisos de conductores
  - Persistencia: `fleet_drivers/{kommuterId}` subcollection

#### 2.2 Operación de Viajes
- [ ] **Modo disponible/ocupado**
  - Toggle para recibir solicitudes
  - Configurar radio de búsqueda
  - Pausar temporalmente
  - Persistencia: `kommuter_status/{kommuterId}` con updates en tiempo real

- [ ] **Aceptar/rechazar viajes**
  - Ver detalles de solicitud
  - Aceptar o rechazar
  - Tiempo límite para responder
  - Persistencia: Update en `trips/{tripId}`

- [ ] **Navegación durante viaje**
  - Integración con Google Maps/Waze
  - Actualizar ubicación en tiempo real
  - Marcar inicio/fin de viaje
  - Persistencia: `trip_locations/{tripId}`

- [ ] **Historial de viajes**
  - Ver todos los viajes realizados
  - Filtros por fecha, estado
  - Detalles de ganancias por viaje
  - Persistencia: Query en `trips` collection

#### 2.3 Billetera Kommute
- [ ] **Ver saldo y transacciones**
  - Saldo actual
  - Historial de transacciones
  - Viajes sin validación previa (2 gratis)
  - Viajes bonificados (cada 20 viajes)
  - Persistencia: Ya implementado en `KommuteWalletContext`

- [ ] **Recargar billetera**
  - Subir comprobante SINPE
  - Ver estado de recargas pendientes
  - Historial de recargas
  - Persistencia: Ya implementado en `kommute_wallet_recharges`

- [ ] **Solicitar retiro de ganancias**
  - Solicitar transferencia a cuenta bancaria
  - Ver retiros pendientes
  - Historial de retiros
  - Persistencia: `withdrawal_requests` collection

#### 2.4 Verificación de Antecedentes
- [ ] **Subir documentos**
  - Certificado de antecedentes penales
  - Verificación de identidad
  - Ver estado de verificación
  - Persistencia: Ya implementado en `background_check_service`

---

### 3. PROVEEDOR 2KOMPA

#### 3.1 Perfil y Servicios
- [ ] **Perfil de proveedor**
  - Información de empresa
  - Servicios ofrecidos
  - Galería de trabajos
  - Horarios de atención
  - Persistencia: `providers/{providerId}`

- [ ] **Gestión de servicios**
  - Agregar/editar servicios
  - Precios y descripciones
  - Categorías de servicio
  - Disponibilidad
  - Persistencia: `provider_services/{providerId}` subcollection

- [ ] **Gestión de colaboradores**
  - Agregar empleados/técnicos
  - Asignar permisos
  - Ver actividad de colaboradores
  - Persistencia: `provider_collaborators/{providerId}` subcollection

#### 3.2 Solicitudes y Agenda
- [ ] **Recibir solicitudes de servicio**
  - Notificaciones de nuevas solicitudes
  - Ver detalles del cliente
  - Aceptar/rechazar solicitudes
  - Enviar cotizaciones
  - Persistencia: `service_requests` collection

- [ ] **Calendario de servicios**
  - Ver servicios agendados
  - Gestionar disponibilidad
  - Reprogramar servicios
  - Persistencia: `provider_calendar/{providerId}` subcollection

- [ ] **Historial de servicios**
  - Servicios completados
  - Servicios cancelados
  - Estadísticas de desempeño
  - Persistencia: Query en `service_requests`

#### 3.3 Pagos y Facturación
- [ ] **Gestión de pagos**
  - Ver pagos pendientes
  - Historial de pagos recibidos
  - Generar facturas
  - Persistencia: `provider_payments/{providerId}` subcollection

- [ ] **Reportes financieros**
  - Ingresos por período
  - Servicios más solicitados
  - Clientes frecuentes
  - Persistencia: Agregación de datos

---

### 4. ADMINISTRADOR

#### 4.1 Gestión de Usuarios
- [ ] **Panel de usuarios**
  - Ver todos los usuarios (clientes, kommuters, proveedores)
  - Filtrar por tipo, estado
  - Buscar usuarios
  - Persistencia: Query en `users` collection

- [ ] **Acciones sobre usuarios**
  - Suspender/activar cuentas
  - Ver detalles completos
  - Historial de actividad
  - Persistencia: Update en `users/{userId}`

#### 4.2 Aprobaciones
- [ ] **Aprobar proveedores**
  - Ya implementado en `provider-approvals.tsx`
  - Ver documentos
  - Aprobar/rechazar
  - Persistencia: Ya implementado

- [ ] **Aprobar kommuters**
  - Ver solicitudes pendientes
  - Verificar documentos
  - Aprobar/rechazar
  - Persistencia: Similar a proveedores

- [ ] **Verificación de antecedentes**
  - Ver solicitudes pendientes
  - Revisar documentos
  - Aprobar/rechazar
  - Persistencia: Ya implementado en `background_check_service`

#### 4.3 Billetera Kommute (Admin)
- [ ] **Aprobar recargas**
  - Ver recargas pendientes
  - Verificar comprobantes
  - Aprobar/rechazar recargas
  - Persistencia: Ya implementado en `walletService.getPendingRecharges()`

- [ ] **Gestionar distribuciones de pago**
  - Ver pagos pendientes a kommuters
  - Aprobar pagos
  - Historial de distribuciones
  - Persistencia: Ya implementado en `walletService.getPendingDistributions()`

- [ ] **Panel de transacciones**
  - Ver todas las transacciones del sistema
  - Filtrar por tipo, usuario, fecha
  - Exportar reportes
  - Persistencia: `system_transactions` collection

#### 4.4 Monitoreo y Reportes
- [ ] **Dashboard de métricas**
  - Viajes activos en tiempo real
  - Kommuters activos
  - Ingresos del día
  - Usuarios registrados
  - Persistencia: Agregación en tiempo real

- [ ] **Reportes financieros**
  - Ingresos por período
  - Comisiones generadas
  - Pagos a kommuters
  - Exportar a Excel/PDF
  - Persistencia: Agregación de datos

- [ ] **Alertas y problemas**
  - Ver alertas activas
  - Problemas reportados
  - Seguimiento de incidentes
  - Persistencia: `alert_tracking` collection

#### 4.5 Configuración del Sistema
- [ ] **Configuración de precios**
  - Precio base por kilómetro
  - Precio por minuto
  - Surge pricing (precios dinámicos)
  - Comisiones de la plataforma
  - Persistencia: `app_config/pricing`

- [ ] **Zonas de servicio**
  - Definir zonas de cobertura
  - Configurar surge pricing por zona
  - Saturación de zonas
  - Persistencia: `service_zones` collection

- [ ] **Notificaciones push**
  - Configurar plantillas
  - Enviar notificaciones masivas
  - Historial de notificaciones
  - Persistencia: `notifications` collection

---

## 🔧 Funcionalidades Transversales

### 5.1 Chat y Comunicación
- [ ] **Chat en tiempo real**
  - Chat entre cliente y kommuter durante viaje
  - Chat entre cliente y proveedor
  - Historial de conversaciones
  - Persistencia: `chats` collection con subcollection `messages`

- [ ] **Notificaciones**
  - Push notifications
  - Notificaciones in-app
  - Email notifications
  - SMS (opcional)
  - Persistencia: `user_notifications/{userId}` subcollection

### 5.2 Sistema de Referidos
- [ ] **Completar sistema de referidos**
  - Ya implementado parcialmente
  - Agregar UI para compartir código
  - Ver referidos activos
  - Tracking de recompensas
  - Persistencia: Ya implementado en `referrals` collection

### 5.3 Soporte y Ayuda
- [ ] **Centro de ayuda**
  - FAQs
  - Tutoriales
  - Contactar soporte
  - Persistencia: `help_articles` collection

- [ ] **Reportar problemas**
  - Formulario de reporte
  - Adjuntar evidencias
  - Seguimiento de tickets
  - Persistencia: `support_tickets` collection

### 5.4 Seguridad
- [ ] **Botón de pánico**
  - Activar alerta de emergencia
  - Compartir ubicación con contactos
  - Notificar a autoridades
  - Persistencia: `emergency_alerts` collection

- [ ] **Verificación de seguridad**
  - Preguntas de seguridad
  - Verificación en dos pasos
  - Persistencia: Ya implementado en `security_questions`

---

## 📊 Prioridades de Implementación

### FASE 1: CRÍTICO (Antes de lanzamiento)
1. ✅ Sistema de autenticación
2. ✅ Registro de usuarios
3. ✅ Billetera Kommute básica
4. [ ] Solicitar y aceptar viajes
5. [ ] Seguimiento en tiempo real
6. [ ] Pagos básicos
7. [ ] Panel de kommuter
8. [ ] Aprobar recargas (admin)

### FASE 2: IMPORTANTE (Primera semana post-lanzamiento)
1. [ ] Historial de viajes
2. [ ] Calificaciones y reseñas
3. [ ] Chat en tiempo real
4. [ ] Notificaciones push
5. [ ] Gestión de vehículos
6. [ ] Retiro de ganancias
7. [ ] Dashboard admin completo

### FASE 3: MEJORAS (Primer mes)
1. [ ] Servicios 2Kompa completos
2. [ ] Sistema de favoritos
3. [ ] Direcciones guardadas
4. [ ] Reportes financieros
5. [ ] Centro de ayuda
6. [ ] Configuración de precios dinámicos

### FASE 4: AVANZADO (Segundo mes)
1. [ ] Gestión de flotas
2. [ ] Botón de pánico
3. [ ] Surge pricing automático
4. [ ] Reportes avanzados
5. [ ] Integración con sistemas externos

---

## 🗄️ Estructura de Persistencia Requerida

### Collections Firestore Necesarias

```
users/
  {userId}/
    - Perfil base
    - Configuración
    
trips/
  {tripId}/
    - Información del viaje
    - Estado
    - Ubicaciones
    
trip_locations/
  {tripId}/
    - Ubicación en tiempo real
    
kommuter_status/
  {kommuterId}/
    - Estado disponible/ocupado
    - Ubicación actual
    
kommuter_vehicles/
  {kommuterId}/
    vehicles/
      {vehicleId}/
        - Información del vehículo
        - Documentos
        
payment_methods/
  {userId}/
    methods/
      {methodId}/
        - Tarjetas guardadas
        
user_addresses/
  {userId}/
    addresses/
      {addressId}/
        - Direcciones guardadas
        
ratings/
  {ratingId}/
    - Calificaciones
    - Comentarios
    
service_requests/
  {requestId}/
    - Solicitudes de servicio 2Kompa
    
provider_services/
  {providerId}/
    services/
      {serviceId}/
        - Servicios ofrecidos
        
chats/
  {chatId}/
    messages/
      {messageId}/
        - Mensajes
        
withdrawal_requests/
  {requestId}/
    - Solicitudes de retiro
    
support_tickets/
  {ticketId}/
    - Tickets de soporte
    
emergency_alerts/
  {alertId}/
    - Alertas de emergencia
```

---

## 📝 Notas de Implementación

### Consideraciones Técnicas

1. **Tiempo Real**
   - Usar Firestore real-time listeners para ubicaciones
   - WebSockets para chat
   - Push notifications para alertas

2. **Optimización**
   - Implementar paginación en listas largas
   - Caché de datos frecuentes
   - Lazy loading de imágenes

3. **Seguridad**
   - Validar todas las entradas
   - Sanitizar datos antes de guardar
   - Implementar rate limiting
   - Logs de auditoría para acciones críticas

4. **Testing**
   - Unit tests para servicios críticos
   - Integration tests para flujos completos
   - E2E tests para user journeys principales

5. **Monitoreo**
   - Implementar error tracking (Sentry)
   - Analytics de uso
   - Performance monitoring
   - Logs estructurados

---

## ✅ Checklist Pre-Producción

### Funcionalidades Mínimas Viables
- [ ] Usuario puede registrarse y hacer login
- [ ] Kommuter puede registrarse y ser aprobado
- [ ] Cliente puede solicitar viaje
- [ ] Kommuter puede aceptar viaje
- [ ] Seguimiento de viaje en tiempo real
- [ ] Pago del viaje
- [ ] Calificación post-viaje
- [ ] Billetera Kommute funcional
- [ ] Admin puede aprobar recargas
- [ ] Admin puede ver métricas básicas

### Seguridad
- [ ] Firestore rules desplegadas
- [ ] Autenticación funcionando
- [ ] Datos sensibles encriptados
- [ ] Rate limiting implementado
- [ ] Logs de auditoría activos

### Performance
- [ ] Tiempo de carga < 3 segundos
- [ ] Imágenes optimizadas
- [ ] Caché implementado
- [ ] Lazy loading activo

### UX/UI
- [ ] Diseño responsive
- [ ] Accesibilidad implementada
- [ ] Mensajes de error claros
- [ ] Loading states
- [ ] Empty states

### Testing
- [ ] Tests unitarios críticos
- [ ] Tests de integración
- [ ] Testing manual completo
- [ ] Beta testing con usuarios reales

---

## 🚀 Próximos Pasos

1. **Revisar y priorizar** funcionalidades con el equipo
2. **Crear tickets** en sistema de gestión de proyectos
3. **Asignar recursos** a cada funcionalidad
4. **Establecer timeline** realista
5. **Comenzar implementación** por Fase 1
6. **Testing continuo** durante desarrollo
7. **Beta testing** antes de producción
8. **Lanzamiento gradual** (soft launch)
9. **Monitoreo intensivo** post-lanzamiento
10. **Iteración rápida** basada en feedback

---

**Última actualización:** 2025-10-08
**Versión:** 1.0
**Estado:** Documento de planificación
