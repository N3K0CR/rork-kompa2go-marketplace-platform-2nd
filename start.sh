#!/bin/bash

echo "🚀 Iniciando Kompa2Go (Frontend + Backend)"
echo "=========================================="

# Colores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Puertos
BACKEND_PORT=8082
FRONTEND_PORT=8081

# 1. Matar procesos existentes
echo -e "${YELLOW}📦 Limpiando procesos existentes...${NC}"
lsof -ti:${BACKEND_PORT} | xargs kill -9 2>/dev/null || true
lsof -ti:${FRONTEND_PORT} | xargs kill -9 2>/dev/null || true
sleep 2

# 2. Iniciar backend en segundo plano
echo -e "${GREEN}🔧 Iniciando backend en puerto ${BACKEND_PORT}...${NC}"
node --import=tsx/esm backend/server.ts > backend.log 2>&1 &
BACKEND_PID=$!
echo "Backend PID: $BACKEND_PID"

# 3. Esperar a que el backend esté listo (máximo 30 segundos)
echo -e "${YELLOW}⏳ Esperando que el backend esté listo...${NC}"
MAX_ATTEMPTS=30
ATTEMPT=0

while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
  if curl -s http://localhost:${BACKEND_PORT}/api/ > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Backend listo!${NC}"
    break
  fi
  
  ATTEMPT=$((ATTEMPT + 1))
  echo -n "."
  sleep 1
  
  if [ $ATTEMPT -eq $MAX_ATTEMPTS ]; then
    echo -e "${RED}❌ Backend no respondió a tiempo${NC}"
    echo "Logs del backend:"
    cat backend.log
    kill $BACKEND_PID 2>/dev/null
    exit 1
  fi
done

# 4. Iniciar frontend
echo -e "${GREEN}🎨 Iniciando frontend...${NC}"
bunx rork start -p z5be445fq2fb0yuu32aht --tunnel &
FRONTEND_PID=$!

# 5. Handler de cleanup
cleanup() {
  echo -e "\n${YELLOW}🛑 Deteniendo servicios...${NC}"
  kill $BACKEND_PID 2>/dev/null
  kill $FRONTEND_PID 2>/dev/null
  lsof -ti:${BACKEND_PORT} | xargs kill -9 2>/dev/null || true
  lsof -ti:${FRONTEND_PORT} | xargs kill -9 2>/dev/null || true
  echo -e "${GREEN}👋 Servicios detenidos${NC}"
  exit 0
}

trap cleanup SIGINT SIGTERM

# 6. Mostrar información
echo ""
echo -e "${GREEN}=========================================="
echo -e "✅ Kompa2Go está corriendo"
echo -e "=========================================="
echo -e "📍 Backend:  http://localhost:${BACKEND_PORT}"
echo -e "📍 Frontend: http://localhost:${FRONTEND_PORT}"
echo -e "📍 tRPC:     http://localhost:${BACKEND_PORT}/api/trpc"
echo -e ""
echo -e "📋 Logs del backend: tail -f backend.log"
echo -e "🛑 Para detener: Ctrl+C"
echo -e "==========================================${NC}"

# 7. Esperar
wait $FRONTEND_PID
