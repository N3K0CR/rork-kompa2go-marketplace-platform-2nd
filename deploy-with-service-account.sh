#!/bin/bash

echo "🚀 Deploying Firestore Rules with Service Account..."
echo ""

if [ ! -f "firebase-service-account.json" ]; then
    echo "❌ firebase-service-account.json not found!"
    echo ""
    echo "Please follow these steps:"
    echo "1. Go to: https://console.firebase.google.com/"
    echo "2. Select your project"
    echo "3. Go to Project Settings > Service Accounts"
    echo "4. Click 'Generate New Private Key'"
    echo "5. Save the file as 'firebase-service-account.json' in this directory"
    exit 1
fi

export GOOGLE_APPLICATION_CREDENTIALS="./firebase-service-account.json"

echo "📦 Installing firebase-tools locally..."
npm install --no-save firebase-tools

echo ""
echo "🔧 Deploying Firestore rules..."
npx firebase-tools deploy --only firestore:rules --project kompa2go

echo ""
echo "✅ Deployment complete!"
