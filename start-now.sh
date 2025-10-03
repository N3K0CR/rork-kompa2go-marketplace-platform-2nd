#!/bin/bash
cd /home/user/rork-app
echo "🚀 Iniciando Backend..."
bunx rork start -p z5be445fq2fb0yuu32aht > backend.log 2>&1 &
echo "✅ Backend iniciado con PID: $!"
echo "📝 Logs en: backend.log"
sleep 3
echo ""
echo "🔍 Verificando estado..."
curl -s http://localhost:8082/api || echo "⏳ Esperando..."
sleep 2
curl -s http://localhost:8082/api && echo "" && echo "✅ Backend en verde!"
