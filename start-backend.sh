#!/bin/bash

echo "🚀 Starting Kompa2Go Backend..."
echo "📍 Port: 8082"
echo "📍 Host: 0.0.0.0"

# Excluir node_modules de React Native del procesamiento
export BUN_EXCLUDE_MODULES="react-native,react-native-web"

# Ejecutar el servidor backend
exec bun run --hot backend/server.ts
