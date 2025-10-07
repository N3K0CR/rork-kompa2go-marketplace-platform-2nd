# Authentication System Setup

## Overview

The Kompa2Go app now uses **Firebase Authentication** for secure user authentication, integrated with production-ready Firestore security rules.

## What Was Implemented

### 1. Firebase Authentication Integration

#### Updated Files:
- **`app/auth.tsx`**: Sign in/sign up screen now uses Firebase Authentication
- **`contexts/AuthContext.tsx`**: Integrated with Firebase Auth for user management
- **`contexts/FirebaseAuthContext.tsx`**: Provides Firebase authentication methods

#### Features:
- ✅ Email/Password authentication
- ✅ User registration with display name
- ✅ Password reset via email
- ✅ Automatic session management
- ✅ Secure token handling

### 2. Production Firestore Security Rules

#### Updated Files:
- **`firestore.rules`**: Removed `allow read, write: if true;` and enabled authentication-based rules

#### Security Features:
- 🔒 All operations require authentication (`request.auth != null`)
- 🔒 User-specific data access (users can only access their own data)
- 🔒 Driver-specific operations (drivers can only update their own tracking)
- 🔒 Default deny-all rule for unmatched paths

### 3. Deployment Script

#### File:
- **`deploy-firestore-rules.sh`**: Automated script to deploy Firestore rules

## How to Use

### For Users (Sign In/Sign Up)

1. **Sign Up (New Users)**:
   ```
   - Open the app
   - Click "¿No tienes cuenta? Regístrate"
   - Fill in your information:
     * Email
     * Password (minimum 6 characters)
     * Name
     * Phone (optional)
     * Location (optional)
   - Click "Crear mi cuenta"
   ```

2. **Sign In (Existing Users)**:
   ```
   - Open the app
   - Enter your email and password
   - Click "Iniciar Sesión"
   ```

3. **Forgot Password**:
   ```
   - Click "¿Olvidó su contraseña?"
   - Enter your email
   - Check your email for reset link
   ```

### For Developers (Deploy Rules)

1. **Install Firebase CLI** (if not already installed):
   ```bash
   npm install -g firebase-tools
   ```

2. **Login to Firebase**:
   ```bash
   firebase login
   ```

3. **Deploy Firestore Rules**:
   ```bash
   chmod +x deploy-firestore-rules.sh
   ./deploy-firestore-rules.sh
   ```

   Or manually:
   ```bash
   firebase deploy --only firestore:rules
   ```

## Authentication Flow

```
┌─────────────────────────────────────────────────────────────┐
│                     User Opens App                          │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│              FirebaseAuthContext                            │
│  - Checks for existing Firebase session                     │
│  - Sets firebaseUser state                                  │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                  AuthContext                                │
│  - Loads stored user data from AsyncStorage                 │
│  - Syncs with Firebase auth state                           │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│              User Authenticated?                            │
│                                                             │
│  YES ──────────────────────────────────────────────► App   │
│                                                             │
│  NO ───────────────────────────────────────────► Auth Screen│
└─────────────────────────────────────────────────────────────┘
```

## Sign In/Sign Up Flow

```
┌─────────────────────────────────────────────────────────────┐
│                   User Enters Credentials                   │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│         Firebase Authentication (auth.tsx)                  │
│  - signInWithEmail() or signUpWithEmail()                   │
│  - Creates/validates Firebase user                          │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│              App Authentication (AuthContext)               │
│  - signIn() or signUp()                                     │
│  - Creates app user profile                                 │
│  - Stores in AsyncStorage                                   │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                  Navigate to App                            │
│  - router.replace('/(tabs)')                                │
└─────────────────────────────────────────────────────────────┘
```

## Firestore Security Rules

### Collections and Access Control

