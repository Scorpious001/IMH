# IMH IMS Android App - React Native

This is the React Native Android version of the IMH Inventory Management System.

## Prerequisites

- Node.js 18+
- React Native CLI: `npm install -g react-native-cli`
- Android Studio
- JDK 11+
- Android SDK

## Quick Start

### Step 1: Install Dependencies
```bash
cd android-app-template
npm install
```

### Step 2: Start Metro Bundler (REQUIRED)

**Option A: Using PowerShell Script (Windows)**
```powershell
.\start-metro.ps1
```

**Option B: Using npm**
```bash
npm start
```

**Keep Metro bundler running!** You need it in a separate terminal window.

### Step 3: Run the App

**In a NEW terminal window:**

**Option A: Using PowerShell Script (Windows)**
```powershell
cd android-app-template
.\start-android.ps1
```

**Option B: Using npm**
```bash
cd android-app-template
npm run android
```

## Troubleshooting

### Error: "Unable to load script"
- **Solution**: Make sure Metro bundler is running! Run `npm start` in a separate terminal first.

### Error: "Metro bundler not found"
- **Solution**: Run `npm install` first to install dependencies.

### App can't connect to Metro (Physical Device)
- Make sure your device and computer are on the same Wi-Fi network
- Shake device → Dev Settings → Debug server host → Enter your computer's IP address (e.g., `192.168.1.100:8081`)
- Or run: `npx react-native start --host 0.0.0.0`

### For Android Emulator
- The emulator should connect automatically to `localhost:8081`
- If not, check that the emulator is running and try restarting Metro

## Configuration

### Configure API URL
Edit `src/config/api.ts`:
```typescript
export const API_BASE_URL = __DEV__ 
  ? 'http://10.0.2.2:8000/api' // Android emulator localhost
  : 'https://your-aws-backend.com/api'; // Production
```

For physical devices, use your computer's IP address:
```typescript
export const API_BASE_URL = 'http://192.168.1.100:8000/api';
```

## Building Release APK

```bash
cd android
./gradlew assembleRelease
# APK: android/app/build/outputs/apk/release/app-release.apk
```

## Project Structure

```
IMHIMSAndroid/
├── android/          # Android native code
├── src/
│   ├── components/   # React Native components
│   ├── screens/      # Screen components
│   ├── services/     # API services (shared with web)
│   ├── types/        # TypeScript types
│   ├── navigation/   # Navigation setup
│   ├── config/       # Configuration
│   └── utils/        # Utilities
└── App.tsx
```

