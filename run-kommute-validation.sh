#!/bin/bash

echo "🔍 Ejecutando Validación de Kommute..."
echo ""

# Verificar si PM2 está instalado
if ! command -v pm2 &> /dev/null; then
    echo "❌ PM2 no está instalado"
    echo "💡 Ejecuta primero: bash start-services.sh"
    exit 1
fi

# Verificar estado de servicios
echo "📊 Verificando servicios..."
pm2 status

echo ""
echo "🌐 URLs disponibles:"
echo "  - Frontend: http://localhost:8081"
echo "  - Backend API: http://localhost:8081/api"
echo ""

# Verificar que el backend esté respondiendo
echo "🔍 Verificando conectividad del backend..."
BACKEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8081/api 2>/dev/null)

if [ "$BACKEND_STATUS" = "200" ] || [ "$BACKEND_STATUS" = "404" ]; then
    echo "✅ Backend está respondiendo (HTTP $BACKEND_STATUS)"
else
    echo "⚠️  Backend no está respondiendo correctamente (HTTP $BACKEND_STATUS)"
    echo "💡 Intenta reiniciar los servicios: bash restart-services.sh"
fi

echo ""
echo "📱 Para ejecutar la validación de Kommute:"
echo ""
echo "1. Abre tu navegador en: http://localhost:8081"
echo "2. Navega a la ruta: /kommute-validation"
echo "   O directamente: http://localhost:8081/kommute-validation"
echo ""
echo "3. También puedes ejecutar el test completo en:"
echo "   http://localhost:8081/kommute-full-test"
echo ""
echo "🎯 Funcionalidades de validación:"
echo "  ✓ Validación del contexto base"
echo "  ✓ Verificación de feature flags"
echo "  ✓ Permisos de ubicación"
echo "  ✓ Modos de transporte"
echo "  ✓ Conexión con backend tRPC"
echo "  ✓ Sistema de recuperación de errores"
echo ""
echo "📝 Logs en tiempo real:"
echo "  pm2 logs kompa2go-frontend"
echo ""
