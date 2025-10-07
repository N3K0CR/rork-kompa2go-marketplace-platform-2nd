#!/bin/bash

echo "🚀 Deploying Firestore Rules..."
echo ""

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI is not installed."
    echo "Run: chmod +x setup-firebase-cli.sh && ./setup-firebase-cli.sh"
    exit 1
fi

# Check if user is logged in
if ! firebase projects:list &> /dev/null; then
    echo "❌ You are not logged in to Firebase."
    echo "Run: firebase login"
    exit 1
fi

# Deploy rules
echo "📤 Deploying Firestore rules..."
firebase deploy --only firestore:rules

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Firestore rules deployed successfully!"
    echo ""
    echo "🔒 Your database is now secured with authentication."
else
    echo ""
    echo "❌ Deployment failed. Please check the error above."
    exit 1
fi
