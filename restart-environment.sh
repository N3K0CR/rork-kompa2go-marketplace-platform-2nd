#!/bin/bash

echo "🚀 Reiniciando Kompa2Go Environment..."
echo ""

# Paso 1: Limpieza agresiva de caché
echo "🧹 Paso 1/2: Limpiando cachés..."

rm -rf .expo 2>/dev/null && echo "✅ .expo eliminado" || echo "ℹ️  .expo no existe"
rm -rf node_modules/.cache 2>/dev/null && echo "✅ node_modules/.cache eliminado" || echo "ℹ️  node_modules/.cache no existe"
rm -rf .cache 2>/dev/null && echo "✅ .cache eliminado" || echo "ℹ️  .cache no existe"
bun cache rm 2>/dev/null && echo "✅ Caché de Bun limpiado" || echo "ℹ️  No se pudo limpiar caché de Bun"

echo ""
echo "✅ Cachés eliminados"
echo ""

# Paso 2: Iniciar servicios con nodemon + expo en paralelo
echo "🚀 Paso 2/2: Iniciando Backend + Frontend..."
echo ""
echo "📦 Backend: Hono/tRPC Server (con auto-reload)"
echo "📱 Frontend: Expo React Native App"
echo ""

# Ejecutar start-dev.js que maneja ambos procesos
node start-dev.js
