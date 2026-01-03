# Build Android APK Script
# This script builds a signed release APK for the IMH IMS Android app

param(
    [switch]$SkipKeystore = $false
)

$ErrorActionPreference = "Stop"

Write-Host "=== IMH IMS Android APK Build ===" -ForegroundColor Cyan
Write-Host ""

# Check if we're in the right directory
if (-not (Test-Path "package.json")) {
    Write-Host "Error: package.json not found. Please run this script from the android-app-template directory." -ForegroundColor Red
    exit 1
}

# Check if Android directory exists
if (-not (Test-Path "android")) {
    Write-Host "Error: android directory not found." -ForegroundColor Red
    Write-Host "This appears to be a template. You need to initialize a React Native project first." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "To initialize:" -ForegroundColor Cyan
    Write-Host "  npx react-native@latest init IMHIMSAndroid --template react-native-template-typescript" -ForegroundColor White
    Write-Host "  Then copy the src/ directory from this template to the new project." -ForegroundColor White
    exit 1
}

# Check for keystore
$keystorePath = "android/app/imh-ims-key.keystore"
if (-not $SkipKeystore -and -not (Test-Path $keystorePath)) {
    Write-Host "Keystore not found. Generating new keystore..." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "You will be prompted for keystore information:" -ForegroundColor Cyan
    Write-Host "  - Keystore password (remember this!)" -ForegroundColor White
    Write-Host "  - Key alias: imh-ims" -ForegroundColor White
    Write-Host "  - Key password (can be same as keystore password)" -ForegroundColor White
    Write-Host "  - Your name and organization details" -ForegroundColor White
    Write-Host ""
    
    $keystorePassword = Read-Host "Enter keystore password" -AsSecureString
    $keystorePasswordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($keystorePassword))
    
    $keyPassword = Read-Host "Enter key password (or press Enter to use same as keystore)" -AsSecureString
    $keyPasswordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($keyPassword))
    
    if ([string]::IsNullOrWhiteSpace($keyPasswordPlain)) {
        $keyPasswordPlain = $keystorePasswordPlain
    }
    
    $name = Read-Host "Enter your name (for certificate)"
    $org = Read-Host "Enter organization name"
    $orgUnit = Read-Host "Enter organizational unit (optional)" 
    $city = Read-Host "Enter city"
    $state = Read-Host "Enter state"
    $country = Read-Host "Enter country code (2 letters, e.g., US)"
    
    $dname = "CN=$name, OU=$orgUnit, O=$org, L=$city, ST=$state, C=$country"
    
    Write-Host ""
    Write-Host "Generating keystore..." -ForegroundColor Yellow
    
    keytool -genkeypair -v -storetype PKCS12 -keystore $keystorePath -alias imh-ims -keyalg RSA -keysize 2048 -validity 10000 -storepass $keystorePasswordPlain -keypass $keyPasswordPlain -dname $dname
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Error: Failed to generate keystore" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "Keystore generated successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "IMPORTANT: Save the keystore password securely!" -ForegroundColor Yellow
    Write-Host "You will need it for future builds and updates." -ForegroundColor Yellow
    Write-Host ""
}

# Read version from package.json
$packageJson = Get-Content "package.json" | ConvertFrom-Json
$version = $packageJson.version
Write-Host "Building version: $version" -ForegroundColor Cyan
Write-Host ""

# Build APK
Write-Host "Building release APK..." -ForegroundColor Yellow
Push-Location android

try {
    # Clean previous builds
    Write-Host "Cleaning previous builds..." -ForegroundColor Gray
    ./gradlew clean
    
    # Build release APK
    Write-Host "Assembling release APK..." -ForegroundColor Yellow
    ./gradlew assembleRelease
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Error: Build failed" -ForegroundColor Red
        Pop-Location
        exit 1
    }
    
    # Find the APK
    $apkPath = "app/build/outputs/apk/release/app-release.apk"
    if (Test-Path $apkPath) {
        $apkFullPath = Resolve-Path $apkPath
        $apkSize = (Get-Item $apkFullPath).Length / 1MB
        
        Write-Host ""
        Write-Host "=== Build Successful ===" -ForegroundColor Green
        Write-Host "APK Location: $apkFullPath" -ForegroundColor Cyan
        Write-Host "APK Size: $([math]::Round($apkSize, 2)) MB" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "Next steps:" -ForegroundColor Yellow
        Write-Host "  1. Test the APK on a device" -ForegroundColor White
        Write-Host "  2. Upload to server using: .\upload-apk.ps1" -ForegroundColor White
    } else {
        Write-Host "Error: APK not found at expected location" -ForegroundColor Red
        Pop-Location
        exit 1
    }
} finally {
    Pop-Location
}
