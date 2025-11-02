#!/bin/bash

echo "🧹 Iniciando limpieza agresiva de caché..."

# Limpiar caché de Expo
if [ -d ".expo" ]; then
  echo "🗑️  Eliminando .expo..."
  rm -rf .expo
  echo "✅ .expo eliminado"
else
  echo "ℹ️  .expo no existe"
fi

# Limpiar caché de node_modules
if [ -d "node_modules/.cache" ]; then
  echo "🗑️  Eliminando node_modules/.cache..."
  rm -rf node_modules/.cache
  echo "✅ node_modules/.cache eliminado"
else
  echo "ℹ️  node_modules/.cache no existe"
fi

# Limpiar caché general
if [ -d ".cache" ]; then
  echo "🗑️  Eliminando .cache..."
  rm -rf .cache
  echo "✅ .cache eliminado"
else
  echo "ℹ️  .cache no existe"
fi

# Limpiar caché de Bun
echo "🗑️  Limpiando caché de Bun..."
bun cache rm 2>/dev/null || echo "ℹ️  No se pudo limpiar caché de Bun (puede que no exista)"

echo ""
echo "✅ ¡Limpieza completa!"
echo ""
echo "🔄 Ahora debes reiniciar el servidor con: bun run dev"
