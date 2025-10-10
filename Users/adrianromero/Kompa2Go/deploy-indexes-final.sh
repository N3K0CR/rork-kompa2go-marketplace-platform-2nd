#!/bin/bash

echo "=========================================="
echo "DESPLEGANDO ÍNDICES DE FIRESTORE"
echo "=========================================="
echo ""

cd /Users/adrianromero/Kompa2Go

echo "📋 Verificando archivo de índices..."
if [ ! -f "firestore.indexes.json" ]; then
    echo "❌ Error: No se encuentra firestore.indexes.json"
    exit 1
fi

echo "✅ Archivo de índices encontrado"
echo ""

echo "🚀 Desplegando índices a Firebase..."
echo ""

npx firebase deploy --only firestore:indexes --project kompa2go

if [ $? -eq 0 ]; then
    echo ""
    echo "=========================================="
    echo "✅ ÍNDICES DESPLEGADOS EXITOSAMENTE"
    echo "=========================================="
    echo ""
    echo "Los índices pueden tardar unos minutos en estar completamente activos."
    echo "Puedes verificar el estado en:"
    echo "https://console.firebase.google.com/project/kompa2go/firestore/indexes"
    echo ""
else
    echo ""
    echo "=========================================="
    echo "❌ ERROR AL DESPLEGAR ÍNDICES"
    echo "=========================================="
    echo ""
    echo "Si el comando firebase no está disponible, instálalo con:"
    echo "npm install -g firebase-tools"
    echo ""
    echo "Luego inicia sesión con:"
    echo "firebase login"
    echo ""
    exit 1
fi
