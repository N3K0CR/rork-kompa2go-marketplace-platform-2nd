#!/bin/bash

echo "🛑 Deteniendo servicios de Kompa2Go..."

pm2 stop all

echo ""
echo "✅ Servicios detenidos"
echo ""
echo "📊 Estado actual:"
pm2 status

echo ""
echo "💡 Para eliminar completamente los servicios: pm2 delete all"
