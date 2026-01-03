#!/bin/bash
# Build Android APK Script (Bash version)
# This script builds a signed release APK for the IMH IMS Android app

set -e

echo "=== IMH IMS Android APK Build ==="
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "Error: package.json not found. Please run this script from the android-app-template directory."
    exit 1
fi

# Check if Android directory exists
if [ ! -d "android" ]; then
    echo "Error: android directory not found."
    echo "This appears to be a template. You need to initialize a React Native project first."
    echo ""
    echo "To initialize:"
    echo "  npx react-native@latest init IMHIMSAndroid --template react-native-template-typescript"
    echo "  Then copy the src/ directory from this template to the new project."
    exit 1
fi

# Check for keystore
KEYSTORE_PATH="android/app/imh-ims-key.keystore"
if [ ! -f "$KEYSTORE_PATH" ]; then
    echo "Keystore not found. Generating new keystore..."
    echo ""
    echo "You will be prompted for keystore information:"
    echo "  - Keystore password (remember this!)"
    echo "  - Key alias: imh-ims"
    echo "  - Key password (can be same as keystore password)"
    echo "  - Your name and organization details"
    echo ""
    
    read -sp "Enter keystore password: " KEYSTORE_PASS
    echo ""
    read -sp "Enter key password (or press Enter to use same as keystore): " KEY_PASS
    echo ""
    
    if [ -z "$KEY_PASS" ]; then
        KEY_PASS="$KEYSTORE_PASS"
    fi
    
    read -p "Enter your name (for certificate): " NAME
    read -p "Enter organization name: " ORG
    read -p "Enter organizational unit (optional): " ORG_UNIT
    read -p "Enter city: " CITY
    read -p "Enter state: " STATE
    read -p "Enter country code (2 letters, e.g., US): " COUNTRY
    
    DN="CN=$NAME, OU=$ORG_UNIT, O=$ORG, L=$CITY, ST=$STATE, C=$COUNTRY"
    
    echo ""
    echo "Generating keystore..."
    
    keytool -genkeypair -v -storetype PKCS12 \
        -keystore "$KEYSTORE_PATH" \
        -alias imh-ims \
        -keyalg RSA \
        -keysize 2048 \
        -validity 10000 \
        -storepass "$KEYSTORE_PASS" \
        -keypass "$KEY_PASS" \
        -dname "$DN"
    
    if [ $? -ne 0 ]; then
        echo "Error: Failed to generate keystore"
        exit 1
    fi
    
    echo "Keystore generated successfully!"
    echo ""
    echo "IMPORTANT: Save the keystore password securely!"
    echo "You will need it for future builds and updates."
    echo ""
fi

# Read version from package.json
VERSION=$(node -p "require('./package.json').version")
echo "Building version: $VERSION"
echo ""

# Build APK
echo "Building release APK..."
cd android

# Clean previous builds
echo "Cleaning previous builds..."
./gradlew clean

# Build release APK
echo "Assembling release APK..."
./gradlew assembleRelease

if [ $? -ne 0 ]; then
    echo "Error: Build failed"
    cd ..
    exit 1
fi

# Find the APK
APK_PATH="app/build/outputs/apk/release/app-release.apk"
if [ -f "$APK_PATH" ]; then
    APK_FULL_PATH=$(realpath "$APK_PATH")
    APK_SIZE=$(du -h "$APK_FULL_PATH" | cut -f1)
    
    echo ""
    echo "=== Build Successful ==="
    echo "APK Location: $APK_FULL_PATH"
    echo "APK Size: $APK_SIZE"
    echo ""
    echo "Next steps:"
    echo "  1. Test the APK on a device"
    echo "  2. Upload to server using: ./upload-apk.sh"
else
    echo "Error: APK not found at expected location"
    cd ..
    exit 1
fi

cd ..
