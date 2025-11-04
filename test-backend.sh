#!/bin/bash

echo "🔍 Diagnóstico del Backend Kompa2Go"
echo "===================================="
echo ""

echo "1️⃣ Verificando si el puerto 8082 está en uso:"
if command -v lsof &> /dev/null; then
    lsof -i:8082 || echo "   ❌ Puerto 8082 no está en uso"
elif command -v netstat &> /dev/null; then
    netstat -tuln | grep 8082 || echo "   ❌ Puerto 8082 no está en uso"
else
    echo "   ⚠️ lsof y netstat no disponibles, no se puede verificar"
fi

echo ""
echo "2️⃣ Verificando health check del backend:"
echo "   Endpoint: http://localhost:8082/api/"

response=$(curl -s -w "\n%{http_code}" http://localhost:8082/api/ 2>&1)
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | head -n-1)

if [ "$http_code" = "200" ]; then
    echo "   ✅ Backend respondiendo correctamente"
    echo "   📦 Respuesta: $body"
else
    echo "   ❌ Backend no responde correctamente"
    echo "   📦 HTTP Code: $http_code"
    echo "   📦 Respuesta: $body"
fi

echo ""
echo "3️⃣ Verificando endpoint de debug:"
response2=$(curl -s http://localhost:8082/api/debug/env 2>&1)
if [ $? -eq 0 ]; then
    echo "   ✅ Debug endpoint accesible"
    echo "   📦 $response2"
else
    echo "   ❌ Debug endpoint no accesible"
fi

echo ""
echo "4️⃣ Verificando tRPC endpoint:"
response3=$(curl -s http://localhost:8082/api/trpc 2>&1)
if [ $? -eq 0 ]; then
    echo "   ✅ tRPC endpoint accesible"
    echo "   📦 Respuesta: $response3"
else
    echo "   ❌ tRPC endpoint no accesible"
    echo "   📦 Error: $response3"
fi

echo ""
echo "===================================="
echo "Diagnóstico completado"
