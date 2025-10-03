#!/bin/bash
cd /home/user/rork-app
pkill -9 -f "rork start" 2>/dev/null
sleep 2
echo "🚀 Iniciando backend..."
bunx rork start -p z5be445fq2fb0yuu32aht > /tmp/backend.log 2>&1 &
echo "⏳ Esperando 10 segundos..."
sleep 10
echo "🔍 Verificando..."
curl -s http://localhost:8082/api
echo ""
echo "✅ Listo! Backend en http://localhost:8082/api"
