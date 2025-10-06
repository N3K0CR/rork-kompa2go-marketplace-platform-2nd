#!/bin/bash

# ================================================
# 🚀 SCRIPT DE DESPLIEGUE RÁPIDO - KOMMUTE
# ================================================
# Este script despliega las reglas de Firestore
# y configura el primer usuario administrador
# ================================================

set -e

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

clear

echo -e "${BLUE}"
echo "================================================"
echo "🚀 DESPLIEGUE RÁPIDO DE CORRECCIONES CRÍTICAS"
echo "================================================"
echo -e "${NC}"
echo ""
echo "Este script va a:"
echo "  1. Desplegar las reglas de Firestore corregidas"
echo "  2. Configurar el primer usuario administrador"
echo ""
echo -e "${YELLOW}⚠️  Asegúrate de tener:${NC}"
echo "  - Firebase CLI instalado (firebase-tools)"
echo "  - Sesión iniciada en Firebase (firebase login)"
echo "  - Proyecto correcto seleccionado"
echo ""
read -p "¿Continuar? (s/n): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Ss]$ ]]; then
    echo "Operación cancelada"
    exit 0
fi

echo ""
echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}PASO 1: Verificando requisitos${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""

# Verificar Firebase CLI
if ! command -v firebase &> /dev/null; then
    echo -e "${RED}❌ Firebase CLI no está instalado${NC}"
    echo ""
    echo "Instalar con:"
    echo "  npm install -g firebase-tools"
    echo ""
    exit 1
fi
echo -e "${GREEN}✅ Firebase CLI encontrado${NC}"

# Verificar autenticación
if ! firebase projects:list &> /dev/null; then
    echo -e "${RED}❌ No estás autenticado en Firebase${NC}"
    echo ""
    echo "Ejecuta primero:"
    echo "  firebase login"
    echo ""
    exit 1
fi
echo -e "${GREEN}✅ Autenticado en Firebase${NC}"

# Mostrar proyecto
echo ""
echo "Proyecto actual:"
firebase use
echo ""

# Verificar Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js no está instalado${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Node.js encontrado${NC}"

echo ""
echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}PASO 2: Desplegando reglas de Firestore${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""

if firebase deploy --only firestore:rules; then
    echo ""
    echo -e "${GREEN}✅ Reglas desplegadas exitosamente${NC}"
else
    echo ""
    echo -e "${RED}❌ Error al desplegar reglas${NC}"
    echo ""
    echo "Verifica el error arriba y vuelve a intentar"
    exit 1
fi

echo ""
echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}PASO 3: Configurando usuario administrador${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""

# Verificar si firebase-admin está instalado
if ! node -e "require('firebase-admin')" 2>/dev/null; then
    echo -e "${YELLOW}⚠️  firebase-admin no está instalado${NC}"
    echo "Instalando..."
    npm install firebase-admin
    echo ""
fi

echo "Ahora vamos a configurar el primer usuario administrador"
echo ""
echo -e "${YELLOW}⚠️  Necesitarás:${NC}"
echo "  - El UID de Firebase Auth del usuario"
echo "  - El email del usuario"
echo ""
echo "Puedes encontrar el UID en:"
echo "  Firebase Console → Authentication → Users"
echo ""
read -p "¿Continuar con la configuración del admin? (s/n): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Ss]$ ]]; then
    node setup-admin-user.js
else
    echo ""
    echo -e "${YELLOW}⚠️  Configuración de admin omitida${NC}"
    echo ""
    echo "Puedes configurarlo más tarde ejecutando:"
    echo "  node setup-admin-user.js"
    echo ""
    echo "O manualmente en Firebase Console:"
    echo "  1. Ir a Firestore Database"
    echo "  2. Crear colección: admin_users"
    echo "  3. Crear documento con ID = {UID del usuario}"
    echo "  4. Agregar campos:"
    echo "     - email: 'admin@kompa2go.com'"
    echo "     - role: 'admin'"
    echo "     - permissions: ['manage_kommuters', 'manage_payments', 'view_alerts']"
    echo "     - createdAt: {timestamp actual}"
    echo "     - active: true"
    echo ""
fi

echo ""
echo -e "${GREEN}================================================${NC}"
echo -e "${GREEN}🎉 DESPLIEGUE COMPLETADO${NC}"
echo -e "${GREEN}================================================${NC}"
echo ""
echo "Cambios aplicados:"
echo "  ✅ Reglas de Firestore desplegadas"
echo "  ✅ Sistema de administradores implementado"
echo "  ✅ Permisos corregidos para todas las colecciones"
echo ""
echo "Nuevas funcionalidades:"
echo "  ✅ Panel de Kommuter con gestión de conductores"
echo "  ✅ Aprobaciones pendientes de kommuters"
echo "  ✅ Sistema de alertas con seguimiento en tiempo real"
echo "  ✅ Recargas de billetera Kommute con aprobación"
echo "  ✅ Ver todas las transacciones del sistema"
echo ""
echo -e "${YELLOW}⚠️  IMPORTANTE:${NC}"
echo "  1. Cierra sesión en la app"
echo "  2. Inicia sesión con el usuario administrador"
echo "  3. Verifica que todo funciona correctamente"
echo ""
echo "Si encuentras errores de permisos:"
echo "  - Verifica que el usuario está en la colección admin_users"
echo "  - Verifica que el UID coincide con Firebase Auth"
echo "  - Cierra sesión y vuelve a iniciar sesión"
echo ""
echo "Documentación:"
echo "  - RESUMEN_CORRECCIONES_CRITICAS.md"
echo "  - FIRESTORE_RULES_CRITICAL_FIXES.md"
echo "  - DESPLEGAR_REGLAS_AHORA.md"
echo ""
echo -e "${GREEN}¡Listo para usar!${NC}"
echo ""
