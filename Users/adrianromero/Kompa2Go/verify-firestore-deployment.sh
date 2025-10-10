#!/bin/bash

echo "================================================"
echo "🔍 VERIFICACIÓN DE DESPLIEGUE DE FIRESTORE"
echo "================================================"
echo ""

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Contador de verificaciones
CHECKS_PASSED=0
CHECKS_FAILED=0

# Función para verificar
check() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ $1${NC}"
        ((CHECKS_PASSED++))
    else
        echo -e "${RED}❌ $1${NC}"
        ((CHECKS_FAILED++))
    fi
}

# 1. Verificar Firebase CLI
echo "1️⃣ Verificando Firebase CLI..."
if command -v firebase &> /dev/null; then
    FIREBASE_VERSION=$(firebase --version)
    echo -e "${GREEN}✅ Firebase CLI instalado: $FIREBASE_VERSION${NC}"
    ((CHECKS_PASSED++))
else
    echo -e "${RED}❌ Firebase CLI no instalado${NC}"
    echo "   Instalar con: npm install -g firebase-tools"
    ((CHECKS_FAILED++))
fi
echo ""

# 2. Verificar autenticación
echo "2️⃣ Verificando autenticación..."
if firebase projects:list &> /dev/null; then
    echo -e "${GREEN}✅ Autenticado en Firebase${NC}"
    ((CHECKS_PASSED++))
else
    echo -e "${RED}❌ No autenticado${NC}"
    echo "   Ejecutar: firebase login"
    ((CHECKS_FAILED++))
fi
echo ""

# 3. Verificar proyecto actual
echo "3️⃣ Verificando proyecto actual..."
CURRENT_PROJECT=$(firebase use 2>&1)
if [[ $CURRENT_PROJECT == *"kompa2go"* ]]; then
    echo -e "${GREEN}✅ Proyecto correcto: kompa2go${NC}"
    ((CHECKS_PASSED++))
else
    echo -e "${YELLOW}⚠️  Proyecto actual: $CURRENT_PROJECT${NC}"
    echo "   Cambiar con: firebase use kompa2go"
    ((CHECKS_FAILED++))
fi
echo ""

# 4. Verificar archivos locales
echo "4️⃣ Verificando archivos locales..."

if [ -f "firestore.rules" ]; then
    RULES_SIZE=$(wc -l < firestore.rules)
    echo -e "${GREEN}✅ firestore.rules existe ($RULES_SIZE líneas)${NC}"
    ((CHECKS_PASSED++))
else
    echo -e "${RED}❌ firestore.rules no encontrado${NC}"
    ((CHECKS_FAILED++))
fi

if [ -f "firestore.indexes.json" ]; then
    echo -e "${GREEN}✅ firestore.indexes.json existe${NC}"
    ((CHECKS_PASSED++))
else
    echo -e "${RED}❌ firestore.indexes.json no encontrado${NC}"
    ((CHECKS_FAILED++))
fi

if [ -f "firebase.json" ]; then
    echo -e "${GREEN}✅ firebase.json existe${NC}"
    ((CHECKS_PASSED++))
else
    echo -e "${RED}❌ firebase.json no encontrado${NC}"
    ((CHECKS_FAILED++))
fi
echo ""

# 5. Verificar sintaxis de reglas
echo "5️⃣ Verificando sintaxis de reglas..."
if grep -q "rules_version = '2'" firestore.rules; then
    echo -e "${GREEN}✅ Versión de reglas correcta${NC}"
    ((CHECKS_PASSED++))
else
    echo -e "${RED}❌ Versión de reglas incorrecta${NC}"
    ((CHECKS_FAILED++))
fi
echo ""

# 6. Verificar colecciones críticas en reglas
echo "6️⃣ Verificando colecciones críticas..."
CRITICAL_COLLECTIONS=(
    "provider_services"
    "service_modification_requests"
    "kommuters"
    "trips"
    "trip_locations"
    "kommuter_status"
    "chats"
    "ratings"
    "service_requests"
)

for collection in "${CRITICAL_COLLECTIONS[@]}"; do
    if grep -q "match /$collection/" firestore.rules; then
        echo -e "${GREEN}✅ Colección $collection definida${NC}"
        ((CHECKS_PASSED++))
    else
        echo -e "${RED}❌ Colección $collection NO definida${NC}"
        ((CHECKS_FAILED++))
    fi
done
echo ""

# 7. Mostrar resumen
echo "================================================"
echo "📊 RESUMEN DE VERIFICACIÓN"
echo "================================================"
echo -e "${GREEN}✅ Verificaciones exitosas: $CHECKS_PASSED${NC}"
echo -e "${RED}❌ Verificaciones fallidas: $CHECKS_FAILED${NC}"
echo ""

if [ $CHECKS_FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 TODO ESTÁ LISTO PARA DESPLEGAR${NC}"
    echo ""
    echo "Ejecuta ahora:"
    echo -e "${BLUE}  bash deploy-firestore-rules-now.sh${NC}"
    echo ""
else
    echo -e "${YELLOW}⚠️  HAY PROBLEMAS QUE RESOLVER${NC}"
    echo ""
    echo "Revisa los errores arriba y corrígelos antes de desplegar"
    echo ""
fi

echo "================================================"
echo ""

# 8. Preguntar si desea ver las reglas actuales en Firebase
read -p "¿Deseas intentar ver las reglas actuales en Firebase? (s/n): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Ss]$ ]]; then
    echo ""
    echo "Obteniendo reglas actuales de Firebase..."
    echo ""
    
    # Intentar obtener las reglas actuales
    firebase firestore:rules get 2>&1 | head -20
    
    echo ""
    echo "Nota: Si ves las reglas arriba, significa que Firebase está configurado correctamente"
    echo ""
fi

echo "================================================"
echo "🔍 VERIFICACIÓN COMPLETADA"
echo "================================================"
