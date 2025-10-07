#!/bin/bash

echo "🚀 Deploying Firestore Rules with Bunx..."
echo ""

# Check if firebase.json exists
if [ ! -f "firebase.json" ]; then
    echo "❌ firebase.json not found. Creating it..."
    cat > firebase.json << 'EOF'
{
  "firestore": {
    "rules": "firestore.rules",
    "indexes": "firestore.indexes.json"
  }
}
EOF
    echo "✅ firebase.json created"
fi

# Check if user is logged in
echo "🔐 Checking Firebase authentication..."
if ! bunx firebase-tools projects:list &> /dev/null; then
    echo ""
    echo "❌ You are not logged in to Firebase."
    echo ""
    echo "Please run: bunx firebase-tools login"
    echo ""
    echo "After logging in, run this script again."
    exit 1
fi

# Deploy rules
echo ""
echo "📤 Deploying Firestore rules and indexes..."
echo ""
bunx firebase-tools deploy --only firestore

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Firestore rules and indexes deployed successfully!"
    echo ""
    echo "🔒 Your database is now secured with authentication."
    echo ""
    echo "📋 Next steps:"
    echo "1. Test authentication in your app"
    echo "2. Verify rules are working correctly"
else
    echo ""
    echo "❌ Deployment failed. Please check the error above."
    exit 1
fi
