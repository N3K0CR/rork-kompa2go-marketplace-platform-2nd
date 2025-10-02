#!/bin/bash

echo "🔍 Verificando estado de servicios Kompa2Go..."
echo ""

if ! command -v pm2 &> /dev/null; then
    echo "❌ PM2 no está instalado"
    echo "💡 Ejecuta: bash start-services.sh (instalará PM2 automáticamente)"
    exit 1
fi

echo "✅ PM2 está instalado"
echo ""

pm2 status

echo ""
echo "📊 Información detallada:"
echo ""

pm2 describe kompa2go-frontend 2>/dev/null
pm2 describe kompa2go-backend 2>/dev/null

echo ""
echo "🌐 URLs:"
echo "  Frontend: http://localhost:8081"
echo "  Backend: http://localhost:8081/api"
echo ""
echo "📝 Comandos útiles:"
echo "  - Ver logs: pm2 logs"
echo "  - Reiniciar: pm2 restart all"
echo "  - Monitor: pm2 monit"
