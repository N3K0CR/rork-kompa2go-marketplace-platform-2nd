#!/bin/bash

# ============================================================================
# Firestore Rules Deployment Script
# ============================================================================
# This script deploys the production Firestore security rules to Firebase
# ============================================================================

echo "🔐 Deploying Firestore Security Rules..."
echo ""

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI is not installed."
    echo "📦 Install it with: npm install -g firebase-tools"
    exit 1
fi

# Check if user is logged in
if ! firebase projects:list &> /dev/null; then
    echo "❌ You are not logged in to Firebase."
    echo "🔑 Please run: firebase login"
    exit 1
fi

# Display current project
echo "📋 Current Firebase project:"
firebase use

echo ""
echo "⚠️  WARNING: This will deploy PRODUCTION security rules."
echo "⚠️  All Firestore access will require authentication."
echo ""
read -p "Do you want to continue? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "❌ Deployment cancelled."
    exit 0
fi

echo ""
echo "🚀 Deploying Firestore rules..."

# Deploy only Firestore rules
firebase deploy --only firestore:rules

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Firestore rules deployed successfully!"
    echo ""
    echo "📝 Summary of changes:"
    echo "   - Removed: allow read, write: if true;"
    echo "   - Enabled: Authentication-based security rules"
    echo "   - All operations now require Firebase Authentication"
    echo ""
    echo "🔒 Your Firestore database is now secured!"
else
    echo ""
    echo "❌ Deployment failed. Please check the error messages above."
    exit 1
fi
