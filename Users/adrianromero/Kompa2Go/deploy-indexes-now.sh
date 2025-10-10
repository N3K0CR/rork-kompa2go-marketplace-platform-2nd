#!/bin/bash

echo "🔥 Desplegando índices de Firestore..."
echo ""

# Verificar Firebase CLI
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI no instalado"
    echo "Instala con: npm install -g firebase-tools"
    exit 1
fi

# Verificar autenticación
if ! firebase projects:list &> /dev/null; then
    echo "❌ No autenticado en Firebase"
    echo "Ejecuta: firebase login"
    exit 1
fi

echo "Proyecto actual:"
firebase use
echo ""

# Desplegar índices
echo "Desplegando índices..."
firebase deploy --only firestore:indexes

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Índices desplegados exitosamente"
    echo ""
    echo "⚠️  Los índices pueden tardar 2-3 minutos en activarse"
    echo "Verifica en: https://console.firebase.google.com/project/kompa2go/firestore/indexes"
else
    echo ""
    echo "❌ Error al desplegar índices"
    exit 1
fi
