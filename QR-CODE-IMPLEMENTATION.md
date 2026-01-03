# QR Code System Implementation

## Overview
This document describes the QR code generation and scanning system implemented for the IMH IMS application, with full mobile optimization for Apple and Samsung devices.

## Features Implemented

### Backend (Django)
1. **QR Code Generation Service** (`backend/imh_ims/services/qr_service.py`)
   - Uses industry-standard `qrcode[pil]` library
   - Generates QR codes with configurable size and error correction
   - Supports PNG image responses and base64 encoding
   - Error correction levels: L (7%), M (15% - default), Q (25%), H (30%)

2. **API Endpoints** (`backend/api/views/items.py`)
   - `GET /api/items/{id}/qr-code/` - Returns PNG image of QR code
   - `GET /api/items/{id}/qr-code-data/` - Returns JSON with base64-encoded QR code
   - `GET /api/items/lookup/{short_code}/` - Lookup item by QR code (for scanning)

### Frontend (React/TypeScript)
1. **QR Code Display Component** (`frontend/src/components/shared/QRCodeDisplay.tsx`)
   - Displays QR code using `qrcode.react` library
   - Download and print functionality
   - Mobile-optimized with touch-friendly buttons
   - Integrated into Item Detail Page

2. **QR Code Scanner Component** (`frontend/src/components/shared/QRScanner.tsx`)
   - Uses `html5-qrcode` library for web-based scanning
   - Camera access with mobile device optimization
   - Manual code entry fallback
   - Automatic item lookup and navigation

3. **Mobile Optimizations**
   - Viewport meta tags for proper mobile rendering
   - Touch-friendly button sizes (minimum 44px)
   - Responsive design for all screen sizes
   - iOS and Android specific optimizations
   - High DPI display support (Retina, etc.)
   - Prevents text size adjustment on iOS
   - Smooth scrolling with `-webkit-overflow-scrolling: touch`

### Android App (React Native)
1. **QR Scanner Component** (`android-app-template/src/components/QRScanner.tsx`)
   - Uses `react-native-qrcode-scanner` library
   - Native camera integration
   - Automatic item lookup
   - Error handling and user feedback

## Installation

### Backend
```bash
cd backend
pip install -r requirements.txt
# qrcode[pil] and Pillow are included
```

### Frontend
```bash
cd frontend
npm install
# qrcode.react and html5-qrcode are included
```

### Android App
```bash
cd android-app-template
npm install
# react-native-qrcode-scanner and react-native-camera are included
```

## Usage

### Generating QR Codes
1. Navigate to any item's detail page
2. Scroll to the "QR Code" section
3. QR code is automatically generated for the item's `short_code`
4. Click "Download QR Code" to save as PNG
5. Click "Print QR Code" to print

### Scanning QR Codes (Web)
1. Add QR scanner button to navigation (implementation needed)
2. Click scanner button to open camera
3. Point camera at QR code
4. Item is automatically looked up and displayed
5. Or manually enter item code in the input field

### Scanning QR Codes (Android App)
1. Open QR scanner in the app
2. Point camera at QR code
3. Item is automatically looked up
4. Navigate to item details

## Mobile Optimizations

### Viewport Settings
- `width=device-width, initial-scale=1, maximum-scale=5, user-scalable=yes, viewport-fit=cover`
- Prevents unwanted zooming on iOS
- Supports notch/notchless devices

### Touch Targets
- Minimum 44px height for all interactive elements (iOS recommendation)
- Larger padding on mobile devices
- Full-width buttons on small screens

### Performance
- Optimized QR code rendering
- Efficient camera access
- Proper cleanup on component unmount

### Browser Support
- iOS Safari (iPhone/iPad)
- Android Chrome
- Samsung Internet
- All modern mobile browsers

## API Endpoints

### Generate QR Code Image
```
GET /api/items/{id}/qr-code/?size=200&error_correction=M
```
Returns: PNG image

### Get QR Code Data
```
GET /api/items/{id}/qr-code-data/?size=200
```
Returns: JSON with base64-encoded QR code

### Lookup Item by Code
```
GET /api/items/lookup/{short_code}/
```
Returns: Item object

## QR Code Format
QR codes encode the item's `short_code` as plain text. This allows:
- Fast scanning
- Easy manual entry
- Simple integration
- Cross-platform compatibility

## Future Enhancements
- Bulk QR code generation for multiple items
- QR code printing templates
- Custom QR code styling
- QR code analytics (scan tracking)
- Offline QR code scanning support

## Troubleshooting

### Camera Not Working (Web)
- Ensure HTTPS or localhost (required for camera access)
- Check browser permissions
- Try manual code entry

### Camera Not Working (Android)
- Check AndroidManifest.xml for camera permissions
- Ensure app has camera permission granted
- Test on physical device (emulator may have issues)

### QR Code Not Scanning
- Ensure good lighting
- Hold device steady
- Check QR code is not damaged
- Verify item code exists in system
