# 🧪 Guía de Validación de Kommute

## 🚀 Inicio Rápido

### 1. Verificar que los servicios estén corriendo

```bash
bash run-kommute-validation.sh
```

Este script verificará:
- ✅ Estado de PM2
- ✅ Servicios Frontend y Backend
- ✅ Conectividad del backend
- ✅ URLs disponibles

### 2. Acceder a las pantallas de validación

#### Opción A: Validación Estándar
```
http://localhost:8081/kommute-validation
```

**Características:**
- ✓ Validación del contexto base
- ✓ Verificación de feature flags
- ✓ Permisos de ubicación
- ✓ Modos de transporte disponibles
- ✓ Datos locales (rutas y viajes)
- ✓ Conexión con backend tRPC
- ✓ Sistema de recuperación de errores

**Controles disponibles:**
- 🔄 **Revalidar**: Ejecuta todas las validaciones básicas
- 🛡️ **Test Recuperación**: Prueba el sistema de recuperación de errores
- ▶️ **Habilitar Kommute**: Activa el sistema Kommute
- ⚙️ **Deshabilitar Kommute**: Desactiva el sistema Kommute

#### Opción B: Test Completo
```
http://localhost:8081/kommute-full-test
```

**Características:**
- 🔥 **Firebase & Firestore**: Autenticación, CRUD de rutas y viajes
- ⚡ **Contexto Kommute**: Inicialización, estados, permisos
- 🌐 **Backend tRPC**: Todos los servicios (matching, destinos, trip chaining, etc.)
- 🎯 **Funcionalidades Avanzadas**: Rutas locales, búsqueda, cálculos

**Controles disponibles:**
- ▶️ **Ejecutar Todas las Pruebas**: Ejecuta el suite completo de tests
- 🔄 **Reiniciar**: Resetea todos los tests a estado inicial

## 📊 Interpretación de Resultados

### Estados de Validación

| Estado | Icono | Significado |
|--------|-------|-------------|
| ✅ Success | CheckCircle (verde) | Todo funciona correctamente |
| ⚠️ Warning | AlertCircle (amarillo) | Funcional pero con advertencias |
| ❌ Error | XCircle (rojo) | Error que requiere atención |
| 🔄 Pending | Círculo gris | Aún no ejecutado |

### Badges Especiales

- 🛡️ **Recuperado**: El sistema de recuperación de errores se aplicó exitosamente
- 📏 **Truncado**: Los datos fueron truncados para evitar errores de tamaño

## 🔧 Solución de Problemas

### Backend no disponible

Si ves el mensaje "Backend no disponible", verifica:

```bash
# 1. Verificar estado de servicios
pm2 status

# 2. Ver logs del backend
pm2 logs kompa2go-backend

# 3. Reiniciar servicios si es necesario
bash restart-services.sh
```

### Permisos de ubicación

Si los permisos de ubicación fallan:
- En **web**: El navegador pedirá permisos automáticamente
- En **móvil**: Ve a configuración de la app y habilita permisos de ubicación

### Feature Flags no cargados

Si los feature flags no se cargan:

```bash
# Verificar variables de entorno
cat .env.local

# Debe contener:
# EXPO_PUBLIC_KOMMUTE_ENABLED=true
```

### Errores de Firebase

Si hay errores de Firebase/Firestore:

1. Verifica que Firebase esté configurado en `.env.local`
2. Revisa las reglas de seguridad en `firestore.rules`
3. Verifica que los índices estén creados en `firestore.indexes.json`

```bash
# Ver logs de Firebase
pm2 logs kompa2go-frontend | grep -i firebase
```

## 📈 Métricas de Éxito

### Validación Estándar
- **Éxito Total**: Todos los tests en verde ✅
- **Éxito Parcial**: Algunos warnings ⚠️ pero sin errores ❌
- **Fallo**: Uno o más tests en rojo ❌

### Test Completo
- **Estadísticas mostradas**:
  - Total de tests
  - Tests exitosos
  - Tests con errores
  - Tests en curso
  - Tests pendientes

## 🎯 Casos de Uso

### Desarrollo Local
```bash
# 1. Iniciar servicios
bash start-services.sh

# 2. Ejecutar validación
bash run-kommute-validation.sh

# 3. Abrir navegador en http://localhost:8081/kommute-validation
```

### Testing Continuo
```bash
# Mantener logs abiertos mientras desarrollas
pm2 logs

# En otra terminal, accede a las validaciones según necesites
```

### Debugging
```bash
# Ver logs específicos
pm2 logs kompa2go-frontend --lines 100
pm2 logs kompa2go-backend --lines 100

# Monitor en tiempo real
pm2 monit
```

## 🔍 Verificación Manual

### Backend Health Check
```bash
curl http://localhost:8081/api
```

Respuesta esperada:
```json
{
  "status": "ok",
  "message": "Kompa2Go API is running"
}
```

### tRPC Endpoint
```bash
curl http://localhost:8081/api/trpc
```

### Frontend
```bash
curl http://localhost:8081
```

Debe devolver el HTML de la aplicación.

## 📝 Notas Importantes

1. **Modo Desarrollo**: En desarrollo local sin backend configurado, es normal ver warnings en la conexión del backend
2. **Permisos**: La primera vez que ejecutes las validaciones, el navegador/app pedirá permisos
3. **Firebase**: Requiere autenticación anónima, que se hace automáticamente
4. **Persistencia**: Los servicios siguen corriendo aunque cierres la terminal

## 🎉 Resultado Esperado

Después de ejecutar las validaciones, deberías ver:

### Validación Estándar
```
✅ Kommute está listo
Estado: HABILITADO

Resultados de Validación:
✅ Contexto Base - Contexto inicializado correctamente
✅ Feature Flags - Feature flags cargados
✅ Permisos de Ubicación - Permisos concedidos
✅ Modos de Transporte - 4 modos disponibles
✅ Datos Locales - 0 rutas, 0 viajes
⚠️ Backend tRPC - Backend no configurado (modo desarrollo)
```

### Test Completo
```
Total: 30 tests
Exitosas: 28
Errores: 0
En Curso: 0

✅ Firebase & Firestore - Todos los tests pasaron
✅ Contexto Kommute - Todos los tests pasaron
⚠️ Backend tRPC - Servicios disponibles (sin llamadas reales)
✅ Funcionalidades Avanzadas - Todos los tests pasaron
```

## 🆘 Soporte

Si encuentras problemas:

1. Revisa los logs: `pm2 logs`
2. Verifica el estado: `pm2 status`
3. Reinicia servicios: `bash restart-services.sh`
4. Consulta: `PROCESS_MANAGEMENT_GUIDE.md`

---

**Última actualización**: 2025-10-02
**Versión**: 1.0.0
