#!/bin/bash

echo "🚀 INICIANDO SISTEMA KOMPA2GO"
echo "=============================="
echo ""

# Paso 1: Verificar estado actual
echo "📋 PASO 1: Verificando estado actual..."
echo ""
bash /home/user/rork-app/check-status-now.sh

echo ""
echo "=============================="
echo ""

# Paso 2: Iniciar backend
echo "📋 PASO 2: Iniciando backend..."
echo ""
bash /home/user/rork-app/init-backend-simple.sh

echo ""
echo "=============================="
echo ""

# Paso 3: Verificar estado final
echo "📋 PASO 3: Verificación final..."
echo ""
sleep 2
bash /home/user/rork-app/check-status-now.sh

echo ""
echo "=============================="
echo "✅ PROCESO COMPLETADO"
echo "=============================="
