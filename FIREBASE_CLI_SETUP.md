# Firebase CLI Setup Guide

## Step 1: Install Firebase CLI

```bash
chmod +x setup-firebase-cli.sh && ./setup-firebase-cli.sh
```

## Step 2: Login to Firebase

```bash
firebase login
```

This will open a browser window for you to authenticate with your Google account.

## Step 3: Initialize Firebase Project (First Time Only)

```bash
firebase init
```

- Select "Firestore" using arrow keys and spacebar
- Choose "Use an existing project"
- Select your Firebase project from the list
- Accept default file names (firestore.rules and firestore.indexes.json)

## Step 4: Deploy Firestore Rules

```bash
chmod +x deploy-firestore-now.sh && ./deploy-firestore-now.sh
```

Or manually:

```bash
firebase deploy --only firestore:rules
```

## Troubleshooting

### If you get "command not found: firebase"

The Firebase CLI might not be in your PATH. Try:

```bash
npx firebase-tools login
npx firebase-tools deploy --only firestore:rules
```

### If you get permission errors

Make sure you're logged in with an account that has access to your Firebase project:

```bash
firebase logout
firebase login
```

### To check your current project

```bash
firebase projects:list
firebase use
```

### To switch projects

```bash
firebase use <project-id>
```

## Quick Commands

```bash
# Install CLI
chmod +x setup-firebase-cli.sh && ./setup-firebase-cli.sh

# Login
firebase login

# Deploy rules
chmod +x deploy-firestore-now.sh && ./deploy-firestore-now.sh
```
