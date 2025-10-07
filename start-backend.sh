#!/bin/bash

echo "🚀 Starting Kompa2Go Backend..."
echo "📍 Port: 8082"
echo "📍 Host: 0.0.0.0"

# Set environment
export NODE_ENV=development
export PORT=8082
export HOST=0.0.0.0

# Run backend with Node.js to avoid Bun's React Native parsing issues
exec node --loader tsx backend/server.ts
