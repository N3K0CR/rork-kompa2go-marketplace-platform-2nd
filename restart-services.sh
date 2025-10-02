#!/bin/bash

echo "🔄 Reiniciando servicios de Kompa2Go..."
echo ""

if ! command -v pm2 &> /dev/null; then
    echo "❌ PM2 no está instalado"
    echo "💡 Ejecuta: bash start-services.sh primero"
    exit 1
fi

pm2 restart all

echo ""
echo "✅ Servicios reiniciados"
echo ""
echo "📊 Estado actual:"
pm2 status

echo ""
echo "💡 Para ver logs en tiempo real: pm2 logs"
