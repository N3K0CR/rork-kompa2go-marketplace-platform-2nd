#!/bin/bash

echo "🔐 Firebase Authentication (CI Mode)"
echo ""
echo "This will generate a token for authentication."
echo "Follow the instructions below:"
echo ""

npx firebase-tools login:ci

echo ""
echo "✅ Copy the token above and save it securely."
echo ""
echo "To use the token:"
echo "export FIREBASE_TOKEN='your-token-here'"
echo ""
echo "Then deploy with:"
echo "npx firebase-tools deploy --only firestore:rules --token \$FIREBASE_TOKEN"
