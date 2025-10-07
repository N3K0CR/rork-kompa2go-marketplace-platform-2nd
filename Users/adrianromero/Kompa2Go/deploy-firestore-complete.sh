#!/bin/bash

echo "🔥 Desplegando reglas e índices de Firestore..."
echo ""

# Verificar que Firebase CLI esté instalado
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI no está instalado"
    echo "Instálalo con: npm install -g firebase-tools"
    exit 1
fi

# Verificar que el usuario esté autenticado
echo "📋 Verificando autenticación..."
firebase projects:list &> /dev/null
if [ $? -ne 0 ]; then
    echo "❌ No estás autenticado en Firebase"
    echo "Ejecuta: firebase login"
    exit 1
fi

echo "✅ Autenticación verificada"
echo ""

# Desplegar reglas de Firestore
echo "📤 Desplegando reglas de Firestore..."
firebase deploy --only firestore:rules

if [ $? -eq 0 ]; then
    echo "✅ Reglas desplegadas exitosamente"
else
    echo "❌ Error al desplegar reglas"
    exit 1
fi

echo ""

# Desplegar índices de Firestore
echo "📤 Desplegando índices de Firestore..."
firebase deploy --only firestore:indexes

if [ $? -eq 0 ]; then
    echo "✅ Índices desplegados exitosamente"
else
    echo "❌ Error al desplegar índices"
    exit 1
fi

echo ""
echo "🎉 ¡Despliegue completado!"
echo ""
echo "Los índices pueden tardar unos minutos en construirse."
echo "Puedes verificar el progreso en:"
echo "https://console.firebase.google.com/project/kompa2go/firestore/indexes"
