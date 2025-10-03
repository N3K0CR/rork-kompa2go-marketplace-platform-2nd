#!/bin/bash

echo "🚀 Iniciando Backend Kompa2Go"
echo "================================"
echo ""

# Matar cualquier proceso en el puerto 8082
pkill -f "rork start" 2>/dev/null
sleep 1

# Iniciar backend en background
cd /home/user/rork-app
nohup bunx rork start -p z5be445fq2fb0yuu32aht > /tmp/backend.log 2>&1 &
BACKEND_PID=$!

echo "✅ Backend iniciado (PID: $BACKEND_PID)"
echo "📝 Logs: /tmp/backend.log"
echo ""
echo "⏳ Esperando 8 segundos para que el servidor inicie..."

sleep 8

echo ""
echo "🔍 Verificando estado del backend..."
echo ""

# Verificar endpoint principal
if curl -s http://localhost:8082/api | grep -q "ok"; then
    echo "✅ Backend API: http://localhost:8082/api - VERDE ✓"
else
    echo "❌ Backend API: http://localhost:8082/api - ROJO ✗"
fi

# Verificar endpoint tRPC
if curl -s http://localhost:8082/api/trpc 2>&1 | grep -q "trpc"; then
    echo "✅ tRPC Endpoint: http://localhost:8082/api/trpc - VERDE ✓"
else
    echo "⚠️  tRPC Endpoint: http://localhost:8082/api/trpc - AMARILLO ⚠"
fi

echo ""
echo "================================"
echo "✅ Backend está corriendo"
echo ""
echo "📊 Para ver logs en tiempo real:"
echo "   tail -f /tmp/backend.log"
echo ""
echo "🛑 Para detener el backend:"
echo "   pkill -f 'rork start'"
echo ""
