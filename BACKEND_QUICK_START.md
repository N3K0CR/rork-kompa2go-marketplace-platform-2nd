# 🚀 Backend Quick Start - Kompa2Go

## ⚡ Inicio Rápido (3 comandos)

### 1️⃣ Verificar Estado
```bash
node backend-manager.js status
```

### 2️⃣ Iniciar Backend
```bash
node backend-manager.js start
```

### 3️⃣ Verificar que Funciona
```bash
node backend-manager.js status
```

---

## 🎯 Herramientas Disponibles

### 🔧 Backend Manager (Recomendado)
**Uso interactivo:**
```bash
node backend-manager.js
```
Muestra un menú con opciones:
1. Check Status
2. Start Backend
3. Stop Backend
4. Restart Backend
5. View Logs
6. Exit

**Uso directo:**
```bash
node backend-manager.js status    # Ver estado
node backend-manager.js start     # Iniciar
node backend-manager.js stop      # Detener
node backend-manager.js restart   # Reiniciar
```

### 🚀 Start Backend Reliable
```bash
node start-backend-reliable.js
```
- Verifica puerto disponible
- Mata procesos existentes
- Inicia backend
- Verifica salud automáticamente
- Reintenta hasta 3 veces

### 🔍 Check Backend Status
```bash
node check-backend-status.js
```
- Muestra estado del puerto
- Verifica todos los endpoints
- Muestra respuestas de cada endpoint

---

## 📋 Flujo de Trabajo Diario

### Mañana (Iniciar trabajo)
```bash
# 1. Verificar si está corriendo
node backend-manager.js status

# 2. Si no está corriendo, iniciar
node backend-manager.js start

# 3. Iniciar app
npm start
```

### Durante el día (Si hay problemas)
```bash
# Verificar estado
node backend-manager.js status

# Si no responde, reiniciar
node backend-manager.js restart
```

### Noche (Terminar trabajo)
```bash
# Detener backend (opcional)
node backend-manager.js stop
```

---

## 🆘 Solución de Problemas

### ❌ Error: "Failed to fetch"

**Paso 1: Verificar backend**
```bash
node backend-manager.js status
```

**Paso 2: Si no está corriendo**
```bash
node backend-manager.js start
```

**Paso 3: Verificar variable de entorno**
Archivo `.env.local` debe tener:
```
EXPO_PUBLIC_RORK_API_BASE_URL=http://localhost:8082
```

**Paso 4: Reiniciar app Expo**
```bash
# Detener app (Ctrl+C)
# Iniciar de nuevo
npm start
```

### ❌ Error: "Port 8082 already in use"

**Solución automática:**
```bash
node backend-manager.js restart
```

**Solución manual (Linux/Mac):**
```bash
lsof -ti:8082 | xargs kill -9
node backend-manager.js start
```

**Solución manual (Windows):**
```bash
netstat -ano | findstr :8082
taskkill /F /PID <PID_NUMBER>
node backend-manager.js start
```

### ❌ Backend inicia pero no responde

**Paso 1: Ver logs**
```bash
node backend-manager.js start
# Observar los logs en la terminal
```

**Paso 2: Verificar endpoints manualmente**
```bash
curl http://localhost:8082/api
curl http://localhost:8082/api/health/db
```

**Paso 3: Verificar dependencias**
```bash
npm install
```

---

## 📊 Endpoints del Backend

Una vez iniciado, estos endpoints están disponibles:

### Health Checks
- `http://localhost:8082/api` - API root
- `http://localhost:8082/api/health/db` - Database health

### tRPC
- `http://localhost:8082/api/trpc` - tRPC endpoint base

### Ejemplos de uso desde el navegador
```
http://localhost:8082/api
http://localhost:8082/api/health/db
```

---

## 🎓 Comandos Útiles

### Ver si el backend está corriendo
```bash
# Linux/Mac
lsof -ti:8082

# Windows
netstat -ano | findstr :8082
```

### Matar proceso en puerto 8082
```bash
# Linux/Mac
lsof -ti:8082 | xargs kill -9

# Windows
FOR /F "tokens=5" %P IN ('netstat -ano ^| findstr :8082') DO taskkill /F /PID %P
```

### Test manual de endpoints
```bash
curl http://localhost:8082/api
curl http://localhost:8082/api/health/db
curl http://localhost:8082/api/trpc/example.hi
```

---

## 📝 Notas Importantes

1. **El backend debe estar corriendo** antes de usar la app
2. **Puerto 8082** es el puerto por defecto
3. **Reiniciar backend** después de cambios en código backend
4. **NO reiniciar backend** para cambios solo en frontend
5. **Verificar estado** antes de reportar problemas

---

## 🔗 Recursos Adicionales

- **Guía completa**: `BACKEND_MANAGEMENT.md`
- **Código backend**: `/backend/`
- **Configuración**: `/.env.local`
- **Scripts**: `/backend-manager.js`, `/start-backend-reliable.js`

---

## ✅ Checklist Pre-Desarrollo

Antes de empezar a desarrollar, verifica:

- [ ] Backend está corriendo (`node backend-manager.js status`)
- [ ] Endpoints responden (`curl http://localhost:8082/api`)
- [ ] Variable de entorno configurada (`.env.local`)
- [ ] App Expo puede conectarse al backend

---

## 🎯 Comando Favorito (Todo en Uno)

```bash
# Verificar y arrancar si es necesario
node backend-manager.js status && node backend-manager.js start
```

O simplemente:
```bash
node backend-manager.js
```
Y usar el menú interactivo.

---

**¿Problemas?** Revisa `BACKEND_MANAGEMENT.md` para más detalles.
