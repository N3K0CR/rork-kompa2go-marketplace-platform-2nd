#!/bin/bash

echo "🔧 Installing Firebase CLI..."
echo ""

# Install Firebase CLI globally using npm
npm install -g firebase-tools

echo ""
echo "✅ Firebase CLI installed successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Run: firebase login"
echo "2. Run: firebase init (select your project)"
echo "3. Run: firebase deploy --only firestore:rules"
echo ""
echo "Or use the quick deploy script:"
echo "chmod +x deploy-firestore-now.sh && ./deploy-firestore-now.sh"
