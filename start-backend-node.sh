#!/bin/bash

echo "🚀 Starting Kompa2Go Backend with Node.js..."
echo "📍 Port: 8082"
echo "📍 Host: 0.0.0.0"

# Set environment
export NODE_ENV=development
export PORT=8082
export HOST=0.0.0.0

# Usar tsx para ejecutar TypeScript con Node.js
exec npx tsx backend/server.ts
