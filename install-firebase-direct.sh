#!/bin/bash

echo "🔧 Installing Firebase CLI using curl..."

# Install Firebase CLI using standalone binary
curl -sL https://firebase.tools | bash

echo ""
echo "✅ Firebase CLI installed!"
echo ""
echo "📋 Next steps:"
echo "1. Run: firebase login"
echo "2. Run: firebase use --add (select your project)"
echo "3. Run: firebase deploy --only firestore:rules"
