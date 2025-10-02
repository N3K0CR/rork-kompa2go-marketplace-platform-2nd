# 🚀 Inicio Rápido - Kompa2Go

## Comandos Esenciales

### 1️⃣ Iniciar todos los servicios
```bash
bash start-services.sh
```
Esto iniciará Frontend (puerto 8081) y Backend de manera persistente.

### 2️⃣ Verificar estado
```bash
bash check-services.sh
```
O directamente:
```bash
pm2 status
```

### 3️⃣ Ver logs en tiempo real
```bash
pm2 logs
```

### 4️⃣ Reiniciar servicios
```bash
bash restart-services.sh
```
O directamente:
```bash
pm2 restart all
```

### 5️⃣ Detener servicios
```bash
bash stop-services.sh
```

## 🎯 URLs del Sistema

- **Frontend**: http://localhost:8081
- **Backend API**: http://localhost:8081/api
- **tRPC**: http://localhost:8081/api/trpc

## ✨ Características Clave

- ✅ Los servicios siguen corriendo aunque cierres la terminal
- ✅ Auto-reinicio automático si hay errores
- ✅ Logs centralizados en `./logs/`
- ✅ Monitoreo en tiempo real con `pm2 monit`

## 🔧 Solución Rápida de Problemas

### Si algo no funciona:
```bash
pm2 delete all
bash start-services.sh
```

### Ver errores específicos:
```bash
pm2 logs kompa2go-frontend --err
pm2 logs kompa2go-backend --err
```

### Monitor interactivo:
```bash
pm2 monit
```

## 📝 Notas Importantes

1. **No uses npm** - Todo usa Bun
2. **Los servicios persisten** - Puedes cerrar la terminal
3. **Primera vez**: El script instalará PM2 automáticamente si no está

## 🎉 ¡Listo!

Ahora tienes un sistema profesional de gestión de procesos que mantiene tu aplicación corriendo de manera eficiente y confiable.

Para más detalles, consulta: `PROCESS_MANAGEMENT_GUIDE.md`
