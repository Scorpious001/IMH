# Android App Connection Guide

## Important: Android App vs Web Frontend

The Android app has **different connection requirements** than the web frontend. Here's what applies and what doesn't:

## ✅ What DOES Apply to Android App

### 1. Backend Server Must Be Running
- **YES** - Android app needs the backend on port 8000
- The backend fixes (path corrections, CORS settings) **DO apply**
- Backend must be accessible from the Android device/emulator

### 2. Backend Configuration
- **YES** - All backend CORS and ALLOWED_HOSTS settings apply
- Current settings already support Android:
  - `ALLOWED_HOSTS = ['localhost', '127.0.0.1', '10.0.2.2', '*']`
  - `CORS_ALLOW_ALL_ORIGINS = True` (development)
  - `TokenAuthentication` is enabled for mobile apps

### 3. Backend Port
- **YES** - Backend must be on port 8000
- Android app is configured to connect to `http://10.0.2.2:8000/api` (emulator)
- Or your computer's IP address for physical devices

## ❌ What DOES NOT Apply to Android App

### 1. Frontend Port Issues
- **NO** - The frontend React app port (3000/3001/30002) is **irrelevant** for Android
- Android app is a separate React Native app, not the web frontend
- Android app doesn't use the web frontend at all

### 2. Web Frontend Scripts
- **NO** - Scripts like `start-frontend.ps1` don't affect Android app
- Android app runs independently via React Native/Metro bundler

### 3. Browser CORS Issues
- **NO** - Android app doesn't use a browser, so browser CORS is different
- Uses native HTTP requests (axios in React Native)

## Android App Connection Details

### Development Mode (Android Emulator)

**Configuration:** `android-app-template/src/config/api.ts`
```typescript
export const API_BASE_URL = __DEV__ 
  ? 'http://10.0.2.2:8000/api' // Android emulator localhost
  : 'https://your-aws-backend-url.com/api'; // Production
```

**What this means:**
- `10.0.2.2` is a special IP that Android emulator uses to access the host machine's localhost
- This is **automatically configured** - no changes needed
- Backend must be running on your computer at `localhost:8000`

### Physical Android Device

**For physical devices, you need:**

1. **Find your computer's local IP address:**
   ```powershell
   ipconfig
   # Look for IPv4 Address (e.g., 192.168.1.100)
   ```

2. **Update Android app config** (temporarily for testing):
   ```typescript
   export const API_BASE_URL = 'http://192.168.1.100:8000/api';
   ```

3. **Ensure backend is accessible:**
   - Backend must bind to `0.0.0.0:8000` (not just localhost)
   - Check firewall allows port 8000
   - Both devices must be on same network

4. **Update backend ALLOWED_HOSTS** (if needed):
   ```python
   ALLOWED_HOSTS = ['localhost', '127.0.0.1', '10.0.2.2', '192.168.1.100', '*']
   ```

### Production Mode

**For production (AWS deployment):**
- Android app connects to your AWS backend URL
- Update `API_BASE_URL` to your production URL
- Backend must have proper CORS and ALLOWED_HOSTS configured

## Current Status for Android Users

### ✅ Working Configuration

1. **Backend Settings:**
   - ✅ `ALLOWED_HOSTS` includes `10.0.2.2` (Android emulator)
   - ✅ `CORS_ALLOW_ALL_ORIGINS = True` (allows Android app)
   - ✅ Token authentication enabled
   - ✅ Backend running on port 8000

2. **Android App Configuration:**
   - ✅ Configured for `http://10.0.2.2:8000/api` in development
   - ✅ Uses Token authentication (not session-based)
   - ✅ 30-second timeout configured

### ⚠️ Potential Issues for Android

1. **Backend Not Accessible:**
   - If backend isn't running → Android app can't connect
   - **Solution:** Start backend with `cd backend && .\venv\Scripts\python.exe manage.py runserver`

2. **Physical Device Connection:**
   - Need computer's IP address, not localhost
   - Both devices on same WiFi network
   - Firewall may block port 8000

3. **Network Security (Android 9+):**
   - Android blocks cleartext HTTP by default
   - Need to configure `android/app/src/main/AndroidManifest.xml`:
   ```xml
   <application
       android:usesCleartextTraffic="true"
       ...>
   ```

## Testing Android Connection

### From Android Emulator:
```bash
# 1. Ensure backend is running
cd backend
.\venv\Scripts\python.exe manage.py runserver

# 2. Test from emulator (in Android app or via adb)
adb shell
curl http://10.0.2.2:8000/api/
```

### From Physical Device:
```bash
# 1. Find your computer's IP
ipconfig  # Windows
ifconfig  # Mac/Linux

# 2. Update Android app config with your IP
# 3. Ensure both devices on same network
# 4. Test connection
```

## Summary

**For Android App Users:**
- ✅ Backend fixes **DO apply** (must be running correctly)
- ❌ Frontend port issues **DO NOT apply** (separate app)
- ✅ CORS settings **DO apply** (already configured correctly)
- ✅ Backend must be accessible on port 8000
- ⚠️ Physical devices need computer's IP address, not localhost

**The main requirement:** Backend server must be running and accessible. The web frontend issues (port 30002) don't affect Android app users at all.

