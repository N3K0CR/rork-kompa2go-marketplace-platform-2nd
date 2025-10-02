#!/bin/bash

echo "🚀 Iniciando servicios de Kompa2Go..."

mkdir -p logs

if ! command -v pm2 &> /dev/null; then
    echo "❌ PM2 no está instalado. Instalando..."
    bun add -g pm2
fi

pm2 delete all 2>/dev/null || true

echo "📦 Iniciando Frontend y Backend con PM2..."
pm2 start ecosystem.config.js

echo ""
echo "✅ Servicios iniciados correctamente"
echo ""
echo "📊 Estado de los servicios:"
pm2 status

echo ""
echo "📝 Comandos útiles:"
echo "  - Ver logs en tiempo real: pm2 logs"
echo "  - Ver estado: pm2 status"
echo "  - Reiniciar servicios: pm2 restart all"
echo "  - Detener servicios: pm2 stop all"
echo "  - Eliminar servicios: pm2 delete all"
echo "  - Monitor en tiempo real: pm2 monit"
echo ""
echo "🌐 Frontend: http://localhost:8081"
echo "🔧 Backend: http://localhost:8081/api"
echo ""
echo "💡 Los servicios seguirán corriendo incluso si cierras esta terminal"
