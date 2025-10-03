#!/bin/bash

echo "🚀 Iniciando Backend de Kompa2Go..."
echo ""

# Verificar si el puerto 8082 está en uso
if lsof -Pi :8082 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo "⚠️  Puerto 8082 ya está en uso. Deteniendo proceso anterior..."
    kill -9 $(lsof -t -i:8082) 2>/dev/null
    sleep 2
fi

# Iniciar el backend
echo "🔄 Iniciando servidor backend en puerto 8082..."
cd /home/user/rork-app

# Ejecutar el comando de inicio del backend
bunx rork start -p z5be445fq2fb0yuu32aht &

BACKEND_PID=$!
echo "✅ Backend iniciado con PID: $BACKEND_PID"
echo ""

# Esperar a que el servidor esté listo
echo "⏳ Esperando a que el servidor esté listo..."
sleep 5

# Verificar que el servidor está corriendo
if curl -s http://localhost:8082/api > /dev/null 2>&1; then
    echo "✅ Backend está corriendo correctamente"
    echo "🌐 Backend API: http://localhost:8082/api"
    echo "🌐 tRPC: http://localhost:8082/api/trpc"
    echo ""
    echo "📊 Estado del servidor:"
    curl -s http://localhost:8082/api | jq '.' 2>/dev/null || curl -s http://localhost:8082/api
else
    echo "❌ Error: El backend no responde en http://localhost:8082/api"
    exit 1
fi

echo ""
echo "✅ Backend iniciado exitosamente"
echo "📝 Para detener el backend, ejecuta: kill $BACKEND_PID"
echo "📝 O usa: pkill -f 'rork start'"
