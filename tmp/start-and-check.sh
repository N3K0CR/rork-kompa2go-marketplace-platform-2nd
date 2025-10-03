#!/bin/bash

echo "🚀 Iniciando Backend de Kompa2Go..."
echo ""

# Navegar al directorio del proyecto
cd ~/Desktop/Kompa2Go || cd ~/Kompa2Go || {
    echo "❌ No se pudo encontrar el directorio del proyecto"
    exit 1
}

echo "📁 Directorio actual: $(pwd)"
echo ""

# Verificar si el backend ya está corriendo
if lsof -i :3000 > /dev/null 2>&1; then
    echo "⚠️  El puerto 3000 ya está en uso"
    echo "Deteniendo proceso anterior..."
    lsof -ti :3000 | xargs kill -9 2>/dev/null
    sleep 2
fi

# Iniciar el backend en segundo plano
echo "🔧 Iniciando servidor backend..."
bun run backend &
BACKEND_PID=$!

echo "⏳ Esperando a que el backend inicie..."
sleep 5

# Verificar si el backend está corriendo
if curl -s http://localhost:3000/api/health > /dev/null 2>&1; then
    echo "✅ Backend iniciado correctamente en http://localhost:3000"
    echo "📝 PID del proceso: $BACKEND_PID"
else
    echo "❌ El backend no respondió correctamente"
    echo "Verificando logs..."
fi

echo ""
echo "==================================="
echo "Para detener el backend, ejecuta:"
echo "kill $BACKEND_PID"
echo "==================================="
