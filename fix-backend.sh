#!/bin/bash

echo "🔧 Kompa2Go - Diagnóstico y Corrección"
echo "======================================"
echo ""

# 1. Limpiar puerto 8082
echo "1️⃣ Limpiando puerto 8082..."
pkill -f "node.*backend/server" 2>/dev/null
pkill -f "tsx.*backend/server" 2>/dev/null
sleep 2

# 2. Verificar variables de entorno
echo ""
echo "2️⃣ Verificando variables de entorno..."
if [ -f .env.local ]; then
    echo "   ✅ .env.local existe"
    if grep -q "EXPO_PUBLIC_RORK_API_BASE_URL" .env.local; then
        echo "   ✅ EXPO_PUBLIC_RORK_API_BASE_URL configurada"
    else
        echo "   ⚠️ Agregando EXPO_PUBLIC_RORK_API_BASE_URL"
        echo "EXPO_PUBLIC_RORK_API_BASE_URL=http://localhost:8082" >> .env.local
    fi
else
    echo "   ⚠️ Creando .env.local"
    echo "EXPO_PUBLIC_RORK_API_BASE_URL=http://localhost:8082" > .env.local
fi

# 3. Iniciar backend
echo ""
echo "3️⃣ Iniciando backend..."
node backend/server.ts > backend.log 2>&1 &
BACKEND_PID=$!
echo "   Backend PID: $BACKEND_PID"

# 4. Esperar que el backend responda
echo ""
echo "4️⃣ Esperando que el backend responda..."
MAX_WAIT=30
COUNTER=0

while [ $COUNTER -lt $MAX_WAIT ]; do
    if curl -s http://localhost:8082/api/ > /dev/null 2>&1; then
        echo "   ✅ Backend respondiendo en http://localhost:8082/api/"
        break
    fi
    echo -n "."
    sleep 1
    COUNTER=$((COUNTER + 1))
done

echo ""

if [ $COUNTER -eq $MAX_WAIT ]; then
    echo "   ❌ Backend no respondió después de $MAX_WAIT segundos"
    echo ""
    echo "📋 Últimas líneas del log:"
    tail -20 backend.log
    exit 1
fi

# 5. Probar endpoints
echo ""
echo "5️⃣ Probando endpoints..."

echo "   • GET /api/"
curl -s http://localhost:8082/api/ | head -c 200
echo ""

echo "   • GET /api/debug/env"
curl -s http://localhost:8082/api/debug/env | head -c 200
echo ""

echo ""
echo "======================================"
echo "✅ Backend funcionando correctamente"
echo "======================================"
echo ""
echo "Para iniciar el frontend:"
echo "  bun start"
