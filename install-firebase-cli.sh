#!/bin/bash

echo "🔧 Installing Firebase CLI..."

# Try method 1: Using npm with --force flag
echo "📦 Attempting npm install with --force..."
npm install -g firebase-tools@latest --force

# Check if installation was successful
if command -v firebase &> /dev/null; then
    echo "✅ Firebase CLI installed successfully!"
    firebase --version
    echo ""
    echo "📋 Next steps:"
    echo "1. Run: firebase login"
    echo "2. Run: firebase use --add (select your project)"
    echo "3. Run: firebase deploy --only firestore:rules"
    exit 0
fi

# Try method 2: Using standalone binary
echo "📦 Attempting standalone binary installation..."
curl -sL https://firebase.tools | bash

# Check again
if command -v firebase &> /dev/null; then
    echo "✅ Firebase CLI installed successfully!"
    firebase --version
    echo ""
    echo "📋 Next steps:"
    echo "1. Run: firebase login"
    echo "2. Run: firebase use --add (select your project)"
    echo "3. Run: firebase deploy --only firestore:rules"
    exit 0
fi

echo "❌ Firebase CLI installation failed."
echo "Please try manually:"
echo "  curl -sL https://firebase.tools | bash"
exit 1
