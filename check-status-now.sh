#!/bin/bash

echo "🔍 Verificando Estado del Sistema Kompa2Go"
echo "=========================================="
echo ""

# Verificar si el backend está corriendo
if pgrep -f "rork start" > /dev/null; then
    PID=$(pgrep -f "rork start")
    echo "✅ Backend está corriendo (PID: $PID)"
else
    echo "❌ Backend NO está corriendo"
fi

echo ""
echo "🌐 Verificando endpoints..."
echo ""

# Verificar API principal
echo -n "Backend API (http://localhost:8082/api): "
if curl -s --max-time 3 http://localhost:8082/api > /dev/null 2>&1; then
    RESPONSE=$(curl -s http://localhost:8082/api)
    if echo "$RESPONSE" | grep -q "ok"; then
        echo "✅ VERDE - Respondiendo correctamente"
    else
        echo "⚠️  AMARILLO - Responde pero sin 'ok'"
    fi
else
    echo "❌ ROJO - No responde"
fi

# Verificar tRPC
echo -n "tRPC Endpoint (http://localhost:8082/api/trpc): "
if curl -s --max-time 3 http://localhost:8082/api/trpc > /dev/null 2>&1; then
    echo "✅ VERDE - Respondiendo"
else
    echo "❌ ROJO - No responde"
fi

echo ""
echo "=========================================="
