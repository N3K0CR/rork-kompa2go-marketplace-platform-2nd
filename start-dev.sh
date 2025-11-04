#!/bin/bash

# Version simplificada para desarrollo rápido
# Solo inicia el backend y frontend sin verificaciones

echo "🚀 Quick Start - Kompa2Go"

# Matar procesos
lsof -ti:8082 | xargs kill -9 2>/dev/null || true
lsof -ti:8081 | xargs kill -9 2>/dev/null || true

# Iniciar backend
node --import=tsx/esm backend/server.ts &

# Esperar 3 segundos
sleep 3

# Iniciar frontend
bunx rork start -p z5be445fq2fb0yuu32aht --tunnel

wait
