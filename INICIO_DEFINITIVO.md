# 🚀 Guía de Inicio Definitiva - Kompa2Go

## ✅ Solución al Problema de Conexión Frontend-Backend

### 🎯 Comandos Disponibles

#### **Opción 1: Inicio Completo (Recomendado)**
```bash
bash start.sh
```
- ✅ Inicia backend automáticamente
- ✅ Verifica que esté respondiendo
- ✅ Luego inicia el frontend
- ✅ Gestiona ambos procesos
- ✅ Detiene todo con Ctrl+C

#### **Opción 2: Inicio Rápido**
```bash
bash start-dev.sh
```
- Inicia backend y frontend sin verificaciones
- Más rápido pero menos seguro

#### **Opción 3: Manual (Para Debug)**
```bash
# Terminal 1 - Backend
node --import=tsx/esm backend/server.ts

# Terminal 2 - Frontend (espera 5 segundos después del backend)
bunx rork start -p z5be445fq2fb0yuu32aht --tunnel
```

---

## 🔧 Solución a Errores Comunes

### Error: "Failed to fetch" / CORS
**Causa**: El frontend intenta conectarse antes de que el backend esté listo

**Solución**: Usa `bash start.sh` que espera a que el backend responda

### Error: "Port already in use"
**Solución**: Los scripts automáticamente limpian los puertos

Si persiste:
```bash
lsof -ti:8082 | xargs kill -9
lsof -ti:8081 | xargs kill -9
```

### Error: Backend crashea con "tsx must be loaded with --import"
**Solución**: Ya corregido. Usamos `--import=tsx/esm` en lugar de `--loader`

---

## 📊 Verificar que Todo Funciona

### 1. Verificar Backend
```bash
curl http://localhost:8082/api/
```
Debe responder: `{"status":"ok","message":"API is running"}`

### 2. Verificar tRPC
Abre en el navegador:
```
http://localhost:8082/api/debug/env
```

### 3. Ver Logs del Backend
```bash
tail -f backend.log
```

---

## 🔄 Flujo de Inicio Correcto

```mermaid
graph TD
    A[Ejecutar start.sh] --> B[Limpiar puertos 8082, 8081]
    B --> C[Iniciar backend en segundo plano]
    C --> D{Backend responde?}
    D -->|No| E[Esperar 1s y reintentar]
    E --> D
    D -->|Sí| F[Iniciar frontend]
    F --> G[Ambos corriendo ✅]
```

---

## 🚨 Si Nada Funciona

1. **Limpieza Total**:
```bash
# Matar todos los procesos de node
pkill -9 node

# Limpiar puertos
lsof -ti:8082 | xargs kill -9
lsof -ti:8081 | xargs kill -9

# Limpiar cache de Expo
rm -rf node_modules/.cache
```

2. **Reiniciar**:
```bash
bash start.sh
```

3. **Ver logs detallados**:
```bash
# Backend
tail -f backend.log

# Frontend (en otra terminal)
# Los logs aparecerán en la terminal donde ejecutaste start.sh
```

---

## ⚙️ Configuración Técnica

### Variables de Entorno (.env.local)
```env
EXPO_PUBLIC_RORK_API_BASE_URL=http://localhost:8082
EXPO_PUBLIC_BACKEND_URL=http://0.0.0.0:8082
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyAVnzJY7V-8GHqm3TlKAMcT3_Lavh_CK-E
```

### Puertos Usados
- **Backend**: 8082
- **Frontend**: 8081 (asignado por Expo)
- **tRPC**: 8082/api/trpc

### CORS Configurado
El backend acepta peticiones de cualquier origen (`Access-Control-Allow-Origin: *`)

---

## 📝 Checklist de Problemas Resueltos

- [x] CORS habilitado en backend
- [x] Backend inicia automáticamente
- [x] Frontend espera a que backend esté listo
- [x] Gestión correcta de procesos
- [x] Limpieza automática de puertos
- [x] Logs accesibles para debug
- [x] Handler de shutdown limpio (Ctrl+C)
- [x] Variables de entorno cargadas correctamente

---

## 🎯 Próximos Pasos

Una vez que todo esté corriendo con `bash start.sh`:

1. Abre la app en tu navegador o dispositivo
2. Verifica que el geocoding funcione
3. Prueba la búsqueda de destinos
4. Si hay errores, revisa `backend.log`

---

## 💡 Tips

- **Siempre usa** `bash start.sh` para iniciar
- **No inicies** frontend y backend por separado manualmente
- **Si cambias** código del backend, reinicia con Ctrl+C y vuelve a ejecutar `bash start.sh`
- **Los logs** del backend están en `backend.log`
