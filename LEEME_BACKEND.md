# 🎯 BACKEND - Guía Rápida para Adrián

## 🚀 Comandos Principales

### ✅ Verificar Estado del Backend
```bash
node backend-manager.js status
```

### ▶️ Iniciar Backend
```bash
node backend-manager.js start
```

### 🔄 Reiniciar Backend
```bash
node backend-manager.js restart
```

### ⏹️ Detener Backend
```bash
node backend-manager.js stop
```

### 📋 Menú Interactivo
```bash
node backend-manager.js
```

---

## 🎯 Lo Que Necesitas Saber

### 1. El Backend DEBE estar corriendo
- **Puerto**: 8082
- **URL**: http://localhost:8082
- **Verificar**: `node backend-manager.js status`

### 2. Cuándo Reiniciar el Backend
- ✅ Después de cambios en `/backend/`
- ✅ Si ves errores "Failed to fetch"
- ✅ Si la app no se conecta
- ❌ NO reiniciar para cambios en frontend

### 3. Variables de Entorno
Archivo `.env.local` debe tener:
```
EXPO_PUBLIC_RORK_API_BASE_URL=http://localhost:8082
```

---

## 🆘 Solución Rápida de Problemas

### Error: "Failed to fetch"
```bash
# 1. Verificar backend
node backend-manager.js status

# 2. Si no está corriendo, iniciar
node backend-manager.js start

# 3. Reiniciar app Expo
```

### Error: "Port 8082 already in use"
```bash
# Reiniciar automáticamente
node backend-manager.js restart
```

### Backend no responde
```bash
# Ver logs y reiniciar
node backend-manager.js restart
```

---

## 📁 Archivos Importantes

### Scripts de Gestión
- `backend-manager.js` - **Herramienta principal** (usa este)
- `start-backend-reliable.js` - Inicio con verificación automática
- `check-backend-status.js` - Solo verificar estado

### Documentación
- `BACKEND_QUICK_START.md` - Guía de inicio rápido
- `BACKEND_MANAGEMENT.md` - Guía completa y detallada

### Código Backend
- `/backend/hono.ts` - Configuración principal
- `/backend/server.ts` - Servidor
- `/backend/trpc/app-router.ts` - Rutas tRPC

---

## ✅ Checklist Diario

### Al Empezar a Trabajar
```bash
# 1. Verificar backend
node backend-manager.js status

# 2. Si no está corriendo
node backend-manager.js start

# 3. Iniciar app
npm start
```

### Si Hay Problemas
```bash
# 1. Verificar estado
node backend-manager.js status

# 2. Reiniciar
node backend-manager.js restart

# 3. Verificar de nuevo
node backend-manager.js status
```

---

## 🎓 Recordatorios

1. **Siempre verifica el estado primero**: `node backend-manager.js status`
2. **Usa el manager para todo**: `node backend-manager.js`
3. **El backend debe estar corriendo** para que la app funcione
4. **Reinicia después de cambios** en código backend
5. **Verifica los logs** si algo falla

---

## 🔗 Endpoints del Backend

Una vez corriendo:
- API Root: http://localhost:8082/api
- Health Check: http://localhost:8082/api/health/db
- tRPC: http://localhost:8082/api/trpc

---

## 💡 Tip Pro

**Comando favorito** (verifica y muestra menú):
```bash
node backend-manager.js
```

Selecciona la opción que necesites del menú interactivo.

---

**¿Más detalles?** Lee `BACKEND_QUICK_START.md` o `BACKEND_MANAGEMENT.md`
