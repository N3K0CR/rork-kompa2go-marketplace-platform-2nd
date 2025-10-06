#!/bin/bash

echo "================================================"
echo "🔥 DESPLIEGUE DE FIRESTORE RULES - KOMMUTE"
echo "================================================"
echo ""

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Verificar que Firebase CLI está instalado
if ! command -v firebase &> /dev/null; then
    echo -e "${RED}❌ Firebase CLI no está instalado${NC}"
    echo ""
    echo "Instalar con:"
    echo "  npm install -g firebase-tools"
    echo ""
    exit 1
fi

echo -e "${GREEN}✅ Firebase CLI encontrado${NC}"
echo ""

# Verificar que estamos logueados
echo "Verificando autenticación de Firebase..."
if ! firebase projects:list &> /dev/null; then
    echo -e "${RED}❌ No estás autenticado en Firebase${NC}"
    echo ""
    echo "Ejecuta primero:"
    echo "  firebase login"
    echo ""
    exit 1
fi

echo -e "${GREEN}✅ Autenticado en Firebase${NC}"
echo ""

# Mostrar proyecto actual
echo "Proyecto actual:"
firebase use
echo ""

# Confirmar despliegue
echo -e "${YELLOW}⚠️  IMPORTANTE:${NC}"
echo "  - Esto desplegará las nuevas reglas de seguridad"
echo "  - Las reglas anteriores serán reemplazadas"
echo "  - Los cambios son inmediatos"
echo ""
read -p "¿Continuar con el despliegue? (s/n): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Ss]$ ]]; then
    echo "Despliegue cancelado"
    exit 0
fi

echo ""
echo "Desplegando reglas de Firestore..."
echo ""

# Desplegar reglas
if firebase deploy --only firestore:rules; then
    echo ""
    echo -e "${GREEN}================================================${NC}"
    echo -e "${GREEN}✅ REGLAS DESPLEGADAS EXITOSAMENTE${NC}"
    echo -e "${GREEN}================================================${NC}"
    echo ""
    echo "Cambios aplicados:"
    echo "  ✅ Permisos de administrador agregados"
    echo "  ✅ Permisos de kommuter_applications corregidos"
    echo "  ✅ Permisos de alert_tracking corregidos"
    echo "  ✅ Colección alert_location_tracking agregada"
    echo "  ✅ Permisos de billetera Kommute actualizados"
    echo ""
    echo -e "${YELLOW}⚠️  SIGUIENTE PASO CRÍTICO:${NC}"
    echo "  Debes crear al menos un usuario administrador"
    echo ""
    echo "  En Firebase Console:"
    echo "  1. Ir a Firestore Database"
    echo "  2. Crear colección: admin_users"
    echo "  3. Crear documento con ID = {userId del admin}"
    echo "  4. Agregar campos:"
    echo "     - email: 'admin@kompa2go.com'"
    echo "     - role: 'admin'"
    echo "     - permissions: ['manage_kommuters', 'manage_payments', 'view_alerts']"
    echo "     - createdAt: {timestamp actual}"
    echo ""
    echo "  O ejecutar este código en Firebase Console:"
    echo ""
    echo "  const db = firebase.firestore();"
    echo "  await db.collection('admin_users').doc('TU_USER_ID').set({"
    echo "    email: 'admin@kompa2go.com',"
    echo "    role: 'admin',"
    echo "    permissions: ['manage_kommuters', 'manage_payments', 'view_alerts'],"
    echo "    createdAt: firebase.firestore.FieldValue.serverTimestamp()"
    echo "  });"
    echo ""
else
    echo ""
    echo -e "${RED}================================================${NC}"
    echo -e "${RED}❌ ERROR AL DESPLEGAR REGLAS${NC}"
    echo -e "${RED}================================================${NC}"
    echo ""
    echo "Posibles causas:"
    echo "  - No tienes permisos en el proyecto"
    echo "  - El proyecto no está seleccionado correctamente"
    echo "  - Hay un error de sintaxis en las reglas"
    echo ""
    echo "Verifica el error arriba y vuelve a intentar"
    echo ""
    exit 1
fi

echo "================================================"
echo "🎉 PROCESO COMPLETADO"
echo "================================================"
