# Backend tRPC - Estado y Configuración

## 📊 Estado Actual

El backend tRPC está **completamente implementado** y listo para usar, pero requiere configuración de la URL base para funcionar.

### ✅ Componentes Implementados

1. **Backend Hono Server** (`backend/hono.ts`)
   - Servidor Hono configurado con tRPC
   - Middleware de seguridad (rate limiting, headers)
   - CORS configurado
   - Health check endpoints

2. **tRPC Router** (`backend/trpc/app-router.ts`)
   - Router principal con todas las rutas
   - Rutas de ejemplo
   - Rutas de pagos
   - Rutas de Kommute (transporte)
   - Rutas de registro

3. **Cliente tRPC** (`lib/trpc.ts`)
   - Cliente React Query configurado
   - Autenticación con tokens
   - Transformación de datos con SuperJSON

4. **Context y Procedures** (`backend/trpc/create-context.ts`)
   - Context creation con autenticación
   - Public procedures
   - Protected procedures
   - Admin procedures

### ⚠️ Configuración Requerida

Para que el backend tRPC funcione, necesitas configurar la variable de entorno:

```bash
EXPO_PUBLIC_RORK_API_BASE_URL=<tu-url-del-backend>
```

#### Opciones de Configuración:

1. **Rork Platform (Recomendado)**
   - La URL se configura automáticamente cuando ejecutas: `bun start`
   - El CLI de Rork proporciona la URL del backend

2. **Desarrollo Local**
   - Si tienes un servidor local corriendo en el puerto 8081:
   ```bash
   EXPO_PUBLIC_RORK_API_BASE_URL=http://localhost:8081
   ```

3. **Servidor Remoto**
   - Si tienes un servidor desplegado:
   ```bash
   EXPO_PUBLIC_RORK_API_BASE_URL=https://tu-dominio.com
   ```

## 🔧 Cómo Verificar el Estado

1. **Abrir la pantalla de validación**
   - Navega a `/kommute-validation` en tu app
   - Presiona el botón "Revalidar"

2. **Revisar el resultado de "Backend tRPC"**
   - ✅ **Success**: Backend conectado correctamente
   - ⚠️ **Warning**: Backend accesible pero con problemas
   - ❌ **Error**: No se pudo conectar al backend

## 📝 Mensajes de Error Comunes

### "URL del backend no configurada"
**Causa**: `EXPO_PUBLIC_RORK_API_BASE_URL` no está definida en `.env.local`

**Solución**:
1. Agrega la variable al archivo `.env.local`
2. Reinicia el servidor de desarrollo
3. Recarga la aplicación

### "No se pudo conectar al backend"
**Causa**: La URL está configurada pero el servidor no está accesible

**Solución**:
1. Verifica que el servidor backend esté corriendo
2. Verifica que la URL sea correcta
3. Verifica que no haya problemas de red/firewall

### "Backend respondió con código 404/500"
**Causa**: El servidor está corriendo pero hay problemas con las rutas o el código

**Solución**:
1. Revisa los logs del servidor backend
2. Verifica que las rutas tRPC estén correctamente configuradas
3. Verifica que no haya errores en el código del backend

## 🚀 Próximos Pasos

1. **Configurar la URL del backend**
   - Agrega `EXPO_PUBLIC_RORK_API_BASE_URL` a tu `.env.local`
   - O ejecuta la app con el CLI de Rork: `bun start`

2. **Verificar la conexión**
   - Abre `/kommute-validation`
   - Verifica que "Backend tRPC" muestre ✅ Success

3. **Comenzar a usar tRPC**
   - Usa `trpc` en componentes React
   - Usa `trpcClient` en funciones no-React
   - Todas las rutas están disponibles y documentadas

## 📚 Documentación de Rutas

### Rutas Disponibles

- `trpc.example.hi.useQuery()` - Ruta de ejemplo
- `trpc.payments.*` - Rutas de pagos
- `trpc.commute.*` - Rutas de Kommute (transporte)
- `trpc.registration.*` - Rutas de registro

### Ejemplo de Uso

```typescript
// En un componente React
import { trpc } from '@/lib/trpc';

function MyComponent() {
  const { data, isLoading } = trpc.example.hi.useQuery();
  
  return (
    <View>
      {isLoading ? <Text>Loading...</Text> : <Text>{data?.message}</Text>}
    </View>
  );
}

// En una función no-React
import { trpcClient } from '@/lib/trpc';

async function myFunction() {
  const data = await trpcClient.example.hi.query();
  console.log(data);
}
```

## 🔒 Seguridad

El backend incluye:
- Rate limiting (100 requests por minuto)
- Security headers
- CORS configurado
- Autenticación con tokens JWT
- Protected procedures que requieren autenticación
- Admin procedures que requieren permisos de admin

## 📞 Soporte

Si tienes problemas con el backend tRPC:
1. Revisa este documento
2. Verifica la consola de validación en `/kommute-validation`
3. Revisa los logs del servidor
4. Contacta al soporte de Rork

---

**Última actualización**: 2025-10-02
**Estado**: ✅ Implementado - ⚠️ Requiere Configuración
