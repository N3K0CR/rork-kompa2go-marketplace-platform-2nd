#!/bin/bash

echo "🚀 Iniciando servicios de Kompa2Go..."
echo ""

# Crear directorio de logs si no existe
mkdir -p logs

# Verificar si PM2 está instalado
if ! command -v pm2 &> /dev/null; then
    echo "📦 PM2 no está instalado. Instalando globalmente..."
    bun add -g pm2
    if [ $? -ne 0 ]; then
        echo "❌ Error al instalar PM2"
        exit 1
    fi
    echo "✅ PM2 instalado correctamente"
fi

# Detener servicios existentes si los hay
echo "🧹 Limpiando servicios anteriores..."
pm2 delete all 2>/dev/null || true

# Esperar un momento para asegurar que los puertos se liberen
sleep 2

# Iniciar servicios con PM2
echo ""
echo "📦 Iniciando Frontend y Backend con PM2..."
pm2 start ecosystem.config.js

# Verificar que los servicios iniciaron correctamente
sleep 3

echo ""
echo "✅ Servicios iniciados"
echo ""
echo "📊 Estado de los servicios:"
pm2 status

echo ""
echo "🌐 URLs del sistema:"
echo "  - Frontend: http://localhost:8081"
echo "  - Backend API: http://localhost:8082"
echo "  - tRPC: http://localhost:8082/api/trpc"
echo ""
echo "📝 Comandos útiles:"
echo "  - Ver logs en tiempo real: pm2 logs"
echo "  - Ver estado: pm2 status"
echo "  - Reiniciar servicios: pm2 restart all"
echo "  - Detener servicios: pm2 stop all"
echo "  - Eliminar servicios: pm2 delete all"
echo "  - Monitor en tiempo real: pm2 monit"
echo ""
echo "💡 Los servicios seguirán corriendo incluso si cierras esta terminal"
echo ""
echo "🔍 Para verificar que todo funciona correctamente:"
echo "  curl http://localhost:8082/api"
echo ""
