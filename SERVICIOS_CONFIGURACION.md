# 🚀 Configuración de Servicios - Kompa2Go

## 📋 Resumen de Cambios

### ✅ Cambios Realizados

1. **Actualización de ecosystem.config.js**
   - Cambiado de `bun expo start` a `bunx rork start` para usar Rork CLI
   - Frontend: Puerto 8081 con `--web --tunnel`
   - Backend: Puerto 8082 sin flags adicionales
   - Ambos servicios usan el proyecto ID: `z5be445fq2fb0yuu32aht`

2. **Mejora de start-services.sh**
   - Agregado manejo de errores robusto
   - Verificación de instalación de PM2
   - Limpieza de servicios anteriores antes de iniciar
   - Espera de 2 segundos para liberar puertos
   - URLs actualizadas correctamente (Backend en 8082)
   - Comando de verificación con curl

3. **Creación de init-services.sh**
   - Script alternativo con la misma funcionalidad
   - Útil como respaldo

### 🎯 Arquitectura de Puertos

```
Frontend (Expo Web):  http://localhost:8081
Backend (Hono/tRPC):  http://localhost:8082
tRPC Endpoint:        http://localhost:8082/api/trpc
Health Check:         http://localhost:8082/api
```

### 🔧 Configuración de PM2

**Frontend (kompa2go-frontend)**
- Script: `bunx rork start -p z5be445fq2fb0yuu32aht --web --tunnel`
- Puerto: 8081
- Memoria máxima: 1GB
- Auto-reinicio: Sí
- Logs: `./logs/frontend-*.log`

**Backend (kompa2go-backend)**
- Script: `bunx rork start -p z5be445fq2fb0yuu32aht`
- Puerto: 8082
- Memoria máxima: 512MB
- Auto-reinicio: Sí
- Logs: `./logs/backend-*.log`

### 📝 Comandos Disponibles

```bash
# Iniciar servicios
bash start-services.sh

# Verificar estado
bash check-services.sh
pm2 status

# Ver logs
pm2 logs
pm2 logs kompa2go-frontend
pm2 logs kompa2go-backend

# Reiniciar
bash restart-services.sh
pm2 restart all

# Detener
bash stop-services.sh
pm2 stop all

# Eliminar
pm2 delete all

# Monitor interactivo
pm2 monit
```

### ✨ Ventajas de Esta Configuración

1. **Persistencia**: Los servicios siguen corriendo aunque cierres la terminal
2. **Auto-recuperación**: Si un servicio falla, PM2 lo reinicia automáticamente
3. **Logs centralizados**: Todos los logs en `./logs/`
4. **Monitoreo**: PM2 proporciona métricas en tiempo real
5. **Gestión simple**: Comandos fáciles de recordar
6. **Eficiencia**: No necesitas mantener terminales abiertas

### 🔍 Verificación Post-Inicio

Después de iniciar los servicios, verifica que todo funciona:

```bash
# Verificar Backend
curl http://localhost:8082/api

# Debería responder:
# {"status":"ok","message":"API is running"}

# Verificar Frontend
# Abre en navegador: http://localhost:8081
```

### ⚠️ Notas Importantes

1. **No usar npm**: Todo el proyecto usa Bun
2. **Rork CLI**: Los servicios usan `bunx rork start` en lugar de `bun expo start`
3. **Puertos separados**: Frontend (8081) y Backend (8082) en puertos diferentes
4. **Tunnel habilitado**: El frontend usa `--tunnel` para acceso remoto
5. **PM2 global**: PM2 se instala globalmente con `bun add -g pm2`

### 🐛 Solución de Problemas

**Si los servicios no inician:**
```bash
pm2 delete all
bash start-services.sh
```

**Si hay conflicto de puertos:**
```bash
# Verificar qué está usando los puertos
lsof -i :8081
lsof -i :8082

# Matar procesos si es necesario
kill -9 <PID>
```

**Si PM2 no responde:**
```bash
pm2 kill
bash start-services.sh
```

### 📊 Estado Actual

- ✅ Configuración de PM2 actualizada
- ✅ Scripts de inicio mejorados
- ✅ Documentación completa
- ⏳ Servicios listos para iniciar

### 🚀 Próximo Paso

Ejecutar: `bash start-services.sh`

---

**Fecha de configuración**: 2025-10-02
**Versión**: 1.0
**Estado**: Listo para producción
