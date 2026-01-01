# 500 Error Debugging Guide

## ✅ Fixed Issues

1. **Missing Token Migrations** - Applied authtoken migrations (this was likely causing 500 errors for authentication endpoints)

## Common Causes of 500 Errors

### 1. Missing Database Migrations ✅ FIXED
- **Issue:** `authtoken` migrations were not applied
- **Fixed:** Ran `python manage.py migrate`
- **Status:** ✅ Resolved

### 2. Database Connection Issues
- Check if `db.sqlite3` exists and is accessible
- Verify database permissions

### 3. Missing Dependencies
- Check if all required packages are installed
- Run: `pip install -r requirements.txt`

### 4. Code Errors
- Check backend console/logs for Python exceptions
- Look for traceback in server output

### 5. Missing Environment Variables
- Check if any required settings are missing

## How to Debug 500 Errors

### Step 1: Check Backend Console
The backend server console will show the actual error. Look for:
- Python traceback
- Exception messages
- Error details

### Step 2: Test Specific Endpoints

```powershell
# Test CSRF endpoint (used by Android app)
Invoke-WebRequest -Uri "http://localhost:8000/api/auth/csrf/" -UseBasicParsing

# Test login endpoint
$body = @{username="test"; password="test"} | ConvertTo-Json
Invoke-WebRequest -Uri "http://localhost:8000/api/auth/login/" -Method POST -Body $body -ContentType "application/json" -UseBasicParsing
```

### Step 3: Check Django Logs
If logging is configured, check:
- `backend/logs/django.log` (if exists)
- Console output from `runserver`

### Step 4: Enable Detailed Error Messages
With `DEBUG = True` in settings.py, Django should show detailed error pages.

## Next Steps

1. **Restart the backend server** after migrations:
   ```powershell
   cd backend
   .\venv\Scripts\python.exe manage.py runserver 0.0.0.0:8000
   ```

2. **Test the connection again** from Android app

3. **Check backend console** for specific error messages

4. **Share the error details** from backend console if issue persists

## Most Likely Cause

The missing `authtoken` migrations were likely causing the 500 error when the Android app tried to:
- Get CSRF token (`/api/auth/csrf/`)
- Login (`/api/auth/login/`)
- Use token authentication

These migrations have now been applied, so the error should be resolved.

