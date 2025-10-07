# 🚀 Cómo Iniciar el Backend

## Problema Resuelto
El error `Unexpected typeof` ocurre cuando Bun intenta parsear archivos de React Native que no debería procesar.

## Solución Implementada

### 1. Instalar Dependencias Necesarias
```bash
bun install
```

Esto instalará:
- `@hono/node-server` - Servidor HTTP para Hono
- `tsx` - Ejecutor de TypeScript para Node.js

### 2. Iniciar el Backend

**Opción A: Usando npm script (Recomendado)**
```bash
bun run backend
```

**Opción B: Directamente con Node**
```bash
node start-backend-fixed.js
```

**Opción C: Modo desarrollo**
```bash
bun run backend:dev
```

### 3. Verificar que Funciona

El backend debería mostrar:
```
✅ Backend iniciado correctamente
📍 Servidor escuchando en: http://0.0.0.0:8082
📍 API disponible en: http://0.0.0.0:8082/api
📍 tRPC endpoint: http://0.0.0.0:8082/api/trpc
```

Puedes verificar con:
```bash
curl http://localhost:8082/api
```

Deberías ver: `{"status":"ok","message":"API is running"}`

## Arquitectura de la Solución

```
start-backend-fixed.js (Node.js)
    ↓
  tsx (TypeScript executor)
    ↓
backend/server.ts
    ↓
backend/hono.ts (Tu aplicación Hono)
```

## Variables de Entorno

El backend usa estas variables:
- `PORT` - Puerto del servidor (default: 8082)
- `HOST` - Host del servidor (default: 0.0.0.0)
- `NODE_ENV` - Entorno (development/production)

## Detener el Backend

Presiona `Ctrl+C` en la terminal donde está corriendo.

## Troubleshooting

### Error: Cannot find module 'tsx'
```bash
bun install tsx
```

### Error: Cannot find module '@hono/node-server'
```bash
bun install @hono/node-server
```

### Puerto 8082 ya en uso
```bash
# Cambiar el puerto
PORT=8083 bun run backend
```

### Ver logs detallados
```bash
DEBUG=* bun run backend:dev
```
