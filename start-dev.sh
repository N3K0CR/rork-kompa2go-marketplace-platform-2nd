#!/bin/bash

# Script para iniciar el entorno de desarrollo completo
# Frontend (Expo) + Backend (Hono/tRPC)

echo "🚀 Iniciando Kompa2Go Development Environment..."
echo ""
echo "📦 Backend: Hono/tRPC Server (con auto-reload)"
echo "📱 Frontend: Expo React Native App"
echo ""

# Ejecutar ambos procesos en paralelo con concurrently
bunx concurrently \
  --kill-others \
  --names "BACKEND,FRONTEND" \
  --prefix-colors "bgBlue.bold,bgMagenta.bold" \
  "nodemon --watch backend --ext ts,js,json --exec 'tsx backend/server.ts'" \
  "bunx rork start -p z5be445fq2fb0yuu32aht --tunnel"
