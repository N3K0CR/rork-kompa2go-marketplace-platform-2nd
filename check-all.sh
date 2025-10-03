#!/bin/bash

echo "🔍 VERIFICACIÓN COMPLETA DE KOMPA2GO"
echo "===================================="
echo ""

# Colores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Verificar archivos críticos
echo "📁 1. ARCHIVOS CRÍTICOS"
echo "----------------------"
critical_files=(
    "app/kommute-validation.tsx"
    "contexts/CommuteContext.tsx"
    "hooks/useCommute.ts"
    "backend/trpc/routes/commute/routes.ts"
    "lib/firebase.ts"
    "package.json"
    ".env.local"
)

all_files_ok=true
for file in "${critical_files[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✅${NC} $file"
    else
        echo -e "${RED}❌${NC} $file - NO ENCONTRADO"
        all_files_ok=false
    fi
done
echo ""

# 2. Verificar variables de entorno
echo "🔧 2. VARIABLES DE ENTORNO"
echo "-------------------------"
if [ -f ".env.local" ]; then
    echo -e "${GREEN}✅${NC} Archivo .env.local existe"
    
    if grep -q "EXPO_PUBLIC_RORK_API_BASE_URL" .env.local; then
        url=$(grep "EXPO_PUBLIC_RORK_API_BASE_URL" .env.local | cut -d '=' -f2)
        echo -e "${GREEN}✅${NC} EXPO_PUBLIC_RORK_API_BASE_URL configurada: $url"
    else
        echo -e "${YELLOW}⚠️${NC}  EXPO_PUBLIC_RORK_API_BASE_URL NO configurada"
        echo "   Esto es normal en desarrollo. El backend se configurará con 'bun start'"
    fi
    
    if grep -q "EXPO_PUBLIC_FIREBASE" .env.local; then
        echo -e "${GREEN}✅${NC} Variables de Firebase configuradas"
    else
        echo -e "${YELLOW}⚠️${NC}  Variables de Firebase no encontradas"
    fi
else
    echo -e "${RED}❌${NC} Archivo .env.local NO existe"
fi
echo ""

# 3. Verificar procesos corriendo
echo "🚀 3. PROCESOS ACTIVOS"
echo "---------------------"

# Verificar PM2
if command -v pm2 &> /dev/null; then
    echo -e "${GREEN}✅${NC} PM2 instalado"
    
    if pm2 list | grep -q "online"; then
        echo -e "${GREEN}✅${NC} Servicios PM2 corriendo:"
        pm2 list | grep -E "kompa2go|online" | head -5
    else
        echo -e "${YELLOW}⚠️${NC}  No hay servicios PM2 corriendo"
        echo "   Ejecuta: bash start-services.sh"
    fi
else
    echo -e "${YELLOW}⚠️${NC}  PM2 no instalado (opcional)"
fi
echo ""

# 4. Verificar puertos
echo "🌐 4. PUERTOS"
echo "------------"

check_port() {
    local port=$1
    local name=$2
    
    if lsof -i :$port &> /dev/null 2>&1; then
        pid=$(lsof -t -i:$port 2>/dev/null)
        echo -e "${GREEN}✅${NC} Puerto $port ($name) - ACTIVO (PID: $pid)"
        return 0
    else
        echo -e "${RED}❌${NC} Puerto $port ($name) - NO DISPONIBLE"
        return 1
    fi
}

frontend_running=false
backend_running=false

if check_port 8081 "Frontend/Expo"; then
    frontend_running=true
fi

if check_port 8082 "Backend"; then
    backend_running=true
fi

if check_port 3000 "Alternativo"; then
    echo -e "${YELLOW}⚠️${NC}  Puerto 3000 en uso (puede ser otro servicio)"
fi
echo ""

# 5. Verificar conectividad del backend
echo "🔌 5. CONECTIVIDAD BACKEND"
echo "-------------------------"

