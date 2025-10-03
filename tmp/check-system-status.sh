#!/bin/bash

echo "==================================="
echo "VERIFICACIÓN DEL SISTEMA KOMPA2GO"
echo "==================================="
echo ""

# Verificar si el backend está corriendo
echo "1. Verificando Backend..."
if curl -s http://localhost:3000/api/health > /dev/null 2>&1; then
    echo "✅ Backend está corriendo"
else
    echo "❌ Backend NO está corriendo"
fi
echo ""

# Verificar si Expo está corriendo
echo "2. Verificando Expo..."
if lsof -i :8081 > /dev/null 2>&1; then
    echo "✅ Expo está corriendo"
else
    echo "❌ Expo NO está corriendo"
fi
echo ""

# Verificar procesos PM2
echo "3. Verificando PM2..."
if command -v pm2 &> /dev/null; then
    pm2 list
else
    echo "⚠️  PM2 no está instalado"
fi
echo ""

echo "==================================="
echo "FIN DE VERIFICACIÓN"
echo "==================================="
