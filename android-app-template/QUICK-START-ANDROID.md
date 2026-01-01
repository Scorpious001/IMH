# Quick Start Guide - Android App

## Fix: "Unable to load script" Error

This error means **Metro bundler is not running**. Follow these steps:

---

## Step 1: Start Metro Bundler (REQUIRED)

Open **PowerShell Window 1** and run:

```powershell
cd "F:\SPS-IMH\android-app-template"
npm start
```

**Look for:** 
```
Metro waiting on exp://192.168.x.x:8081
```

**Keep this window open!** Metro must be running for the app to work.

---

## Step 2: Run the Android App

Open **PowerShell Window 2** and run:

```powershell
cd "F:\SPS-IMH\android-app-template"
npm run android
```

Or use the script:
```powershell
.\start-android.ps1
```

---

## Troubleshooting

### Metro won't start
- Make sure you're in the `android-app-template` directory
- Run `npm install` first if you haven't already
- Check that Node.js 18+ is installed: `node --version`

### App still shows "Unable to load script"
1. **Check Metro is running** - You should see Metro output in Window 1
2. **For Physical Devices:**
   - Shake your device
   - Tap "Dev Settings"
   - Tap "Debug server host & port for device"
   - Enter: `YOUR_COMPUTER_IP:8081` (e.g., `192.168.1.100:8081`)
   - Find your IP: Run `ipconfig` in PowerShell, look for IPv4 Address
3. **For Emulator:**
   - Should work automatically
   - Try restarting the emulator
   - Try restarting Metro: Press `r` in Metro window to reload

### Clear cache and restart
```powershell
# Stop Metro (Ctrl+C), then:
npm start -- --reset-cache
```

---

## What You Should See

**Metro Window (Window 1):**
```
Metro waiting on exp://192.168.x.x:8081
```

**Android App:**
- App should load and show "IMH IMS" screen
- No red error screen

If you see errors, check both windows for error messages!

