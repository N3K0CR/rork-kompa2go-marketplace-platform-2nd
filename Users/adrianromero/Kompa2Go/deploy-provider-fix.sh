#!/bin/bash

echo "================================================"
echo "🔧 DEPLOYING PROVIDER PERMISSIONS FIX"
echo "================================================"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${YELLOW}This will deploy the fix for provider permission errors:${NC}"
echo "  - Provider services loading"
echo "  - Service modification requests loading"
echo ""

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo -e "${RED}❌ Firebase CLI not installed${NC}"
    echo ""
    echo "Install with:"
    echo "  npm install -g firebase-tools"
    echo ""
    exit 1
fi

echo -e "${GREEN}✅ Firebase CLI found${NC}"
echo ""

# Check authentication
echo "Checking Firebase authentication..."
if ! firebase projects:list &> /dev/null; then
    echo -e "${RED}❌ Not authenticated with Firebase${NC}"
    echo ""
    echo "Run first:"
    echo "  firebase login"
    echo ""
    exit 1
fi

echo -e "${GREEN}✅ Authenticated${NC}"
echo ""

# Show current project
echo "Current project:"
firebase use
echo ""

# Deploy rules
echo "Deploying Firestore rules..."
echo ""

if firebase deploy --only firestore:rules; then
    echo ""
    echo -e "${GREEN}================================================${NC}"
    echo -e "${GREEN}✅ PROVIDER PERMISSIONS FIX DEPLOYED${NC}"
    echo -e "${GREEN}================================================${NC}"
    echo ""
    echo "Changes applied:"
    echo "  ✅ provider_services read permissions updated"
    echo "  ✅ service_modification_requests read permissions updated"
    echo "  ✅ Write operations still protected by ownership"
    echo ""
    echo -e "${YELLOW}Next steps:${NC}"
    echo "  1. Test provider services page"
    echo "  2. Verify services load without errors"
    echo "  3. Test creating new services"
    echo "  4. Test price modification requests"
    echo ""
    echo "See PROVIDER_PERMISSIONS_FIX.md for full details"
    echo ""
else
    echo ""
    echo -e "${RED}================================================${NC}"
    echo -e "${RED}❌ DEPLOYMENT FAILED${NC}"
    echo -e "${RED}================================================${NC}"
    echo ""
    echo "Check the error above and try again"
    echo ""
    exit 1
fi

echo "================================================"
echo "🎉 DEPLOYMENT COMPLETE"
echo "================================================"
