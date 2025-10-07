#!/bin/bash

echo "🚀 Starting Kompa2Go Backend..."
echo "📍 Port: 8082"
echo "📍 Host: 0.0.0.0"

# Use Bun to run the backend
export PORT=8082
export HOST=0.0.0.0
bun run backend/server.ts
