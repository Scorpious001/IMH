# Android Emulator Setup Guide

## Current Setup Status

You're using **Android Device Emulator from Android Studio** on the same PC as the backend system. This is the ideal development setup!

## ✅ What's Already Configured

### 1. Android App Configuration
- ✅ Android app is configured to use `http://10.0.2.2:8000/api` in development mode
- ✅ `10.0.2.2` is the special IP that Android emulator uses to access host machine's localhost
- ✅ This is already set in `android-app-template/src/config/api.ts`

### 2. Backend Configuration
- ✅ Backend `ALLOWED_HOSTS` includes `10.0.2.2` 
- ✅ CORS is configured to allow all origins (`CORS_ALLOW_ALL_ORIGINS = True`)
- ✅ Token authentication is enabled for mobile apps
- ✅ Backend is running on port 8000

## ⚠️ Important: Backend Binding

**Current Issue:** The backend startup script uses `runserver` without specifying the host. By default, Django binds to `127.0.0.1` only, which should work with `10.0.2.2`, but it's better to explicitly bind to `0.0.0.0` to ensure accessibility.

### Solution: Update Backend Startup

The backend should be started with:
```bash
python manage.py runserver 0.0.0.0:8000
```

This binds to all network interfaces, making it accessible from:
- `localhost:8000` (web browser)
- `127.0.0.1:8000` (local connections)
- `10.0.2.2:8000` (Android emulator)

## Testing the Connection

### 1. Verify Backend is Running
```powershell
netstat -ano | findstr ":8000" | findstr "LISTENING"
# Should show: TCP    0.0.0.0:8000           0.0.0.0:0              LISTENING
```

### 2. Test from Host Machine (Simulating Emulator)
```powershell
# Test if backend is accessible via 10.0.2.2 (from host's perspective)
Invoke-WebRequest -Uri "http://localhost:8000/api/" -UseBasicParsing
# Should return 403 Forbidden (expected - means server is responding)
```

### 3. Test from Android Emulator
In your Android app or via ADB:
```bash
# From Android Studio terminal or ADB shell
adb shell
curl http://10.0.2.2:8000/api/
```

Or test directly in your React Native app - it should connect automatically.

## Common Issues & Solutions

### Issue 1: "Connection Refused" or "Network Error"

**Possible Causes:**
1. Backend not running
2. Backend bound to wrong interface
3. Firewall blocking port 8000

**Solutions:**
```powershell
# 1. Ensure backend is running
cd backend
.\venv\Scripts\python.exe manage.py runserver 0.0.0.0:8000

# 2. Check Windows Firewall
# Allow Python through firewall if prompted
```

### Issue 2: "CORS Error" or "403 Forbidden"

**Solutions:**
- CORS is already configured (`CORS_ALLOW_ALL_ORIGINS = True`)
- 403 Forbidden is expected for unauthenticated requests
- Make sure you're logging in through the app

### Issue 3: "Timeout" or "Connection Timeout"

**Solutions:**
- Check backend is actually running: `netstat -ano | findstr ":8000"`
- Verify backend logs show it's listening on `0.0.0.0:8000`
- Try restarting the backend server

## Quick Start Checklist

- [ ] Backend is running on port 8000
- [ ] Backend is bound to `0.0.0.0:8000` (all interfaces)
- [ ] Android emulator is running
- [ ] Android app is in development mode (`__DEV__ = true`)
- [ ] Android app config uses `http://10.0.2.2:8000/api`
- [ ] Test connection from Android app

## Recommended Backend Startup Command

For Android emulator development, always start backend with:
```powershell
cd backend
.\venv\Scripts\python.exe manage.py runserver 0.0.0.0:8000
```

This ensures the backend is accessible from:
- Web browser: `http://localhost:8000`
- Android emulator: `http://10.0.2.2:8000`
- Network devices: `http://<your-ip>:8000`

## Next Steps

1. **Update backend startup script** to use `0.0.0.0:8000`
2. **Restart backend** with the new binding
3. **Test connection** from Android emulator
4. **Check Android app logs** for any connection errors

The web frontend port issues (30002) **do not affect** Android emulator users - they connect directly to the backend API.

