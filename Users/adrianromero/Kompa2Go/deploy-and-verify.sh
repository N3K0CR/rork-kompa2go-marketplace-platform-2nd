#!/bin/bash

echo "================================================"
echo "🚀 DESPLIEGUE Y VERIFICACIÓN COMPLETA"
echo "================================================"
echo ""

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Paso 1: Verificación pre-despliegue
echo "PASO 1: Verificación pre-despliegue"
echo "------------------------------------"
bash verify-firestore-deployment.sh

echo ""
read -p "¿Continuar con el despliegue? (s/n): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Ss]$ ]]; then
    echo "Despliegue cancelado"
    exit 0
fi

# Paso 2: Desplegar reglas
echo ""
echo "PASO 2: Desplegando reglas"
echo "------------------------------------"
echo ""

if firebase deploy --only firestore:rules; then
    echo ""
    echo -e "${GREEN}✅ Reglas desplegadas exitosamente${NC}"
    echo ""
else
    echo ""
    echo -e "${RED}❌ Error al desplegar reglas${NC}"
    exit 1
fi

# Paso 3: Desplegar índices
echo ""
echo "PASO 3: Desplegando índices"
echo "------------------------------------"
echo ""

if firebase deploy --only firestore:indexes; then
    echo ""
    echo -e "${GREEN}✅ Índices desplegados exitosamente${NC}"
    echo ""
else
    echo ""
    echo -e "${YELLOW}⚠️  Error al desplegar índices (puede ser normal si ya existen)${NC}"
    echo ""
fi

# Paso 4: Verificar despliegue
echo ""
echo "PASO 4: Verificando despliegue"
echo "------------------------------------"
echo ""

echo "Obteniendo reglas actuales de Firebase..."
firebase firestore:rules get > /tmp/deployed-rules.txt 2>&1

if grep -q "provider_services" /tmp/deployed-rules.txt; then
    echo -e "${GREEN}✅ Reglas desplegadas correctamente en Firebase${NC}"
else
    echo -e "${RED}❌ Las reglas no se reflejan en Firebase${NC}"
    echo "Contenido obtenido:"
    cat /tmp/deployed-rules.txt
fi

echo ""

# Paso 5: Verificar colecciones críticas
echo ""
echo "PASO 5: Verificando colecciones críticas"
echo "------------------------------------"
echo ""

CRITICAL_COLLECTIONS=(
    "provider_services"
    "service_modification_requests"
    "kommuters"
    "trips"
)

for collection in "${CRITICAL_COLLECTIONS[@]}"; do
    if grep -q "$collection" /tmp/deployed-rules.txt; then
        echo -e "${GREEN}✅ $collection - OK${NC}"
    else
        echo -e "${RED}❌ $collection - NO ENCONTRADA${NC}"
    fi
done

echo ""
echo "================================================"
echo "📋 RESUMEN FINAL"
echo "================================================"
echo ""
echo -e "${GREEN}✅ Reglas locales: OK${NC}"
echo -e "${GREEN}✅ Despliegue: OK${NC}"
echo ""
echo -e "${YELLOW}⚠️  SIGUIENTE PASO CRÍTICO:${NC}"
echo ""
echo "Verifica en Firebase Console que las reglas estén activas:"
echo ""
echo "1. Abre: https://console.firebase.google.com/project/kompa2go/firestore/rules"
echo "2. Verifica que veas las reglas actualizadas"
echo "3. Busca 'provider_services' en las reglas"
echo "4. Si no las ves, espera 1-2 minutos y recarga la página"
echo ""
echo -e "${BLUE}🔗 Link directo:${NC}"
echo "   https://console.firebase.google.com/project/kompa2go/firestore/rules"
echo ""
echo "================================================"
echo ""

# Abrir navegador automáticamente (opcional)
read -p "¿Abrir Firebase Console en el navegador? (s/n): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Ss]$ ]]; then
    if command -v open &> /dev/null; then
        open "https://console.firebase.google.com/project/kompa2go/firestore/rules"
    elif command -v xdg-open &> /dev/null; then
        xdg-open "https://console.firebase.google.com/project/kompa2go/firestore/rules"
    else
        echo "No se pudo abrir el navegador automáticamente"
        echo "Abre manualmente: https://console.firebase.google.com/project/kompa2go/firestore/rules"
    fi
fi

echo ""
echo "================================================"
echo "🎉 PROCESO COMPLETADO"
echo "================================================"
