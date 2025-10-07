#!/bin/bash

echo "🔧 Solucionando conexión del Backend - Kompa2Go"
echo "================================================"
echo ""

# Paso 1: Detener procesos existentes en puerto 8082
echo "1️⃣ Deteniendo procesos en puerto 8082..."
BACKEND_PID=$(lsof -ti:8082)
if [ ! -z "$BACKEND_PID" ]; then
    echo "   Matando proceso $BACKEND_PID..."
    kill -9 $BACKEND_PID 2>/dev/null
    sleep 2
    echo "✅ Proceso detenido"
else
    echo "   No hay procesos en puerto 8082"
fi

echo ""

# Paso 2: Verificar que el puerto esté libre
echo "2️⃣ Verificando que el puerto 8082 esté libre..."
if lsof -Pi :8082 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo "❌ El puerto 8082 aún está en uso. Intenta manualmente:"
    echo "   lsof -ti:8082 | xargs kill -9"
    exit 1
else
    echo "✅ Puerto 8082 está libre"
fi

echo ""

# Paso 3: Iniciar el backend
echo "3️⃣ Iniciando el backend en puerto 8082..."
echo "   Comando: bunx rork start -p z5be445fq2fb0yuu32aht --api --tunnel"
echo ""
echo "⚠️  IMPORTANTE: Este proceso debe quedar corriendo en esta terminal"
echo "   Para detenerlo, presiona Ctrl+C"
echo ""
echo "🚀 Iniciando en 3 segundos..."
sleep 3

# Iniciar el backend
bunx rork start -p z5be445fq2fb0yuu32aht --api --tunnel
