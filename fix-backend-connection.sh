#!/bin/bash
set -e

echo "🔧 SOLUCIONANDO CONEXIÓN DEL BACKEND"
echo "====================================="
echo ""

# 1. Detener procesos anteriores
echo "1️⃣ Deteniendo procesos anteriores..."
pkill -9 -f "rork start" 2>/dev/null || true
sleep 2
echo "   ✅ Procesos detenidos"
echo ""

# 2. Verificar que el puerto 8082 esté libre
echo "2️⃣ Verificando puerto 8082..."
if lsof -i :8082 > /dev/null 2>&1; then
    echo "   ⚠️ Puerto 8082 en uso, liberando..."
    lsof -ti :8082 | xargs kill -9 2>/dev/null || true
    sleep 1
fi
echo "   ✅ Puerto 8082 libre"
echo ""

# 3. Iniciar backend
echo "3️⃣ Iniciando backend..."
cd "$(dirname "$0")"
bunx rork start -p z5be445fq2fb0yuu32aht > /tmp/kompa2go-backend.log 2>&1 &
BACKEND_PID=$!
echo "   ✅ Backend iniciado (PID: $BACKEND_PID)"
echo ""

# 4. Esperar y verificar
echo "4️⃣ Esperando 15 segundos para que el backend inicie..."
for i in {15..1}; do
    echo -ne "\r   ⏳ $i segundos restantes..."
    sleep 1
done
echo -e "\r   ✅ Tiempo de espera completado    "
echo ""

# 5. Verificar conexión
echo "5️⃣ Verificando conexión..."
MAX_RETRIES=5
RETRY=0
while [ $RETRY -lt $MAX_RETRIES ]; do
    if curl -s --max-time 2 http://localhost:8082/api > /dev/null 2>&1; then
        echo "   ✅ Backend respondiendo correctamente"
        echo ""
        echo "📊 Respuesta del servidor:"
        curl -s http://localhost:8082/api | head -5
        echo ""
        echo ""
        echo "✅ BACKEND FUNCIONANDO CORRECTAMENTE"
        echo "   URL: http://localhost:8082/api"
        echo "   Logs: tail -f /tmp/kompa2go-backend.log"
        exit 0
    fi
    RETRY=$((RETRY + 1))
    echo "   ⏳ Intento $RETRY/$MAX_RETRIES..."
    sleep 2
done

echo "   ❌ Backend no responde después de $MAX_RETRIES intentos"
echo ""
echo "📝 Mostrando últimas líneas del log:"
tail -20 /tmp/kompa2go-backend.log
echo ""
echo "❌ ERROR: No se pudo iniciar el backend correctamente"
exit 1
