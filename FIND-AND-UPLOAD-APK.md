# Find and Upload APK File

## Quick Upload Script

I've created a script to help you upload the APK. Here are your options:

### Option 1: If you know the full path

```powershell
cd F:\SPS-IMH
.\upload-existing-apk.ps1 -APKPath "FULL_PATH_TO_YOUR_APK.apk"
```

### Option 2: Navigate to your Android project directory

If your Android project is in a directory like:
- `F:\AndroidProjects\inventoryManagementofHospitality\`
- `F:\IMH\android-app\`
- Or any other location

1. Navigate to that directory:
   ```powershell
   cd "F:\YourAndroidProjectDirectory"
   ```

2. Run the upload script:
   ```powershell
   F:\SPS-IMH\upload-existing-apk.ps1
   ```

The script will automatically find `app\build\outputs\apk\debug\app-debug.apk` in the current directory.

### Option 3: Manual upload

If you prefer to upload manually:

```powershell
# Replace with your actual APK path
$APK_PATH = "F:\YourPath\app\build\outputs\apk\debug\app-debug.apk"

scp -i "F:\SPS-IMH\SSH INFO\IMH.pem" `
  "$APK_PATH" `
  ubuntu@3.234.249.243:~/SPS-IMH/backend/media/apps/imh-ims.apk
```

## What happens after upload

Once uploaded, the APK will be available at:
- **Download URL**: `http://3.234.249.243/api/app/download/`
- **Download Page**: `http://3.234.249.243/download`

## Need help finding the file?

If you're not sure where your Android project is:
1. Open Android Studio
2. Look at recent projects
3. Or search your computer for "app-debug.apk"
