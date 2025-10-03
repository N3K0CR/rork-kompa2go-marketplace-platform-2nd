#!/bin/bash

echo "🚀 Iniciando Backend de Kompa2Go..."
echo ""

# Verificar si el puerto 8082 está en uso
if lsof -Pi :8082 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo "⚠️  Puerto 8082 ya está en uso. Deteniendo proceso..."
    kill -9 $(lsof -t -i:8082) 2>/dev/null || true
    sleep 2
fi

# Iniciar el backend en segundo plano
echo "📦 Iniciando servidor backend en puerto 8082..."
nohup bunx rork start -p z5be445fq2fb0yuu32aht > logs/backend.log 2>&1 &
BACKEND_PID=$!

echo "✅ Backend iniciado con PID: $BACKEND_PID"
echo ""

# Esperar a que el backend esté listo
echo "⏳ Esperando a que el backend esté listo..."
for i in {1..30}; do
    if curl -s http://localhost:8082/api > /dev/null 2>&1; then
        echo "✅ Backend está listo y respondiendo"
        echo ""
        echo "🌐 Backend API: http://localhost:8082/api"
        echo "🔌 tRPC Endpoint: http://localhost:8082/api/trpc"
        echo ""
        echo "📝 Ver logs: tail -f logs/backend.log"
        echo "🛑 Detener: kill $BACKEND_PID"
        echo ""
        exit 0
    fi
    sleep 1
done

echo "❌ El backend no respondió después de 30 segundos"
echo "📝 Revisa los logs: tail -f logs/backend.log"
exit 1
