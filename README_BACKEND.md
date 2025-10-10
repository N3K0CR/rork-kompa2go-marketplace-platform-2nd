# 🚀 Kompa2Go Backend - README

## ⚡ Inicio Rápido (3 Pasos)

### 1. Verificar Setup
```bash
node verify-backend-setup.js
```

### 2. Iniciar Backend
```bash
node backend-manager.js start
```

### 3. Verificar que Funciona
```bash
node backend-manager.js status
```

---

## 📚 Documentación Disponible

### Para Uso Diario
- **`LEEME_BACKEND.md`** ⭐ - Referencia rápida en español
- **`BACKEND_QUICK_START.md`** - Guía de inicio rápido

### Para Referencia Completa
- **`BACKEND_MANAGEMENT.md`** - Guía completa y detallada
- **`BACKEND_SETUP_COMPLETE.md`** - Resumen de la configuración

---

## 🛠️ Herramientas Disponibles

### Backend Manager (Principal)
```bash
# Menú interactivo
node backend-manager.js

# Comandos directos
node backend-manager.js status    # Ver estado
node backend-manager.js start     # Iniciar
node backend-manager.js stop      # Detener
node backend-manager.js restart   # Reiniciar
```

### Scripts Adicionales
```bash
# Inicio confiable con verificación automática
node start-backend-reliable.js

# Solo verificar estado
node check-backend-status.js

# Verificar configuración completa
node verify-backend-setup.js
```

---

## 🎯 Información del Backend

### Configuración
- **Puerto**: 8082
- **Host**: 0.0.0.0
- **Base URL**: http://localhost:8082
- **tRPC Endpoint**: http://localhost:8082/api/trpc

### Endpoints Principales
- `GET /api` - API root
- `GET /api/health/db` - Database health check
- `POST /api/trpc/*` - tRPC endpoints

### Variables de Entorno
```bash
EXPO_PUBLIC_RORK_API_BASE_URL=http://localhost:8082
PORT=8082
HOST=0.0.0.0
NODE_ENV=development
```

---

## 🆘 Solución Rápida de Problemas

### Error: "Failed to fetch"
```bash
node backend-manager.js status
node backend-manager.js start
```

### Error: "Port already in use"
```bash
node backend-manager.js restart
```

### Backend no responde
```bash
node backend-manager.js restart
```

---

## ✅ Checklist Pre-Desarrollo

Antes de empezar a desarrollar:

```bash
# 1. Verificar setup completo
node verify-backend-setup.js

# 2. Verificar backend está corriendo
node backend-manager.js status

# 3. Si no está corriendo, iniciar
node backend-manager.js start

# 4. Iniciar app
npm start
```

---

## 📁 Estructura del Backend

```
backend/
├── hono.ts              # Configuración principal de Hono
├── server.ts            # Servidor HTTP
├── middleware/
│   └── security.ts      # Middleware de seguridad
├── config/
│   └── security.ts      # Configuración de seguridad
└── trpc/
    ├── app-router.ts    # Router principal de tRPC
    ├── create-context.ts # Contexto de tRPC
    └── routes/          # Rutas individuales
        ├── example/
        ├── registration/
        ├── geocoding/
        ├── payments/
        ├── commute/
        └── kommute-wallet/
```

---

## 🎓 Comandos Más Usados

```bash
# Verificar estado del backend
node backend-manager.js status

# Iniciar backend
node backend-manager.js start

# Reiniciar backend
node backend-manager.js restart

# Verificar configuración completa
node verify-backend-setup.js

# Menú interactivo
node backend-manager.js
```

---

## 💡 Tips

1. **Siempre verifica el estado primero**: `node backend-manager.js status`
2. **Usa el manager para todo**: Es la herramienta principal
3. **Verifica el setup**: `node verify-backend-setup.js` si tienes dudas
4. **Mantén el backend corriendo** mientras desarrollas
5. **Reinicia solo después de cambios** en código backend

---

## 🔗 Enlaces Rápidos

- **Referencia rápida**: [LEEME_BACKEND.md](./LEEME_BACKEND.md)
- **Guía de inicio**: [BACKEND_QUICK_START.md](./BACKEND_QUICK_START.md)
- **Guía completa**: [BACKEND_MANAGEMENT.md](./BACKEND_MANAGEMENT.md)
- **Setup completo**: [BACKEND_SETUP_COMPLETE.md](./BACKEND_SETUP_COMPLETE.md)

---

## 📞 Ayuda

Si tienes problemas:

1. Verifica el estado: `node backend-manager.js status`
2. Verifica el setup: `node verify-backend-setup.js`
3. Revisa la documentación: `LEEME_BACKEND.md`
4. Reinicia el backend: `node backend-manager.js restart`

---

## ✨ Características

- ✅ Gestión automática de procesos
- ✅ Verificación de salud automática
- ✅ Limpieza de puertos automática
- ✅ Reintentos automáticos
- ✅ Logs detallados
- ✅ Menú interactivo
- ✅ Comandos directos
- ✅ Documentación completa

---

**¡Todo listo para desarrollar!** 🎉

Para empezar, ejecuta:
```bash
node backend-manager.js
```
