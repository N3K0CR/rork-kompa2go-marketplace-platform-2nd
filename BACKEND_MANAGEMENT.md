# 🚀 Kompa2Go Backend Management Guide

## 📋 Quick Reference

### Backend Configuration
- **Port**: 8082
- **Host**: 0.0.0.0 (all interfaces)
- **Base URL**: http://localhost:8082/api
- **tRPC Endpoint**: http://localhost:8082/api/trpc
- **Health Check**: http://localhost:8082/api/health/db

### Environment Variables
```bash
EXPO_PUBLIC_RORK_API_BASE_URL=http://localhost:8082
PORT=8082
HOST=0.0.0.0
NODE_ENV=development
```

---

## 🎯 Common Commands

### Start Backend (Recommended)
```bash
node start-backend-reliable.js
```
This script will:
- ✅ Check if port 8082 is available
- ✅ Kill any existing process on that port
- ✅ Start the backend
- ✅ Verify it's healthy with automatic health checks
- ✅ Retry up to 3 times if it fails

### Check Backend Status
```bash
node check-backend-status.js
```
This will show:
- Port status and process ID
- Health of all endpoints
- Response data from each endpoint

### Start Backend (Simple)
```bash
node start-backend-simple-now.js
```
Basic startup without health checks.

### Start Backend (Development)
```bash
node --loader tsx backend/server.ts
```
Direct startup for debugging.

---

## 🔍 Troubleshooting

### Problem: Port 8082 is already in use

**Solution 1: Use the reliable script**
```bash
node start-backend-reliable.js
```
It will automatically kill the existing process.

**Solution 2: Manual kill (Linux/Mac)**
```bash
lsof -ti:8082 | xargs kill -9
```

**Solution 3: Manual kill (Windows)**
```bash
netstat -ano | findstr :8082
taskkill /F /PID <PID>
```

### Problem: Backend starts but doesn't respond

**Check 1: Verify it's running**
```bash
node check-backend-status.js
```

**Check 2: Test endpoints manually**
```bash
curl http://localhost:8082/api
curl http://localhost:8082/api/health/db
```

**Check 3: Check logs**
The backend logs will show any errors during startup.

### Problem: "Failed to fetch" errors in the app

**Verify:**
1. Backend is running: `node check-backend-status.js`
2. Environment variable is correct in `.env.local`:
   ```
   EXPO_PUBLIC_RORK_API_BASE_URL=http://localhost:8082
   ```
3. Restart the Expo app after changing env variables

---

## 📊 Backend Endpoints

### Health & Status
- `GET /api` - API root (returns `{ status: "ok", message: "API is running" }`)
- `GET /api/health/db` - Database health check
- `GET /api/security/stats` - Security monitoring (requires admin token in production)

### tRPC Routes
All tRPC routes are available at `/api/trpc/*`

#### Example Routes:
- `example.hi` - Test endpoint
- `registration.*` - Registration services
- `geocoding.*` - Geocoding services
- `kommuteWallet.*` - Wallet management
- `payments.*` - Payment processing
- `commute.*` - Commute/trip management

---

## 🛠️ Backend Architecture

```
backend/
├── hono.ts              # Main Hono app configuration
├── server.ts            # Server startup
├── middleware/
│   └── security.ts      # Security middleware (rate limiting, headers)
├── config/
│   └── security.ts      # Security configuration
└── trpc/
    ├── app-router.ts    # Main tRPC router
    ├── create-context.ts # tRPC context creation
    └── routes/          # Individual route modules
        ├── example/
        ├── registration/
        ├── geocoding/
        ├── payments/
        ├── commute/
        └── kommute-wallet/
```

---

## 🔐 Security Features

The backend includes:
- ✅ Rate limiting (100 requests per minute per IP)
- ✅ Security headers (HSTS, CSP, etc.)
- ✅ CORS configuration
- ✅ DDoS protection
- ✅ Request blocking for abusive IPs

---

## 📝 Development Workflow

### 1. Start Backend
```bash
node start-backend-reliable.js
```

### 2. Verify It's Running
```bash
node check-backend-status.js
```

### 3. Start Expo App
```bash
npm start
# or
npm run start-web
```

### 4. Monitor Backend
Watch the backend terminal for logs and errors.

### 5. Test Endpoints
Use the app or test directly:
```bash
curl http://localhost:8082/api/trpc/example.hi
```

---

## 🚨 Common Issues & Solutions

### Issue: "signal is aborted without reason"
**Cause**: Network request cancelled before completion
**Solution**: Check that backend is running and responding

### Issue: "Failed to fetch"
**Cause**: Backend not running or wrong URL
**Solution**: 
1. Check backend status: `node check-backend-status.js`
2. Verify `EXPO_PUBLIC_RORK_API_BASE_URL` in `.env.local`
3. Restart Expo app

### Issue: "Permission denied" errors
**Cause**: Firestore security rules
**Solution**: Check Firestore rules and ensure user is authenticated

### Issue: Backend crashes on startup
**Cause**: Port conflict or missing dependencies
**Solution**:
1. Kill process on port 8082
2. Check all dependencies are installed
3. Check environment variables

---

## 📞 Quick Help

If backend issues persist:

1. **Check Status**: `node check-backend-status.js`
2. **Restart Backend**: `node start-backend-reliable.js`
3. **Check Logs**: Look at terminal output for errors
4. **Verify Config**: Check `.env.local` has correct values
5. **Test Manually**: `curl http://localhost:8082/api`

---

## 🎯 Best Practices

1. **Always use the reliable script** for starting the backend
2. **Check status before debugging** app issues
3. **Monitor logs** for errors and warnings
4. **Keep backend running** while developing
5. **Restart backend** after changing backend code
6. **Don't restart backend** for frontend-only changes

---

## 📚 Additional Resources

- Backend code: `/backend/`
- tRPC routes: `/backend/trpc/routes/`
- Environment config: `/.env.local`
- Startup scripts: `/start-backend-*.js`
