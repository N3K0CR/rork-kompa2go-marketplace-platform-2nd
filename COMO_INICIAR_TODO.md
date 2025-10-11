# 🚀 Cómo Iniciar el Entorno de Desarrollo Completo

## Solución Definitiva: Un Solo Comando

He creado **dos scripts** que inician automáticamente el backend y el frontend juntos:

### Opción 1: Script Node.js (Recomendado)

```bash
node start-dev.js
```

### Opción 2: Script Bash

```bash
chmod +x start-dev.sh
./start-dev.sh
```

## ¿Qué Hace Este Script?

1. **Inicia el Backend (Hono/tRPC)**
   - Ubicación: `backend/server.ts`
   - Con **auto-reload** usando `nodemon`
   - Cualquier cambio en archivos `.ts`, `.js`, `.json` en la carpeta `backend/` reiniciará automáticamente el servidor

2. **Inicia el Frontend (Expo)**
   - Aplicación React Native
   - Con túnel para acceso desde dispositivos móviles
   - Hot reload automático

3. **Logs Coloreados**
   - `[BACKEND]` en azul
   - `[FRONTEND]` en magenta
   - Fácil de distinguir qué servicio genera cada log

## Ventajas de Esta Solución

✅ **Un solo comando** para iniciar todo
✅ **Auto-reload** del backend cuando cambias código
✅ **Logs separados** y coloreados para fácil debugging
✅ **Manejo de errores** robusto
✅ **Detención limpia** con Ctrl+C (mata ambos procesos)
✅ **No más olvidos** de iniciar el backend

## Cómo Detener

Simplemente presiona `Ctrl+C` en la terminal. Ambos servicios se detendrán automáticamente.

## Solución al Problema Original

### Antes:
- ❌ Tenías que iniciar el backend manualmente
- ❌ Los scripts fallaban o se olvidaban
- ❌ Errores constantes: "Failed to fetch", "signal is aborted without reason"
- ❌ Pérdida de tiempo y frustración

### Ahora:
- ✅ Un solo comando: `node start-dev.js`
- ✅ Backend siempre disponible
- ✅ Auto-reload en cambios
- ✅ Logs claros y organizados
- ✅ Detención limpia de ambos servicios

## Troubleshooting

### Si el backend no inicia:
```bash
# Verificar que el puerto no esté ocupado
lsof -ti:3000 | xargs kill -9

# Reintentar
node start-dev.js
```

### Si el frontend no inicia:
```bash
# Limpiar caché de Expo
bunx expo start --clear

# O usar el script
node start-dev.js
```

### Si ves "signal is aborted without reason":
- Ahora que el backend está siempre corriendo, este error debería desaparecer
- Si persiste, verifica que la API key de Google Maps esté configurada en `.env.local`

## Dependencias Necesarias

Ya están instaladas en tu proyecto:
- ✅ `nodemon` - Para auto-reload del backend
- ✅ `concurrently` - Para ejecutar múltiples procesos
- ✅ `tsx` - Para ejecutar TypeScript directamente

## Modificación Manual del package.json (Opcional)

Si quieres agregar estos scripts al `package.json` manualmente, abre el archivo y agrega estas líneas en la sección `"scripts"`:

```json
"scripts": {
  "start": "bunx rork start -p z5be445fq2fb0yuu32aht --tunnel",
  "start-web": "bunx rork start -p z5be445fq2fb0yuu32aht --web --tunnel",
  "start-web-dev": "DEBUG=expo* bunx rork start -p z5be445fq2fb0yuu32aht --web --tunnel",
  "lint": "expo lint",
  "backend": "nodemon --watch backend --ext ts,js,json --exec \"tsx backend/server.ts\"",
  "frontend": "bunx rork start -p z5be445fq2fb0yuu32aht --tunnel",
  "dev": "node start-dev.js"
}
```

Luego podrás usar:
```bash
bun run dev
```

## Resumen

**Comando único para desarrollo:**
```bash
node start-dev.js
```

**Esto resuelve permanentemente:**
- ✅ Backend siempre disponible
- ✅ No más errores de conexión
- ✅ Auto-reload en cambios
- ✅ Experiencia de desarrollo fluida

---

**¿Por qué es superior?**

Este enfoque unificado elimina la necesidad de recordar iniciar el backend manualmente. El script gestiona ambos procesos, los monitorea, y los reinicia automáticamente cuando detecta cambios. Los logs coloreados facilitan el debugging, y la detención limpia con Ctrl+C asegura que no queden procesos huérfanos. Es una solución robusta, profesional y definitiva al problema de coordinación entre frontend y backend.
