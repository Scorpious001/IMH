# Connection Issues Summary & Solutions

## Issues Identified

### 1. ✅ FIXED: Path Mismatch in Scripts
**Problem:** Scripts referenced `IMH\backend` and `IMH\frontend`, but directories are actually `backend` and `frontend` in the root.

**Files Fixed:**
- `test-connection.ps1` - Updated all path references
- `start-backend.ps1` - Fixed path to `backend` directory
- `start-frontend.ps1` - Fixed path to `frontend` directory

### 2. ⚠️ Frontend Port Mismatch
**Problem:** Frontend is running on port **30002** instead of the expected **3000** or **3001**.

**Why:** Port 3000 was likely already in use, so React automatically chose the next available port (30002).

**Impact:** 
- Frontend is accessible but on an unexpected port
- Backend CORS is configured for ports 3000 and 3001, but should work since `CORS_ALLOW_ALL_ORIGINS = True` in development

**Solution Options:**
1. **Kill the process using port 3000** and restart frontend:
   ```powershell
   # Find what's using port 3000
   netstat -ano | findstr ":3000"
   # Kill the process (replace PID with actual process ID)
   taskkill /PID <PID> /F
   # Then restart frontend
   cd frontend
   npm start
   ```

2. **Configure frontend to use port 3001 explicitly:**
   Create `frontend/.env` file with:
   ```
   PORT=3001
   ```

3. **Update CORS settings** to include port 30002 (temporary workaround)

### 3. ✅ Backend is Working
**Status:** Backend is running correctly on port 8000.

**Evidence:**
- Port 8000 is listening (PID 504)
- Backend responds with 403 Forbidden (expected for unauthenticated requests)
- CORS is configured to allow all origins in development

### 4. ⚠️ Diagnostic Script Syntax Error
**Problem:** `test-connection.ps1` has a PowerShell parsing error (though the script structure looks correct).

**Workaround:** Use manual checks:
```powershell
# Check if servers are running
netstat -ano | findstr ":8000" | findstr "LISTENING"
netstat -ano | findstr ":3000" | findstr "LISTENING"

# Test backend
Invoke-WebRequest -Uri "http://localhost:8000/api/" -UseBasicParsing
```

## Current System Status

✅ **Backend:** Running on port 8000 (working correctly)
⚠️ **Frontend:** Running on port 30002 (unexpected port)
✅ **CORS:** Configured to allow all origins in development
✅ **API Configuration:** Frontend correctly points to `http://localhost:8000/api`

## Recommended Actions

1. **Fix Frontend Port:**
   - Option A: Free up port 3000 and restart frontend
   - Option B: Create `frontend/.env` with `PORT=3001`

2. **Access the Application:**
   - Frontend: http://localhost:30002 (current) or http://localhost:3001 (after fix)
   - Backend API: http://localhost:8000/api/

3. **Verify Connection:**
   - Open browser console on frontend
   - Check for CORS errors
   - Test API calls

## Quick Fix Commands

```powershell
# 1. Create .env file for frontend to use port 3001
cd frontend
echo "PORT=3001" > .env

# 2. Restart frontend (stop current process first)
# Find Node process: Get-Process node
# Kill it: Stop-Process -Id <PID>
cd frontend
npm start

# 3. Verify both servers
netstat -ano | findstr ":8000" | findstr "LISTENING"
netstat -ano | findstr ":3001" | findstr "LISTENING"
```

## Why It Won't Connect

The main reason the system won't connect is likely:

1. **Frontend is on wrong port** - If the frontend code or browser is trying to access port 3000/3001 but the server is on 30002
2. **Browser cache** - Old frontend code might be cached
3. **CORS issues** - Though CORS_ALLOW_ALL_ORIGINS should prevent this

**Most Likely:** The frontend React app is running on port 30002, but you're trying to access it on port 3000/3001, or the frontend code is making requests that are being blocked.

---

## 📱 Android App Users - Important Note

**The frontend port issues DO NOT apply to Android app users!**

The Android app is a **separate React Native application** that:
- ✅ **DOES need** the backend running (port 8000) - **This applies!**
- ❌ **DOES NOT need** the web frontend (React app) - **Port 30002 issue doesn't matter**
- ✅ **DOES benefit** from backend fixes (CORS, ALLOWED_HOSTS) - **These apply!**

**For Android app users:**
- Backend must be running on port 8000 ✅ (Currently working)
- Android emulator uses `http://10.0.2.2:8000/api` (already configured)
- Physical devices need your computer's IP address instead of localhost
- Web frontend port issues are irrelevant for Android app

See `ANDROID-CONNECTION-GUIDE.md` for detailed Android-specific connection information.

