#!/bin/bash

echo "🚀 Starting Kompa2Go Backend..."
echo "📍 Port: 8082"
echo "📍 Host: 0.0.0.0"

# Set environment
export NODE_ENV=development
export PORT=8082
export HOST=0.0.0.0

# Ejecutar el servidor backend con configuración específica
exec bun --tsconfig-override tsconfig.backend.json \
  --external react-native \
  --external react-native-web \
  --external expo \
  --external @react-native \
  --external @expo \
  run backend/server.ts
