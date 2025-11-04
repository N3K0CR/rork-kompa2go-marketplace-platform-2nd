#!/bin/bash

echo "🚀 Kompa2Go - Inicio Rápido"
echo "============================"
echo ""

# Limpiar procesos previos
echo "🧹 Limpiando procesos anteriores..."
pkill -f "node.*8082" 2>/dev/null
pkill -f "backend/server" 2>/dev/null
sleep 2

# Iniciar backend
echo "🔧 Iniciando backend..."
cd /home/user/rork-app
bun backend/server.ts > backend.log 2>&1 &
BACKEND_PID=$!

echo "   Backend PID: $BACKEND_PID"
echo "   Esperando 3 segundos..."
sleep 3

# Verificar backend
if curl -s http://localhost:8082/api/ > /dev/null 2>&1; then
    echo "   ✅ Backend OK"
else
    echo "   ❌ Backend falló. Log:"
    tail -10 backend.log
    exit 1
fi

echo ""
echo "✅ Todo listo"
echo ""
echo "Para iniciar el frontend ejecuta:"
echo "  bun start"
echo ""
echo "URLs importantes:"
echo "  Backend: http://localhost:8082/api/"
echo "  tRPC: http://localhost:8082/api/trpc"
