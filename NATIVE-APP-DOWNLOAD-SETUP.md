# Native App Download System - Setup Complete

## Overview

The native app download system has been implemented, allowing users to download and install the Android APK directly from the website.

## What Was Implemented

### 1. Android App Configuration
- ✅ Updated `app.json` with version metadata
- ✅ Updated `src/config/api.ts` with production API URL
- ✅ Created build scripts (`build-apk.ps1`, `build-apk.sh`)
- ✅ Created upload script (`upload-apk.ps1`)
- ✅ Created example `build.gradle` configuration

### 2. Frontend Download Page
- ✅ Created `frontend/src/pages/Download/DownloadPage.tsx`
- ✅ Created `frontend/src/pages/Download/DownloadPage.css`
- ✅ Added `/download` route in `App.tsx` (public, no auth required)
- ✅ Added download link in navigation (TopNav)

### 3. Backend API Endpoints
- ✅ Created `backend/api/views/app.py` with:
  - `AppDownloadView` - Serves APK file
  - `AppVersionView` - Returns version information
- ✅ Added routes in `backend/api/urls.py`:
  - `/api/app/download/` - Download APK
  - `/api/app/version/` - Get version info

### 4. Nginx Configuration
- ✅ Updated `imh-ims-nginx.conf` with APK MIME type handling
- ✅ Configured proper headers for APK downloads

## How to Use

### Building the APK

1. **Navigate to android-app-template**:
   ```bash
   cd android-app-template
   ```

2. **Build the APK** (Windows):
   ```powershell
   .\build-apk.ps1
   ```

   Or (Linux/Mac):
   ```bash
   chmod +x build-apk.sh
   ./build-apk.sh
   ```

3. **Upload to Server** (Windows):
   ```powershell
   .\upload-apk.ps1
   ```

### Accessing the Download Page

- **URL**: `http://3.234.249.243/download`
- **Public Access**: No login required
- **Features**:
  - Version information display
  - Direct download button
  - QR code for mobile access
  - Installation instructions
  - Mobile/desktop optimized

## File Locations

### APK Storage
- **Server Path**: `~/SPS-IMH/backend/media/apps/imh-ims.apk`
- **URL**: `http://3.234.249.243/media/apps/imh-ims.apk`
- **API Endpoint**: `http://3.234.249.243/api/app/download/`

### Configuration Files
- **Build Scripts**: `android-app-template/build-apk.*`
- **Upload Script**: `android-app-template/upload-apk.ps1`
- **Example Gradle**: `android-app-template/android-app-build.gradle.example`

## Next Steps

1. **Build Your First APK**:
   ```powershell
   cd android-app-template
   .\build-apk.ps1
   ```

2. **Upload to Server**:
   ```powershell
   .\upload-apk.ps1
   ```

3. **Test Download Page**:
   - Visit `http://3.234.249.243/download`
   - Test on mobile device
   - Verify APK downloads correctly

4. **Test Installation**:
   - Download APK on Android device
   - Install and test all features
   - Verify QR scanner works

## Important Notes

- **Keystore Security**: Never commit the keystore file to git
- **Version Updates**: Update version in `package.json` and `app.json` before each build
- **APK Updates**: Users will need to uninstall old version before installing new one (unless you implement update mechanism)
- **Unknown Sources**: Users may need to enable "Install from unknown sources" on Android

## Troubleshooting

### APK Not Found Error
- Make sure you've uploaded the APK: `.\upload-apk.ps1`
- Check file exists: `ls ~/SPS-IMH/backend/media/apps/imh-ims.apk`

### Build Fails
- Check Android SDK is installed
- Verify JDK 11+ is installed
- Check `android` directory exists (project must be initialized)

### Download Page Shows Error
- Check backend is running
- Verify API endpoints are accessible
- Check browser console for errors

## Documentation

- **Build Guide**: `android-app-template/APK-BUILD-GUIDE.md`
- **Quick Start**: `android-app-template/README.md`
