# Android APK Build Guide

This guide explains how to build and deploy the IMH IMS Android app APK.

## Prerequisites

1. **React Native Project Initialized**
   - If you haven't already, initialize a React Native project:
   ```bash
   npx react-native@latest init IMHIMSAndroid --template react-native-template-typescript
   ```
   - Copy the `src/` directory from this template to your new project

2. **Android Development Environment**
   - Android Studio installed
   - Android SDK configured
   - JDK 11+ installed
   - Environment variables set (ANDROID_HOME, JAVA_HOME)

3. **Keystore for Signing**
   - The build script will help you create one if it doesn't exist
   - **IMPORTANT**: Save your keystore password securely!

## Building the APK

### Option 1: Using PowerShell Script (Windows)

```powershell
cd android-app-template
.\build-apk.ps1
```

The script will:
1. Check for keystore (create if missing)
2. Build the release APK
3. Show you the APK location

### Option 2: Using Bash Script (Linux/Mac)

```bash
cd android-app-template
chmod +x build-apk.sh
./build-apk.sh
```

### Option 3: Manual Build

```bash
cd android-app-template/android
./gradlew assembleRelease
```

The APK will be at: `android/app/build/outputs/apk/release/app-release.apk`

## Configuring Signing

### First Time Setup

1. **Generate Keystore** (if not done automatically):
   ```bash
   keytool -genkeypair -v -storetype PKCS12 \
     -keystore android/app/imh-ims-key.keystore \
     -alias imh-ims \
     -keyalg RSA \
     -keysize 2048 \
     -validity 10000
   ```

2. **Configure build.gradle**:
   - Copy `android-app-build.gradle.example` to `android/app/build.gradle`
   - Update with your keystore information
   - Or use environment variables for passwords

### Using Environment Variables (Recommended)

Create `android/local.properties`:
```properties
KEYSTORE_PASSWORD=your-keystore-password
KEY_PASSWORD=your-key-password
```

Then update `build.gradle` to read from this file (see example file).

## Uploading APK to Server

### Using PowerShell Script (Windows)

```powershell
.\upload-apk.ps1
```

### Manual Upload

```bash
scp -i "path/to/key.pem" \
  android/app/build/outputs/apk/release/app-release.apk \
  ubuntu@3.234.249.243:~/SPS-IMH/backend/media/apps/imh-ims.apk
```

## Version Management

Before each build, update the version:

1. **Update package.json**:
   ```json
   {
     "version": "1.0.1"
   }
   ```

2. **Update app.json**:
   ```json
   {
     "version": "1.0.1",
     "buildNumber": "2"
   }
   ```

## Testing the APK

1. **Transfer to Device**:
   - Use ADB: `adb install app-release.apk`
   - Or copy to device and install manually

2. **Enable Unknown Sources** (if needed):
   - Settings → Security → Unknown Sources (enable)

3. **Install and Test**:
   - Install the APK
   - Test all features, especially QR scanning
   - Verify API connection

## Troubleshooting

### Build Fails: "Keystore not found"
- Run the build script which will create one automatically
- Or manually create using keytool command above

### Build Fails: "Signing config not found"
- Make sure `build.gradle` has signing configuration
- Check that keystore file exists at specified path

### APK Too Large
- Enable ProGuard/R8 minification in `build.gradle`
- Remove unused dependencies
- Use Android App Bundle (AAB) instead of APK

### Upload Fails: Permission Denied
- Check SSH key permissions: `chmod 400 key.pem`
- Verify server path exists: `~/SPS-IMH/backend/media/apps/`

## Security Notes

- **Never commit keystore to git**
- Store keystore password securely
- Use different keystores for development and production
- Keep backup of keystore (you'll need it for updates!)

## Next Steps

After building and uploading:
1. Visit `http://your-server/download` to see the download page
2. Test download on a mobile device
3. Verify installation works correctly
