#!/bin/bash

echo "🔍 Verificando estado del Backend..."
echo ""

# Verificar si el puerto 8082 está en uso
if lsof -Pi :8082 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    PID=$(lsof -t -i:8082)
    echo "✅ Backend está corriendo (PID: $PID)"
    echo ""
    
    # Verificar que responde
    if curl -s http://localhost:8082/api > /dev/null 2>&1; then
        echo "✅ Backend responde correctamente"
        echo ""
        
        # Mostrar respuesta del health check
        echo "📊 Health Check:"
        curl -s http://localhost:8082/api | jq . 2>/dev/null || curl -s http://localhost:8082/api
        echo ""
        
        # Verificar tRPC
        echo ""
        echo "🔌 Verificando tRPC..."
        if curl -s http://localhost:8082/api/trpc > /dev/null 2>&1; then
            echo "✅ tRPC endpoint está disponible"
        else
            echo "⚠️  tRPC endpoint no responde"
        fi
    else
        echo "❌ Backend no responde a las peticiones"
    fi
else
    echo "❌ Backend NO está corriendo en puerto 8082"
    echo ""
    echo "💡 Para iniciar el backend ejecuta:"
    echo "   bash start-backend.sh"
fi

echo ""
