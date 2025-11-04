# 🚀 Inicio Automático de Kompa2Go

## Solución Definitiva

He creado un script único que inicia **automáticamente** tanto el backend como el frontend, y maneja todos los errores.

## Cómo Iniciar Todo

### Opción 1: Script Automático (RECOMENDADO)
```bash
node start.js
```

Esto:
- ✅ Libera el puerto 8082 automáticamente
- ✅ Inicia el backend con reinicio automático en caso de error
- ✅ Espera 2 segundos y luego inicia el frontend
- ✅ Muestra logs con colores para backend y frontend
- ✅ Detiene todo con Ctrl+C

### Opción 2: Usando bun run (también funciona)
```bash
bun run start
```

### Opción 3: Manual (si necesitas ejecutar solo uno)
**Solo Backend:**
```bash
node start-backend-now.js
```

**Solo Frontend:**
```bash
bun x rork start -p z5be445fq2fb0yuu32aht --tunnel
```

## ¿Qué hace el nuevo script?

1. **Auto-recuperación**: Si el backend crashea, se reinicia automáticamente después de 3 segundos
2. **Gestión de puertos**: Libera automáticamente el puerto 8082 si está ocupado
3. **Variables de entorno**: Carga automáticamente `.env.local`
4. **Logs organizados**: Backend en cyan, frontend en magenta, sistema en amarillo
5. **Cierre limpio**: Ctrl+C detiene todo correctamente

## Ventajas

- ✅ **UN SOLO COMANDO** para iniciar todo
- ✅ **NO MÁS** inicios manuales del backend
- ✅ **REINICIO AUTOMÁTICO** si algo falla
- ✅ **FÁCIL DE USAR**: solo `node start.js`

## Troubleshooting

Si algo no funciona:

1. Verifica que `.env.local` exista con las variables necesarias:
   ```
   EXPO_PUBLIC_BACKEND_URL=http://localhost:8082
   EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=tu_api_key
   ```

2. Asegúrate de tener las dependencias instaladas:
   ```bash
   bun install
   ```

3. Si el puerto 8082 sigue ocupado:
   ```bash
   lsof -ti:8082 | xargs kill -9
   ```

## Scripts Actualizados en package.json

Ahora puedes usar:
- `bun run start` o `node start.js` - Inicia todo automáticamente
- `bun run dev` - Alias de start
- `bun run frontend` - Solo frontend
- `bun run backend` - Solo backend

¡Disfruta de un inicio automático sin complicaciones! 🎉
