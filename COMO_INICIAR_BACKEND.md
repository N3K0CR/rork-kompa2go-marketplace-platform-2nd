# 🚀 Cómo Iniciar el Backend de Kompa2Go

## Inicio Rápido

### 1. Iniciar el Backend
```bash
bash START_BACKEND_NOW.sh
```

Este script:
- ✅ Limpia procesos anteriores
- ✅ Inicia el backend en puerto 8082
- ✅ Espera 10 segundos para que inicie
- ✅ Verifica que los endpoints estén respondiendo
- ✅ Muestra el estado en VERDE

### 2. Verificar Estado
```bash
bash VERIFY_STATUS.sh
```

Este script verifica:
- ✅ Si el proceso está corriendo
- ✅ Si los endpoints responden
- ✅ Muestra los últimos logs

## URLs del Backend

- **API Principal**: http://localhost:8082/api
- **tRPC**: http://localhost:8082/api/trpc

## Comandos Útiles

### Ver logs en tiempo real
```bash
tail -f /tmp/kompa2go-backend.log
```

### Detener el backend
```bash
pkill -f 'rork start'
```

### Ver proceso corriendo
```bash
pgrep -f "rork start"
```

## Solución de Problemas

### El backend no inicia
1. Verifica que el puerto 8082 esté libre:
   ```bash
   lsof -i :8082
   ```

2. Si hay algo corriendo, mátalo:
   ```bash
   pkill -9 -f "rork start"
   ```

3. Vuelve a iniciar:
   ```bash
   bash START_BACKEND_NOW.sh
   ```

### El backend está en AMARILLO o ROJO
1. Revisa los logs:
   ```bash
   tail -50 /tmp/kompa2go-backend.log
   ```

2. Reinicia el backend:
   ```bash
   pkill -f 'rork start'
   bash START_BACKEND_NOW.sh
   ```

## Estado Esperado

Cuando todo funciona correctamente, deberías ver:

```
✅ Backend API: VERDE
✅ tRPC Endpoint: VERDE
```

Y la respuesta del servidor debería ser:
```json
{"status":"ok","message":"API is running"}
```
