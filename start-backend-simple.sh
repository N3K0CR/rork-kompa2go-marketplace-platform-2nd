#!/bin/bash

echo "🚀 Iniciando Backend de Kompa2Go..."
echo ""

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    echo "❌ Error: No se encuentra package.json"
    echo "   Asegúrate de estar en el directorio raíz del proyecto"
    exit 1
fi

echo "📦 Iniciando servidor backend..."
echo "   Puerto: 8082"
echo "   API: http://localhost:8082/api"
echo "   tRPC: http://localhost:8082/api/trpc"
echo ""

# Iniciar el backend
PORT=8082 bunx rork start -p z5be445fq2fb0yuu32aht

