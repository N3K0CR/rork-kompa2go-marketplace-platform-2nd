# 🔧 Solución para Error 502 (Bad Gateway)

## ❌ Problema
El error 502 indica que el backend no está corriendo o no es accesible.

## ✅ Solución Rápida

### Opción 1: Ejecutar script de diagnóstico
```bash
chmod +x diagnose-backend.sh
./diagnose-backend.sh
```

### Opción 2: Ejecutar script de reparación
```bash
chmod +x fix-backend-connection.sh
./fix-backend-connection.sh
```

### Opción 3: Iniciar backend manualmente
```bash
chmod +x START_BACKEND_NOW.sh
./START_BACKEND_NOW.sh
```

## 🔍 Verificación Manual

### 1. Verificar si el backend está corriendo
```bash
pgrep -af "rork start"
```

Si no muestra nada, el backend NO está corriendo.

### 2. Verificar puertos
```bash
lsof -i :8082
```

El puerto 8082 debe estar en uso por el proceso de Rork.

### 3. Probar conexión al backend
```bash
curl http://localhost:8082/api
```

Debería responder con: `{"status":"ok","message":"API is running"}`

## 🚀 Iniciar Backend Paso a Paso

```bash
# 1. Limpiar procesos anteriores
pkill -f "rork start"

# 2. Esperar 2 segundos
sleep 2

# 3. Iniciar backend
bunx rork start -p z5be445fq2fb0yuu32aht > /tmp/kompa2go-backend.log 2>&1 &

# 4. Esperar 10 segundos
sleep 10

# 5. Verificar
curl http://localhost:8082/api
```

## 📝 Ver Logs del Backend

```bash
# Ver logs en tiempo real
tail -f /tmp/kompa2go-backend.log

# Ver últimas 50 líneas
tail -50 /tmp/kompa2go-backend.log
```

## ⚠️ Problemas Comunes

### El backend no inicia
- **Causa**: Puerto 8082 ocupado por otro proceso
- **Solución**: 
  ```bash
  lsof -ti :8082 | xargs kill -9
  ```

### Backend inicia pero no responde
- **Causa**: El backend está iniciando (tarda ~10-15 segundos)
- **Solución**: Esperar más tiempo y verificar logs

### Error de conexión en el frontend
- **Causa**: Variable de entorno incorrecta
- **Solución**: Verificar que `.env.local` tenga:
  ```
  EXPO_PUBLIC_RORK_API_BASE_URL=http://localhost:8082
  ```

## 🎯 Comandos Útiles

```bash
# Detener backend
pkill -f "rork start"

# Ver procesos de Rork
pgrep -af rork

# Verificar puertos en uso
lsof -i :8081  # Frontend
lsof -i :8082  # Backend

# Limpiar todo y reiniciar
pkill -f "rork start" && sleep 2 && ./START_BACKEND_NOW.sh
```

## 📊 Estado Esperado

Cuando todo funciona correctamente:

1. ✅ Proceso `rork start` corriendo
2. ✅ Puerto 8082 en uso
3. ✅ `curl http://localhost:8082/api` responde con JSON
4. ✅ Frontend puede hacer llamadas tRPC sin error 502

## 🆘 Si Nada Funciona

1. Revisar logs completos:
   ```bash
   cat /tmp/kompa2go-backend.log
   ```

2. Verificar que Rork CLI esté instalado:
   ```bash
   bunx rork --version
   ```

3. Reiniciar todo el entorno:
   ```bash
   pkill -f rork
   sleep 5
   ./START_BACKEND_NOW.sh
   ```

4. Si el problema persiste, el backend puede tener un error de código. Revisar:
   - `backend/hono.ts`
   - `backend/trpc/app-router.ts`
   - Logs en `/tmp/kompa2go-backend.log`
