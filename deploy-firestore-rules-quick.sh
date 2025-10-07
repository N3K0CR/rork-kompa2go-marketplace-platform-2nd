#!/bin/bash

echo "🔥 Deploying Firestore Rules (Development Mode)..."
echo "⚠️  WARNING: These rules allow unauthenticated access!"
echo ""

# Deploy rules
firebase deploy --only firestore:rules

if [ $? -eq 0 ]; then
  echo ""
  echo "✅ Firestore rules deployed successfully!"
  echo ""
  echo "📝 Current rules allow ALL access (development mode)"
  echo "⚠️  Remember to enable authentication before production!"
else
  echo ""
  echo "❌ Failed to deploy Firestore rules"
  echo "Make sure you're logged in: firebase login"
fi
