#!/bin/bash

echo "🚀 Starting Kompa2Go Backend..."
echo "📍 Port: 8082"
echo "📍 Host: 0.0.0.0"

# Ejecutar el servidor backend excluyendo React Native
exec bun --external react-native --external react-native-web --external expo run backend/server.ts
