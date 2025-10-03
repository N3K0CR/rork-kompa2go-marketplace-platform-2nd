#!/bin/bash

echo "🚀 Iniciando Backend de Kompa2Go con PM2..."
echo ""

# Crear directorio de logs si no existe
mkdir -p logs

# Verificar si PM2 está instalado
if ! command -v pm2 &> /dev/null; then
    echo "📦 PM2 no está instalado. Instalando..."
    bun add -g pm2
    if [ $? -ne 0 ]; then
        echo "❌ Error al instalar PM2"
        exit 1
    fi
    echo "✅ PM2 instalado"
fi

# Detener backend anterior si existe
echo "🧹 Deteniendo backend anterior..."
pm2 delete kompa2go-backend 2>/dev/null || true

# Esperar a que se libere el puerto
sleep 2

# Iniciar solo el backend
echo ""
echo "📦 Iniciando Backend..."
pm2 start bunx --name kompa2go-backend -- rork start -p z5be445fq2fb0yuu32aht

# Esperar a que inicie
sleep 3

echo ""
echo "✅ Backend iniciado"
echo ""
echo "📊 Estado:"
pm2 status

echo ""
echo "🌐 Backend API: http://localhost:8081/api"
echo "🌐 tRPC: http://localhost:8081/api/trpc"
echo ""
echo "📝 Comandos útiles:"
echo "  - Ver logs: pm2 logs kompa2go-backend"
echo "  - Reiniciar: pm2 restart kompa2go-backend"
echo "  - Detener: pm2 stop kompa2go-backend"
echo "  - Eliminar: pm2 delete kompa2go-backend"
echo ""
echo "🔍 Verificar que funciona:"
echo "  curl http://localhost:8081/api"
echo ""
