#!/bin/bash
set -e

clear
echo "╔════════════════════════════════════════╗"
echo "║   🚀 KOMPA2GO BACKEND STARTER 🚀      ║"
echo "╚════════════════════════════════════════╝"
echo ""

# Función para verificar endpoint
check_endpoint() {
    local url=$1
    local name=$2
    echo -n "Verificando $name... "
    if curl -s --max-time 2 "$url" > /dev/null 2>&1; then
        echo "✅ VERDE"
        return 0
    else
        echo "❌ ROJO"
        return 1
    fi
}

# 1. Limpiar procesos anteriores
echo "🧹 Limpiando procesos anteriores..."
pkill -9 -f "rork start" 2>/dev/null || true
pkill -9 -f "node.*8082" 2>/dev/null || true
sleep 2
echo "✅ Limpieza completada"
echo ""

# 2. Iniciar backend
echo "🚀 Iniciando backend en puerto 8082..."
cd /home/user/rork-app
bunx rork start -p z5be445fq2fb0yuu32aht > /tmp/kompa2go-backend.log 2>&1 &
BACKEND_PID=$!
echo "✅ Backend iniciado con PID: $BACKEND_PID"
echo "📝 Logs: /tmp/kompa2go-backend.log"
echo ""

# 3. Esperar inicio
echo "⏳ Esperando 10 segundos para que el servidor inicie..."
for i in {10..1}; do
    echo -ne "\r   Tiempo restante: $i segundos... "
    sleep 1
done
echo -e "\r   ✅ Tiempo de espera completado          "
echo ""

# 4. Verificar endpoints
echo "🔍 VERIFICANDO ENDPOINTS:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
check_endpoint "http://localhost:8082/api" "Backend API"
check_endpoint "http://localhost:8082/api/trpc" "tRPC Endpoint"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 5. Mostrar respuesta del servidor
echo "📊 RESPUESTA DEL SERVIDOR:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
curl -s http://localhost:8082/api 2>/dev/null | head -5 || echo "No se pudo obtener respuesta"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 6. Resumen final
echo "╔════════════════════════════════════════╗"
echo "║         ✅ BACKEND INICIADO ✅         ║"
echo "╚════════════════════════════════════════╝"
echo ""
echo "🌐 URLs disponibles:"
echo "   • API: http://localhost:8082/api"
echo "   • tRPC: http://localhost:8082/api/trpc"
echo ""
echo "📝 Comandos útiles:"
echo "   • Ver logs: tail -f /tmp/kompa2go-backend.log"
echo "   • Detener: pkill -f 'rork start'"
echo "   • PID: $BACKEND_PID"
echo ""
echo "✅ El backend debería estar en VERDE ahora"
echo ""
