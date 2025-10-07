#!/bin/bash

echo "🔍 Diagnóstico del Backend - Kompa2Go"
echo "======================================"
echo ""

# Verificar si el puerto 8082 está en uso
echo "1️⃣ Verificando puerto 8082..."
if lsof -Pi :8082 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo "✅ Puerto 8082 está en uso"
    echo "   Proceso:"
    lsof -Pi :8082 -sTCP:LISTEN
else
    echo "❌ Puerto 8082 NO está en uso"
    echo "   El backend NO está corriendo"
fi

echo ""

# Verificar si el puerto 8081 está en uso (frontend)
echo "2️⃣ Verificando puerto 8081 (frontend)..."
if lsof -Pi :8081 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo "✅ Puerto 8081 está en uso (frontend corriendo)"
else
    echo "⚠️  Puerto 8081 NO está en uso (frontend no está corriendo)"
fi

echo ""

# Verificar variables de entorno
echo "3️⃣ Verificando configuración..."
if [ -f ".env.local" ]; then
    echo "✅ Archivo .env.local existe"
    echo "   EXPO_PUBLIC_RORK_API_BASE_URL=$(grep EXPO_PUBLIC_RORK_API_BASE_URL .env.local | cut -d '=' -f2)"
else
    echo "❌ Archivo .env.local NO existe"
fi

echo ""

# Verificar procesos de Node/Bun
echo "4️⃣ Verificando procesos activos..."
if pgrep -f "rork" > /dev/null; then
    echo "✅ Procesos Rork encontrados:"
    ps aux | grep -i rork | grep -v grep
else
    echo "⚠️  No se encontraron procesos Rork"
fi

echo ""
echo "======================================"
echo "📋 RESUMEN:"
echo ""

# Determinar el problema
BACKEND_RUNNING=$(lsof -Pi :8082 -sTCP:LISTEN -t 2>/dev/null)
FRONTEND_RUNNING=$(lsof -Pi :8081 -sTCP:LISTEN -t 2>/dev/null)

if [ -z "$BACKEND_RUNNING" ]; then
    echo "❌ PROBLEMA: El backend NO está corriendo en el puerto 8082"
    echo ""
    echo "💡 SOLUCIÓN:"
    echo "   Ejecuta: ./fix-backend-connection.sh"
    echo "   O manualmente: bunx rork start -p z5be445fq2fb0yuu32aht --api --tunnel"
else
    echo "✅ El backend está corriendo correctamente"
    echo ""
    echo "🔍 Si aún ves el error 502, verifica:"
    echo "   1. Que el tunnel esté activo"
    echo "   2. Que no haya errores en los logs del backend"
    echo "   3. Reinicia el backend con: ./fix-backend-connection.sh"
fi

echo ""
