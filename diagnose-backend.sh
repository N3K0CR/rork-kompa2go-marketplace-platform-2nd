#!/bin/bash

echo "🔍 DIAGNÓSTICO DEL BACKEND KOMPA2GO"
echo "===================================="
echo ""

# 1. Verificar si el backend está corriendo
echo "1️⃣ Verificando procesos del backend..."
if pgrep -f "rork start" > /dev/null; then
    echo "   ✅ Proceso 'rork start' encontrado"
    pgrep -af "rork start"
else
    echo "   ❌ Proceso 'rork start' NO encontrado"
fi
echo ""

# 2. Verificar puertos
echo "2️⃣ Verificando puertos..."
if command -v lsof &> /dev/null; then
    echo "   Puerto 8081 (Frontend):"
    lsof -i :8081 || echo "   ❌ Puerto 8081 no está en uso"
    echo ""
    echo "   Puerto 8082 (Backend):"
    lsof -i :8082 || echo "   ❌ Puerto 8082 no está en uso"
elif command -v netstat &> /dev/null; then
    netstat -tuln | grep -E "8081|8082"
else
    echo "   ⚠️ No se puede verificar puertos (lsof/netstat no disponible)"
fi
echo ""

# 3. Verificar variables de entorno
echo "3️⃣ Verificando variables de entorno..."
if [ -f .env.local ]; then
    echo "   ✅ Archivo .env.local encontrado"
    echo "   EXPO_PUBLIC_RORK_API_BASE_URL=$(grep EXPO_PUBLIC_RORK_API_BASE_URL .env.local | cut -d'=' -f2)"
else
    echo "   ❌ Archivo .env.local NO encontrado"
fi
echo ""

# 4. Intentar conectar al backend
echo "4️⃣ Intentando conectar al backend..."
if curl -s --max-time 3 http://localhost:8082/api > /dev/null 2>&1; then
    echo "   ✅ Backend responde en http://localhost:8082/api"
    echo "   Respuesta:"
    curl -s http://localhost:8082/api | head -3
else
    echo "   ❌ Backend NO responde en http://localhost:8082/api"
fi
echo ""

# 5. Verificar logs
echo "5️⃣ Verificando logs..."
if [ -f /tmp/kompa2go-backend.log ]; then
    echo "   ✅ Log encontrado: /tmp/kompa2go-backend.log"
    echo "   Últimas 10 líneas:"
    tail -10 /tmp/kompa2go-backend.log
else
    echo "   ❌ Log NO encontrado en /tmp/kompa2go-backend.log"
fi
echo ""

# 6. Recomendaciones
echo "📋 RECOMENDACIONES:"
echo "==================="
if ! pgrep -f "rork start" > /dev/null; then
    echo "❌ El backend NO está corriendo"
    echo "   Ejecuta: ./START_BACKEND_NOW.sh"
    echo ""
fi

echo "✅ Para iniciar el backend: ./START_BACKEND_NOW.sh"
echo "✅ Para ver logs en tiempo real: tail -f /tmp/kompa2go-backend.log"
echo "✅ Para detener el backend: pkill -f 'rork start'"
echo ""
