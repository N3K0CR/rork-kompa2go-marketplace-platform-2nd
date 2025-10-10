#!/bin/bash

echo "================================================"
echo "🔥 DESPLIEGUE COMPLETO DE FIRESTORE - KOMMUTE"
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
echo "  - Esto desplegará las reglas de seguridad Y los índices"
echo "  - Las reglas e índices anteriores serán reemplazados"
echo "  - Los cambios son inmediatos"
echo ""
read -p "¿Continuar con el despliegue? (s/n): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Ss]$ ]]; then
    echo "Despliegue cancelado"
    exit 0
fi

echo ""
echo "================================================"
echo "📋 PASO 1: Desplegando reglas de Firestore..."
echo "================================================"
echo ""

# Desplegar reglas
if firebase deploy --only firestore:rules; then
    echo ""
    echo -e "${GREEN}✅ Reglas desplegadas exitosamente${NC}"
    echo ""
else
    echo ""
    echo -e "${RED}❌ Error al desplegar reglas${NC}"
    echo ""
    exit 1
fi

echo ""
echo "================================================"
echo "📊 PASO 2: Desplegando índices de Firestore..."
echo "================================================"
echo ""

# Desplegar índices
if firebase deploy --only firestore:indexes; then
    echo ""
    echo -e "${GREEN}✅ Índices desplegados exitosamente${NC}"
    echo ""
else
    echo ""
    echo -e "${RED}❌ Error al desplegar índices${NC}"
    echo ""
    exit 1
fi

echo ""
echo -e "${GREEN}================================================${NC}"
echo -e "${GREEN}✅ DESPLIEGUE COMPLETO EXITOSO${NC}"
echo -e "${GREEN}================================================${NC}"
echo ""
echo "Cambios aplicados:"
echo "  ✅ Reglas de seguridad actualizadas"
echo "  ✅ Índices compuestos creados:"
echo "     - kommuters (status + createdAt)"
echo "     - kommute_wallet_recharges (userId + createdAt)"
echo "     - kommute_wallet_recharges (status + createdAt)"
echo "     - kommute_wallet_transactions (userId + createdAt)"
echo "     - kommute_payment_distributions (kommuterId + createdAt)"
echo "     - kommuter_applications (status + createdAt)"
echo "     - alert_tracking (userId + createdAt)"
echo "     - alert_tracking (status + createdAt)"
echo "     - system_transactions (type + createdAt)"
echo "     - trip_locations (kommuterId + status)"
echo "     - kommuter_status (status + metadata.acceptingTrips)"
echo "     - service_requests (providerId + createdAt)"
echo "     - service_requests (status + createdAt)"
echo "     - price_modification_requests (providerId + createdAt)"
echo "     - chats (status + updatedAt)"
echo "     - messages (chatId + createdAt)"
echo "     - messages (chatId + senderId + read)"
echo "     - ratings (toUserId + status + createdAt)"
echo "     - ratings (fromUserId + status + createdAt)"
echo "     - ratingPrompts (userId + status + createdAt)"
echo "     - helpArticles (status + language + views)"
echo "     - supportTickets (userId + createdAt)"
echo "     - faqs (status + language + order)"
echo "     - emergencyAlerts (userId + status + createdAt)"
echo "     - emergencyContacts (userId + priority)"
echo ""
echo -e "${YELLOW}⚠️  NOTA:${NC}"
echo "  Los índices pueden tardar unos minutos en estar completamente activos"
echo "  Puedes verificar el estado en Firebase Console:"
echo "  https://console.firebase.google.com/project/kompa2go/firestore/indexes"
echo ""
echo "================================================"
echo "🎉 PROCESO COMPLETADO"
echo "================================================"
