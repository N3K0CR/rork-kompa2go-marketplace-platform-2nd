# 🚀 Deploy Firestore Rules - Quick Guide

## ⚡ Quick Start (3 Steps)

### Step 1: Make script executable
```bash
chmod +x deploy-firestore-rules.sh
```

### Step 2: Run deployment script
```bash
./deploy-firestore-rules.sh
```

### Step 3: Confirm deployment
When prompted, type `yes` and press Enter.

---

## 📋 What This Does

✅ Removes the insecure `allow read, write: if true;` rule  
✅ Enables authentication-based security rules  
✅ Requires Firebase Authentication for all Firestore operations  
✅ Protects user data with proper access controls  

---

## 🔧 Alternative: Manual Deployment

If the script doesn't work, deploy manually:

```bash
firebase deploy --only firestore:rules
```

---

## ⚠️ Important Notes

1. **All users must be authenticated** after deployment
2. **Existing unauthenticated requests will fail** with permission errors
3. **Test authentication flow** before deploying to production
4. **Backup your data** before deploying (optional but recommended)

---

## 🧪 Testing After Deployment

1. **Sign in to the app** with valid credentials
2. **Try to access Firestore data** - should work ✅
3. **Sign out**
4. **Try to access Firestore data** - should fail with permission error ❌

---

## 🆘 Troubleshooting

### Error: "Firebase CLI not found"
```bash
npm install -g firebase-tools
```

### Error: "Not logged in"
```bash
firebase login
```

### Error: "Permission denied"
- Make sure you have owner/editor access to the Firebase project
- Check Firebase Console → Project Settings → Users and permissions

### Need to rollback?
If something goes wrong, you can restore the old rules from Firebase Console:
1. Go to Firebase Console → Firestore Database → Rules
2. Click "History" tab
3. Select previous version
4. Click "Restore"

---

## 📞 Need Help?

Check the full documentation: `AUTHENTICATION_SETUP.md`

---

**Ready to deploy? Run the script now! 🚀**
