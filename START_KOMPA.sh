#!/bin/bash

echo "🚀 Kompa2Go - Inicio Rápido"
echo "============================="
echo ""

# Matar procesos en puerto 8082
echo "🧹 Limpiando puerto 8082..."
lsof -ti:8082 | xargs kill -9 2>/dev/null || true
sleep 1

# Iniciar backend en background
echo "📦 Iniciando backend..."
bun run backend/server.ts > /tmp/kompa-backend.log 2>&1 &
BACKEND_PID=$!
echo "Backend PID: $BACKEND_PID"

# Esperar 5 segundos
echo "⏳ Esperando 5 segundos..."
sleep 5

# Verificar que el backend está corriendo
if ps -p $BACKEND_PID > /dev/null; then
   echo "✅ Backend corriendo"
   echo "📱 Backend: http://localhost:8082/api/"
   echo ""
   
   # Mostrar logs del backend
   echo "📋 Últimos logs del backend:"
   tail -20 /tmp/kompa-backend.log
   echo ""
   echo "============================="
   echo ""
   
   # Iniciar frontend
   echo "📱 Iniciando frontend..."
   echo ""
   bun x rork start -p z5be445fq2fb0yuu32aht --tunnel
else
   echo "❌ Backend no pudo iniciar. Ver logs:"
   cat /tmp/kompa-backend.log
   exit 1
fi
