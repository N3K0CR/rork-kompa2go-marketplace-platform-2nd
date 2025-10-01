# 🔥 Firebase Firestore Setup Guide - 2Kommute

Esta guía te ayudará a configurar Firebase Firestore para que 2Kommute funcione completamente en producción.

## 📋 Pasos de Configuración

### 1. Configurar Reglas de Seguridad

Las reglas de seguridad protegen tus datos en Firestore.

**Pasos:**
1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona tu proyecto: **kompa2go**
3. En el menú lateral, ve a **Firestore Database**
4. Haz clic en la pestaña **Rules**
5. Copia y pega el contenido del archivo `firestore.rules` en el editor
6. Haz clic en **Publish** para aplicar las reglas

**Archivo:** `firestore.rules`

**Características de las reglas:**
- ✅ Solo usuarios autenticados pueden acceder a los datos
- ✅ Los usuarios solo pueden ver/editar sus propios datos
- ✅ Los conductores pueden gestionar sus propias cadenas de viajes
- ✅ Los puntos de seguimiento son inmutables (no se pueden editar)
- ✅ La cola de viajes es visible para todos los conductores

---

### 2. Crear Índices Compuestos

Los índices compuestos permiten consultas complejas y rápidas en Firestore.

**Opción A: Importar desde archivo (Recomendado)**

1. Instala Firebase CLI si no lo tienes:
   ```bash
   npm install -g firebase-tools
   ```

2. Inicia sesión en Firebase:
   ```bash
   firebase login
   ```

3. Inicializa Firebase en tu proyecto:
   ```bash
   firebase init firestore
   ```
   - Selecciona tu proyecto: **kompa2go**
   - Usa los archivos existentes: `firestore.rules` y `firestore.indexes.json`

4. Despliega los índices:
   ```bash
   firebase deploy --only firestore:indexes
   ```

**Opción B: Crear manualmente en Firebase Console**

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona tu proyecto: **kompa2go**
3. Ve a **Firestore Database** → **Indexes**
4. Haz clic en **Add Index** para cada uno de los siguientes:

#### Índices Necesarios:

**kommute_routes:**
- `userId` (Ascending) + `createdAt` (Descending)
- `userId` (Ascending) + `status` (Ascending) + `createdAt` (Descending)

**kommute_trips:**
- `userId` (Ascending) + `startTime` (Descending)
- `routeId` (Ascending) + `startTime` (Descending)
- `userId` (Ascending) + `status` (Ascending) + `startTime` (Descending)

**kommute_tracking_points:**
- `tripId` (Ascending) + `timestamp` (Ascending)

**kommute_trip_chains:**
- `driverId` (Ascending) + `createdAt` (Descending)
- `driverId` (Ascending) + `status` (Ascending) + `createdAt` (Descending)

**kommute_trip_queue:**
- `status` (Ascending) + `expiresAt` (Ascending) + `priority` (Descending)
- `zoneId` (Ascending) + `status` (Ascending) + `priority` (Descending)

**kommute_driver_availability:**
- `isAcceptingChainedTrips` (Ascending) + `currentLocation.timestamp` (Descending)

---

### 3. Configurar Firebase Authentication

Para que las reglas de seguridad funcionen, necesitas configurar Firebase Authentication.

**Pasos:**

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona tu proyecto: **kompa2go**
3. En el menú lateral, ve a **Authentication**
4. Haz clic en **Get Started**
5. Habilita los métodos de autenticación que necesites:
   - **Email/Password** (Recomendado para empezar)
   - **Google Sign-In** (Opcional)
   - **Phone** (Opcional)

**Configuración en la App:**

El archivo `lib/firebase.ts` ya está configurado con Firebase Auth. Solo necesitas integrar el sistema de autenticación en tu app.

---

### 4. Integrar Firebase Authentication en CommuteContext

Actualmente, el `CommuteContext` usa un `userId` hardcodeado (`'current_user'`). Necesitas reemplazarlo con el usuario real de Firebase Auth.

**Cambios necesarios en `contexts/CommuteContext.tsx`:**

```typescript
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';

// Agregar estado para el usuario
const [currentUser, setCurrentUser] = useState<User | null>(null);

// Escuchar cambios de autenticación
useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, (user) => {
    setCurrentUser(user);
    console.log('[CommuteContext] Auth state changed:', user?.uid);
  });
  
  return () => unsubscribe();
}, []);

// Reemplazar 'current_user' con currentUser?.uid
```

---

