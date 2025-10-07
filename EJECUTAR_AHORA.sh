#!/bin/bash

echo "🚀 Iniciando Backend de Kompa2Go"
echo "=================================="
echo ""

# Verificar que Node.js está instalado
if ! command -v node &> /dev/null; then
    echo "❌ Node.js no está instalado"
    exit 1
fi

echo "✅ Node.js encontrado: $(node --version)"
echo ""

# Verificar que las dependencias están instaladas
if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependencias..."
    bun install
    echo ""
fi

# Iniciar el backend
echo "🔥 Iniciando servidor backend..."
echo ""
node start-backend-fixed.js
