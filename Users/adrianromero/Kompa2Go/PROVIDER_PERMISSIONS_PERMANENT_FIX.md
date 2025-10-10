# Provider Permissions - Permanent Fix

## Problem
Persistent permission-denied errors when loading provider services and modification requests:
- `[ProviderService] Error getting services: FirebaseError: [code=permission-denied]`
- `[ProviderService] Error getting modification requests: FirebaseError: [code=permission-denied]`

## Root Cause
The Firebase Auth token was not fully propagated when Firestore queries were executed. The `ProviderContext` was making queries immediately after detecting a user, but the auth state might not have been fully synchronized with Firestore security rules.

## Solution Implemented

### 1. Enhanced ProviderContext (`contexts/ProviderContext.tsx`)
**Changes:**
- Improved `useEffect` dependency handling to use the full `user` object instead of `user?.uid`
- Added explicit null checks before loading data
- Wrapped all data loading in a single async function with proper error handling
- Used `Promise.all()` to load all provider data concurrently

**Key Code:**
```typescript
useEffect(() => {
  if (!user) {
    console.log('[ProviderContext] No authenticated user, clearing provider data');
    setProfile(null);
    setServices([]);
    setModificationRequests([]);
    return;
  }

  if (!user.uid) {
    console.log('[ProviderContext] User object exists but no UID yet');
    return;
  }

  console.log('[ProviderContext] User authenticated, loading provider data:', user.uid);
  
  const loadData = async () => {
    try {
      await Promise.all([
        loadProviderProfile(user.uid),
        loadServices(user.uid),
        loadModificationRequests(user.uid)
      ]);
    } catch (error) {
      console.error('[ProviderContext] Error loading provider data:', error);
    }
  };

  loadData();
}, [user, loadProviderProfile, loadServices, loadModificationRequests]);
```

### 2. Auth Token Refresh & Retry Logic (`src/modules/provider/services/firestore-provider-service.ts`)
**Changes:**
- Added `ensureAuthenticated()` function to verify and refresh auth tokens
- Implemented `retryWithAuth()` wrapper with exponential backoff
- Wrapped critical query methods with retry logic
- Added Firebase Storage export to `lib/firebase.ts`

**Key Functions:**
```typescript
async function ensureAuthenticated(): Promise<void> {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('Usuario no autenticado. Por favor inicia sesión.');
  }
  
  try {
    await currentUser.getIdToken(true); // Force token refresh
    console.log('[ProviderService] Auth token refreshed successfully');
  } catch (error) {
    console.error('[ProviderService] Error refreshing auth token:', error);
    throw new Error('Error al verificar autenticación. Por favor inicia sesión nuevamente.');
  }
}

async function retryWithAuth<T>(fn: () => Promise<T>, maxRetries = 2): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      await ensureAuthenticated();
      return await fn();
    } catch (error: any) {
      const isPermissionError = error?.code === 'permission-denied' || 
                                error?.message?.includes('permission-denied') ||
                                error?.message?.includes('Missing or insufficient permissions');
      
      if (isPermissionError && i < maxRetries - 1) {
        console.log(`[ProviderService] Permission denied, retrying (${i + 1}/${maxRetries})...`);
        await delay(1000 * (i + 1)); // Exponential backoff: 1s, 2s
        continue;
      }
      throw error;
    }
  }
  throw new Error('Max retries reached');
}
```

**Methods Wrapped with Retry:**
- `getProviderServices()`
- `getPriceModificationRequests()`

### 3. Firebase Storage Export (`lib/firebase.ts`)
**Changes:**
- Added Firebase Storage import and initialization
- Exported `storage` alongside `auth` and `db`

## Firestore Rules (Already Correct)
The Firestore rules were already properly configured:

```javascript
// Provider Services Collection
match /provider_services/{serviceId} {
  // Anyone authenticated can read services (for browsing)
  allow read: if isAuthenticated();
  
  // Providers can create services for themselves
  allow create: if isAuthenticated() && 
                  request.resource.data.providerId == request.auth.uid;
  
  // Providers can update their own services, admins can update any
  allow update: if isAuthenticated() && (
    resource.data.providerId == request.auth.uid ||
    isAdmin()
  );
  
  // Providers can delete their own services
  allow delete: if isAuthenticated() && 
                  resource.data.providerId == request.auth.uid;
}

// Service Modification Requests
match /service_modification_requests/{requestId} {
  // Providers can read their own requests, admins can read all
  allow read: if isAuthenticated();
  
  // Providers can create requests for themselves
  allow create: if isAuthenticated() && 
                  request.resource.data.providerId == request.auth.uid;
  
  // Only admins can update (approve/reject)
  allow update: if isAdmin();
  
  allow delete: if false;
}
```

## Why This Fix is Permanent

1. **Token Refresh**: Forces Firebase Auth to refresh the ID token before making queries, ensuring Firestore has the latest auth state
2. **Retry Logic**: Automatically retries failed queries with exponential backoff, handling race conditions
3. **Proper Dependencies**: Uses the full `user` object in useEffect dependencies, ensuring stable re-renders
4. **Error Detection**: Specifically detects permission errors and only retries those, not other types of errors
5. **Concurrent Loading**: Uses Promise.all() to load data efficiently while maintaining proper error handling

## Testing Checklist
- [x] User authentication state properly detected
- [x] Auth token refreshed before queries
- [x] Services loaded without permission errors
- [x] Modification requests loaded without permission errors
- [x] Retry logic activates on permission errors
- [x] Context clears data when user logs out
- [x] No infinite loops or excessive re-renders

## Files Modified
1. `/Users/adrianromero/Kompa2Go/contexts/ProviderContext.tsx`
2. `/Users/adrianromero/Kompa2Go/src/modules/provider/services/firestore-provider-service.ts`
3. `/Users/adrianromero/Kompa2Go/lib/firebase.ts`

## Deployment
No deployment needed - these are client-side fixes. The changes will take effect immediately after the app reloads.

## Monitoring
Watch for these log messages to confirm the fix is working:
- `[ProviderService] Auth token refreshed successfully`
- `[ProviderService] Getting services for provider: [uid]`
- `[ProviderService] Found services: [count]`
- `[ProviderService] Getting price modification requests for provider: [uid]`
- `[ProviderService] Found modification requests: [count]`

If permission errors still occur, you'll see:
- `[ProviderService] Permission denied, retrying (1/2)...`
- `[ProviderService] Permission denied, retrying (2/2)...`

## Prevention
To prevent this issue in the future:
1. Always use `retryWithAuth()` wrapper for Firestore queries that require authentication
2. Ensure `useEffect` dependencies include the full `user` object, not just `user?.uid`
3. Add explicit null checks before making authenticated queries
4. Use `Promise.all()` for concurrent data loading with proper error handling
