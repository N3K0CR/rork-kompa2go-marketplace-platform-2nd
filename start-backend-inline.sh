#!/bin/bash

clear
echo "╔════════════════════════════════════════╗"
echo "║   🚀 INICIANDO BACKEND KOMPA2GO 🚀    ║"
echo "╚════════════════════════════════════════╝"
echo ""

cd /home/user/rork-app

# Limpiar procesos
echo "🧹 Limpiando procesos anteriores..."
pkill -9 -f "rork start" 2>/dev/null || true
sleep 2

# Iniciar backend
echo "🚀 Iniciando backend..."
bunx rork start -p z5be445fq2fb0yuu32aht > /tmp/backend.log 2>&1 &
echo "✅ Backend iniciado (PID: $!)"
echo ""

# Esperar
echo "⏳ Esperando 10 segundos..."
sleep 10

# Verificar
echo ""
echo "🔍 Verificando endpoints..."
echo ""

curl -s http://localhost:8082/api && echo "" && echo "✅ Backend en VERDE!" || echo "❌ Backend en ROJO"

echo ""
echo "✅ Proceso completado"
