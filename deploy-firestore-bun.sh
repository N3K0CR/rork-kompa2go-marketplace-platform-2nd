#!/bin/bash

echo "🚀 Deploying Firestore Rules with Bun..."
echo ""

if [ ! -f "firebase-service-account.json" ]; then
    echo "❌ firebase-service-account.json not found!"
    exit 1
fi

if [ ! -f "firestore.rules" ]; then
    echo "❌ firestore.rules not found!"
    exit 1
fi

export GOOGLE_APPLICATION_CREDENTIALS="./firebase-service-account.json"

echo "📦 Installing firebase-tools with bun..."
bun add -d firebase-tools

echo ""
echo "🔧 Deploying Firestore rules..."
bunx firebase-tools deploy --only firestore:rules --project kompa2go

echo ""
echo "✅ Deployment complete!"