if [ "$backend_running" = true ]; then
    if curl -s http://localhost:8082/api > /dev/null 2>&1; then
        echo -e "${GREEN}✅${NC} Backend responde en http://localhost:8082/api"
        
        # Verificar tRPC
        if curl -s http://localhost:8082/api/trpc > /dev/null 2>&1; then
            echo -e "${GREEN}✅${NC} tRPC endpoint disponible"
        else
            echo -e "${YELLOW}⚠️${NC}  tRPC endpoint no responde"
        fi
    else
        echo -e "${RED}❌${NC} Backend no responde a peticiones"
    fi
else
    echo -e "${YELLOW}⚠️${NC}  Backend no está corriendo"
    echo "   Para iniciar: bash start-backend.sh"
fi
echo ""

# 6. Verificar dependencias
echo "📦 6. DEPENDENCIAS"
echo "-----------------"

if [ -f "package.json" ]; then
    echo -e "${GREEN}✅${NC} package.json existe"
    
    # Verificar node_modules
    if [ -d "node_modules" ]; then
        echo -e "${GREEN}✅${NC} node_modules instalado"
    else
        echo -e "${RED}❌${NC} node_modules NO encontrado"
        echo "   Ejecuta: bun install"
    fi
else
    echo -e "${RED}❌${NC} package.json NO encontrado"
fi
echo ""

# 7. Resumen y recomendaciones
echo "📋 7. RESUMEN Y ESTADO GENERAL"
echo "==============================="
echo ""

if [ "$frontend_running" = true ] && [ "$backend_running" = true ]; then
    echo -e "${GREEN}✅ SISTEMA COMPLETAMENTE OPERATIVO${NC}"
    echo ""
    echo "🎉 Todo está corriendo correctamente!"
    echo ""
    echo "🔗 URLs de acceso:"
    echo "   • Frontend: http://localhost:8081"
    echo "   • Validación: http://localhost:8081/kommute-validation"
    echo "   • Backend API: http://localhost:8082/api"
    echo "   • tRPC: http://localhost:8082/api/trpc"
    
elif [ "$frontend_running" = true ]; then
    echo -e "${YELLOW}⚠️  SISTEMA PARCIALMENTE OPERATIVO${NC}"
    echo ""
    echo "✅ Frontend corriendo"
    echo "❌ Backend NO corriendo"
    echo ""
    echo "💡 Para iniciar el backend:"
    echo "   bash start-backend.sh"
    
elif [ "$backend_running" = true ]; then
    echo -e "${YELLOW}⚠️  SISTEMA PARCIALMENTE OPERATIVO${NC}"
    echo ""
    echo "❌ Frontend NO corriendo"
    echo "✅ Backend corriendo"
    echo ""
    echo "💡 Para iniciar el frontend:"
    echo "   bun start"
    
else
    echo -e "${RED}❌ SISTEMA NO OPERATIVO${NC}"
    echo ""
    echo "❌ Frontend NO corriendo"
    echo "❌ Backend NO corriendo"
    echo ""
    echo "💡 Para iniciar todo:"
    echo "   bash start-services.sh"
    echo ""
    echo "💡 O iniciar manualmente:"
    echo "   1. Backend: bash start-backend.sh"
    echo "   2. Frontend: bun start"
fi

echo ""
echo "📚 Comandos útiles:"
echo "   • Ver este estado: bash check-all.sh"
echo "   • Iniciar servicios: bash start-services.sh"
echo "   • Ver logs: pm2 logs (si usas PM2)"
echo "   • Reiniciar: pm2 restart all (si usas PM2)"
echo "   • Detener: bash stop-services.sh"
echo ""

# 8. Verificar errores conocidos
echo "🔍 8. VERIFICACIÓN DE ERRORES CONOCIDOS"
echo "---------------------------------------"

# Verificar el error de network_retry
if [ -f "app/kommute-validation.tsx" ]; then
    if grep -q "test:network_test_network_retry" app/kommute-validation.tsx; then
        echo -e "${YELLOW}⚠️${NC}  Código de test encontrado en validación"
        echo "   Esto puede causar errores en la validación"
    else
        echo -e "${GREEN}✅${NC} No se encontraron tests problemáticos"
    fi
fi

echo ""
echo "✅ Verificación completa finalizada"
echo ""
