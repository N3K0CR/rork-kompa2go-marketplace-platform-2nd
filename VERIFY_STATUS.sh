#!/bin/bash

clear
echo "╔════════════════════════════════════════╗"
echo "║   🔍 VERIFICACIÓN DE ESTADO 🔍        ║"
echo "╚════════════════════════════════════════╝"
echo ""

# Verificar proceso
echo "1️⃣  PROCESO DEL BACKEND:"
if pgrep -f "rork start" > /dev/null; then
    PID=$(pgrep -f "rork start")
    echo "   ✅ Backend corriendo (PID: $PID)"
else
    echo "   ❌ Backend NO está corriendo"
    echo ""
    echo "   💡 Para iniciar: bash START_BACKEND_NOW.sh"
    exit 1
fi

echo ""
echo "2️⃣  ENDPOINTS:"

# API Principal
echo -n "   • Backend API: "
if curl -s --max-time 3 http://localhost:8082/api 2>/dev/null | grep -q "ok"; then
    echo "✅ VERDE"
else
    echo "❌ ROJO"
fi

# tRPC
echo -n "   • tRPC: "
if curl -s --max-time 3 http://localhost:8082/api/trpc > /dev/null 2>&1; then
    echo "✅ VERDE"
else
    echo "❌ ROJO"
fi

echo ""
echo "3️⃣  RESPUESTA DEL SERVIDOR:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
curl -s http://localhost:8082/api 2>/dev/null || echo "   ❌ Sin respuesta"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo ""
echo "4️⃣  ÚLTIMAS LÍNEAS DEL LOG:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ -f /tmp/kompa2go-backend.log ]; then
    tail -10 /tmp/kompa2go-backend.log
else
    echo "   ⚠️  No se encontró archivo de log"
fi
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo ""
echo "╔════════════════════════════════════════╗"
echo "║      ✅ VERIFICACIÓN COMPLETA ✅       ║"
echo "╚════════════════════════════════════════╝"
echo ""