### 5. Integrar Firestore Service en CommuteContext

Actualmente, el `CommuteContext` usa `AsyncStorage` para persistencia local. Necesitas integrarlo con el `firestoreService` para sincronización en tiempo real.

**Cambios necesarios:**

1. **Importar el servicio:**
   ```typescript
   import { firestoreService } from '@/src/modules/commute/services/firestore-service';
   ```

2. **Reemplazar operaciones de AsyncStorage con Firestore:**
   - `createRoute` → `firestoreService.routes.create()`
   - `updateRoute` → `firestoreService.routes.update()`
   - `deleteRoute` → `firestoreService.routes.delete()`
   - `startTrip` → `firestoreService.trips.create()`
   - `endTrip` → `firestoreService.trips.update()`

3. **Usar suscripciones en tiempo real:**
   ```typescript
   useEffect(() => {
     if (!currentUser?.uid) return;
     
     const unsubscribe = firestoreService.routes.subscribeToUserRoutes(
       currentUser.uid,
       (routes) => {
         setRoutes(routes);
       }
     );
     
     return () => unsubscribe();
   }, [currentUser?.uid]);
   ```

---

### 6. Probar la Integración

Una vez configurado todo, prueba la integración usando la página de test:

**Ruta:** `/firebase-test`

**Pruebas que se ejecutan:**
1. ✅ Conexión a Firebase
2. ✅ Crear Ruta
3. ✅ Leer Ruta
4. ✅ Actualizar Ruta
5. ✅ Crear Viaje
6. ✅ Agregar Puntos de Seguimiento
7. ✅ Finalizar Viaje
8. ✅ Obtener Estadísticas
9. ✅ Eliminar Datos de Prueba

---

## 🔒 Seguridad

### Reglas de Seguridad Implementadas:

- **Autenticación requerida:** Todos los usuarios deben estar autenticados
- **Aislamiento de datos:** Los usuarios solo pueden acceder a sus propios datos
- **Validación de propietario:** Las operaciones verifican que el usuario sea el propietario
- **Inmutabilidad:** Los puntos de seguimiento no se pueden modificar después de crearse
- **Permisos de conductor:** Los conductores tienen permisos especiales para cadenas de viajes

### Mejores Prácticas:

1. **Nunca expongas las claves de API en el código del cliente** (ya están en `lib/firebase.ts`)
2. **Usa Firebase App Check** para proteger contra abuso (opcional pero recomendado)
3. **Monitorea el uso** en Firebase Console para detectar actividad sospechosa
4. **Implementa rate limiting** si es necesario

---

## 📊 Monitoreo

### Firebase Console - Métricas a Monitorear:

1. **Firestore Database:**
   - Lecturas/Escrituras por día
   - Tamaño de la base de datos
   - Consultas más frecuentes

2. **Authentication:**
   - Usuarios activos
   - Métodos de autenticación usados
   - Intentos fallidos

3. **Performance:**
   - Tiempo de respuesta de consultas
   - Índices faltantes (Firebase te alertará)

---

## 🚀 Próximos Pasos

Una vez completada la configuración:

1. ✅ Reglas de seguridad desplegadas
2. ✅ Índices compuestos creados
3. ✅ Firebase Authentication configurado
4. ⏳ Integrar Auth en CommuteContext
5. ⏳ Reemplazar AsyncStorage con Firestore
6. ⏳ Probar en `/firebase-test`
7. ⏳ Probar en la app real (`/commute`)

---

## 📚 Recursos Adicionales

- [Firebase Firestore Documentation](https://firebase.google.com/docs/firestore)
- [Firebase Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
- [Firebase Authentication](https://firebase.google.com/docs/auth)
- [Firestore Indexes](https://firebase.google.com/docs/firestore/query-data/indexing)

---

## ❓ Troubleshooting

### Error: "Missing or insufficient permissions"
- Verifica que las reglas de seguridad estén desplegadas
- Asegúrate de que el usuario esté autenticado
- Revisa que el `userId` en los documentos coincida con `auth.uid`

### Error: "The query requires an index"
- Firebase te dará un link directo para crear el índice
- O usa `firebase deploy --only firestore:indexes`

### Error: "Firebase: Error (auth/...)"
- Verifica que Firebase Authentication esté habilitado
- Revisa la configuración en `lib/firebase.ts`
- Asegúrate de que el método de autenticación esté habilitado en Firebase Console

---

**¿Necesitas ayuda?** Revisa los logs en la consola del navegador y en Firebase Console.
