#!/bin/bash

echo "🔍 Verificación Rápida de Kommute"
echo "=================================="
echo ""

# Verificar servicios
if command -v pm2 &> /dev/null; then
    echo "📊 Estado de Servicios:"
    pm2 list | grep -E "kompa2go|online|stopped" || echo "  No hay servicios PM2 corriendo"
    echo ""
fi

# Verificar puertos
echo "🌐 Puertos en Uso:"
if lsof -i :8081 &> /dev/null; then
    echo "  ✅ Puerto 8081 (Frontend) - ACTIVO"
else
    echo "  ❌ Puerto 8081 (Frontend) - NO DISPONIBLE"
fi

if lsof -i :3000 &> /dev/null; then
    echo "  ✅ Puerto 3000 (Backend) - ACTIVO"
else
    echo "  ⚠️  Puerto 3000 (Backend) - NO DISPONIBLE"
fi
echo ""

# Verificar archivos críticos
echo "📁 Archivos Críticos:"
files=(
    "app/kommute-validation.tsx"
    "contexts/CommuteContext.tsx"
    "hooks/useCommute.ts"
    "backend/trpc/routes/commute/routes.ts"
)

for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo "  ✅ $file"
    else
        echo "  ❌ $file - NO ENCONTRADO"
    fi
done
echo ""

# URLs de acceso
echo "🔗 URLs de Acceso:"
echo "  Frontend: http://localhost:8081"
echo "  Validación: http://localhost:8081/kommute-validation"
echo "  Backend API: http://localhost:8081/api"
echo ""

# Comandos útiles
echo "💡 Comandos Útiles:"
echo "  Iniciar servicios: bash start-services.sh"
echo "  Ver logs: pm2 logs"
echo "  Reiniciar: pm2 restart all"
echo "  Detener: bash stop-services.sh"
echo ""

# Estado general
echo "📋 Estado General:"
if command -v pm2 &> /dev/null && pm2 list | grep -q "online"; then
    echo "  ✅ Kommute está corriendo"
    echo "  👉 Abre http://localhost:8081/kommute-validation para validar"
else
    echo "  ⚠️  Kommute no está corriendo"
    echo "  👉 Ejecuta: bash start-services.sh"
fi
