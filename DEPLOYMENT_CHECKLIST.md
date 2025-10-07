# 🚀 Firestore Rules Deployment Checklist

## Pre-Deployment Checklist

### 1. Verify Firebase CLI Installation
```bash
firebase --version
```
- [ ] Firebase CLI is installed (if not: `npm install -g firebase-tools`)

### 2. Login to Firebase
```bash
firebase login
```
- [ ] Successfully logged in to Firebase

### 3. Verify Project
```bash
firebase use
```
- [ ] Correct project is selected (should show: kompa2go)

### 4. Review Rules
```bash
cat firestore.rules
```
- [ ] Rules file exists
- [ ] No `allow read, write: if true;` in production rules
- [ ] Authentication checks are in place

## Deployment Steps

### Step 1: Make Script Executable
```bash
chmod +x deploy-firestore-rules.sh
```
- [ ] Script is executable

### Step 2: Run Deployment
```bash
./deploy-firestore-rules.sh
```
- [ ] Script runs without errors
- [ ] Confirmation prompt appears
- [ ] Type `yes` to confirm

### Step 3: Verify Deployment
- [ ] Deployment completes successfully
- [ ] Success message is displayed

## Post-Deployment Verification

### 1. Check Firebase Console
- [ ] Go to Firebase Console → Firestore Database → Rules
- [ ] Verify rules are updated
- [ ] Check "Published" timestamp is recent

### 2. Test Authentication
- [ ] Open app
- [ ] Sign in with test credentials
- [ ] Verify successful authentication

### 3. Test Firestore Access (Authenticated)
- [ ] Try to read data while signed in
- [ ] Should work ✅

### 4. Test Firestore Access (Unauthenticated)
- [ ] Sign out
- [ ] Try to read data while signed out
- [ ] Should fail with permission error ❌

## Rollback Plan (If Needed)

If something goes wrong:

### Option 1: Firebase Console
1. Go to Firebase Console → Firestore Database → Rules
2. Click "History" tab
3. Select previous version
4. Click "Restore"

### Option 2: Redeploy Old Rules
1. Restore old rules from backup
2. Run `firebase deploy --only firestore:rules`

## Common Issues & Solutions

### Issue: "Firebase CLI not found"
**Solution:**
```bash
npm install -g firebase-tools
```

### Issue: "Not logged in"
**Solution:**
```bash
firebase login
```

### Issue: "Permission denied"
**Solution:**
- Verify you have owner/editor access to Firebase project
- Check Firebase Console → Project Settings → Users and permissions

### Issue: "Rules deployment failed"
**Solution:**
- Check rules syntax in Firebase Console
- Verify no syntax errors in firestore.rules
- Try manual deployment: `firebase deploy --only firestore:rules`

## Test Credentials

Use these to test authentication after deployment:

**Client:**
```
Email: agostounonueve@gmail.com
Password: kompa2go_mikompa12025
```

**Provider:**
```
Email: agostounonueve@gmail.com
Password: kompa2go_2kompa12025
```

**Admin:**
```
Email: agostounonueve@gmail.com
Password: kompa2go_admin12025
```

## Success Indicators

✅ Deployment script completes without errors  
✅ Firebase Console shows updated rules  
✅ Authenticated users can access Firestore  
✅ Unauthenticated users get permission errors  
✅ App authentication flow works correctly  

## Final Verification

- [ ] All pre-deployment checks passed
- [ ] Deployment completed successfully
- [ ] Post-deployment verification passed
- [ ] Test credentials work
- [ ] App is functioning correctly

---

## 🎉 Ready to Deploy?

Run this command:
```bash
chmod +x deploy-firestore-rules.sh && ./deploy-firestore-rules.sh
```

---

**Need Help?** Check `AUTHENTICATION_SETUP.md` for detailed documentation.

**Last Updated**: 2025-10-07
