#!/bin/bash

echo "🚀 Iniciando Kompa2Go - Modo Simple"
echo "===================================="
echo ""

# Cargar variables de entorno
if [ -f .env.local ]; then
    export $(cat .env.local | grep -v '^#' | xargs)
    echo "✅ Variables de entorno cargadas"
else
    echo "⚠️  Archivo .env.local no encontrado"
fi

# Función para limpiar procesos al salir
cleanup() {
    echo ""
    echo "🛑 Deteniendo servicios..."
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null
    fi
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null
    fi
    echo "👋 Adiós!"
    exit 0
}

trap cleanup SIGINT SIGTERM

# Iniciar backend
echo "🔧 Iniciando backend..."
PORT=8082 HOST=0.0.0.0 NODE_ENV=development bun run backend/server.ts &
BACKEND_PID=$!
echo "   Backend PID: $BACKEND_PID"

# Esperar un momento
sleep 3

# Iniciar frontend
echo "🎨 Iniciando frontend..."
bun x rork start -p z5be445fq2fb0yuu32aht --tunnel &
FRONTEND_PID=$!
echo "   Frontend PID: $FRONTEND_PID"

echo ""
echo "===================================="
echo "✅ Servicios iniciados"
echo "===================================="
echo "📱 Backend:  http://localhost:8082/api/"
echo "📱 tRPC:     http://localhost:8082/api/trpc"
echo "📱 Frontend: Expo Developer Tools abrirá automáticamente"
echo ""
echo "💡 Presiona Ctrl+C para detener todo"
echo ""

# Mantener el script corriendo
wait
