#!/bin/bash

echo "🔍 Iniciando validación de Kommute..."
echo "📱 La aplicación seguirá funcionando durante la validación"
echo ""

# Verificar que los servicios estén corriendo
echo "1️⃣ Verificando servicios..."
if pm2 list | grep -q "online"; then
    echo "✅ Servicios PM2 activos"
else
    echo "⚠️  Servicios PM2 no detectados"
fi

echo ""
echo "2️⃣ Ejecutando validación de Kommute..."
echo "   (Esto puede tomar unos segundos)"
echo ""

# Ejecutar la validación en segundo plano y capturar el resultado
npx expo start --web &
EXPO_PID=$!

# Esperar un momento para que Expo inicie
sleep 3

# Verificar que Expo esté corriendo
if ps -p $EXPO_PID > /dev/null; then
    echo "✅ Expo está corriendo (PID: $EXPO_PID)"
    echo ""
    echo "📊 Puedes acceder a la validación en:"
    echo "   http://localhost:8081/kommute-validation"
    echo ""
    echo "💡 Para detener la validación: kill $EXPO_PID"
else
    echo "❌ Error al iniciar Expo"
fi

echo ""
echo "✅ Validación iniciada. La app sigue disponible."
