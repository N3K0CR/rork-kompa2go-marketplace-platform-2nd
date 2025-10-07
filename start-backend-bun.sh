#!/bin/bash

echo "🚀 Iniciando backend con Bun..."
echo "📍 Puerto: ${PORT:-8082}"
echo "📍 Host: ${HOST:-0.0.0.0}"

# Usar bun directamente con server.ts
PORT=${PORT:-8082} HOST=${HOST:-0.0.0.0} bun run backend/server.ts
