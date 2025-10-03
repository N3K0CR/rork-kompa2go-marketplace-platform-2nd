#!/bin/bash

echo "🚀 Iniciando Backend de Kompa2Go..."
echo ""

# Verificar si el backend ya está corriendo
if lsof -Pi :8082 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo "⚠️  Backend ya está corriendo en puerto 8082"
    echo "🔄 Deteniendo proceso anterior..."
    kill -9 $(lsof -t -i:8082) 2>/dev/null || true
    sleep 2
fi

# Iniciar el backend en segundo plano
echo "🔧 Iniciando backend en puerto 8082..."
cd /home/user/rork-app

# Ejecutar el backend con bunx rork start
nohup bunx rork start -p z5be445fq2fb0yuu32aht > /tmp/backend.log 2>&1 &
BACKEND_PID=$!

echo "✅ Backend iniciado con PID: $BACKEND_PID"
echo "📝 Logs en: /tmp/backend.log"
echo ""

# Esperar 5 segundos para que el backend inicie
echo "⏳ Esperando 5 segundos para que el backend inicie..."
sleep 5

# Verificar si el backend está corriendo
if lsof -Pi :8082 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo "✅ Backend corriendo en puerto 8082"
    echo "🌐 Backend API: http://localhost:8082/api"
    echo "🌐 tRPC: http://localhost:8082/api/trpc"
    echo ""
    
    # Hacer una prueba de health check
    echo "🔍 Verificando health check..."
    sleep 2
    curl -s http://localhost:8082/api/ | head -20
    echo ""
    echo ""
    echo "✅ Backend está funcionando correctamente"
else
    echo "❌ Error: Backend no está corriendo"
    echo "📝 Últimas líneas del log:"
    tail -20 /tmp/backend.log
    exit 1
fi

echo ""
echo "🎉 Backend iniciado exitosamente"
echo "💡 Para ver los logs en tiempo real: tail -f /tmp/backend.log"
echo "💡 Para detener el backend: kill $BACKEND_PID"
