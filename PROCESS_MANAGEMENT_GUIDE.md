# 🚀 Guía de Gestión de Procesos - Kompa2Go

## Sistema Implementado

Se ha implementado **PM2** como gestor de procesos para mantener el Frontend y Backend corriendo de manera persistente y eficiente, sin depender de terminales abiertas.

## 📋 Características

- ✅ **Persistencia**: Los servicios siguen corriendo aunque cierres la terminal
- ✅ **Auto-reinicio**: Si un servicio falla, se reinicia automáticamente
- ✅ **Monitoreo**: Logs centralizados y monitoreo en tiempo real
- ✅ **Gestión simple**: Scripts bash para iniciar/detener todo con un comando
- ✅ **Eficiencia**: Usa Bun como runtime (no npm)

## 🎯 Comandos Principales

### Iniciar todos los servicios
```bash
bash start-services.sh
```
O manualmente:
```bash
pm2 start ecosystem.config.js
```

### Detener todos los servicios
```bash
bash stop-services.sh
```
O manualmente:
```bash
pm2 stop all
```

### Ver estado de los servicios
```bash
pm2 status
```

### Ver logs en tiempo real
```bash
pm2 logs
```

### Ver logs de un servicio específico
```bash
pm2 logs kompa2go-frontend
pm2 logs kompa2go-backend
```

### Reiniciar servicios
```bash
pm2 restart all
# O específico:
pm2 restart kompa2go-frontend
pm2 restart kompa2go-backend
```

### Monitor interactivo
```bash
pm2 monit
```

### Eliminar servicios de PM2
```bash
pm2 delete all
```

## 📁 Archivos Creados

### 1. `ecosystem.config.js`
Configuración principal de PM2 con:
- Definición de ambos servicios (frontend y backend)
- Auto-reinicio configurado
- Límites de memoria
- Gestión de logs
- Delays de reinicio para evitar loops

### 2. `.pm2rc.js`
Configuración global de PM2 con:
- Modo daemon habilitado
- Configuración de logs
- Políticas de reinicio
- Timeouts y límites

### 3. `start-services.sh`
Script bash para iniciar todos los servicios de una vez.

### 4. `stop-services.sh`
Script bash para detener todos los servicios.

## 🔧 Configuración de Servicios

### Frontend (Puerto 8081)
- **Comando**: `bun expo start --web --tunnel`
- **Auto-reinicio**: Sí
- **Límite de memoria**: 1GB
- **Logs**: `./logs/frontend-*.log`

### Backend
- **Comando**: `bun run backend/hono.ts`
- **Auto-reinicio**: Sí
- **Límite de memoria**: 512MB
- **Logs**: `./logs/backend-*.log`

## 📊 Monitoreo

Los logs se guardan automáticamente en:
```
./logs/
  ├── frontend-error.log
  ├── frontend-out.log
  ├── backend-error.log
  └── backend-out.log
```

## 🔄 Flujo de Trabajo Recomendado

### Desarrollo diario:
1. **Iniciar servicios**: `bash start-services.sh`
2. **Trabajar normalmente** (puedes cerrar la terminal)
3. **Ver logs si necesitas**: `pm2 logs`
4. **Al terminar el día**: `bash stop-services.sh` (opcional, pueden seguir corriendo)

### Si necesitas reiniciar:
```bash
pm2 restart all
```

### Si hay problemas:
```bash
pm2 logs
pm2 monit
```

## 🆘 Solución de Problemas

### Los servicios no inician
```bash
pm2 delete all
bash start-services.sh
```

### Ver errores específicos
```bash
pm2 logs kompa2go-frontend --err
pm2 logs kompa2go-backend --err
```

### Limpiar todo y empezar de nuevo
```bash
pm2 kill
bash start-services.sh
```

### Ver uso de recursos
```bash
pm2 monit
```

## 🎯 Ventajas vs Sistema Anterior

| Aspecto | Antes | Ahora |
|---------|-------|-------|
| **Persistencia** | ❌ Se cerraba con la terminal | ✅ Sigue corriendo |
| **Reinicio** | ❌ Manual | ✅ Automático |
| **Logs** | ❌ Dispersos | ✅ Centralizados |
| **Monitoreo** | ❌ No disponible | ✅ En tiempo real |
| **Eficiencia** | ⚠️ Media | ✅ Alta |
| **Gestión** | ❌ Compleja | ✅ Simple |

## 🔐 Seguridad

- PM2 corre en modo daemon seguro
- Los logs no exponen información sensible
- Auto-reinicio limitado a 10 intentos para evitar loops infinitos
- Timeouts configurados para evitar procesos zombies

## 📝 Notas Importantes

1. **No uses npm**: Todo está configurado para usar Bun
2. **Los servicios persisten**: Aunque cierres la terminal, siguen corriendo
3. **Logs rotativos**: PM2 gestiona automáticamente el tamaño de los logs
4. **Memoria limitada**: Si un servicio excede el límite, se reinicia automáticamente

## 🚀 Comandos Rápidos

```bash
# Iniciar todo
bash start-services.sh

# Ver estado
pm2 status

# Ver logs
pm2 logs

# Reiniciar
pm2 restart all

# Detener
bash stop-services.sh

# Monitor
pm2 monit
```

## 🎉 Resultado

Ahora tienes un sistema de gestión de procesos profesional que:
- ✅ Mantiene los servicios corriendo 24/7
- ✅ Se recupera automáticamente de errores
- ✅ Proporciona monitoreo en tiempo real
- ✅ Es fácil de usar y mantener
- ✅ No depende de terminales abiertas
