# 🚀 Deploy Firestore Rules - Simple Instructions

## Quick Start (3 Steps)

### Step 1: Login to Firebase
```bash
bunx firebase-tools login
```
This will open your browser. Login with your Google account that has access to your Firebase project.

### Step 2: Initialize Firebase (First Time Only)
```bash
bunx firebase-tools init
```
- Select: **Firestore** (use spacebar to select, enter to confirm)
- Choose: **Use an existing project**
- Select your project from the list
- For rules file: Press Enter (use existing firestore.rules)
- For indexes file: Press Enter (use existing firestore.indexes.json)

### Step 3: Deploy Rules
```bash
chmod +x deploy-rules-bunx.sh && ./deploy-rules-bunx.sh
```

---

## Alternative: Manual Deployment

If the script doesn't work, deploy manually:

```bash
# Login (if not already logged in)
bunx firebase-tools login

# Deploy rules and indexes
bunx firebase-tools deploy --only firestore
```

---

## Troubleshooting

### Error: "No project active"
Run: `bunx firebase-tools use --add`
Then select your project.

### Error: "Permission denied"
Make sure you're logged in with the correct Google account:
```bash
bunx firebase-tools logout
bunx firebase-tools login
```

### Error: "Rules compilation failed"
Check your firestore.rules file for syntax errors.

---

## What Gets Deployed

1. **firestore.rules** - Security rules for your database
2. **firestore.indexes.json** - Database indexes for queries

---

## After Deployment

1. Go to Firebase Console → Firestore Database → Rules
2. Verify the rules are updated
3. Test your app to ensure authentication works
4. Check that unauthorized users cannot access data

---

## Important Notes

- ⚠️ The current rules require authentication
- ⚠️ Users can only access their own data
- ⚠️ Make sure your app implements sign in/sign up
- ⚠️ Test thoroughly before going to production
