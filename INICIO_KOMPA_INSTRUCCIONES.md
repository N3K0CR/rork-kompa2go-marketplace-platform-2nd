# 🚀 Cómo Iniciar Kompa2Go

## Problema Identificado
El backend se inicia correctamente, pero el health check falla debido a problemas de conectividad de red o timing.

## ✅ Solución 1: Script Simplificado (RECOMENDADO)

```bash
chmod +x START_KOMPA.sh
./START_KOMPA.sh
```

Este script:
- Limpia el puerto 8082
- Inicia el backend en background
- Espera 5 segundos
- Muestra los logs del backend
- Inicia el frontend

**Logs del backend:** `/tmp/kompa-backend.log`

## ✅ Solución 2: Script Node.js Simple

```bash
chmod +x start-simple.js
node start-simple.js
```

Este script inicia ambos servicios sin health checks complejos.

## ✅ Solución 3: Iniciar Manualmente (Para Debug)

### Terminal 1 - Backend:
```bash
bun run backend/server.ts
```

### Terminal 2 - Verificar Backend:
```bash
# Esperar 3-5 segundos después de iniciar
curl http://localhost:8082/api/
# Debe responder: {"status":"ok","message":"API is running"}
```

### Terminal 3 - Frontend:
```bash
bun x rork start -p z5be445fq2fb0yuu32aht --tunnel
```

## 🔍 Diagnóstico de Problemas

### 1. Verificar que el backend responde:
```bash
curl http://localhost:8082/api/
curl http://127.0.0.1:8082/api/
```

### 2. Ver logs del backend:
```bash
cat /tmp/kompa-backend.log
```

### 3. Verificar puerto 8082:
```bash
lsof -i:8082
# o
netstat -an | grep 8082
```

### 4. Verificar variables de entorno:
```bash
cat .env.local | grep BACKEND
cat .env.local | grep GOOGLE
```

## 🐛 Errores Comunes

### "Failed to fetch" en Frontend
**Causa:** El frontend no puede conectarse al backend

**Solución:**
1. Verificar que el backend está corriendo: `curl http://localhost:8082/api/`
2. Verificar .env.local tiene `EXPO_PUBLIC_RORK_API_BASE_URL=http://localhost:8082`
3. Si estás en móvil, cambiar a la IP de tu computadora: `http://TU_IP:8082`

### "Backend timeout"
**Causa:** El health check no puede conectarse al backend

**Solución:**
1. Usar `START_KOMPA.sh` que no depende de health checks
2. O iniciar manualmente en dos terminales separadas

### "Port already in use"
**Causa:** Otro proceso usa el puerto 8082

**Solución:**
```bash
lsof -ti:8082 | xargs kill -9
```

## 📱 Para Móvil

Si quieres acceder desde tu teléfono:

1. Obtener tu IP local:
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
# o en Linux:
hostname -I
```

2. Actualizar .env.local:
```bash
EXPO_PUBLIC_RORK_API_BASE_URL=http://TU_IP:8082
```

3. Reiniciar todo

## 💡 Recomendación Final

**Usa `START_KOMPA.sh` para un inicio rápido y confiable.**

Si sigue fallando, abre 2 terminales y ejecuta manualmente:
- Terminal 1: `bun run backend/server.ts`  
- Terminal 2: `bun x rork start -p z5be445fq2fb0yuu32aht --tunnel`