| Collection | Read | Create | Update | Delete |
|-----------|------|--------|--------|--------|
| `kommuters` | ✅ Auth | ✅ Auth | ✅ Auth | ✅ Auth |
| `driver_alerts` | ✅ Auth | ✅ Auth | ✅ Auth | ✅ Auth |
| `driver_tracking` | ✅ Auth | ✅ Owner | ✅ Owner | ❌ |
| `providers` | ✅ Auth | ✅ Auth | ✅ Auth | ✅ Auth |
| `appointments` | ✅ Auth | ✅ Auth | ✅ Auth | ❌ |
| `kommute_routes` | ✅ Owner | ✅ Owner | ✅ Owner | ✅ Owner |
| `kommute_trips` | ✅ Owner | ✅ Owner | ✅ Owner | ✅ Owner |

**Legend:**
- ✅ Auth: Requires authentication
- ✅ Owner: Requires authentication + ownership
- ❌: Not allowed

## Testing Authentication

### Test Accounts

You can create test accounts using the sign-up flow, or use these pre-configured credentials:

**Admin Users:**
```
Email: agostounonueve@gmail.com
Password: kompa2go_admin12025

Email: onlycr@yahoo.com
Password: kompa2go_admin22025
```

**Provider Users:**
```
Email: agostounonueve@gmail.com
Password: kompa2go_2kompa12025

Email: onlycr@yahoo.com
Password: kompa2go_2kompa22025
```

**Client Users:**
```
Email: agostounonueve@gmail.com
Password: kompa2go_mikompa12025

Email: onlycr@yahoo.com
Password: kompa2go_mikompa22025
```

### Testing Steps

1. **Test Sign Up**:
   ```
   - Use a new email address
   - Create account with valid password
   - Verify Firebase user is created
   - Verify app user profile is created
   ```

2. **Test Sign In**:
   ```
   - Use existing credentials
   - Verify successful authentication
   - Verify user data is loaded
   ```

3. **Test Firestore Access**:
   ```
   - Try to read/write data while authenticated ✅
   - Sign out
   - Try to read/write data while unauthenticated ❌
   ```

4. **Test Password Reset**:
   ```
   - Click "¿Olvidó su contraseña?"
   - Enter email
   - Check email for reset link
   - Reset password
   - Sign in with new password
   ```

## Troubleshooting

### Common Issues

1. **"Missing or insufficient permissions" error**:
   - **Cause**: Firestore rules not deployed or user not authenticated
   - **Solution**: Deploy rules with `./deploy-firestore-rules.sh` and ensure user is signed in

2. **"Debe autenticarse con Firebase primero" error**:
   - **Cause**: Trying to use app features before Firebase authentication
   - **Solution**: Ensure Firebase sign in completes before app sign in

3. **Password reset email not received**:
   - **Cause**: Email might be in spam or invalid email address
   - **Solution**: Check spam folder, verify email address is correct

4. **"auth/weak-password" error**:
   - **Cause**: Password is less than 6 characters
   - **Solution**: Use a password with at least 6 characters

## Security Best Practices

1. ✅ **Never commit Firebase credentials** to version control
2. ✅ **Use environment variables** for sensitive configuration
3. ✅ **Enable email verification** for production
4. ✅ **Implement rate limiting** for authentication attempts
5. ✅ **Use HTTPS** for all API calls
6. ✅ **Regularly review** Firestore security rules
7. ✅ **Monitor authentication logs** in Firebase Console

## Next Steps

1. **Enable Email Verification**:
   - Go to Firebase Console → Authentication → Templates
   - Customize email verification template
   - Enable email verification in sign-up flow

2. **Add Social Authentication**:
   - Google Sign-In
   - Facebook Login
   - Apple Sign-In

3. **Implement Multi-Factor Authentication (MFA)**:
   - SMS verification
   - Authenticator app support

4. **Add Role-Based Access Control (RBAC)**:
   - Custom claims for user roles
   - Admin-only operations
   - Provider-specific features

## Support

For issues or questions:
- Check Firebase Console for authentication logs
- Review Firestore rules in Firebase Console
- Check browser/app console for error messages
- Contact development team

---

**Last Updated**: 2025-10-07
**Version**: 1.0.0
